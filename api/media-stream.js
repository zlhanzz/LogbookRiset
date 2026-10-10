/**
 * api/media-stream.js
 * Vercel Serverless Function Handler untuk Streaming Media Wawancara dari Google Drive API
 * secara White-Label (tanpa memperlihatkan domain drive.google.com ke pengguna).
 *
 * Endpoint: GET /api/media/stream?file_id=XXXXX
 */

const { GoogleDriveMediaService } = require('../services/driveService');

const driveService = new GoogleDriveMediaService({
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json',
  parentFolderId: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
});

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const fileId = req.query.file_id || req.query.fileId;
  if (!fileId) {
    return res.status(400).json({ success: false, message: 'file_id parameter is required' });
  }

  try {
    const media = await driveService.getMediaStream(fileId);

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (media.size) {
      res.setHeader('Content-Length', media.size);
    }

    media.stream.pipe(res);
  } catch (error) {
    console.error('Gagal streaming media Google Drive:', error);
    return res.status(502).json({
      success: false,
      message: 'Gagal memutar media: ' + error.message
    });
  }
};
