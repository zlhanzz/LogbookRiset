/**
 * functions/api/payment/create.js
 * Cloudflare Pages Function untuk membuat transaksi pembayaran Pakasir API v2
 * Endpoint: POST /api/payment/create
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, X-Secret',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const slug = (env && env.PAKASIR_SLUG) || 'logbook-otomatis';
  const apiKey = (env && env.PAKASIR_API_KEY) || 'GkLiMGVm8xvz4yB528ANrygljI6K4pHi';
  const defaultAmount = parseInt((env && env.PAKASIR_AMOUNT) || '55500', 10);

  if (!apiKey) {
    return new Response(JSON.stringify({
      success: false,
      message: 'PAKASIR_API_KEY belum dikonfigurasi di Cloudflare Pages environment'
    }), {
      status: 500,
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

  const orderId = body.order_id || `LB-${Date.now()}`;
  const amount = parseInt(body.amount || defaultAmount, 10);
  const method = body.method || 'qris';

  try {
    const postData = JSON.stringify({ method, amount });
    const upstreamUrl = `https://app.pakasir.com/api/v2/create-transaction/${encodeURIComponent(slug)}/${encodeURIComponent(orderId)}`;

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: postData
    });

    const responseText = await upstreamRes.text();
    let parsed = {};
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        raw: responseText,
        order_id: orderId
      }), {
        status: upstreamRes.status || 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const txnId = parsed.txn_id || '';
    const paymentUrl = parsed.payment_link || (txnId ? `https://app.pakasir.com/pay-v2/${txnId}` : 'https://app.pakasir.com/pay-v2');

    const result = {
      success: upstreamRes.ok,
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
    };

    return new Response(JSON.stringify(result), {
      status: upstreamRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Koneksi ke gateway Pakasir gagal: ' + err.message
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
