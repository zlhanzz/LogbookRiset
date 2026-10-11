/**
 * functions/api/webhook.js
 * Cloudflare Pages Function: Alias endpoint untuk /api/webhook
 * Meneruskan panggilan ke payment/webhook.js
 */

export { onRequestOptions, onRequestGet, onRequestPost } from './payment/webhook.js';
