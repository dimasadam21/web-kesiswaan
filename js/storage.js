/**
 * STORAGE MANAGER (Local Storage Abstraction)
 * Mendukung kustomisasi sekolah oleh Super Admin, daftar guru dinamis, kata mutiara,
 * kelola prestasi global dengan foto file, dan kelola agenda kegiatan kesiswaan.
 */

const STORAGE_KEY = "kesiswaan_app_data_v2";

const StorageManager = {
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
    },

    getData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            this.init();
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        }
        try {
            const parsed = JSON.parse(data);
            if (parsed && Array.isArray(parsed.students)) {
                let changed = false;
                parsed.students.forEach(s => {
                    if (Array.isArray(s.prestasi)) {
                        s.prestasi.forEach(p => {
                            if (p && p.poin !== 0) {
                                p.poin = 0;
                                changed = true;
                            }
                        });
                    }
                });
                if (changed) {
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch (e) {}
                }
            }
            return parsed;
        } catch (e) {
            this.resetToDefault();
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        }
    },

    saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Gagal menyimpan ke localStorage (kemungkinan kuota penuh):", e);
            App.showToast("Penyimpanan lokal penuh. Harap gunakan gambar berukuran lebih kecil.");
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
        return data.suratTemplate || DEFAULT_SURAT_TEMPLATE;
    },

    updateSuratTemplate(newTemplate) {
        const data = this.getData();
        data.suratTemplate = { ...(data.suratTemplate || DEFAULT_SURAT_TEMPLATE), ...newTemplate };
        this.saveData(data);
        return data.suratTemplate;
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
        return this.getData().students || [];
    },

    getStudentById(id) {
        return this.getStudents().find(s => s.id === id) || null;
    },

    getStudentByNisn(nisn) {
        if (!nisn) return null;
        const clean = nisn.trim();
        return this.getStudents().find(s => s.nisn === clean) || null;
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
        const data = this.getData();
        let addedCount = 0;
        let updatedCount = 0;

        if (mode === 'replace') {
            data.students = studentsList.map((s, idx) => ({
                id: "SIS-" + Date.now() + "-" + idx,
                no: s.no || (idx + 1),
                foto: s.foto || (s.gender === "P" 
                    ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" 
                    : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"),
                nis: s.nis || "",
                nisn: s.nisn || s.nis || ("NIS-" + (idx + 1)),
                nama: s.nama,
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
            }));
            this.saveData(data);
            return { total: studentsList.length, added: studentsList.length, updated: 0 };
        }

        studentsList.forEach((newS, idx) => {
            // Abaikan hanya jika baris benar-benar kosong tanpa nama dan nomor induk
            if (!newS.nama && !newS.nis && !newS.nisn) return;

            // Pastikan nama terisi
            const studentName = String(newS.nama || '').trim();
            if (!studentName) {
                newS.nama = `Siswa ${idx + 1}`;
            } else {
                newS.nama = studentName;
            }

            // Pastikan NIS dan NISN terisi
            if (!newS.nis && !newS.nisn) {
                newS.nis = `NIS-${String(idx + 1).padStart(4, '0')}`;
                newS.nisn = newS.nis;
            } else if (!newS.nis) {
                newS.nis = newS.nisn;
            } else if (!newS.nisn) {
                newS.nis = newS.nis;
            }

            const cleanNewNis = String(newS.nis).trim().toLowerCase();
            const cleanNewNisn = String(newS.nisn).trim().toLowerCase();
            const cleanNewNama = String(newS.nama).trim().toLowerCase();
            const cleanNewKelas = String(newS.kelas || '').trim().toLowerCase();

            const existingIdx = data.students.findIndex(s => {
                const sNis = String(s.nis || '').trim().toLowerCase();
                const sNisn = String(s.nisn || '').trim().toLowerCase();
                const sNama = String(s.nama || '').trim().toLowerCase();
                const sKelas = String(s.kelas || '').trim().toLowerCase();

                if (cleanNewNis && sNis && cleanNewNis === sNis) return true;
                if (cleanNewNisn && sNisn && cleanNewNisn === sNisn) return true;
                if (cleanNewNama && sNama && cleanNewNama === sNama && (!cleanNewKelas || !sKelas || cleanNewKelas === sKelas)) return true;
                return false;
            });

            if (existingIdx !== -1) {
                // Siswa sudah ada
                if (mode === 'upsert') {
                    const current = data.students[existingIdx];
                    data.students[existingIdx] = {
                        ...current,
                        no: newS.no || current.no || (existingIdx + 1),
                        foto: newS.foto || current.foto,
                        nis: newS.nis || current.nis || "",
                        nisn: newS.nisn || current.nisn || newS.nis || "",
                        nama: newS.nama || current.nama,
                        gender: newS.gender || current.gender || "L",
                        kelas: newS.kelas || current.kelas,
                        jurusan: newS.jurusan || current.jurusan || "-",
                        tempatLahir: newS.tempatLahir || current.tempatLahir || "",
                        tanggalLahir: newS.tanggalLahir || current.tanggalLahir || "",
                        agama: newS.agama || current.agama || "",
                        tempatTinggal: newS.tempatTinggal || current.tempatTinggal || "",
                        alamat: newS.alamat || current.alamat || "",
                        mapsAlamat: newS.mapsAlamat || current.mapsAlamat || "",
                        nomorHp: newS.nomorHp || current.nomorHp || "",
                        namaOrtuBapak: newS.namaOrtuBapak || current.namaOrtuBapak || "",
                        pekerjaanBapak: newS.pekerjaanBapak || current.pekerjaanBapak || "",
                        noHpBapak: newS.noHpBapak || current.noHpBapak || "-",
                        namaOrtuIbu: newS.namaOrtuIbu || current.namaOrtuIbu || "",
                        pekerjaanIbu: newS.pekerjaanIbu || current.pekerjaanIbu || "",
                        noHpIbu: newS.noHpIbu || current.noHpIbu || "-",
                        inputSpmb: newS.inputSpmb || current.inputSpmb || "",
                        waliKelas: newS.waliKelas || current.waliKelas || "-",
                        kontakOrtu: (newS.noHpBapak && newS.noHpBapak !== "-") ? newS.noHpBapak : (newS.noHpIbu || current.kontakOrtu || "-"),
                        // Jaga riwayat poin, prestasi & pelanggaran
                        prestasi: current.prestasi || [],
                        pelanggaran: current.pelanggaran || []
                    };
                    updatedCount++;
                }
            } else {
                // Siswa baru
                const student = {
                    id: "SIS-" + Date.now() + "-" + idx + "-" + Math.floor(Math.random() * 1000),
                    no: newS.no || (data.students.length + 1),
                    foto: newS.foto || (newS.gender === "P" 
                        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" 
                        : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"),
                    nis: newS.nis || "",
                    nisn: String(newS.nisn || newS.nis || ("NIS-" + (data.students.length + 1))).trim(),
                    nama: newS.nama,
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
                data.students.push(student);
                addedCount++;
            }
        });

        this.saveData(data);
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
                    3: { hari: "Rabu", nama: "Senam SAIH", kode: "RABU SENAM SAIH", aktif: true },
                    5: { hari: "Jumat", nama: "Senam", kode: "JUMAT SENAM", aktif: true }
                };
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

        let classStudents = data.students.filter(s => s.kelas && s.kelas.trim().toLowerCase() === kelasTarget.trim().toLowerCase());
        
        // Khusus jika kelas X TKP belum ada siswanya, otomatis daftarkan 33 siswa resmi
        if (classStudents.length === 0 && kelasTarget.toUpperCase() === "X TKP" && typeof OFFICIAL_X_TKP_STUDENTS !== 'undefined') {
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
            classStudents = data.students.filter(s => s.kelas === "X TKP");
        }

        return classStudents;
    },

    resetToDefault() {
        localStorage.removeItem(STORAGE_KEY);
        this.init();
    }
};

StorageManager.init();
