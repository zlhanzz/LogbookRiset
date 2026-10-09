# PANDUAN AKTIVASI CLOUD GOOGLE FIREBASE & KEAMANAN DATA (LOGBOOKRISET.ID)

Dokumen ini adalah panduan lengkap untuk mengelola backend **Google Firebase** (Cloud Firestore NoSQL, Firebase Authentication, dan Firebase Storage CDN) dengan prioritas utama pada **privasi kredensial (.env)** dan **aturan keamanan database (Security Rules)**.

---

## 🔒 1. Privasi Kredensial API (.env & Git Protection)

Kredensial API resmi proyek Anda telah dipindahkan ke file lingkungan privat:
- File lokal: `logbook-web/.env`
- File template: `logbook-web/.env.example`
- Proteksi git: Terkunci di `.gitignore` (tidak akan pernah bocor ke GitHub publik).

### Konfigurasi Resmi yang Terpasang di `.env`:
```env
FIREBASE_API_KEY=AIzaSyCySXZ-kHNIWsbBYI20WgsaHYKNfgVlOgA
FIREBASE_AUTH_DOMAIN=logbook-penelitian.firebaseapp.com
FIREBASE_PROJECT_ID=logbook-penelitian
FIREBASE_STORAGE_BUCKET=logbook-penelitian.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=934508297769
FIREBASE_APP_ID=1:934508297769:web:ee5bb99f79b662041ee638
FIREBASE_MEASUREMENT_ID=G-09EJTYXWFV
```

Aplikasi web membaca kredensial ini secara dinamis melalui endpoint privat `/api/config`, sehingga kode sumber Anda 100% bersih dari *hardcoded keys*.

---

## 🛡️ 2. Setup Aturan Keamanan Firestore (Firestore Security Rules)

Agar data riset antar mahasiswa tidak dapat dibaca atau dimodifikasi oleh orang lain, Anda wajib menerapkan aturan keamanan ini di Firebase Console:

### Langkah Pemasangan:
1. Buka **[console.firebase.google.com](https://console.firebase.google.com)** > Pilih proyek **logbook-penelitian**.
2. Di menu kiri, klik **Build > Firestore Database**.
3. Klik tab **Rules** (Aturan) di bagian atas.
4. Ganti seluruh isi editor dengan kode berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: cek apakah pengguna sudah login
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper: cek apakah pengguna adalah pemilik data
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Dokumen Profil Peneliti: users/{userId}
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      // Subkoleksi Logbook Aktivitas Riset: users/{userId}/logbooks/{logbookId}
      match /logbooks/{logbookId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Tolak semua akses dokumen di luar koleksi users
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
5. Klik tombol **Publish** (Publikasikan).

---

## 📸 3. Setup Aturan Keamanan Storage (Firebase Storage Rules)

Aturan ini memastikan hanya pemilik akun yang dapat mengunggah dan menghapus foto miliknya, namun foto tetap dapat dimuat di dokumen Word dan Lightbox tanpa hambatan.

### Langkah Pemasangan:
1. Di Firebase Console, klik menu **Build > Storage**.
2. Klik tab **Rules** (Aturan) di bagian atas.
3. Ganti seluruh isi editor dengan kode berikut:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Folder foto GPS Cam: users/{userId}/photos/{photoId}
    match /users/{userId}/photos/{photoId} {
      // Baca diizinkan secara publik agar tautan CDN foto dapat di-embed ke Microsoft Word
      allow read: if true;

      // Hanya pemilik akun yang dapat mengunggah dan menghapus foto miliknya
      allow write, delete: if isOwner(userId)
        && request.resource.size < 10 * 1024 * 1024 // Maksimal 10 MB per foto
        && request.resource.contentType.matches('image/.*'); // Hanya file gambar
    }

    // Tolak semua akses di luar folder users
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```
4. Klik tombol **Publish** (Publikasikan).

---

## 🔑 4. Memastikan Autentikasi Berfungsi (Google & Email)

### A. Pastikan Provider Aktif di Firebase Console:
1. Di Firebase Console, klik **Build > Authentication > Sign-in method**.
2. Pastikan:
   - **Google**: Berstatus **Enabled** (Aktif).
   - **Email/Password**: Berstatus **Enabled** (Aktif).
3. Di tab **Settings > Authorized domains**, pastikan `localhost` dan domain Vercel Anda sudah terdaftar (biasanya `localhost` sudah terdaftar otomatis).

### B. Cara Menguji di Aplikasi Web:
1. Buka web di laptop Anda: **[http://localhost:3000](http://localhost:3000)**.
2. Di pojok kanan atas, klik tombol avatar atau badge **Mode Demo (Klik Masuk)**.
3. Klik tombol **"Masuk Cepat dengan Akun Google"** atau gunakan formulir **Email & Sandi**.
4. Begitu berhasil masuk:
   - Badge status di header akan berubah menjadi **`🟢 Cloud Firebase`**.
   - Nama dan inisial akun Google/Email Anda akan otomatis muncul di header.
   - Semua catatan baru akan tersimpan langsung di Cloud Firestore Anda di path `users/{UID}/logbooks`.

---

## 🚀 5. Mengatur Environment Variables di Vercel (Produksi)

Ketika Anda melakukan deploy ke Vercel agar dapat digunakan di HP:
1. Buka dashboard proyek Anda di **vercel.com**.
2. Masuk ke **Settings > Environment Variables**.
3. Tambahkan 7 variabel berikut sesuai isi `.env`:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`
4. Jalankan perintah deploy manual:
   ```powershell
   cd "c:\Users\ZHULL\Documents\Kuliah\Skripsi Penelitian\logbook-web"
   vercel --prod
   ```
