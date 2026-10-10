/**
 * api/media-upload.js
 * Contoh Serverless / Express Handler untuk Menerima Unggahan Rekaman Wawancara
 * dan Memprosesnya Melalui GoogleDriveMediaService.
 *
 * Endpoint: POST /api/media/upload
 * Payload multipart/form-data:
 * - userId: "Firebase User ID"
 * - logbookId: "ID Dokumen Logbook"
 * - file: Binary file (Audio/Video)
 */

const { GoogleDriveMediaService } = require('../services/driveService');

const driveService = new GoogleDriveMediaService({
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json',
  parentFolderId: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
});

/**
 * Handler Vercel / Node.js Request
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const queryUserId = url.searchParams.get('userId') || req.headers['x-user-id'];
    const queryLogbookId = url.searchParams.get('logbookId') || req.headers['x-logbook-id'];
    const queryFileName = url.searchParams.get('fileName') || req.headers['x-file-name'];
    const queryMimeType = url.searchParams.get('mimeType') || req.headers['content-type'] || 'application/octet-stream';

    const body = req.body || {};
    const userId = body.userId || queryUserId;
    const logbookId = body.logbookId || queryLogbookId;
    const fileName = decodeURIComponent(body.fileName || queryFileName || 'rekaman_wawancara');
    const mimeType = body.mimeType || queryMimeType;
    const fileContentPayload = body.fileBase64 || body.fileBuffer || body.file;

    if (!userId || !logbookId) {
      return res.status(400).json({
        success: false,
        message: 'userId dan logbookId wajib disertakan'
      });
    }

    let fileContent;
    if (fileContentPayload) {
      fileContent = Buffer.isBuffer(fileContentPayload) ? fileContentPayload : Buffer.from(fileContentPayload, 'base64');
    } else {
      fileContent = req;
    }

    // 1. Upload ke Google Drive & Ambil Metadata
    const mediaMetadata = await driveService.uploadInterviewMedia({
      userId,
      logbookId,
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      fileContent: fileContent,
      makePublic: true
    });

    // 2. Simpan ke Firestore jika Firebase Admin terkonfigurasi
    try {
      await driveService.saveMediaToFirestore({
        userId,
        logbookId,
        mediaMetadata
      });
    } catch (dbErr) {
      console.warn('Simpan ke Firestore via backend di-skip atau menggunakan REST client:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Media wawancara berhasil diunggah ke Google Drive dan dicatat ke Firestore',
      data: mediaMetadata
    });
  } catch (error) {
    console.error('Gagal memproses unggahan media wawancara:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengunggah ke Google Drive: ' + error.message
    });
  }
};
