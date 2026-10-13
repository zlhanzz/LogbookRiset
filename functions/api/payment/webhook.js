/**
 * functions/api/payment/webhook.js
 * Cloudflare Pages Function untuk menerima callback webhook transaksi Pakasir
 * Endpoint: /api/payment/webhook
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Secret, x-secret',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Health Check / URL Verification: GET /api/payment/webhook
 * Memastikan tim verifikator Pakasir atau bot validator mendapat respon 200 OK bahwa endpoint aktif.
 */
export async function onRequestGet() {
  return new Response(JSON.stringify({
    success: true,
    status: 'active',
    service: 'LogbookRiset Pakasir Webhook Endpoint',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Webhook Receiver: POST /api/payment/webhook
 * Menerima notifikasi server-to-server saat transaksi berhasil dari gateway Pakasir.
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const webhookSecret = (env && env.PAKASIR_WEBHOOK_SECRET) || '054cf29d8d267043f784a99f83451fcd';

  const secret = request.headers.get('x-secret') || request.headers.get('X-Secret') || '';

  // Validasi keaslian signature jika header rahasia dikirimkan oleh Pakasir
  if (secret && webhookSecret && secret !== webhookSecret) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid X-Secret webhook header'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  let body = {};
  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      const rawText = await request.text();
      try {
        body = JSON.parse(rawText);
      } catch (parseErr) {
        body = { raw: rawText };
      }
    }
  } catch (err) {
    body = {};
  }

  const orderId = body.order_id || body.orderId || null;
  const status = body.status || 'completed';

  return new Response(JSON.stringify({
    success: true,
    received: true,
    order_id: orderId,
    status: status,
    message: 'Webhook processed successfully'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Universal Catch-All Handler: Menangani seluruh metode HTTP (POST, PUT, PATCH, GET, OPTIONS, HEAD, dll.)
 * Mencegah Cloudflare Pages menolak request gateway dengan status 405 Method Not Allowed jika gateway mengirim variasi metode.
 */
export async function onRequest(context) {
  const method = ((context && context.request && context.request.method) || '').toUpperCase();
  if (method === 'OPTIONS') {
    return onRequestOptions();
  }
  if (method === 'GET' || method === 'HEAD') {
    return onRequestGet();
  }
  return onRequestPost(context);
}

