/**
 * functions/api/payment/index.js
 * Cloudflare Pages Function untuk menangani panggilan ke /api/payment (dengan query atau body action)
 */

import { onRequestPost as handleCreate } from './create.js';
import { onRequestGet as handleStatus } from './status.js';
import { onRequestPost as handleSimulate } from './simulate.js';
import { onRequestPost as handleWebhook } from './webhook.js';

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

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || '';

  if (request.method === 'GET' && (action === 'status' || url.searchParams.get('txn_id') || url.searchParams.get('order_id'))) {
    return handleStatus(context);
  }

  if (request.method === 'POST') {
    if (action === 'simulate') return handleSimulate(context);
    if (action === 'webhook') return handleWebhook(context);
    return handleCreate(context);
  }

  return new Response(JSON.stringify({ success: false, message: 'Action not found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
