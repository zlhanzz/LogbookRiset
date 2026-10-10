/**
 * ============================================================================
 * MODUL MANAJEMEN KATEGORI KEGIATAN PROGRESIF & ADAPTIF (CATEGORY MANAGER)
 * Mengelola kategori kegiatan riset secara dinamis berdasarkan input riil pengguna.
 * Bebas dari preset statis/hardcoded; pilihan bertambah adaptif seiring aktivitas pengguna.
 * Menjamin isolasi penuh: data contoh / simulasi (dummy) TIDAK PERNAH mencemari kategori.
 * ============================================================================
 */

const CategoryManager = {
  categories: [],

  // Bersih dari default hardcoded: kategori murni bertambah secara progresif sesuai penggunaan riil
  defaultCategories: [],

  // Daftar kategori sampel dummy yang harus dibersihkan jika tidak digunakan oleh logbook riil
  KNOWN_SAMPLE_DUMMY_CATEGORIES: [
    "Wawancara Informan Kunci",
    "Wawancara Petani Responden",
    "Observasi Lapangan & Perkebunan",
    "Wawancara Informan Kunci / Tokoh",
    "Wawancara Pedagang Pengumpul / Lembaga",
    "Diskusi Terfokus (FGD) / Musyawarah Desa",
    "Dokumentasi & Koordinasi Aparat Desa"
  ],

  resetCategories() {
    this.categories = [];
  },

  getStorageKey(uid) {
    if (!uid) return "LOGBOOK_SAVED_CATEGORIES_PROGRESSIVE_GUEST";
    return `LOGBOOK_SAVED_CATEGORIES_V5_${uid}`;
  },

  /**
   * Membersihkan kategori sampel dummy jika pengguna belum memiliki catatan logbook riil
   */
  purgeSampleCategoriesIfNoRealEntries(entries, user) {
    const realEntries = (entries || []).filter(e => e && !e.isDummy && !String(e.id || "").startsWith("dummy_"));
    const realUsedCats = new Set(realEntries.map(e => String(e.jenisKegiatan || "").trim().toLowerCase()));

    const beforeCount = this.categories.length;
    this.categories = this.categories.filter(cat => {
      const isSample = this.KNOWN_SAMPLE_DUMMY_CATEGORIES.some(s => s.toLowerCase() === cat.toLowerCase());
      if (isSample) {
        // Hanya pertahankan jika benar-benar ada catatan lapangan riil pengguna yang menggunakannya
        return realUsedCats.has(cat.toLowerCase());
      }
      return true; // Kategori kustom buatan pengguna sendiri selalu dipertahankan
    });

    if (this.categories.length !== beforeCount) {
      const activeUid = user ? user.uid : null;
      this.saveToCache(activeUid);
      if (user && !user.isDemo) {
        this.saveToFirestore(user.uid, this.categories);
      }
    }
  },

  /**
   * Inisialisasi daftar kategori dengan isolasi ketat per UID pengguna
   */
  async init(user, existingEntries) {
    const uid = user ? user.uid : null;
    this.loadFromCache(uid);

    if (user && !user.isDemo && window.FirebaseService && FirebaseService.db) {
      try {
        const docSnap = await FirebaseService.db
          .collection("users")
          .doc(user.uid)
          .collection("meta")
          .doc("categories")
          .get();

        if (docSnap.exists) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            // Ambil kategori tersimpan pengguna tanpa memaksakan default
            this.categories = data.list.filter(Boolean);
            this.saveToCache(uid);
          }
        }
      } catch (e) {
        console.warn("Gagal memuat kategori dari Firestore:", e.message);
      }
    }

    // Pembersihan & adaptasi progresif
    if (Array.isArray(existingEntries)) {
      this.syncFromEntries(existingEntries, user);
    } else {
      this.purgeSampleCategoriesIfNoRealEntries([], user);
    }

    return this.categories;
  },

  /**
   * Menyerap secara adaptif seluruh jenis kegiatan dari entri logbook riil pengguna (Bebas Dummy)
   */
  syncFromEntries(entries, user) {
    if (!Array.isArray(entries)) return this.categories;

    // Bersihkan kategori dummy warisan jika belum ada entri riil
    this.purgeSampleCategoriesIfNoRealEntries(entries, user);

    let added = false;
    entries.forEach(entry => {
      // DILARANG KERAS menyerap jenis kegiatan dari data contoh / dummy / simulasi
      if (!entry || entry.isDummy || String(entry.id || "").startsWith("dummy_")) return;

      const cat = String(entry.jenisKegiatan || "").trim();
      if (cat && !this.categories.some(c => c.toLowerCase() === cat.toLowerCase())) {
        this.categories.push(cat);
        added = true;
      }
    });

    if (added) {
      const activeUid = user ? user.uid : null;
      this.saveToCache(activeUid);
      if (user && !user.isDemo) {
        this.saveToFirestore(user.uid, this.categories);
      }
    }

    return this.categories;
  },

  loadFromCache(uid) {
    if (!uid) {
      this.resetCategories();
      return;
    }
    try {
      const key = this.getStorageKey(uid);
      const saved = key ? localStorage.getItem(key) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.categories = parsed.filter(Boolean);
          return;
        }
      }
      this.categories = [];
    } catch (e) {
      this.categories = [];
    }
  },

  saveToCache(uid) {
    const activeUid = uid || (window.AuthManager && AuthManager.currentUser ? AuthManager.currentUser.uid : null);
    try {
      const key = this.getStorageKey(activeUid);
      if (key) {
        localStorage.setItem(key, JSON.stringify(this.categories));
      }
      // Bersihkan cache legacy versi sebelumnya agar tidak memunculkan kategori warisan
      localStorage.removeItem("LOGBOOK_SAVED_CATEGORIES_V3");
      localStorage.removeItem("LOGBOOK_SAVED_CATEGORIES_V4_" + activeUid);
    } catch (e) {
      console.warn("Gagal menyimpan cache kategori:", e);
    }
  },

  async saveToFirestore(uid, list) {
    if (!uid || !window.FirebaseService || !FirebaseService.db) return;
    try {
      await FirebaseService.db
        .collection("users")
        .doc(uid)
        .collection("meta")
        .doc("categories")
        .set({ list: list || [], updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Gagal menyimpan kategori ke Firestore:", e);
    }
  },

  /**
   * Mengambil semua kategori tersimpan
   */
  getCategories() {
    return [...this.categories];
  },

  /**
   * Tambah & simpan kategori baru ke memori, cache, dan Firestore
   */
  async addCategory(name, user) {
    const cleanName = String(name || "").trim();
    if (!cleanName) return false;

    const exists = this.categories.some(c => c.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
      this.categories.push(cleanName);
      this.saveToCache(user ? user.uid : null);
      if (user && !user.isDemo) {
        await this.saveToFirestore(user.uid, this.categories);
      }
      return true;
    }
    return false;
  },

  /**
   * Edit nama kategori dan perbarui seluruh entri logbook lama yang menggunakan nama lama
   */
  async updateCategory(oldName, newName, allEntries, user) {
    const cleanOld = String(oldName || "").trim();
    const cleanNew = String(newName || "").trim();
    if (!cleanOld || !cleanNew) return { updatedEntriesCount: 0 };

    const idx = this.categories.findIndex(c => c.toLowerCase() === cleanOld.toLowerCase());
    if (idx !== -1) {
      this.categories[idx] = cleanNew;
      this.saveToCache(user ? user.uid : null);
      if (user && !user.isDemo) {
        await this.saveToFirestore(user.uid, this.categories);
      }
    }

    // Tautkan & perbarui entri logbook riwayat yang cocok
    let updatedCount = 0;
    if (Array.isArray(allEntries)) {
      allEntries.forEach(entry => {
        if (entry && !entry.isDummy && entry.jenisKegiatan && entry.jenisKegiatan.toLowerCase() === cleanOld.toLowerCase()) {
          entry.jenisKegiatan = cleanNew;
          updatedCount++;
        }
      });
    }

    return { updatedEntriesCount: updatedCount };
  },

  /**
   * Hapus kategori dari daftar preset
   */
  async deleteCategory(name, user) {
    const cleanName = String(name || "").trim().toLowerCase();
    this.categories = this.categories.filter(c => c.toLowerCase() !== cleanName);
    this.saveToCache(user ? user.uid : null);
    if (user && !user.isDemo) {
      await this.saveToFirestore(user.uid, this.categories);
    }
  },

  /**
   * Render daftar kategori ke DOM kontainer modal kelola kategori
   */
  renderManager(container, onEditCategory, onDeleteCategory) {
    if (!container) return;
    container.innerHTML = "";

    const cats = this.getCategories();
    if (cats.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--color-slate-500);">
          <p style="font-size: 0.85rem; font-weight: 600; color: var(--color-slate-600); margin-bottom: 4px;">
            Belum Ada Kategori Kegiatan Tersimpan
          </p>
          <p style="font-size: 0.76rem; color: var(--color-slate-400); margin: 0; line-height: 1.4;">
            Kategori akan bertambah secara progresif dan adaptif setiap kali Anda menginput catatan lapangan baru, atau menambahkan kategori kustom secara manual di formulir logbook.
          </p>
        </div>
      `;
      return;
    }

    cats.forEach(catName => {
      const row = document.createElement("div");
      row.className = "category-item-row";

      const nameSpan = document.createElement("span");
      nameSpan.className = "category-item-name";
      nameSpan.textContent = catName;

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "category-item-actions";

      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn btn-light btn-sm";
      btnEdit.textContent = "Ubah";
      btnEdit.addEventListener("click", () => {
        row.innerHTML = `
          <div style="display:flex; gap:6px; width:100%; align-items:center;">
            <input type="text" class="form-control inline-cat-input" style="flex:1; padding:4px 8px; font-size:0.82rem;" value="${catName}">
            <button type="button" class="btn btn-primary btn-sm btn-save-inline" style="padding:4px 8px; font-size:0.75rem;">Simpan</button>
            <button type="button" class="btn btn-light btn-sm btn-cancel-inline" style="padding:4px 8px; font-size:0.75rem;">Batal</button>
          </div>
        `;
        const input = row.querySelector(".inline-cat-input");
        const btnSave = row.querySelector(".btn-save-inline");
        const btnCancel = row.querySelector(".btn-cancel-inline");
        if (input) input.focus();

        if (btnCancel) {
          btnCancel.addEventListener("click", () => {
            this.renderManager(container, onEditCategory, onDeleteCategory);
          });
        }

        if (btnSave && input) {
          btnSave.addEventListener("click", () => {
            const val = input.value.trim();
            if (val && val !== catName) {
              if (typeof onEditCategory === "function") {
                onEditCategory(catName, val);
              }
            } else {
              this.renderManager(container, onEditCategory, onDeleteCategory);
            }
          });
        }
      });

      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn btn-light btn-sm";
      btnDel.textContent = "Hapus";
      btnDel.style.color = "var(--color-danger)";
      btnDel.title = "Hapus Kategori";
      btnDel.addEventListener("click", () => {
        if (typeof onDeleteCategory === "function") {
          onDeleteCategory(catName);
        }
      });

      actionsDiv.appendChild(btnEdit);
      actionsDiv.appendChild(btnDel);

      row.appendChild(nameSpan);
      row.appendChild(actionsDiv);
      container.appendChild(row);
    });
  }
};

window.CategoryManager = CategoryManager;
