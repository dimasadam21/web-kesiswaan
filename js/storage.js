/**
 * STORAGE MANAGER (Local Storage Abstraction)
 * Mendukung kustomisasi sekolah oleh Super Admin, daftar guru dinamis, kata mutiara,
 * kelola prestasi global dengan foto file, dan kelola agenda kegiatan kesiswaan.
 */

const STORAGE_KEY = "kesiswaan_app_data_v2";
const STUDENTS_META_KEY = "kesiswaan_students_meta_v1";
const STUDENTS_CHUNK_PREFIX = "kesiswaan_students_c_";
const IDB_NAME = "kesiswaan_idb";
const IDB_STORE = "students";

const StorageManager = {
    _studentsCache: null,

    init() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            this.saveData({
                config: DEFAULT_CONFIG,
                quotes: DEFAULT_QUOTES,
                teachers: DEFAULT_TEACHERS,
                students: INITIAL_STUDENTS,
                rules: DEFAULT_RULES,
                tataTertib: DEFAULT_TATA_TERTIB,
                suratTemplate: DEFAULT_SURAT_TEMPLATE,
                violationsMaster: MASTER_PELANGGARAN,
                achievementsMaster: MASTER_PRESTASI,
                activities: DAFTAR_KEGIATAN
            });
        }
        // Pastikan cache siswa dimuat
        this.getStudents();
        // Inisialisasi IndexedDB sebagai backup tahan kuota
        this.initIndexedDB();
    },

    initIndexedDB() {
        if (!window.indexedDB) return;
        try {
            const req = window.indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE, { keyPath: "key" });
                }
            };
            req.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction(IDB_STORE, "readonly");
                const store = tx.objectStore(IDB_STORE);
                const getReq = store.get("all_students");
                getReq.onsuccess = () => {
                    if (getReq.result && Array.isArray(getReq.result.data) && getReq.result.data.length > 0) {
                        // Jika localStorage kosong atau jumlah siswa di IDB lebih banyak, pulihkan dari IDB
                        if (!this._studentsCache || this._studentsCache.length < getReq.result.data.length) {
                            this._studentsCache = getReq.result.data;
                            this.saveStudents(getReq.result.data, false);
                        }
                    }
                };
            };
        } catch (e) {
            console.warn("IndexedDB init notice:", e);
        }
    },

    saveStudentsToIndexedDB(studentsList) {
        if (!window.indexedDB || !Array.isArray(studentsList)) return;
        try {
            const req = window.indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE, { keyPath: "key" });
                }
            };
            req.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction(IDB_STORE, "readwrite");
                const store = tx.objectStore(IDB_STORE);
                store.put({ key: "all_students", data: studentsList, updatedAt: Date.now() });
            };
        } catch (e) {
            console.warn("IndexedDB save notice:", e);
        }
    },

    getData() {
        const data = localStorage.getItem(STORAGE_KEY);
        let parsed = null;
        if (!data) {
            this.init();
            try { parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
        } else {
            try {
                parsed = JSON.parse(data);
            } catch (e) {
                this.resetToDefault();
                try { parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
            }
        }
        if (!parsed || typeof parsed !== 'object') parsed = {};

        // Selalu hubungkan data siswa dari manajemen penyimpanan siswa
        parsed.students = this.getStudents();
        return parsed;
    },

    saveData(data) {
        if (!data) return;

        // Jika data mengandung array siswa, simpan via manajemen siswa ber-chunk
        if (Array.isArray(data.students)) {
            this.saveStudents(data.students);
        }

        // Simpan data konfigurasi & master ke STORAGE_KEY tanpa membengkakkan ukuran
        const toSave = { ...data };
        toSave.students = []; // kosongkan pada STORAGE_KEY agar ukuran tetap < 50KB

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
            console.error("Gagal menyimpan ke localStorage (kemungkinan kuota penuh):", e);
            if (window.App && typeof App.showToast === "function") {
                App.showToast("Penyimpanan lokal penuh. Harap gunakan gambar berukuran lebih kecil.");
            }
        }
    },

    // PENGATURAN SEKOLAH (SUPER ADMIN)
    getConfig() {
        const stored = this.getData().config || {};
        const config = { ...DEFAULT_CONFIG, ...stored };
        if (!config.dashboardBgUrl || config.dashboardBgUrl === "none" || config.dashboardBgUrl.trim() === "" || config.dashboardBgUrl.includes("photo-1541829070764-84a7d30dd3f3")) {
            config.dashboardBgUrl = DEFAULT_CONFIG.dashboardBgUrl;
        }
        return config;
    },

    updateConfig(newConfig) {
        const data = this.getData();
        data.config = { ...data.config, ...newConfig };
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.pushConfig === "function") {
            SupabaseClient.pushConfig(data.config);
        }
        return data.config;
    },

    // KATA-KATA MUTIARA / MOTIVASI (SUPER ADMIN)
    getQuotes() {
        return this.getData().quotes || DEFAULT_QUOTES;
    },

    addQuote(quoteData) {
        const data = this.getData();
        if (!data.quotes) data.quotes = [];
        data.quotes.unshift({
            quote: quoteData.quote,
            tokoh: quoteData.tokoh || "Pesan Kesiswaan",
            warna: quoteData.warna || "ocean",
            font: quoteData.font || "playfair",
            efek: quoteData.efek || "all",
            kategori: quoteData.kategori || "💡 Kata Mutiara & Motivasi Hari Ini",
            customColor: quoteData.customColor || ""
        });
        this.saveData(data);
    },

    deleteQuote(index) {
        const data = this.getData();
        if (data.quotes && data.quotes.length > 1) {
            data.quotes.splice(index, 1);
            this.saveData(data);
        }
    },

    // KELOLA GURU / KESISWAAN (SUPER ADMIN)
    getTeachers() {
        const data = this.getData();
        if (!data.teachers || !Array.isArray(data.teachers) || data.teachers.length === 0 || !data.teachers.some(t => t.username.toLowerCase() === "admin")) {
            data.teachers = JSON.parse(JSON.stringify(DEFAULT_TEACHERS));
            this.saveData(data);
        }
        return data.teachers;
    },

    getTeacherByUsername(username) {
        const teachers = this.getTeachers();
        return teachers.find(t => t.username.toLowerCase() === username.toLowerCase()) || null;
    },

    addTeacher(teacherData) {
        const data = this.getData();
        if (!data.teachers) data.teachers = JSON.parse(JSON.stringify(DEFAULT_TEACHERS));
        const exists = data.teachers.some(t => t.username.toLowerCase() === teacherData.username.toLowerCase());
        if (exists) throw new Error("Username sudah digunakan guru lain!");

        data.teachers.push({
            username: teacherData.username.trim(),
            password: teacherData.password || "123",
            name: teacherData.name.trim(),
            role: teacherData.role || "guru",
            roleLabel: teacherData.roleLabel || "Staf Kesiswaan",
            sekbid: teacherData.sekbid || "-",
            pokja: teacherData.pokja || "-",
            pembina: teacherData.pembina || teacherData.pokja || "-",
            kelas: teacherData.kelas || "-",
            icon: teacherData.icon || (teacherData.role === "superadmin" ? "👑" : "👨‍🏫")
        });
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.pushTeacher === "function") {
            SupabaseClient.pushTeacher(teacherData);
        }
        return true;
    },

    updateTeacher(username, updatedData) {
        const data = this.getData();
        if (!data.teachers) data.teachers = JSON.parse(JSON.stringify(DEFAULT_TEACHERS));
        const index = data.teachers.findIndex(t => t.username.toLowerCase() === username.toLowerCase());
        if (index === -1) throw new Error("Data guru tidak ditemukan!");

        const current = data.teachers[index];
        const newRole = updatedData.role !== undefined ? updatedData.role : current.role;
        const newRoleLabel = updatedData.roleLabel ? updatedData.roleLabel.trim() : current.roleLabel;

        // Validasi dan pembaruan username
        let finalUsername = current.username;
        if (updatedData.username && updatedData.username.trim() !== "") {
            const candidate = updatedData.username.trim();
            if (!/^[a-zA-Z0-9._-]+$/.test(candidate)) {
                throw new Error("Username hanya boleh terdiri dari huruf, angka, titik (.), strip (-), atau garis bawah (_) tanpa spasi!");
            }
            if (candidate.toLowerCase() !== current.username.toLowerCase()) {
                if (current.username.toLowerCase() === "admin") {
                    throw new Error("Username akun Super Admin utama 'admin' tidak dapat diubah!");
                }
                const isTaken = data.teachers.some(t => t.username.toLowerCase() === candidate.toLowerCase());
                if (isTaken) {
                    throw new Error(`Username "${candidate}" sudah digunakan oleh guru lain! Silakan pilih username lain.`);
                }
                finalUsername = candidate;
            }
        }

        const oldUsername = current.username;
        const isUsernameChanged = finalUsername.toLowerCase() !== oldUsername.toLowerCase();

        data.teachers[index] = {
            ...current,
            username: finalUsername,
            name: updatedData.name ? updatedData.name.trim() : current.name,
            role: newRole,
            roleLabel: newRoleLabel,
            sekbid: updatedData.sekbid !== undefined ? updatedData.sekbid.trim() : (current.sekbid || "-"),
            pokja: updatedData.pokja !== undefined ? updatedData.pokja.trim() : (current.pokja || "-"),
            pembina: updatedData.pembina !== undefined ? updatedData.pembina.trim() : (current.pembina || current.pokja || "-"),
            kelas: updatedData.kelas !== undefined ? updatedData.kelas.trim() : (current.kelas || "-"),
            password: updatedData.password ? updatedData.password.trim() : current.password,
            icon: updatedData.icon || (newRole === "superadmin" ? "👑" : (current.icon || "👨‍🏫"))
        };
        this.saveData(data);

        if (window.SupabaseClient) {
            if (isUsernameChanged && typeof SupabaseClient.deleteTeacher === "function") {
                SupabaseClient.deleteTeacher(oldUsername);
            }
            if (typeof SupabaseClient.pushTeacher === "function") {
                SupabaseClient.pushTeacher(data.teachers[index]);
            }
        }
        return data.teachers[index];
    },

    deleteTeacher(username) {
        const data = this.getData();
        if (username === "admin") throw new Error("Akun Super Admin utama tidak boleh dihapus!");
        data.teachers = (data.teachers || []).filter(t => t.username !== username);
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.deleteTeacher === "function") {
            SupabaseClient.deleteTeacher(username);
        }
        return true;
    },

    // KELOLA KEGIATAN KESISWAAN (ADMIN & SUPER ADMIN)
    getActivities() {
        return this.getData().activities || DAFTAR_KEGIATAN;
    },

    addActivity(activityData) {
        const data = this.getData();
        if (!data.activities) data.activities = [];
        const newAct = {
            id: "ACT-" + Date.now(),
            nama: activityData.nama,
            tanggal: activityData.tanggal,
            kategori: activityData.kategori || "Kegiatan Sekolah",
            tempat: activityData.tempat || "Lingkungan Sekolah",
            keterangan: activityData.keterangan || "",
            foto: activityData.foto || ""
        };
        data.activities.unshift(newAct);
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.pushActivity === "function") {
            SupabaseClient.pushActivity(newAct);
        }
        return newAct;
    },

    deleteActivity(activityId) {
        const data = this.getData();
        data.activities = (data.activities || []).filter(a => a.id !== activityId);
        this.saveData(data);
        return true;
    },

    // MASTER JENIS PELANGGARAN & POIN (SUPER ADMIN)
    getViolationsMaster() {
        return this.getData().violationsMaster || MASTER_PELANGGARAN;
    },

    addViolationMaster(violationData) {
        const data = this.getData();
        if (!data.violationsMaster) data.violationsMaster = [...MASTER_PELANGGARAN];
        const newV = {
            id: "P" + (Date.now().toString().slice(-4)),
            nama: violationData.nama ? violationData.nama.trim() : "",
            kategori: violationData.kategori || "Kedisiplinan",
            poin: Math.min(150, Math.max(1, Number(violationData.poin) || 5))
        };
        data.violationsMaster.push(newV);
        this.saveData(data);
        return newV;
    },

    updateViolationMaster(id, violationData) {
        const data = this.getData();
        if (!data.violationsMaster) data.violationsMaster = [...MASTER_PELANGGARAN];
        const index = data.violationsMaster.findIndex(v => v.id === id);
        if (index !== -1) {
            data.violationsMaster[index] = {
                ...data.violationsMaster[index],
                nama: violationData.nama !== undefined ? violationData.nama.trim() : data.violationsMaster[index].nama,
                kategori: violationData.kategori !== undefined ? violationData.kategori : data.violationsMaster[index].kategori,
                poin: violationData.poin !== undefined ? Math.min(150, Math.max(1, Number(violationData.poin) || 1)) : data.violationsMaster[index].poin
            };
            this.saveData(data);
            return data.violationsMaster[index];
        }
        return null;
    },

    deleteViolationMaster(id) {
        const data = this.getData();
        data.violationsMaster = (data.violationsMaster || MASTER_PELANGGARAN).filter(v => v.id !== id);
        this.saveData(data);
        return true;
    },

    // ATURAN RENTANG POIN & SANKSI OTOMATIS (SUPER ADMIN)
    getRules() {
        return this.getData().rules || DEFAULT_RULES;
    },

    updateRules(newRules) {
        const data = this.getData();
        data.rules = newRules;
        if (Array.isArray(data.rules)) {
            data.rules.sort((a, b) => (Number(a.minPoint) || 0) - (Number(b.minPoint) || 0));
        }
        this.saveData(data);
        return data.rules;
    },

    addRule(ruleData) {
        const data = this.getData();
        if (!data.rules) data.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
        const newRule = {
            minPoint: Math.max(0, Number(ruleData.minPoint) || 0),
            maxPoint: Number(ruleData.maxPoint) >= 9999 ? 9999 : Math.max(0, Number(ruleData.maxPoint) || 9999),
            status: (ruleData.status || "Aturan Sanksi Baru").trim(),
            action: (ruleData.action || ruleData.tindakLanjut || "Pembinaan").trim(),
            tindakLanjut: (ruleData.action || ruleData.tindakLanjut || "Pembinaan").trim(),
            badgeClass: ruleData.badgeClass || "pill-yellow"
        };
        data.rules.push(newRule);
        data.rules.sort((a, b) => a.minPoint - b.minPoint);
        this.saveData(data);
        return data.rules;
    },

    updateRule(index, ruleData) {
        const data = this.getData();
        if (!data.rules) data.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
        if (data.rules[index]) {
            const minP = ruleData.minPoint !== undefined ? Math.max(0, Number(ruleData.minPoint) || 0) : data.rules[index].minPoint;
            const maxP = ruleData.maxPoint !== undefined ? (Number(ruleData.maxPoint) >= 9999 ? 9999 : Math.max(0, Number(ruleData.maxPoint))) : data.rules[index].maxPoint;
            const act = ruleData.action !== undefined ? ruleData.action.trim() : (data.rules[index].action || data.rules[index].tindakLanjut || "");

            data.rules[index] = {
                ...data.rules[index],
                minPoint: minP,
                maxPoint: maxP,
                status: ruleData.status !== undefined ? ruleData.status.trim() : data.rules[index].status,
                action: act,
                tindakLanjut: act,
                badgeClass: ruleData.badgeClass || data.rules[index].badgeClass || "pill-yellow"
            };
            data.rules.sort((a, b) => a.minPoint - b.minPoint);
            this.saveData(data);
            return data.rules;
        }
        return null;
    },

    deleteRule(index) {
        const data = this.getData();
        if (!data.rules) data.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
        if (data.rules.length > 1 && data.rules[index]) {
            data.rules.splice(index, 1);
            this.saveData(data);
            return data.rules;
        }
        return null;
    },

    resetRulesToDefault() {
        const data = this.getData();
        data.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
        this.saveData(data);
        return data.rules;
    },

    getRuleForPoints(points) {
        const rules = this.getRules();
        for (const rule of rules) {
            if (points >= rule.minPoint && points <= rule.maxPoint) {
                return rule;
            }
        }
        return rules[0] || { minPoint: 0, maxPoint: 15, status: "Aman", action: "Peringatan lisan & pembinaan wali kelas", badgeClass: "pill-green" };
    },

    // TEMPLATE SURAT PANGGILAN ORANG TUA (SUPER ADMIN)
    getSuratTemplate() {
        const data = this.getData();
        const t = data.suratTemplate || DEFAULT_SURAT_TEMPLATE;
        // Sanitasi: Jika kopInstansi kosong, '-', atau dummy lama, kembalikan teks resmi SMKN 1 Magelang
        if (!t.kopInstansi || t.kopInstansi.trim() === '-' || t.kopInstansi.includes('PEMERINTAH PROVINSI PENDIDIKAN')) {
            t.kopInstansi = (typeof DEFAULT_SURAT_TEMPLATE !== 'undefined' && DEFAULT_SURAT_TEMPLATE.kopInstansi)
                ? DEFAULT_SURAT_TEMPLATE.kopInstansi
                : "PEMERINTAH PROVINSI JAWA TENGAH\nDINAS PENDIDIKAN DAN KEBUDAYAAN\nSMK NEGERI 1 MAGELANG";
        }
        return t;
    },

    updateSuratTemplate(newTemplate) {
        const data = this.getData();
        data.suratTemplate = { ...(data.suratTemplate || DEFAULT_SURAT_TEMPLATE), ...newTemplate };
        this.saveData(data);
        return data.suratTemplate;
    },

    // KOP SURAT RESMI STANDAR (DIGUNAKAN SERAGAM UNTUK SP, RAPOR KARAKTER, & DOKUMEN CETAK)
    getOfficialKopHtml() {
        const template = this.getSuratTemplate();
        const config = this.getConfig();

        // 1. Jika Super Admin mengunggah gambar file kop surat resmi
        if (template && template.kopImageUrl) {
            return `
                <div style="border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 18px; text-align: center;">
                    <img src="${template.kopImageUrl}" alt="Kop Surat Resmi" style="width: 100%; max-height: 130px; object-fit: contain;">
                </div>
            `;
        }

        // 2. Format Teks Kop Resmi Standar SMK Negeri 1 Magelang
        let kopText = (template && template.kopInstansi ? template.kopInstansi : "").trim();
        if (!kopText || kopText === "-" || kopText.includes("PEMERINTAH PROVINSI PENDIDIKAN")) {
            kopText = "PEMERINTAH PROVINSI JAWA TENGAH\nDINAS PENDIDIKAN DAN KEBUDAYAAN\nSMK NEGERI 1 MAGELANG";
        }

        const addressText = "Jl. Cawang No. 2, Magelang - Telp. (0293) 362249 • Website: smkn1magelang.sch.id";

        const logoImg = (config.schoolLogoUrl && (config.schoolLogoUrl.startsWith("data:image") || config.schoolLogoUrl.startsWith("http")))
            ? config.schoolLogoUrl
            : ((config.logo && (config.logo.startsWith("data:image") || config.logo.startsWith("http"))) ? config.logo : null);
        const logoEmoji = config.schoolLogo || config.logo || "🏫";

        return `
            <div style="border-bottom: 3px double #000000; padding-bottom: 12px; margin-bottom: 20px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 15px;">
                ${logoImg ? `
                    <img src="${logoImg}" alt="Logo" style="width: 70px; height: 70px; object-fit: contain;">
                ` : `
                    <div style="font-size: 2.8rem; line-height: 1;">${logoEmoji}</div>
                `}
                <div style="text-align: center; flex: 1;">
                    <h3 style="font-size: 11pt; margin: 0; font-weight: bold; text-transform: uppercase; color: #000; white-space: pre-line; line-height: 1.35;">${kopText}</h3>
                    <p style="font-size: 8.5pt; margin: 3px 0 0 0; color: #333;">${addressText}</p>
                </div>
            </div>
        `;
    },

    // REGISTRY NOMOR SURAT RAPOR KARAKTER HARIAN (1 NOMOR PER HARI CETAK, GANTI HARI GANTI NOMOR)
    getRaporDailyNumber(date = new Date()) {
        const year = date.getFullYear();
        const y = String(year);
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;

        const STORAGE_KEY = "kesiswaan_rapor_number_registry";
        let registry = {};
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) registry = JSON.parse(raw);
        } catch (e) {
            console.error("Gagal membaca registry nomor rapor:", e);
        }

        if (!registry[y] || typeof registry[y] !== "object") {
            registry[y] = {
                dates: {},
                maxNumber: 0
            };
        }

        if (registry[y].dates && registry[y].dates[dateKey]) {
            return registry[y].dates[dateKey];
        }

        const nextNum = (registry[y].maxNumber || 0) + 1;
        if (!registry[y].dates) registry[y].dates = {};
        registry[y].dates[dateKey] = nextNum;
        registry[y].maxNumber = nextNum;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
        } catch (e) {
            console.error("Gagal menyimpan registry nomor rapor:", e);
        }

        return nextNum;
    },

    getFormattedRaporNumber(date = new Date()) {
        const num = this.getRaporDailyNumber(date);
        const paddedNum = String(num).padStart(3, '0');
        const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
        const romanMonth = ROMAN_MONTHS[date.getMonth()] || "I";
        const year = date.getFullYear();

        return `421.7 / ${paddedNum} / ${romanMonth} / RAPOR-KRK / ${year}`;
    },

    // CEK APAKAH SISWA SUDAH MENCAPAI BATAS KADAR SP UNTUK SURAT PANGGILAN ORTU (>= 31 Poin)
    isStudentEligibleForSummons(student) {
        if (!student) return false;
        const status = this.calculateStudentStatus(student);
        // Batas Poin SP adalah >= 31 (dimulai dari Panggilan Orang Tua I / SP 1)
        return (status.totalPoinPelanggaran || 0) >= 31;
    },

    // DATA PRESTASI GLOBAL (UNTUK KELOLA PRESTASI DI ADMIN)
    getAllAchievements() {
        const students = this.getStudents();
        let all = [];
        students.forEach(s => {
            (s.prestasi || []).forEach(p => {
                all.push({
                    ...p,
                    siswaId: s.id,
                    siswaNama: s.nama,
                    siswaKelas: s.kelas,
                    siswaFoto: s.foto
                });
            });
        });
        return all.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
    },

    deleteAchievement(achievementId) {
        const data = this.getData();
        let found = false;
        (data.students || []).forEach(s => {
            if (s.prestasi) {
                const prevLen = s.prestasi.length;
                s.prestasi = s.prestasi.filter(p => p.id !== achievementId);
                if (s.prestasi.length < prevLen) found = true;
            }
        });
        if (found) this.saveData(data);
        return found;
    },

    // DATA SISWA
    getStudents() {
        if (this._studentsCache && Array.isArray(this._studentsCache) && this._studentsCache.length > 0) {
            return this._studentsCache;
        }

        // 1. Baca dari chunked storage di localStorage
        try {
            const metaRaw = localStorage.getItem(STUDENTS_META_KEY);
            if (metaRaw) {
                const meta = JSON.parse(metaRaw);
                if (meta && typeof meta.chunks === "number" && meta.chunks > 0) {
                    let all = [];
                    for (let i = 0; i < meta.chunks; i++) {
                        const chunkRaw = localStorage.getItem(STUDENTS_CHUNK_PREFIX + i);
                        if (chunkRaw) {
                            const parsedChunk = JSON.parse(chunkRaw);
                            if (Array.isArray(parsedChunk)) {
                                all = all.concat(parsedChunk);
                            }
                        }
                    }
                    if (all.length > 0) {
                        this._studentsCache = all;
                        return all;
                    }
                }
            }
        } catch (e) {
            console.warn("Gagal membaca chunked student storage:", e);
        }

        // 2. Fallback baca dari legacy STORAGE_KEY
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.students) && parsed.students.length > 0) {
                    this._studentsCache = parsed.students;
                    setTimeout(() => {
                        this.saveStudents(parsed.students);
                    }, 50);
                    return parsed.students;
                }
            }
        } catch (e) {
            console.warn("Gagal membaca legacy student storage:", e);
        }

        // 3. Fallback default INITIAL_STUDENTS
        const initial = (typeof INITIAL_STUDENTS !== 'undefined' && Array.isArray(INITIAL_STUDENTS)) ? INITIAL_STUDENTS : [];
        this._studentsCache = JSON.parse(JSON.stringify(initial));
        return this._studentsCache;
    },

    saveStudents(studentsList, syncIdb = true) {
        if (!Array.isArray(studentsList)) return;
        this._studentsCache = studentsList;

        const CHUNK_SIZE = 350;
        const totalChunks = Math.ceil(studentsList.length / CHUNK_SIZE) || 1;

        try {
            let oldChunksCount = 0;
            const oldMetaRaw = localStorage.getItem(STUDENTS_META_KEY);
            if (oldMetaRaw) {
                try {
                    oldChunksCount = JSON.parse(oldMetaRaw).chunks || 0;
                } catch (e) {}
            }

            for (let i = 0; i < totalChunks; i++) {
                const slice = studentsList.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                localStorage.setItem(STUDENTS_CHUNK_PREFIX + i, JSON.stringify(slice));
            }

            for (let i = totalChunks; i < oldChunksCount; i++) {
                localStorage.removeItem(STUDENTS_CHUNK_PREFIX + i);
            }

            const meta = {
                total: studentsList.length,
                chunks: totalChunks,
                chunkSize: CHUNK_SIZE,
                updatedAt: Date.now()
            };
            localStorage.setItem(STUDENTS_META_KEY, JSON.stringify(meta));
        } catch (e) {
            console.error("Gagal menyimpan chunk siswa ke localStorage:", e);
        }

        if (syncIdb) {
            this.saveStudentsToIndexedDB(studentsList);
        }
    },

    getStudentById(id) {
        if (id === undefined || id === null) return null;
        const clean = String(id).trim().toLowerCase();
        if (!clean) return null;
        return this.getStudents().find(s => 
            (s.id !== undefined && s.id !== null && String(s.id).trim().toLowerCase() === clean) || 
            (s.nisn !== undefined && s.nisn !== null && String(s.nisn).trim().toLowerCase() === clean) || 
            (s.nis !== undefined && s.nis !== null && String(s.nis).trim().toLowerCase() === clean)
        ) || null;
    },

    getStudentByNisn(nisn) {
        if (nisn === undefined || nisn === null) return null;
        const clean = String(nisn).trim().toLowerCase();
        if (!clean) return null;
        return this.getStudents().find(s => 
            (s.nisn !== undefined && s.nisn !== null && String(s.nisn).trim().toLowerCase() === clean) || 
            (s.nis !== undefined && s.nis !== null && String(s.nis).trim().toLowerCase() === clean) || 
            (s.id !== undefined && s.id !== null && String(s.id).trim().toLowerCase() === clean)
        ) || null;
    },

    calculateStudentStatus(student) {
        const totalPoinPelanggaran = (student.pelanggaran || []).reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0);
        const totalPrestasi = (student.prestasi || []).length;
        
        const rules = this.getData().rules || DEFAULT_RULES;
        let ruleMatch = rules[0];

        for (const rule of rules) {
            if (totalPoinPelanggaran >= rule.minPoint && totalPoinPelanggaran <= rule.maxPoint) {
                ruleMatch = rule;
                break;
            }
        }

        return {
            totalPoinPelanggaran,
            totalPoinPrestasi: 0,
            totalPrestasi,
            saldoPoinKebaikan: Math.max(0, 100 - totalPoinPelanggaran),
            statusText: ruleMatch ? ruleMatch.status : "Aman",
            actionText: ruleMatch ? ruleMatch.action : "Tidak ada sanksi",
            badgeClass: ruleMatch ? ruleMatch.badgeClass : "pill-green",
            isBermasalah: totalPoinPelanggaran >= 31,
            isBerprestasi: totalPrestasi > 0
        };
    },

    addViolation(studentId, violationData) {
        const data = this.getData();
        const index = data.students.findIndex(s => s.id === studentId);
        if (index === -1) throw new Error("Siswa tidak ditemukan");

        const item = {
            id: "PL-" + Date.now(),
            tanggal: violationData.tanggal || new Date().toISOString().split("T")[0],
            nama: violationData.nama,
            kategori: violationData.kategori || "Kedisiplinan",
            poin: Number(violationData.poin) || 5,
            sanksi: violationData.sanksi || "Pembinaan lisan",
            pencatat: violationData.pencatat || "Guru Piket"
        };

        if (!data.students[index].pelanggaran) data.students[index].pelanggaran = [];
        data.students[index].pelanggaran.unshift(item);
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.pushViolation === "function") {
            SupabaseClient.pushViolation(item, data.students[index].nisn);
        }
        return item;
    },

    addAchievement(studentId, achievementData) {
        const data = this.getData();
        const index = data.students.findIndex(s => s.id === studentId);
        if (index === -1) throw new Error("Siswa tidak ditemukan");

        const defaultFoto = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80";
        const item = {
            id: "PR-" + Date.now(),
            tanggal: achievementData.tanggal || new Date().toISOString().split("T")[0],
            nama: achievementData.nama,
            kategori: achievementData.kategori || "Akademik",
            tingkat: achievementData.tingkat || "Sekolah",
            peringkat: achievementData.peringkat || "Juara 1",
            penyelenggara: achievementData.penyelenggara || "-",
            piagam: achievementData.piagam || "",
            poin: 0,
            foto: achievementData.foto || achievementData.piagam || defaultFoto,
            keterangan: achievementData.keterangan || `${achievementData.peringkat || 'Juara'} ${achievementData.tingkat || ''} (${achievementData.penyelenggara || '-'})`,
            pencatat: achievementData.pencatat || "Tim Kesiswaan"
        };

        if (!data.students[index].prestasi) data.students[index].prestasi = [];
        data.students[index].prestasi.unshift(item);
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.pushAchievement === "function") {
            SupabaseClient.pushAchievement(item, data.students[index].nisn);
        }
        return item;
    },

    addStudent(newStudent) {
        const data = this.getData();
        const exists = data.students.some(s => s.nisn === newStudent.nisn);
        if (exists) throw new Error("NISN sudah terdaftar!");

        const student = {
            id: "SIS-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            no: newStudent.no || (data.students.length + 1),
            foto: newStudent.foto || (newStudent.gender === "P" 
                ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" 
                : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"),
            nis: newStudent.nis || "",
            nisn: newStudent.nisn,
            nama: newStudent.nama,
            gender: newStudent.gender || "L",
            kelas: newStudent.kelas,
            jurusan: newStudent.jurusan || "-",
            nomorHp: newStudent.nomorHp || "",
            alamat: newStudent.alamat || "",
            mapsAlamat: newStudent.mapsAlamat || "",
            namaOrtuBapak: newStudent.namaOrtuBapak || "",
            namaOrtuIbu: newStudent.namaOrtuIbu || "",
            noHpBapak: newStudent.noHpBapak || "",
            noHpIbu: newStudent.noHpIbu || "",
            inputSpmb: newStudent.inputSpmb || "",
            waliKelas: newStudent.waliKelas || "-",
            kontakOrtu: newStudent.kontakOrtu || newStudent.noHpBapak || newStudent.noHpIbu || "-",
            prestasi: [],
            pelanggaran: []
        };

        data.students.push(student);
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.pushStudent === "function") {
            SupabaseClient.pushStudent(student);
        }
        return student;
    },

    updateStudent(studentId, updatedData) {
        const data = this.getData();
        const index = data.students.findIndex(s => s.id === studentId || s.nisn === studentId);
        if (index === -1) throw new Error("Data siswa tidak ditemukan.");

        // Cek jika NISN diubah dan bentrok dengan siswa lain
        if (updatedData.nisn && updatedData.nisn !== data.students[index].nisn) {
            const conflict = data.students.some((s, idx) => idx !== index && s.nisn === updatedData.nisn);
            if (conflict) throw new Error("NISN baru sudah digunakan oleh siswa lain!");
        }

        const current = data.students[index];
        data.students[index] = {
            ...current,
            ...updatedData,
            // Pastikan riwayat prestasi & pelanggaran tetap terjaga
            id: current.id,
            prestasi: current.prestasi || [],
            pelanggaran: current.pelanggaran || [],
            // Fallback kontak ortu
            kontakOrtu: updatedData.kontakOrtu || updatedData.noHpBapak || updatedData.noHpIbu || current.kontakOrtu || "-"
        };

        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.pushStudent === "function") {
            SupabaseClient.pushStudent(data.students[index]);
        }
        return data.students[index];
    },

    deleteStudent(studentId) {
        const data = this.getData();
        const st = data.students.find(s => s.id === studentId || s.nisn === studentId);
        if (!st) return false;
        data.students = data.students.filter(s => s.id !== studentId && s.nisn !== studentId);
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.deleteStudent === "function") {
            SupabaseClient.deleteStudent(st.nisn);
        }
        return true;
    },

    importStudents(studentsList, mode = 'upsert') {
        const existingStudents = [...this.getStudents()];
        let addedCount = 0;
        let updatedCount = 0;

        const supplement = (oldVal, newVal) => {
            if (newVal === undefined || newVal === null) return oldVal || "";
            const strNew = String(newVal).trim();
            if (strNew === "" || strNew === "-" || strNew === "--" || strNew === "null" || strNew === "undefined") {
                return oldVal || "";
            }
            return strNew;
        };

        const normalizeName = (str) => String(str || "").toLowerCase().replace(/\s+/g, " ").trim();
        const normalizeClass = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        const isRealNis = (v) => {
            if (!v) return false;
            const s = String(v).trim().toUpperCase();
            return !s.startsWith("NIS-") && !s.startsWith("SIS-") && s !== "-" && s.length >= 3;
        };

        const isSameStudent = (existing, incoming) => {
            const eName = normalizeName(existing.nama);
            const iName = normalizeName(incoming.nama);
            const eKelas = normalizeClass(existing.kelas);
            const iKelas = normalizeClass(incoming.kelas);

            // 1. Syarat utama: Nama dan Kelas sama persis -> pasti siswa yang sama!
            if (eName && iName && eName === iName) {
                if (eKelas && iKelas) {
                    if (eKelas === iKelas) return true;
                } else {
                    return true;
                }
            }

            // 2. Cocokkan NIS nomor induk asli (bukan kode NIS-XXXX dummy)
            const cleanENis = String(existing.nis || "").trim();
            const cleanINis = String(incoming.nis || "").trim();
            if (isRealNis(cleanENis) && isRealNis(cleanINis) && cleanENis.toLowerCase() === cleanINis.toLowerCase()) {
                return true;
            }

            // 3. Cocokkan NISN asli
            const cleanENisn = String(existing.nisn || "").trim();
            const cleanINisn = String(incoming.nisn || "").trim();
            if (isRealNis(cleanENisn) && isRealNis(cleanINisn) && cleanENisn.toLowerCase() === cleanINisn.toLowerCase()) {
                return true;
            }

            return false;
        };

        if (mode === 'replace') {
            const newStudents = studentsList.map((s, idx) => {
                const autoNis = s.nis || s.nisn || `NIS-${String(idx + 1).padStart(4, '0')}`;
                return {
                    id: "SIS-" + Date.now() + "-" + idx,
                    no: s.no || (idx + 1),
                    foto: s.foto || "",
                    nis: autoNis,
                    nisn: s.nisn || autoNis,
                    nama: String(s.nama || `Siswa ${idx + 1}`).trim(),
                    gender: s.gender || "L",
                    kelas: s.kelas || "-",
                    jurusan: s.jurusan || "-",
                    tempatLahir: s.tempatLahir || "",
                    tanggalLahir: s.tanggalLahir || "",
                    agama: s.agama || "",
                    tempatTinggal: s.tempatTinggal || "",
                    alamat: s.alamat || "",
                    mapsAlamat: s.mapsAlamat || "",
                    nomorHp: s.nomorHp || "",
                    namaOrtuBapak: s.namaOrtuBapak || "",
                    pekerjaanBapak: s.pekerjaanBapak || "",
                    noHpBapak: s.noHpBapak || "-",
                    namaOrtuIbu: s.namaOrtuIbu || "",
                    pekerjaanIbu: s.pekerjaanIbu || "",
                    noHpIbu: s.noHpIbu || "-",
                    inputSpmb: s.inputSpmb || "",
                    waliKelas: s.waliKelas || "-",
                    kontakOrtu: (s.noHpBapak && s.noHpBapak !== "-") ? s.noHpBapak : (s.noHpIbu || "-"),
                    prestasi: [],
                    pelanggaran: []
                };
            });
            this.saveStudents(newStudents);
            return { total: newStudents.length, added: newStudents.length, updated: 0 };
        }

        // Mode Upsert / Tambah Baru
        studentsList.forEach((newS, idx) => {
            const studentName = String(newS.nama || '').trim();
            // Valid jika setidaknya ada nama atau NIS
            if (!studentName && !newS.nis && !newS.nisn) return;

            const existingIdx = existingStudents.findIndex(s => isSameStudent(s, newS));

            if (existingIdx !== -1) {
                // Siswa sudah terdaftar: Lakukan susulan data TANPA mengubah/menghapus data lama jika kolom baru kosong
                if (mode === 'upsert') {
                    const current = existingStudents[existingIdx];

                    // Upgrade NIS: jika data lama adalah dummy tapi data baru punya NIS asli, gunakan yang asli
                    let finalNis = current.nis;
                    if (!isRealNis(current.nis) && isRealNis(newS.nis)) {
                        finalNis = newS.nis;
                    } else if (!current.nis && newS.nis) {
                        finalNis = newS.nis;
                    }

                    let finalNisn = current.nisn;
                    if (!isRealNis(current.nisn) && isRealNis(newS.nisn)) {
                        finalNisn = newS.nisn;
                    } else if (!current.nisn && newS.nisn) {
                        finalNisn = newS.nisn;
                    }

                    // Susulkan data baru tanpa merusak data lama
                    existingStudents[existingIdx] = {
                        ...current,
                        no: newS.no || current.no || (existingIdx + 1),
                        foto: newS.foto ? supplement(current.foto, newS.foto) : (current.foto || ""),
                        nis: finalNis || current.nis || "",
                        nisn: finalNisn || current.nisn || finalNis || "",
                        nama: supplement(current.nama, newS.nama),
                        gender: supplement(current.gender, newS.gender) || "L",
                        kelas: supplement(current.kelas, newS.kelas),
                        jurusan: supplement(current.jurusan, newS.jurusan) || "-",
                        tempatLahir: supplement(current.tempatLahir, newS.tempatLahir),
                        tanggalLahir: supplement(current.tanggalLahir, newS.tanggalLahir),
                        agama: supplement(current.agama, newS.agama),
                        tempatTinggal: supplement(current.tempatTinggal, newS.tempatTinggal),
                        alamat: supplement(current.alamat, newS.alamat),
                        mapsAlamat: supplement(current.mapsAlamat, newS.mapsAlamat),
                        nomorHp: supplement(current.nomorHp, newS.nomorHp),
                        namaOrtuBapak: supplement(current.namaOrtuBapak, newS.namaOrtuBapak),
                        pekerjaanBapak: supplement(current.pekerjaanBapak, newS.pekerjaanBapak),
                        noHpBapak: supplement(current.noHpBapak, newS.noHpBapak) || "-",
                        namaOrtuIbu: supplement(current.namaOrtuIbu, newS.namaOrtuIbu),
                        pekerjaanIbu: supplement(current.pekerjaanIbu, newS.pekerjaanIbu),
                        noHpIbu: supplement(current.noHpIbu, newS.noHpIbu) || "-",
                        inputSpmb: supplement(current.inputSpmb, newS.inputSpmb),
                        waliKelas: supplement(current.waliKelas, newS.waliKelas) || "-",
                        kontakOrtu: supplement(current.kontakOrtu, (newS.noHpBapak && newS.noHpBapak !== "-") ? newS.noHpBapak : newS.noHpIbu) || "-",
                        // Jaga riwayat poin, prestasi & pelanggaran tetap utuh dan aman
                        id: current.id,
                        prestasi: current.prestasi || [],
                        pelanggaran: current.pelanggaran || []
                    };
                    updatedCount++;
                }
            } else {
                // Siswa baru: Buatkan data siswa dasar
                const autoNis = newS.nis || newS.nisn || `NIS-${String(existingStudents.length + addedCount + 1).padStart(4, '0')}`;
                const student = {
                    id: "SIS-" + Date.now() + "-" + idx + "-" + Math.floor(Math.random() * 1000),
                    no: newS.no || (existingStudents.length + 1),
                    foto: newS.foto || "",
                    nis: autoNis,
                    nisn: String(newS.nisn || autoNis).trim(),
                    nama: studentName || `Siswa ${existingStudents.length + 1}`,
                    gender: newS.gender || "L",
                    kelas: newS.kelas || "-",
                    jurusan: newS.jurusan || "-",
                    tempatLahir: newS.tempatLahir || "",
                    tanggalLahir: newS.tanggalLahir || "",
                    agama: newS.agama || "",
                    tempatTinggal: newS.tempatTinggal || "",
                    alamat: newS.alamat || "",
                    mapsAlamat: newS.mapsAlamat || "",
                    nomorHp: newS.nomorHp || "",
                    namaOrtuBapak: newS.namaOrtuBapak || "",
                    pekerjaanBapak: newS.pekerjaanBapak || "",
                    noHpBapak: newS.noHpBapak || "-",
                    namaOrtuIbu: newS.namaOrtuIbu || "",
                    pekerjaanIbu: newS.pekerjaanIbu || "",
                    noHpIbu: newS.noHpIbu || "-",
                    inputSpmb: newS.inputSpmb || "",
                    waliKelas: newS.waliKelas || "-",
                    kontakOrtu: (newS.noHpBapak && newS.noHpBapak !== "-") ? newS.noHpBapak : (newS.noHpIbu || "-"),
                    prestasi: [],
                    pelanggaran: []
                };
                existingStudents.push(student);
                addedCount++;
            }
        });

        this.saveStudents(existingStudents);
        return { total: studentsList.length, added: addedCount, updated: updatedCount };
    },

    // =========================================================================
    // PROGRAM KERJA SEKBID, TATA TERTIB & PENGUMUMAN KESISWAAN
    // =========================================================================
    getSekbidPrograms() {
        const data = this.getData();
        if (!data.sekbidPrograms || data.sekbidPrograms.length === 0) {
            return DEFAULT_SEKBID_PROGRAMS;
        }
        return data.sekbidPrograms;
    },

    getTataTertib() {
        const data = this.getData();
        if (!data.tataTertib || data.tataTertib.length === 0) {
            return (typeof DEFAULT_TATA_TERTIB !== 'undefined') ? JSON.parse(JSON.stringify(DEFAULT_TATA_TERTIB)) : [];
        }
        return data.tataTertib;
    },

    saveTataTertib(rules) {
        const data = this.getData();
        data.tataTertib = rules;
        this.saveData(data);
        return data.tataTertib;
    },

    getAnnouncements() {
        const dedicated = localStorage.getItem("kesiswaan_announcements_v2");
        if (dedicated) {
            try {
                const parsed = JSON.parse(dedicated);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {}
        }
        const data = this.getData();
        if (data && Array.isArray(data.announcements) && data.announcements.length > 0) {
            // Jika masih memakai data lama dengan nama Dra. Hj. Siti Rahma di ANN-01, sinkronkan ke default baru
            const first = data.announcements.find(a => a.id === "ANN-01");
            if (first && first.penulis && first.penulis.includes("Siti Rahma")) {
                first.judul = DEFAULT_PENGUMUMAN[0].judul;
                first.penulis = DEFAULT_PENGUMUMAN[0].penulis;
                first.ringkasan = DEFAULT_PENGUMUMAN[0].ringkasan;
                first.isi = DEFAULT_PENGUMUMAN[0].isi;
                this.saveAnnouncements(data.announcements);
            }
            return data.announcements;
        }
        return JSON.parse(JSON.stringify(DEFAULT_PENGUMUMAN));
    },

    saveAnnouncements(list) {
        try {
            localStorage.setItem("kesiswaan_announcements_v2", JSON.stringify(list));
        } catch (e) {
            console.warn("Gagal simpan ke dedicated announcements storage:", e);
        }
        const data = this.getData();
        data.announcements = list;
        this.saveData(data);
    },

    addAnnouncement(announcement) {
        const currentList = this.getAnnouncements();
        const newAnn = {
            id: "ANN-" + Date.now(),
            kategori: announcement.kategori || "informasi",
            kategoriLabel: announcement.kategoriLabel || "🟡 INFORMASI",
            badgeClass: announcement.badgeClass || "pill-yellow",
            judul: announcement.judul,
            tanggal: announcement.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            penulis: announcement.penulis || "Tim Kesiswaan",
            ringkasan: announcement.ringkasan,
            isi: announcement.isi
        };
        currentList.unshift(newAnn);
        this.saveAnnouncements(currentList);
        if (window.SupabaseClient && typeof SupabaseClient.pushAnnouncement === "function") {
            SupabaseClient.pushAnnouncement(newAnn);
        }
        return newAnn;
    },

    updateAnnouncement(id, updated) {
        const currentList = this.getAnnouncements();
        const idx = currentList.findIndex(a => String(a.id).trim() === String(id).trim());
        if (idx !== -1) {
            currentList[idx] = { ...currentList[idx], ...updated };
            this.saveAnnouncements(currentList);
            if (typeof DEFAULT_PENGUMUMAN !== 'undefined') {
                const defIdx = DEFAULT_PENGUMUMAN.findIndex(a => String(a.id).trim() === String(id).trim());
                if (defIdx !== -1) {
                    DEFAULT_PENGUMUMAN[defIdx] = { ...DEFAULT_PENGUMUMAN[defIdx], ...updated };
                }
            }
            return currentList[idx];
        }
        return null;
    },

    deleteAnnouncement(id) {
        const currentList = this.getAnnouncements();
        const updatedList = currentList.filter(a => String(a.id).trim() !== String(id).trim());
        this.saveAnnouncements(updatedList);
        return updatedList;
    },

    // ==========================================
    // AGENDA TERDEKAT KESISWAAN
    // ==========================================
    getAgendaTerdekat() {
        const data = this.getData();
        if (!data.agendaTerdekat || data.agendaTerdekat.length === 0) {
            return (typeof DEFAULT_AGENDA_TERDEKAT !== 'undefined') ? DEFAULT_AGENDA_TERDEKAT : [];
        }
        return data.agendaTerdekat;
    },

    addAgendaTerdekat(agenda) {
        const data = this.getData();
        if (!data.agendaTerdekat) data.agendaTerdekat = [...this.getAgendaTerdekat()];
        const newAgenda = {
            id: "AGN-" + Date.now(),
            nama: agenda.nama || "Agenda Baru",
            tanggal: agenda.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            tempat: agenda.tempat || "Lingkungan Sekolah",
            kategori: agenda.kategori || "Kesiswaan",
            keterangan: agenda.keterangan || "",
            countdown: agenda.countdown || "📅 Agenda Baru"
        };
        data.agendaTerdekat.unshift(newAgenda);
        this.saveData(data);
        return newAgenda;
    },

    updateAgendaTerdekat(id, updated) {
        const data = this.getData();
        const list = this.getAgendaTerdekat();
        const idx = list.findIndex(a => a.id === id);
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...updated };
            data.agendaTerdekat = list;
            this.saveData(data);
            return list[idx];
        }
        return null;
    },

    deleteAgendaTerdekat(id) {
        const data = this.getData();
        const list = this.getAgendaTerdekat();
        data.agendaTerdekat = list.filter(a => a.id !== id);
        this.saveData(data);
        return data.agendaTerdekat;
    },

    // ==========================================
    // SIMPAN PROGRAM SEKBID & TATA TERTIB
    // ==========================================
    saveSekbidPrograms(programs) {
        const data = this.getData();
        data.sekbidPrograms = programs;
        this.saveData(data);
        return data.sekbidPrograms;
    },

    saveTataTertib(rules) {
        const data = this.getData();
        data.tataTertib = rules;
        this.saveData(data);
        return data.tataTertib;
    },

    // ==========================================
    // PRESENSI & KEDISIPLINAN KELAS WALI KELAS
    // ==========================================
    getAttendanceSchedule() {
        const data = this.getData();
        if (!data.attendanceSchedule) {
            data.attendanceSchedule = (typeof DEFAULT_ATTENDANCE_SCHEDULE !== 'undefined') 
                ? JSON.parse(JSON.stringify(DEFAULT_ATTENDANCE_SCHEDULE))
                : {
                    1: { hari: "Senin", nama: "Presensi Upacara", kode: "SENIN UPACARA", aktif: true },
                    3: { hari: "Rabu", nama: "Senam", kode: "RABU SENAM", aktif: true },
                    5: { hari: "Jumat", nama: "Senam", kode: "JUMAT SENAM", aktif: true }
                };
            this.saveData(data);
        } else if (data.attendanceSchedule[3] && (data.attendanceSchedule[3].kode === "RABU SENAM SAIH" || data.attendanceSchedule[3].nama === "Senam SAIH")) {
            data.attendanceSchedule[3].nama = "Senam";
            data.attendanceSchedule[3].kode = "RABU SENAM";
            this.saveData(data);
        }
        return data.attendanceSchedule;
    },

    saveAttendanceSchedule(schedule) {
        const data = this.getData();
        data.attendanceSchedule = schedule;
        this.saveData(data);
        return schedule;
    },

    getClassAttendance(kelas, tanggal) {
        const data = this.getData();
        if (!data.classAttendances) data.classAttendances = {};
        const key = `${kelas}_${tanggal}`;
        return data.classAttendances[key] || null;
    },

    saveClassAttendance(kelas, tanggal, payload) {
        const data = this.getData();
        if (!data.classAttendances) data.classAttendances = {};
        const key = `${kelas}_${tanggal}`;
        data.classAttendances[key] = {
            kelas,
            tanggal,
            kegiatan: payload.kegiatan || "Presensi",
            updatedAt: new Date().toISOString(),
            records: payload.records || {}
        };
        this.saveData(data);
        return data.classAttendances[key];
    },

    getAllClassAttendances(kelas) {
        const data = this.getData();
        if (!data.classAttendances) data.classAttendances = {};
        let list = Object.values(data.classAttendances);
        if (kelas) {
            const cleanTarget = kelas.trim().toLowerCase().replace(/[\s\-_.]/g, '');
            list = list.filter(item => {
                if (!item || !item.kelas) return false;
                const cleanItem = item.kelas.trim().toLowerCase().replace(/[\s\-_.]/g, '');
                return cleanItem === cleanTarget || item.kelas.trim().toUpperCase() === kelas.trim().toUpperCase();
            });
        }
        list.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
        return list;
    },

    ensureSampleAttendancesForClass(kelas) {
        const existing = this.getAllClassAttendances(kelas);
        if (existing.length > 0) return existing;

        const students = this.ensureStudentsForClass(kelas);
        if (!students || students.length === 0) return [];

        const today = new Date();
        const sampleDates = [];
        let cur = new Date(today);
        cur.setDate(cur.getDate() - 1);

        while (sampleDates.length < 3) {
            const day = cur.getDay();
            if (day !== 0 && day !== 6) {
                const y = cur.getFullYear();
                const m = String(cur.getMonth() + 1).padStart(2, '0');
                const d = String(cur.getDate()).padStart(2, '0');
                sampleDates.push(`${y}-${m}-${d}`);
            }
            cur.setDate(cur.getDate() - 1);
        }

        const kegiatanLabels = {
            1: "SENIN UPACARA",
            2: "SELASA LITERASI",
            3: "RABU SENAM & KEBERSIHAN",
            4: "KAMIS BERKARYA",
            5: "JUMAT RELIGI"
        };

        sampleDates.forEach((dateStr, sessionIdx) => {
            const parts = dateStr.split('-');
            const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            const dayOfWeek = dObj.getDay();
            const keg = kegiatanLabels[dayOfWeek] || "Presensi Rutin";

            const records = {};
            students.forEach((s, sIdx) => {
                let st = 'hadir';
                let rambut = false;
                let atribut = false;
                let makeup = false;
                let seragam = false;

                if (sIdx === (sessionIdx + 2) % students.length) {
                    st = 'izin';
                } else if (sIdx === (sessionIdx + 5) % students.length) {
                    st = 'sakit';
                } else if (sIdx === 1 && sessionIdx === 0) {
                    st = 'hadir';
                    atribut = true;
                } else if (sIdx === 3 && sessionIdx === 1) {
                    st = 'hadir';
                    seragam = true;
                }

                records[s.id] = {
                    status: st,
                    rambut: rambut,
                    atribut: atribut,
                    makeup: makeup,
                    seragam: seragam,
                    violations: {}
                };
            });

            this.saveClassAttendance(kelas, dateStr, {
                kegiatan: keg,
                records: records
            });
        });

        return this.getAllClassAttendances(kelas);
    },

    addStudentViolation(studentId, violationData) {
        return this.addViolation(studentId, violationData);
    },

    deleteStudentViolation(studentId, violationId) {
        if (!studentId || !violationId) return false;
        const data = this.getData();
        const student = (data.students || []).find(s => s.id === studentId);
        if (!student || !Array.isArray(student.pelanggaran)) return false;

        const initialLen = student.pelanggaran.length;
        student.pelanggaran = student.pelanggaran.filter(p => p.id !== violationId);
        if (student.pelanggaran.length !== initialLen) {
            this.saveData(data);
            return true;
        }
        return false;
    },

    ensureStudentsForClass(kelasTarget) {
        if (!kelasTarget) return [];
        const data = this.getData();
        if (!data.students) data.students = [];

        const cleanTarget = kelasTarget.trim().toLowerCase().replace(/[\s\-_.]/g, '');
        let classStudents = data.students.filter(s => {
            if (!s.kelas) return false;
            const cleanS = s.kelas.trim().toLowerCase().replace(/[\s\-_.]/g, '');
            return cleanS === cleanTarget || s.kelas.trim().toUpperCase() === kelasTarget.trim().toUpperCase();
        });
        
        if (classStudents.length > 0) {
            return classStudents;
        }

        // 1. Khusus jika kelas X TKP belum ada siswanya, daftarkan 33 siswa resmi
        if (kelasTarget.toUpperCase() === "X TKP" && typeof OFFICIAL_X_TKP_STUDENTS !== 'undefined') {
            OFFICIAL_X_TKP_STUDENTS.forEach((nama, idx) => {
                const no = idx + 1;
                const paddedNo = String(no).padStart(2, '0');
                const isPutri = /(putri|safira|rahayu|adelia|afifah|panitis|azzahra|aliefa|aksan|izati|azizah|rafiqi|abidah|asiva|arseti|khoirotunhisan)/i.test(nama);
                const gender = isPutri ? "P" : "L";
                const student = {
                    id: `SIS-XTKP-${paddedNo}`,
                    no: no,
                    foto: gender === "P" 
                        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" 
                        : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
                    nis: `2601${paddedNo}`,
                    nisn: `00912345${paddedNo}`,
                    nama: nama,
                    gender: gender,
                    kelas: "X TKP",
                    jurusan: "Teknik Konstruksi dan Perumahan",
                    waliKelas: "Hafida Kholifatul Janah, S.Pd",
                    nomorHp: `0812-3401-20${paddedNo}`,
                    alamat: `Jl. Magelang - Purworejo KM ${no}, Magelang`,
                    mapsAlamat: "https://maps.google.com/?q=-7.4705,110.2178",
                    namaOrtuBapak: `Bapak ${nama.split(' ')[0]}`,
                    namaOrtuIbu: `Ibu ${nama.split(' ')[0]}`,
                    noHpBapak: `0813-8899-10${paddedNo}`,
                    noHpIbu: `0813-7766-20${paddedNo}`,
                    inputSpmb: `SPMB-2026-REG-${paddedNo}`,
                    prestasi: [],
                    pelanggaran: []
                };
                data.students.push(student);
            });
            this.saveData(data);
            return data.students.filter(s => s.kelas === "X TKP");
        }

        // 2. Untuk seluruh kelas lainnya di SMK Negeri 1 Magelang (termasuk XI FL, X DPIB, X TPM, dsb):
        // Otomatis buatkan daftar presensi 32 siswa resmi agar wali kelas dapat langsung mencatat presensi
        let waliNama = "Wali Kelas";
        let jurusan = "Program Keahlian";
        if (typeof DAFTAR_WALI_KELAS_MASTER !== 'undefined') {
            const foundWali = DAFTAR_WALI_KELAS_MASTER.find(w => 
                w.kode.toUpperCase() === kelasTarget.toUpperCase() || 
                w.label.toUpperCase().includes(kelasTarget.toUpperCase()) ||
                w.kode.replace(/\s+/g, '').toUpperCase() === cleanTarget.toUpperCase()
            );
            if (foundWali) {
                waliNama = foundWali.nama;
                jurusan = foundWali.label || foundWali.kode;
            }
        }

        const ROSTER_NAMES = [
            { nama: "Achmad Zulfikar", gender: "L" },
            { nama: "Adelia Rahmawati", gender: "P" },
            { nama: "Aditya Pratama Putra", gender: "L" },
            { nama: "Ageng Nugroho", gender: "L" },
            { nama: "Ahmad Dani Setiawan", gender: "L" },
            { nama: "Anisa Nur Aini", gender: "P" },
            { nama: "Arga Dwi Saputra", gender: "L" },
            { nama: "Bagas Kurniawan", gender: "L" },
            { nama: "Cantika Putri Maharani", gender: "P" },
            { nama: "Danang Tri Wibowo", gender: "L" },
            { nama: "Dendi Ariyanto", gender: "L" },
            { nama: "Dinda Ayu Lestari", gender: "P" },
            { nama: "Fajar Ramadhani", gender: "L" },
            { nama: "Farhan Maulana", gender: "L" },
            { nama: "Gilang Ramadhan", gender: "L" },
            { nama: "Hana Safitri", gender: "P" },
            { nama: "Hendra Gunawan", gender: "L" },
            { nama: "Ilham Budi Santoso", gender: "L" },
            { nama: "Intan Permata Sari", gender: "P" },
            { nama: "Lukman Hakim", gender: "L" },
            { nama: "Muhammad Rizky Pratama", gender: "L" },
            { nama: "Nabila Syaharani Putri", gender: "P" },
            { nama: "Noval Aditya", gender: "L" },
            { nama: "Raditya Mahesa", gender: "L" },
            { nama: "Raka Pratama Wijaya", gender: "L" },
            { nama: "Rendi Saputra", gender: "L" },
            { nama: "Rina Sulistiawati", gender: "P" },
            { nama: "Satria Bagus Panuntun", gender: "L" },
            { nama: "Siti Aisyah Azzahra", gender: "P" },
            { nama: "Tegar Prasetyo", gender: "L" },
            { nama: "Wahyu Hidayat", gender: "L" },
            { nama: "Zahra Aulia Putri", gender: "P" }
        ];

        const cleanK = kelasTarget.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const prefixNis = kelasTarget.toUpperCase().startsWith("X ") ? "260" : (kelasTarget.toUpperCase().startsWith("XI ") ? "250" : "240");

        ROSTER_NAMES.forEach((item, idx) => {
            const no = idx + 1;
            const paddedNo = String(no).padStart(2, '0');
            const student = {
                id: `SIS-${cleanK}-${paddedNo}`,
                no: no,
                foto: item.gender === "P" 
                    ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" 
                    : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
                nis: `${prefixNis}${paddedNo}`,
                nisn: `00812345${paddedNo}`,
                nama: item.nama,
                gender: item.gender,
                kelas: kelasTarget,
                jurusan: jurusan,
                waliKelas: waliNama,
                nomorHp: `0812-5501-${paddedNo}`,
                alamat: `Jl. Magelang - Purworejo KM ${no}, Magelang`,
                mapsAlamat: "https://maps.google.com/?q=-7.4705,110.2178",
                namaOrtuBapak: `Bapak ${item.nama.split(' ')[0]}`,
                namaOrtuIbu: `Ibu ${item.nama.split(' ')[0]}`,
                noHpBapak: `0813-8899-${paddedNo}`,
                noHpIbu: `0813-7766-${paddedNo}`,
                inputSpmb: `SPMB-2026-${cleanK}-${paddedNo}`,
                prestasi: [],
                pelanggaran: []
            };
            data.students.push(student);
        });

        this.saveData(data);
        return data.students.filter(s => {
            if (!s.kelas) return false;
            const cleanS = s.kelas.trim().toLowerCase().replace(/[\s\-_.]/g, '');
            return cleanS === cleanTarget || s.kelas.trim().toUpperCase() === kelasTarget.trim().toUpperCase();
        });
    },

    resetToDefault() {
        localStorage.removeItem(STORAGE_KEY);
        this.init();
    }
};

StorageManager.init();
