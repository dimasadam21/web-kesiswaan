/**
 * =========================================================================
 * SUPABASE CLIENT & REAL-TIME SYNC ADAPTER (SIKESISWAAN)
 * =========================================================================
 * Menghubungkan Web Kesiswaan secara langsung ke Supabase Cloud PostgreSQL
 * dan Supabase Storage dengan dukungan:
 * 1. Penyimpanan lokal instan (Zero Latency & Offline-Ready).
 * 2. Sinkronisasi dua arah otomatis ke Cloud PostgreSQL.
 * 3. Unggah file foto & piagam ke Supabase Storage.
 * 4. Modal pengaturan dinamis untuk memasukkan URL & Anon Key tanpa ubah kode.
 * =========================================================================
 */

const SUPABASE_CONFIG_KEY = "kesiswaan_supabase_cfg_v1";

const SupabaseClient = {
    // Default konfigurasi Supabase (dapat diatur via modal atau hardcoded di sini)
    config: {
        url: "",
        anonKey: "",
        bucket: "kesiswaan_files"
    },

    isConnected: false,
    isSyncing: false,
    listeners: [],

    init() {
        // Ambil konfigurasi dari localStorage jika pernah disimpan
        const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.url && parsed.anonKey) {
                    this.config.url = parsed.url.trim().replace(/\/+$/, '');
                    this.config.anonKey = parsed.anonKey.trim();
                    if (parsed.bucket) this.config.bucket = parsed.bucket.trim();
                }
            } catch (e) {
                console.warn("Gagal membaca konfigurasi Supabase dari cache:", e);
            }
        }

        // Render badge status di UI
        this.renderStatusBadge();

        // Cek koneksi & sinkronisasi awal
        if (this.isConfigured()) {
            this.checkConnectionAndSync();
        } else {
            this.updateStatus(false, "Belum Dikonfigurasi");
        }
    },

    isConfigured() {
        return Boolean(this.config.url && this.config.anonKey && this.config.url.startsWith("http"));
    },

    saveConfig(url, anonKey, bucket = "kesiswaan_files") {
        this.config.url = (url || "").trim().replace(/\/+$/, '');
        this.config.anonKey = (anonKey || "").trim();
        this.config.bucket = (bucket || "kesiswaan_files").trim();

        localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.config));
        return this.checkConnectionAndSync();
    },

    clearConfig() {
        localStorage.removeItem(SUPABASE_CONFIG_KEY);
        this.config = { url: "", anonKey: "", bucket: "kesiswaan_files" };
        this.isConnected = false;
        this.updateStatus(false, "Belum Dikonfigurasi");
    },

    getHeaders() {
        return {
            "apikey": this.config.anonKey,
            "Authorization": `Bearer ${this.config.anonKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        };
    },

    // =========================================================================
    // REST API HTTP METHODS (PostgREST)
    // =========================================================================
    async request(endpoint, options = {}) {
        if (!this.isConfigured()) {
            throw new Error("Supabase belum dikonfigurasi.");
        }

        const url = `${this.config.url}/rest/v1/${endpoint}`;
        const headers = { ...this.getHeaders(), ...(options.headers || {}) };

        const res = await fetch(url, {
            ...options,
            headers
        });

        if (!res.ok) {
            let errorDetail = "";
            try {
                const errJson = await res.json();
                errorDetail = errJson.message || errJson.error || JSON.stringify(errJson);
            } catch (e) {
                errorDetail = await res.text();
            }
            throw new Error(`Supabase Error (${res.status}): ${errorDetail}`);
        }

        if (res.status === 204) return null; // No content
        const text = await res.text();
        if (!text || text.trim() === "") return null;
        try {
            return JSON.parse(text);
        } catch (e) {
            return text;
        }
    },

    async testConnection(testUrl, testKey) {
        const u = (testUrl || this.config.url).replace(/\/+$/, '');
        const k = testKey || this.config.anonKey;
        if (!u || !k) throw new Error("URL dan Anon Key wajib diisi!");

        const res = await fetch(`${u}/rest/v1/pengaturan?select=parameter&limit=1`, {
            headers: {
                "apikey": k,
                "Authorization": `Bearer ${k}`
            }
        });

        if (!res.ok) {
            let errText = await res.text();
            throw new Error(`Gagal terhubung (${res.status}): ${errText}`);
        }
        return true;
    },

    // =========================================================================
    // SINKRONISASI DATA DENGAN SUPABASE CLOUD
    // =========================================================================
    async checkConnectionAndSync() {
        try {
            this.updateStatus(false, "Menghubungkan...");
            await this.testConnection();
            this.isConnected = true;
            this.updateStatus(true, "Cloud PostgreSQL Terhubung");

            // Jalankan sinkronisasi penuh
            await this.pullFromCloud();
        } catch (err) {
            console.warn("Supabase tidak dapat dijangkau, menggunakan penyimpanan lokal:", err.message);
            this.isConnected = false;
            this.updateStatus(false, "Offline / Lokal");
        }
    },

    // Ambil data terbaru dari Supabase Cloud dan update StorageManager lokal
    async pullFromCloud() {
        if (!this.isConnected || this.isSyncing) return;
        this.isSyncing = true;
        this.updateSyncBadge(true);

        try {
            console.log("☁️ Mengambil data dari Supabase Cloud...");
            const [
                pengaturanRows,
                guruRows,
                siswaRows,
                pelanggaranRows,
                prestasiRows,
                kegiatanRows,
                pengumumanRows,
                quotesRows,
                rulesRows,
                suratRows
            ] = await Promise.all([
                this.request("pengaturan?select=*").catch(() => []),
                this.request("guru?select=*").catch(() => []),
                this.request("siswa?select=*&order=no.asc").catch(() => []),
                this.request("pelanggaran?select=*&order=tanggal.desc").catch(() => []),
                this.request("prestasi?select=*&order=tanggal.desc").catch(() => []),
                this.request("kegiatan?select=*&order=created_at.desc").catch(() => []),
                this.request("pengumuman?select=*&order=created_at.desc").catch(() => []),
                this.request("quotes?select=*&order=id.asc").catch(() => []),
                this.request("rules?select=*&order=min_point.asc").catch(() => []),
                this.request("surat_template?select=*").catch(() => [])
            ]);

            const currentData = StorageManager.getData();

            // 1. Config
            if (pengaturanRows && pengaturanRows.length > 0) {
                const cfgObj = {};
                pengaturanRows.forEach(r => {
                    cfgObj[r.parameter] = r.nilai;
                });
                currentData.config = { ...(currentData.config || {}), ...cfgObj };
            }

            // 2. Guru
            if (guruRows && guruRows.length > 0) {
                currentData.teachers = guruRows.map(g => ({
                    username: g.username,
                    password: g.password,
                    name: g.nama,
                    role: g.role,
                    roleLabel: g.role_label,
                    kelas: g.kelas || (g.role_label && g.role_label.startsWith("Wali Kelas ") ? g.role_label.replace("Wali Kelas ", "").trim() : "-"),
                    sekbid: g.sekbid,
                    pokja: g.pokja,
                    pembina: g.pembina,
                    icon: g.icon
                }));
            }

            // 3. Siswa + Relasi Pelanggaran & Prestasi
            if (siswaRows && siswaRows.length > 0) {
                const pelMap = {};
                (pelanggaranRows || []).forEach(p => {
                    if (!pelMap[p.nisn]) pelMap[p.nisn] = [];
                    pelMap[p.nisn].push({
                        id: p.id,
                        tanggal: p.tanggal,
                        nama: p.nama,
                        kasus: p.kasus,
                        kategori: p.kategori,
                        poin: Number(p.poin) || 0,
                        sanksi: p.sanksi,
                        pencatat: p.pencatat
                    });
                });

                const presMap = {};
                (prestasiRows || []).forEach(pr => {
                    if (!presMap[pr.nisn]) presMap[pr.nisn] = [];
                    presMap[pr.nisn].push({
                        id: pr.id,
                        tanggal: pr.tanggal,
                        nama: pr.nama,
                        kategori: pr.kategori,
                        tingkat: pr.tingkat,
                        peringkat: pr.peringkat,
                        penyelenggara: pr.penyelenggara,
                        piagam: pr.piagam,
                        poin: Number(pr.poin) || 0,
                        foto: pr.foto,
                        keterangan: pr.keterangan,
                        pencatat: pr.pencatat
                    });
                });

                currentData.students = siswaRows.map(s => ({
                    id: s.id,
                    no: s.no,
                    foto: s.foto,
                    nis: s.nis,
                    nisn: s.nisn,
                    nama: s.nama,
                    gender: s.gender,
                    kelas: s.kelas,
                    jurusan: s.jurusan,
                    nomorHp: s.nomor_hp,
                    alamat: s.alamat,
                    mapsAlamat: s.maps_alamat,
                    namaOrtuBapak: s.nama_ortu_bapak,
                    namaOrtuIbu: s.nama_ortu_ibu,
                    noHpBapak: s.no_hp_bapak,
                    noHpIbu: s.no_hp_ibu,
                    inputSpmb: s.input_spmb,
                    waliKelas: s.wali_kelas,
                    kontakOrtu: s.kontak_ortu,
                    status: s.status,
                    pelanggaran: pelMap[s.nisn] || [],
                    prestasi: presMap[s.nisn] || []
                }));
            }

            // 4. Kegiatan
            if (kegiatanRows && kegiatanRows.length > 0) {
                currentData.activities = kegiatanRows.map(k => ({
                    id: k.id,
                    nama: k.nama,
                    tanggal: k.tanggal,
                    kategori: k.kategori,
                    tempat: k.tempat,
                    keterangan: k.keterangan,
                    foto: k.foto
                }));
            }

            // 5. Pengumuman
            if (pengumumanRows && pengumumanRows.length > 0) {
                currentData.announcements = pengumumanRows.map(p => ({
                    id: p.id,
                    kategori: p.kategori,
                    kategoriLabel: p.kategori_label,
                    badgeClass: p.badge_class,
                    judul: p.judul,
                    tanggal: p.tanggal,
                    penulis: p.penulis,
                    ringkasan: p.ringkasan,
                    isi: p.isi
                }));
            }

            // 6. Quotes
            if (quotesRows && quotesRows.length > 0) {
                currentData.quotes = quotesRows.map(q => ({
                    quote: q.quote,
                    tokoh: q.tokoh,
                    warna: q.warna,
                    font: q.font,
                    efek: q.efek,
                    kategori: q.kategori,
                    customColor: q.custom_color
                }));
            }

            // 7. Rules
            if (rulesRows && rulesRows.length > 0) {
                currentData.rules = rulesRows.map(r => ({
                    minPoint: r.min_point,
                    maxPoint: r.max_point,
                    status: r.status,
                    action: r.action,
                    badgeClass: r.badge_class
                }));
            }

            // Simpan ke LocalStorage dan refresh UI
            StorageManager.saveData(currentData);
            if (window.App && typeof App.renderPublicDashboard === "function") {
                App.applyConfigBranding();
                App.renderPublicDashboard();
            }

            console.log("✅ Berhasil menyinkronkan data dari Supabase Cloud!");
        } catch (err) {
            console.error("Gagal sinkronisasi dari cloud:", err);
        } finally {
            this.isSyncing = false;
            this.updateSyncBadge(false);
        }
    },

    // =========================================================================
    // METODE MUTASI DATA KE SUPABASE (PUSH BACKGROUND)
    // =========================================================================
    async pushStudent(student) {
        if (!this.isConnected) return;
        try {
            const payload = {
                id: student.id,
                no: student.no || 1,
                foto: student.foto || "",
                nis: student.nis || "",
                nisn: student.nisn,
                nama: student.nama,
                gender: student.gender || "L",
                kelas: student.kelas,
                jurusan: student.jurusan || "-",
                nomor_hp: student.nomorHp || "",
                alamat: student.alamat || "",
                maps_alamat: student.mapsAlamat || "",
                nama_ortu_bapak: student.namaOrtuBapak || "",
                nama_ortu_ibu: student.namaOrtuIbu || "",
                no_hp_bapak: student.noHpBapak || "",
                no_hp_ibu: student.noHpIbu || "",
                input_spmb: student.inputSpmb || "",
                wali_kelas: student.waliKelas || "-",
                kontak_ortu: student.kontakOrtu || "-",
                status: student.status || "Aktif"
            };

            await this.request("siswa", {
                method: "POST",
                headers: { "Prefer": "resolution=merge-duplicates" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Gagal menyimpan siswa ke Supabase:", err);
        }
    },

    async deleteStudent(nisn) {
        if (!this.isConnected) return;
        try {
            await this.request(`siswa?nisn=eq.${encodeURIComponent(nisn)}`, {
                method: "DELETE"
            });
        } catch (err) {
            console.warn("Gagal menghapus siswa dari Supabase:", err);
        }
    },

    async pushViolation(violation, nisn) {
        if (!this.isConnected) return;
        try {
            const payload = {
                id: violation.id,
                nisn: nisn,
                tanggal: violation.tanggal || new Date().toISOString().split("T")[0],
                nama: violation.nama,
                kasus: violation.kasus || "",
                kategori: violation.kategori || "Kedisiplinan",
                poin: Number(violation.poin) || 5,
                sanksi: violation.sanksi || "Pembinaan lisan",
                pencatat: violation.pencatat || "Guru Piket"
            };

            await this.request("pelanggaran", {
                method: "POST",
                headers: { "Prefer": "resolution=merge-duplicates" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Gagal menyimpan pelanggaran ke Supabase:", err);
        }
    },

    async pushAchievement(achievement, nisn) {
        if (!this.isConnected) return;
        try {
            const payload = {
                id: achievement.id,
                nisn: nisn,
                tanggal: achievement.tanggal || new Date().toISOString().split("T")[0],
                nama: achievement.nama,
                kategori: achievement.kategori || "Akademik",
                tingkat: achievement.tingkat || "Sekolah",
                peringkat: achievement.peringkat || "Juara 1",
                penyelenggara: achievement.penyelenggara || "-",
                piagam: achievement.piagam || "",
                poin: Number(achievement.poin) || 20,
                foto: achievement.foto || "",
                keterangan: achievement.keterangan || "",
                pencatat: achievement.pencatat || "Tim Kesiswaan"
            };

            await this.request("prestasi", {
                method: "POST",
                headers: { "Prefer": "resolution=merge-duplicates" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Gagal menyimpan prestasi ke Supabase:", err);
        }
    },

    async pushTeacher(teacher) {
        if (!this.isConnected) return;
        try {
            const payload = {
                username: teacher.username,
                password: teacher.password || "123",
                nama: teacher.name,
                role: teacher.role || "guru",
                role_label: teacher.roleLabel || "Staf Kesiswaan",
                sekbid: teacher.sekbid || "-",
                pokja: teacher.pokja || "-",
                pembina: teacher.pembina || "-",
                icon: teacher.icon || "👨‍🏫"
            };

            await this.request("guru?on_conflict=username", {
                method: "POST",
                headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Gagal menyimpan guru ke Supabase:", err);
        }
    },

    async deleteTeacher(username) {
        if (!this.isConnected) return;
        try {
            await this.request(`guru?username=eq.${encodeURIComponent(username)}`, {
                method: "DELETE"
            });
        } catch (err) {
            console.warn("Gagal menghapus guru dari Supabase:", err);
        }
    },

    async pushActivity(activity) {
        if (!this.isConnected) return;
        try {
            const payload = {
                id: activity.id,
                nama: activity.nama,
                tanggal: activity.tanggal,
                kategori: activity.kategori || "Kegiatan Sekolah",
                tempat: activity.tempat || "Lingkungan Sekolah",
                keterangan: activity.keterangan || "",
                foto: activity.foto || ""
            };

            await this.request("kegiatan", {
                method: "POST",
                headers: { "Prefer": "resolution=merge-duplicates" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Gagal menyimpan kegiatan ke Supabase:", err);
        }
    },

    async pushAnnouncement(ann) {
        if (!this.isConnected) return;
        try {
            const payload = {
                id: ann.id,
                kategori: ann.kategori || "informasi",
                kategori_label: ann.kategoriLabel || "🟡 INFORMASI",
                badge_class: ann.badgeClass || "pill-yellow",
                judul: ann.judul,
                tanggal: ann.tanggal,
                penulis: ann.penulis || "Tim Kesiswaan",
                ringkasan: ann.ringkasan || "",
                isi: ann.isi || ""
            };

            await this.request("pengumuman", {
                method: "POST",
                headers: { "Prefer": "resolution=merge-duplicates" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Gagal menyimpan pengumuman ke Supabase:", err);
        }
    },

    async pushConfig(newConfig) {
        if (!this.isConnected) return;
        try {
            const rows = [];
            for (const [key, val] of Object.entries(newConfig)) {
                rows.push({
                    parameter: key,
                    nilai: String(val)
                });
            }

            await this.request("pengaturan", {
                method: "POST",
                headers: { "Prefer": "resolution=merge-duplicates" },
                body: JSON.stringify(rows)
            });
        } catch (err) {
            console.warn("Gagal memperbarui konfigurasi ke Supabase:", err);
        }
    },

    // =========================================================================
    // UNGGAH BERKAS KE SUPABASE STORAGE
    // =========================================================================
    async uploadFile(fileBlob, fileName, folder = "uploads") {
        if (!this.isConfigured()) throw new Error("Supabase belum terhubung!");

        const cleanName = `${folder}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const uploadUrl = `${this.config.url}/storage/v1/object/${this.config.bucket}/${cleanName}`;

        const res = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "apikey": this.config.anonKey,
                "Authorization": `Bearer ${this.config.anonKey}`,
                "Content-Type": fileBlob.type || "application/octet-stream"
            },
            body: fileBlob
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Gagal upload berkas: ${err}`);
        }

        // Return URL publik
        return `${this.config.url}/storage/v1/object/public/${this.config.bucket}/${cleanName}`;
    },

    // =========================================================================
    // UI BADGE & MODAL PENGATURAN SUPABASE
    // =========================================================================
    renderStatusBadge() {
        let badge = document.getElementById("supabaseStatusBadge");
        if (!badge) {
            badge = document.createElement("div");
            badge.id = "supabaseStatusBadge";
            badge.className = "supabase-status-pill";
            badge.title = "Klik untuk membuka Pengaturan Supabase Cloud";
            badge.onclick = () => this.openConfigModal();

            // Masukkan ke header setelah headerUserStatus
            const headerStatus = document.querySelector(".header-user-status");
            if (headerStatus) {
                headerStatus.appendChild(badge);
            }
        }
    },

    updateStatus(connected, label) {
        const badge = document.getElementById("supabaseStatusBadge");
        if (!badge) return;

        if (connected) {
            badge.innerHTML = `<span class="status-dot dot-online"></span><span class="badge-text">Cloud PostgreSQL</span>`;
            badge.classList.remove("status-offline", "status-unconfigured");
            badge.classList.add("status-online");
        } else if (label === "Belum Dikonfigurasi") {
            badge.innerHTML = `<span class="status-dot dot-unconfigured"></span><span class="badge-text">Setup Cloud DB</span>`;
            badge.classList.remove("status-online", "status-offline");
            badge.classList.add("status-unconfigured");
        } else {
            badge.innerHTML = `<span class="status-dot dot-offline"></span><span class="badge-text">Mode Lokal</span>`;
            badge.classList.remove("status-online", "status-unconfigured");
            badge.classList.add("status-offline");
        }
    },

    updateSyncBadge(isSyncing) {
        const badge = document.getElementById("supabaseStatusBadge");
        if (!badge) return;
        if (isSyncing) {
            badge.innerHTML = `<span class="status-dot dot-syncing"></span><span class="badge-text">Sinkronisasi...</span>`;
        } else if (this.isConnected) {
            this.updateStatus(true, "Cloud PostgreSQL");
        }
    },

    openConfigModal() {
        let modal = document.getElementById("modalSupabaseConfig");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "modalSupabaseConfig";
            modal.className = "modal-backdrop-clean";
            modal.innerHTML = `
                <div class="modal-card-clean" style="max-width: 580px;">
                    <div class="modal-card-header">
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main);">☁️ Konfigurasi Supabase Cloud</h3>
                            <p style="margin: 0.2rem 0 0; font-size: 0.8rem; color: var(--text-muted);">Hubungkan sistem ke database Cloud PostgreSQL & Storage Anda</p>
                        </div>
                        <button type="button" class="btn-close-modal" onclick="SupabaseClient.closeConfigModal()">✕</button>
                    </div>
                    <div class="modal-card-body" style="padding: 1.25rem;">
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.9rem; margin-bottom: 1rem; font-size: 0.825rem; color: #475569; line-height: 1.5;">
                            💡 <strong>Petunjuk Singkat:</strong><br>
                            1. Buka dashboard Supabase Anda (<a href="https://app.supabase.com" target="_blank" style="color: var(--primary); text-decoration: underline;">app.supabase.com</a>).<br>
                            2. Masuk ke <strong>Project Settings > API</strong>.<br>
                            3. Salin <strong>Project URL</strong> dan <strong>anon / public key</strong> ke formulir di bawah ini.<br>
                            4. Pastikan file <code>supabase_kesiswaan_schema.sql</code> telah dijalankan di SQL Editor.
                        </div>

                        <div class="form-group-clean" style="margin-bottom: 1rem;">
                            <label style="font-size: 0.825rem; font-weight: 700; color: var(--text-main);">Supabase Project URL</label>
                            <input type="text" id="sbInputUrl" class="form-control-clean" placeholder="https://xxxxxxxx.supabase.co" value="${this.config.url || ''}">
                        </div>

                        <div class="form-group-clean" style="margin-bottom: 1rem;">
                            <label style="font-size: 0.825rem; font-weight: 700; color: var(--text-main);">Public Anon Key</label>
                            <textarea id="sbInputKey" class="form-control-clean" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">${this.config.anonKey || ''}</textarea>
                        </div>

                        <div class="form-group-clean" style="margin-bottom: 1rem;">
                            <label style="font-size: 0.825rem; font-weight: 700; color: var(--text-main);">Storage Bucket (Foto & Piagam)</label>
                            <input type="text" id="sbInputBucket" class="form-control-clean" placeholder="kesiswaan_files" value="${this.config.bucket || 'kesiswaan_files'}">
                        </div>

                        <div id="sbTestStatus" style="font-size: 0.825rem; margin-bottom: 0.75rem; min-height: 20px;"></div>
                    </div>
                    <div class="modal-card-footer" style="display: flex; justify-content: space-between; align-items: center;">
                        <button type="button" class="btn btn-outline" style="color: #ef4444; border-color: #fca5a5;" onclick="SupabaseClient.handleResetConfig()">Hapus Konfigurasi</button>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="btn btn-secondary" onclick="SupabaseClient.handleTestConnection()">🔍 Tes Koneksi</button>
                            <button type="button" class="btn btn-primary" onclick="SupabaseClient.handleSaveConfig()">💾 Simpan & Sinkronkan</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            document.getElementById("sbInputUrl").value = this.config.url || "";
            document.getElementById("sbInputKey").value = this.config.anonKey || "";
            document.getElementById("sbInputBucket").value = this.config.bucket || "kesiswaan_files";
            document.getElementById("sbTestStatus").innerHTML = "";
        }
        modal.classList.add("active");
    },

    closeConfigModal() {
        const modal = document.getElementById("modalSupabaseConfig");
        if (modal) modal.classList.remove("active");
    },

    async handleTestConnection() {
        const url = document.getElementById("sbInputUrl").value.trim();
        const key = document.getElementById("sbInputKey").value.trim();
        const statusBox = document.getElementById("sbTestStatus");

        if (!url || !key) {
            statusBox.innerHTML = `<span style="color: #ef4444;">⚠️ Mohon isi URL dan Anon Key terlebih dahulu.</span>`;
            return;
        }

        statusBox.innerHTML = `<span style="color: var(--primary);">⏳ Menguji koneksi ke Supabase...</span>`;

        try {
            await this.testConnection(url, key);
            statusBox.innerHTML = `<span style="color: #10b981; font-weight: 700;">✅ Koneksi Berhasil! Database Supabase siap digunakan.</span>`;
        } catch (err) {
            statusBox.innerHTML = `<span style="color: #ef4444; font-weight: 600;">❌ Gagal terhubung: ${err.message}</span>`;
        }
    },

    async handleSaveConfig() {
        const url = document.getElementById("sbInputUrl").value.trim();
        const key = document.getElementById("sbInputKey").value.trim();
        const bucket = document.getElementById("sbInputBucket").value.trim() || "kesiswaan_files";
        const statusBox = document.getElementById("sbTestStatus");

        if (!url || !key) {
            statusBox.innerHTML = `<span style="color: #ef4444;">⚠️ URL dan Anon Key wajib diisi.</span>`;
            return;
        }

        statusBox.innerHTML = `<span style="color: var(--primary);">Menyimpan & melakukan sinkronisasi awal...</span>`;

        try {
            await this.saveConfig(url, key, bucket);
            statusBox.innerHTML = `<span style="color: #10b981; font-weight: 700;">✅ Pengaturan berhasil disimpan dan disinkronkan!</span>`;
            setTimeout(() => {
                this.closeConfigModal();
                if (window.App && typeof App.showToast === "function") {
                    App.showToast("Cloud PostgreSQL Supabase Berhasil Terhubung!");
                }
            }, 1000);
        } catch (err) {
            statusBox.innerHTML = `<span style="color: #ef4444;">Tersimpan, namun gagal sinkronisasi: ${err.message}</span>`;
        }
    },

    handleResetConfig() {
        if (confirm("Apakah Anda yakin ingin menghapus konfigurasi Supabase dan kembali ke penyimpanan lokal browser?")) {
            this.clearConfig();
            this.closeConfigModal();
            if (window.App && typeof App.showToast === "function") {
                App.showToast("Konfigurasi Supabase telah direset ke mode lokal.");
            }
        }
    }
};
