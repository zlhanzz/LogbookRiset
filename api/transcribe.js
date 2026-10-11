/**
 * api/transcribe.js
 * Vercel Serverless Function Handler untuk Auto-Transkripsi Audio Wawancara
 * menggunakan Groq Whisper Large v3 (Fast & High-Accuracy Speech-to-Text).
 *
 * Endpoint: POST /api/transcribe
 * Request Body: { file_id: "XXXXX", logbook_id: "YYYYY" }
 */

const { GoogleDriveMediaService } = require('../services/driveService');

const driveService = new GoogleDriveMediaService({
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json',
  parentFolderId: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
});

module.exports = async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { file_id, fileId, logbook_id } = req.body || {};
  const targetFileId = file_id || fileId || req.query.file_id;

  if (!targetFileId) {
    return res.status(400).json({
      success: false,
      message: 'Parameter file_id wajib disertakan dalam request.'
    });
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return res.status(500).json({
      success: false,
      message: 'GROQ_API_KEY belum dikonfigurasi di environment server.'
    });
  }

  try {
    // 1. Ambil berkas media dari Google Drive
    const media = await driveService.getMediaStream(targetFileId);
    if (!media || !media.stream) {
      return res.status(404).json({
        success: false,
        message: 'Berkas media tidak ditemukan di Google Drive.'
      });
    }

    // 2. Kumpulkan stream menjadi buffer
    const chunks = [];
    for await (const chunk of media.stream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // 3. Bangun multipart/form-data untuk Groq API
    const fileName = media.name || 'recording.m4a';
    const mimeType = media.mimeType || 'audio/m4a';
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const crlf = '\r\n';
    const preParts = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="model"`,
      '',
      'whisper-large-v3',
      `--${boundary}`,
      `Content-Disposition: form-data; name="language"`,
      '',
      'id',
      `--${boundary}`,
      `Content-Disposition: form-data; name="response_format"`,
      '',
      'json',
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
      `Content-Type: ${mimeType}`,
      '',
      ''
    ].join(crlf);

    const postParts = crlf + `--${boundary}--` + crlf;
    const bodyBuffer = Buffer.concat([
      Buffer.from(preParts, 'utf8'),
      audioBuffer,
      Buffer.from(postParts, 'utf8')
    ]);

    // 4. Panggil endpoint transkripsi Groq Cloud API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: bodyBuffer
    });

    const result = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq Whisper API Error:', result);
      return res.status(groqResponse.status).json({
        success: false,
        message: result.error?.message || 'Gagal memproses transkripsi di Groq API.'
      });
    }

    return res.status(200).json({
      success: true,
      text: result.text || '',
      file_id: targetFileId,
      logbook_id: logbook_id || null
    });
  } catch (error) {
    console.error('Terjadi kesalahan transkripsi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan transkripsi: ' + error.message
    });
  }
};
