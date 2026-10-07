/**
 * =========================================================================
 * GOOGLE APPS SCRIPT BACKEND SISTEM INFORMASI KESISWAAN (kode.gs)
 * =========================================================================
 * Script ini berfungsi sebagai Web API & Database Cloud terintegrasi
 * dengan Google Sheets untuk mengelola:
 * 1. Data Siswa & Impor Excel/Spreadsheet (15+ Atribut Lengkap)
 * 2. Pencatatan Pelanggaran Siswa & Akumulasi Poin Otomatis
 * 3. Pencatatan Prestasi Siswa & Poin Reward Otomatis
 * 4. Kelola Akun Guru, Jabatan Utama & Multi Pembina Ekskul
 * 5. Pengumuman & Agenda Kegiatan Kesiswaan
 * 6. Sinkronisasi Pengaturan Sekolah, Logo, & Wallpaper Dasbor
 *
 * CARA PAKAI DI GOOGLE APPS SCRIPT:
 * 1. Buka spreadsheet Google Sheets Anda (atau buat baru di drive.google.com).
 * 2. Klik menu "Ekstensi" > "Apps Script".
 * 3. Hapus semua teks yang ada di editor Apps Script, lalu PASTE SELURUH KODE INI.
 * 4. Tekan tombol "Simpan" (Ctrl+S).
 * 5. Di dropdown fungsi (sebelah tombol Jalankan), pilih "setupInitialSheets" lalu klik "Jalankan".
 *    (Berikan izin akses / Review Permissions saat pertama kali dijalankan).
 * 6. Klik tombol biru "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment).
 *    - Jenis: Aplikasi Web (Web App)
 *    - Deskripsi: API Kesiswaan v1
 *    - Jalankan sebagai: Saya (Email Anda)
 *    - Yang memiliki akses: Siapa saja (Anyone) -> WAJIB agar Web/APK bisa akses
 * 7. Klik "Terapkan", lalu salin "URL Aplikasi Web" (berakhiran /exec).
 * =========================================================================
 */

// Konfigurasi Nama-Nama Sheet Database
const SHEET_SISWA = "Siswa";
const SHEET_PELANGGARAN = "Pelanggaran";
const SHEET_PRESTASI = "Prestasi";
const SHEET_GURU = "Guru";
const SHEET_PENGUMUMAN = "Pengumuman";
const SHEET_KEGIATAN = "Kegiatan";
const SHEET_CONFIG = "Config";

/**
 * 1. FUNGSI SETUP AWAL (Jalankan SEKALI di Editor Apps Script)
 * Membuat seluruh lembar (sheet) dan header kolom warna-warni secara otomatis.
 */
function setupInitialSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet Siswa
  let sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (!sheetSiswa) {
    sheetSiswa = ss.insertSheet(SHEET_SISWA);
    const headersSiswa = [
      "NO", "FOTO", "NIS", "NISN", "NAMA", "KELAS", "JURUSAN",
      "NOMOR_HP", "ALAMAT", "MAPS_ALAMAT", "NAMA_ORTU_BAPAK",
      "NAMA_ORTU_IBU", "NO_HP_BAPAK", "NO_HP_IBU", "INPUT_SPMB",
      "POIN_PELANGGARAN", "POIN_PRESTASI", "STATUS"
    ];
    sheetSiswa.appendRow(headersSiswa);
    sheetSiswa.getRange(1, 1, 1, headersSiswa.length)
      .setFontWeight("bold")
      .setBackground("#2563eb")
      .setFontColor("#ffffff");
    sheetSiswa.setFrozenRows(1);
  }

  // 2. Sheet Pelanggaran
  let sheetPelanggaran = ss.getSheetByName(SHEET_PELANGGARAN);
  if (!sheetPelanggaran) {
    sheetPelanggaran = ss.insertSheet(SHEET_PELANGGARAN);
    const headersPel = [
      "ID", "TIMESTAMP", "TANGGAL", "NISN", "NAMA_SISWA",
      "KELAS", "KASUS_PELANGGARAN", "POIN", "KATEGORI_BAB",
      "SANKSI_TINDAKAN", "GURU_PELAPOR"
    ];
    sheetPelanggaran.appendRow(headersPel);
    sheetPelanggaran.getRange(1, 1, 1, headersPel.length)
      .setFontWeight("bold")
      .setBackground("#dc2626")
      .setFontColor("#ffffff");
    sheetPelanggaran.setFrozenRows(1);
  }

  // 3. Sheet Prestasi
  let sheetPrestasi = ss.getSheetByName(SHEET_PRESTASI);
  if (!sheetPrestasi) {
    sheetPrestasi = ss.insertSheet(SHEET_PRESTASI);
    const headersPres = [
      "ID", "TIMESTAMP", "TANGGAL", "NISN", "NAMA_SISWA",
      "KELAS", "NAMA_PRESTASI", "TINGKAT", "POIN_REWARD",
      "PIAGAM_URL", "GURU_PEMBINA"
    ];
    sheetPrestasi.appendRow(headersPres);
    sheetPrestasi.getRange(1, 1, 1, headersPres.length)
      .setFontWeight("bold")
      .setBackground("#16a34a")
      .setFontColor("#ffffff");
    sheetPrestasi.setFrozenRows(1);
  }

  // 4. Sheet Guru & Tim Kesiswaan
  let sheetGuru = ss.getSheetByName(SHEET_GURU);
  if (!sheetGuru) {
    sheetGuru = ss.insertSheet(SHEET_GURU);
    const headersGuru = [
      "USERNAME", "PASSWORD", "NAMA", "JABATAN_UTAMA",
      "SEKBID", "PEMBINA", "ROLE"
    ];
    sheetGuru.appendRow(headersGuru);
    sheetGuru.getRange(1, 1, 1, headersGuru.length)
      .setFontWeight("bold")
      .setBackground("#7c3aed")
      .setFontColor("#ffffff");
    sheetGuru.setFrozenRows(1);
    
    // Akun awal bawaan dengan Jabatan Utama & Pembina
    sheetGuru.appendRow(["admin", "123", "Super Administrator IT", "Admin", "Semua Sekbid (Koordinator)", "OSIS, Robotika", "superadmin"]);
    sheetGuru.appendRow(["kesiswaan", "123", "Dra. Hj. Siti Rahma, M.Pd", "Waka Kesiswaan", "Pembina Umum Seluruh Sekbid", "OSIS, Dewan Ambalan, PMR", "guru"]);
    sheetGuru.appendRow(["gurubk", "123", "Bambang Wijaya, S.Pd, M.Kons", "Koordinator BK", "Sekbid 2: Budi Pekerti Luhur", "PKS, ROHIS", "guru"]);
    sheetGuru.appendRow(["walikelas", "123", "Budi Santoso, S.Kom", "Staf Sekbid 9", "Sekbid 9: Teknologi Informasi & Komunikasi", "Robotika, Redicator", "guru"]);
  }

  // 5. Sheet Pengumuman
  let sheetPengumuman = ss.getSheetByName(SHEET_PENGUMUMAN);
  if (!sheetPengumuman) {
    sheetPengumuman = ss.insertSheet(SHEET_PENGUMUMAN);
    const headersPeng = ["ID", "TANGGAL", "JUDUL", "KATEGORI", "RINGKASAN", "ISI_LENGKAP", "PENULIS"];
    sheetPengumuman.appendRow(headersPeng);
    sheetPengumuman.getRange(1, 1, 1, headersPeng.length)
      .setFontWeight("bold")
      .setBackground("#ea580c")
      .setFontColor("#ffffff");
    sheetPengumuman.setFrozenRows(1);

    sheetPengumuman.appendRow([
      "PENG-1",
      new Date().toLocaleDateString("id-ID"),
      "Pelaksanaan Penegakan Tata Tertib & Apel Karakter Siswa",
      "Kedisiplinan",
      "Diimbau kepada seluruh siswa untuk mematuhi atribut seragam lengkap.",
      "Seluruh siswa diharapkan hadir tepat waktu pukul 06.45 WIB dan mengenakan atribut seragam rapi sesuai jadwal harian.",
      "Waka Kesiswaan"
    ]);
  }

  // 6. Sheet Kegiatan
  let sheetKegiatan = ss.getSheetByName(SHEET_KEGIATAN);
  if (!sheetKegiatan) {
    sheetKegiatan = ss.insertSheet(SHEET_KEGIATAN);
    const headersKeg = ["ID", "NAMA_KEGIATAN", "TANGGAL", "KATEGORI", "TEMPAT", "KETERANGAN"];
    sheetKegiatan.appendRow(headersKeg);
    sheetKegiatan.getRange(1, 1, 1, headersKeg.length)
      .setFontWeight("bold")
      .setBackground("#0284c7")
      .setFontColor("#ffffff");
    sheetKegiatan.setFrozenRows(1);

    sheetKegiatan.appendRow([
      "KEG-1",
      "Latihan Dasar Kepemimpinan Siswa (LDKS)",
      "2026-10-15",
      "Kepemimpinan & Organisasi",
      "Aula Utama Sekolah",
      "Wajib diikuti oleh seluruh pengurus OSIS, MPK, dan Perwakilan Ekstrakurikuler."
    ]);
  }

  // 7. Sheet Config
  let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_CONFIG);
    sheetConfig.appendRow(["KEY", "VALUE"]);
    sheetConfig.getRange(1, 1, 1, 2)
      .setFontWeight("bold")
      .setBackground("#475569")
      .setFontColor("#ffffff");
    sheetConfig.setFrozenRows(1);
    
    sheetConfig.appendRow(["schoolName", "SMA NEGERI 1 KREASI BANGSA"]);
    sheetConfig.appendRow(["schoolMotto", "Berkarakter Unggul, Berprestasi Gemilang, Berbudaya Disiplin"]);
    sheetConfig.appendRow(["themeColor", "#2563eb"]);
    sheetConfig.appendRow(["dashboardBgUrl", "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80"]);
    sheetConfig.appendRow(["academicYear", "2025/2026"]);
    sheetConfig.appendRow(["headmaster", "Dr. H. Sulaiman Effendi, M.Pd"]);
    sheetConfig.appendRow(["headOfStudentAffairs", "Dra. Hj. Siti Rahma, M.Pd"]);
    sheetConfig.appendRow(["bkCoordinator", "Bambang Wijaya, S.Pd, M.Kons"]);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("Semua tabel sistem kesiswaan berhasil dibuat dan siap digunakan!", "Setup Sukses 🎉");
}

/**
 * 2. ENDPOINT HTTP GET (doGet)
 * Mengambil data dari Google Sheets untuk dikirimkan ke Web / APK Kesiswaan.
 */
function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let responseData = {};

    if (action === "getAll") {
      responseData = {
        status: "success",
        timestamp: new Date().toISOString(),
        students: getSheetDataAsJson(ss.getSheetByName(SHEET_SISWA)),
        teachers: getSheetDataAsJson(ss.getSheetByName(SHEET_GURU)),
        violations: getSheetDataAsJson(ss.getSheetByName(SHEET_PELANGGARAN)),
        achievements: getSheetDataAsJson(ss.getSheetByName(SHEET_PRESTASI)),
        announcements: getSheetDataAsJson(ss.getSheetByName(SHEET_PENGUMUMAN)),
        activities: getSheetDataAsJson(ss.getSheetByName(SHEET_KEGIATAN)),
        config: getConfigMap(ss.getSheetByName(SHEET_CONFIG))
      };
    } else if (action === "getStudents") {
      responseData = {
        status: "success",
        data: getSheetDataAsJson(ss.getSheetByName(SHEET_SISWA))
      };
    } else if (action === "getTeachers") {
      responseData = {
        status: "success",
        data: getSheetDataAsJson(ss.getSheetByName(SHEET_GURU))
      };
    } else if (action === "getViolations") {
      responseData = {
        status: "success",
        data: getSheetDataAsJson(ss.getSheetByName(SHEET_PELANGGARAN))
      };
    } else if (action === "getAchievements") {
      responseData = {
        status: "success",
        data: getSheetDataAsJson(ss.getSheetByName(SHEET_PRESTASI))
      };
    } else if (action === "getAnnouncements") {
      responseData = {
        status: "success",
        data: getSheetDataAsJson(ss.getSheetByName(SHEET_PENGUMUMAN))
      };
    } else if (action === "getActivities") {
      responseData = {
        status: "success",
        data: getSheetDataAsJson(ss.getSheetByName(SHEET_KEGIATAN))
      };
    } else if (action === "getConfig") {
      responseData = {
        status: "success",
        data: getConfigMap(ss.getSheetByName(SHEET_CONFIG))
      };
    } else if (action === "ping") {
      responseData = {
        status: "success",
        message: "API Sistem Kesiswaan Berjalan Normal!",
        time: new Date().toISOString()
      };
    } else {
      responseData = {
        status: "error",
        message: "Aksi GET tidak dikenali: " + action
      };
    }

    return createJsonResponse(responseData);
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 3. ENDPOINT HTTP POST (doPost)
 * Menerima kiriman data dari Web / APK Kesiswaan untuk disimpan ke Spreadsheet.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: "error", message: "Data kiriman kosong (No payload)." });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let result = { status: "success", message: "Operasi berhasil disimpan" };

    switch (action) {
      // ==========================================
      // A. CATAT PELANGGARAN SISWA
      // ==========================================
      case "addViolation": {
        const sheetPel = ss.getSheetByName(SHEET_PELANGGARAN);
        const id = payload.id || ("PEL-" + new Date().getTime());
        const row = [
          id,
          new Date().toISOString(),
          payload.tanggal || new Date().toLocaleDateString("id-ID"),
          payload.nisn || "",
          payload.nama || "",
          payload.kelas || "",
          payload.kasus || "",
          payload.poin || 0,
          payload.kategori || "",
          payload.sanksi || "",
          payload.guru || ""
        ];
        sheetPel.appendRow(row);

        // Akumulasikan Poin Pelanggaran di Sheet Siswa
        updateStudentPoints(payload.nisn, Number(payload.poin || 0), 0);
        result.message = "Pelanggaran berhasil dicatat ke spreadsheet.";
        break;
      }

      // ==========================================
      // B. HAPUS PELANGGARAN SISWA
      // ==========================================
      case "deleteViolation": {
        const sheetPel = ss.getSheetByName(SHEET_PELANGGARAN);
        deleteRowByColumnValue(sheetPel, 0, payload.id);
        result.message = "Pelanggaran berhasil dihapus.";
        break;
      }

      // ==========================================
      // C. CATAT PRESTASI SISWA
      // ==========================================
      case "addAchievement": {
        const sheetPres = ss.getSheetByName(SHEET_PRESTASI);
        const id = payload.id || ("PRES-" + new Date().getTime());
        const row = [
          id,
          new Date().toISOString(),
          payload.tanggal || new Date().toLocaleDateString("id-ID"),
          payload.nisn || "",
          payload.nama || "",
          payload.kelas || "",
          payload.prestasi || "",
          payload.tingkat || "Sekolah",
          payload.poin || 0,
          payload.piagamUrl || "",
          payload.pembina || ""
        ];
        sheetPres.appendRow(row);

        // Akumulasikan Poin Reward Prestasi di Sheet Siswa
        updateStudentPoints(payload.nisn, 0, Number(payload.poin || 0));
        result.message = "Prestasi siswa berhasil dicatat ke spreadsheet.";
        break;
      }

      // ==========================================
      // D. HAPUS PRESTASI SISWA
      // ==========================================
      case "deleteAchievement": {
        const sheetPres = ss.getSheetByName(SHEET_PRESTASI);
        deleteRowByColumnValue(sheetPres, 0, payload.id);
        result.message = "Prestasi siswa berhasil dihapus.";
        break;
      }

      // ==========================================
      // E. TAMBAH / UPDATE DATA SISWA (15 ATRIBUT LENGKAP)
      // ==========================================
      case "saveStudent": {
        const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
        const data = sheetSiswa.getDataRange().getValues();
        const nisn = String(payload.nisn).trim();

        let foundRowIndex = -1;
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][3]).trim() === nisn) {
            foundRowIndex = i + 1;
            break;
          }
        }

        const rowValues = [
          payload.no || (foundRowIndex > 0 ? data[foundRowIndex - 1][0] : data.length),
          payload.foto || "",
          payload.nis || "",
          payload.nisn || "",
          payload.nama || "",
          payload.kelas || "",
          payload.jurusan || "",
          payload.nomorHp || "",
          payload.alamat || "",
          payload.mapsAlamat || "",
          payload.namaOrtuBapak || "",
          payload.namaOrtuIbu || "",
          payload.noHpBapak || "",
          payload.noHpIbu || "",
          payload.inputSpmb || "",
          payload.poinPelanggaran || 0,
          payload.poinPrestasi || 0,
          payload.status || "Aktif"
        ];

        if (foundRowIndex > 0) {
          sheetSiswa.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
          result.message = `Data siswa ${payload.nama} berhasil diperbarui.`;
        } else {
          sheetSiswa.appendRow(rowValues);
          result.message = `Siswa baru ${payload.nama} berhasil didaftarkan.`;
        }
        break;
      }

      // ==========================================
      // F. IMPOR MASSAL SISWA DARI EXCEL
      // ==========================================
      case "batchImportStudents": {
        const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
        const studentsList = payload.students || [];

        if (studentsList.length > 0) {
          const rowsToAppend = studentsList.map((s, idx) => [
            s.no || (idx + 1),
            s.foto || "",
            s.nis || "",
            s.nisn || "",
            s.nama || "",
            s.kelas || "",
            s.jurusan || "",
            s.nomorHp || "",
            s.alamat || "",
            s.mapsAlamat || "",
            s.namaOrtuBapak || "",
            s.namaOrtuIbu || "",
            s.noHpBapak || "",
            s.noHpIbu || "",
            s.inputSpmb || "",
            s.poinPelanggaran || 0,
            s.poinPrestasi || 0,
            s.status || "Aktif"
          ]);

          sheetSiswa.getRange(sheetSiswa.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length)
            .setValues(rowsToAppend);
          result.message = `Berhasil mengimpor ${studentsList.length} siswa ke Google Sheets.`;
        }
        break;
      }

      // ==========================================
      // F.2 HAPUS SISWA
      // ==========================================
      case "deleteStudent": {
        const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
        deleteRowByColumnValue(sheetSiswa, 3, payload.nisn); // Kolom 3 adalah NISN
        result.message = "Data siswa berhasil dihapus dari Google Sheets.";
        break;
      }

      // ==========================================
      // G. KELOLA GURU (JABATAN UTAMA & PEMBINA MULTI-SELECT)
      // ==========================================
      case "saveTeacher": {
        const sheetGuru = ss.getSheetByName(SHEET_GURU);
        const data = sheetGuru.getDataRange().getValues();
        const username = String(payload.username).trim().toLowerCase();

        let foundRowIndex = -1;
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]).trim().toLowerCase() === username) {
            foundRowIndex = i + 1;
            break;
          }
        }

        const teacherRow = [
          payload.username,
          payload.password || "123",
          payload.name || "",
          payload.jabatanUtama || payload.roleLabel || "Staf Kesiswaan",
          payload.sekbid || "-",
          payload.pembina || payload.pokja || "-",
          payload.role || "guru"
        ];

        if (foundRowIndex > 0) {
          sheetGuru.getRange(foundRowIndex, 1, 1, teacherRow.length).setValues([teacherRow]);
          result.message = `Data guru ${payload.name} berhasil diperbarui.`;
        } else {
          sheetGuru.appendRow(teacherRow);
          result.message = `Guru ${payload.name} berhasil ditambahkan.`;
        }
        break;
      }

      // ==========================================
      // H. HAPUS GURU
      // ==========================================
      case "deleteTeacher": {
        const sheetGuru = ss.getSheetByName(SHEET_GURU);
        deleteRowByColumnValue(sheetGuru, 0, payload.username);
        result.message = `Akun guru ${payload.username} berhasil dihapus.`;
        break;
      }

      // ==========================================
      // I. TAMBAH PENGUMUMAN
      // ==========================================
      case "addAnnouncement": {
        const sheetPeng = ss.getSheetByName(SHEET_PENGUMUMAN);
        const id = payload.id || ("PENG-" + new Date().getTime());
        const row = [
          id,
          payload.tanggal || new Date().toLocaleDateString("id-ID"),
          payload.judul || "",
          payload.kategori || "Umum",
          payload.ringkasan || "",
          payload.isiLengkap || "",
          payload.penulis || "Kesiswaan"
        ];
        sheetPeng.appendRow(row);
        result.message = "Pengumuman berhasil dipublikasikan.";
        break;
      }

      // ==========================================
      // I.2 HAPUS PENGUMUMAN
      // ==========================================
      case "deleteAnnouncement": {
        const sheetPeng = ss.getSheetByName(SHEET_PENGUMUMAN);
        deleteRowByColumnValue(sheetPeng, 0, payload.id);
        result.message = "Pengumuman berhasil dihapus.";
        break;
      }

      // ==========================================
      // J. TAMBAH KEGIATAN / AGENDA
      // ==========================================
      case "addActivity": {
        const sheetKeg = ss.getSheetByName(SHEET_KEGIATAN);
        const id = payload.id || ("KEG-" + new Date().getTime());
        const row = [
          id,
          payload.namaKegiatan || "",
          payload.tanggal || "",
          payload.kategori || "Umum",
          payload.tempat || "",
          payload.keterangan || ""
        ];
        sheetKeg.appendRow(row);
        result.message = "Kegiatan berhasil ditambahkan ke agenda.";
        break;
      }

      // ==========================================
      // J.2 HAPUS KEGIATAN / AGENDA
      // ==========================================
      case "deleteActivity": {
        const sheetKeg = ss.getSheetByName(SHEET_KEGIATAN);
        deleteRowByColumnValue(sheetKeg, 0, payload.id);
        result.message = "Kegiatan berhasil dihapus dari agenda.";
        break;
      }

      // ==========================================
      // K. UPDATE KONFIGURASI SEKOLAH & WALLPAPER
      // ==========================================
      case "updateConfig": {
        const sheetConfig = ss.getSheetByName(SHEET_CONFIG);
        const newConfig = payload.config || {};
        const data = sheetConfig.getDataRange().getValues();

        const configMap = {};
        for (let i = 1; i < data.length; i++) {
          configMap[data[i][0]] = i + 1;
        }

        for (let key in newConfig) {
          if (configMap[key]) {
            sheetConfig.getRange(configMap[key], 2).setValue(newConfig[key]);
          } else {
            sheetConfig.appendRow([key, newConfig[key]]);
          }
        }
        result.message = "Konfigurasi sekolah & wallpaper berhasil disinkronkan ke Sheets.";
        break;
      }

      default:
        result = { status: "error", message: "Aksi POST tidak dikenali: " + action };
        break;
    }

    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 4. HELPER: Mengubah Sheet Menjadi Array of Objects JSON
 */
function getSheetDataAsJson(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(h => String(h).trim());
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    rows.push(rowObj);
  }
  return rows;
}

/**
 * 5. HELPER: Mengambil Sheet Config Sebagai Objek Key-Value
 */
function getConfigMap(sheet) {
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      config[data[i][0]] = data[i][1];
    }
  }
  return config;
}

/**
 * 6. HELPER: Update Akumulasi Poin di Sheet Siswa
 */
function updateStudentPoints(nisn, deltaPelanggaran, deltaPrestasi) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (!sheetSiswa) return;

  const data = sheetSiswa.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][3]).trim() === String(nisn).trim()) {
      const currentPel = Number(data[i][15] || 0);
      const currentPres = Number(data[i][16] || 0);

      if (deltaPelanggaran > 0) {
        sheetSiswa.getRange(i + 1, 16).setValue(currentPel + deltaPelanggaran);
      }
      if (deltaPrestasi > 0) {
        sheetSiswa.getRange(i + 1, 17).setValue(currentPres + deltaPrestasi);
      }
      break;
    }
  }
}

/**
 * 7. HELPER: Menghapus Baris Berdasarkan Nilai Kolom Tertentu
 */
function deleteRowByColumnValue(sheet, colIndex, value) {
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const target = String(value).trim().toLowerCase();

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIndex]).trim().toLowerCase() === target) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * 8. HELPER: Format Output JSON dengan Header CORS Penuh
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 9. FUNGSI UJI COBA KONEKSI (Bisa dijalankan langsung di editor untuk tes)
 */
function testPing() {
  const result = doGet({ parameter: { action: "ping" } });
  Logger.log(result.getContent());
}
