/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: BACKEND DATABASE LOGBOOK PENELITIAN SKRIPSI
 * Sistem Otomasi Logbook Aktivitas Penelitian Lapangan Mahasiswa
 * ============================================================================
 * 
 * ⚠️ PENTING: CARA UPDATE DEPLOYMENT SETELAH TEMPEL KODE INI:
 * 1. Hapus semua kode lama di Apps Script Anda, lalu TEMPEL (PASTE) SELURUH KODE INI.
 * 2. Klik tombol Simpan (ikon disket).
 * 3. AGAR GOOGLE MENJALANKAN KODE TERBARU (BUKAN KODE LAMA):
 *    - Klik menu "Deploy" di kanan atas > pilih "Kelola Deployment" (Manage Deployments).
 *    - Klik ikon PENSIL (Edit) di deployment Anda.
 *    - Pada kolom "Versi" (Version), ubah dropdown menjadi: "Versi baru" (New version).
 *    - Klik tombol "Deploy" (Terapkan) di kanan bawah.
 * 4. JIKA ADA BARIS KOSONG / HANTU DI GOOGLE SHEET ANDA:
 *    - Di editor Apps Script, pada dropdown fungsi di samping tombol "Debug", pilih fungsi:
 *      "cleanGhostRows" lalu klik "Jalankan" (Run).
 *    - Semua baris kosong / baris hantu di spreadsheet akan langsung terhapus otomatis!
 * ============================================================================
 */

const SHEET_NAME = "Logbook";
const FOLDER_NAME = "Dokumentasi_Logbook_Skripsi";

// Inisialisasi Header Sheet jika belum ada
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  if (sheet.getLastRow() === 0) {
    const headers = [
      "ID",
      "Timestamp Input",
      "Kabupaten",
      "Kecamatan",
      "Desa",
      "Jenis Kegiatan",
      "Sasaran / Kode RT / Responden",
      "Deskripsi Kegiatan",
      "Tanggal",
      "Waktu Mulai",
      "Waktu Selesai",
      "Durasi",
      "Output Capaian",
      "URL Foto Bukti (Google Drive)",
      "ID File Drive"
    ];
    
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#059669");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Dapatkan atau buat folder penyimpanan foto di Google Drive
function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const newFolder = DriveApp.createFolder(FOLDER_NAME);
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

// Endpoint GET: Mengambil seluruh riwayat logbook untuk ditampilkan di Dashboard Vercel
function doGet(e) {
  try {
    const sheet = setupSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return responseJSON({ success: true, count: 0, data: [] });
    }
    
    const rows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = String(row[0] || "").trim();
      const kab = String(row[2] || "").trim();
      const tgl = String(row[8] || "").trim();
      
      // FILTER KETAT: Abaikan baris kosong atau data hantu!
      // Baris wajib memiliki ID, Kabupaten valid, dan Tanggal valid
      if (!id || !kab || !tgl || kab === "-" || tgl === "-") continue;
      
      const item = {
        id: id,
        timestamp: row[1] instanceof Date ? row[1].toISOString() : String(row[1] || ""),
        kabupaten: kab,
        kecamatan: String(row[3] || ""),
        desa: String(row[4] || ""),
        jenisKegiatan: String(row[5] || ""),
        sasaranResponden: String(row[6] || ""),
        deskripsi: String(row[7] || ""),
        tanggal: row[8] instanceof Date ? Utilities.formatDate(row[8], Session.getScriptTimeZone(), "yyyy-MM-dd") : tgl,
        waktuMulai: String(row[9] || ""),
        waktuSelesai: String(row[10] || ""),
        durasi: String(row[11] || ""),
        output: String(row[12] || ""),
        fotoUrl: String(row[13] || ""),
        driveFileId: String(row[14] || "")
      };
      rows.push(item);
    }
    
    return responseJSON({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    return responseJSON({
      success: false,
      error: error.toString()
    });
  }
}

// Endpoint POST: Menerima entri baru, pembaruan (edit), atau penghapusan dari web Vercel
function doPost(e) {
  try {
    const sheet = setupSheet();
    const rawData = e.postData.contents;
    const payload = JSON.parse(rawData);
    const action = String(payload.action || "create").toLowerCase();

    // =========================================================================
    // AKSI 1: HAPUS LOGBOOK DARI SPREADSHEET
    // =========================================================================
    if (action === "delete") {
      const targetId = String(payload.id || "").trim();
      if (!targetId) {
        return responseJSON({ success: false, error: "ID logbook diperlukan untuk menghapus." });
      }

      const data = sheet.getDataRange().getValues();
      let deletedCount = 0;

      // Loop dari baris terbawah ke atas agar urutan indeks tidak bergeser saat baris dihapus
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0] || "").trim() === targetId) {
          sheet.deleteRow(i + 1);
          deletedCount++;
        }
      }

      return responseJSON({
        success: deletedCount > 0,
        message: `${deletedCount} baris logbook berhasil dihapus dari Google Spreadsheet.`
      });
    }

    // Hitung durasi aktivitas
    let durasi = "-";
    if (payload.waktuMulai && payload.waktuSelesai) {
      try {
        const pMulai = String(payload.waktuMulai).split(":");
        const pSelesai = String(payload.waktuSelesai).split(":");
        const menitMulai = parseInt(pMulai[0]) * 60 + parseInt(pMulai[1]);
        const menitSelesai = parseInt(pSelesai[0]) * 60 + parseInt(pSelesai[1]);
        const selisih = menitSelesai - menitMulai;
        if (selisih > 0) {
          const jam = Math.floor(selisih / 60);
          const menit = selisih % 60;
          durasi = (jam > 0 ? jam + " jam " : "") + (menit > 0 ? menit + " menit" : "");
        }
      } catch (tErr) {
        durasi = "-";
      }
    }

    // Tangani unggah foto ke Google Drive jika ada berkas base64 baru
    let fotoUrl = payload.fotoUrl || "";
    let driveFileId = payload.driveFileId || "";

    if (payload.fotoBase64 && String(payload.fotoBase64).startsWith("data:image")) {
      try {
        const folder = getOrCreateFolder();
        const base64Data = payload.fotoBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const decodedBytes = Utilities.base64Decode(base64Data);

        const fileName = "LOG_" + (payload.kabupaten || "DOC") + "_" + (payload.tanggal || "TGL") + "_" + new Date().getTime() + ".jpg";
        const blob = Utilities.newBlob(decodedBytes, "image/jpeg", fileName);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        driveFileId = file.getId();
        fotoUrl = "https://lh3.googleusercontent.com/d/" + driveFileId;
      } catch (imgErr) {
        Logger.log("Gagal upload foto: " + imgErr.toString());
      }
    }

    const targetId = String(payload.id || ("LOG-" + new Date().getTime())).trim();
    const now = new Date();

    // =========================================================================
    // AKSI 2: EDIT / UPDATE LOGBOOK
    // =========================================================================
    if (action === "update") {
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;

      // Cari baris yang cocok dengan targetId
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || "").trim() === targetId) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex !== -1) {
        const rowNum = foundIndex + 1;
        // Pertahankan foto lama jika tidak ada unggahan foto baru
        if (!fotoUrl) fotoUrl = String(data[foundIndex][13] || "");
        if (!driveFileId) driveFileId = String(data[foundIndex][14] || "");

        sheet.getRange(rowNum, 3).setValue(payload.kabupaten || "");
        sheet.getRange(rowNum, 4).setValue(payload.kecamatan || "");
        sheet.getRange(rowNum, 5).setValue(payload.desa || "");
        sheet.getRange(rowNum, 6).setValue(payload.jenisKegiatan || "");
        sheet.getRange(rowNum, 7).setValue(payload.sasaranResponden || "");
        sheet.getRange(rowNum, 8).setValue(payload.deskripsi || "");
        sheet.getRange(rowNum, 9).setValue(payload.tanggal || "");
        sheet.getRange(rowNum, 10).setValue(payload.waktuMulai || "");
        sheet.getRange(rowNum, 11).setValue(payload.waktuSelesai || "");
        sheet.getRange(rowNum, 12).setValue(durasi);
        sheet.getRange(rowNum, 13).setValue(payload.output || "");
        sheet.getRange(rowNum, 14).setValue(fotoUrl);
        sheet.getRange(rowNum, 15).setValue(driveFileId);

        // Bersihkan duplikat lain jika sebelumnya ada baris duplikat dengan ID yang sama
        for (let i = data.length - 1; i > foundIndex; i--) {
          if (String(data[i][0] || "").trim() === targetId) {
            sheet.deleteRow(i + 1);
          }
        }

        return responseJSON({
          success: true,
          message: "Logbook berhasil diperbarui di baris yang sama!",
          data: { id: targetId, fotoUrl: fotoUrl, driveFileId: driveFileId }
        });
      }
      // Jika ID tidak ditemukan untuk update, JANGAN lakukan append row kosong!
      return responseJSON({
        success: false,
        error: "ID tidak ditemukan untuk diperbarui."
      });
    }

    // =========================================================================
    // AKSI 3: TAMBAH LOGBOOK BARU (CREATE)
    // =========================================================================
    // VALIDASI KETAT: Tolak penambahan baris jika kabupaten atau tanggal kosong!
    if (!payload.kabupaten || !payload.tanggal || String(payload.kabupaten).trim() === "" || String(payload.tanggal).trim() === "") {
      return responseJSON({
        success: false,
        error: "Ditolak: Data Kabupaten dan Tanggal wajib diisi agar tidak membuat baris kosong."
      });
    }

    const newRow = [
      targetId,
      now,
      payload.kabupaten || "",
      payload.kecamatan || "",
      payload.desa || "",
      payload.jenisKegiatan || "",
      payload.sasaranResponden || "",
      payload.deskripsi || "",
      payload.tanggal || "",
      payload.waktuMulai || "",
      payload.waktuSelesai || "",
      durasi,
      payload.output || "",
      fotoUrl,
      driveFileId
    ];

    sheet.appendRow(newRow);

    const savedItem = {
      id: targetId,
      timestamp: now.toISOString(),
      kabupaten: payload.kabupaten || "",
      kecamatan: payload.kecamatan || "",
      desa: payload.desa || "",
      jenisKegiatan: payload.jenisKegiatan || "",
      sasaranResponden: payload.sasaranResponden || "",
      deskripsi: payload.deskripsi || "",
      tanggal: payload.tanggal || "",
      waktuMulai: payload.waktuMulai || "",
      waktuSelesai: payload.waktuSelesai || "",
      durasi: durasi,
      output: payload.output || "",
      fotoUrl: fotoUrl,
      driveFileId: driveFileId
    };

    return responseJSON({
      success: true,
      message: "Logbook berhasil disimpan ke Google Spreadsheet!",
      data: savedItem
    });

  } catch (error) {
    return responseJSON({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * FUNGSI PEMBERSIH BARIS HANTU (GHOST ROWS CLEANER)
 * Jalankan fungsi ini sekali di Apps Script untuk langsung menghapus semua baris kosong
 * yang terlanjur ada di Google Spreadsheet Anda!
 */
function cleanGhostRows() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  let count = 0;

  // Loop mundur dari bawah ke atas agar penghapusan baris tidak merusak indeks
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const id = String(row[0] || "").trim();
    const kab = String(row[2] || "").trim();
    const tgl = String(row[8] || "").trim();

    // Jika kabupaten atau tanggal kosong -> ini baris hantu, hapus!
    if (!kab || !tgl || kab === "-" || tgl === "-") {
      sheet.deleteRow(i + 1);
      count++;
    }
  }

  Logger.log("Selesai! Sebanyak " + count + " baris hantu berhasil dihapus dari spreadsheet.");
}

// Helper untuk respons JSON dengan header CORS yang aman
function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
