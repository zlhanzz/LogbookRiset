/**
 * driveService.js
 * Modul Layanan Backend Google Drive API dengan Service Account
 * untuk Pengelolaan Rekaman Suara & Video Wawancara Logbook Penelitian.
 *
 * Mendukung:
 * 1. Autentikasi Google Drive via Service Account (credentials.json).
 * 2. Pembuatan struktur folder berjenjang secara idempotent:
 *    [Folder Induk: Logbook_Penelitian_App] -> [User_[User_ID]] -> [Wawancara_[Logbook_ID]]
 * 3. Pengunggahan file media (audio/video) ke sub-folder wawancara yang tepat.
 * 4. Pengambilan file_id & webViewLink serta pengaturan izin akses baca.
 * 5. Penyimpanan metadata file ke dokumen Firestore (field array: wawancara_media).
 */

const fs = require('fs');
const path = require('path');

let googleapis = null;
try {
  googleapis = require('googleapis');
} catch (e) {
  // googleapis akan di-load saat getDriveClient() dipanggil
}

// Inisialisasi Firebase Admin jika tersedia di lingkungan backend
let admin = null;
let firestoreDb = null;
try {
  admin = require('firebase-admin');
  if (admin.apps && admin.apps.length > 0) {
    firestoreDb = admin.firestore();
  }
} catch (e) {
  // firebase-admin opsional jika dipanggil di runtime yang mengelola DB secara eksternal
}

class GoogleDriveMediaService {
  /**
   * @param {Object} options
   * @param {string} [options.credentialsPath] - Path ke berkas credentials.json Service Account
   * @param {Object} [options.credentials] - Objek kredensial mentah jika dibaca dari ENV
   * @param {string} [options.parentFolderId] - ID Folder Induk Google Drive (opsional, jika di-share)
   */
  constructor(options = {}) {
    this.clientId = options.clientId || process.env.GOOGLE_DRIVE_CLIENT_ID;
    this.clientSecret = options.clientSecret || process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    this.refreshToken = options.refreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    this.redirectUri = options.redirectUri || process.env.GOOGLE_DRIVE_REDIRECT_URI;
    this.credentialsPath = options.credentialsPath || process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(process.cwd(), 'credentials.json');
    this.parentFolderId = options.parentFolderId || process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || null;
    this.rootFolderName = 'Logbook_Penelitian_App';
    this.driveClient = null;
    this.authClient = null;
  }

  /**
   * Menginisialisasi Drive API Client dengan Service Account atau OAuth 2.0
   */
  async getDriveClient() {
    if (this.driveClient) return this.driveClient;

    if (!googleapis) {
      try {
        googleapis = require('googleapis');
      } catch (err) {
        throw new Error("Pustaka 'googleapis' belum terinstal. Silakan jalankan: npm install googleapis");
      }
    }
    const { google } = googleapis;

    // 1. Prioritaskan OAuth 2.0 Refresh Token (Kapasitas Google One Pribadi 5 TB)
    const oauthClientId = this.clientId || process.env.GOOGLE_DRIVE_CLIENT_ID;
    const oauthClientSecret = this.clientSecret || process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const oauthRefreshToken = this.refreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
      const oauth2Client = new google.auth.OAuth2(
        oauthClientId,
        oauthClientSecret,
        this.redirectUri || process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:8085/oauth2callback'
      );
      oauth2Client.setCredentials({
        refresh_token: oauthRefreshToken
      });
      this.authClient = oauth2Client;
      this.driveClient = google.drive({ version: 'v3', auth: this.authClient });
      return this.driveClient;
    }

    // 2. Fallback ke Service Account (Google Workspace / Shared Drives)
    let authConfig = {
      scopes: ['https://www.googleapis.com/auth/drive']
    };

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const parsedKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        authConfig.credentials = parsedKey;
      } catch (e) {
        console.warn('Gagal parse GOOGLE_SERVICE_ACCOUNT_JSON dari env:', e.message);
      }
    } else if (fs.existsSync(this.credentialsPath)) {
      authConfig.keyFile = this.credentialsPath;
    } else {
      throw new Error(`Kredensial Google Drive tidak ditemukan. Harap sediakan GOOGLE_DRIVE_REFRESH_TOKEN di .env (untuk Google One 5 TB) atau credentials.json (untuk Service Account).`);
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    this.authClient = await auth.getClient();
    this.driveClient = google.drive({ version: 'v3', auth: this.authClient });
    return this.driveClient;
  }

  /**
   * Memastikan folder ada di Google Drive (Idempotent).
   * Jika sudah ada berdasarkan nama dan parent, gunakan yang sudah ada.
   * Jika belum ada, buat baru.
   *
   * @param {string} folderName - Nama folder yang dicari/dibuat
   * @param {string|null} parentId - ID folder induk (null jika di root)
   * @returns {Promise<string>} Folder ID
   */
  async getOrCreateFolder(folderName, parentId = null) {
    const drive = await this.getDriveClient();

    let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const searchRes = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      return searchRes.data.files[0].id;
    }

    // Jika belum ada, buat folder baru
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    };

    const createRes = await drive.files.create({
      requestBody: folderMetadata,
      supportsAllDrives: true,
      fields: 'id, name'
    });

    return createRes.data.id;
  }

  /**
   * Memastikan struktur hierarki folder 3 tingkat:
   * [Logbook_Penelitian_App] -> [User_[User_ID]] -> [Wawancara_[Logbook_ID]]
   *
   * @param {string} userId - Firebase User ID
   * @param {string} logbookId - ID Dokumen Logbook Penelitian
   * @returns {Promise<string>} ID folder sesi wawancara tempat file diunggah
   */
  async ensureInterviewFolderHierarchy(userId, logbookId) {
    if (!userId) throw new Error('userId wajib diisi untuk membuat folder user');
    if (!logbookId) throw new Error('logbookId wajib diisi untuk membuat folder wawancara');

    // 1. Folder Induk Aplikasi
    let rootFolderId = this.parentFolderId;
    if (!rootFolderId) {
      rootFolderId = await this.getOrCreateFolder(this.rootFolderName, null);
    }

    // 2. Folder Khusus User: User_[User_ID]
    const userFolderName = `User_${userId}`;
    const userFolderId = await this.getOrCreateFolder(userFolderName, rootFolderId);

    // 3. Sub-Folder Sesi Wawancara: Wawancara_[Logbook_ID]
    const interviewFolderName = `Wawancara_${logbookId}`;
    const interviewFolderId = await this.getOrCreateFolder(interviewFolderName, userFolderId);

    return interviewFolderId;
  }

  /**
   * Menentukan jenis media (audio atau video) berdasarkan mime type atau ekstensi berkas
   *
   * @param {string} fileName
   * @param {string} mimeType
   * @returns {"audio"|"video"}
   */
  detectMediaType(fileName, mimeType = '') {
    const mt = (mimeType || '').toLowerCase();
    const ext = path.extname(fileName || '').toLowerCase();

    if (mt.startsWith('audio/') || ['.mp3', '.m4a', '.wav', '.aac', '.ogg', '.weba', '.flac'].includes(ext)) {
      return 'audio';
    }
    if (mt.startsWith('video/') || ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp'].includes(ext)) {
      return 'video';
    }

    // Default fallback
    return 'audio';
  }

  /**
   * Mengunggah file media wawancara ke Google Drive dan mengatur izin baca.
   *
   * @param {Object} params
   * @param {string} params.userId - Firebase User ID
   * @param {string} params.logbookId - ID Dokumen Logbook
   * @param {string} params.fileName - Nama file yang diunggah
   * @param {string} params.mimeType - Mime type file (misal: audio/mpeg, video/mp4)
   * @param {ReadableStream|Buffer|string} params.fileContent - Stream file, Buffer, atau file path lokal
   * @param {boolean} [params.makePublic=true] - Memberikan izin reader (anyone with link) agar webViewLink dapat dibuka
   * @returns {Promise<Object>} Metadata hasil unggahan
   */
  async uploadInterviewMedia({
    userId,
    logbookId,
    fileName,
    mimeType,
    fileContent,
    makePublic = true
  }) {
    const drive = await this.getDriveClient();

    // 1. Pastikan hierarki folder berjenjang tersedia
    const targetFolderId = await this.ensureInterviewFolderHierarchy(userId, logbookId);

    // 2. Siapkan Readable Stream
    let bodyStream;
    if (typeof fileContent === 'string' && fs.existsSync(fileContent)) {
      bodyStream = fs.createReadStream(fileContent);
    } else if (Buffer.isBuffer(fileContent)) {
      const { Readable } = require('stream');
      bodyStream = Readable.from(fileContent);
    } else {
      bodyStream = fileContent;
    }

    // 3. Unggah file ke target folder
    // 3. Unggah file ke target folder dengan nama unik & autentik
    const ext = path.extname(fileName) || '';
    const cleanBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const detectedType = this.detectMediaType(fileName, mimeType);
    const uniqueDriveName = `${detectedType}_${logbookId}_${Date.now()}_${cleanBase}${ext}`;

    const fileMetadata = {
      name: uniqueDriveName,
      parents: [targetFolderId]
    };

    const media = {
      mimeType: mimeType || 'application/octet-stream',
      body: bodyStream
    };

    const uploadRes = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      supportsAllDrives: true,
      fields: 'id, name, webViewLink, webContentLink, mimeType, size'
    });

    const fileId = uploadRes.data.id;
    let webViewLink = uploadRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

    // 4. Atur permission agar file bisa dilihat melalui webViewLink
    if (makePublic) {
      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      } catch (permErr) {
        console.warn('Pemberian izin reader publik ke file Drive gagal:', permErr.message);
      }
    }

    const mediaMetadata = {
      file_id: fileId,
      file_name: fileName,
      drive_file_name: uploadRes.data.name || uniqueDriveName,
      file_type: detectedType,
      mime_type: uploadRes.data.mimeType || mimeType,
      size: parseInt(uploadRes.data.size || 0, 10),
      web_view_link: webViewLink,
      stream_url: `/api/media/stream?file_id=${fileId}`,
      logbook_id: logbookId,
      uploaded_at: new Date().toISOString()
    };

    return mediaMetadata;
  }

  /**
   * Mengambil stream media langsung dari Google Drive v3 API
   * untuk diteruskan (piped) ke browser secara white-label.
   *
   * @param {string} fileId - ID Berkas Google Drive
   * @returns {Promise<{ stream: any, mimeType: string, size: number|null, name: string }>}
   */
  async getMediaStream(fileId) {
    if (!fileId) throw new Error('fileId wajib disertakan untuk streaming media');
    const drive = await this.getDriveClient();

    // 1. Ambil metadata berkas (MIME type & size)
    const metaRes = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size',
      supportsAllDrives: true
    });

    const meta = metaRes.data;

    // 2. Ambil binary media sebagai Readable Stream
    const mediaRes = await drive.files.get(
      { fileId: fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );

    return {
      stream: mediaRes.data,
      mimeType: meta.mimeType || 'application/octet-stream',
      size: meta.size ? parseInt(meta.size, 10) : null,
      name: meta.name || 'media'
    };
  }

  /**
   * Menyimpan/menambahkan metadata media wawancara ke dokumen Firestore logbook
   * pada field array `wawancara_media`.
   *
   * @param {Object} params
   * @param {string} params.userId - Firebase User ID
   * @param {string} params.logbookId - ID Dokumen Logbook
   * @param {Object} params.mediaMetadata - Objek metadata { file_id, file_name, file_type, web_view_link }
   * @param {Object} [params.db] - Instance Firestore (opsional, jika tidak disediakan menggunakan firestoreDb)
   */
  async saveMediaToFirestore({ userId, logbookId, mediaMetadata, db = null }) {
    const targetDb = db || firestoreDb;
    if (!targetDb) {
      throw new Error('Instance Firestore tidak ditemukan. Harap sediakan parameter db atau inisialisasi firebase-admin.');
    }

    const FieldValue = admin ? admin.firestore.FieldValue : require('firebase-admin').firestore.FieldValue;

    const logbookDocRef = targetDb
      .collection('users')
      .doc(userId)
      .collection('logbooks')
      .doc(logbookId);

    await logbookDocRef.set({
      wawancara_media: FieldValue.arrayUnion(mediaMetadata),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return {
      success: true,
      logbookId,
      media: mediaMetadata
    };
  }

  /**
   * Alur terpadu lengkap (Upload ke Drive + Simpan ke Firestore)
   */
  async processAndSaveInterviewMedia({
    userId,
    logbookId,
    fileName,
    mimeType,
    fileContent,
    db = null
  }) {
    // 1. Upload ke Google Drive
    const mediaMetadata = await this.uploadInterviewMedia({
      userId,
      logbookId,
      fileName,
      mimeType,
      fileContent
    });

    // 2. Simpan ke Firestore jika database tersedia
    if (db || firestoreDb) {
      await this.saveMediaToFirestore({
        userId,
        logbookId,
        mediaMetadata,
        db: db || firestoreDb
      });
    }

    return mediaMetadata;
  }
}

module.exports = {
  GoogleDriveMediaService
};
