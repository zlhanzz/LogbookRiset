/**
 * scripts/get_drive_refresh_token.js
 * Utilitas Otomatis untuk Menghasilkan GOOGLE_DRIVE_REFRESH_TOKEN
 * bagi Akun Google One Pribadi 5 TB (Google AI Pro).
 *
 * Cara Menjalankan:
 * node logbook-web/scripts/get_drive_refresh_token.js
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

let googleapis = null;
try {
  googleapis = require('googleapis');
} catch (e) {
  console.error("Pustaka 'googleapis' belum terinstal. Silakan jalankan: npm install googleapis");
  process.exit(1);
}

const { google } = googleapis;
const PORT = 8085;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/drive'];

function promptInput(questionText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(questionText, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function loadEnvFile(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

function appendOrUpdateEnv(envPath, updates) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  for (const [k, v] of Object.entries(updates)) {
    const regex = new RegExp(`^${k}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${k}=${v}`);
    } else {
      content += `\n${k}=${v}`;
    }
  }
  fs.writeFileSync(envPath, content.trim() + '\n', 'utf8');
}

async function main() {
  console.log('================================================================');
  console.log('  GENERATOR OAUTH 2.0 REFRESH TOKEN GOOGLE ONE 5 TB (AI PRO)   ');
  console.log('================================================================\n');

  const envPath = path.resolve(__dirname, '../.env');
  const env = loadEnvFile(envPath);

  let clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || env.GOOGLE_DRIVE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (!clientId) {
    clientId = await promptInput('Masukkan OAuth Client ID dari Google Cloud Console: ');
  } else {
    console.log(`Menggunakan Client ID dari .env: ${clientId.substring(0, 15)}...`);
  }

  if (!clientSecret) {
    clientSecret = await promptInput('Masukkan OAuth Client Secret: ');
  } else {
    console.log('Menggunakan Client Secret dari .env.');
  }

  if (!clientId || !clientSecret) {
    console.error('Client ID dan Client Secret wajib diisi.');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Memastikan refresh_token selalu diberikan
    scope: SCOPES
  });

  console.log('\n----------------------------------------------------------------');
  console.log('Langkah 1: Buka tautan berikut di peramban Anda:');
  console.log('----------------------------------------------------------------');
  console.log(authUrl);
  console.log('----------------------------------------------------------------\n');
  console.log(`Menunggu otorisasi di ${REDIRECT_URI}...\n`);

  // Menjalankan server lokal sementara untuk menangkap kode otorisasi
  const server = http.createServer(async (req, res) => {
    try {
      const parsed = url.parse(req.url, true);
      if (parsed.pathname === '/oauth2callback') {
        const code = parsed.query.code;
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end('<h1>Gagal: Kode otorisasi tidak ditemukan.</h1>');
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <div style="font-family:sans-serif; text-align:center; padding:40px;">
            <h2 style="color:#059669;">Otorisasi Berhasil!</h2>
            <p>Refresh token telah diterima oleh server terminal Anda. Anda dapat menutup tab ini.</p>
          </div>
        `);

        // Tukar kode dengan token
        const { tokens } = await oauth2Client.getToken(code);
        const refreshToken = tokens.refresh_token;

        if (!refreshToken) {
          console.warn('\n[Peringatan] Google tidak menyertakan refresh_token (mungkin sudah pernah diotorisasi sebelumnya).');
          console.log('Mencoba akses token:', tokens.access_token ? 'OK' : 'None');
        } else {
          console.log('\n================================================================');
          console.log('BERHASIL MENDAPATKAN REFRESH TOKEN:');
          console.log('================================================================');
          console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}\n`);

          // Simpan ke .env
          appendOrUpdateEnv(envPath, {
            GOOGLE_DRIVE_CLIENT_ID: clientId,
            GOOGLE_DRIVE_CLIENT_SECRET: clientSecret,
            GOOGLE_DRIVE_REFRESH_TOKEN: refreshToken,
            GOOGLE_DRIVE_REDIRECT_URI: REDIRECT_URI
          });

          console.log(`Konfigurasi otomatis tersimpan ke: ${envPath}`);
          console.log('Penyimpanan Google One 5 TB Anda sekarang siap digunakan 100%!');
          console.log('================================================================\n');
        }

        server.close();
        process.exit(0);
      }
    } catch (err) {
      console.error('Error saat menukar token:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Gagal menukar token: ' + err.message);
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    // Mencoba membuka URL otomatis di browser default (opsional)
    const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const { exec } = require('child_process');
    exec(`${startCmd} "" "${authUrl}"`, () => {});
  });
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
