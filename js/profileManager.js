/**
 * ============================================================================
 * MODUL MANAJEMEN PROFIL RISET & HIRARKI WILAYAH PENELITIAN (PROFILE MANAGER)
 * Arsitektur Basis Data: Flat Normalized Administrative Records
 * [ { id, provinsi, kabupaten, kecamatan, desa, dusun } ]
 * Mendukung migrasi otomatis dari format bersarang lama, rekonstruksi pohon (tree),
 * dan auto-sync instan ke Cloud Firestore (Zero Data Loss on Refresh).
 * ============================================================================
 */

const ProfileManager = {
  currentProfile: null,

  defaultProfile: {
    name: "",
    email: "",
    nim: "",
    major: "",
    university: "",
    researchTopic: "",
    topic: "",
    supervisor: "",
    supervisorNip: "",
    timezone: "WITA", // WIB | WITA | WIT
    locations: [],    // Flat Normalized Records: [{ id, provinsi, kabupaten, kecamatan, desa, dusun }]
    isComplete: false,
    updatedAt: null
  },

  resetProfile() {
    this.currentProfile = { ...this.defaultProfile };
  },

  getStorageKey(uid) {
    if (!uid) return null;
    return `LOGBOOK_RESEARCH_PROFILE_V3_${uid}`;
  },

  /**
   * Normalisasi & Migrasi Skema Wilayah:
   * Mengubah format bersarang lama (kecamatans[].desas[].dusuns[])
   * menjadi format flat normalized berstandar industri:
   * [{ id, provinsi, kabupaten, kecamatan, desa, dusun }]
   */
  normalizeLocations(rawList) {
    if (!Array.isArray(rawList)) return [];

    const flatList = [];

    rawList.forEach((item, idx) => {
      if (!item || typeof item !== "object") return;

      // Format Legacy: Memiliki array kecamatans
      if (Array.isArray(item.kecamatans)) {
        const prov = String(item.provinsi || "Sulawesi Selatan").trim();
        const kab = String(item.kabupaten || "").trim();
        if (!kab) return;

        if (item.kecamatans.length === 0) {
          flatList.push({
            id: `loc_mig_${idx}_0`,
            provinsi: prov,
            kabupaten: kab,
            kecamatan: "",
            desa: "",
            dusun: ""
          });
        } else {
          item.kecamatans.forEach((kec, kIdx) => {
            const kecName = typeof kec === "string" ? kec.trim() : String(kec.name || "").trim();
            const desas = (kec && Array.isArray(kec.desas)) ? kec.desas : [];

            if (desas.length === 0) {
              flatList.push({
                id: `loc_mig_${idx}_${kIdx}`,
                provinsi: prov,
                kabupaten: kab,
                kecamatan: kecName,
                desa: "",
                dusun: ""
              });
            } else {
              desas.forEach((d, dIdx) => {
                const desaName = typeof d === "string" ? d.trim() : String(d.name || "").trim();
                const dusuns = (d && Array.isArray(d.dusuns)) ? d.dusuns : [];

                if (dusuns.length === 0) {
                  flatList.push({
                    id: `loc_mig_${idx}_${kIdx}_${dIdx}`,
                    provinsi: prov,
                    kabupaten: kab,
                    kecamatan: kecName,
                    desa: desaName,
                    dusun: ""
                  });
                } else {
                  dusuns.forEach((dsn, dsnIdx) => {
                    flatList.push({
                      id: `loc_mig_${idx}_${kIdx}_${dIdx}_${dsnIdx}`,
                      provinsi: prov,
                      kabupaten: kab,
                      kecamatan: kecName,
                      desa: desaName,
                      dusun: String(dsn || "").trim()
                    });
                  });
                }
              });
            }
          });
        }
      } else if (item.kabupaten) {
        // Format Flat Standar
        flatList.push({
          id: item.id || `loc_${Date.now()}_${idx}`,
          provinsi: String(item.provinsi || "Sulawesi Selatan").trim(),
          kabupaten: String(item.kabupaten || "").trim(),
          kecamatan: String(item.kecamatan || "").trim(),
          desa: String(item.desa || "").trim(),
          dusun: String(item.dusun || "").trim()
        });
      }
    });

    return flatList;
  },

  /**
   * Helper Normalisasi Kunci Nama Wilayah
   * Menghilangkan sensitivitas prefix ("Kab.", "Kec.", "Desa", "Dusun"), spasi ganda, dan case
   */
  normalizeKabKey(str) {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .replace(/^(kabupaten|kab\.?|kota)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeKecKey(str) {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .replace(/^(kecamatan|kec\.?)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeDesaKey(str) {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .replace(/^(desa|kelurahan|kel\.?|ds\.?)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeDusunKey(str) {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .replace(/^(dusun|dsn\.?|lingkungan|lingk\.?)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  /**
   * Rekonstruksi Pohon Visual (Tree Representation) dari Data Flat
   * Untuk kemudahan render bertingkat di UI Builder dengan peleburan otomatis
   */
  getTreeLocations() {
    if (!this.currentProfile || !Array.isArray(this.currentProfile.locations)) return [];

    const tree = [];
    const kabMap = new Map();

    this.currentProfile.locations.forEach(entry => {
      const prov = String(entry.provinsi || "Sulawesi Selatan").trim();
      const kabName = String(entry.kabupaten || "").trim();
      const kecName = String(entry.kecamatan || "").trim();
      const desaName = String(entry.desa || "").trim();
      const dusunName = String(entry.dusun || "").trim();

      if (!kabName) return;

      const kabKey = this.normalizeKabKey(kabName);
      let kabObj = kabMap.get(kabKey);
      if (!kabObj) {
        kabObj = {
          provinsi: prov,
          kabupaten: kabName,
          kecamatans: [],
          _kecMap: new Map()
        };
        kabMap.set(kabKey, kabObj);
        tree.push(kabObj);
      } else if (prov && (!kabObj.provinsi || kabObj.provinsi === "Provinsi Riset")) {
        kabObj.provinsi = prov;
      }

      if (!kecName) return;

      const kecKey = this.normalizeKecKey(kecName);
      let kecObj = kabObj._kecMap.get(kecKey);
      if (!kecObj) {
        kecObj = {
          name: kecName,
          desas: [],
          _desaMap: new Map()
        };
        kabObj._kecMap.set(kecKey, kecObj);
        kabObj.kecamatans.push(kecObj);
      }

      if (!desaName) return;

      const desaKey = this.normalizeDesaKey(desaName);
      let desaObj = kecObj._desaMap.get(desaKey);
      if (!desaObj) {
        desaObj = {
          name: desaName,
          dusuns: []
        };
        kecObj._desaMap.set(desaKey, desaObj);
        kecObj.desas.push(desaObj);
      }

      if (dusunName) {
        const dusunKey = this.normalizeDusunKey(dusunName);
        if (!desaObj.dusuns.some(d => this.normalizeDusunKey(d) === dusunKey)) {
          desaObj.dusuns.push(dusunName);
        }
      }
    });

    return tree.map(kab => ({
      provinsi: kab.provinsi,
      kabupaten: kab.kabupaten,
      kecamatans: kab.kecamatans.map(kec => ({
        name: kec.name,
        desas: kec.desas
      }))
    }));
  },

  /**
   * Inisialisasi profil dari LocalStorage dan Firestore dengan isolasi multi-tenant ketat
   */
  async init(user) {
    if (!user || !user.uid) {
      this.resetProfile();
      return this.currentProfile;
    }

    const uid = user.uid;
    const cleanDefault = {
      ...this.defaultProfile,
      name: user.displayName || (user.email ? user.email.split("@")[0] : "Peneliti"),
      email: user.email || ""
    };

    // 1. Mulai dengan profil bersih default akun aktif (mencegah residu sesi akun sebelumnya)
    this.currentProfile = { ...cleanDefault };

    // 2. Muat cache lokal spesifik UID ini (HANYA jika emailnya cocok)
    this.loadFromCache(uid, user.email);

    if (!user.isDemo && typeof window !== "undefined" && window.FirebaseService && window.FirebaseService.db) {
      try {
        // 3. Cek dokumen utama users/{uid} terlebih dahulu (Single Source of Truth)
        const userDocSnap = await window.FirebaseService.db
          .collection("users")
          .doc(user.uid)
          .get();

        let remoteData = null;
        let isContaminated = false;

        if (userDocSnap.exists) {
          const udata = userDocSnap.data() || {};

          // Deteksi kebocoran: jika dokumen Firestore memiliki email akun lain yang berbeda
          if (udata.email && user.email && udata.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
            console.warn(`[SECURITY HEAL] Terdeteksi kontaminasi email (${udata.email} vs ${user.email}). Memulihkan profil pengguna...`);
            isContaminated = true;
          } else if (udata.hasCompletedProfile || udata.nim || udata.university || udata.major || (udata.locations && udata.locations.length)) {
            const rawLocs = udata.locations || [];
            const normalizedLocs = this.normalizeLocations(rawLocs);

            remoteData = {
              name: udata.name || user.displayName || cleanDefault.name,
              email: user.email,
              nim: udata.nim || "",
              university: udata.university || "",
              major: udata.major || "",
              topic: udata.topic || udata.researchTopic || "",
              researchTopic: udata.researchTopic || udata.topic || "",
              supervisor: udata.supervisor || "",
              supervisorNip: udata.supervisorNip || "",
              timezone: udata.timezone || "WITA",
              locations: normalizedLocs,
              isComplete: Boolean(udata.hasCompletedProfile)
            };

            // Migrasi otomatis di Firestore jika format berubah dari nested ke flat
            if (rawLocs.length > 0 && JSON.stringify(rawLocs) !== JSON.stringify(normalizedLocs)) {
              await window.FirebaseService.db.collection("users").doc(user.uid).set({
                locations: normalizedLocs,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          }
        }

        // Cek fallback legacy meta/profile (hanya jika data utama belum terisi dan tidak terkontaminasi)
        if (!remoteData && !isContaminated) {
          const docSnap = await window.FirebaseService.db
            .collection("users")
            .doc(user.uid)
            .collection("meta")
            .doc("profile")
            .get();

          if (docSnap.exists) {
            const mData = docSnap.data() || {};
            if (mData.email && user.email && mData.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
              console.warn(`[SECURITY HEAL] Subkoleksi meta/profile tercemar email asing (${mData.email}). Mengabaikan...`);
              isContaminated = true;
            } else if (mData.name || mData.nim || (mData.locations && mData.locations.length)) {
              remoteData = {
                ...mData,
                email: user.email,
                locations: this.normalizeLocations(mData.locations || [])
              };
            }
          }
        }

        if (isContaminated) {
          // Pulihkan Firestore dokumen akun ini ke identitas sah akun aktif
          this.currentProfile = { ...cleanDefault };
          this.saveToCache(uid);
          await this.saveProfile(cleanDefault, user);
        } else if (remoteData) {
          this.currentProfile = { ...cleanDefault, ...remoteData, email: user.email };
          this.saveToCache(uid);
        } else {
          // Akun baru bersih: gunakan cleanDefault
          this.currentProfile = { ...cleanDefault };
          this.saveToCache(uid);
        }
      } catch (err) {
        console.warn("Gagal membaca profil dari Firestore:", err.message);
      }
    }

    if (this.currentProfile && this.currentProfile.locations) {
      this.currentProfile.locations = this.normalizeLocations(this.currentProfile.locations);
    }

    return this.currentProfile;
  },

  loadFromCache(uid, expectedEmail = null) {
    if (!uid) {
      this.resetProfile();
      return;
    }
    try {
      const key = this.getStorageKey(uid);
      const saved = key ? localStorage.getItem(key) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validasi kepemilikan email jika diberikan untuk mencegah kontaminasi
        if (expectedEmail && parsed.email && parsed.email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) {
          console.warn("[SECURITY] Cache profil milik email lain ditemukan. Mengabaikan cache.");
          this.resetProfile();
          return;
        }
        if (parsed.locations) {
          parsed.locations = this.normalizeLocations(parsed.locations);
        }
        this.currentProfile = { ...this.defaultProfile, ...parsed };
        if (expectedEmail) this.currentProfile.email = expectedEmail;
        return;
      }
    } catch (e) {
      // ignore
    }
    this.resetProfile();
  },

  saveToCache(uid) {
    if (!uid) return;
    try {
      const key = this.getStorageKey(uid);
      if (key) {
        localStorage.setItem(key, JSON.stringify(this.currentProfile));
      }
      // Hapus key un-namespaced lama untuk mencegah kebocoran antar akun
      localStorage.removeItem("LOGBOOK_RESEARCH_PROFILE_V3");
    } catch (e) {
      console.warn("Gagal menyimpan cache profil:", e);
    }
  },

  /**
   * Auto-Sync Instan ke LocalStorage dan Cloud Firestore
   * Menjamin Zero Data Loss saat pengguna merefresh halaman
   */
  async syncLocationsToStorageAndRemote(user) {
    const activeUser = user || (typeof window !== "undefined" && window.AuthManager ? window.AuthManager.currentUser : null);
    const uid = activeUser ? activeUser.uid : null;
    this.saveToCache(uid);

    if (activeUser && !activeUser.isDemo && typeof window !== "undefined" && window.FirebaseService && window.FirebaseService.db) {
      try {
        await window.FirebaseService.db
          .collection("users")
          .doc(activeUser.uid)
          .set({
            locations: this.currentProfile.locations || [],
            updatedAt: new Date().toISOString()
          }, { merge: true });
      } catch (err) {
        console.warn("Auto-sync lokasi ke Firestore tertunda:", err.message);
      }
    }
  },

  /**
   * Simpan profil ke LocalStorage & Firestore (Menyatu di Dokumen Utama Pengguna)
   */
  async saveProfile(profileData, user) {
    const activeUser = user || (typeof window !== "undefined" && window.AuthManager ? window.AuthManager.currentUser : null);
    const uid = activeUser ? activeUser.uid : null;
    const userEmail = activeUser ? activeUser.email : (this.currentProfile ? this.currentProfile.email : "");

    const isComplete = this.validateCompleteness({
      ...this.currentProfile,
      ...profileData
    });
    const updated = {
      ...this.currentProfile,
      ...profileData,
      email: userEmail,
      isComplete,
      updatedAt: new Date().toISOString()
    };

    if (updated.locations) {
      updated.locations = this.normalizeLocations(updated.locations);
    }

    this.currentProfile = updated;
    this.saveToCache(uid);

    if (activeUser && !activeUser.isDemo && typeof window !== "undefined" && window.FirebaseService && window.FirebaseService.db) {
      try {
        // Simpan langsung ke dokumen utama users/{uid} agar schema konsisten di Firestore
        await window.FirebaseService.db
          .collection("users")
          .doc(activeUser.uid)
          .set({
            name: updated.name,
            email: userEmail,
            nim: updated.nim || "",
            university: updated.university || "",
            major: updated.major || "",
            topic: updated.topic || updated.researchTopic || "",
            researchTopic: updated.researchTopic || updated.topic || "",
            supervisor: updated.supervisor || "",
            supervisorNip: updated.supervisorNip || "",
            timezone: updated.timezone || "WITA",
            locations: updated.locations || [],
            hasCompletedProfile: isComplete,
            updatedAt: updated.updatedAt
          }, { merge: true });

        // Simpan salinan di meta/profile untuk kompatibilitas data
        await window.FirebaseService.db
          .collection("users")
          .doc(activeUser.uid)
          .collection("meta")
          .doc("profile")
          .set({
            ...updated,
            email: userEmail
          }, { merge: true });
      } catch (err) {
        console.error("Gagal menyimpan profil ke Firestore:", err);
      }
    }

    return this.currentProfile;
  },

  /**
   * Cek apakah profil sudah lengkap (Wajib untuk onboarding)
   */
  validateCompleteness(p = this.currentProfile) {
    if (!p) return false;
    const hasName = String(p.name || "").trim().length > 0;
    const hasNim = String(p.nim || "").trim().length > 0;
    const hasUniversity = String(p.university || "").trim().length > 0;
    const hasSupervisor = String(p.supervisor || "").trim().length > 0;
    const hasLocations = Array.isArray(p.locations) && p.locations.length > 0;

    return Boolean(hasName && hasNim && hasUniversity && hasSupervisor && hasLocations);
  },

  isComplete() {
    return this.validateCompleteness(this.currentProfile);
  },

  /**
   * Mendapatkan daftar nama Kabupaten terdaftar dari profil (Array unik)
   */
  /**
   * Mendapatkan daftar nama Kabupaten terdaftar dari profil (Array unik berbasis pohon visual)
   */
  getRegisteredKabupatens() {
    if (!this.currentProfile || !Array.isArray(this.currentProfile.locations)) return [];
    const tree = this.getTreeLocations();
    return tree.map(k => k.kabupaten);
  },

  /**
   * Mendapatkan daftar objek Kecamatan untuk suatu Kabupaten (Toleran prefix & case)
   */
  getRegisteredKecamatans(kabupatenName) {
    if (!kabupatenName || !this.currentProfile || !Array.isArray(this.currentProfile.locations)) return [];
    const kabKey = this.normalizeKabKey(kabupatenName);
    const kabObj = this.getTreeLocations().find(k => this.normalizeKabKey(k.kabupaten) === kabKey);
    return kabObj ? kabObj.kecamatans.map(kec => ({ name: kec.name })) : [];
  },

  /**
   * Mendapatkan daftar nama Desa untuk suatu Kabupaten dan Kecamatan (Toleran prefix & case)
   */
  getRegisteredDesas(kabupatenName, kecamatanName) {
    if (!kabupatenName || !kecamatanName || !this.currentProfile || !Array.isArray(this.currentProfile.locations)) return [];
    const kabKey = this.normalizeKabKey(kabupatenName);
    const kecKey = this.normalizeKecKey(kecamatanName);
    const kabObj = this.getTreeLocations().find(k => this.normalizeKabKey(k.kabupaten) === kabKey);
    const kecObj = kabObj ? kabObj.kecamatans.find(k => this.normalizeKecKey(k.name) === kecKey) : null;
    return kecObj ? kecObj.desas.map(d => (d && d.name ? d.name : d)) : [];
  },

  /**
   * Mendapatkan daftar nama Dusun untuk suatu Desa (Toleran prefix & case)
   */
  getRegisteredDusuns(kabupatenName, kecamatanName, desaName) {
    if (!kabupatenName || !kecamatanName || !desaName || !this.currentProfile || !Array.isArray(this.currentProfile.locations)) return [];
    const kabKey = this.normalizeKabKey(kabupatenName);
    const kecKey = this.normalizeKecKey(kecamatanName);
    const desaKey = this.normalizeDesaKey(desaName);
    const kabObj = this.getTreeLocations().find(k => this.normalizeKabKey(k.kabupaten) === kabKey);
    const kecObj = kabObj ? kabObj.kecamatans.find(k => this.normalizeKecKey(k.name) === kecKey) : null;
    const desaObj = kecObj ? kecObj.desas.find(d => this.normalizeDesaKey(d && d.name ? d.name : d) === desaKey) : null;
    return desaObj && Array.isArray(desaObj.dusuns) ? desaObj.dusuns : [];
  },

  /**
   * Helper Normalisasi Objek Desa (Kompatibilitas Tampilan)
   */
  normalizeDesa(desaItem) {
    if (!desaItem) return { name: "", dusuns: [] };
    if (typeof desaItem === "string") {
      return { name: desaItem.trim(), dusuns: [] };
    }
    return {
      name: String(desaItem.name || "").trim(),
      dusuns: Array.isArray(desaItem.dusuns) ? desaItem.dusuns.map(d => String(d).trim()).filter(Boolean) : []
    };
  },

  /**
   * Tambah Entri Wilayah Lengkap (Flat Normalized 5-Level Schema)
   * Dilengkapi Smart Auto-Merge & Name Alignment (Zero Data Loss)
   */
  async addLocationEntry({ provinsi, kabupaten, kecamatan, desa, dusun }, user) {
    if (!this.currentProfile) this.currentProfile = { ...this.defaultProfile };
    if (!Array.isArray(this.currentProfile.locations)) this.currentProfile.locations = [];

    const provClean = String(provinsi || "Sulawesi Selatan").trim();
    const kabClean = String(kabupaten || "").trim();
    const kecClean = String(kecamatan || "").trim();
    const desaClean = String(desa || "").trim();
    const dusunClean = String(dusun || "").trim();

    if (!kabClean) return false;

    const kabKey = this.normalizeKabKey(kabClean);
    const kecKey = this.normalizeKecKey(kecClean);
    const desaKey = this.normalizeDesaKey(desaClean);
    const dusunKey = this.normalizeDusunKey(dusunClean);

    // 1. Cek apakah ada Kabupaten yang cocok secara kanonikal
    const matchedKabEntry = this.currentProfile.locations.find(l =>
      this.normalizeKabKey(l.kabupaten) === kabKey
    );

    // Selaraskan penulisan nama kabupaten & provinsi jika kabupaten sudah ada
    const effectiveKab = matchedKabEntry ? matchedKabEntry.kabupaten : kabClean;
    const effectiveProv = matchedKabEntry ? (matchedKabEntry.provinsi || provClean) : provClean;

    // 2. Cek apakah ada Kecamatan yang cocok secara kanonikal di kabupaten tersebut
    let matchedKecEntry = null;
    if (kecKey && matchedKabEntry) {
      matchedKecEntry = this.currentProfile.locations.find(l =>
        this.normalizeKabKey(l.kabupaten) === kabKey &&
        this.normalizeKecKey(l.kecamatan) === kecKey
      );
    }
    const effectiveKec = matchedKecEntry ? matchedKecEntry.kecamatan : kecClean;

    // 3. Cek apakah ada Desa yang cocok secara kanonikal di kecamatan tersebut
    let matchedDesaEntry = null;
    if (desaKey && matchedKecEntry) {
      matchedDesaEntry = this.currentProfile.locations.find(l =>
        this.normalizeKabKey(l.kabupaten) === kabKey &&
        this.normalizeKecKey(l.kecamatan) === kecKey &&
        this.normalizeDesaKey(l.desa) === desaKey
      );
    }
    const effectiveDesa = matchedDesaEntry ? matchedDesaEntry.desa : desaClean;
    const effectiveDusun = dusunClean;

    // 4. Cek Duplikat Persis 100% (Exact Duplicate)
    const exactMatch = this.currentProfile.locations.find(l =>
      this.normalizeKabKey(l.kabupaten) === kabKey &&
      this.normalizeKecKey(l.kecamatan) === kecKey &&
      this.normalizeDesaKey(l.desa) === desaKey &&
      this.normalizeDusunKey(l.dusun) === dusunKey
    );

    if (exactMatch) {
      if (provClean && (!exactMatch.provinsi || exactMatch.provinsi === "Provinsi Riset")) {
        exactMatch.provinsi = provClean;
      }
      await this.syncLocationsToStorageAndRemote(user);
      return {
        success: true,
        status: "exact_duplicate",
        kabupaten: effectiveKab,
        kecamatan: effectiveKec,
        desa: effectiveDesa,
        dusun: effectiveDusun
      };
    }

    // 5. Cek apakah ada placeholder dusun kosong (Dusun ditambahkan ke entri desa yang dusunnya masih kosong)
    if (dusunClean && desaKey) {
      const blankDusunEntry = this.currentProfile.locations.find(l =>
        this.normalizeKabKey(l.kabupaten) === kabKey &&
        this.normalizeKecKey(l.kecamatan) === kecKey &&
        this.normalizeDesaKey(l.desa) === desaKey &&
        !String(l.dusun || "").trim()
      );
      if (blankDusunEntry) {
        blankDusunEntry.dusun = effectiveDusun;
        blankDusunEntry.provinsi = effectiveProv;
        blankDusunEntry.kabupaten = effectiveKab;
        blankDusunEntry.kecamatan = effectiveKec;
        blankDusunEntry.desa = effectiveDesa;
        await this.syncLocationsToStorageAndRemote(user);
        return {
          success: true,
          status: "merged_dusun",
          kabupaten: effectiveKab,
          kecamatan: effectiveKec,
          desa: effectiveDesa,
          dusun: effectiveDusun
        };
      }
    }

    // 6. Cek apakah ada placeholder desa kosong (Desa ditambahkan ke entri kecamatan yang desanya masih kosong)
    if (desaClean && kecKey) {
      const blankDesaEntry = this.currentProfile.locations.find(l =>
        this.normalizeKabKey(l.kabupaten) === kabKey &&
        this.normalizeKecKey(l.kecamatan) === kecKey &&
        !String(l.desa || "").trim() &&
        !String(l.dusun || "").trim()
      );
      if (blankDesaEntry) {
        blankDesaEntry.desa = effectiveDesa;
        blankDesaEntry.dusun = effectiveDusun;
        blankDesaEntry.provinsi = effectiveProv;
        blankDesaEntry.kabupaten = effectiveKab;
        blankDesaEntry.kecamatan = effectiveKec;
        await this.syncLocationsToStorageAndRemote(user);
        return {
          success: true,
          status: "merged_desa",
          kabupaten: effectiveKab,
          kecamatan: effectiveKec,
          desa: effectiveDesa,
          dusun: effectiveDusun
        };
      }
    }

    // 7. Cek apakah ada placeholder kecamatan kosong (Kecamatan ditambahkan ke entri kabupaten yang kecamatannya masih kosong)
    if (kecClean) {
      const blankKecEntry = this.currentProfile.locations.find(l =>
        this.normalizeKabKey(l.kabupaten) === kabKey &&
        !String(l.kecamatan || "").trim() &&
        !String(l.desa || "").trim() &&
        !String(l.dusun || "").trim()
      );
      if (blankKecEntry) {
        blankKecEntry.kecamatan = effectiveKec;
        blankKecEntry.desa = effectiveDesa;
        blankKecEntry.dusun = effectiveDusun;
        blankKecEntry.provinsi = effectiveProv;
        blankKecEntry.kabupaten = effectiveKab;
        await this.syncLocationsToStorageAndRemote(user);
        return {
          success: true,
          status: "merged_kec",
          kabupaten: effectiveKab,
          kecamatan: effectiveKec,
          desa: effectiveDesa,
          dusun: effectiveDusun
        };
      }
    }

    // 8. Tambah record baru dengan nama yang tersinkronisasi
    const newEntry = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      provinsi: effectiveProv,
      kabupaten: effectiveKab,
      kecamatan: effectiveKec,
      desa: effectiveDesa,
      dusun: effectiveDusun
    };

    this.currentProfile.locations.push(newEntry);
    await this.syncLocationsToStorageAndRemote(user);

    let status = "new_kab";
    if (matchedKabEntry && !matchedKecEntry && effectiveKec) {
      status = "merged_kec";
    } else if (matchedKecEntry && !matchedDesaEntry && effectiveDesa) {
      status = "merged_desa";
    } else if (matchedDesaEntry && effectiveDusun) {
      status = "merged_dusun";
    }

    return {
      success: true,
      status,
      kabupaten: effectiveKab,
      kecamatan: effectiveKec,
      desa: effectiveDesa,
      dusun: effectiveDusun
    };
  },

  /**
   * Helper Manipulasi Hirarki Wilayah Bertingkat
   */
  async addKabupaten(provinsi, kabupatenName, user) {
    return await this.addLocationEntry({ provinsi, kabupaten: kabupatenName, kecamatan: "", desa: "", dusun: "" }, user);
  },

  async removeKabupaten(indexOrName, user) {
    if (!this.currentProfile || !Array.isArray(this.currentProfile.locations)) return;
    let targetKab = "";
    if (typeof indexOrName === "number") {
      const tree = this.getTreeLocations();
      targetKab = tree[indexOrName] ? tree[indexOrName].kabupaten : "";
    } else {
      targetKab = String(indexOrName || "");
    }

    if (!targetKab) return;

    this.currentProfile.locations = this.currentProfile.locations.filter(
      l => String(l.kabupaten || "").trim().toLowerCase() !== targetKab.trim().toLowerCase()
    );

    await this.syncLocationsToStorageAndRemote(user);
  },

  async addKecamatan(kabIndexOrName, kecName, user) {
    const kecClean = String(kecName || "").trim();
    if (!kecClean) return;

    let targetKab = "";
    let targetProv = "Sulawesi Selatan";
    if (typeof kabIndexOrName === "number") {
      const tree = this.getTreeLocations();
      const kabObj = tree[kabIndexOrName];
      if (kabObj) {
        targetKab = kabObj.kabupaten;
        targetProv = kabObj.provinsi || targetProv;
      }
    } else {
      targetKab = String(kabIndexOrName || "");
    }

    if (!targetKab) return;

    await this.addLocationEntry({
      provinsi: targetProv,
      kabupaten: targetKab,
      kecamatan: kecClean,
      desa: "",
      dusun: ""
    }, user);
  },

  async removeKecamatan(kabIndexOrName, kecIndexOrName, user) {
    if (!this.currentProfile || !Array.isArray(this.currentProfile.locations)) return;

    let targetKab = "";
    let targetKec = "";
    let targetProv = "Sulawesi Selatan";

    if (typeof kabIndexOrName === "number") {
      const tree = this.getTreeLocations();
      const kabObj = tree[kabIndexOrName];
      if (kabObj) {
        targetKab = kabObj.kabupaten;
        targetProv = kabObj.provinsi || targetProv;
        if (typeof kecIndexOrName === "number" && kabObj.kecamatans && kabObj.kecamatans[kecIndexOrName]) {
          targetKec = kabObj.kecamatans[kecIndexOrName].name;
        }
      }
    } else {
      targetKab = String(kabIndexOrName || "");
      targetKec = String(kecIndexOrName || "");
    }

    if (!targetKab || !targetKec) return;

    // Hapus seluruh entri dengan kec tersebut
    this.currentProfile.locations = this.currentProfile.locations.filter(
      l => !(
        String(l.kabupaten || "").trim().toLowerCase() === targetKab.trim().toLowerCase() &&
        String(l.kecamatan || "").trim().toLowerCase() === targetKec.trim().toLowerCase()
      )
    );

    // Jika tidak ada lagi sisa entri untuk kabupaten tersebut, buatkan placeholder kabupaten agar tidak hilang
    const remainingForKab = this.currentProfile.locations.filter(
      l => String(l.kabupaten || "").trim().toLowerCase() === targetKab.trim().toLowerCase()
    );
    if (remainingForKab.length === 0) {
      this.currentProfile.locations.push({
        id: `loc_${Date.now()}_holder`,
        provinsi: targetProv,
        kabupaten: targetKab,
        kecamatan: "",
        desa: "",
        dusun: ""
      });
    }

    await this.syncLocationsToStorageAndRemote(user);
  },

  async addDesa(kabIndexOrName, kecIndexOrName, desaName, dusunName = "", user) {
    const desaClean = String(desaName || "").trim();
    if (!desaClean) return;

    let targetKab = "";
    let targetKec = "";
    let targetProv = "Sulawesi Selatan";

    if (typeof kabIndexOrName === "number") {
      const tree = this.getTreeLocations();
      const kabObj = tree[kabIndexOrName];
      if (kabObj) {
        targetKab = kabObj.kabupaten;
        targetProv = kabObj.provinsi || targetProv;
        if (typeof kecIndexOrName === "number" && kabObj.kecamatans && kabObj.kecamatans[kecIndexOrName]) {
          targetKec = kabObj.kecamatans[kecIndexOrName].name;
        }
      }
    } else {
      targetKab = String(kabIndexOrName || "");
      targetKec = String(kecIndexOrName || "");
    }

    if (!targetKab || !targetKec) return;

    await this.addLocationEntry({
      provinsi: targetProv,
      kabupaten: targetKab,
      kecamatan: targetKec,
      desa: desaClean,
      dusun: dusunName
    }, user);
  },

  async removeDesa(kabIndexOrName, kecIndexOrName, desaIndexOrName, user) {
    if (!this.currentProfile || !Array.isArray(this.currentProfile.locations)) return;

    let targetKab = "";
    let targetKec = "";
    let targetDesa = "";
    let targetProv = "Sulawesi Selatan";

    if (typeof kabIndexOrName === "number") {
      const tree = this.getTreeLocations();
      const kabObj = tree[kabIndexOrName];
      if (kabObj) {
        targetKab = kabObj.kabupaten;
        targetProv = kabObj.provinsi || targetProv;
        if (typeof kecIndexOrName === "number" && kabObj.kecamatans && kabObj.kecamatans[kecIndexOrName]) {
          const kecObj = kabObj.kecamatans[kecIndexOrName];
          targetKec = kecObj.name;
          if (typeof desaIndexOrName === "number" && kecObj.desas && kecObj.desas[desaIndexOrName]) {
            targetDesa = this.normalizeDesa(kecObj.desas[desaIndexOrName]).name;
          }
        }
      }
    } else {
      targetKab = String(kabIndexOrName || "");
      targetKec = String(kecIndexOrName || "");
      targetDesa = String(desaIndexOrName || "");
    }

    if (!targetKab || !targetKec || !targetDesa) return;

    // Hapus seluruh entri dengan desa tersebut
    this.currentProfile.locations = this.currentProfile.locations.filter(
      l => !(
        String(l.kabupaten || "").trim().toLowerCase() === targetKab.trim().toLowerCase() &&
        String(l.kecamatan || "").trim().toLowerCase() === targetKec.trim().toLowerCase() &&
        String(l.desa || "").trim().toLowerCase() === targetDesa.trim().toLowerCase()
      )
    );

    // Jika tidak ada lagi sisa entri untuk kecamatan tersebut, buat placeholder kecamatan
    const remainingForKec = this.currentProfile.locations.filter(
      l => String(l.kabupaten || "").trim().toLowerCase() === targetKab.trim().toLowerCase() &&
           String(l.kecamatan || "").trim().toLowerCase() === targetKec.trim().toLowerCase()
    );
    if (remainingForKec.length === 0) {
      this.currentProfile.locations.push({
        id: `loc_${Date.now()}_holder`,
        provinsi: targetProv,
        kabupaten: targetKab,
        kecamatan: targetKec,
        desa: "",
        dusun: ""
      });
    }

    await this.syncLocationsToStorageAndRemote(user);
  },

  async addDusun(kabIndexOrName, kecIndexOrName, desaIndexOrName, dusunName, user) {
    const dusunClean = String(dusunName || "").trim();
    if (!dusunClean) return;

    let targetKab = "";
    let targetKec = "";
    let targetDesa = "";
    let targetProv = "Sulawesi Selatan";

    if (typeof kabIndexOrName === "number") {
      const tree = this.getTreeLocations();
      const kabObj = tree[kabIndexOrName];
      if (kabObj) {
        targetKab = kabObj.kabupaten;
        targetProv = kabObj.provinsi || targetProv;
        if (typeof kecIndexOrName === "number" && kabObj.kecamatans && kabObj.kecamatans[kecIndexOrName]) {
          const kecObj = kabObj.kecamatans[kecIndexOrName];
          targetKec = kecObj.name;
          if (typeof desaIndexOrName === "number" && kecObj.desas && kecObj.desas[desaIndexOrName]) {
            targetDesa = this.normalizeDesa(kecObj.desas[desaIndexOrName]).name;
          }
        }
      }
    } else {
      targetKab = String(kabIndexOrName || "");
      targetKec = String(kecIndexOrName || "");
      targetDesa = String(desaIndexOrName || "");
    }

    if (!targetKab || !targetKec || !targetDesa) return;

    await this.addLocationEntry({
      provinsi: targetProv,
      kabupaten: targetKab,
      kecamatan: targetKec,
      desa: targetDesa,
      dusun: dusunClean
    }, user);
  },

  async removeDusun(kabIndexOrName, kecIndexOrName, desaIndexOrName, dusunIndexOrName, user) {
    if (!this.currentProfile || !Array.isArray(this.currentProfile.locations)) return;

    let targetKab = "";
    let targetKec = "";
    let targetDesa = "";
    let targetDusun = "";

    if (typeof kabIndexOrName === "number") {
      const tree = this.getTreeLocations();
      const kabObj = tree[kabIndexOrName];
      if (kabObj) {
        targetKab = kabObj.kabupaten;
        if (typeof kecIndexOrName === "number" && kabObj.kecamatans && kabObj.kecamatans[kecIndexOrName]) {
          const kecObj = kabObj.kecamatans[kecIndexOrName];
          targetKec = kecObj.name;
          if (typeof desaIndexOrName === "number" && kecObj.desas && kecObj.desas[desaIndexOrName]) {
            const desaObj = this.normalizeDesa(kecObj.desas[desaIndexOrName]);
            targetDesa = desaObj.name;
            if (typeof dusunIndexOrName === "number" && desaObj.dusuns && desaObj.dusuns[dusunIndexOrName]) {
              targetDusun = desaObj.dusuns[dusunIndexOrName];
            }
          }
        }
      }
    } else {
      targetKab = String(kabIndexOrName || "");
      targetKec = String(kecIndexOrName || "");
      targetDesa = String(desaIndexOrName || "");
      targetDusun = String(dusunIndexOrName || "");
    }

    if (!targetKab || !targetKec || !targetDesa || !targetDusun) return;

    const matchingDesaEntries = this.currentProfile.locations.filter(
      l => String(l.kabupaten || "").trim().toLowerCase() === targetKab.trim().toLowerCase() &&
           String(l.kecamatan || "").trim().toLowerCase() === targetKec.trim().toLowerCase() &&
           String(l.desa || "").trim().toLowerCase() === targetDesa.trim().toLowerCase()
    );

    if (matchingDesaEntries.length > 1) {
      // Ada beberapa dusun, hapus spesifik entri dusun ini
      this.currentProfile.locations = this.currentProfile.locations.filter(
        l => !(
          String(l.kabupaten || "").trim().toLowerCase() === targetKab.trim().toLowerCase() &&
          String(l.kecamatan || "").trim().toLowerCase() === targetKec.trim().toLowerCase() &&
          String(l.desa || "").trim().toLowerCase() === targetDesa.trim().toLowerCase() &&
          String(l.dusun || "").trim().toLowerCase() === targetDusun.trim().toLowerCase()
        )
      );
    } else if (matchingDesaEntries.length === 1) {
      // Hanya 1 entri untuk desa ini, ubah dusun menjadi string kosong agar desa tidak ikut terhapus
      matchingDesaEntries[0].dusun = "";
    }

    await this.syncLocationsToStorageAndRemote(user);
  },

  /**
   * Render UI Builder Hirarki Wilayah ke Kontainer DOM
   */
  renderLocationTreeBuilder(container) {
    if (!container) return;
    container.innerHTML = "";

    const locations = this.getTreeLocations();

    if (locations.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; background: #f8fafc; border: 1px solid var(--color-slate-200); border-radius: var(--radius-md); color: var(--color-slate-500); font-size: 0.84rem;">
          <p>Belum ada wilayah penelitian terdaftar.</p>
          <p style="margin-top: 4px; font-weight: 600; color: var(--color-primary-dark);">Pilih tombol <strong>"+ Tambah Wilayah Penelitian"</strong> untuk mendaftarkan hirarki lokasi riset Anda.</p>
        </div>
      `;
      return;
    }

    locations.forEach((kab, kabIndex) => {
      const kabCard = document.createElement("div");
      kabCard.className = "tree-kab-card";

      // 1 & 2: Header Provinsi & Kabupaten
      const kabHeader = document.createElement("div");
      kabHeader.className = "tree-kab-header";
      kabHeader.innerHTML = `
        <div class="tree-kab-name">
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-slate-500); font-weight: 600; margin-bottom: 2px;">
            Provinsi ${kab.provinsi || "Sulawesi Selatan"}
          </div>
          <span style="font-size: 0.95rem; font-weight: 750; color: var(--color-slate-800);">
            ${kab.kabupaten.toLowerCase().startsWith("kab") || kab.kabupaten.toLowerCase().startsWith("kota") ? kab.kabupaten : `Kab. ${kab.kabupaten}`}
          </span>
        </div>
        <div class="tree-header-actions" style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="btn btn-tree-sub-action btn-add-kec-action" data-kab-idx="${kabIndex}" title="Tambah Kecamatan ke ${kab.kabupaten}">
            + Kecamatan
          </button>
          <button type="button" class="btn-icon btn-remove-kab-action" data-kab-idx="${kabIndex}" data-kab-name="${kab.kabupaten}" title="Hapus Kabupaten Ini" style="color: var(--color-danger); width: 28px; height: 28px; font-size: 18px;">
            &times;
          </button>
        </div>
      `;
      kabCard.appendChild(kabHeader);

      // 3: List Kecamatan
      const kecList = document.createElement("div");
      kecList.className = "tree-kec-list";

      const kecamatans = Array.isArray(kab.kecamatans) ? kab.kecamatans : [];
      if (kecamatans.length === 0) {
        kecList.innerHTML = `<small style="color: var(--color-slate-400); font-style: italic; display: block; padding: 6px 0;">Belum ada kecamatan. Pilih "+ Kecamatan" untuk mendaftarkan.</small>`;
      } else {
        kecamatans.forEach((kec, kecIndex) => {
          const kecCard = document.createElement("div");
          kecCard.className = "tree-kec-card";

          const kecHeader = document.createElement("div");
          kecHeader.className = "tree-kec-header";
          kecHeader.innerHTML = `
            <div class="tree-kec-info" style="display: flex; align-items: center; gap: 6px;">
              <span class="tree-kec-badge">Kecamatan</span>
              <strong style="color: var(--color-slate-800); font-size: 0.88rem;">${kec.name}</strong>
            </div>
            <div class="tree-header-actions" style="display: flex; gap: 6px; align-items: center;">
              <button type="button" class="btn btn-tree-sub-action btn-add-desa-action" data-kab-idx="${kabIndex}" data-kec-idx="${kecIndex}" title="Tambah Desa ke Kec. ${kec.name}">
                + Desa/Kelurahan
              </button>
              <button type="button" class="btn-icon btn-remove-kec-action" data-kab-idx="${kabIndex}" data-kec-idx="${kecIndex}" data-kec-name="${kec.name}" title="Hapus Kecamatan Ini" style="color: var(--color-danger); width: 24px; height: 24px; font-size: 16px;">
                &times;
              </button>
            </div>
          `;
          kecCard.appendChild(kecHeader);

          // 4 & 5: Daftar Desa & Dusun (Opsional)
          const desaWrapper = document.createElement("div");
          desaWrapper.className = "tree-desa-wrapper";

          const desas = Array.isArray(kec.desas) ? kec.desas : [];
          if (desas.length === 0) {
            desaWrapper.innerHTML = `<small style="color: var(--color-slate-400); font-style: italic; font-size: 0.76rem;">Belum ada desa/kelurahan.</small>`;
          } else {
            desas.forEach((dItem, desaIndex) => {
              const desaObj = this.normalizeDesa(dItem);
              const desaRow = document.createElement("div");
              desaRow.className = "tree-desa-row";

              const dusuns = Array.isArray(desaObj.dusuns) ? desaObj.dusuns : [];
              const dusunBadgesHtml = dusuns.map((dsn, dsnIndex) => `
                <span class="dusun-tag">
                  <span>Dsn. ${dsn}</span>
                  <button type="button" class="btn-remove-dusun-action" data-kab-idx="${kabIndex}" data-kec-idx="${kecIndex}" data-desa-idx="${desaIndex}" data-dusun-idx="${dsnIndex}" title="Hapus Dusun">&times;</button>
                </span>
              `).join("");

              desaRow.innerHTML = `
                <div class="tree-desa-main">
                  <div class="tree-desa-label">
                    <span class="desa-name-text">Desa/Kel. <strong>${desaObj.name}</strong></span>
                    <div class="tree-desa-actions" style="display: flex; gap: 4px; align-items: center;">
                      <button type="button" class="btn btn-tree-sub-action btn-add-dusun-action" data-kab-idx="${kabIndex}" data-kec-idx="${kecIndex}" data-desa-idx="${desaIndex}" title="Tambah Dusun ke Desa ${desaObj.name}">
                        + Dusun
                      </button>
                      <button type="button" class="btn-icon btn-remove-desa-action" data-kab-idx="${kabIndex}" data-kec-idx="${kecIndex}" data-desa-idx="${desaIndex}" data-desa-name="${desaObj.name}" title="Hapus Desa Ini" style="color: var(--color-danger); width: 20px; height: 20px; font-size: 15px;">
                        &times;
                      </button>
                    </div>
                  </div>
                  ${dusuns.length > 0 ? `
                    <div class="tree-dusun-list">
                      <span class="dusun-indicator-label">Dusun/Lingk:</span>
                      ${dusunBadgesHtml}
                    </div>
                  ` : ""}
                </div>
              `;
              desaWrapper.appendChild(desaRow);
            });
          }

          kecCard.appendChild(desaWrapper);
          kecList.appendChild(kecCard);
        });
      }

      kabCard.appendChild(kecList);
      container.appendChild(kabCard);
    });
  }
};

window.ProfileManager = ProfileManager;
