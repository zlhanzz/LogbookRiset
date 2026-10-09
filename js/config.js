/**
 * KONFIGURASI APLIKASI LOGBOOK PENELITIAN
 * Sistem Otomasi Logbook Aktivitas Penelitian Lapangan Mahasiswa
 */

const CONFIG = {
  // Nama Peneliti & Proyek
  APP_TITLE: "Logbook Aktivitas Penelitian Lapangan",
  RESEARCHER_NAME: "Peneliti Mahasiswa",
  STUDENT_ID: "0000000000",
  INSTITUTION: "Program Studi / Perguruan Tinggi Anda",
  RESEARCH_TOPIC: "Penelitian Lapangan & Pengambilan Data Mandiri",
  
  // URL Webhook Google Apps Script bawaan (Bisa diisi di sini atau diinput via menu Pengaturan di web)
  // Format URL: https://script.google.com/macros/s/AKfycbx.../exec
  DEFAULT_WEBHOOK_URL: "",
  
  // Storage Key LocalStorage
  STORAGE_KEYS: {
    WEBHOOK_URL: "LOGBOOK_CONFIG_WEBHOOK_URL",
    LOGBOOK_DATA: "LOGBOOK_LOCAL_ENTRIES_V1",
    PENDING_SYNC: "LOGBOOK_PENDING_SYNC_QUEUE"
  },
  
  // Rekomendasi Wilayah Simulasi Contoh
  KECAMATAN_RECOMMENDATIONS: {
    "Kabupaten A": [
      "Kecamatan Contoh 1",
      "Kecamatan Contoh 2"
    ],
    "Kabupaten B": [
      "Kecamatan Contoh 3",
      "Kecamatan Contoh 4"
    ]
  },
  
  // Opsi Jenis Kegiatan
  ACTIVITY_TYPES: [
    { id: "kuantitatif", label: "Wawancara Kuantitatif", isInterview: true },
    { id: "kualitatif", label: "Wawancara Kualitatif/Deviant Case", isInterview: true },
    { id: "informan_kunci", label: "Wawancara Informan Kunci", isInterview: true },
    { id: "dll", label: "dll (Lainnya)", isInterview: false, isCustom: true }
  ],

  // Data Demo Awal (Untuk tampilan awal sebelum menghubungkan Google Sheet)
  INITIAL_DEMO_DATA: [
    {
      id: "LOG-DEMO-001",
      timestamp: "2026-10-07T09:00:00.000Z",
      kabupaten: "Kabupaten A",
      kecamatan: "Kecamatan Contoh 1",
      desa: "Desa Contoh 1",
      jenisKegiatan: "Wawancara Informan Kunci",
      sasaranResponden: "[Contoh] Tokoh Masyarakat / Informan Kunci (Data Simulasi)",
      deskripsi: "[DATA CONTOH SIMULASI] Wawancara mendalam simulasi untuk pengujian format rekapitulasi lapangan, pencatatan durasi kegiatan, dan kesiapan berkas pendukung skripsi.",
      tanggal: "2026-10-07",
      waktuMulai: "09:00",
      waktuSelesai: "10:45",
      durasi: "1 jam 45 menit",
      output: "[Output Contoh] Transkrip poin-poin hasil wawancara informan kunci (simulasi)",
      fotoUrl: "/assets/dummy_gps_cam_01.jpg",
      driveFileId: ""
    },
    {
      id: "LOG-DEMO-002",
      timestamp: "2026-10-06T13:30:00.000Z",
      kabupaten: "Kabupaten B",
      kecamatan: "Kecamatan Contoh 2",
      desa: "Desa Contoh 2",
      jenisKegiatan: "Wawancara Petani Responden",
      sasaranResponden: "[Contoh] Responden Petani Sampel (Data Simulasi)",
      deskripsi: "[DATA CONTOH SIMULASI] Wawancara terstruktur simulasi mengenai faktor produksi, teknik budidaya lapangan, dan verifikasi kuesioner penelitian.",
      tanggal: "2026-10-06",
      waktuMulai: "13:30",
      waktuSelesai: "15:00",
      durasi: "1 jam 30 menit",
      output: "[Output Contoh] Lembar isian kuesioner responden penelitian lapangan (simulasi)",
      fotoUrl: "/assets/dummy_gps_cam_02.jpg",
      driveFileId: ""
    },
    {
      id: "LOG-DEMO-003",
      timestamp: "2026-10-05T08:15:00.000Z",
      kabupaten: "Kabupaten A",
      kecamatan: "Kecamatan Contoh 1",
      desa: "Desa Contoh 3",
      jenisKegiatan: "Observasi Lapangan & Perkebunan",
      sasaranResponden: "[Contoh] Pengurus Kelompok Tani (Data Simulasi)",
      deskripsi: "[DATA CONTOH SIMULASI] Observasi fisik perkebunan dan verifikasi koordinat stempel GPS Map Camera pada plot pengamatan lahan.",
      tanggal: "2026-10-05",
      waktuMulai: "08:15",
      waktuSelesai: "11:00",
      durasi: "2 jam 45 menit",
      output: "[Output Contoh] Dokumentasi kondisi lahan dan stempel koordinat lapangan (simulasi)",
      fotoUrl: "/assets/dummy_gps_cam_03.jpg",
      driveFileId: ""
    }
  ]
};

// Ambil URL Webhook aktif (dari localStorage jika ada, fallback ke config)
function getActiveWebhookUrl() {
  const customUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.WEBHOOK_URL);
  if (customUrl && customUrl.trim() !== "") {
    return customUrl.trim();
  }
  return CONFIG.DEFAULT_WEBHOOK_URL;
}

// Simpan URL Webhook kustom
function setActiveWebhookUrl(url) {
  if (url && url.trim() !== "") {
    localStorage.setItem(CONFIG.STORAGE_KEYS.WEBHOOK_URL, url.trim());
  } else {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.WEBHOOK_URL);
  }
}
