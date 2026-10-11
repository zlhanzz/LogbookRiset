/**
 * functions/api/transcribe.js
 * Cloudflare Pages Function Handler untuk Transkripsi Otomatis Rekaman Wawancara
 * menggunakan Groq Cloud Whisper Large v3 (Bahasa Indonesia).
 *
 * Endpoint: POST /api/transcribe
 * Mendukung input:
 * 1. JSON / URL param: { file_id: "XXXXX" } -> Mengunduh dari Google Drive lalu mentranskrip via Groq
 * 2. Multipart/form-data: { file: <Blob> } -> Meneruskan berkas audio langsung ke Groq
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-Logbook-Id',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const groqApiKey = env?.GROQ_API_KEY || 
    (typeof process !== 'undefined' && process.env && process.env.GROQ_API_KEY);

  if (!groqApiKey) {
    return new Response(JSON.stringify({
      success: false,
      message: 'GROQ_API_KEY belum dikonfigurasi di lingkungan server (Cloudflare Environment Variables).'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let audioBlob = null;
    let fileName = 'wawancara.m4a';
    let mimeType = 'audio/mp4';

    if (contentType.startsWith('audio/')) {
      audioBlob = await request.blob();
      const url = new URL(request.url);
      fileName = url.searchParams.get('file_name') || 'audio_chunk.wav';
      mimeType = contentType || 'audio/wav';

    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      const fileId = body.file_id || body.fileId;

      if (!fileId) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Parameter file_id wajib disertakan.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Ambil audio dari Google Drive stream/download
      let driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download`;
      let driveRes = await fetch(driveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!driveRes.ok) {
        driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}`;
        driveRes = await fetch(driveUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      }

      if (!driveRes.ok) {
        return new Response(JSON.stringify({
          success: false,
          message: `Gagal mengunduh audio dari cloud storage (HTTP ${driveRes.status}).`
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      audioBlob = await driveRes.blob();
      fileName = body.file_name || 'wawancara.m4a';
      mimeType = audioBlob.type || 'audio/mp4';

    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const fileId = formData.get('file_id') || formData.get('fileId');

      if (file && typeof file === 'object') {
        audioBlob = file;
        fileName = file.name || 'wawancara.wav';
        mimeType = file.type || 'audio/wav';
      } else if (fileId) {
        const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}`;
        const driveRes = await fetch(driveUrl);
        if (!driveRes.ok) {
          return new Response(JSON.stringify({
            success: false,
            message: `Gagal mengunduh audio dari cloud storage (HTTP ${driveRes.status}).`
          }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        audioBlob = await driveRes.blob();
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: 'Berkas audio atau file_id tidak ditemukan dalam request multipart.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    } else {
      // Periksa query params fallback
      const url = new URL(request.url);
      const fileId = url.searchParams.get('file_id') || url.searchParams.get('fileId');
      if (fileId) {
        const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}`;
        const driveRes = await fetch(driveUrl);
        if (!driveRes.ok) {
          return new Response(JSON.stringify({
            success: false,
            message: `Gagal mengunduh audio dari cloud storage (HTTP ${driveRes.status}).`
          }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        audioBlob = await driveRes.blob();
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: 'Format request tidak didukung. Kirimkan JSON, multipart form data, atau binary audio stream.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Validasi batas ukuran audio Groq (Maksimal 25 MB)
    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (audioBlob.size > MAX_SIZE_BYTES) {
      return new Response(JSON.stringify({
        success: false,
        requires_client_chunking: true,
        message: `Ukuran berkas (${(audioBlob.size / 1024 / 1024).toFixed(1)} MB) melebihi batas 25 MB Groq AI. Sistem akan memproses dan mengompresi audio melalui peramban...`
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Bangun FormData untuk Groq Cloud Whisper API
    const groqForm = new FormData();
    groqForm.append('model', 'whisper-large-v3');
    groqForm.append('language', 'id'); // Bahasa Indonesia
    groqForm.append('response_format', 'verbose_json');
    groqForm.append('temperature', '0.2');
    groqForm.append('file', audioBlob, fileName);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: groqForm
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error?.message || errText;
      } catch (e) {}

      return new Response(JSON.stringify({
        success: false,
        message: `Groq Whisper API Error (${groqResponse.status}): ${parsedErr}`
      }), {
        status: groqResponse.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const groqData = await groqResponse.json();

    return new Response(JSON.stringify({
      success: true,
      text: (groqData.text || '').trim(),
      segments: groqData.segments || [],
      language: groqData.language || 'id',
      duration: groqData.duration || 0
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error('Error proses auto-transkrip:', err);
    return new Response(JSON.stringify({
      success: false,
      message: 'Terjadi kesalahan sistem saat memproses transkrip: ' + err.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
