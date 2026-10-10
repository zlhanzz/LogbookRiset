/**
 * functions/api/payment/simulate.js
 * Cloudflare Pages Function untuk simulasi pembayaran sandbox Pakasir
 * Endpoint: POST /api/payment/simulate
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const slug = (env && env.PAKASIR_SLUG) || 'logbook-otomatis';
  const apiKey = (env && env.PAKASIR_API_KEY) || 'GkLiMGVm8xvz4yB528ANrygljI6K4pHi';
  const defaultAmount = parseInt((env && env.PAKASIR_AMOUNT) || '55500', 10);

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const orderId = body.order_id || '';
  const amount = parseInt(body.amount || defaultAmount, 10);

  if (!orderId) {
    return new Response(JSON.stringify({
      success: false,
      message: 'order_id wajib diisi untuk simulasi'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const simData = JSON.stringify({
      project: slug,
      order_id: orderId,
      amount: amount,
      api_key: apiKey
    });

    const upstreamRes = await fetch('https://app.pakasir.com/api/paymentsimulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: simData
    });

    const responseText = await upstreamRes.text();
    let parsed = {};
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      return new Response(JSON.stringify({
        success: true,
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
      success: false,
      message: err.message
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
