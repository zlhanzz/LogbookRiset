/**
 * functions/api/config.js
 * Cloudflare Pages Function untuk mengembalikan konfigurasi publik Firebase dari environment variables
 * Endpoint: GET /api/config
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  const config = {
    apiKey: (env && env.FIREBASE_API_KEY) || 'AIzaSyCySXZ-kHNIWsbBYI20WgsaHYKNfgVlOgA',
    authDomain: (env && env.FIREBASE_AUTH_DOMAIN) || 'logbook-penelitian.firebaseapp.com',
    projectId: (env && env.FIREBASE_PROJECT_ID) || 'logbook-penelitian',
    storageBucket: (env && env.FIREBASE_STORAGE_BUCKET) || 'logbook-penelitian.firebasestorage.app',
    messagingSenderId: (env && env.FIREBASE_MESSAGING_SENDER_ID) || '934508297769',
    appId: (env && env.FIREBASE_APP_ID) || '1:934508297769:web:ee5bb99f79b662041ee638',
    measurementId: (env && env.FIREBASE_MEASUREMENT_ID) || 'G-09EJTYXWFV'
  };

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
