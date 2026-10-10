/**
 * functions/api/media/stream.js
 * Cloudflare Pages Function Handler untuk Streaming Media Wawancara (Audio & Video)
 * secara White-Label dan Native Edge Streaming.
 *
 * Endpoint: GET /api/media/stream?file_id=XXXXX[&download=1][&filename=XXXXX]
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const fileId = url.searchParams.get('file_id') || url.searchParams.get('fileId');

  if (!fileId) {
    return new Response(JSON.stringify({ success: false, message: 'file_id parameter is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const isDownload = url.searchParams.get('download') === '1';
  const requestedFileName = url.searchParams.get('filename') || 'berkas_media';

  // Endpoint biner langsung dari Google Drive
  const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}`;

  // Teruskan header Range jika dikirimkan oleh browser untuk seeking video/audio
  const forwardHeaders = new Headers();
  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    forwardHeaders.set('range', rangeHeader);
  }

  try {
    const driveRes = await fetch(driveUrl, {
      method: 'GET',
      headers: forwardHeaders
    });

    if (!driveRes.ok && driveRes.status !== 206) {
      return new Response(JSON.stringify({
        success: false,
        message: `Gagal memuat media dari cloud storage (HTTP ${driveRes.status})`
      }), {
        status: driveRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const responseHeaders = new Headers();

    // Salin header penting dari Google Drive
    const contentType = driveRes.headers.get('content-type') || 'application/octet-stream';
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    const contentLength = driveRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = driveRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    // Penanganan Content-Disposition: inline vs attachment
    if (isDownload) {
      responseHeaders.set('Content-Disposition', `attachment; filename="${encodeURIComponent(requestedFileName)}"`);
    } else {
      responseHeaders.set('Content-Disposition', 'inline');
    }

    return new Response(driveRes.body, {
      status: driveRes.status,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Gagal melakukan streaming media: ' + error.message
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
