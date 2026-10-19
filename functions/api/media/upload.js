/**
 * functions/api/media/upload.js
 * Cloudflare Pages Function untuk Mengunggah Rekaman Suara & Video Wawancara
 * langsung ke Google Drive 5 TB via Google Drive v3 REST API.
 *
 * Endpoint: POST /api/media/upload
 * Parameter (Query / Header):
 * - userId: ID Pengguna Firebase
 * - logbookId: ID Dokumen Logbook
 * - fileName: Nama berkas media asli
 * - mimeType: Tipe MIME berkas
 *
 * Body: Raw Binary Stream / ArrayBuffer (dikirim dari browser via XMLHttpRequest.send(file))
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Logbook-Id, X-File-Name',
      'Access-Control-Max-Age': '86400'
    }
  });
}

function detectMediaType(fileName, mimeType = '') {
  const mt = (mimeType || '').toLowerCase();
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (mt.startsWith('audio/') || ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'weba', 'flac'].includes(ext)) {
    return 'audio';
  }
  if (mt.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'].includes(ext)) {
    return 'video';
  }
  return 'audio';
}

async function getGoogleAccessToken(clientId, clientSecret, refreshToken) {
  const cleanClientId = String(clientId || '').trim().replace(/^["']|["']$/g, '');
  const cleanClientSecret = String(clientSecret || '').trim().replace(/^["']|["']$/g, '');
  const cleanRefreshToken = String(refreshToken || '').trim().replace(/^["']|["']$/g, '');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cleanClientId,
      client_secret: cleanClientSecret,
      refresh_token: cleanRefreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    const prefix = cleanRefreshToken ? `${cleanRefreshToken.substring(0, 10)}...${cleanRefreshToken.substring(cleanRefreshToken.length - 6)}` : 'empty';
    throw new Error(`Gagal memperbarui token Google Drive (Active Token: ${prefix}): ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function getOrCreateFolder(folderName, parentId, accessToken) {
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive&pageSize=1&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Buat folder baru jika belum ditemukan
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat folder Google Drive (${folderName}): ${errText}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Konfigurasi Kredensial Google Drive dari Environment Variables (dengan toleransi alias nama dan sanitasi)
  const rawClientId = (env && (env.GOOGLE_DRIVE_CLIENT_ID || env.DRIVE_CLIENT_ID || env.RIVE_CLIENT_ID)) || 
    (typeof process !== 'undefined' && process.env && (process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.DRIVE_CLIENT_ID || process.env.RIVE_CLIENT_ID)) || '';
  const rawClientSecret = (env && (env.GOOGLE_DRIVE_CLIENT_SECRET || env.DRIVE_CLIENT_SECRET || env.RIVE_CLIENT_SECRET)) || 
    (typeof process !== 'undefined' && process.env && (process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.DRIVE_CLIENT_SECRET || process.env.RIVE_CLIENT_SECRET)) || '';
  const rawRefreshToken = (env && (env.GOOGLE_DRIVE_REFRESH_TOKEN || env.DRIVE_REFRESH_TOKEN || env.RIVE_REFRESH_TOKEN)) || 
    (typeof process !== 'undefined' && process.env && (process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.DRIVE_REFRESH_TOKEN || process.env.RIVE_REFRESH_TOKEN)) || '';
  const rawParentFolderId = (env && (env.GOOGLE_DRIVE_PARENT_FOLDER_ID || env.DRIVE_PARENT_FOLDER_ID || env.RIVE_PARENT_FOLDER_ID)) || 
    (typeof process !== 'undefined' && process.env && (process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || process.env.DRIVE_PARENT_FOLDER_ID)) || null;

  const clientId = String(rawClientId).trim().replace(/^["']|["']$/g, '');
  const clientSecret = String(rawClientSecret).trim().replace(/^["']|["']$/g, '');
  const refreshToken = String(rawRefreshToken).trim().replace(/^["']|["']$/g, '');
  const parentFolderId = rawParentFolderId ? String(rawParentFolderId).trim().replace(/^["']|["']$/g, '') : null;
  const rootFolderName = 'Logbook_Penelitian_App';

  const missingKeys = [];
  if (!clientId) missingKeys.push('GOOGLE_DRIVE_CLIENT_ID');
  if (!clientSecret) missingKeys.push('GOOGLE_DRIVE_CLIENT_SECRET');
  if (!refreshToken) missingKeys.push('GOOGLE_DRIVE_REFRESH_TOKEN');

  if (missingKeys.length > 0) {
    return new Response(JSON.stringify({
      success: false,
      message: `Kredensial ${missingKeys.join(', ')} belum dikonfigurasi di Cloudflare Pages Environment Variables`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId') || request.headers.get('x-user-id');
    const queryLogbookId = url.searchParams.get('logbookId') || request.headers.get('x-logbook-id');
    const queryFileName = url.searchParams.get('fileName') || request.headers.get('x-file-name');
    const queryMimeType = url.searchParams.get('mimeType') || request.headers.get('content-type') || 'application/octet-stream';

    const contentTypeHeader = (request.headers.get('content-type') || '').toLowerCase();

    let userId = queryUserId;
    let logbookId = queryLogbookId;
    let fileName = decodeURIComponent(queryFileName || 'rekaman_wawancara');
    let mimeType = queryMimeType;
    let binaryData = null;

    if (contentTypeHeader.includes('application/json')) {
      const body = await request.json();
      userId = body.userId || queryUserId;
      logbookId = body.logbookId || queryLogbookId;
      fileName = decodeURIComponent(body.fileName || queryFileName || 'rekaman_wawancara');
      mimeType = body.mimeType || queryMimeType;
      const fileBase64 = body.fileBase64 || body.fileBuffer;
      if (fileBase64) {
        const binStr = atob(fileBase64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        binaryData = bytes.buffer;
      }
    } else {
      binaryData = await request.arrayBuffer();
    }

    if (!userId || !logbookId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'userId dan logbookId wajib disertakan pada query atau header'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!binaryData || binaryData.byteLength === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Berkas media yang diunggah kosong'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 1. Dapatkan Access Token Google OAuth
    const accessToken = await getGoogleAccessToken(clientId, clientSecret, refreshToken);

    // 2. Pastikan hierarki folder 3-tingkat: [Root] -> [User_{userId}] -> [Wawancara_{logbookId}]
    let rootId = parentFolderId;
    if (!rootId) {
      rootId = await getOrCreateFolder(rootFolderName, null, accessToken);
    }
    const userFolderId = await getOrCreateFolder(`User_${userId}`, rootId, accessToken);
    const interviewFolderId = await getOrCreateFolder(`Wawancara_${logbookId}`, userFolderId, accessToken);

    // 3. Persiapkan nama berkas unik
    const detectedType = detectMediaType(fileName, mimeType);
    const dotIdx = fileName.lastIndexOf('.');
    const ext = dotIdx !== -1 ? fileName.substring(dotIdx) : '';
    const baseName = dotIdx !== -1 ? fileName.substring(0, dotIdx) : fileName;
    const cleanBase = baseName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const uniqueDriveName = `${detectedType}_${logbookId}_${Date.now()}_${cleanBase}${ext}`;

    // 4. Inisiasi Google Drive Resumable Upload Session
    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType || 'application/octet-stream'
      },
      body: JSON.stringify({
        name: uniqueDriveName,
        parents: [interviewFolderId]
      })
    });

    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl) {
      const initErr = await initRes.text();
      throw new Error(`Gagal menginisiasi unggahan Google Drive: ${initErr}`);
    }

    // 5. Unggah biner berkas ke URL Resumable
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType || 'application/octet-stream'
      },
      body: binaryData
    });

    if (!uploadRes.ok) {
      const upErr = await uploadRes.text();
      throw new Error(`Gagal mengirim data biner ke Google Drive: ${upErr}`);
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;

    // 6. Atur izin baca publik untuk tautan akses media
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });
    } catch (permErr) {
      console.warn('Pemberian izin reader publik di-skip:', permErr.message);
    }

    // 7. Ambil metadata berkas akhir
    let metaData = {
      id: fileId,
      name: uniqueDriveName,
      size: binaryData.byteLength,
      mimeType: mimeType,
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`
    };

    try {
      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,webContentLink,mimeType,size&supportsAllDrives=true`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (metaRes.ok) {
        metaData = await metaRes.json();
      }
    } catch (metaErr) {
      console.warn('Pengambilan metadata detail di-skip:', metaErr.message);
    }

    const mediaMetadata = {
      file_id: fileId,
      file_name: fileName,
      drive_file_name: metaData.name || uniqueDriveName,
      file_type: detectedType,
      mime_type: metaData.mimeType || mimeType,
      size: parseInt(metaData.size || binaryData.byteLength, 10),
      web_view_link: metaData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      stream_url: `/api/media/stream?file_id=${fileId}`,
      logbook_id: logbookId,
      uploaded_at: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'Media wawancara berhasil disimpan ke penyimpanan cloud terenkripsi',
      data: mediaMetadata
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Galat fungsi unggah media:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Gagal mengunggah media ke penyimpanan cloud: ' + error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
