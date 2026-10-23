/**
 * STORAGE MANAGER (Local Storage Abstraction)
 * Mendukung kustomisasi sekolah oleh Super Admin, daftar guru dinamis, kata mutiara,
 * kelola prestasi global dengan foto file, dan kelola agenda kegiatan kesiswaan.
 */

const STORAGE_KEY = "kesiswaan_app_data_v2";
const STUDENTS_META_KEY = "kesiswaan_students_meta_v1";
const STUDENTS_CLEAN_VERSION_KEY = "kesiswaan_clean_zero_v20261018_v6";
const STUDENTS_ZERO_RESET_KEY = "kesiswaan_clean_zero_v20261018_v6";
const STUDENTS_CHUNK_PREFIX = "kesiswaan_students_c_";
const IDB_NAME = "kesiswaan_idb";
const IDB_STORE = "students";
const SYNC_BUS_CHANNEL = "kesiswaan_realtime_sync_v1";

/**
 * SYNC MANAGER (Live Realtime Cross-Tab & Cross-Session Synchronization)
 * Default: Aktif secara otomatis sehingga setiap perubahan dari Super Admin
 * langsung ter-update di akun Guru dan Wali Kelas secara realtime.
 */
const SyncManager = {
    channel: null,
    isAutoSyncEnabled: true,

    init() {
        const stored = localStorage.getItem("kesiswaan_auto_sync_enabled");
        this.isAutoSyncEnabled = (stored === null || stored === "true");

        if (typeof window !== "undefined" && "BroadcastChannel" in window && !this.channel) {
            try {
                this.channel = new BroadcastChannel(SYNC_BUS_CHANNEL);
                this.channel.onmessage = (event) => {
                    this.handleIncomingSync(event.data);
                };
            } catch (e) {
                console.warn("BroadcastChannel init notice:", e);
            }
        }

        if (typeof window !== "undefined" && !window._kesiswaanStorageListenerAttached) {
            window._kesiswaanStorageListenerAttached = true;
            window.addEventListener("storage", (e) => {
                if (!e.key) return;
                if (e.key === STORAGE_KEY || e.key === STUDENTS_META_KEY || e.key.startsWith(STUDENTS_CHUNK_PREFIX)) {
                    this.handleIncomingSync({ type: "STORAGE_EVENT", key: e.key });
                }
            });
        }
    },

    broadcast(type, payload = {}) {
        if (!this.isAutoSyncEnabled) return;
        const msg = { type, payload, timestamp: Date.now() };
        if (this.channel) {
            try { this.channel.postMessage(msg); } catch (e) {}
        }
    },

    setAutoSync(enabled) {
        this.isAutoSyncEnabled = !!enabled;
        localStorage.setItem("kesiswaan_auto_sync_enabled", this.isAutoSyncEnabled ? "true" : "false");
        this.broadcast("AUTOSYNC_TOGGLED", { enabled: this.isAutoSyncEnabled });
    },

    isAutoSync() {
        return this.isAutoSyncEnabled;
    },

    handleIncomingSync(data) {
        if (!this.isAutoSyncEnabled) return;
        if (!data || !data.type) return;

        // Reset in-memory cache
        if (window.StorageManager) {
            StorageManager._studentsCache = null;
            StorageManager._dataCache = null;
            StorageManager._rulesCache = null;
        }

        // Jika user aktif adalah guru/wali kelas, cek apakah ada perubahan akun/kelas oleh Super Admin
        if (window.AuthManager && typeof AuthManager.isLoggedIn === "function" && AuthManager.isLoggedIn()) {
            const cur = AuthManager.getCurrentUser();
            if (cur && cur.username && window.StorageManager) {
                const freshTeacher = StorageManager.getTeacherByUsername(cur.username);
                if (freshTeacher) {
                    let changed = false;
                    if (cur.roleLabel !== freshTeacher.roleLabel) { cur.roleLabel = freshTeacher.roleLabel; changed = true; }
                    if (cur.kelas !== freshTeacher.kelas) { cur.kelas = freshTeacher.kelas; changed = true; }
                    if (cur.name !== freshTeacher.name) { cur.name = freshTeacher.name; changed = true; }
                    if (changed) {
                        sessionStorage.setItem("kesiswaan_auth_session_v3", JSON.stringify(cur));
                        AuthManager.notifyListeners();
                    }
                }
            }
        }

        // Segera perbarui tampilan antarmuka yang sedang dibuka tanpa reload halaman
        if (window.AdminPortal) {
            // Segera perbarui tabel siapa saja siswa yang tercatat pelanggaran maupun prestasi
            if (typeof AdminPortal.renderTeacherAllStudents === "function") {
                AdminPortal.renderTeacherAllStudents();
            }

            // Segarkan kartu detail siswa target jika sedang dibuka
            if (AdminPortal.selectedStudent && typeof AdminPortal.selectTargetStudent === "function") {
                AdminPortal.selectTargetStudent(AdminPortal.selectedStudent.id, true);
            }

            // Segarkan daftar prestasi admin jika pane prestasi aktif
            if (typeof AdminPortal.renderAdminPrestasiList === "function") {
                AdminPortal.renderAdminPrestasiList();
            }

            if (typeof AdminPortal.renderClassAttendance === "function") {
                AdminPortal.renderClassAttendance();
            }
            if (typeof AdminPortal.renderAttendanceRekap === "function") {
                AdminPortal.renderAttendanceRekap();
            }
        }

        // Segarkan animasi galeri prestasi berjalan di dasbor awal
        if (window.App && typeof App.initPrestasiSlider === "function") {
            App.initPrestasiSlider();
        }

        // Segarkan otomatis papan rekapitulasi siswa terbuka (pelanggaran & prestasi)
        if (window.App && typeof App.renderPublicRekapitulasi === "function") {
            App.renderPublicRekapitulasi();
        }

        // Segarkan portal siswa jika akun siswa sedang login
        if (window.AuthManager && typeof AuthManager.isStudent === "function" && AuthManager.isStudent() && window.SiswaPortal) {
            const curStudent = AuthManager.getCurrentUser();
            if (curStudent && curStudent.studentId && typeof SiswaPortal.renderMyStudentPortal === "function") {
                SiswaPortal.renderMyStudentPortal(curStudent.studentId);
            }
        }

        if (window.Forms) {
            const modalTeachers = document.getElementById("modalManageTeachers");
            if (modalTeachers && (modalTeachers.classList.contains("active") || modalTeachers.classList.contains("show") || modalTeachers.style.display === "flex")) {
                if (typeof Forms.renderTeachersList === "function") Forms.renderTeachersList();
            }
            const modalStudents = document.getElementById("modalExportStudents");
            if (modalStudents && (modalStudents.classList.contains("active") || modalStudents.classList.contains("show") || modalStudents.style.display === "flex")) {
                if (typeof Forms.populateExportStudentClassFilter === "function") Forms.populateExportStudentClassFilter();
                if (typeof Forms.renderExportStudentsTable === "function") Forms.renderExportStudentsTable();
            }
        }
    }
};

if (typeof window !== "undefined") {
    window.SyncManager = SyncManager;
}

const StorageManager = {
    _studentsCache: null,
    _dataCache: null,
    _rulesCache: null,

    init() {
        if (typeof SyncManager !== "undefined") {
            SyncManager.init();
        }
        this._dataCache = null;
        this._rulesCache = null;
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
        // Pastikan reset total pelanggaran & prestasi ke 0 jika belum dilakukan
        if (!localStorage.getItem(STUDENTS_ZERO_RESET_KEY)) {
            this.resetAllStudentRecordsToZero();
        }

        // Sinkronisasi otomatis master tata tertib & 17 poin pelanggaran resmi SMK Negeri 1 Magelang
        const curData = this.getData();
        if (curData) {
            if (!curData.violationsMaster || curData.violationsMaster.length < 17 || !curData.violationsMaster.some(v => v.id === "P17")) {
                curData.violationsMaster = JSON.parse(JSON.stringify(MASTER_PELANGGARAN));
                this.saveData(curData);
            }
        }

        // Pastikan cache siswa dimuat & otomatis sinkronkan data master jika belum lengkap
        const curStudents = this.getStudents();
        if (!curStudents || curStudents.length < 2000) {
            this.syncAllStudentsMaster(true);
        }

        // Otomatisasi sinkronisasi 21 akun kesiswaan & 60 akun wali kelas resmi jika belum terdaftar lengkap
        const curTeachers = this.getTeachers();
        const requiredUsers = ["admin", "morlan", "rahmat", "heni", "shobirin", "adam", "toto", "uut", "heru", "helen", "asri", "qulyani", "arum", "nining", "azis", "hafida", "heri", "yaskur", "uies", "yuni", "indra"];
        const missingUser = !curTeachers || requiredUsers.some(u => !curTeachers.some(t => String(t.username || '').trim().toLowerCase() === u));
        if (missingUser || curTeachers.length < 50) {
            this.syncAllTeachersMaster(true);
        }

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
                    if (!localStorage.getItem(STUDENTS_ZERO_RESET_KEY)) {
                        this.resetAllStudentRecordsToZero();
                        return;
                    }
                    if (getReq.result && Array.isArray(getReq.result.data) && getReq.result.data.length > 0) {
                        const idbData = getReq.result.data;
                        // Pulihkan dari IDB jika IDB memiliki data lengkap (>= 2000 siswa) dan memori belum lengkap
                        if (idbData.length >= 2000 && (!this._studentsCache || this._studentsCache.length < idbData.length)) {
                            this._studentsCache = idbData;
                            this.saveStudents(idbData, false);
                        } else if ((!this._studentsCache || this._studentsCache.length < 2000) && idbData.length < 2000) {
                            // Jika IDB maupun cache sempat terpotong (< 2000), panggil getStudents() untuk memulihkan master 2.107 siswa
                            this.getStudents();
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
        if (this._dataCache) {
            return this._dataCache;
        }

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

        // Hubungkan data siswa secara on-demand tanpa membebani pemanggilan config/guru
        const self = this;
        Object.defineProperty(parsed, 'students', {
            get() {
                return self.getStudents();
            },
            set(newStudents) {
                self.saveStudents(newStudents);
            },
            configurable: true,
            enumerable: true
        });

        this._dataCache = parsed;
        return this._dataCache;
    },

    saveData(data) {
        if (!data) return;
        this._dataCache = null;
        this._rulesCache = null;

        // Jika data mengandung array siswa, simpan via manajemen siswa ber-chunk
        if (Array.isArray(data.students)) {
            this.saveStudents(data.students);
        }

        // Simpan data konfigurasi & master ke STORAGE_KEY tanpa membengkakkan ukuran
        const toSave = { ...data };
        toSave.students = []; // kosongkan pada STORAGE_KEY agar ukuran tetap < 50KB

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
            if (typeof SyncManager !== "undefined") {
                SyncManager.broadcast("DATA_SAVED");
            }
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
        if (!config.schoolLogoUrl || config.schoolLogoUrl.trim() === "" || config.schoolLogoUrl === "🏫") {
            config.schoolLogoUrl = "logo-smk.png";
        }
        if (!config.schoolName || config.schoolName === "SMK NEGERI 1 MAGELANG" || config.schoolName === "SiKesiswaan") {
            config.schoolName = "KESISWAAN SMK NEGERI 1 MAGELANG";
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
    getQuoteConfig() {
        const defaultCfg = (typeof DEFAULT_QUOTE_CONFIG !== 'undefined') ? DEFAULT_QUOTE_CONFIG : {
            mode: "ai",
            intervalMinutes: 5,
            filterPref: "all",
            currentIndex: 0
        };
        try {
            const raw = localStorage.getItem("KESISWAAN_QUOTE_CONFIG");
            if (raw) return { ...defaultCfg, ...JSON.parse(raw) };
        } catch (e) {}
        return defaultCfg;
    },

    saveQuoteConfig(cfg) {
        try {
            localStorage.setItem("KESISWAAN_QUOTE_CONFIG", JSON.stringify(cfg));
        } catch (e) {
            console.error("Gagal menyimpan quote config:", e);
        }
    },

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

    getRules() {
        if (this._rulesCache) return this._rulesCache;
        const data = this.getData();
        this._rulesCache = data.rules || (typeof DEFAULT_RULES !== 'undefined' ? DEFAULT_RULES : []);
        return this._rulesCache;
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
                if (s.prestasi.length < prevLen) {
                    found = true;
                    s.totalPoinPrestasi = s.prestasi.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);
                }
            }
        });
        if (found) {
            this.saveData(data);
            if (typeof SyncManager !== "undefined") {
                SyncManager.broadcast("ACHIEVEMENTS_UPDATED", { achievementId });
            }
            if (window.SupabaseClient && typeof SupabaseClient.deleteAchievement === "function") {
                SupabaseClient.deleteAchievement(achievementId);
            }
        }
        return found;
    },

    // DATA SISWA
    mergeWithMasterStudents(masterList, currentStudents = []) {
        if (!Array.isArray(masterList)) return [];

        const normalizeName = (str) => String(str || "").toLowerCase().replace(/[\t\r\n]+/g, " ").replace(/\s+/g, " ").trim();
        const normalizeClass = (str) => {
            let c = String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            if (c.startsWith("10")) c = "x" + c.slice(2);
            else if (c.startsWith("11")) c = "xi" + c.slice(2);
            else if (c.startsWith("12")) c = "xii" + c.slice(2);
            return c;
        };
        const makeKey = (s) => {
            if (!s) return "";
            const n = normalizeName(s.nama);
            const k = normalizeClass(s.kelas);
            return n && k ? `${n}::${k}` : (n || (s.id ? String(s.id).toLowerCase() : ''));
        };

        const existingMap = new Map();
        if (Array.isArray(currentStudents)) {
            currentStudents.forEach(cs => {
                if (!cs) return;
                const k = makeKey(cs);
                if (k) existingMap.set(k, cs);
                if (cs.id) existingMap.set(String(cs.id).toLowerCase(), cs);
            });
        }

        const result = masterList.map(s => {
            const k = makeKey(s);
            const existing = existingMap.get(k) || (s.id ? existingMap.get(String(s.id).toLowerCase()) : null);
            const pelanggaran = (existing && Array.isArray(existing.pelanggaran)) ? existing.pelanggaran : [];
            const prestasi = (existing && Array.isArray(existing.prestasi)) ? existing.prestasi : [];
            const skorPelanggaran = pelanggaran.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);
            const totalPoinPrestasi = prestasi.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);

            return {
                ...s,
                pelanggaran,
                prestasi,
                skorPelanggaran,
                totalPoinPrestasi,
                status: (skorPelanggaran >= 100 ? "Sanksi Berat" : (skorPelanggaran >= 50 ? "Peringatan" : (skorPelanggaran > 0 ? "Perhatian" : "Aman"))),
                nis: s.nis || existing?.nis || "",
                nisn: s.nisn || existing?.nisn || ""
            };
        });

        // Siswa buatan manual yang tidak ada di master tetap dipertahankan
        if (Array.isArray(currentStudents)) {
            currentStudents.forEach(cs => {
                if (!cs || !cs.nama || !cs.kelas) return;
                const csKey = makeKey(cs);
                const inMaster = result.some(r => makeKey(r) === csKey);
                if (!inMaster) {
                    const pelanggaran = Array.isArray(cs.pelanggaran) ? cs.pelanggaran : [];
                    const prestasi = Array.isArray(cs.prestasi) ? cs.prestasi : [];
                    const skorPelanggaran = typeof cs.skorPelanggaran === 'number'
                        ? cs.skorPelanggaran
                        : pelanggaran.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);
                    const totalPoinPrestasi = typeof cs.totalPoinPrestasi === 'number'
                        ? cs.totalPoinPrestasi
                        : prestasi.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);

                    result.push({
                        ...cs,
                        pelanggaran,
                        prestasi,
                        skorPelanggaran,
                        totalPoinPrestasi,
                        status: cs.status || (skorPelanggaran >= 100 ? "Sanksi Berat" : (skorPelanggaran >= 50 ? "Peringatan" : (skorPelanggaran > 0 ? "Perhatian" : "Aman")))
                    });
                }
            });
        }

        return result;
    },

    getStudents() {
        const masterSource = (typeof MASTER_STUDENTS_LIST !== 'undefined' && Array.isArray(MASTER_STUDENTS_LIST) && MASTER_STUDENTS_LIST.length > 0)
            ? MASTER_STUDENTS_LIST
            : ((typeof INITIAL_STUDENTS !== 'undefined' && Array.isArray(INITIAL_STUDENTS)) ? INITIAL_STUDENTS : []);

        // 0. RESET SEMUA PELANGGARAN & PRESTASI KE 0 (UNTUK AWAL TAHUN AJARAN BARU)
        if (!localStorage.getItem(STUDENTS_ZERO_RESET_KEY) && masterSource.length > 0) {
            return this.resetAllStudentRecordsToZero();
        }

        // 1. Sinkronisasi data resmi bersih super admin (hanya Nama dan Kelas)
        const isCleanSynced = localStorage.getItem(STUDENTS_CLEAN_VERSION_KEY);
        if (!isCleanSynced && masterSource.length > 0) {
            let loadedForSync = [];
            try {
                const metaRaw = localStorage.getItem(STUDENTS_META_KEY);
                if (metaRaw) {
                    const meta = JSON.parse(metaRaw);
                    if (meta && typeof meta.chunks === "number" && meta.chunks > 0) {
                        for (let i = 0; i < meta.chunks; i++) {
                            const chunkRaw = localStorage.getItem(STUDENTS_CHUNK_PREFIX + i);
                            if (chunkRaw) {
                                const parsedChunk = JSON.parse(chunkRaw);
                                if (Array.isArray(parsedChunk)) loadedForSync = loadedForSync.concat(parsedChunk);
                            }
                        }
                    }
                }
            } catch (e) {}

            const merged = this.mergeWithMasterStudents(masterSource, loadedForSync.length > 0 ? loadedForSync : (this._studentsCache || []));
            this._studentsCache = merged;
            this.saveStudents(merged, true);
            localStorage.setItem(STUDENTS_CLEAN_VERSION_KEY, "true");
            return merged;
        }

        const requiredCount = masterSource.length > 0 ? Math.min(2000, masterSource.length) : 1;
        if (this._studentsCache && Array.isArray(this._studentsCache) && this._studentsCache.length >= requiredCount) {
            return this._studentsCache;
        }

        let loadedStudents = [];

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
                    if (all.length >= 2000) {
                        this._studentsCache = all;
                        return all;
                    } else if (all.length > 0) {
                        loadedStudents = all;
                    }
                }
            }
        } catch (e) {
            console.warn("Gagal membaca chunked student storage:", e);
        }

        // 2. Fallback baca dari legacy STORAGE_KEY
        if (loadedStudents.length === 0) {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && Array.isArray(parsed.students) && parsed.students.length > 0) {
                        if (parsed.students.length >= 2000) {
                            this._studentsCache = parsed.students;
                            setTimeout(() => {
                                this.saveStudents(parsed.students);
                            }, 50);
                            return parsed.students;
                        } else {
                            loadedStudents = parsed.students;
                        }
                    }
                }
            } catch (e) {
                console.warn("Gagal membaca legacy student storage:", e);
            }
        }

        // 3. Fallback master resmi 2.107 siswa SMKN 1 Magelang
        // Jika data siswa < 2000 (misal terpotong menjadi 382 siswa), sinkronkan otomatis
        // dengan master 2.107 siswa tanpa menghilangkan catatan pelanggaran / prestasi yang ada.
        if (masterSource.length > 0) {
            const merged = this.mergeWithMasterStudents(masterSource, loadedStudents.length > 0 ? loadedStudents : (this._studentsCache || []));
            this._studentsCache = merged;
            this.saveStudents(merged, true);
            return merged;
        }

        this._studentsCache = loadedStudents;
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

        if (typeof SyncManager !== "undefined") {
            SyncManager.broadcast("STUDENTS_SAVED");
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
        if (!student) {
            return {
                totalPoinPelanggaran: 0,
                totalPoinPrestasi: 0,
                totalPrestasi: 0,
                saldoPoinKebaikan: 100,
                statusText: "Aman",
                actionText: "Tidak ada sanksi",
                badgeClass: "pill-green",
                isBermasalah: false,
                isBerprestasi: false
            };
        }

        const pel = student.pelanggaran;
        const pres = student.prestasi;
        const hasPel = Array.isArray(pel) && pel.length > 0;
        const hasPres = Array.isArray(pres) && pres.length > 0;

        // FAST-PATH: Siswa tanpa riwayat pelanggaran dan tanpa prestasi (99% dari 2.107 siswa)
        // Menghilangkan miliaran siklus CPU saat login guru / kesiswaan
        if (!hasPel && !hasPres) {
            return {
                totalPoinPelanggaran: 0,
                totalPoinPrestasi: 0,
                totalPrestasi: 0,
                saldoPoinKebaikan: 100,
                statusText: "Aman",
                actionText: "Tidak ada sanksi",
                badgeClass: "pill-green",
                isBermasalah: false,
                isBerprestasi: false
            };
        }

        const totalPoinPelanggaran = hasPel ? pel.reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0) : 0;
        const totalPoinPrestasi = hasPres ? pres.reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0) : 0;
        const totalPrestasi = hasPres ? pres.length : 0;
        
        const rules = this.getRules();
        let ruleMatch = rules[0];

        for (const rule of rules) {
            if (totalPoinPelanggaran >= rule.minPoint && totalPoinPelanggaran <= rule.maxPoint) {
                ruleMatch = rule;
                break;
            }
        }

        return {
            totalPoinPelanggaran,
            totalPoinPrestasi,
            totalPrestasi,
            saldoPoinKebaikan: Math.max(0, 100 - totalPoinPelanggaran),
            statusText: ruleMatch ? ruleMatch.status : "Aman",
            actionText: ruleMatch ? ruleMatch.action : "Tidak ada sanksi",
            badgeClass: ruleMatch ? ruleMatch.badgeClass : "pill-green",
            isBermasalah: totalPoinPelanggaran >= 31,
            isBerprestasi: totalPrestasi > 0
        };
    },

    // REKAPITULASI OTOMATIS SELURUH SISWA TERCATAT PELANGGARAN & PRESTASI (DAPAT DIAKSES PUBLIK)
    getAllRecordedStudents() {
        const students = this.getStudents() || [];
        const result = [];
        for (let i = 0; i < students.length; i++) {
            const s = students[i];
            const hasPel = Array.isArray(s.pelanggaran) && s.pelanggaran.length > 0;
            const hasPres = Array.isArray(s.prestasi) && s.prestasi.length > 0;
            if (hasPel || hasPres) {
                const status = this.calculateStudentStatus(s);
                result.push({
                    student: s,
                    status,
                    hasPel,
                    hasPres,
                    violPoints: status.totalPoinPelanggaran,
                    achPoints: status.totalPoinPrestasi,
                    violCount: hasPel ? s.pelanggaran.length : 0,
                    achCount: hasPres ? s.prestasi.length : 0,
                    lastPelanggaran: hasPel ? s.pelanggaran[0] : null,
                    lastPrestasi: hasPres ? s.prestasi[0] : null
                });
            }
        }
        return result;
    },

    addViolation(studentId, violationData) {
        const data = this.getData();
        const index = data.students.findIndex(s => s.id === studentId);
        if (index === -1) throw new Error("Siswa tidak ditemukan");

        const defaultUser = (typeof AuthManager !== "undefined" && AuthManager.getCurrentUser) ? AuthManager.getCurrentUser() : null;
        const defaultPencatat = defaultUser 
            ? `${defaultUser.name} (${defaultUser.roleLabel || (defaultUser.role === 'superadmin' ? 'Super Administrator IT' : (defaultUser.kelas ? 'Wali Kelas ' + defaultUser.kelas : 'Guru'))})` 
            : "Guru Piket";

        const item = {
            id: "PL-" + Date.now(),
            tanggal: violationData.tanggal || new Date().toISOString().split("T")[0],
            nama: violationData.nama,
            kategori: violationData.kategori || "Kedisiplinan",
            poin: Number(violationData.poin) || 5,
            sanksi: violationData.sanksi || "Pembinaan lisan",
            pencatat: violationData.pencatat || defaultPencatat
        };

        if (!data.students[index].pelanggaran) data.students[index].pelanggaran = [];
        data.students[index].pelanggaran.unshift(item);
        data.students[index].skorPelanggaran = data.students[index].pelanggaran.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);
        const pts = data.students[index].skorPelanggaran;
        data.students[index].status = (pts >= 100 ? "Sanksi Berat" : (pts >= 50 ? "Peringatan" : (pts > 0 ? "Perhatian" : "Aman")));
        this.saveData(data);
        if (typeof SyncManager !== "undefined") {
            SyncManager.broadcast("VIOLATIONS_UPDATED", { studentId, violationId: item.id });
        }
        if (window.SupabaseClient && typeof SupabaseClient.pushViolation === "function") {
            SupabaseClient.pushViolation(item, data.students[index].nisn);
        }
        return item;
    },

    addAchievement(studentId, achievementData) {
        const data = this.getData();
        const index = data.students.findIndex(s => s.id === studentId);
        if (index === -1) throw new Error("Siswa tidak ditemukan");

        const defaultUser = (typeof AuthManager !== "undefined" && AuthManager.getCurrentUser) ? AuthManager.getCurrentUser() : null;
        const defaultPencatat = defaultUser 
            ? `${defaultUser.name} (${defaultUser.roleLabel || (defaultUser.role === 'superadmin' ? 'Super Administrator IT' : (defaultUser.kelas ? 'Wali Kelas ' + defaultUser.kelas : 'Pembina Prestasi'))})` 
            : "Tim Kesiswaan";

        const poinMap = {
            "Internasional": 100,
            "Nasional": 75,
            "Provinsi": 50,
            "Kabupaten": 30,
            "Kota": 30,
            "Kecamatan": 15,
            "Sekolah": 10
        };
        const defaultFoto = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80";
        const calcPoin = Number(achievementData.poin) || (poinMap[achievementData.tingkat] || 10);
        const item = {
            id: "PR-" + Date.now(),
            tanggal: achievementData.tanggal || new Date().toISOString().split("T")[0],
            nama: achievementData.nama,
            kategori: achievementData.kategori || "Akademik",
            tingkat: achievementData.tingkat || "Sekolah",
            peringkat: achievementData.peringkat || "Juara 1",
            penyelenggara: achievementData.penyelenggara || "-",
            piagam: achievementData.piagam || "",
            poin: calcPoin,
            foto: achievementData.foto || achievementData.piagam || defaultFoto,
            keterangan: achievementData.keterangan || `${achievementData.peringkat || 'Juara'} ${achievementData.tingkat || ''} (${achievementData.penyelenggara || '-'})`,
            pencatat: achievementData.pencatat || defaultPencatat
        };

        if (!data.students[index].prestasi) data.students[index].prestasi = [];
        data.students[index].prestasi.unshift(item);
        data.students[index].totalPoinPrestasi = data.students[index].prestasi.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);
        this.saveData(data);
        if (typeof SyncManager !== "undefined") {
            SyncManager.broadcast("ACHIEVEMENTS_UPDATED", { studentId, achievementId: item.id });
        }
        if (window.SupabaseClient && typeof SupabaseClient.pushAchievement === "function") {
            SupabaseClient.pushAchievement(item, data.students[index].nisn);
        }
        return item;
    },

    addStudent(newStudent) {
        const data = this.getData();
        const normalizeName = (str) => String(str || "").toLowerCase().replace(/[\t\r\n]+/g, " ").replace(/\s+/g, " ").trim();
        const normalizeClass = (str) => {
            let c = String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            if (c.startsWith("10")) c = "x" + c.slice(2);
            else if (c.startsWith("11")) c = "xi" + c.slice(2);
            else if (c.startsWith("12")) c = "xii" + c.slice(2);
            return c;
        };

        const targetName = normalizeName(newStudent.nama);
        const targetClass = normalizeClass(newStudent.kelas);

        const exists = data.students.some(s => 
            normalizeName(s.nama) === targetName && 
            normalizeClass(s.kelas) === targetClass
        );
        if (exists) throw new Error(`Siswa atas nama "${newStudent.nama}" di kelas "${newStudent.kelas}" sudah terdaftar!`);

        const autoNis = newStudent.nis || newStudent.nisn || `NIS-${Date.now().toString().slice(-6)}`;
        const student = {
            id: "SIS-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            no: newStudent.no || (data.students.length + 1),
            foto: newStudent.foto || (newStudent.gender === "P" 
                ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" 
                : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"),
            nis: newStudent.nis || autoNis,
            nisn: newStudent.nisn || autoNis,
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
        const index = data.students.findIndex(s => s.id === studentId || s.nisn === studentId || s.nis === studentId);
        if (index === -1) throw new Error("Data siswa tidak ditemukan.");

        // Cek jika Nama atau Kelas diubah dan bentrok dengan siswa lain
        if (updatedData.nama || updatedData.kelas) {
            const normalizeName = (str) => String(str || "").toLowerCase().replace(/[\t\r\n]+/g, " ").replace(/\s+/g, " ").trim();
            const normalizeClass = (str) => {
                let c = String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                if (c.startsWith("10")) c = "x" + c.slice(2);
                else if (c.startsWith("11")) c = "xi" + c.slice(2);
                else if (c.startsWith("12")) c = "xii" + c.slice(2);
                return c;
            };

            const targetName = normalizeName(updatedData.nama || data.students[index].nama);
            const targetClass = normalizeClass(updatedData.kelas || data.students[index].kelas);

            const conflict = data.students.some((s, idx) => 
                idx !== index && 
                normalizeName(s.nama) === targetName && 
                normalizeClass(s.kelas) === targetClass
            );
            if (conflict) throw new Error(`Siswa atas nama "${updatedData.nama || data.students[index].nama}" di kelas "${updatedData.kelas || data.students[index].kelas}" sudah terdaftar pada data lain!`);
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

        const normalizeName = (str) => String(str || "").toLowerCase().replace(/[\t\r\n]+/g, " ").replace(/\s+/g, " ").trim();
        const normalizeClass = (str) => {
            let c = String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            if (c.startsWith("10")) c = "x" + c.slice(2);
            else if (c.startsWith("11")) c = "xi" + c.slice(2);
            else if (c.startsWith("12")) c = "xii" + c.slice(2);
            return c;
        };

        const isSameStudent = (existing, incoming) => {
            const eName = normalizeName(existing.nama);
            const iName = normalizeName(incoming.nama);
            // Dasar penentuan siswa tetap vs baru adalah Nama dan Kelas (bukan NIS/NISN)
            if (!eName || !iName || eName !== iName) {
                return false;
            }

            const eKelas = normalizeClass(existing.kelas);
            const iKelas = normalizeClass(incoming.kelas);

            if (eKelas && iKelas) {
                return eKelas === iKelas;
            }

            return true;
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
            // Siswa wajib memiliki nama untuk dapat diidentifikasi
            if (!studentName) return;

            const existingIdx = existingStudents.findIndex(s => isSameStudent(s, newS));

            if (existingIdx !== -1) {
                // Siswa sudah terdaftar: Lakukan susulan data TANPA mengubah/menghapus data lama jika kolom baru kosong
                if (mode === 'upsert') {
                    const current = existingStudents[existingIdx];

                    // Upgrade NIS/NISN jika berkas baru memiliki nomor induk
                    let finalNis = current.nis;
                    if (newS.nis && String(newS.nis).trim() !== "-" && String(newS.nis).trim() !== "") {
                        finalNis = newS.nis;
                    }

                    let finalNisn = current.nisn;
                    if (newS.nisn && String(newS.nisn).trim() !== "-" && String(newS.nisn).trim() !== "") {
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

    getAttendanceSettings() {
        const data = this.getData();
        const defaultSettings = {
            rambutMode: "first_monday", // "first_monday" (default: hanya Senin minggu ke-1), "always", "disabled"
            rambutOverrides: {} // override per-tanggal khusus: { "YYYY-MM-DD": true/false }
        };
        if (!data.attendanceSettings || typeof data.attendanceSettings !== "object") {
            data.attendanceSettings = defaultSettings;
            this.saveData(data);
        }
        return {
            ...defaultSettings,
            ...data.attendanceSettings
        };
    },

    saveAttendanceSettings(settings) {
        const data = this.getData();
        data.attendanceSettings = {
            ...this.getAttendanceSettings(),
            ...settings
        };
        this.saveData(data);
        return data.attendanceSettings;
    },

    isFirstMondayOfMonth(dateStr) {
        if (!dateStr) return false;
        const parts = String(dateStr).split('-');
        let dt, d;
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            d = parseInt(parts[2], 10);
            dt = new Date(y, m, d);
        } else {
            dt = new Date(dateStr + "T00:00:00");
            d = dt.getDate();
        }
        return dt.getDay() === 1 && d >= 1 && d <= 7;
    },

    isRambutChecklistActive(dateStr) {
        if (!dateStr) return false;
        const settings = this.getAttendanceSettings();

        // 1. Cek override khusus per tanggal jika ditentukan Super Admin
        if (settings.rambutOverrides && typeof settings.rambutOverrides[dateStr] === "boolean") {
            return settings.rambutOverrides[dateStr];
        }

        // 2. Cek mode umum
        const mode = settings.rambutMode || "first_monday";
        if (mode === "always") return true;
        if (mode === "disabled") return false;

        // 3. Default: Hanya hari Senin minggu pertama
        return this.isFirstMondayOfMonth(dateStr);
    },

    setRambutOverrideForDate(dateStr, isActive) {
        if (!dateStr) return null;
        const settings = this.getAttendanceSettings();
        if (!settings.rambutOverrides) settings.rambutOverrides = {};
        if (isActive === null || isActive === undefined) {
            delete settings.rambutOverrides[dateStr];
        } else {
            settings.rambutOverrides[dateStr] = !!isActive;
        }
        return this.saveAttendanceSettings(settings);
    },

    // =========================================================================
    // HELPER NORMALISASI & ALIAS KELAS RESMI SMKN 1 MAGELANG
    // =========================================================================
    normalizeClassName(k) {
        if (!k) return "";
        let clean = String(k).trim().toUpperCase().replace(/\s+/g, ' ');
        const aliasMap = {
            "XI DKAV B": "XI DKV B",
            "XI DKAV A": "XI DKV A",
            "XII DKAV B": "XII DKV B",
            "XII DKAV A": "XII DKV A",
            "X DKAV B": "X DKV B",
            "X DKAV A": "X DKV A",
            "XI BA": "XI TKP",
            "XI BB": "XI DPIB",
            "XII BA": "XII TKP",
            "XII BB": "XII DPIB"
        };
        return aliasMap[clean] || clean;
    },

    getOppositeClassAlias(k) {
        if (!k) return "";
        let clean = String(k).trim().toUpperCase().replace(/\s+/g, ' ');
        const aliasPairs = {
            "XI DKAV B": "XI DKV B",
            "XI DKV B": "XI DKAV B",
            "XI DKAV A": "XI DKV A",
            "XI DKV A": "XI DKAV A",
            "XII DKAV B": "XII DKV B",
            "XII DKV B": "XII DKAV B",
            "XII DKAV A": "XII DKV A",
            "XII DKV A": "XII DKAV A",
            "X DKAV B": "X DKV B",
            "X DKV B": "X DKAV B",
            "X DKAV A": "X DKV A",
            "X DKV A": "X DKAV A",
            "XI BA": "XI TKP",
            "XI TKP": "XI BA",
            "XI BB": "XI DPIB",
            "XI DPIB": "XI BB",
            "XII BA": "XII TKP",
            "XII TKP": "XII BA",
            "XII BB": "XII DPIB",
            "XII DPIB": "XII BB"
        };
        return aliasPairs[clean] || "";
    },

    isClassMatch(classA, classB) {
        if (!classA || !classB) return false;
        const sA = String(classA).trim().toUpperCase();
        const sB = String(classB).trim().toUpperCase();
        if (sA === sB) return true;

        const cleanA = sA.replace(/[\s\-_.]/g, '');
        const cleanB = sB.replace(/[\s\-_.]/g, '');
        if (cleanA === cleanB) return true;

        const normA = this.normalizeClassName(sA);
        const normB = this.normalizeClassName(sB);
        if (normA === normB) return true;

        const cleanNormA = normA.replace(/[\s\-_.]/g, '');
        const cleanNormB = normB.replace(/[\s\-_.]/g, '');
        return cleanNormA === cleanNormB;
    },

    getClassAttendance(kelas, tanggal) {
        const data = this.getData();
        if (!data.classAttendances) data.classAttendances = {};
        const key = `${kelas}_${tanggal}`;
        if (data.classAttendances[key]) return data.classAttendances[key];
        const alias = this.getOppositeClassAlias(kelas);
        if (alias) {
            const aliasKey = `${alias}_${tanggal}`;
            if (data.classAttendances[aliasKey]) return data.classAttendances[aliasKey];
        }
        return null;
    },

    saveClassAttendance(kelas, tanggal, payload) {
        const data = this.getData();
        if (!data.classAttendances) data.classAttendances = {};
        const key = `${kelas}_${tanggal}`;
        const prev = data.classAttendances[key] || {};
        const entry = {
            kelas,
            tanggal,
            kegiatan: payload.kegiatan || prev.kegiatan || "Presensi",
            updatedAt: payload.updatedAt || new Date().toISOString(),
            savedAt: payload.savedAt !== undefined ? payload.savedAt : (payload.isSaved ? new Date().toISOString() : (prev.savedAt || null)),
            isSaved: payload.isSaved !== undefined ? !!payload.isSaved : (prev.isSaved || false),
            records: payload.records || prev.records || {}
        };
        data.classAttendances[key] = entry;

        // Simpan juga ke alias jika ada agar sinkron sempurna
        const alias = this.getOppositeClassAlias(kelas);
        if (alias) {
            data.classAttendances[`${alias}_${tanggal}`] = { ...entry, kelas: alias };
        }

        this.saveData(data);
        if (typeof SyncManager !== "undefined") {
            SyncManager.broadcast("ATTENDANCE_SAVED", { kelas, tanggal });
        }
        return data.classAttendances[key];
    },

    getAllClassAttendances(kelas) {
        const data = this.getData();
        if (!data.classAttendances) data.classAttendances = {};
        let list = Object.values(data.classAttendances);
        if (kelas) {
            list = list.filter(item => {
                if (!item || !item.kelas) return false;
                return this.isClassMatch(item.kelas, kelas);
            });
        }
        const seen = new Set();
        const uniqueList = [];
        list.forEach(item => {
            if (!item || !item.tanggal) return;
            if (!seen.has(item.tanggal)) {
                seen.add(item.tanggal);
                uniqueList.push(item);
            }
        });
        uniqueList.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
        return uniqueList;
    },

    ensureSampleAttendancesForClass(kelas) {
        // Presensi upacara (Senin) dan senam (Rabu, Jumat) murni dimulai dari nol tanpa data dummy
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
            student.skorPelanggaran = student.pelanggaran.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);
            const pts = student.skorPelanggaran;
            student.status = (pts >= 100 ? "Sanksi Berat" : (pts >= 50 ? "Peringatan" : (pts > 0 ? "Perhatian" : "Aman")));
            this.saveData(data);
            if (typeof SyncManager !== "undefined") {
                SyncManager.broadcast("VIOLATIONS_UPDATED", { studentId, violationId });
            }
            if (window.SupabaseClient && typeof SupabaseClient.deleteViolation === "function") {
                SupabaseClient.deleteViolation(violationId);
            }
            return true;
        }
        return false;
    },

    updateStudentViolation(studentId, violationId, updatedData) {
        if (!studentId || !violationId || !updatedData) return false;
        const data = this.getData();
        const student = (data.students || []).find(s => s.id === studentId);
        if (!student || !Array.isArray(student.pelanggaran)) return false;

        const index = student.pelanggaran.findIndex(p => p.id === violationId);
        if (index === -1) return false;

        student.pelanggaran[index] = {
            ...student.pelanggaran[index],
            ...updatedData,
            id: violationId
        };
        student.skorPelanggaran = student.pelanggaran.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);
        const pts = student.skorPelanggaran;
        student.status = (pts >= 100 ? "Sanksi Berat" : (pts >= 50 ? "Peringatan" : (pts > 0 ? "Perhatian" : "Aman")));

        this.saveData(data);
        if (typeof SyncManager !== "undefined") {
            SyncManager.broadcast("VIOLATIONS_UPDATED", { studentId, violationId });
        }
        if (window.SupabaseClient && typeof SupabaseClient.pushViolation === "function") {
            SupabaseClient.pushViolation(student.pelanggaran[index], student.nisn);
        }
        return student.pelanggaran[index];
    },

    updateStudentAchievement(studentId, achievementId, updatedData) {
        if (!studentId || !achievementId || !updatedData) return false;
        const data = this.getData();
        const student = (data.students || []).find(s => s.id === studentId);
        if (!student || !Array.isArray(student.prestasi)) return false;

        const index = student.prestasi.findIndex(p => p.id === achievementId);
        if (index === -1) return false;

        student.prestasi[index] = {
            ...student.prestasi[index],
            ...updatedData,
            id: achievementId
        };
        student.totalPoinPrestasi = student.prestasi.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);

        this.saveData(data);
        if (typeof SyncManager !== "undefined") {
            SyncManager.broadcast("ACHIEVEMENTS_UPDATED", { studentId, achievementId });
        }
        if (window.SupabaseClient && typeof SupabaseClient.pushAchievement === "function") {
            SupabaseClient.pushAchievement(student.prestasi[index], student.nisn);
        }
        return student.prestasi[index];
    },

    ensureStudentsForClass(kelasTarget) {
        if (!kelasTarget) return [];
        let allStudents = this.getStudents() || [];

        const matchClass = (s) => {
            if (!s || !s.kelas) return false;
            return this.isClassMatch(s.kelas, kelasTarget);
        };

        let classStudents = allStudents.filter(matchClass);

        // Jika data siswa kelas target belum ada di penyimpanan lokal, ambil dari master 2.107 siswa
        if (classStudents.length === 0 && typeof MASTER_STUDENTS_LIST !== 'undefined' && Array.isArray(MASTER_STUDENTS_LIST)) {
            const masterClassStudents = MASTER_STUDENTS_LIST.filter(matchClass);
            if (masterClassStudents.length > 0) {
                const cleaned = masterClassStudents.map(s => ({
                    id: s.id,
                    no: s.no,
                    foto: s.foto || "",
                    nis: s.nis || "",
                    nisn: s.nisn || "",
                    nama: s.nama,
                    gender: s.gender || "L",
                    kelas: s.kelas,
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
                    noHpBapak: s.noHpBapak || "",
                    namaOrtuIbu: s.namaOrtuIbu || "",
                    pekerjaanIbu: s.pekerjaanIbu || "",
                    noHpIbu: s.noHpIbu || "",
                    inputSpmb: s.inputSpmb || "",
                    waliKelas: s.waliKelas || "-",
                    kontakOrtu: s.kontakOrtu || "-",
                    prestasi: [],
                    pelanggaran: [],
                    skorPelanggaran: 0,
                    totalPoinPrestasi: 0,
                    status: "Aman"
                }));
                allStudents = allStudents.concat(cleaned);
                this._studentsCache = allStudents;
                this.saveStudents(allStudents, true);
                classStudents = cleaned;
            }
        }
        
        return classStudents;
    },

    // =========================================================================
    // FITUR SINKRONISASI MASTER SISWA & GURU (SUPER ADMIN)
    // =========================================================================
    syncAllStudentsMaster(silent = false) {
        const masterSource = (typeof MASTER_STUDENTS_LIST !== 'undefined' && Array.isArray(MASTER_STUDENTS_LIST) && MASTER_STUDENTS_LIST.length > 0)
            ? MASTER_STUDENTS_LIST
            : ((typeof INITIAL_STUDENTS !== 'undefined' && Array.isArray(INITIAL_STUDENTS)) ? INITIAL_STUDENTS : []);

        if (masterSource.length === 0) {
            if (!silent && window.App && typeof App.showToast === "function") {
                App.showToast("Data master siswa belum termuat.");
            }
            return { total: 0 };
        }

        const currentStudents = this.getStudents() || [];
        const merged = this.mergeWithMasterStudents(masterSource, currentStudents);
        this._studentsCache = merged;
        this.saveStudents(merged, true);

        if (typeof SyncManager !== "undefined" && SyncManager.broadcast) {
            SyncManager.broadcast("STUDENTS_SYNCED", { total: merged.length });
        }

        if (!silent && window.App && typeof App.showToast === "function") {
            App.showToast(`✅ Berhasil menyinkronkan ${merged.length} siswa (60 Kelas)! Seluruh akun guru langsung terisi.`);
        }

        return { total: merged.length };
    },

    syncAllTeachersMaster(silent = false) {
        if (typeof DAFTAR_WALI_KELAS_MASTER === 'undefined' || !Array.isArray(DAFTAR_WALI_KELAS_MASTER)) {
            if (!silent && window.App && typeof App.showToast === "function") {
                App.showToast("Data master guru / wali kelas belum termuat.");
            }
            return { total: 0 };
        }

        const data = this.getData();
        if (!data.teachers || !Array.isArray(data.teachers)) {
            data.teachers = JSON.parse(JSON.stringify(DEFAULT_TEACHERS));
        }

        let addedCount = 0;
        let updatedCount = 0;

        DAFTAR_WALI_KELAS_MASTER.forEach(w => {
            const cleanUser = String(w.username).trim().toLowerCase();
            const foundIndex = data.teachers.findIndex(t => 
                String(t.username).trim().toLowerCase() === cleanUser ||
                (t.roleLabel && (t.roleLabel === `Wali Kelas ${w.kode}` || t.roleLabel === `Wali Kelas ${w.label}`))
            );

            const payload = {
                name: w.nama,
                username: w.username,
                password: w.password || `${w.username}123`,
                role: "guru",
                roleLabel: `Wali Kelas ${w.kode}`,
                sekbid: "-",
                pembina: "-",
                pokja: `Wali Kelas ${w.kode}`,
                kelas: w.kode,
                icon: "🧑‍🏫"
            };

            if (foundIndex === -1) {
                data.teachers.push(payload);
                addedCount++;
            } else {
                data.teachers[foundIndex] = {
                    ...data.teachers[foundIndex],
                    name: payload.name,
                    roleLabel: payload.roleLabel,
                    kelas: payload.kelas,
                    password: data.teachers[foundIndex].password || payload.password
                };
                updatedCount++;
            }
        });

        // Sinkronisasi seluruh 21 Akun Utama DEFAULT_TEACHERS (Kesiswaan & Admin)
        if (typeof DEFAULT_TEACHERS !== 'undefined' && Array.isArray(DEFAULT_TEACHERS)) {
            DEFAULT_TEACHERS.forEach(dt => {
                const cleanU = String(dt.username).trim().toLowerCase();
                const fIdx = data.teachers.findIndex(t => String(t.username).trim().toLowerCase() === cleanU);
                if (fIdx === -1) {
                    data.teachers.push({ ...dt });
                    addedCount++;
                } else {
                    data.teachers[fIdx] = {
                        ...data.teachers[fIdx],
                        name: dt.name,
                        role: dt.role,
                        roleLabel: dt.roleLabel,
                        sekbid: dt.sekbid || data.teachers[fIdx].sekbid || "-",
                        pembina: dt.pembina || data.teachers[fIdx].pembina || "-",
                        pokja: dt.pokja || data.teachers[fIdx].pokja || "-",
                        kelas: dt.kelas || data.teachers[fIdx].kelas || "-",
                        icon: dt.icon || data.teachers[fIdx].icon || (dt.role === "superadmin" ? "👑" : "👨‍🏫"),
                        password: data.teachers[fIdx].password || dt.password
                    };
                    updatedCount++;
                }
            });
        }

        if (!data.teachers.some(t => t.username.toLowerCase() === "admin")) {
            const defAdmin = (typeof DEFAULT_TEACHERS !== 'undefined') ? DEFAULT_TEACHERS.find(t => t.username === "admin") : null;
            if (defAdmin) data.teachers.unshift(defAdmin);
        }

        this.saveData(data);

        if (typeof SyncManager !== "undefined" && SyncManager.broadcast) {
            SyncManager.broadcast("TEACHERS_SYNCED", { total: data.teachers.length });
        }

        if (!silent && window.App && typeof App.showToast === "function") {
            App.showToast(`✅ Berhasil menyinkronkan data guru (${data.teachers.length} akun, termasuk 60 wali kelas)!`);
        }

        return { added: addedCount, updated: updatedCount, total: data.teachers.length };
    },

    resetAllStudentRecordsToZero() {
        const masterSource = (typeof MASTER_STUDENTS_LIST !== 'undefined' && Array.isArray(MASTER_STUDENTS_LIST) && MASTER_STUDENTS_LIST.length > 0)
            ? MASTER_STUDENTS_LIST
            : ((typeof INITIAL_STUDENTS !== 'undefined' && Array.isArray(INITIAL_STUDENTS)) ? INITIAL_STUDENTS : []);

        const cleanList = masterSource.map(s => ({
            id: s.id,
            no: s.no,
            foto: "",
            nis: "",
            nisn: "",
            nama: s.nama,
            gender: s.gender || "L",
            kelas: s.kelas,
            jurusan: s.jurusan || "-",
            tempatLahir: "",
            tanggalLahir: "",
            agama: "",
            tempatTinggal: "",
            alamat: "",
            mapsAlamat: "",
            nomorHp: "",
            namaOrtuBapak: "",
            pekerjaanBapak: "",
            noHpBapak: "",
            namaOrtuIbu: "",
            pekerjaanIbu: "",
            noHpIbu: "",
            inputSpmb: "",
            waliKelas: s.waliKelas || "-",
            kontakOrtu: s.kontakOrtu || "-",
            prestasi: [],
            pelanggaran: [],
            skorPelanggaran: 0,
            totalPoinPrestasi: 0,
            status: "Aman"
        }));

        this._studentsCache = cleanList;
        this.saveStudents(cleanList, true);
        localStorage.setItem(STUDENTS_CLEAN_VERSION_KEY, "true");
        localStorage.setItem(STUDENTS_ZERO_RESET_KEY, "true");

        // Bersihkan array students dan seluruh riwayat presensi (Upacara Senin, Senam Rabu & Jumat)
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const p = JSON.parse(raw);
                if (p && typeof p === "object") {
                    p.students = [];
                    p.classAttendances = {};
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
                }
            }
        } catch (e) {}

        // Nonaktifkan sinkronisasi otomatis prestasi Instagram yang sebelumnya memasukkan prestasi dummy ke siswa
        try {
            const igCfgRaw = localStorage.getItem("KESISWAAN_IG_SYNC_CONFIG");
            if (igCfgRaw) {
                const igCfg = JSON.parse(igCfgRaw);
                igCfg.syncPrestasi = false;
                localStorage.setItem("KESISWAAN_IG_SYNC_CONFIG", JSON.stringify(igCfg));
            }
        } catch (e) {}

        this._dataCache = null;
        this._rulesCache = null;

        return cleanList;
    },

    resetToDefault() {
        this._dataCache = null;
        this._rulesCache = null;
        this._studentsCache = null;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STUDENTS_ZERO_RESET_KEY);
        this.resetAllStudentRecordsToZero();
        this.init();
    }
};

if (typeof window !== "undefined") {
    window.StorageManager = StorageManager;
}

StorageManager.init();
