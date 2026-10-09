/**
 * ============================================================================
 * MODUL KONFIGURASI GOOGLE FIREBASE (FIREBASE CONFIG & INITIALIZATION)
 * Mendukung Auth (Google Sign-In), Cloud Firestore, dan Firebase Storage CDN
 * Mengutamakan privasi dengan membaca konfigurasi dinamis dari /api/config (.env)
 * ============================================================================
 */

const FirebaseService = {
  auth: null,
  db: null,
  storage: null,
  isInitialized: false,
  isDemoMode: false,
  currentConfig: null,

  // Kunci penyimpanan LocalStorage
  STORAGE_KEYS: {
    FIREBASE_CONFIG: "LOGBOOK_FIREBASE_CONFIG_JSON",
    USER_PROFILE: "LOGBOOK_USER_RESEARCH_PROFILE_V2"
  },

  // Konfigurasi bawaan aman proyek logbook-penelitian (Fallback)
  defaultConfig: {
    apiKey: "AIzaSyCySXZ-kHNIWsbBYI20WgsaHYKNfgVlOgA",
    authDomain: "logbook-penelitian.firebaseapp.com",
    projectId: "logbook-penelitian",
    storageBucket: "logbook-penelitian.firebasestorage.app",
    messagingSenderId: "934508297769",
    appId: "1:934508297769:web:ee5bb99f79b662041ee638",
    measurementId: "G-09EJTYXWFV"
  },

  /**
   * Mengambil konfigurasi dinamis dari server (.env / Vercel Environment Variables)
   */
  async fetchRemoteConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.apiKey && data.projectId) {
          console.log("Konfigurasi Firebase berhasil dimuat dari variabel lingkungan (.env / API).");
          return data;
        }
      }
    } catch (e) {
      // Endpoint /api/config mungkin tidak aktif jika diakses offline murni
    }
    return null;
  },

  /**
   * Mendapatkan konfigurasi Firebase yang aktif (dari LocalStorage atau default)
   */
  getActiveConfig() {
    if (this.currentConfig) return this.currentConfig;

    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.FIREBASE_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Gagal membaca konfigurasi Firebase dari localStorage:", e);
    }
    return this.defaultConfig;
  },

  /**
   * Menyimpan konfigurasi Firebase kustom pengguna
   */
  async saveConfig(configObj) {
    if (!configObj || !configObj.apiKey || !configObj.projectId) {
      throw new Error("Konfigurasi Firebase harus memiliki apiKey dan projectId valid.");
    }
    localStorage.setItem(this.STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(configObj));
    this.currentConfig = configObj;
    return await this.initialize();
  },

  /**
   * Menghapus konfigurasi kustom & beralih ke mode demo lokal
   */
  clearConfig() {
    localStorage.removeItem(this.STORAGE_KEYS.FIREBASE_CONFIG);
    this.currentConfig = null;
    this.isInitialized = false;
    this.isDemoMode = true;
    this.auth = null;
    this.db = null;
    this.storage = null;
  },

  /**
   * Inisialisasi Firebase App, Auth, Firestore, dan Storage
   */
  async initialize() {
    // 1. Coba ambil konfigurasi privat dari .env (/api/config)
    let config = await this.fetchRemoteConfig();
    if (!config) {
      config = this.getActiveConfig();
    }
    this.currentConfig = config;

    // Periksa ketersediaan library Firebase Compat via CDN
    if (typeof firebase === "undefined") {
      console.warn("Firebase SDK belum dimuat. Beralih ke Mode Demo Offline.");
      this.isDemoMode = true;
      this.isInitialized = false;
      return false;
    }

    if (!config || !config.apiKey || !config.projectId) {
      console.info("Konfigurasi Firebase belum diisi. Berjalan dalam Mode Demo/Uji Coba Mahasiswa.");
      this.isDemoMode = true;
      this.isInitialized = false;
      return false;
    }

    try {
      // Inisialisasi atau gunakan app yang sudah ada
      let app;
      if (!firebase.apps.length) {
        app = firebase.initializeApp(config);
      } else {
        app = firebase.app();
      }

      this.auth = firebase.auth();
      this.db = firebase.firestore();

      // Aktifkan persistensi offline Firestore untuk riset di daerah pelosok perkebunan
      try {
        this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
          if (err.code === 'failed-precondition') {
            console.warn("Firestore persistence dibatasi oleh tab browser yang aktif bersamaan.");
          } else if (err.code === 'unimplemented') {
            console.warn("Browser tidak mendukung Firestore offline persistence.");
          }
        });
      } catch (errPersist) {
        // Abaikan jika sudah diaktifkan sebelumnya
      }

      // Inisialisasi Firebase Storage jika bucket tersedia
      if (config.storageBucket && firebase.storage) {
        this.storage = firebase.storage();
      }

      this.isInitialized = true;
      this.isDemoMode = false;
      console.log("Firebase Cloud aktif untuk Project ID:", config.projectId);
      return true;
    } catch (e) {
      console.error("Gagal menginisialisasi Firebase:", e);
      this.isDemoMode = true;
      this.isInitialized = false;
      return false;
    }
  },

  /**
   * Helper unggah file gambar ke Firebase Storage dengan CDN URL permanen
   */
  async uploadPhoto(userId, fileOrBase64, customDocId) {
    if (!this.storage || this.isDemoMode) {
      // Fallback untuk demo mode: kembalikan data URL langsung
      return typeof fileOrBase64 === "string" ? fileOrBase64 : null;
    }

    try {
      const fileId = customDocId || `photo_${Date.now()}`;
      const storageRef = this.storage.ref().child(`users/${userId}/photos/${fileId}.jpg`);

      let snapshot;
      if (typeof fileOrBase64 === "string" && fileOrBase64.startsWith("data:image")) {
        // Upload format data_url
        snapshot = await storageRef.putString(fileOrBase64, 'data_url', {
          contentType: 'image/jpeg'
        });
      } else {
        // Upload File/Blob
        snapshot = await storageRef.put(fileOrBase64, {
          contentType: 'image/jpeg'
        });
      }

      const downloadUrl = await snapshot.ref.getDownloadURL();
      return downloadUrl;
    } catch (e) {
      console.error("Gagal mengunggah foto ke Firebase Storage:", e);
      // Fallback jika upload storage gagal (misal security rule belum terpasang), tetap return data base64 lokal
      if (typeof fileOrBase64 === "string") return fileOrBase64;
      throw e;
    }
  }
};

window.FirebaseService = FirebaseService;
