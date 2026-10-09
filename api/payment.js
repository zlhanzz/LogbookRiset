/**
 * Vercel Serverless Function untuk Payment Gateway Pakasir API v2
 * Menangani:
 * - POST /api/payment?action=create : Membuat transaksi QRIS / Payment Link
 * - GET  /api/payment?action=status : Cek status transaksi
 * - POST /api/payment?action=webhook: Menerima callback webhook dari Pakasir
 */

const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, X-Secret');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const slug = process.env.PAKASIR_SLUG || 'logbook-otomatis';
  const apiKey = process.env.PAKASIR_API_KEY || '';
  const webhookSecret = process.env.PAKASIR_WEBHOOK_SECRET || '';
  const defaultAmount = parseInt(process.env.PAKASIR_AMOUNT || '50000', 10);

  const action = req.query.action || (req.body && req.body.action) || 'create';

  // 1. BUAT TRANSAKSI (CREATE)
  if (req.method === 'POST' && action === 'create') {
    const body = req.body || {};
    const orderId = body.order_id || `LB-${Date.now()}`;
    const amount = body.amount || defaultAmount;
    const method = body.method || 'qris';

    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'PAKASIR_API_KEY belum dikonfigurasi di Vercel' });
    }

    try {
      const postData = JSON.stringify({ method, amount });
      const options = {
        hostname: 'app.pakasir.com',
        path: `/api/v2/create-transaction/${encodeURIComponent(slug)}/${encodeURIComponent(orderId)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      };

      const apiReq = https.request(options, (apiRes) => {
        let responseData = '';
        apiRes.on('data', chunk => { responseData += chunk; });
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            const txnId = parsed.txn_id || '';
            const paymentUrl = parsed.payment_link || (txnId ? `https://app.pakasir.com/pay-v2/${txnId}` : `https://app.pakasir.com/pay-v2`);
            return res.status(apiRes.statusCode || 200).json({
              success: apiRes.statusCode >= 200 && apiRes.statusCode < 300,
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
            });
          } catch (e) {
            return res.status(apiRes.statusCode || 200).json({
              success: false,
              raw: responseData,
              order_id: orderId
            });
          }
        });
      });

      apiReq.on('error', (err) => {
        return res.status(502).json({
          success: false,
          message: 'Koneksi ke gateway Pakasir gagal: ' + err.message
        });
      });

      apiReq.write(postData);
      apiReq.end();
      return;
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // 2. CEK STATUS TRANSAKSI (STATUS)
  if (req.method === 'GET' && (action === 'status' || req.query.order_id || req.query.txn_id || req.query.txnId)) {
    const txnId = req.query.txn_id || req.query.txnId || req.query.order_id;
    if (!txnId) {
      return res.status(400).json({ success: false, message: 'Parameter txn_id atau order_id wajib diisi' });
    }

    const options = {
      hostname: 'app.pakasir.com',
      path: `/api/v2/transaction-status/${encodeURIComponent(slug)}/${encodeURIComponent(txnId)}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      timeout: 8000
    };

    const statusReq = https.request(options, (statusRes) => {
      let data = '';
      statusRes.on('data', chunk => { data += chunk; });
      statusRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (statusRes.statusCode === 429) {
            return res.status(200).json({
              status: 'pending',
              rate_limited: true,
              message: 'Pengecekan status dibatasi maksimal 4 detik sekali oleh gateway Pakasir.'
            });
          }
          return res.status(statusRes.statusCode || 200).json(parsed);
        } catch (e) {
          return res.status(200).json({ status: 'pending', raw: data });
        }
      });
    });

    statusReq.on('error', (err) => {
      return res.status(200).json({ status: 'pending', error: err.message });
    });

    statusReq.end();
    return;
  }

  // 3. SIMULASI PEMBAYARAN SANDBOX RESMI PAKASIR (SIMULATE)
  if (req.method === 'POST' && action === 'simulate') {
    const body = req.body || {};
    const orderId = body.order_id || '';
    const amount = parseInt(body.amount || defaultAmount, 10);

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'order_id wajib diisi untuk simulasi' });
    }

    try {
      const simData = JSON.stringify({
        project: slug,
        order_id: orderId,
        amount: amount,
        api_key: apiKey
      });

      const simReq = https.request({
        hostname: 'app.pakasir.com',
        path: '/api/paymentsimulation',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(simData)
        },
        timeout: 8000
      }, (simRes) => {
        let resp = '';
        simRes.on('data', chunk => { resp += chunk; });
        simRes.on('end', () => {
          try {
            const parsed = JSON.parse(resp);
            return res.status(simRes.statusCode || 200).json(parsed);
          } catch (e) {
            return res.status(200).json({ success: true, raw: resp });
          }
        });
      });

      simReq.on('error', (err) => {
        return res.status(502).json({ success: false, message: err.message });
      });

      simReq.write(simData);
      simReq.end();
      return;
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // 4. WEBHOOK CALLBACK (WEBHOOK)
  if (req.method === 'POST' && action === 'webhook') {
    const secret = req.headers['x-secret'] || '';
    if (webhookSecret && secret !== webhookSecret) {
      return res.status(401).json({ success: false, message: 'Invalid X-Secret webhook header' });
    }

    const body = req.body || {};
    return res.status(200).json({
      success: true,
      received: true,
      order_id: body.order_id,
      status: body.status || 'completed'
    });
  }

  return res.status(404).json({ message: 'Action not found' });
};
