/**
 * functions/api/payment/status.js
 * Cloudflare Pages Function untuk mengecek status transaksi Pakasir API v2 & Dual-Query Verification
 * Endpoint: GET /api/payment/status?order_id=XXXXX&txn_id=YYYYY&amount=50000
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

  const txnId = url.searchParams.get('txn_id') || url.searchParams.get('txnId');
  const orderId = url.searchParams.get('order_id') || url.searchParams.get('orderId');
  const amount = parseInt(url.searchParams.get('amount') || (env && env.PAKASIR_AMOUNT) || '50000', 10);

  const lookupTarget = txnId || orderId;

  if (!lookupTarget) {
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

  // 1. Prioritas 1: Jika order_id tersedia, lakukan verifikasi langsung ke endpoint detail transaksi resmi Pakasir
  if (orderId) {
    try {
      const detailUrl = `https://app.pakasir.com/api/transactiondetail?project=${encodeURIComponent(slug)}&order_id=${encodeURIComponent(orderId)}&amount=${amount}&api_key=${encodeURIComponent(apiKey)}`;
      const detailRes = await fetch(detailUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (detailRes.ok) {
        const detailData = await detailRes.json();
        const tx = detailData.transaction || detailData;
        if (tx && (tx.status === 'completed' || tx.status === 'paid' || tx.status === 'settlement')) {
          return new Response(JSON.stringify({
            success: true,
            status: 'completed',
            order_id: tx.order_id || orderId,
            txn_id: tx.txn_id || txnId || '',
            amount: tx.amount || amount,
            fee: tx.fee || 0,
            payment_method: tx.payment_method || 'qris',
            completed_at: tx.completed_at || new Date().toISOString(),
            is_sandbox: Boolean(tx.is_sandbox),
            verified_by: 'order_id_detail'
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    } catch (e) {
      console.warn('Gagal verifikasi by order_id detail:', e.message);
    }
  }

  // 2. Prioritas 2: Pengecekan via v2 transaction-status menggunakan txn_id (atau lookupTarget)
  try {
    const upstreamUrl = `https://app.pakasir.com/api/v2/transaction-status/${encodeURIComponent(slug)}/${encodeURIComponent(txnId || lookupTarget)}`;
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
      parsed = { status: 'pending', raw: responseText };
    }

    // Jika v2 mengembalikan completed
    if (parsed.status === 'completed' || parsed.status === 'paid' || parsed.status === 'settlement') {
      return new Response(JSON.stringify({
        success: true,
        ...parsed,
        order_id: parsed.order_id || orderId || lookupTarget,
        status: 'completed'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Fallback: kembalikan hasil respons yang ada
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
