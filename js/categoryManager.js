/**
 * ============================================================================
 * MODUL MANAJEMEN KATEGORI KEGIATAN FLEKSIBEL (CATEGORY MANAGER)
 * Mengelola Preset Kategori Kegiatan Riset yang Dapat Disimpan, Diedit,
 * dan Ditautkan ke Entri Logbook Riwayat Lama
 * ============================================================================
 */

const CategoryManager = {
  categories: [],

  defaultCategories: [
    "Wawancara Petani Responden",
    "Wawancara Informan Kunci / Tokoh",
    "Wawancara Pedagang Pengumpul / Lembaga",
    "Observasi Lapangan & Perkebunan",
    "Diskusi Terfokus (FGD) / Musyawarah Desa",
    "Dokumentasi & Koordinasi Aparat Desa"
  ],

  resetCategories() {
    this.categories = [...this.defaultCategories];
  },

  getStorageKey(uid) {
    if (!uid) return null;
    return `LOGBOOK_SAVED_CATEGORIES_V3_${uid}`;
  },

  /**
   * Inisialisasi daftar kategori dengan isolasi ketat per UID
   */
  async init(user) {
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
          if (Array.isArray(data.list) && data.list.length > 0) {
            this.categories = data.list;
            this.saveToCache(uid);
          }
        } else {
          // Simpan default categories pertama kali
          await this.saveToFirestore(user.uid, this.categories);
          this.saveToCache(uid);
        }
      } catch (e) {
        console.warn("Gagal memuat kategori dari Firestore:", e.message);
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categories = parsed;
          return;
        }
      }
      this.categories = [...this.defaultCategories];
    } catch (e) {
      this.categories = [...this.defaultCategories];
    }
  },

  saveToCache(uid) {
    const activeUid = uid || (window.AuthManager && AuthManager.currentUser ? AuthManager.currentUser.uid : null);
    if (!activeUid) return;
    try {
      const key = this.getStorageKey(activeUid);
      if (key) {
        localStorage.setItem(key, JSON.stringify(this.categories));
      }
      localStorage.removeItem("LOGBOOK_SAVED_CATEGORIES_V3");
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
        .set({ list, updatedAt: new Date().toISOString() }, { merge: true });
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
   * Tambah & simpan kategori baru
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
        if (entry && entry.jenisKegiatan && entry.jenisKegiatan.toLowerCase() === cleanOld.toLowerCase()) {
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
   * Render daftar kategori ke DOM kontainer
   */
  renderManager(container, onEditCategory, onDeleteCategory) {
    if (!container) return;
    container.innerHTML = "";

    const cats = this.getCategories();
    if (cats.length === 0) {
      container.innerHTML = `<p style="color: var(--color-slate-400); font-size: 0.82rem; text-align: center; padding: 16px;">Belum ada kategori kegiatan tersimpan.</p>`;
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
