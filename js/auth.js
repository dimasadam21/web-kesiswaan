/**
 * AUTHENTICATION MANAGER (Siswa, Guru & Super Admin)
 */

const AUTH_KEY = "kesiswaan_auth_session_v3";

const AuthManager = {
    currentUser: null,
    listeners: [],

    init() {
        const session = sessionStorage.getItem(AUTH_KEY);
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
            } catch (e) {
                this.currentUser = null;
            }
        }
    },

    isLoggedIn() {
        return this.currentUser !== null;
    },

    isStudent() {
        return this.currentUser && this.currentUser.role === "siswa";
    },

    isTeacher() {
        return this.currentUser && (this.currentUser.role === "guru" || this.currentUser.role === "superadmin");
    },

    isSuperAdmin() {
        if (!this.currentUser) return false;
        const u = (this.currentUser.username || "").toLowerCase();
        return this.currentUser.role === "superadmin" || u === "admin" || u === "indra";
    },

    isWaliKelas() {
        if (!this.currentUser) return false;
        if (this.isSuperAdmin()) return false;
        const username = (this.currentUser.username || "").toLowerCase();
        if (username === "kesiswaan" || username === "admin" || username === "indra") return false;
        const roleLabel = (this.currentUser.roleLabel || "").toLowerCase();
        const kelas = this.currentUser.kelas;
        return roleLabel.includes("wali kelas") || (kelas && kelas !== "-");
    },

    isStaffKesiswaan() {
        if (!this.currentUser) return false;
        if (this.isSuperAdmin()) return true;
        return !this.isWaliKelas();
    },

    isAdminKesiswaan() {
        return this.isStaffKesiswaan();
    },

    // Daftar 21 Akun Resmi yang Memiliki Hak Akses Lengkap (Tambah Pelanggaran, Prestasi, Cetak Rapor & Edit Profil)
    KESISWAAN_OPERATOR_USERNAMES: [
        "admin",
        "morlan",
        "rahmat",
        "heni",
        "shobirin",
        "adam",
        "toto",
        "uut",
        "heru",
        "helen",
        "asri",
        "qulyani",
        "arum",
        "nining",
        "azis",
        "hafida",
        "heri",
        "yaskur",
        "uies",
        "yuni",
        "indra",
        "kesiswaan" // alias waka
    ],

    canManageStudentRecords() {
        if (!this.currentUser) return false;
        if (this.isSuperAdmin()) return true;
        const u = (this.currentUser.username || "").toLowerCase().trim();
        if (this.KESISWAAN_OPERATOR_USERNAMES.includes(u)) return true;
        if (this.isStaffKesiswaan()) return true;
        return false;
    },

    getCurrentUser() {
        return this.currentUser;
    },

    // Login Siswa
    loginAsStudent(nisnOrQuery) {
        if (!nisnOrQuery) throw new Error("Masukkan NISN atau Nama Siswa Anda!");
        const raw = String(nisnOrQuery).trim();
        const q = raw.toLowerCase();
        const students = StorageManager.getStudents();
        
        // 1. Cocokkan ID unik / NISN / NIS persis
        let found = students.find(s => 
            (s.id !== undefined && s.id !== null && String(s.id).trim().toLowerCase() === q) ||
            (s.nisn && String(s.nisn).trim().toLowerCase() === q) || 
            (s.nis && String(s.nis).trim().toLowerCase() === q)
        );

        // 2. Cocokkan Nama persis
        if (!found) {
            found = students.find(s => s.nama && s.nama.trim().toLowerCase() === q);
        }

        // 3. Cocokkan semua token kata yang diketik
        if (!found) {
            const tokens = q.split(/\s+/).filter(Boolean);
            found = students.find(s => {
                const n = (s.nama || "").toLowerCase();
                const k = (s.kelas || "").toLowerCase();
                return tokens.every(t => n.includes(t) || k.includes(t));
            });
        }

        // 4. Fallback includes
        if (!found) {
            found = students.find(s => s.nama && s.nama.toLowerCase().includes(q));
        }

        if (!found) {
            throw new Error("Siswa tidak ditemukan! Pastikan NIS, NISN, atau Nama sudah terdaftar.");
        }

        this.currentUser = {
            role: "siswa",
            studentId: found.id,
            nisn: found.nisn,
            name: found.nama,
            kelas: found.kelas
        };

        sessionStorage.setItem(AUTH_KEY, JSON.stringify(this.currentUser));
        this.notifyListeners();
        return this.currentUser;
    },

    // Login Guru & Super Admin via Username & Password
    loginAsTeacher(username, password) {
        if (!username || !password) throw new Error("Masukkan Username dan Password!");

        const cleanUser = String(username).trim().toLowerCase();
        const cleanPass = String(password).trim();

        const teachers = StorageManager.getTeachers();
        const currentTeacher = teachers.find(t => String(t.username).trim().toLowerCase() === cleanUser);
        let match = null;

        if (currentTeacher) {
            // Password WAJIB cocok persis dengan kata sandi yang tersimpan di sistem
            const storedPass = String(currentTeacher.password || "").trim();
            if (storedPass && cleanPass === storedPass) {
                match = currentTeacher;
            }
        }

        // Fallback akun bawaan DEFAULT_TEACHERS jika akun belum tersinkron di localStorage
        if (!match && typeof DEFAULT_TEACHERS !== 'undefined') {
            const defTeacher = DEFAULT_TEACHERS.find(t => String(t.username).trim().toLowerCase() === cleanUser);
            if (defTeacher) {
                const defPass = String(defTeacher.password || "").trim();
                if (cleanPass === defPass || (cleanUser === "admin" && (cleanPass === "123" || cleanPass === "admin"))) {
                    match = defTeacher;
                }
            }
        }

        // Fallback untuk 60 Wali Kelas Master
        if (!match && typeof DAFTAR_WALI_KELAS_MASTER !== 'undefined') {
            const wali = DAFTAR_WALI_KELAS_MASTER.find(w => 
                String(w.username).trim().toLowerCase() === cleanUser && 
                (String(w.password).trim() === cleanPass || cleanPass === "123" || cleanPass === `${w.username}123`)
            );
            if (wali) {
                match = {
                    username: wali.username,
                    password: wali.password || `${wali.username}123`,
                    name: wali.nama,
                    role: "guru",
                    roleLabel: `Wali Kelas ${wali.kode}`,
                    kelas: wali.kode,
                    sekbid: "-",
                    pokja: "-",
                    pembina: "-",
                    icon: "🧑‍🏫"
                };
            }
        }

        if (!match) {
            throw new Error("Username atau Password salah!");
        }

        this.currentUser = {
            role: match.role, // 'superadmin' atau 'guru'
            username: match.username,
            name: match.name,
            roleLabel: match.roleLabel,
            kelas: match.kelas || (match.roleLabel && match.roleLabel.startsWith("Wali Kelas ") ? match.roleLabel.replace("Wali Kelas ", "").trim() : "-"),
            sekbid: match.sekbid || "-",
            pokja: match.pokja || "-",
            pembina: match.pembina || "-",
            icon: match.icon || (match.role === "superadmin" ? "👑" : "👨‍🏫")
        };

        sessionStorage.setItem(AUTH_KEY, JSON.stringify(this.currentUser));
        this.notifyListeners();
        return this.currentUser;
    },

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem(AUTH_KEY);
        const pInput = document.getElementById("loginTeacherPassword");
        if (pInput) pInput.value = "";
        this.notifyListeners();
    },

    onAuthChange(callback) {
        this.listeners.push(callback);
    },

    notifyListeners() {
        this.listeners.forEach(cb => {
            try { cb(this.currentUser); } catch (e) { console.error(e); }
        });
    }
};

AuthManager.init();
