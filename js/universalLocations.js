/**
 * ============================================================================
 * MODUL REFERENSI WILAYAH UNIVERSAL INDONESIA (UNIVERSAL LOCATIONS)
 * Mendukung pemilihan Kabupaten/Kota di seluruh Indonesia untuk kebutuhan riset
 * ============================================================================
 */

const UNIVERSAL_LOCATIONS = {
  // Daftar Baku 38 Provinsi Resmi Republik Indonesia
  PROVINCES_38: [
    "Aceh",
    "Sumatera Utara",
    "Sumatera Barat",
    "Riau",
    "Kepulauan Riau",
    "Jambi",
    "Sumatera Selatan",
    "Kepulauan Bangka Belitung",
    "Bengkulu",
    "Lampung",
    "DKI Jakarta",
    "Jawa Barat",
    "Banten",
    "Jawa Tengah",
    "Daerah Istimewa Yogyakarta",
    "Jawa Timur",
    "Bali",
    "Nusa Tenggara Barat",
    "Nusa Tenggara Timur",
    "Kalimantan Barat",
    "Kalimantan Tengah",
    "Kalimantan Selatan",
    "Kalimantan Timur",
    "Kalimantan Utara",
    "Sulawesi Utara",
    "Gorontalo",
    "Sulawesi Tengah",
    "Sulawesi Barat",
    "Sulawesi Selatan",
    "Sulawesi Tenggara",
    "Maluku",
    "Maluku Utara",
    "Papua",
    "Papua Barat",
    "Papua Selatan",
    "Papua Tengah",
    "Papua Pegunungan",
    "Papua Barat Daya"
  ],

  // Daftar Populer Sulawesi Selatan (Prioritas Riset Regional)
  SULAWESI_SELATAN_KAB: [
    "Kab. Wajo",
    "Kab. Luwu",
    "Kab. Luwu Timur",
    "Kab. Luwu Utara",
    "Kota Palopo",
    "Kab. Bone",
    "Kab. Soppeng",
    "Kab. Sidenreng Rappang (Sidrap)",
    "Kab. Pinrang",
    "Kab. Enrekang",
    "Kab. Tana Toraja",
    "Kab. Toraja Utara",
    "Kab. Maros",
    "Kab. Pangkajene dan Kepulauan (Pangkep)",
    "Kab. Barru",
    "Kota Parepare",
    "Kota Makassar",
    "Kab. Gowa",
    "Kab. Takalar",
    "Kab. Jeneponto",
    "Kab. Bantaeng",
    "Kab. Bulukumba",
    "Kab. Sinjai",
    "Kab. Kepulauan Selayar"
  ],

  // Daftar Kabupaten/Kota Utama di Berbagai Provinsi Riset Mahasiswa
  INDONESIA_MAJOR_CITIES: [
    // Sulawesi Lainnya
    "Kota Kendari", "Kab. Kolaka", "Kab. Konawe",
    "Kota Manado", "Kab. Minahasa",
    "Kota Palu", "Kab. Parigi Moutong", "Kab. Poso",
    "Kota Gorontalo", "Kab. Polewali Mandar", "Kab. Mamuju",
    // Pulau Jawa & Sekitarnya
    "Kota Jakarta Pusat", "Kota Jakarta Selatan", "Kota Jakarta Timur", "Kota Jakarta Barat", "Kota Jakarta Utara",
    "Kota Bogor", "Kab. Bogor", "Kota Bandung", "Kab. Bandung Barat",
    "Kab. Subang", "Kab. Garut", "Kab. Sukabumi", "Kab. Cianjur",
    "Kota Semarang", "Kab. Banyumas", "Kab. Magelang", "Kab. Klaten",
    "Kab. Sleman", "Kab. Bantul", "Kota Yogyakarta",
    "Kota Surabaya", "Kab. Malang", "Kota Batu", "Kab. Jember", "Kab. Banyuwangi",
    // Sumatera
    "Kota Medan", "Kab. Deli Serdang", "Kab. Karo", "Kab. Asahan",
    "Kota Padang", "Kab. Tanah Datar", "Kab. Agam",
    "Kota Palembang", "Kab. Ogan Ilir", "Kota Bandar Lampung", "Kab. Lampung Selatan",
    "Kota Banda Aceh", "Kab. Aceh Besar", "Kota Pekanbaru", "Kab. Kampar",
    // Kalimantan & Bali/Nusa Tenggara
    "Kota Samarinda", "Kota Balikpapan", "Kab. Kutai Kartanegara",
    "Kota Pontianak", "Kab. Kubu Raya", "Kota Banjarmasin", "Kab. Banjar",
    "Kota Denpasar", "Kab. Badung", "Kab. Tabanan", "Kota Mataram", "Kab. Lombok Barat",
    "Kota Kupang", "Kota Ambon", "Kota Jayapura", "Kab. Merauke"
  ],

  // Rekomendasi Kecamatan bawaan untuk daerah prioritas
  DEFAULT_KECAMATAN: {
    "Wajo": [
      "Pitumpanua", "Keera", "Maniangpajo", "Sajoanging", "Penrang", 
      "Tanasitolo", "Belawa", "Pammana", "Sabbangparu", "Majauleng",
      "Tempe", "Bolo", "Gilireng"
    ],
    "Luwu": [
      "Larompong", "Larompong Selatan", "Suli", "Suli Barat", "Bajo", 
      "Bajo Barat", "Latimojong", "Walenrang", "Walenrang Utara", 
      "Walenrang Timur", "Walenrang Barat", "Lamasi", "Lamasi Timur", 
      "Bua", "Bua Ponrang", "Ponrang", "Ponrang Selatan", "Kamanre", 
      "Belopa", "Belopa Utara"
    ],
    "Bone": [
      "Tanete Riattang", "Palakka", "Awangpone", "Mare", "Kahu", "Libureng", "Ulaweng", "Tellu Siattinge"
    ],
    "Gowa": [
      "Somba Opu", "Pallangga", "Bajeng", "Tinggimoncong", "Tombolo Pao", "Parangloe", "Bontomarannu"
    ],
    "Maros": [
      "Turikale", "Bantimurung", "Mandai", "Tanralili", "Maros Baru", "Camba", "Tompobulu"
    ]
  },

  /**
   * Mengembalikan daftar 38 Provinsi Indonesia
   */
  getProvincesList() {
    return [...this.PROVINCES_38];
  },

  /**
   * Mengembalikan gabungan daftar kabupaten terurut untuk autocomplete datalist
   */
  getAllKabupatenList(provinsi = "") {
    if (provinsi && String(provinsi).toLowerCase().includes("sulawesi selatan")) {
      return [...this.SULAWESI_SELATAN_KAB].sort((a, b) => a.localeCompare("id"));
    }
    const combined = [...new Set([...this.SULAWESI_SELATAN_KAB, ...this.INDONESIA_MAJOR_CITIES])];
    return combined.sort((a, b) => a.localeCompare("id"));
  },

  /**
   * Helper normalisasi nama kabupaten (menghilangkan prefix Kab./Kota untuk perbandingan)
   */
  normalizeName(name) {
    if (!name) return "";
    return name.replace(/^(Kab\.|Kota|Kabupaten)\s+/i, "").trim();
  },

  /**
   * Mendapatkan rekomendasi kecamatan untuk kabupaten terpilih
   */
  getKecamatanRecommendations(kabupatenName) {
    if (!kabupatenName) return [];
    const norm = this.normalizeName(kabupatenName).toLowerCase();
    
    for (const key of Object.keys(this.DEFAULT_KECAMATAN)) {
      if (key.toLowerCase() === norm || norm.includes(key.toLowerCase())) {
        return this.DEFAULT_KECAMATAN[key];
      }
    }
    return [];
  }
};

// Make available globally
window.UNIVERSAL_LOCATIONS = UNIVERSAL_LOCATIONS;
