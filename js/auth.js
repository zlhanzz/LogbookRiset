/**
 * Modul Autentikasi & Langganan (Auth & Subscription Manager)
 * Mengelola Otentikasi Pengguna Firebase (Google & Email/Sandi),
 * Verifikasi Email, Reset Kata Sandi, dan Status Akses Langganan.
 */

const AuthManager = {
  currentUser: null,
  userProfile: null,
  subscription: {
    status: "inactive",
    activeUntil: null,
    amount: 50000,
    orderId: null
  },
  MAX_TRIAL_LOGBOOKS: 5,
  trialUsage: {
    createdCount: 0,
    limit: 5
  },
  onUserChangedCallbacks: [],

  STORAGE_KEYS: {
    LOCAL_USER: "LOGBOOK_AUTH_USER_V3",
    LOCAL_SUBSCRIPTION: "LOGBOOK_SUBSCRIPTION_V3", // Legacy key, dibersihkan otomatis
    DISMISSED_DUMMY: "LOGBOOK_DISMISSED_DUMMY_V3"
  },

  /**
   * Mengembalikan objek default status langganan tidak aktif
   */
  getDefaultSubscription() {
    return {
      status: "inactive",
      activeUntil: null,
      amount: 50000,
      orderId: null
    };
  },

  /**
   * Kunci penyimpanan lokal ber-namespace UID
   */
  getSubscriptionStorageKey(uid) {
    if (!uid) return null;
    return `LOGBOOK_SUBSCRIPTION_V3_${uid}`;
  },

  getTrialStorageKey(uid) {
    if (!uid) return null;
    return `LOGBOOK_TRIAL_USAGE_V3_${uid}`;
  },

  getTrialCreatedCount() {
    return Number(this.trialUsage?.createdCount || 0);
  },

  getRemainingTrialQuota() {
    if (this.isSubscribed()) return Infinity;
    const used = this.getTrialCreatedCount();
    return Math.max(0, this.MAX_TRIAL_LOGBOOKS - used);
  },

  hasTrialQuota() {
    if (this.isSubscribed()) return true;
    return this.getRemainingTrialQuota() > 0;
  },

  canCreateLogbook() {
    return this.isSubscribed() || this.hasTrialQuota();
  },

  loadTrialUsageFromCache(uid) {
    if (!uid) {
      this.trialUsage.createdCount = 0;
      return;
    }
    try {
      const key = this.getTrialStorageKey(uid);
      const val = key ? localStorage.getItem(key) : null;
      if (val !== null && !isNaN(Number(val))) {
        this.trialUsage.createdCount = Math.max(0, parseInt(val, 10));
      } else {
        this.trialUsage.createdCount = 0;
      }
    } catch (e) {
      this.trialUsage.createdCount = 0;
    }
  },

  saveTrialUsageToCache(uid) {
    if (!uid) return;
    try {
      const key = this.getTrialStorageKey(uid);
      if (key) {
        localStorage.setItem(key, String(this.getTrialCreatedCount()));
      }
    } catch (e) {}
  },

  async incrementTrialUsage(uid) {
    if (!uid) return this.getTrialCreatedCount();
    if (this.isSubscribed()) return Infinity;

    const current = this.getTrialCreatedCount();
    const nextVal = current + 1;
    this.trialUsage.createdCount = nextVal;
    this.saveTrialUsageToCache(uid);

    if (window.FirebaseService && FirebaseService.db) {
      try {
        await FirebaseService.db.collection("users").doc(uid).set({
          trial_created_count: nextVal,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Gagal update trial_created_count di Firestore:", dbErr);
      }
    }
    return nextVal;
  },

  clearSubscriptionCache(uid) {
    if (uid) {
      try {
        localStorage.removeItem(this.getSubscriptionStorageKey(uid));
      } catch (e) {}
    }
  },

  isDummyDismissed(uid) {
    if (!uid) return false;
    if (this._dummyDismissedMap && typeof this._dummyDismissedMap[uid] === "boolean") {
      return this._dummyDismissedMap[uid];
    }
    try {
      const val = localStorage.getItem(`${this.STORAGE_KEYS.DISMISSED_DUMMY}_${uid}`);
      return val === "true";
    } catch (e) {
      return false;
    }
  },

  setDummyDismissed(uid, dismissed = true) {
    if (!uid) return;
    if (!this._dummyDismissedMap) this._dummyDismissedMap = {};
    this._dummyDismissedMap[uid] = Boolean(dismissed);

    try {
      if (dismissed) {
        localStorage.setItem(`${this.STORAGE_KEYS.DISMISSED_DUMMY}_${uid}`, "true");
      } else {
        localStorage.removeItem(`${this.STORAGE_KEYS.DISMISSED_DUMMY}_${uid}`);
      }
    } catch (e) {}

    // Persistensi sinkronisasi Cloud Firestore jika database aktif
    if (window.FirebaseService && FirebaseService.db) {
      try {
        FirebaseService.db.collection("users").doc(uid).set({
          dummy_dismissed: Boolean(dismissed),
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => {
          console.warn("Gagal simpan dummy_dismissed ke Firestore:", err);
        });
      } catch (err) {}
    }
  },

  // 3 Catatan Logbook Contoh (Dummy Data) untuk Pratinjau Dashboard & Ekspor Word
  INITIAL_DUMMY_LOGBOOKS: [
    {
      id: "dummy_entry_01",
      tanggal: "2026-10-07",
      waktuMulai: "09:00",
      waktuSelesai: "10:45",
      durasi: "1 jam 45 menit",
      kabupaten: "Kabupaten A",
      kecamatan: "Kecamatan Contoh 1",
      desa: "Desa Contoh 1",
      jenisKegiatan: "Wawancara Informan Kunci",
      sasaranResponden: "[Contoh] Tokoh Masyarakat / Informan Kunci (Data Simulasi)",
      deskripsi: "[DATA CONTOH SIMULASI] Wawancara mendalam simulasi untuk pengujian format rekapitulasi lapangan, pencatatan durasi kegiatan, dan kesiapan berkas laporan kegiatan riset.",
      output: "[Output Contoh] Transkrip poin-poin hasil wawancara informan kunci (simulasi)",
      fotoUrl: "/assets/dummy_gps_cam_01.jpg",
      isDummy: true
    },
    {
      id: "dummy_entry_02",
      tanggal: "2026-10-06",
      waktuMulai: "13:30",
      waktuSelesai: "15:00",
      durasi: "1 jam 30 menit",
      kabupaten: "Kabupaten B",
      kecamatan: "Kecamatan Contoh 2",
      desa: "Desa Contoh 2",
      jenisKegiatan: "Wawancara Petani Responden",
      sasaranResponden: "[Contoh] Responden Petani Sampel (Data Simulasi)",
      deskripsi: "[DATA CONTOH SIMULASI] Wawancara terstruktur simulasi mengenai faktor produksi, teknik budidaya lapangan, dan verifikasi kuesioner penelitian.",
      output: "[Output Contoh] Lembar isian kuesioner responden penelitian lapangan (simulasi)",
      fotoUrl: "/assets/dummy_gps_cam_02.jpg",
      isDummy: true
    },
    {
      id: "dummy_entry_03",
      tanggal: "2026-10-05",
      waktuMulai: "08:15",
      waktuSelesai: "11:00",
      durasi: "2 jam 45 menit",
      kabupaten: "Kabupaten A",
      kecamatan: "Kecamatan Contoh 1",
      desa: "Desa Contoh 3",
      jenisKegiatan: "Observasi Lapangan & Perkebunan",
      sasaranResponden: "[Contoh] Pengurus Kelompok Tani (Data Simulasi)",
      deskripsi: "[DATA CONTOH SIMULASI] Observasi fisik perkebunan dan verifikasi koordinat stempel GPS Map Camera pada plot pengamatan lahan.",
      output: "[Output Contoh] Dokumentasi kondisi lahan dan stempel koordinat lapangan (simulasi)",
      fotoUrl: "/assets/dummy_gps_cam_03.jpg",
      isDummy: true
    }
  ],

  isAuthReady: false,
  authReadyPromise: null,
  _resolveAuthReady: null,

  /**
   * Inisialisasi Auth Listener
   */
  async init() {
    this.authReadyPromise = new Promise((resolve) => {
      this._resolveAuthReady = resolve;
    });

    // Bersihkan legacy cache global tanpa UID agar tidak membocorkan data lama
    try {
      localStorage.removeItem(this.STORAGE_KEYS.LOCAL_SUBSCRIPTION);
      const activeOrder = localStorage.getItem("LOGBOOK_ACTIVE_PAYMENT_ORDER");
      if (activeOrder) {
        const parsed = JSON.parse(activeOrder);
        if (!parsed || !parsed.userId) {
          localStorage.removeItem("LOGBOOK_ACTIVE_PAYMENT_ORDER");
        }
      }
    } catch (e) {}

    this.subscription = this.getDefaultSubscription();

    if (window.FirebaseService) {
      if (!FirebaseService.isInitialized) {
        await FirebaseService.initialize();
      }
      if (FirebaseService.auth) {
        FirebaseService.auth.onAuthStateChanged(async (user) => {
          if (user) {
            this.currentUser = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split("@")[0],
              photoURL: user.photoURL || null,
              emailVerified: Boolean(user.emailVerified),
              isDemo: false
            };
            // Reset status langganan ke default sebelum memuat milik UID ini
            this.subscription = this.getDefaultSubscription();
            this.trialUsage = { createdCount: 0, limit: this.MAX_TRIAL_LOGBOOKS };
            await this.syncUserDataFromFirestore(user.uid);
          } else {
            // Tamu / belum login: null
            this.currentUser = null;
            this.userProfile = null;
            this.subscription = this.getDefaultSubscription();
            this.trialUsage = { createdCount: 0, limit: this.MAX_TRIAL_LOGBOOKS };
          }

          // Tandai status auth selesai dievaluasi pertama kali
          this.isAuthReady = true;
          if (this._resolveAuthReady) {
            this._resolveAuthReady(this.currentUser);
            this._resolveAuthReady = null;
          }

          this.notifyUserChanged();
        });
        return;
      }
    }

    // Jika Firebase belum aktif / offline
    this.currentUser = null;
    this.subscription = this.getDefaultSubscription();
    this.trialUsage = { createdCount: 0, limit: this.MAX_TRIAL_LOGBOOKS };
    this.isAuthReady = true;
    if (this._resolveAuthReady) {
      this._resolveAuthReady(null);
      this._resolveAuthReady = null;
    }
    this.notifyUserChanged();
  },

  /**
   * Menunggu sampai status auth pertama kali selesai dievaluasi oleh Firebase
   * Mencegah glitch/flicker lompat ke halaman login saat refresh.
   */
  async waitForAuthReady(timeoutMs = 2500) {
    if (this.isAuthReady) return this.currentUser;
    if (!this.authReadyPromise) return this.currentUser;

    return Promise.race([
      this.authReadyPromise,
      new Promise((resolve) => setTimeout(() => {
        this.isAuthReady = true;
        resolve(this.currentUser);
      }, timeoutMs))
    ]);
  },

  /**
   * Muat data langganan & profil dari Firestore dengan isolasi ketat per UID
   */
  async syncUserDataFromFirestore(uid) {
    if (!uid) {
      this.subscription = this.getDefaultSubscription();
      this.trialUsage = { createdCount: 0, limit: this.MAX_TRIAL_LOGBOOKS };
      return;
    }

    // Muat cache lokal spesifik UID ini
    this.loadSubscriptionFromCache(uid);
    this.loadTrialUsageFromCache(uid);

    if (!FirebaseService.db) return;
    try {
      const userRef = FirebaseService.db.collection("users").doc(uid);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        // Sinkronisasi status data contoh dihapus permanen
        if (typeof data.dummy_dismissed === "boolean") {
          this.setDummyDismissed(uid, data.dummy_dismissed);
        }

        // Sinkronisasi riwayat pembuatan kumulatif kuota trial
        if (typeof data.trial_created_count === "number") {
          this.trialUsage.createdCount = Math.max(this.trialUsage.createdCount, data.trial_created_count);
          this.saveTrialUsageToCache(uid);
        } else if (!data.trial_created_count && !this.isSubscribed()) {
          // Inisialisasi field kuota trial jika belum tercatat di Firestore
          await userRef.set({
            plan: "trial",
            trial_created_count: this.trialUsage.createdCount || 0,
            trial_quota_limit: this.MAX_TRIAL_LOGBOOKS
          }, { merge: true });
        }

        // Migrasi normalisasi schema jika ada akun legacy dengan plan 'pro' tanpa subscription map
        if ((!data.subscription || !data.subscription.status) && data.plan === "pro") {
          data.subscription = {
            status: "active",
            plan: "pro",
            activatedAt: data.createdAt || new Date().toISOString(),
            activeUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
            amount: 50000,
            orderId: "LEGACY-PRO"
          };
          await userRef.set({
            subscription: data.subscription,
            hasPaid: true,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }

        if (data.subscription && data.subscription.status === "active" && data.subscription.activeUntil) {
          const expiry = new Date(data.subscription.activeUntil);
          if (expiry > new Date()) {
            this.subscription = { ...this.getDefaultSubscription(), ...data.subscription };
            this.saveSubscriptionToCache(uid);
          } else {
            // Langganan sudah berakhir / kedaluwarsa
            this.subscription = {
              ...this.getDefaultSubscription(),
              status: "expired",
              activeUntil: data.subscription.activeUntil,
              orderId: data.subscription.orderId
            };
            this.saveSubscriptionToCache(uid);
          }
        } else {
          // Akun belum berlangganan (Free / Trial Tier)
          this.subscription = this.getDefaultSubscription();
          this.clearSubscriptionCache(uid);
        }
      } else {
        // Dokumen pengguna belum ada di Firestore (misal login pertama via Google)
        // Inisialisasi dokumen pengguna dengan schema standar lengkap
        const initialDoc = {
          uid: uid,
          name: this.currentUser?.displayName || (this.currentUser?.email ? this.currentUser.email.split("@")[0] : "Peneliti"),
          email: this.currentUser?.email || "",
          nim: "",
          university: "",
          major: "",
          researchTopic: "",
          supervisor: "",
          timezone: "WITA",
          locations: [],
          hasCompletedProfile: false,
          plan: "trial",
          trial_created_count: 0,
          trial_quota_limit: this.MAX_TRIAL_LOGBOOKS,
          subscription: {
            status: "inactive",
            plan: "free",
            activatedAt: null,
            activeUntil: null,
            amount: 50000,
            orderId: null
          },
          hasPaid: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await userRef.set(initialDoc, { merge: true });
        this.subscription = this.getDefaultSubscription();
        this.clearSubscriptionCache(uid);
      }

      // Muat ProfileManager & CategoryManager
      if (window.ProfileManager) {
        await ProfileManager.init(this.currentUser);
      }
      if (window.CategoryManager) {
        await CategoryManager.init(this.currentUser);
      }
    } catch (e) {
      console.warn("Gagal sinkronisasi data user dari Firestore:", e.message);
    }
  },

  loadSubscriptionFromCache(uid) {
    if (!uid) {
      this.subscription = this.getDefaultSubscription();
      return;
    }
    try {
      const key = this.getSubscriptionStorageKey(uid);
      const saved = key ? localStorage.getItem(key) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.status === "active" && parsed.activeUntil) {
          const expiry = new Date(parsed.activeUntil);
          if (expiry > new Date()) {
            this.subscription = { ...this.getDefaultSubscription(), ...parsed };
            return;
          }
        }
      }
      this.subscription = this.getDefaultSubscription();
    } catch (e) {
      this.subscription = this.getDefaultSubscription();
    }
  },

  saveSubscriptionToCache(uid) {
    if (!uid) return;
    try {
      const key = this.getSubscriptionStorageKey(uid);
      if (key) {
        localStorage.setItem(key, JSON.stringify(this.subscription));
      }
    } catch (e) {
      // ignore
    }
  },

  /**
   * Memeriksa apakah status langganan aktif
   */
  isSubscribed() {
    if (!this.currentUser) return false;
    if (this.subscription && this.subscription.status === "active" && this.subscription.activeUntil) {
      const expiry = new Date(this.subscription.activeUntil);
      return expiry > new Date();
    }
    return false;
  },

  /**
   * Menghitung sisa hari langganan
   */
  getRemainingDays() {
    if (!this.isSubscribed() || !this.subscription.activeUntil) return 0;
    const diff = new Date(this.subscription.activeUntil) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  /**
   * Aktivasi langganan (dipanggil setelah pembayaran Pakasir sukses)
   */
  async activateSubscription(orderId, amount = 50000, days = 30) {
    if (!this.currentUser || !this.currentUser.uid) {
      console.warn("activateSubscription dipanggil tanpa currentUser!");
      return null;
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    this.subscription = {
      status: "active",
      activatedAt: now.toISOString(),
      activeUntil: expiry.toISOString(),
      orderId: orderId || `LB-${Date.now()}`,
      amount: amount
    };

    // Simpan ke cache lokal ber-namespace UID
    this.saveSubscriptionToCache(this.currentUser.uid);

    if (!this.currentUser.isDemo && FirebaseService.db) {
      try {
        await FirebaseService.db.collection("users").doc(this.currentUser.uid).set({
          subscription: this.subscription,
          hasPaid: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Gagal menyimpan aktivasi langganan ke Firestore:", err);
      }
    }

    this.notifyUserChanged();
    return this.subscription;
  },

  /**
   * Login dengan Akun Google (1-Klik)
   */
  async signInWithGoogle() {
    if (!FirebaseService.auth) {
      throw new Error("Firebase Auth belum aktif. Periksa koneksi internet Anda.");
    }
    if (window.ProfileManager && typeof ProfileManager.resetProfile === "function") {
      ProfileManager.resetProfile();
    }
    if (window.CategoryManager && typeof CategoryManager.resetCategories === "function") {
      CategoryManager.resetCategories();
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await FirebaseService.auth.signInWithPopup(provider);
    return result.user;
  },

  /**
   * Login dengan Email & Password
   */
  async signInWithEmail(email, password) {
    if (!FirebaseService.auth) {
      throw new Error("Firebase Auth belum aktif.");
    }
    if (window.ProfileManager && typeof ProfileManager.resetProfile === "function") {
      ProfileManager.resetProfile();
    }
    if (window.CategoryManager && typeof CategoryManager.resetCategories === "function") {
      CategoryManager.resetCategories();
    }
    const result = await FirebaseService.auth.signInWithEmailAndPassword(email, password);
    return result.user;
  },

  /**
   * Daftar Akun Baru dengan Email & Password + Kirim Verifikasi Email
   */
  async registerWithEmail(email, password, name) {
    if (!FirebaseService.auth) {
      throw new Error("Firebase Auth belum aktif.");
    }

    // Reset status profil, kategori, dan langganan lokal sebelum akun baru dibuat
    this.subscription = this.getDefaultSubscription();
    if (window.ProfileManager && typeof ProfileManager.resetProfile === "function") {
      ProfileManager.resetProfile();
    }
    if (window.CategoryManager && typeof CategoryManager.resetCategories === "function") {
      CategoryManager.resetCategories();
    }
    try {
      localStorage.removeItem("LOGBOOK_RESEARCH_PROFILE_V3");
      localStorage.removeItem("LOGBOOK_SAVED_CATEGORIES_V3");
    } catch (e) {}

    const result = await FirebaseService.auth.createUserWithEmailAndPassword(email, password);
    const user = result.user;
    if (user) {
      if (name) {
        try {
          await user.updateProfile({ displayName: name });
        } catch (e) {
          console.warn("Gagal memperbarui displayName:", e);
        }
      }

      // Kirim email verifikasi
      try {
        await user.sendEmailVerification();
      } catch (errVerif) {
        console.warn("Gagal mengirim email verifikasi otomatis:", errVerif);
      }

      // Inisialisasi dokumen profil pengguna di Firestore dengan status Free/Inactive eksplisit
      if (FirebaseService.db) {
        try {
          await FirebaseService.db.collection("users").doc(user.uid).set({
            uid: user.uid,
            name: name || email.split("@")[0],
            email: email,
            nim: "",
            university: "",
            major: "",
            researchTopic: "",
            supervisor: "",
            timezone: "WITA",
            locations: [],
            hasCompletedProfile: false,
            subscription: {
              status: "inactive",
              plan: "free",
              activatedAt: null,
              activeUntil: null,
              amount: 50000,
              orderId: null
            },
            hasPaid: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("Gagal menyimpan profil awal pengguna ke Firestore:", e);
        }
      }
    }
    return user;
  },

  /**
   * Kirim Ulang Email Verifikasi Akun
   */
  async sendEmailVerification() {
    if (!FirebaseService.auth || !FirebaseService.auth.currentUser) {
      throw new Error("Tidak ada pengguna aktif untuk verifikasi email.");
    }
    await FirebaseService.auth.currentUser.sendEmailVerification();
    return true;
  },

  /**
   * Muat Ulang Status Verifikasi Pengguna
   */
  async reloadUser() {
    if (!FirebaseService.auth || !FirebaseService.auth.currentUser) {
      return null;
    }
    await FirebaseService.auth.currentUser.reload();
    const refreshed = FirebaseService.auth.currentUser;
    if (this.currentUser && refreshed) {
      this.currentUser.emailVerified = Boolean(refreshed.emailVerified);
      this.notifyUserChanged();
    }
    return refreshed;
  },

  /**
   * Periksa apakah email pengguna saat ini telah diverifikasi
   */
  async checkEmailVerification() {
    const refreshed = await this.reloadUser();
    return Boolean(refreshed && refreshed.emailVerified);
  },

  /**
   * Kirim Tautan Pemulihan / Reset Kata Sandi ke Email
   */
  async sendPasswordResetEmail(email) {
    if (!FirebaseService.auth) {
      throw new Error("Firebase Auth belum aktif.");
    }
    if (!email || !email.includes("@")) {
      throw new Error("Masukkan alamat email yang valid.");
    }
    await FirebaseService.auth.sendPasswordResetEmail(email.trim());
    return true;
  },

  /**
   * Pemetaan Kode Galat Firebase ke Bahasa Indonesia yang Ramah
   */
  getFriendlyErrorMessage(err) {
    if (!err) return "Terjadi kendala pada proses otentikasi.";
    const code = err.code || "";
    switch (code) {
      case "auth/email-already-in-use":
        return "Alamat email ini sudah terdaftar. Silakan pilih tab 'Masuk'.";
      case "auth/invalid-email":
        return "Format alamat email tidak valid.";
      case "auth/operation-not-allowed":
        return "Metode pendaftaran email & sandi belum diaktifkan di Firebase Console.";
      case "auth/weak-password":
        return "Kata sandi terlalu pendek. Gunakan minimal 6 karakter.";
      case "auth/user-disabled":
        return "Akun ini telah dinonaktifkan oleh administrator.";
      case "auth/user-not-found":
        return "Akun dengan email ini belum terdaftar. Silakan pilih tab 'Daftar'.";
      case "auth/wrong-password":
        return "Kata sandi yang Anda masukkan salah.";
      case "auth/invalid-credential":
        return "Alamat email atau kata sandi tidak cocok.";
      case "auth/too-many-requests":
        return "Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat sebelum mencoba lagi.";
      case "auth/network-request-failed":
        return "Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet.";
      case "auth/popup-closed-by-user":
        return "Jendela otentikasi Google ditutup sebelum proses selesai.";
      default:
        return err.message || "Terjadi kendala pada proses otentikasi.";
    }
  },

  /**
   * Keluar / Logout
   */
  async signOut() {
    if (FirebaseService.auth && this.currentUser) {
      await FirebaseService.auth.signOut();
    }
    this.currentUser = null;
    this.userProfile = null;
    this.subscription = this.getDefaultSubscription();

    // Reset status in-memory ProfileManager & CategoryManager
    if (window.ProfileManager && typeof ProfileManager.resetProfile === "function") {
      ProfileManager.resetProfile();
    }
    if (window.CategoryManager && typeof CategoryManager.resetCategories === "function") {
      CategoryManager.resetCategories();
    }

    try {
      localStorage.removeItem(this.STORAGE_KEYS.LOCAL_SUBSCRIPTION);
      localStorage.removeItem(this.STORAGE_KEYS.LOCAL_USER);
      localStorage.removeItem("LOGBOOK_RESEARCH_PROFILE_V3");
      localStorage.removeItem("LOGBOOK_SAVED_CATEGORIES_V3");
      localStorage.removeItem("LOGBOOK_ACTIVE_PAYMENT_ORDER");
    } catch (e) {}
    this.notifyUserChanged();
  },

  /**
   * Registrasi callback perubahan user
   */
  onUserChanged(callback) {
    if (typeof callback === "function") {
      this.onUserChangedCallbacks.push(callback);
    }
  },

  notifyUserChanged() {
    for (const cb of this.onUserChangedCallbacks) {
      try {
        cb(this.currentUser, this.subscription);
      } catch (e) {
        console.error("Error callback onUserChanged:", e);
      }
    }
  }
};

window.AuthManager = AuthManager;
