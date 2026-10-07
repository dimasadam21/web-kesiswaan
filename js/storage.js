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
            return JSON.parse(data);
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

        data.teachers[index] = {
            ...current,
            name: updatedData.name ? updatedData.name.trim() : current.name,
            role: newRole,
            roleLabel: newRoleLabel,
            sekbid: updatedData.sekbid !== undefined ? updatedData.sekbid.trim() : (current.sekbid || "-"),
            pokja: updatedData.pokja !== undefined ? updatedData.pokja.trim() : (current.pokja || "-"),
            password: updatedData.password ? updatedData.password.trim() : current.password,
            icon: updatedData.icon || (newRole === "superadmin" ? "👑" : (current.icon || "👨‍🏫"))
        };
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.pushTeacher === "function") {
            SupabaseClient.pushTeacher(data.teachers[index]);
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
            nama: violationData.nama,
            kategori: violationData.kategori || "Kedisiplinan",
            poin: Number(violationData.poin) || 5
        };
        data.violationsMaster.push(newV);
        this.saveData(data);
        return newV;
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
        this.saveData(data);
        return data.rules;
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
        return status.totalPoinPelanggaran >= 31;
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
        return this.getData().suratTemplate || DEFAULT_SURAT_TEMPLATE;
    },

    updateSuratTemplate(newTemplate) {
        const data = this.getData();
        data.suratTemplate = newTemplate;
        this.saveData(data);
        return data.suratTemplate;
    },

    isStudentEligibleForSummons(student) {
        if (!student) return false;
        const st = this.calculateStudentStatus(student);
        // Batas poin SP: minimal 31 Poin (Panggilan Ortu I / SP 1 / SP 2 / SP 3)
        return (st.totalPoinPelanggaran || 0) >= 31;
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
        return all.sort((a, b) => (b.poin || 0) - (a.poin || 0));
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
        const totalPoinPrestasi = (student.prestasi || []).reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0);
        
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
            totalPoinPrestasi,
            saldoPoinKebaikan: Math.max(0, 100 - totalPoinPelanggaran + Math.floor(totalPoinPrestasi * 0.5)),
            statusText: ruleMatch ? ruleMatch.status : "Aman",
            actionText: ruleMatch ? ruleMatch.action : "Tidak ada sanksi",
            badgeClass: ruleMatch ? ruleMatch.badgeClass : "pill-green",
            isBermasalah: totalPoinPelanggaran >= 31,
            isBerprestasi: totalPoinPrestasi > 0
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
            poin: Number(achievementData.poin) || 20,
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
                nisn: s.nisn,
                nama: s.nama,
                gender: s.gender || "L",
                kelas: s.kelas,
                jurusan: s.jurusan || "-",
                nomorHp: s.nomorHp || "",
                alamat: s.alamat || "",
                mapsAlamat: s.mapsAlamat || "",
                namaOrtuBapak: s.namaOrtuBapak || "",
                namaOrtuIbu: s.namaOrtuIbu || "",
                noHpBapak: s.noHpBapak || "",
                noHpIbu: s.noHpIbu || "",
                inputSpmb: s.inputSpmb || "",
                waliKelas: s.waliKelas || "-",
                kontakOrtu: s.kontakOrtu || s.noHpBapak || s.noHpIbu || "-",
                prestasi: [],
                pelanggaran: []
            }));
            this.saveData(data);
            return { total: studentsList.length, added: studentsList.length, updated: 0 };
        }

        studentsList.forEach((newS, idx) => {
            if (!newS.nisn || !newS.nama) return;

            const existingIdx = data.students.findIndex(s => String(s.nisn).trim() === String(newS.nisn).trim());

            if (existingIdx !== -1) {
                // Siswa sudah ada
                if (mode === 'upsert') {
                    const current = data.students[existingIdx];
                    data.students[existingIdx] = {
                        ...current,
                        no: newS.no || current.no || (existingIdx + 1),
                        foto: newS.foto || current.foto,
                        nis: newS.nis || current.nis || "",
                        nama: newS.nama || current.nama,
                        gender: newS.gender || current.gender || "L",
                        kelas: newS.kelas || current.kelas,
                        jurusan: newS.jurusan || current.jurusan || "-",
                        nomorHp: newS.nomorHp || current.nomorHp || "",
                        alamat: newS.alamat || current.alamat || "",
                        mapsAlamat: newS.mapsAlamat || current.mapsAlamat || "",
                        namaOrtuBapak: newS.namaOrtuBapak || current.namaOrtuBapak || "",
                        namaOrtuIbu: newS.namaOrtuIbu || current.namaOrtuIbu || "",
                        noHpBapak: newS.noHpBapak || current.noHpBapak || "",
                        noHpIbu: newS.noHpIbu || current.noHpIbu || "",
                        inputSpmb: newS.inputSpmb || current.inputSpmb || "",
                        waliKelas: newS.waliKelas || current.waliKelas || "-",
                        kontakOrtu: newS.kontakOrtu || newS.noHpBapak || newS.noHpIbu || current.kontakOrtu || "-",
                        // Jaga riwayat poin, prestasi & pelanggaran
                        prestasi: current.prestasi || [],
                        pelanggaran: current.pelanggaran || []
                    };
                    updatedCount++;
                }
                // Jika mode 'append', lewati siswa yang sudah ada
            } else {
                // Siswa baru
                const student = {
                    id: "SIS-" + Date.now() + "-" + idx + "-" + Math.floor(Math.random() * 1000),
                    no: newS.no || (data.students.length + 1),
                    foto: newS.foto || (newS.gender === "P" 
                        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" 
                        : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"),
                    nis: newS.nis || "",
                    nisn: String(newS.nisn).trim(),
                    nama: newS.nama,
                    gender: newS.gender || "L",
                    kelas: newS.kelas || "-",
                    jurusan: newS.jurusan || "-",
                    nomorHp: newS.nomorHp || "",
                    alamat: newS.alamat || "",
                    mapsAlamat: newS.mapsAlamat || "",
                    namaOrtuBapak: newS.namaOrtuBapak || "",
                    namaOrtuIbu: newS.namaOrtuIbu || "",
                    noHpBapak: newS.noHpBapak || "",
                    noHpIbu: newS.noHpIbu || "",
                    inputSpmb: newS.inputSpmb || "",
                    waliKelas: newS.waliKelas || "-",
                    kontakOrtu: newS.kontakOrtu || newS.noHpBapak || newS.noHpIbu || "-",
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
            return DEFAULT_TATA_TERTIB;
        }
        return data.tataTertib;
    },

    getAnnouncements() {
        const data = this.getData();
        if (!data.announcements || data.announcements.length === 0) {
            return DEFAULT_PENGUMUMAN;
        }
        return data.announcements;
    },

    addAnnouncement(announcement) {
        const data = this.getData();
        if (!data.announcements) data.announcements = [...DEFAULT_PENGUMUMAN];
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
        data.announcements.unshift(newAnn);
        this.saveData(data);
        if (window.SupabaseClient && typeof SupabaseClient.pushAnnouncement === "function") {
            SupabaseClient.pushAnnouncement(newAnn);
        }
        return newAnn;
    },

    deleteAnnouncement(id) {
        const data = this.getData();
        const currentList = this.getAnnouncements();
        data.announcements = currentList.filter(a => a.id !== id);
        this.saveData(data);
        return data.announcements;
    },

    resetToDefault() {
        localStorage.removeItem(STORAGE_KEY);
        this.init();
    }
};

StorageManager.init();
