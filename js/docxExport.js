/**
 * MODUL EKSPOR DOKUMEN WORD (.docx) LAPANGAN PENELITIAN
 * Sistem Otomasi Logbook Aktivitas Penelitian Lapangan Mahasiswa
 * Menggunakan docx.js Client-Side dengan Tabel Lanskap & Embed Foto GPS Cam
 */

// Polyfill window.setImmediate untuk browser modern (dibutuhkan oleh jszip di docx.js)
if (typeof window !== "undefined" && typeof window.setImmediate === "undefined") {
  window.setImmediate = function (fn, ...args) {
    return setTimeout(fn, 0, ...args);
  };
}
if (typeof globalThis !== "undefined" && typeof globalThis.setImmediate === "undefined") {
  globalThis.setImmediate = function (fn, ...args) {
    return setTimeout(fn, 0, ...args);
  };
}

/**
 * Helper Fungsi Pengunduh Blob Universal
 * Mendukung FileSaver.js (saveAs) serta native DOM <a> download fallback
 */
function triggerDownload(blob, filename) {
  if (typeof window !== "undefined" && typeof window.saveAs === "function") {
    try {
      window.saveAs(blob, filename);
      return;
    } catch (saveErr) {
      console.warn("saveAs gagal, beralih ke native download link:", saveErr);
    }
  }

  if (typeof document !== "undefined") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);
  }
}

/**
 * Konversi Base64 string ke Binary Blob dengan MIME resmi Office Open XML
 */
function base64ToBlob(base64String, mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

const DocxExporter = {
  /**
   * Mengambil referensi pustaka docx secara aman di berbagai lingkup runtime
   */
  getDocxLibrary() {
    if (typeof window !== "undefined" && window.docx) return window.docx;
    if (typeof globalThis !== "undefined" && globalThis.docx) return globalThis.docx;
    if (typeof docx !== "undefined") return docx;
    return null;
  },

  /**
   * Helper konversi URL atau Base64 Image ke Uint8Array dengan timeout pelindung
   * Mendukung direct Base64, direct fetch, image proxy fallback, dan DOM Image extraction
   */
  async imageToUint8Array(imageUrlOrBase64, timeoutMs = 4500) {
    if (!imageUrlOrBase64) return null;

    try {
      // 1. Jalur Utama: Direct Data URL Base64 (100% Instan, Offline & Bebas CORS)
      if (imageUrlOrBase64.startsWith("data:image")) {
        const parts = imageUrlOrBase64.split(",");
        if (parts.length < 2) return null;
        const binaryString = atob(parts[1]);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }

      // 2. Jalur Remote Storage (Firebase / GCS): Langsung gunakan proxy backend untuk menghindari penundaan CORS
      const isRemoteStorage = imageUrlOrBase64.includes("firebasestorage.googleapis.com") || 
                              imageUrlOrBase64.includes("storage.googleapis.com");

      if (isRemoteStorage) {
        try {
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrlOrBase64)}`;
          let proxyResp = null;
          if (typeof AbortController !== "undefined") {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            proxyResp = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
          } else {
            proxyResp = await fetch(proxyUrl);
          }

          if (proxyResp && proxyResp.ok) {
            const ab = await proxyResp.arrayBuffer();
            const pBytes = new Uint8Array(ab);
            if (pBytes.length > 0) return pBytes;
          }
        } catch (proxyErr) {
          // Proxy error fallback ke direct fetch
        }
      }

      // 3. Jalur Remote Umum / Fallback: Coba Direct Fetch
      let bytes = null;
      try {
        if (typeof AbortController !== "undefined") {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const resp = await fetch(imageUrlOrBase64, {
            signal: controller.signal,
            mode: "cors"
          });
          clearTimeout(timeoutId);
          if (resp && resp.ok) {
            const ab = await resp.arrayBuffer();
            bytes = new Uint8Array(ab);
          }
        } else {
          const resp = await fetch(imageUrlOrBase64, { mode: "cors" });
          if (resp && resp.ok) {
            const ab = await resp.arrayBuffer();
            bytes = new Uint8Array(ab);
          }
        }
      } catch (directErr) {
        bytes = null;
      }

      if (bytes && bytes.length > 0) return bytes;

      // 4. Jalur Proxy Fallback untuk URL umum non-storage
      if (!isRemoteStorage) {
        try {
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrlOrBase64)}`;
          let proxyResp = null;
          if (typeof AbortController !== "undefined") {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            proxyResp = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
          } else {
            proxyResp = await fetch(proxyUrl);
          }

          if (proxyResp && proxyResp.ok) {
            const ab = await proxyResp.arrayBuffer();
            const pBytes = new Uint8Array(ab);
            if (pBytes.length > 0) return pBytes;
          }
        } catch (proxyErr) {
          // Proxy error fallback
        }
      }

      // 4. Jalur DOM Extraction: Ambil dari elemen img yang sudah berhasil dimuat di browser
      if (typeof document !== "undefined") {
        try {
          const matchingImg = document.querySelector(`img[src="${imageUrlOrBase64}"]`);
          if (matchingImg && matchingImg.naturalWidth > 0) {
            const canvas = document.createElement("canvas");
            canvas.width = matchingImg.naturalWidth;
            canvas.height = matchingImg.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(matchingImg, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
            if (dataUrl && dataUrl.startsWith("data:image")) {
              const parts = dataUrl.split(",");
              const binaryString = atob(parts[1]);
              const len = binaryString.length;
              const domBytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                domBytes[i] = binaryString.charCodeAt(i);
              }
              return domBytes;
            }
          }
        } catch (canvasErr) {
          // ignore tainted canvas
        }
      }

      return null;
    } catch (err) {
      console.warn("Gagal memproses gambar untuk docx:", err.message);
      return null;
    }
  },

  /**
   * Format tanggal ke Bahasa Indonesia (Senin, 06 Oktober 2026)
   */
  formatDateIndo(dateStr) {
    if (!dateStr) return "-";
    try {
      const parts = String(dateStr).split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Konversi string waktu input ke format 24 jam baku (HH:mm)
   */
  formatTime24(timeStr) {
    if (!timeStr) return "-";
    timeStr = String(timeStr).trim();
    if (timeStr === "" || timeStr === "-") return "-";

    const match12 = timeStr.match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2];
      const modifier = match12[3] ? match12[3].toUpperCase() : null;

      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return `${String(hours).padStart(2, "0")}:${minutes}`;
    }

    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      const h = String(parseInt(parts[0], 10) || 0).padStart(2, "0");
      const m = String(parseInt(parts[1], 10) || 0).padStart(2, "0");
      return `${h}:${m}`;
    }

    return timeStr;
  },

  /**
   * Format rentang waktu 24 jam dengan penanda zona waktu dinamis
   */
  formatTimeRange(waktuMulai, waktuSelesai, tz = null) {
    const timezone = tz || (this.getProfile().timezone || "WITA");
    const mulai = this.formatTime24(waktuMulai);
    const selesai = this.formatTime24(waktuSelesai);
    if (mulai === "-" && selesai === "-") return "-";
    return `${mulai} - ${selesai} ${timezone}`;
  },

  formatTimeRangeWITA(waktuMulai, waktuSelesai) {
    return this.formatTimeRange(waktuMulai, waktuSelesai);
  },

  /**
   * Mengambil profil peneliti dinamis dari ProfileManager, AuthManager atau placeholder netral
   */
  getProfile() {
    let name = "";
    let nim = "";
    let university = "";
    let major = "";
    let topic = "";
    let supervisor = "";
    let supervisorNip = "";
    let timezone = "WITA";

    if (typeof window !== "undefined" && window.ProfileManager && window.ProfileManager.currentProfile) {
      const p = window.ProfileManager.currentProfile;
      name = p.name || "";
      nim = p.nim || "";
      university = p.university || "";
      major = p.major || "";
      topic = p.topic || p.researchTopic || "";
      supervisor = p.supervisor || "";
      supervisorNip = p.supervisorNip || "";
      timezone = p.timezone || "WITA";
    }

    if (typeof window !== "undefined" && window.AuthManager && window.AuthManager.currentUser) {
      const u = window.AuthManager.currentUser;
      if (!name) name = u.displayName || (u.email ? u.email.split("@")[0] : "");
      if (!nim && u.nim) nim = u.nim;
      if (!university && u.university) university = u.university;
      if (!major && u.major) major = u.major;
      if (!topic && (u.topic || u.researchTopic)) topic = u.topic || u.researchTopic;
      if (!supervisor && u.supervisor) supervisor = u.supervisor;
      if (!supervisorNip && u.supervisorNip) supervisorNip = u.supervisorNip;
      if (u.timezone) timezone = u.timezone;
    }

    return {
      name: name.trim() || "[Nama Peneliti]",
      nim: nim.trim() || "[ID Peneliti]",
      university: university.trim() || "[Nama Universitas / Perguruan Tinggi]",
      major: major.trim() || "[Program Studi / Departemen]",
      researchTopic: topic.trim() || "[Topik / Judul Penelitian Lapangan]",
      supervisor: supervisor.trim() || "[Nama Supervisor Riset]",
      supervisorNip: supervisorNip.trim() || "",
      timezone: timezone || "WITA"
    };
  },

  /**
   * Fungsi Ekspor Dokumen Word (.docx) Utama
   * @param {Array} entries - Daftar logbook yang telah disaring
   * @param {Object} filterMeta - Metadata filter yang dipilih
   */
  async exportToDocx(entries, filterMeta = {}) {
    if (!entries || entries.length === 0) {
      alert("Tidak ada data logbook untuk diekspor pada filter yang dipilih.");
      return;
    }

    const docxLib = this.getDocxLibrary();
    if (!docxLib) {
      console.warn("docx library tidak terdeteksi via lokal maupun CDN, beralih ke generator Word HTML fallback.");
      return this.exportFallbackWord(entries, filterMeta);
    }

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      WidthType,
      AlignmentType,
      BorderStyle,
      ImageRun,
      ShadingType,
      PageOrientation
    } = docxLib;

    const profile = this.getProfile();
    const defaultSubTitle = profile.major ? `${profile.major.toUpperCase()} - ${profile.university.toUpperCase()}` : profile.university.toUpperCase();
    const {
      title = "LOGBOOK AKTIVITAS PENELITIAN LAPANGAN",
      subTitle = defaultSubTitle,
      filterDescription = "Semua Aktivitas",
      kabupaten = "Semua Wilayah"
    } = filterMeta;

    // Filter baris data yang valid
    const validEntries = entries.filter(item =>
      item &&
      item.kabupaten && String(item.kabupaten).trim() !== "" && String(item.kabupaten).trim() !== "-" &&
      item.tanggal && String(item.tanggal).trim() !== "" && String(item.tanggal).trim() !== "-" && String(item.tanggal) !== "Invalid Date"
    );

    if (validEntries.length === 0) {
      alert("Tidak ada data logbook valid untuk diekspor pada filter yang dipilih.");
      return;
    }

    // Urutkan secara kronologis (Ascending: aktivitas pertama di baris 1)
    const sortedEntries = [...validEntries].sort((a, b) => {
      const dtA = (a.tanggal || "1970-01-01") + "T" + (this.formatTime24(a.waktuMulai) || "00:00");
      const dtB = (b.tanggal || "1970-01-01") + "T" + (this.formatTime24(b.waktuMulai) || "00:00");
      return dtA.localeCompare(dtB);
    });

    // Definisi Kolom Header Tabel (Lebar Total: 100%)
    const tableHeaderTitles = [
      { text: "No", width: 4 },
      { text: "Hari / Tanggal", width: 14 },
      { text: "Waktu & Durasi", width: 11 },
      { text: "Lokasi (Kec / Desa)", width: 13 },
      { text: "Aktivitas & Responden", width: 18 },
      { text: "Uraian / Deskripsi Kegiatan", width: 22 },
      { text: "Output Capaian", width: 8 },
      { text: "Dokumentasi (GPS Cam)", width: 10 }
    ];

    const headerCells = tableHeaderTitles.map(col => new TableCell({
      width: { size: col.width, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: "064E3B" }, // Forest Green Solid
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: col.text,
              bold: true,
              color: "FFFFFF",
              size: 18, // 9pt
              font: "Arial"
            })
          ]
        })
      ]
    }));

    const rows = [new TableRow({ children: headerCells, tableHeader: true })];

    // Iterasi Pembuatan Baris Data
    for (let index = 0; index < sortedEntries.length; index++) {
      const item = sortedEntries[index];
      const isEven = index % 2 === 0;
      const rowBgColor = isEven ? "FFFFFF" : "F8FAFC";

      // 1. Kolom No
      const cellNo = new TableCell({
        width: { size: 4, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: rowBgColor },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(index + 1), size: 17, font: "Arial" })]
          })
        ]
      });

      // 2. Kolom Tanggal
      const cellTanggal = new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: rowBgColor },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: this.formatDateIndo(item.tanggal),
                size: 17,
                bold: true,
                font: "Arial"
              })
            ]
          })
        ]
      });

      // 3. Kolom Waktu & Durasi
      const cellWaktu = new TableCell({
        width: { size: 11, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: rowBgColor },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: this.formatTimeRange(item.waktuMulai, item.waktuSelesai, profile.timezone),
                size: 17,
                bold: true,
                font: "Arial"
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `(${item.durasi || "-"})`,
                size: 15,
                color: "475569",
                font: "Arial"
              })
            ]
          })
        ]
      });

      // 4. Kolom Lokasi
      const cellLokasi = new TableCell({
        width: { size: 13, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: rowBgColor },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `Kab. ${item.kabupaten}`,
                bold: true,
                size: 17,
                font: "Arial"
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Kec. ${item.kecamatan || "-"}`,
                size: 16,
                font: "Arial"
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Desa ${item.desa || "-"}`,
                size: 16,
                color: "334155",
                font: "Arial"
              })
            ]
          }),
          ...(item.dusun && String(item.dusun).trim() ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Dsn. ${String(item.dusun).trim()}`,
                  size: 15,
                  color: "64748B",
                  font: "Arial"
                })
              ]
            })
          ] : [])
        ]
      });

      // 5. Kolom Aktivitas & Responden
      const cellAktivitasChildren = [
        new Paragraph({
          children: [
            new TextRun({
              text: item.jenisKegiatan || "-",
              bold: true,
              size: 17,
              color: "064E3B",
              font: "Arial"
            })
          ]
        })
      ];
      if (item.sasaranResponden) {
        cellAktivitasChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Responden: ${item.sasaranResponden}`,
                size: 16,
                italics: true,
                color: "334155",
                font: "Arial"
              })
            ]
          })
        );
      }
      const cellAktivitas = new TableCell({
        width: { size: 18, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: rowBgColor },
        children: cellAktivitasChildren
      });

      // 6. Kolom Deskripsi Kegiatan
      const cellDeskripsi = new TableCell({
        width: { size: 22, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: rowBgColor },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: item.deskripsi || "-",
                size: 16,
                font: "Arial"
              })
            ]
          })
        ]
      });

      // 7. Kolom Output
      const cellOutput = new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: rowBgColor },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: item.output || "-",
                size: 16,
                font: "Arial"
              })
            ]
          })
        ]
      });

      // 8. Kolom Foto Dokumentasi (GPS Cam)
      let fotoChildren = [];
      let imgBytes = null;
      if (item.fotoBase64 || item.fotoUrl) {
        imgBytes = await this.imageToUint8Array(item.fotoBase64 || item.fotoUrl);
        if (imgBytes && !item.fotoBase64) {
          try {
            let binary = "";
            const len = imgBytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(imgBytes[i]);
            }
            item.fotoBase64 = "data:image/jpeg;base64," + btoa(binary);
          } catch (cacheErr) {}
        }
      }

      if (imgBytes && ImageRun) {
        fotoChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: imgBytes,
                transformation: {
                  width: 95,
                  height: 72
                }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "[Foto GPS Cam]",
                size: 13,
                color: "64748B",
                italics: true,
                font: "Arial"
              })
            ]
          })
        );
      } else {
        fotoChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: item.fotoUrl ? "[Foto Terlampir]" : "-",
                size: 15,
                color: "94A3B8",
                font: "Arial"
              })
            ]
          })
        );
      }

      const cellFoto = new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: rowBgColor },
        children: fotoChildren
      });

      rows.push(new TableRow({
        children: [
          cellNo,
          cellTanggal,
          cellWaktu,
          cellLokasi,
          cellAktivitas,
          cellDeskripsi,
          cellOutput,
          cellFoto
        ]
      }));
    }

    // Bangun Tabel Dokumen
    const docTable = new Table({
      rows: rows,
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    // Bagian Pengesahan / Tanda Tangan
    const ttdTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Mengetahui,\nSupervisor / Penanggung Jawab Riset", font: "Arial", size: 18 })]
                }),
                new Paragraph({ children: [new TextRun({ text: "\n\n\n\n", font: "Arial" })] }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `( ${profile.supervisor || "__________________________________"} )`, bold: true, font: "Arial", size: 18 }),
                    new TextRun({ text: `\nNIP. ${profile.supervisorNip ? profile.supervisorNip : "__________________"}`, font: "Arial", size: 16 })
                  ]
                })
              ]
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `Lokasi Riset / Kampus, ${this.formatDateIndo(new Date().toISOString().split("T")[0])}\nPeneliti Lapangan,`,
                      font: "Arial",
                      size: 18
                    })
                  ]
                }),
                new Paragraph({ children: [new TextRun({ text: "\n\n\n\n", font: "Arial" })] }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: `( ${profile.name} )`, bold: true, font: "Arial", size: 18 }),
                    new TextRun({ text: `\nNIM. ${profile.nim}`, font: "Arial", size: 16 })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });

    // Rakit Dokumen Word Resmi
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { orientation: PageOrientation.LANDSCAPE },
              margin: {
                top: 720,    // 0.5 inci (36pt)
                right: 720,
                bottom: 720,
                left: 720
              }
            }
          },
          children: [
            // Kop Judul
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: title.toUpperCase(),
                  bold: true,
                  size: 26,
                  color: "064E3B",
                  font: "Arial"
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: subTitle,
                  bold: true,
                  size: 20,
                  color: "0F172A",
                  font: "Arial"
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Topik: ${profile.researchTopic} | Wilayah: ${kabupaten}`,
                  size: 18,
                  color: "475569",
                  font: "Arial"
                })
              ]
            }),
            new Paragraph({ children: [new TextRun({ text: "", size: 12 })] }),

            // Informasi Peneliti & Filter
            new Paragraph({
              children: [
                new TextRun({ text: "Nama Peneliti   : ", bold: true, size: 17, font: "Arial" }),
                new TextRun({ text: `${profile.name} (NIM: ${profile.nim})`, size: 17, font: "Arial" }),
                new TextRun({ text: "        |    Kategori Filter : ", bold: true, size: 17, font: "Arial" }),
                new TextRun({ text: filterDescription, size: 17, font: "Arial" }),
                new TextRun({ text: "        |    Total Entri : ", bold: true, size: 17, font: "Arial" }),
                new TextRun({ text: `${sortedEntries.length} Aktivitas`, bold: true, color: "064E3B", size: 17, font: "Arial" })
              ]
            }),
            new Paragraph({ children: [new TextRun({ text: "", size: 14 })] }),

            // Tabel Data Utama
            docTable,

            new Paragraph({ children: [new TextRun({ text: "", size: 24 })] }),

            // Tanda Tangan
            ttdTable
          ]
        }
      ]
    });

    // Kemas & Unduh Berkas .docx
    try {
      let docxBlob = null;
      if (typeof Packer.toBase64String === "function") {
        const base64Data = await Packer.toBase64String(doc);
        docxBlob = base64ToBlob(base64Data);
      } else {
        docxBlob = await Packer.toBlob(doc);
      }

      const safeTitle = filterDescription.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `Logbook_${kabupaten}_${safeTitle}_${new Date().toISOString().split("T")[0]}.docx`;
      triggerDownload(docxBlob, filename);
    } catch (saveErr) {
      console.error("Gagal mengemas berkas docx murni, beralih ke generator fallback:", saveErr);
      this.exportFallbackWord(entries, filterMeta);
    }
  },

  /**
   * Fallback Generator: Format Dokumen Word (.doc / HTML XML MIME)
   * Berfungsi 100% tanpa dependensi, dapat dibuka di MS Word
   */
  exportFallbackWord(entries, filterMeta = {}) {
    const profile = this.getProfile();
    const defaultSubTitle = profile.major ? `${profile.major.toUpperCase()} - ${profile.university.toUpperCase()}` : profile.university.toUpperCase();
    const {
      title = "LOGBOOK AKTIVITAS PENELITIAN LAPANGAN",
      subTitle = defaultSubTitle,
      filterDescription = "Semua Aktivitas",
      kabupaten = "Semua Wilayah"
    } = filterMeta;

    const validEntries = entries.filter(item =>
      item &&
      item.kabupaten && String(item.kabupaten).trim() !== "" && String(item.kabupaten).trim() !== "-" &&
      item.tanggal && String(item.tanggal).trim() !== "" && String(item.tanggal).trim() !== "-" && String(item.tanggal) !== "Invalid Date"
    );

    const sortedEntries = [...validEntries].sort((a, b) => {
      const dtA = (a.tanggal || "1970-01-01") + "T" + (this.formatTime24(a.waktuMulai) || "00:00");
      const dtB = (b.tanggal || "1970-01-01") + "T" + (this.formatTime24(b.waktuMulai) || "00:00");
      return dtA.localeCompare(dtB);
    });

    let tableRowsHtml = "";
    sortedEntries.forEach((item, index) => {
      const fotoHtml = (item.fotoBase64 || item.fotoUrl)
        ? `<img src="${item.fotoBase64 || item.fotoUrl}" width="120" style="max-height:90px; object-fit:cover; border-radius:4px;"/><br><small style="color:#64748b; font-size:9px;">[GPS Cam]</small>`
        : `<span style="color:#94a3b8;">-</span>`;

      tableRowsHtml += `
        <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size:11px;">
          <td style="text-align:center; padding:6px; border:1px solid #cbd5e1;">${index + 1}</td>
          <td style="padding:6px; border:1px solid #cbd5e1;"><b>${this.formatDateIndo(item.tanggal)}</b></td>
          <td style="padding:6px; border:1px solid #cbd5e1;"><b>${this.formatTimeRange(item.waktuMulai, item.waktuSelesai, profile.timezone)}</b><br><small style="color:#475569;">(${item.durasi || "-"})</small></td>
          <td style="padding:6px; border:1px solid #cbd5e1;"><b>Kab. ${item.kabupaten}</b><br>Kec. ${item.kecamatan || "-"}<br>Desa ${item.desa || "-"}${item.dusun && String(item.dusun).trim() ? `<br><small style="color:#64748b;">Dsn. ${item.dusun}</small>` : ""}</td>
          <td style="padding:6px; border:1px solid #cbd5e1;"><b style="color:#064e3b;">${item.jenisKegiatan || "-"}</b><br><i>${item.sasaranResponden ? "Sasaran: " + item.sasaranResponden : ""}</i></td>
          <td style="padding:6px; border:1px solid #cbd5e1;">${item.deskripsi || "-"}</td>
          <td style="padding:6px; border:1px solid #cbd5e1;">${item.output || "-"}</td>
          <td style="text-align:center; padding:6px; border:1px solid #cbd5e1;">${fotoHtml}</td>
        </tr>
      `;
    });

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          @page { size: landscape; margin: 1.5cm; }
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; }
          th { background-color: #064e3b; color: white; padding: 8px; font-size: 11px; border: 1px solid #047857; text-align: center; }
          td { vertical-align: top; }
        </style>
      </head>
      <body>
        <div style="text-align:center; margin-bottom: 12px;">
          <h2 style="margin:0; color:#064e3b; font-size:16pt;">${title}</h2>
          <h3 style="margin:2px 0; color:#0f172a; font-size:13pt;">${subTitle}</h3>
          <p style="margin:2px 0; color:#475569; font-size:10pt;">Topik: ${profile.researchTopic} | Wilayah: ${kabupaten}</p>
        </div>
        
        <table style="width:100%; font-size:10pt; margin-bottom:12px; border:none;">
          <tr>
            <td style="border:none;"><b>Peneliti:</b> ${profile.name} (${profile.nim})</td>
            <td style="border:none;"><b>Filter:</b> ${filterDescription}</td>
            <td style="border:none; text-align:right;"><b>Total:</b> ${sortedEntries.length} Aktivitas</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th style="width:4%;">No</th>
              <th style="width:14%;">Hari / Tanggal</th>
              <th style="width:11%;">Waktu & Durasi</th>
              <th style="width:13%;">Lokasi</th>
              <th style="width:18%;">Aktivitas & Responden</th>
              <th style="width:20%;">Uraian Kegiatan</th>
              <th style="width:10%;">Output</th>
              <th style="width:10%;">Dokumentasi</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <br><br>
        <table style="width:100%; border:none; margin-top:20px; font-size:11pt;">
          <tr>
            <td style="width:50%; border:none;">
              Mengetahui,<br>Supervisor / Penanggung Jawab Riset<br><br><br><br>
              <b>( ${profile.supervisor || "__________________________________"} )</b><br>
              NIP. ${profile.supervisorNip || "__________________"}
            </td>
            <td style="width:50%; border:none; text-align:right;">
              Lokasi Riset / Kampus, ${this.formatDateIndo(new Date().toISOString().split("T")[0])}<br>Peneliti Lapangan,<br><br><br><br>
              <b>( ${profile.name} )</b><br>
              NIM. ${profile.nim}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", docContent], {
      type: "application/msword"
    });
    const safeTitle = filterDescription.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Logbook_${kabupaten}_${safeTitle}_${new Date().toISOString().split("T")[0]}.doc`;
    triggerDownload(blob, filename);
  }
};

// Ekspor ke window global untuk modul browser
if (typeof window !== "undefined") {
  window.DocxExporter = DocxExporter;
}
if (typeof globalThis !== "undefined") {
  globalThis.DocxExporter = DocxExporter;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = DocxExporter;
}
