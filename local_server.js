/**
 * SERVER LOKAL PRAKTIS (ZERO DEPENDENCIES)
 * Menggunakan modul bawaan Node.js (http, fs, path)
 * Berfungsi untuk menguji dan membuka web logbook di laptop sebelum di-deploy ke Vercel.
 * Dilengkapi dengan pembaca berkas .env untuk mengamankan kredensial API.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

// Fungsi pembaca berkas .env lokal dan penyuntik process.env
function loadEnv() {
  const envFiles = [
    path.join(__dirname, '..', '.env'),
    path.join(PUBLIC_DIR, '.env')
  ];
  const env = {};
  for (const envPath of envFiles) {
    if (fs.existsSync(envPath)) {
      try {
        const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            env[key] = val;
            process.env[key] = val; // Pastikan process.env terisi bagi pustaka internal
          }
        }
      } catch (e) {
        console.warn("Gagal membaca .env:", e.message);
      }
    }
  }
  return env;
}
loadEnv(); // Panggil di tingkat modul agar process.env siap sejak awal
const https = require('https');

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, X-Secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, X-Secret',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const urlPath = parsedUrl.pathname;

  // Endpoint API /api/config: Mengembalikan konfigurasi dari .env tanpa mengeksposnya di Git
  if (urlPath === '/api/config') {
    const env = loadEnv();
    const config = {
      apiKey: env.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
      authDomain: env.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
      measurementId: env.FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '',
      pakasirSlug: env.PAKASIR_SLUG || 'logbook-riset',
      pakasirAmount: parseInt(env.PAKASIR_AMOUNT || '50000', 10)
    };

    return sendJson(res, 200, config);
  }

  // Endpoint API /api/image-proxy: Proxy gambar untuk mengatasi hambatan CORS Firebase Storage pada ekspor Word (.docx)
  if (urlPath === '/api/image-proxy' && req.method === 'GET') {
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      res.writeHead(400, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      return res.end('Invalid URL parameter');
    }

    try {
      const upstream = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(12000)
      });

      if (!upstream.ok) {
        res.writeHead(upstream.status, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        return res.end(`Upstream returned ${upstream.status}`);
      }

      const arrayBuf = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=86400',
        'Content-Length': buffer.length
      });
      return res.end(buffer);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      return res.end('Proxy fetch error: ' + err.message);
    }
  }

  // Endpoint API /api/media/stream: Streaming media rekaman audio/video dari Google Drive secara white-label
  if (urlPath === '/api/media/stream' && req.method === 'GET') {
    const fileId = parsedUrl.searchParams.get('file_id') || parsedUrl.searchParams.get('fileId');
    if (!fileId) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ success: false, message: 'file_id parameter is required' }));
    }

    try {
      const { GoogleDriveMediaService } = require('./services/driveService');
      const env = loadEnv();
      const driveService = new GoogleDriveMediaService({
        clientId: env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID,
        clientSecret: env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        refreshToken: env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
        redirectUri: env.GOOGLE_DRIVE_REDIRECT_URI || process.env.GOOGLE_DRIVE_REDIRECT_URI,
        credentialsPath: env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS,
        parentFolderId: env.GOOGLE_DRIVE_PARENT_FOLDER_ID || process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
      });

      const media = await driveService.getMediaStream(fileId);
      const isDownload = parsedUrl.searchParams.get('download') === '1';
      const downloadFileName = parsedUrl.searchParams.get('filename') || media.name || 'berkas_media';

      const headers = {
        'Content-Type': media.mimeType,
        'Access-Control-Allow-Origin': '*',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600'
      };
      if (media.size) {
        headers['Content-Length'] = media.size;
      }
      if (isDownload) {
        headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(downloadFileName)}"`;
      } else {
        headers['Content-Disposition'] = 'inline';
      }

      res.writeHead(200, headers);
      media.stream.pipe(res);
      return;
    } catch (streamErr) {
      console.warn('Gagal streaming media Google Drive:', streamErr.message);
      res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ success: false, message: 'Gagal memutar media: ' + streamErr.message }));
    }
  }

  // Endpoint API /api/transcribe: Transkripsi audio wawancara via Groq Whisper Large v3
  if (urlPath === '/api/transcribe' && req.method === 'POST') {
    const env = loadEnv();
    const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return sendJson(res, 500, {
        success: false,
        message: 'GROQ_API_KEY belum dikonfigurasi di berkas .env'
      });
    }

    try {
      let audioBuffer = null;
      let fileName = 'wawancara.m4a';
      let mimeType = 'audio/mp4';

      const contentType = req.headers['content-type'] || '';
      if (contentType.startsWith('audio/')) {
        // Mode Binary Audio Stream (misal dikirim oleh Web Audio downsampler browser)
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        audioBuffer = Buffer.concat(chunks);
        fileName = parsedUrl.searchParams.get('file_name') || 'audio_chunk.wav';
        mimeType = contentType;
      } else {
        // Mode JSON dengan file_id Google Drive
        const body = await readBody(req);
        const fileId = body.file_id || body.fileId || parsedUrl.searchParams.get('file_id') || parsedUrl.searchParams.get('fileId');

        if (!fileId) {
          return sendJson(res, 400, {
            success: false,
            message: 'Parameter file_id wajib disertakan.'
          });
        }

        // Ambil stream dari Google Drive
        const { GoogleDriveMediaService } = require('./services/driveService');
        const driveService = new GoogleDriveMediaService({
          clientId: env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID,
          clientSecret: env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET,
          refreshToken: env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
          redirectUri: env.GOOGLE_DRIVE_REDIRECT_URI || process.env.GOOGLE_DRIVE_REDIRECT_URI,
          credentialsPath: env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS,
          parentFolderId: env.GOOGLE_DRIVE_PARENT_FOLDER_ID || process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
        });

        const media = await driveService.getMediaStream(fileId);

        // Kumpulkan chunk audio stream menjadi Buffer
        const chunks = [];
        for await (const chunk of media.stream) {
          chunks.push(chunk);
        }
        audioBuffer = Buffer.concat(chunks);
        fileName = body.file_name || media.name || 'wawancara.m4a';
        mimeType = media.mimeType || 'audio/mp4';
      }

      const MAX_SIZE_BYTES = 25 * 1024 * 1024;
      if (audioBuffer.length > MAX_SIZE_BYTES) {
        return sendJson(res, 413, {
          success: false,
          requires_client_chunking: true,
          message: `Ukuran berkas (${(audioBuffer.length / 1024 / 1024).toFixed(1)} MB) melebihi batas pemrosesan langsung (25 MB). Sistem akan mengoptimalkan audio melalui peramban...`
        });
      }

      const fileBlob = new Blob([audioBuffer], { type: mimeType });
      const formData = new FormData();
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'id');
      formData.append('response_format', 'verbose_json');
      formData.append('temperature', '0.2');
      formData.append('file', fileBlob, fileName);

      const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        return sendJson(res, groqRes.status, {
          success: false,
          message: `Layanan Transkripsi AI mengalami kendala (${groqRes.status})`
        });
      }

      const groqData = await groqRes.json();
      return sendJson(res, 200, {
        success: true,
        text: (groqData.text || '').trim(),
        segments: groqData.segments || [],
        duration: groqData.duration || 0,
        language: groqData.language || 'id'
      });
    } catch (err) {
      console.error('Error proses transkrip di local_server:', err);
      return sendJson(res, 500, {
        success: false,
        message: 'Gagal memproses transkrip: ' + err.message
      });
    }
  }

  // Endpoint API /api/media/upload: Mengunggah rekaman suara / video wawancara ke Google Drive 5 TB
  if (urlPath === '/api/media/upload' && req.method === 'POST') {
    const env = loadEnv();
    const queryUserId = parsedUrl.searchParams.get('userId') || req.headers['x-user-id'];
    const queryLogbookId = parsedUrl.searchParams.get('logbookId') || req.headers['x-logbook-id'];
    const queryFileName = parsedUrl.searchParams.get('fileName') || req.headers['x-file-name'];
    const queryMimeType = parsedUrl.searchParams.get('mimeType') || req.headers['content-type'] || 'application/octet-stream';

    try {
      const { GoogleDriveMediaService } = require('./services/driveService');
      const driveService = new GoogleDriveMediaService({
        clientId: env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID,
        clientSecret: env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        refreshToken: env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
        redirectUri: env.GOOGLE_DRIVE_REDIRECT_URI || process.env.GOOGLE_DRIVE_REDIRECT_URI,
        credentialsPath: env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS,
        parentFolderId: env.GOOGLE_DRIVE_PARENT_FOLDER_ID || process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
      });

      const contentTypeHeader = (req.headers['content-type'] || '').toLowerCase();

      // Kasus A: Request dikirim sebagai JSON (base64)
      if (contentTypeHeader.includes('application/json')) {
        const body = await readBody(req);
        const userId = body.userId || queryUserId;
        const logbookId = body.logbookId || queryLogbookId;
        const fileName = body.fileName || queryFileName;
        const mimeType = body.mimeType || queryMimeType;
        const fileBase64 = body.fileBase64 || body.fileBuffer;

        if (!userId || !logbookId || !fileName || !fileBase64) {
          return sendJson(res, 400, {
            success: false,
            message: 'userId, logbookId, fileName, dan fileBase64 wajib disertakan'
          });
        }

        const buffer = Buffer.isBuffer(fileBase64) ? fileBase64 : Buffer.from(fileBase64, 'base64');
        const mediaMetadata = await driveService.uploadInterviewMedia({
          userId,
          logbookId,
          fileName,
          mimeType,
          fileContent: buffer,
          makePublic: true
        });

        return sendJson(res, 200, {
          success: true,
          message: 'Media wawancara berhasil disimpan ke penyimpanan cloud terenkripsi',
          data: mediaMetadata
        });
      }

      // Kasus B: Request dikirim sebagai Stream Biner Langsung (High-Performance Spooled Streaming)
      const userId = queryUserId;
      const logbookId = queryLogbookId;
      const fileName = decodeURIComponent(queryFileName || 'rekaman_wawancara');
      const mimeType = queryMimeType;

      if (!userId || !logbookId) {
        return sendJson(res, 400, {
          success: false,
          message: 'userId dan logbookId wajib disertakan pada query atau header'
        });
      }

      const os = require('os');
      const tmpFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${Math.random().toString(36).substring(7)}_${fileName.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}`);
      const fileWriteStream = fs.createWriteStream(tmpFilePath);

      await new Promise((resolve, reject) => {
        req.pipe(fileWriteStream);
        req.on('error', reject);
        fileWriteStream.on('error', reject);
        fileWriteStream.on('finish', resolve);
      });

      try {
        const mediaMetadata = await driveService.uploadInterviewMedia({
          userId,
          logbookId,
          fileName,
          mimeType,
          fileContent: tmpFilePath,
          makePublic: true
        });

        try { fs.unlinkSync(tmpFilePath); } catch (cleanErr) {}

        return sendJson(res, 200, {
          success: true,
          message: 'Media wawancara berhasil disimpan ke penyimpanan cloud terenkripsi',
          data: mediaMetadata
        });
      } catch (driveErr) {
        try { fs.unlinkSync(tmpFilePath); } catch (cleanErr) {}
        throw driveErr;
      }

    } catch (uploadErr) {
      console.error('Galat saat mengunggah media ke Google Drive:', uploadErr);
      return sendJson(res, 500, {
        success: false,
        message: 'Gagal mengunggah media: ' + uploadErr.message
      });
    }
  }


  // Endpoint API /api/payment/create: Membuat transaksi QRIS / Payment Link ke Pakasir API v2
  if (urlPath === '/api/payment/create' && req.method === 'POST') {
    const env = loadEnv();
    const body = await readBody(req);
    const slug = env.PAKASIR_SLUG || 'logbook-riset';
    const apiKey = env.PAKASIR_API_KEY || '';
    const orderId = body.order_id || `LB-${Date.now()}`;
    const amount = parseInt(body.amount || env.PAKASIR_AMOUNT || '50000', 10);
    const method = body.method || 'qris';

    if (!apiKey) {
      return sendJson(res, 500, {
        success: false,
        message: 'PAKASIR_API_KEY belum dikonfigurasi di file .env'
      });
    }

    try {
      const postData = JSON.stringify({ method, amount });
      const options = {
        hostname: 'app.pakasir.com',
        path: `/api/v2/create-transaction/${encodeURIComponent(slug)}/${encodeURIComponent(orderId)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      };

      const apiReq = https.request(options, (apiRes) => {
        let responseData = '';
        apiRes.on('data', chunk => { responseData += chunk; });
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            const txnId = parsed.txn_id || '';
            const paymentUrl = parsed.payment_link || (txnId ? `https://app.pakasir.com/pay-v2/${txnId}` : `https://app.pakasir.com/pay-v2`);
            return sendJson(res, apiRes.statusCode || 200, {
              success: apiRes.statusCode >= 200 && apiRes.statusCode < 300,
              data: {
                ...parsed,
                payment_url: paymentUrl
              },
              order_id: orderId,
              txn_id: txnId,
              payment_method: parsed.payment_method || method,
              va_number: parsed.va_number || null,
              amount: parsed.amount || amount,
              fee: parsed.fee || 0,
              total_payment: parsed.total_payment || (parsed.amount ? parsed.amount + (parsed.fee || 0) : amount),
              is_sandbox: Boolean(parsed.is_sandbox),
              qr_string: parsed.qr_string || '',
              expires_at: parsed.expires_at || null,
              payment_url: paymentUrl
            });
          } catch (e) {
            return sendJson(res, apiRes.statusCode || 200, {
              success: false,
              raw: responseData,
              order_id: orderId
            });
          }
        });
      });

      apiReq.on('error', (err) => {
        console.warn('Gagal memanggil Pakasir API:', err.message);
        return sendJson(res, 502, {
          success: false,
          message: 'Koneksi ke gateway Pakasir gagal: ' + err.message
        });
      });

      apiReq.write(postData);
      apiReq.end();
      return;
    } catch (err) {
      return sendJson(res, 500, { success: false, message: err.message });
    }
  }

  // Endpoint API /api/payment/status: Cek status transaksi Pakasir API v2 & Dual-Query Verification
  if (urlPath === '/api/payment/status' && req.method === 'GET') {
    const env = loadEnv();
    const slug = env.PAKASIR_SLUG || 'logbook-riset';
    const apiKey = env.PAKASIR_API_KEY || '';
    const txnId = parsedUrl.searchParams.get('txn_id') || parsedUrl.searchParams.get('txnId');
    const orderId = parsedUrl.searchParams.get('order_id') || parsedUrl.searchParams.get('orderId');
    const amount = parseInt(parsedUrl.searchParams.get('amount') || env.PAKASIR_AMOUNT || '50000', 10);
    const lookupTarget = txnId || orderId;

    if (!lookupTarget) {
      return sendJson(res, 400, { success: false, message: 'Parameter txn_id atau order_id wajib diisi' });
    }

    // 1. Prioritas 1: Jika order_id ada, query detail langsung ke Pakasir
    if (orderId) {
      try {
        const detailUrl = `https://app.pakasir.com/api/transactiondetail?project=${encodeURIComponent(slug)}&order_id=${encodeURIComponent(orderId)}&amount=${amount}&api_key=${encodeURIComponent(apiKey)}`;
        https.get(detailUrl, (dRes) => {
          let dData = '';
          dRes.on('data', c => dData += c);
          dRes.on('end', () => {
            try {
              const dJson = JSON.parse(dData);
              const tx = dJson.transaction || dJson;
              if (tx && (tx.status === 'completed' || tx.status === 'paid' || tx.status === 'settlement')) {
                return sendJson(res, 200, {
                  success: true,
                  status: 'completed',
                  order_id: tx.order_id || orderId,
                  txn_id: tx.txn_id || txnId || '',
                  amount: tx.amount || amount,
                  fee: tx.fee || 0,
                  payment_method: tx.payment_method || 'qris',
                  completed_at: tx.completed_at || new Date().toISOString(),
                  is_sandbox: Boolean(tx.is_sandbox),
                  verified_by: 'order_id_detail'
                });
              }
              // Jika belum completed via detail, fallback ke v2 query
              queryV2Status();
            } catch (err) {
              queryV2Status();
            }
          });
        }).on('error', () => queryV2Status());
        return;
      } catch (e) {
        // Lanjutkan ke v2
      }
    }

    function queryV2Status() {
      const options = {
        hostname: 'app.pakasir.com',
        path: `/api/v2/transaction-status/${encodeURIComponent(slug)}/${encodeURIComponent(txnId || lookupTarget)}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        },
        timeout: 8000
      };

      const statusReq = https.request(options, (statusRes) => {
        let data = '';
        statusRes.on('data', chunk => { data += chunk; });
        statusRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (statusRes.statusCode === 429) {
              return sendJson(res, 200, {
                status: 'pending',
                rate_limited: true,
                message: 'Pengecekan status dibatasi maksimal 4 detik sekali oleh gateway Pakasir.'
              });
            }
            if (parsed.status === 'completed' || parsed.status === 'paid' || parsed.status === 'settlement') {
              return sendJson(res, 200, {
                success: true,
                ...parsed,
                order_id: parsed.order_id || orderId || lookupTarget,
                status: 'completed'
              });
            }
            return sendJson(res, statusRes.statusCode || 200, parsed);
          } catch (e) {
            return sendJson(res, 200, { status: 'pending', raw: data });
          }
        });
      });

      statusReq.on('error', (err) => {
        return sendJson(res, 200, { status: 'pending', error: err.message });
      });

      statusReq.end();
    }

    queryV2Status();
    return;
  }

  // Endpoint API /api/payment/simulate: Simulasi Pembayaran Sandbox Pakasir Resmi
  if (urlPath === '/api/payment/simulate' && req.method === 'POST') {
    const env = loadEnv();
    const body = await readBody(req);
    const slug = env.PAKASIR_SLUG || 'logbook-riset';
    const apiKey = env.PAKASIR_API_KEY || '';
    const orderId = body.order_id || '';
    const amount = parseInt(body.amount || env.PAKASIR_AMOUNT || '50000', 10);

    if (!orderId) {
      return sendJson(res, 400, { success: false, message: 'order_id wajib diisi untuk simulasi' });
    }

    try {
      const simData = JSON.stringify({
        project: slug,
        order_id: orderId,
        amount: amount,
        api_key: apiKey
      });

      const simReq = https.request({
        hostname: 'app.pakasir.com',
        path: '/api/paymentsimulation',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(simData)
        },
        timeout: 8000
      }, (simRes) => {
        let resp = '';
        simRes.on('data', chunk => { resp += chunk; });
        simRes.on('end', () => {
          try {
            const parsed = JSON.parse(resp);
            return sendJson(res, simRes.statusCode || 200, parsed);
          } catch (e) {
            return sendJson(res, 200, { success: true, raw: resp });
          }
        });
      });

      simReq.on('error', (err) => {
        return sendJson(res, 502, { success: false, message: err.message });
      });

      simReq.write(simData);
      simReq.end();
      return;
    } catch (e) {
      return sendJson(res, 500, { success: false, message: e.message });
    }
  }

  // Endpoint API /api/payment/webhook & /api/webhook: Health Check (GET) dan Notifikasi Pembayaran (POST)
  if ((urlPath === '/api/payment/webhook' || urlPath === '/api/webhook')) {
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        status: 'active',
        service: 'LogbookRiset Pakasir Webhook Endpoint',
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const env = loadEnv();
      const secret = req.headers['x-secret'] || '';
      const expectedSecret = env.PAKASIR_WEBHOOK_SECRET || '';

      if (secret && expectedSecret && secret !== expectedSecret) {
        return sendJson(res, 401, { success: false, message: 'Invalid X-Secret webhook header' });
      }

      const body = await readBody(req);
      console.log('🔔 Webhook Pakasir Diterima:', JSON.stringify(body));

      return sendJson(res, 200, {
        success: true,
        received: true,
        order_id: body.order_id || null,
        status: body.status || 'completed',
        message: 'Webhook processed successfully'
      });
    }
  }

  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
  let ext = path.extname(filePath).toLowerCase();

  // Jika permintaan rute tanpa ekstensi tapi file .html fisiknya ada (misal: /privacy -> privacy.html, /terms -> terms.html)
  if (!ext && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
    ext = '.html';
  } else if (!ext && !urlPath.startsWith('/api/')) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
    ext = '.html';
  }

  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback kedua untuk SPA jika berkas tidak ditemukan dan bukan panggilan API
        if (!urlPath.startsWith('/api/')) {
          const indexFallback = path.join(PUBLIC_DIR, 'index.html');
          return fs.readFile(indexFallback, (fallbackErr, indexContent) => {
            if (fallbackErr) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              return res.end('404 Not Found');
            }
            res.writeHead(200, {
              'Content-Type': 'text/html',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(indexContent, 'utf-8');
          });
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Web Logbook Penelitian Lapangan Berjalan di:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`🔐 Endpoint Konfigurasi Privasi: http://localhost:${PORT}/api/config`);
  console.log(`=======================================================`);
  console.log(`Tekan Ctrl+C di terminal ini untuk menghentikan server.`);

  // Buka browser secara otomatis di Windows
  exec(`start http://localhost:${PORT}`);
});
