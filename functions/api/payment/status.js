/**
 * functions/api/payment/status.js
 * Cloudflare Pages Function untuk mengecek status transaksi Pakasir API v2
 * Endpoint: GET /api/payment/status?txn_id=XXXXX
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const slug = (env && env.PAKASIR_SLUG) || 'logbook-riset';
  const apiKey = (env && env.PAKASIR_API_KEY) || '7tRYFhtoCH8a5zogIGh46UW1Qellx4eX';

  const txnId = url.searchParams.get('txn_id') || url.searchParams.get('txnId') || url.searchParams.get('order_id');

  if (!txnId) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Parameter txn_id atau order_id wajib diisi'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const upstreamUrl = `https://app.pakasir.com/api/v2/transaction-status/${encodeURIComponent(slug)}/${encodeURIComponent(txnId)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      }
    });

    const responseText = await upstreamRes.text();

    if (upstreamRes.status === 429) {
      return new Response(JSON.stringify({
        status: 'pending',
        rate_limited: true,
        message: 'Pengecekan status dibatasi maksimal 4 detik sekali oleh gateway Pakasir.'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    let parsed = {};
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      return new Response(JSON.stringify({
        status: 'pending',
        raw: responseText
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: upstreamRes.status || 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      status: 'pending',
      error: err.message
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
