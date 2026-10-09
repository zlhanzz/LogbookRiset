# PANDUAN LENGKAP: SETUP GOOGLE SPREADSHEET & DEPLOY VERCEL

Dokumen ini berisi panduan praktis langkah-demi-langkah bagi Anda (Peneliti Lapangan) untuk mengaktifkan database online **Google Spreadsheet** dan men-deploy aplikasi ke **Vercel** agar bisa langsung digunakan di HP saat di lapangan.

---

## BAGIAN 1: Menghubungkan Google Spreadsheet Online (Database)

Sistem ini menggunakan Google Apps Script agar setiap kali Anda submit logbook di HP, datanya langsung terisi ke baris Google Spreadsheet dan foto tersimpan ke Google Drive Anda tanpa biaya sepeser pun.

### Langkah-Langkah:
1. **Buka Google Spreadsheet**:
   - Masuk ke peramban (browser) dan buka: [https://sheets.google.com](https://sheets.google.com).
   - Buat spreadsheet baru dan beri judul, misalnya:  
     `Database Logbook Riset Lapangan`
2. **Buka Apps Script**:
   - Di menu atas Spreadsheet, klik: **Ekstensi (Extensions) > Apps Script**.
3. **Salin Kode Backend**:
   - Hapus tulisan bawaan yang ada di editor Apps Script (`function myFunction() { ... }`).
   - Buka file [Code.gs](file:///c:/Users/ZHULL/Documents/Kuliah/Skripsi%20Penelitian/logbook-web/google-apps-script/Code.gs) di folder proyek ini.
   - Salin (Copy) seluruh isinya, lalu tempelkan (Paste) ke editor Apps Script.
   - Klik ikon **Simpan (Disket)** atau tekan `Ctrl + S`.
4. **Deploy sebagai Aplikasi Web**:
   - Di pojok kanan atas Apps Script, klik tombol biru **Deploy** (Terapkan) > pilih **Deployment baru** (New deployment).
   - Klik ikon roda gigi (Select type) di sebelah kiri > pilih **Aplikasi web** (Web app).
   - Isi konfigurasinya:
     - **Deskripsi**: `Backend Logbook Riset v1`
     - **Jalankan sebagai (Execute as)**: `Saya` (Me / email akun Google Anda)
     - **Yang memiliki akses (Who has access)**: **`Siapa saja` (Anyone)** *(Penting: harus 'Siapa saja' agar web di Vercel diizinkan mengirim data)*.
   - Klik tombol **Deploy** (Terapkan).
   - Google akan meminta izin (*Authorize access*):
     - Pilih akun Google Anda.
     - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced** (Lanjutan) di bagian bawah > klik **Go to Untitled project (unsafe)**.
     - Klik **Allow** (Izinkan).
5. **Salin URL Aplikasi Web**:
   - Salin teks **URL Aplikasi Web (Web App URL)** yang berakhiran `/exec`.  
     *(Contoh format: `https://script.google.com/macros/s/AKfycb.../exec`)*.
6. **Hubungkan ke Aplikasi**:
   - Di aplikasi web Logbook, klik ikon **Pengaturan (⚙️)** di pojok kanan atas.
   - Tempelkan URL tersebut ke kolom **URL Web App**, lalu klik **Uji Koneksi** dan **Simpan Pengaturan**.
   - Selesai! Indikator di pojok kanan atas akan langsung berwarna hijau: **Spreadsheet Terhubung**.

---

## BAGIAN 2: Cara Deploy ke Vercel (Gratis & Mudah)

Karena sesuai aturan sistem, deploy harus dilakukan oleh Anda secara manual, berikut adalah 2 cara termudah untuk mendeploy folder `logbook-web`:

### Cara A: Melalui Dashboard Web Vercel (Paling Direkomendasikan)
1. **Unggah Proyek ke GitHub Anda**:
   - Buat repositori baru di akun GitHub Anda (misal: `logbook-penelitian-lapangan`).
   - Unggah isi folder `logbook-web/` ke repositori tersebut.
2. **Impor ke Vercel**:
   - Buka [https://vercel.com](https://vercel.com) dan masuk menggunakan akun GitHub Anda.
   - Klik **Add New...** > pilih **Project**.
   - Pilih repositori `logbook-penelitian-lapangan` yang baru saja Anda buat.
   - Pada bagian **Root Directory**, jika Anda mengunggah seluruh folder skripsi, pilih folder `logbook-web`. Jika langsung mengunggah isi `logbook-web`, biarkan `./`.
   - Klik tombol **Deploy**.
3. Tunggu sekitar 20 detik, Vercel akan memberikan tautan publik domain Anda, misalnya:  
   `https://logbook-penelitian-lapangan.vercel.app`.
4. Anda sekarang bisa membuka tautan tersebut di HP Anda kapan saja dan di mana saja!

---

### Cara B: Menggunakan Vercel CLI (Lewat Terminal Laptop)
Jika Anda memiliki Vercel CLI di komputer:
1. Buka PowerShell atau Terminal di direktori `c:\Users\ZHULL\Documents\Kuliah\Skripsi Penelitian\logbook-web`.
2. Jalankan perintah:
   ```powershell
   npx vercel
   ```
3. Ikuti petunjuk singkat di layar (tekan Enter untuk menyetujui opsi default).
4. Untuk deploy ke production:
   ```powershell
   npx vercel --prod
   ```
5. URL web live akan langsung muncul di layar terminal Anda.

---

## BAGIAN 3: Panduan Penggunaan di Lapangan (Melalui HP)

1. **Jepret Dokumentasi Lapangan dengan GPS Cam**:
   - Saat berada di lokasi penelitian, buka aplikasi pihak ketiga **GPS Map Camera** di HP Anda.
   - Ambil foto responden, lokasi observasi, atau proses wawancara. Foto akan otomatis memiliki stempel tanggal, jam, dan koordinat GPS.
2. **Catat Logbook di Web Vercel**:
   - Buka tautan Vercel Anda di Chrome atau Safari HP.
   - Tekan tombol hijau **`+ Tambah Logbook Baru`**.
   - Pilih Kabupaten riset Anda.
   - Ketik Kecamatan dan Desa.
   - Pilih Kategori:
     - Jika memilih wawancara (*Kuantitatif / Kualitatif / Informan Kunci*), kolom **Kode RT / Nama Responden** akan muncul otomatis.
     - Jika memilih *dll*, kolom **Jenis Kegiatan Manual** akan muncul otomatis.
   - Masukkan jam mulai & jam selesai (durasi dihitung otomatis).
   - Tuliskan ringkasan deskripsi dan output capaian.
   - Pada bagian foto, ketuk area upload lalu pilih foto GPS Cam yang tadi baru saja Anda ambil dari galeri HP.
   - Tekan **Simpan ke Logbook & Spreadsheet**.
3. **Ekspor Laporan Word (.docx)**:
   - Kapan pun dosen pembimbing meminta rekap atau Anda ingin mencetak laporan:
   - Tekan tombol **Ekspor Word (.docx)** di dashboard web.
   - Pilih filter yang diinginkan:
     - *Wajo Saja (Kuantitatif saja)*
     - *Luwu Saja (Semua Aktivitas)*
     - Atau pilihan lainnya.
   - Tekan **Download Dokumen Word (.docx)**. File Word resmi berformat tabel rapi dan foto tersemat akan langsung terunduh ke HP Anda!
