/**
 * functions/api/payment/webhook.js
 * Cloudflare Pages Function untuk menerima callback webhook transaksi Pakasir
 * Endpoint: POST /api/payment/webhook
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Secret',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const webhookSecret = (env && env.PAKASIR_WEBHOOK_SECRET) || '616860e68e5ab242a7b6ee60370e8865';

  const secret = request.headers.get('x-secret') || '';
  if (webhookSecret && secret !== webhookSecret) {
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
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  return new Response(JSON.stringify({
    success: true,
    received: true,
    order_id: body.order_id,
    status: body.status || 'completed'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
