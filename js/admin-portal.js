/**
 * PORTAL GURU & KESISWAAN (SETELAH GURU / ADMIN / SUPER ADMIN LOGIN)
 * Fitur Utama: 
 * 1. Sub-navigasi terpisah: Cari & Rekap Siswa, Kelola Prestasi Siswa, dan Kelola Kegiatan Kesiswaan.
 * 2. Kelola banyak prestasi siswa dengan thumbnail foto & hapus prestasi (otomatis tayang di slider dasbor).
 * 3. Kelola agenda kegiatan kesiswaan dengan tambah & hapus kegiatan (otomatis tayang di agenda dasbor).
 */

const AdminPortal = {
    selectedStudent: null,
    currentTab: 'siswa',
    currentAttendanceDate: new Date().toISOString().split('T')[0],
    currentAttendanceClass: 'X TKP',

    init() {},

    initTeacherPortal(user) {
        const greeting = document.getElementById("teacherGreetingName");
        if (greeting) {
            greeting.textContent = `${user.name} (${user.roleLabel})`;
        }

        const searchInput = document.getElementById("teacherSearchStudentInput");
        if (searchInput) searchInput.value = "";

        const dropdown = document.getElementById("teacherSearchDropdown");
        if (dropdown) dropdown.style.display = "none";

        const isSuperAdmin = AuthManager.isSuperAdmin();
        const isWaliKelas = !isSuperAdmin && user && (
            (user.roleLabel && user.roleLabel.toLowerCase().includes("wali kelas")) ||
            (user.kelas && user.kelas !== "-")
        );

        if (user && user.kelas && user.kelas !== "-") {
            this.currentAttendanceClass = user.kelas;
        } else {
            this.currentAttendanceClass = "X TKP";
        }

        const isAdminKesiswaan = !isSuperAdmin && !isWaliKelas;

        // Tampilkan tombol tab Presensi HANYA untuk Wali Kelas
        const btnPresensi = document.getElementById("adminTabBtnPresensi");
        if (btnPresensi) {
            btnPresensi.style.display = isWaliKelas ? "inline-flex" : "none";
        }

        // Sub-navigasi tab bawah untuk Guru / Admin Kesiswaan / Wali Kelas (disembunyikan untuk Super Admin)
        const adminTabsNav = document.querySelector(".admin-tabs-nav");
        if (adminTabsNav) {
            adminTabsNav.style.display = isSuperAdmin ? "none" : "flex";
        }

        // HAK AKSES KONTEN DASBOR (SESUAI ATURAN PENGGUNA):
        // 1. Pengumuman: Super Admin & Admin Kesiswaan
        const btnPengumuman = document.getElementById("adminTabBtnPengumuman");
        if (btnPengumuman) btnPengumuman.style.display = isAdminKesiswaan ? "inline-flex" : "none";

        // 2. Galeri Prestasi: Super Admin & Admin Kesiswaan
        const btnPrestasi = document.getElementById("adminTabBtnPrestasi");
        if (btnPrestasi) btnPrestasi.style.display = isAdminKesiswaan ? "inline-flex" : "none";

        // 3. Daftar Kegiatan: HANYA Super Admin
        const btnKegiatan = document.getElementById("adminTabBtnKegiatan");
        if (btnKegiatan) btnKegiatan.style.display = "none";

        // 4. Tata Tertib: HANYA Super Admin
        const btnTataTertib = document.getElementById("adminTabBtnTataTertib");
        if (btnTataTertib) btnTataTertib.style.display = "none";

        // 5. Agenda Terdekat: Super Admin & Admin Kesiswaan
        const btnAgenda = document.getElementById("adminTabBtnAgendaTerdekat");
        if (btnAgenda) btnAgenda.style.display = isAdminKesiswaan ? "inline-flex" : "none";

        // 6. Program Sekbid: HANYA Super Admin
        const btnSekbid = document.getElementById("adminTabBtnSekbid");
        if (btnSekbid) btnSekbid.style.display = "none";

        const btnEditJadwal = document.getElementById("btnEditJadwalKegiatanSuperAdmin");
        if (btnEditJadwal) {
            btnEditJadwal.style.display = isSuperAdmin ? "inline-flex" : "none";
        }

        // Tampilkan siswa pertama sebagai contoh awal di tab siswa
        const students = StorageManager.getStudents();
        if (students.length > 0) {
            this.selectTargetStudent(students[0].id);
        }

        this.renderTeacherAllStudents();
        this.renderAdminPrestasiList();
        this.renderAdminKegiatanList();
        this.renderAdminPengumumanList();
        this.renderAdminAgendaTerdekatList();
        this.updateAdminBadgeCounts();

        // Inisialisasi dropdown kelas presensi
        this.populateAttendanceClassOptions();

        // Untuk wali kelas, menu yang langsung muncul adalah Presensi & Disiplin Kelas
        if (isWaliKelas) {
            this.switchAdminTab('presensi');
        } else {
            this.switchAdminTab(this.currentTab || 'siswa');
        }
    },

    // 0. Beralih Antara Sub-Tab Admin
    switchAdminTab(tabName) {
        this.currentTab = tabName;

        const tabBtns = {
            presensi: [document.getElementById("adminTabBtnPresensi"), document.getElementById("hubTabBtnPresensi")],
            siswa: [document.getElementById("adminTabBtnSiswa"), document.getElementById("hubTabBtnSiswa")],
            pengumuman: [document.getElementById("adminTabBtnPengumuman"), document.getElementById("hubTabBtnPengumuman")],
            prestasi: [document.getElementById("adminTabBtnPrestasi"), document.getElementById("hubTabBtnPrestasi")],
            kegiatan: [document.getElementById("adminTabBtnKegiatan"), document.getElementById("hubTabBtnKegiatan")],
            tatatertib: [document.getElementById("adminTabBtnTataTertib"), document.getElementById("hubTabBtnTataTertib")],
            agendaterdekat: [document.getElementById("adminTabBtnAgendaTerdekat"), document.getElementById("hubTabBtnAgendaTerdekat")],
            sekbid: [document.getElementById("adminTabBtnSekbid"), document.getElementById("hubTabBtnSekbid")]
        };

        const panes = {
            presensi: document.getElementById("adminPanePresensi"),
            siswa: document.getElementById("adminPaneSiswa"),
            pengumuman: document.getElementById("adminPanePengumuman"),
            prestasi: document.getElementById("adminPanePrestasi"),
            kegiatan: document.getElementById("adminPaneKegiatan"),
            tatatertib: document.getElementById("adminPaneTataTertib"),
            agendaterdekat: document.getElementById("adminPaneAgendaTerdekat"),
            sekbid: document.getElementById("adminPaneSekbid")
        };

        // Update Tombol Tab
        Object.keys(tabBtns).forEach(key => {
            const btns = Array.isArray(tabBtns[key]) ? tabBtns[key] : [tabBtns[key]];
            btns.forEach(btn => {
                if (btn) btn.classList.toggle("active", key === tabName);
            });
        });

        // Update Panel Tampilan
        Object.keys(panes).forEach(key => {
            if (panes[key]) {
                panes[key].style.display = key === tabName ? "block" : "none";
            }
        });

        if (tabName === "presensi") {
            this.renderClassAttendance();
        } else if (tabName === "prestasi") {
            this.renderAdminPrestasiList();
        } else if (tabName === "kegiatan") {
            this.renderAdminKegiatanList();
        } else if (tabName === "pengumuman") {
            this.renderAdminPengumumanList();
        } else if (tabName === "agendaterdekat") {
            this.renderAdminAgendaTerdekatList();
        } else if (tabName === "tatatertib") {
            this.renderAdminTataTertibList();
        } else if (tabName === "sekbid") {
            this.renderAdminSekbidList();
        }

        this.updateAdminBadgeCounts();
    },

    updateAdminBadgeCounts() {
        const allPrestasi = StorageManager.getAllAchievements();
        const allKegiatan = StorageManager.getActivities();
        const allPengumuman = StorageManager.getAnnouncements();
        const allAgenda = StorageManager.getAgendaTerdekat();

        const badgePres = document.getElementById("adminPrestasiCountBadge");
        if (badgePres) badgePres.textContent = allPrestasi.length;
        const hubBadgePres = document.getElementById("hubAdminPrestasiCountBadge");
        if (hubBadgePres) hubBadgePres.textContent = allPrestasi.length;

        const badgeKeg = document.getElementById("adminKegiatanCountBadge");
        if (badgeKeg) badgeKeg.textContent = allKegiatan.length;
        const hubBadgeKeg = document.getElementById("hubAdminKegiatanCountBadge");
        if (hubBadgeKeg) hubBadgeKeg.textContent = allKegiatan.length;

        const badgeAnn = document.getElementById("adminPengumumanCountBadge");
        if (badgeAnn) badgeAnn.textContent = allPengumuman.length;
        const hubBadgeAnn = document.getElementById("hubAdminPengumumanCountBadge");
        if (hubBadgeAnn) hubBadgeAnn.textContent = allPengumuman.length;

        const badgeAgn = document.getElementById("adminAgendaCountBadge");
        if (badgeAgn) badgeAgn.textContent = allAgenda.length;
        const hubBadgeAgn = document.getElementById("hubAdminAgendaCountBadge");
        if (hubBadgeAgn) hubBadgeAgn.textContent = allAgenda.length;
    },

    // 1. Live Search Siswa Saat Guru Mengetik
    handleTeacherSearch(query) {
        const dropdown = document.getElementById("teacherSearchDropdown");
        if (!dropdown) return;

        const q = (query || "").trim().toLowerCase();
        if (!q) {
            dropdown.style.display = "none";
            return;
        }

        const students = StorageManager.getStudents();
        const matches = students.filter(s => 
            s.nama.toLowerCase().includes(q) || 
            s.nisn.includes(q) ||
            s.kelas.toLowerCase().includes(q)
        );

        if (matches.length === 0) {
            dropdown.innerHTML = `<div style="padding: 0.75rem 1rem; color: var(--text-muted); font-size: 0.85rem;">Tidak ada siswa yang cocok.</div>`;
            dropdown.style.display = "block";
            return;
        }

        dropdown.innerHTML = matches.map(s => {
            const st = StorageManager.calculateStudentStatus(s);
            return `
                <div style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                     onclick="AdminPortal.selectTargetStudent('${s.id}')"
                     onmouseover="this.style.background='#f1f5f9'"
                     onmouseout="this.style.background='#ffffff'">
                    <div>
                        <strong style="color: var(--text-main); font-size: 0.9rem;">${s.nama}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${s.kelas} • NISN: ${s.nisn}</div>
                    </div>
                    <span class="status-pill ${st.badgeClass}" style="font-size: 0.7rem;">${st.statusText}</span>
                </div>
            `;
        }).join('');

        dropdown.style.display = "block";
    },

    submitTeacherSearch() {
        const input = document.getElementById("teacherSearchStudentInput");
        if (!input) return;
        const q = input.value.trim().toLowerCase();
        if (!q) {
            App.showToast("Ketik nama atau NISN siswa terlebih dahulu");
            return;
        }

        const students = StorageManager.getStudents();
        const match = students.find(s => s.nama.toLowerCase().includes(q) || s.nisn.includes(q));
        if (match) {
            this.selectTargetStudent(match.id);
        } else {
            App.showToast("Siswa tidak ditemukan.");
        }
    },

    // 2. Pilih Siswa yang Dituju (Menampilkan Kartu Tindakan Siswa)
    selectTargetStudent(studentId) {
        const student = StorageManager.getStudentById(studentId);
        if (!student) return;

        this.selectedStudent = student;
        const st = StorageManager.calculateStudentStatus(student);

        // Tutup dropdown search jika terbuka
        const dropdown = document.getElementById("teacherSearchDropdown");
        if (dropdown) dropdown.style.display = "none";

        const input = document.getElementById("teacherSearchStudentInput");
        if (input) input.value = student.nama;

        // Isi data ke kartu tindakan siswa
        document.getElementById("targetStudentFoto").src = student.foto;
        document.getElementById("targetStudentNama").textContent = student.nama;
        document.getElementById("targetStudentInfo").textContent = `NISN: ${student.nisn} • Kelas: ${student.kelas} (${student.jurusan})`;
        document.getElementById("targetStudentWali").textContent = student.waliKelas || "-";

        // Rincian Lengkap Profil Format Excel Impor
        const elNis = document.getElementById("targetStudentNis");
        if (elNis) elNis.textContent = student.nis || "-";

        const elNisn = document.getElementById("targetStudentNisn");
        if (elNisn) elNisn.textContent = student.nisn || "-";

        const elHp = document.getElementById("targetStudentHp");
        if (elHp) elHp.textContent = student.nomorHp || "-";

        const elSpmb = document.getElementById("targetStudentSpmb");
        if (elSpmb) elSpmb.textContent = student.inputSpmb || "-";

        const elAyah = document.getElementById("targetStudentAyah");
        if (elAyah) elAyah.textContent = student.namaOrtuBapak || "-";

        const elHpBapak = document.getElementById("targetStudentHpBapak");
        if (elHpBapak) elHpBapak.textContent = student.noHpBapak || "-";

        const elIbu = document.getElementById("targetStudentIbu");
        if (elIbu) elIbu.textContent = student.namaOrtuIbu || "-";

        const elHpIbu = document.getElementById("targetStudentHpIbu");
        if (elHpIbu) elHpIbu.textContent = student.noHpIbu || "-";

        const elAlamat = document.getElementById("targetStudentAlamat");
        if (elAlamat) elAlamat.textContent = student.alamat || "-";

        const mapsBtn = document.getElementById("targetStudentMapsLink");
        if (mapsBtn) {
            if (student.mapsAlamat && student.mapsAlamat.trim()) {
                mapsBtn.href = student.mapsAlamat;
                mapsBtn.style.display = "inline-flex";
            } else if (student.alamat && student.alamat.trim() && student.alamat !== "-") {
                mapsBtn.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(student.alamat);
                mapsBtn.style.display = "inline-flex";
            } else {
                mapsBtn.style.display = "none";
            }
        }

        // Status & Poin
        const pill = document.getElementById("targetStudentStatusPill");
        if (pill) {
            pill.className = `status-pill ${st.badgeClass}`;
            pill.textContent = st.statusText;
        }

        document.getElementById("targetStudentPoinPelanggaran").textContent = `${st.totalPoinPelanggaran} Poin`;
        document.getElementById("targetStudentPoinPrestasi").textContent = `${(student.prestasi || []).length} Capaian`;

        // KONTROL OTOMATIS SURAT PANGGILAN ORANG TUA:
        // HANYA MUNCUL JIKA SUDAH MELEWATI BATAS POIN KADAR SP (>= 31 Poin)
        const isEligibleSp = StorageManager.isStudentEligibleForSummons(student);
        const btnPanggil = document.getElementById("btnPanggilOrtuTarget");
        const noticeBelumSp = document.getElementById("noticeBelumSpTarget");

        if (btnPanggil) {
            if (isEligibleSp) {
                btnPanggil.style.display = "inline-flex";
                btnPanggil.innerHTML = `📄 Cetak Surat Panggilan Ortu (${st.statusText})`;
            } else {
                btnPanggil.style.display = "none";
            }
        }

        if (noticeBelumSp) {
            noticeBelumSp.style.display = isEligibleSp ? "none" : "inline-flex";
        }

        const card = document.getElementById("targetStudentCard");
        if (card) {
            card.style.display = "block";
        }

        App.showToast(`Siswa terpilih: ${student.nama}`);
    },

    // 3. Tombol-Tombol Aksi pada Siswa yang Dituju
    actionAddViolation() {
        if (!this.selectedStudent) {
            const students = StorageManager.getStudents();
            if (students.length > 0) this.selectTargetStudent(students[0].id);
        }
        if (!this.selectedStudent) return;
        Forms.openViolationModal(this.selectedStudent.id);
    },

    actionAddAchievement() {
        if (!this.selectedStudent) {
            const students = StorageManager.getStudents();
            if (students.length > 0) this.selectTargetStudent(students[0].id);
        }
        if (!this.selectedStudent) return;
        Forms.openAchievementModal(this.selectedStudent.id);
    },

    actionPrintSummons() {
        if (!this.selectedStudent) {
            App.showToast("Pilih siswa terlebih dahulu.");
            return;
        }
        if (!StorageManager.isStudentEligibleForSummons(this.selectedStudent)) {
            App.showToast("Siswa belum mencapai batas poin SP untuk penerbitan surat panggilan orang tua.");
            return;
        }
        Forms.openSuratPanggilanModal(this.selectedStudent.id);
    },

    actionPrintReport() {
        if (!this.selectedStudent) {
            App.showToast("Pilih siswa terlebih dahulu.");
            return;
        }
        SiswaPortal.openRaporKarakterModal(this.selectedStudent.id);
    },

    topStudentsSort: 'prestasi', // 'prestasi' | 'pelanggaran' | 'max'

    setTopStudentsSort(mode) {
        this.topStudentsSort = mode;
        const btnPrestasi = document.getElementById("btnSortPrestasi");
        const btnPelanggaran = document.getElementById("btnSortPelanggaran");
        const btnAll = document.getElementById("btnSortAll");
        const title = document.getElementById("topStudentsTitle");

        if (btnPrestasi) btnPrestasi.classList.toggle("active", mode === 'prestasi');
        if (btnPelanggaran) btnPelanggaran.classList.toggle("active", mode === 'pelanggaran');
        if (btnAll) btnAll.classList.toggle("active", mode === 'max');

        if (title) {
            if (mode === 'prestasi') {
                title.textContent = "🏆 10 Siswa Teratas (Prestasi Terbanyak)";
            } else if (mode === 'pelanggaran') {
                title.textContent = "⚠️ 10 Siswa Teratas (Poin Pelanggaran Tertinggi)";
            } else {
                title.textContent = "🌟 10 Siswa Teratas";
            }
        }

        this.renderTeacherAllStudents();
    },

    // 4. Render Tabel 10 Siswa Teratas (Poin Tertinggi) di Halaman Guru
    renderTeacherAllStudents() {
        const tbody = document.getElementById("teacherAllStudentsTableBody");
        if (!tbody) return;

        const students = StorageManager.getStudents();
        const mode = this.topStudentsSort || 'prestasi';

        if (!students || students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
                        <strong style="color: var(--text-main);">Belum Ada Data Siswa Terdaftar</strong>
                        <p style="font-size: 0.85rem; margin-top: 4px;">Tambahkan siswa baru atau impor data Excel melalui menu Super Admin.</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Hitung status dan score untuk pengurutan
        const studentsWithStatus = students.map(s => {
            const st = StorageManager.calculateStudentStatus(s);
            let score = 0;
            if (mode === 'prestasi') {
                score = (s.prestasi || []).length;
            } else if (mode === 'pelanggaran') {
                score = st.totalPoinPelanggaran || 0;
            } else {
                score = Math.max((s.prestasi || []).length, st.totalPoinPelanggaran || 0);
            }
            return {
                student: s,
                status: st,
                score: score
            };
        });

        // Urutkan siswa berdasarkan score tertinggi secara menurun (descending)
        studentsWithStatus.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // Jika skor prestasi sama, prioritaskan yang pelanggarannya lebih sedikit
            if (mode === 'prestasi') {
                if (a.status.totalPoinPelanggaran !== b.status.totalPoinPelanggaran) {
                    return a.status.totalPoinPelanggaran - b.status.totalPoinPelanggaran;
                }
            }
            return a.student.nama.localeCompare(b.student.nama);
        });

        // Cukup tampilkan 10 siswa teratas
        const top10 = studentsWithStatus.slice(0, 10);

        tbody.innerHTML = top10.map((item, idx) => {
            const s = item.student;
            const st = item.status;
            const isSelected = this.selectedStudent && this.selectedStudent.id === s.id;
            const isSp = StorageManager.isStudentEligibleForSummons(s);

            let rankBadge = '';
            if (idx === 0) {
                rankBadge = `<span class="rank-badge rank-1" title="Peringkat 1">🥇 1</span>`;
            } else if (idx === 1) {
                rankBadge = `<span class="rank-badge rank-2" title="Peringkat 2">🥈 2</span>`;
            } else if (idx === 2) {
                rankBadge = `<span class="rank-badge rank-3" title="Peringkat 3">🥉 3</span>`;
            } else {
                rankBadge = `<span class="rank-badge rank-other">${idx + 1}</span>`;
            }

            return `
                <tr style="${isSelected ? 'background: #eff6ff; font-weight: 600;' : ''}">
                    <td style="text-align: center;">${rankBadge}</td>
                    <td>
                        <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${s.nama}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">NISN: ${s.nisn} ${s.nis ? '• NIS: ' + s.nis : ''}</div>
                    </td>
                    <td><span class="status-pill pill-gray">${s.kelas}</span></td>
                    <td>
                        <strong style="color: ${st.totalPoinPelanggaran > 0 ? 'var(--danger)' : 'var(--text-muted)'};">
                            ${st.totalPoinPelanggaran} Poin
                        </strong>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${(s.pelanggaran || []).length} Kasus</div>
                    </td>
                    <td>
                        <strong style="color: ${(s.prestasi || []).length > 0 ? 'var(--success)' : 'var(--text-muted)'}; font-size: 0.95rem;">
                            ${(s.prestasi || []).length} Prestasi
                        </strong>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${(s.prestasi || []).length > 0 ? 'Kejuaraan resmi' : 'Belum ada'}</div>
                    </td>
                    <td>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button class="btn ${isSelected ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="AdminPortal.selectTargetStudent('${s.id}')">
                                ${isSelected ? '✓ Terpilih' : '👉 Pilih'}
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="Forms.openViolationModal('${s.id}')" title="Catat Pelanggaran Siswa Ini">
                                ⚠️ Pelanggaran
                            </button>
                            <button class="btn btn-success btn-sm" onclick="Forms.openAchievementModal('${s.id}')" title="Catat Prestasi Siswa Ini">
                                🏆 Prestasi
                            </button>
                            ${isSp ? `
                                <button class="btn btn-warning btn-sm" onclick="Forms.openSuratPanggilanModal('${s.id}')" title="Cetak Surat Panggilan SP (${st.statusText})">
                                    📄 Surat SP
                                </button>
                            ` : ''}
                            <button class="btn btn-outline btn-sm" onclick="Forms.openEditStudentModal('${s.id}')" title="Edit Profil Siswa Lengkap">
                                ✏️ Edit
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // 5. KELOLA PRESTASI SISWA (TAMPILAN TERPISAH DENGAN FOTO & HAPUS)
    renderAdminPrestasiList() {
        const container = document.getElementById("adminPrestasiListContainer");
        if (!container) return;

        const achievements = StorageManager.getAllAchievements();
        this.updateAdminBadgeCounts();

        if (achievements.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: #ffffff; border: 1px dashed var(--border); border-radius: var(--radius-md); color: var(--text-muted);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🏆</div>
                    <h4>Belum Ada Data Prestasi Siswa</h4>
                    <p style="font-size: 0.85rem; margin-top: 0.25rem;">Klik tombol <strong>"+ Catat Prestasi Baru"</strong> di atas untuk menambahkan prestasi siswa beserta foto kejuaraan.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = achievements.map(p => `
            <div class="prestasi-admin-card">
                <div class="prestasi-admin-img-wrap">
                    <img src="${p.foto || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'}" class="prestasi-admin-img" alt="${p.nama}">
                    <span class="prestasi-admin-badge-float">🏆 ${p.peringkat || 'Juara'}</span>
                </div>
                <div class="prestasi-admin-content">
                    <div>
                        <div style="font-size: 0.85rem; color: var(--primary); font-weight: 700; margin-bottom: 2px;">
                            ⭐ ${p.siswaNama} (${p.siswaKelas})
                        </div>
                        <h4 style="font-size: 1.05rem; margin-bottom: 0.35rem; color: var(--text-main);">${p.nama}</h4>
                        <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
                            ${p.penyelenggara && p.penyelenggara !== '-' ? `<div style="color: #475569; font-weight: 600; margin-bottom: 2px;">🏛️ Penyelenggara: ${p.penyelenggara}</div>` : ''}
                            <div>${p.keterangan || '-'}</div>
                        </div>
                    </div>

                    <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                        <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
                            <span class="status-pill pill-gray" style="font-size: 0.7rem;">${p.tingkat}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">📅 ${p.tanggal}</span>
                            ${p.piagam ? `<a href="${p.piagam}" target="_blank" class="status-pill pill-yellow" style="font-size: 0.7rem; text-decoration: none; font-weight: 600;">📜 Piagam</a>` : ''}
                        </div>
                        <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger-border);" onclick="AdminPortal.handleDeleteAchievement('${p.id}', '${p.nama}')">
                            🗑️ Hapus
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    handleDeleteAchievement(achievementId, namaPrestasi) {
        if (confirm(`Yakin ingin menghapus prestasi "${namaPrestasi}"? Data akan otomatis terhapus dari galeri slider dasbor awal.`)) {
            const success = StorageManager.deleteAchievement(achievementId);
            if (success) {
                this.renderAdminPrestasiList();
                this.renderTeacherAllStudents();
                App.initPrestasiSlider();
                App.showToast(`Prestasi "${namaPrestasi}" berhasil dihapus.`);
            } else {
                App.showToast("Gagal menghapus data prestasi.");
            }
        }
    },

    // 6. KELOLA KEGIATAN KESISWAAN (TAMPILAN TERPISAH DENGAN TAMBAH & HAPUS)
    renderAdminKegiatanList() {
        const container = document.getElementById("adminKegiatanListContainer");
        if (!container) return;

        const activities = StorageManager.getActivities();
        this.updateAdminBadgeCounts();

        if (activities.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: #ffffff; border: 1px dashed var(--border); border-radius: var(--radius-md); color: var(--text-muted);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📅</div>
                    <h4>Belum Ada Agenda Kegiatan Kesiswaan</h4>
                    <p style="font-size: 0.85rem; margin-top: 0.25rem;">Klik tombol <strong>"+ Tambah Agenda Kegiatan"</strong> di atas untuk menambahkan agenda kegiatan sekolah.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(act => `
            <div class="kegiatan-admin-card">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.25rem;">
                        <span class="kegiatan-date-badge">📅 ${act.tanggal}</span>
                        <span class="status-pill pill-gray" style="font-size: 0.75rem;">${act.kategori || 'Kegiatan Sekolah'}</span>
                    </div>
                    <h4 style="font-size: 1.05rem; margin-bottom: 0.35rem; color: var(--text-main);">${act.nama}</h4>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                        📍 Lokasi: <strong>${act.tempat || 'Lingkungan Sekolah'}</strong>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-main); line-height: 1.4;">${act.keterangan || '-'}</p>
                </div>

                <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
                    <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger-border);" onclick="AdminPortal.handleDeleteActivity('${act.id}', '${act.nama}')">
                        🗑️ Hapus Kegiatan
                    </button>
                </div>
            </div>
        `).join('');
    },

    handleDeleteActivity(activityId, namaKegiatan) {
        if (confirm(`Yakin ingin menghapus agenda kegiatan "${namaKegiatan}"? Kegiatan akan dihapus dari dasbor awal.`)) {
            const success = StorageManager.deleteActivity(activityId);
            if (success) {
                this.renderAdminKegiatanList();
                App.renderDashboardKegiatan();
                App.showToast(`Agenda "${namaKegiatan}" berhasil dihapus.`);
            } else {
                App.showToast("Gagal menghapus kegiatan.");
            }
        }
    },

    // =========================================================================
    // 7. PRESENSI & DISIPLIN KELAS WALI KELAS (UPACARA, SENAM, DAN CHECKLIST)
    // =========================================================================
    getHariKegiatanText(dateStr) {
        if (!dateStr) dateStr = this.currentAttendanceDate || new Date().toISOString().split('T')[0];
        const dateObj = new Date(dateStr + "T00:00:00");
        const dayOfWeek = dateObj.getDay(); // 0: Minggu, 1: Senin, 3: Rabu, 5: Jumat
        const schedule = StorageManager.getAttendanceSchedule();

        if (schedule && schedule[dayOfWeek] && schedule[dayOfWeek].aktif !== false) {
            return schedule[dayOfWeek].kode || schedule[dayOfWeek].nama;
        }

        const dayNames = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
        return `${dayNames[dayOfWeek]} PRESENSI`;
    },

    populateAttendanceClassOptions() {
        const select = document.getElementById("attFilterKelas");
        if (!select) return;

        // Kumpulan semua kelas dari DAFTAR_WALI_KELAS_MASTER atau default
        const classes = (typeof DAFTAR_WALI_KELAS_MASTER !== 'undefined')
            ? DAFTAR_WALI_KELAS_MASTER.map(w => w.kode)
            : ["X TKP", "X DPIB", "XI BA", "XII BA"];

        const uniqueClasses = Array.from(new Set(classes));
        const currentUser = AuthManager.getCurrentUser();
        const isSuperAdmin = AuthManager.isSuperAdmin();

        select.innerHTML = uniqueClasses.map(cls => {
            const selected = cls === this.currentAttendanceClass ? 'selected' : '';
            return `<option value="${cls}" ${selected}>${cls}</option>`;
        }).join('');

        // Jika Wali Kelas dan bukan Super Admin, kunci ke kelas miliknya
        const wrap = document.getElementById("attFilterKelasWrap");
        if (wrap) {
            if (!isSuperAdmin && currentUser && currentUser.kelas && currentUser.kelas !== "-") {
                select.disabled = true;
            } else {
                select.disabled = false;
            }
        }
    },

    handleAttendanceDateChange(val) {
        if (!val) return;
        this.currentAttendanceDate = val;
        this.renderClassAttendance();
    },

    handleAttendanceClassChange(val) {
        if (!val) return;
        this.currentAttendanceClass = val;
        this.renderClassAttendance();
    },

    renderClassAttendance() {
        const tbody = document.getElementById("attTableBody");
        if (!tbody) return;

        if (!this.currentAttendanceDate) {
            this.currentAttendanceDate = new Date().toISOString().split('T')[0];
        }
        if (!this.currentAttendanceClass) {
            this.currentAttendanceClass = "X TKP";
        }

        const dateInput = document.getElementById("attFilterTanggal");
        if (dateInput && dateInput.value !== this.currentAttendanceDate) {
            dateInput.value = this.currentAttendanceDate;
        }

        const classSelect = document.getElementById("attFilterKelas");
        if (classSelect && classSelect.value !== this.currentAttendanceClass) {
            classSelect.value = this.currentAttendanceClass;
        }

        const bannerText = this.getHariKegiatanText(this.currentAttendanceDate);
        const headerBanner = document.getElementById("attHeaderBannerText");
        if (headerBanner) headerBanner.textContent = `📅 ${bannerText}`;

        const tableBanner = document.getElementById("attTableActivityBanner");
        if (tableBanner) tableBanner.textContent = bannerText;

        // Pastikan siswa untuk kelas target sudah disiapkan
        StorageManager.ensureStudentsForClass(this.currentAttendanceClass);

        const allStudents = StorageManager.getStudents();
        const students = allStudents.filter(s => s.kelas && s.kelas.trim().toUpperCase() === this.currentAttendanceClass.trim().toUpperCase());

        // Urutkan berdasarkan no absen / nama
        students.sort((a, b) => {
            if (a.no && b.no) return a.no - b.no;
            return a.nama.localeCompare(b.nama);
        });

        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate);
        const records = (attData && attData.records) ? attData.records : {};

        let countHadir = 0;
        let countIzin = 0;
        let countSakit = 0;
        let countAlpha = 0;

        if (students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
                        Belum ada data siswa terdaftar untuk kelas <strong>${this.currentAttendanceClass}</strong>.<br>
                        ${AuthManager.isSuperAdmin() ? '<button class="btn btn-primary btn-sm" style="margin-top: 0.75rem;" onclick="Forms.openImportStudentsModal()">📥 Impor Siswa Excel</button>' : ''}
                    </td>
                </tr>
            `;
            const stats = document.getElementById("attSummaryStats");
            if (stats) stats.textContent = `Total: 0 Siswa`;
            return;
        }

        const rowsHtml = students.map((s, idx) => {
            const no = s.no || (idx + 1);
            const rec = records[s.id] || {
                status: 'alpha',
                rambut: false,
                atribut: false,
                makeup: false,
                seragam: false,
                violations: {}
            };

            const status = rec.status || 'alpha';
            if (status === 'hadir') countHadir++;
            else if (status === 'izin') countIzin++;
            else if (status === 'sakit') countSakit++;
            else countAlpha++;

            const isPresent = (status === 'hadir');
            const switchClass = isPresent ? 'att-present' : 'att-absent';
            const switchLabel = isPresent ? 'Hadir' : (status === 'izin' ? 'Izin' : (status === 'sakit' ? 'Sakit' : 'Alpha'));

            return `
                <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 700; color: var(--text-muted); font-size: 0.85rem;">${no}</td>
                    <td style="padding: 6px 12px; border-right: 1px solid #e2e8f0; text-align: left; font-weight: 700; color: var(--text-main); font-size: 0.88rem;">
                        ${s.nama}
                    </td>
                    <td style="padding: 4px; border-right: 1px solid #e2e8f0; vertical-align: middle;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <div class="att-toggle-switch ${switchClass}" onclick="AdminPortal.toggleStudentAttendance('${s.id}')" title="Klik untuk mengubah Hadir / Tidak Hadir">
                                <span class="att-toggle-thumb"></span>
                                <span>${switchLabel}</span>
                            </div>
                            <div class="att-ket-group">
                                <span class="att-ket-pill pill-alpha ${status === 'alpha' ? 'active' : ''}" onclick="AdminPortal.setStudentAttendanceKeterangan('${s.id}', 'alpha')" title="Alpha (Tanpa Keterangan)">A</span>
                                <span class="att-ket-pill pill-izin ${status === 'izin' ? 'active' : ''}" onclick="AdminPortal.setStudentAttendanceKeterangan('${s.id}', 'izin')" title="Izin">I</span>
                                <span class="att-ket-pill pill-sakit ${status === 'sakit' ? 'active' : ''}" onclick="AdminPortal.setStudentAttendanceKeterangan('${s.id}', 'sakit')" title="Sakit">S</span>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 4px; border-right: 1px solid #e2e8f0; vertical-align: middle;">
                        <input type="checkbox" class="att-checkbox-custom" ${rec.rambut ? 'checked' : ''} onchange="AdminPortal.handleViolationCheckbox('${s.id}', 'rambut', this.checked)" title="Rambut panjang/dicat">
                    </td>
                    <td style="padding: 4px; border-right: 1px solid #e2e8f0; vertical-align: middle;">
                        <input type="checkbox" class="att-checkbox-custom" ${rec.atribut ? 'checked' : ''} onchange="AdminPortal.handleViolationCheckbox('${s.id}', 'atribut', this.checked)" title="Atribut seragam tidak lengkap">
                    </td>
                    <td style="padding: 4px; border-right: 1px solid #e2e8f0; vertical-align: middle;">
                        <input type="checkbox" class="att-checkbox-custom" ${rec.makeup ? 'checked' : ''} onchange="AdminPortal.handleViolationCheckbox('${s.id}', 'makeup', this.checked)" title="Make up berlebih">
                    </td>
                    <td style="padding: 4px; vertical-align: middle;">
                        <input type="checkbox" class="att-checkbox-custom" ${rec.seragam ? 'checked' : ''} onchange="AdminPortal.handleViolationCheckbox('${s.id}', 'seragam', this.checked)" title="Seragam tidak benar / tidak lengkap">
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rowsHtml;

        const stats = document.getElementById("attSummaryStats");
        if (stats) {
            stats.innerHTML = `Rekap: <strong>${students.length} Siswa</strong> • Hadir: <span style="color: #16a34a; font-weight:800;">${countHadir}</span> • Izin: <span style="color: #d97706; font-weight:800;">${countIzin}</span> • Sakit: <span style="color: #2563eb; font-weight:800;">${countSakit}</span> • Alpha: <span style="color: #dc2626; font-weight:800;">${countAlpha}</span>`;
        }
    },

    toggleStudentAttendance(studentId) {
        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate) || {
            records: {},
            kegiatan: this.getHariKegiatanText(this.currentAttendanceDate)
        };
        if (!attData.records) attData.records = {};

        const currentRec = attData.records[studentId] || {
            status: 'alpha',
            rambut: false,
            atribut: false,
            makeup: false,
            seragam: false,
            violations: {}
        };
        if (!currentRec.violations) currentRec.violations = {};

        const user = AuthManager.getCurrentUser();
        const pencatat = user ? user.name : "Wali Kelas";

        if (currentRec.status === 'hadir') {
            // Geser ke Alpha
            currentRec.status = 'alpha';

            // Catat pelanggaran Alpha: 10 poin
            if (!currentRec.violations.alphaId) {
                const viol = StorageManager.addStudentViolation(studentId, {
                    nama: "Tidak masuk tanpa keterangan/Alpha baik pelajaran/upacara/senam",
                    kategori: "Kedisiplinan",
                    poin: 10,
                    sanksi: `Pembinaan Wali Kelas & Presensi (${this.getHariKegiatanText(this.currentAttendanceDate)})`,
                    pencatat: pencatat,
                    tanggal: this.currentAttendanceDate
                });
                if (viol && viol.id) {
                    currentRec.violations.alphaId = viol.id;
                }
            }
        } else {
            // Geser ke Hadir
            currentRec.status = 'hadir';

            // Hapus pelanggaran Alpha jika ada
            if (currentRec.violations.alphaId) {
                StorageManager.deleteStudentViolation(studentId, currentRec.violations.alphaId);
                currentRec.violations.alphaId = null;
            }
        }

        attData.records[studentId] = currentRec;
        StorageManager.saveClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate, attData);
        this.renderClassAttendance();
    },

    setStudentAttendanceKeterangan(studentId, newKet) {
        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate) || {
            records: {},
            kegiatan: this.getHariKegiatanText(this.currentAttendanceDate)
        };
        if (!attData.records) attData.records = {};

        const currentRec = attData.records[studentId] || {
            status: 'alpha',
            rambut: false,
            atribut: false,
            makeup: false,
            seragam: false,
            violations: {}
        };
        if (!currentRec.violations) currentRec.violations = {};

        const user = AuthManager.getCurrentUser();
        const pencatat = user ? user.name : "Wali Kelas";

        currentRec.status = newKet;

        if (newKet === 'alpha') {
            // Tambahkan pelanggaran Alpha jika belum ada
            if (!currentRec.violations.alphaId) {
                const viol = StorageManager.addStudentViolation(studentId, {
                    nama: "Tidak masuk tanpa keterangan/Alpha baik pelajaran/upacara/senam",
                    kategori: "Kedisiplinan",
                    poin: 10,
                    sanksi: `Pembinaan Wali Kelas & Presensi (${this.getHariKegiatanText(this.currentAttendanceDate)})`,
                    pencatat: pencatat,
                    tanggal: this.currentAttendanceDate
                });
                if (viol && viol.id) {
                    currentRec.violations.alphaId = viol.id;
                }
            }
        } else {
            // Izin atau Sakit: batalkan/cabut pelanggaran Alpha
            if (currentRec.violations.alphaId) {
                StorageManager.deleteStudentViolation(studentId, currentRec.violations.alphaId);
                currentRec.violations.alphaId = null;
            }
        }

        attData.records[studentId] = currentRec;
        StorageManager.saveClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate, attData);
        this.renderClassAttendance();
    },

    handleViolationCheckbox(studentId, field, isChecked) {
        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate) || {
            records: {},
            kegiatan: this.getHariKegiatanText(this.currentAttendanceDate)
        };
        if (!attData.records) attData.records = {};

        const currentRec = attData.records[studentId] || {
            status: 'alpha',
            rambut: false,
            atribut: false,
            makeup: false,
            seragam: false,
            violations: {}
        };
        if (!currentRec.violations) currentRec.violations = {};

        const user = AuthManager.getCurrentUser();
        const pencatat = user ? user.name : "Wali Kelas";
        const violKey = `${field}Id`;

        currentRec[field] = isChecked;

        if (isChecked) {
            let namaViol = "";
            let poinViol = 5;
            let sanksiViol = "";

            if (field === 'rambut' || field === 'makeup') {
                namaViol = "Rambut panjang (untuk putra)/dicat (untuk putra&putri)/make up berlebih";
                poinViol = 10;
                sanksiViol = field === 'rambut' 
                    ? "Peringatan lisan & potong/rapikan rambut sesuai ketentuan" 
                    : "Peringatan & pembersihan riasan make up berlebih";
            } else if (field === 'atribut' || field === 'seragam') {
                namaViol = "Atribut seragam tidak lengkap/tidak benar";
                poinViol = 5;
                sanksiViol = field === 'atribut'
                    ? "Peringatan kelengkapan atribut seragam sekolah"
                    : "Peringatan kerapian pakaian seragam sekolah";
            }

            if (!currentRec.violations[violKey]) {
                const viol = StorageManager.addStudentViolation(studentId, {
                    nama: namaViol,
                    kategori: "Kerapian",
                    poin: poinViol,
                    sanksi: sanksiViol,
                    pencatat: pencatat,
                    tanggal: this.currentAttendanceDate
                });
                if (viol && viol.id) {
                    currentRec.violations[violKey] = viol.id;
                }
            }
        } else {
            // Unchecked: cabut/hapus pelanggaran terkait
            if (currentRec.violations[violKey]) {
                StorageManager.deleteStudentViolation(studentId, currentRec.violations[violKey]);
                currentRec.violations[violKey] = null;
            }
        }

        attData.records[studentId] = currentRec;
        StorageManager.saveClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate, attData);
        this.renderClassAttendance();
    },

    markAllStudentsPresent() {
        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate) || {
            records: {},
            kegiatan: this.getHariKegiatanText(this.currentAttendanceDate)
        };
        if (!attData.records) attData.records = {};

        const allStudents = StorageManager.getStudents();
        const students = allStudents.filter(s => s.kelas && s.kelas.trim().toUpperCase() === this.currentAttendanceClass.trim().toUpperCase());

        students.forEach(s => {
            if (!attData.records[s.id]) {
                attData.records[s.id] = {
                    status: 'hadir',
                    rambut: false,
                    atribut: false,
                    makeup: false,
                    seragam: false,
                    violations: {}
                };
            } else {
                const rec = attData.records[s.id];
                if (rec.violations && rec.violations.alphaId) {
                    StorageManager.deleteStudentViolation(s.id, rec.violations.alphaId);
                    rec.violations.alphaId = null;
                }
                rec.status = 'hadir';
            }
        });

        StorageManager.saveClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate, attData);
        this.renderClassAttendance();
        App.showToast(`Seluruh siswa kelas ${this.currentAttendanceClass} berhasil ditandai Hadir!`);
    },

    exportAttendanceToExcel() {
        const allStudents = StorageManager.getStudents();
        const students = allStudents.filter(s => s.kelas && s.kelas.trim().toUpperCase() === this.currentAttendanceClass.trim().toUpperCase());
        students.sort((a, b) => (a.no || 0) - (b.no || 0));

        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate);
        const records = (attData && attData.records) ? attData.records : {};
        const bannerText = this.getHariKegiatanText(this.currentAttendanceDate);

        const exportData = students.map((s, idx) => {
            const rec = records[s.id] || { status: 'alpha', rambut: false, atribut: false, makeup: false, seragam: false };
            const statusUpper = (rec.status || 'alpha').toUpperCase();
            return {
                "No": s.no || (idx + 1),
                "Nama Siswa": s.nama,
                "Kelas": s.kelas,
                "Tanggal": this.currentAttendanceDate,
                "Kegiatan": bannerText,
                "Kehadiran": statusUpper,
                "Rambut (10 Poin)": rec.rambut ? "Melanggar" : "Rapi",
                "Atribut (5 Poin)": rec.atribut ? "Melanggar" : "Lengkap",
                "Make up (10 Poin)": rec.makeup ? "Melanggar" : "Rapi",
                "Seragam (5 Poin)": rec.seragam ? "Melanggar" : "Rapi"
            };
        });

        if (typeof XLSX === 'undefined') {
            App.showToast("Pustaka SheetJS belum termuat. Silakan periksa koneksi internet.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Presensi_Disiplin");

        const cleanClass = this.currentAttendanceClass.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Presensi_${cleanClass}_${this.currentAttendanceDate}.xlsx`;
        XLSX.writeFile(workbook, filename);
        App.showToast(`Berkas Excel (${filename}) berhasil diunduh!`);
    },

    printAttendanceSheet() {
        const allStudents = StorageManager.getStudents();
        const students = allStudents.filter(s => s.kelas && s.kelas.trim().toUpperCase() === this.currentAttendanceClass.trim().toUpperCase());
        students.sort((a, b) => (a.no || 0) - (b.no || 0));

        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate);
        const records = (attData && attData.records) ? attData.records : {};
        const bannerText = this.getHariKegiatanText(this.currentAttendanceDate);

        const printContainer = document.getElementById("printRaporContainer");
        if (!printContainer) return;

        const rowsHtml = students.map((s, idx) => {
            const rec = records[s.id] || { status: 'alpha', rambut: false, atribut: false, makeup: false, seragam: false };
            const statusText = (rec.status || 'alpha').toUpperCase();
            return `
                <tr>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${s.no || (idx + 1)}</td>
                    <td style="border: 1px solid #000; padding: 4px 8px; text-align: left;">${s.nama}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: bold;">${statusText}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${rec.rambut ? '✓' : ''}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${rec.atribut ? '✓' : ''}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${rec.makeup ? '✓' : ''}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${rec.seragam ? '✓' : ''}</td>
                </tr>
            `;
        }).join('');

        printContainer.innerHTML = `
            <div style="font-family: Arial, sans-serif; font-size: 11pt; color: #000; padding: 1.5cm 1cm;">
                <div style="text-align: center; margin-bottom: 1.25rem;">
                    <h2 style="margin: 0; font-size: 14pt; text-transform: uppercase;">BLANGKO PRESENSI & KEDISIPLINAN SISWA</h2>
                    <h3 style="margin: 4px 0 0 0; font-size: 12pt; text-transform: uppercase;">KELAS ${this.currentAttendanceClass} • SMKN 1 MAGELANG</h3>
                    <div style="margin-top: 6px; font-size: 10pt; font-weight: bold;">Tanggal: ${this.currentAttendanceDate} • Kegiatan: ${bannerText}</div>
                </div>

                <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 10pt;">
                    <thead>
                        <tr>
                            <th rowspan="2" style="border: 1px solid #000; width: 35px; padding: 6px; vertical-align: middle;">No</th>
                            <th rowspan="2" style="border: 1px solid #000; text-align: left; padding: 6px 8px; vertical-align: middle;">Nama Siswa</th>
                            <th colspan="5" style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #eee; text-transform: uppercase;">
                                ${bannerText}
                            </th>
                        </tr>
                        <tr>
                            <th style="border: 1px solid #000; width: 90px; padding: 6px;">Kehadiran</th>
                            <th style="border: 1px solid #000; width: 60px; padding: 6px;">Rambut</th>
                            <th style="border: 1px solid #000; width: 60px; padding: 6px;">Atribut</th>
                            <th style="border: 1px solid #000; width: 60px; padding: 6px; font-style: italic;">Make up</th>
                            <th style="border: 1px solid #000; width: 60px; padding: 6px;">Seragam</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div style="margin-top: 2rem; display: flex; justify-content: space-between; page-break-inside: avoid;">
                    <div style="text-align: center; width: 220px;">
                        <br>
                        Waka Kesiswaan SMKN 1 Magelang
                        <br><br><br><br>
                        <strong>Morlan Purba Sibarani, S.Pd., M.Si.</strong><br>
                        NIP. 19740315 200501 1 004
                    </div>
                    <div style="text-align: center; width: 220px;">
                        Magelang, ${this.currentAttendanceDate}<br>
                        Wali Kelas ${this.currentAttendanceClass}
                        <br><br><br><br>
                        <strong>${AuthManager.getCurrentUser() ? AuthManager.getCurrentUser().name : '...................................'}</strong>
                    </div>
                </div>
            </div>
        `;

        window.print();
    },

    escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // =========================================================================
    // 7. MANAJEMEN PENGUMUMAN (SUPER ADMIN & ADMIN KESISWAAN)
    // =========================================================================
    renderAdminPengumumanList() {
        const container = document.getElementById("adminPengumumanListContainer");
        if (!container) return;

        const announcements = StorageManager.getAnnouncements();
        if (announcements.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-muted); background: #ffffff; border: 1px dashed var(--border); border-radius: var(--radius-md);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📢</div>
                    <strong style="color: var(--text-main);">Belum Ada Pengumuman Terbit</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Klik tombol "+ Buat Pengumuman Baru" untuk menerbitkan informasi resmi.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = announcements.map(ann => `
            <div class="pengumuman-admin-card">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 0.5rem; flex-wrap: wrap;">
                        <span class="status-pill ${ann.badgeClass || 'pill-yellow'}" style="font-size: 0.725rem;">
                            ${ann.kategoriLabel || ann.kategori.toUpperCase()}
                        </span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">📅 ${ann.tanggal}</span>
                    </div>
                    <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.35rem; line-height: 1.4;">
                        ${this.escapeHtml(ann.judul)}
                    </h4>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.65rem;">
                        <span>✍️ ${this.escapeHtml(ann.penulis)}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem;">
                        ${this.escapeHtml(ann.ringkasan || ann.isi.substring(0, 100) + '...')}
                    </p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.75rem; gap: 0.5rem;">
                    <button class="btn btn-outline btn-sm" onclick="App.openDetailPengumuman('${ann.id}')">
                        👁️ Lihat
                    </button>
                    <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-outline btn-sm" onclick="AdminPortal.openEditPengumuman('${ann.id}')" title="Edit Pengumuman">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="AdminPortal.deletePengumuman('${ann.id}')" title="Hapus Pengumuman">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    openAddPengumumanModal() {
        const editIdEl = document.getElementById("inputAnnEditId");
        if (editIdEl) editIdEl.value = "";
        const titleEl = document.getElementById("modalPengumumanTitle");
        if (titleEl) titleEl.textContent = "📢 Buat Pengumuman Kesiswaan Baru";
        const btnSubmit = document.getElementById("btnSaveAnnSubmit");
        if (btnSubmit) btnSubmit.textContent = "📢 Publikasikan Sekarang";

        const katEl = document.getElementById("inputAnnKategori");
        if (katEl) katEl.value = "penting";
        const judEl = document.getElementById("inputAnnJudul");
        if (judEl) judEl.value = "";
        const penEl = document.getElementById("inputAnnPenulis");
        if (penEl) penEl.value = "Tim Kesiswaan SMKN 1 Magelang";
        const ringkEl = document.getElementById("inputAnnRingkasan");
        if (ringkEl) ringkEl.value = "";
        const isiEl = document.getElementById("inputAnnIsi");
        if (isiEl) isiEl.value = "";

        Forms.openModal("modalTambahPengumuman");
    },

    openEditPengumuman(id) {
        const announcements = StorageManager.getAnnouncements();
        const ann = announcements.find(a => String(a.id).trim() === String(id).trim());
        if (!ann) return;

        const editIdEl = document.getElementById("inputAnnEditId");
        if (editIdEl) editIdEl.value = ann.id;
        const titleEl = document.getElementById("modalPengumumanTitle");
        if (titleEl) titleEl.textContent = "✏️ Edit Pengumuman Kesiswaan";
        const btnSubmit = document.getElementById("btnSaveAnnSubmit");
        if (btnSubmit) btnSubmit.textContent = "💾 Simpan Perubahan";

        const katEl = document.getElementById("inputAnnKategori");
        if (katEl) katEl.value = ann.kategori || "penting";
        const judEl = document.getElementById("inputAnnJudul");
        if (judEl) judEl.value = ann.judul || "";
        const penEl = document.getElementById("inputAnnPenulis");
        if (penEl) penEl.value = ann.penulis || "";
        const ringkEl = document.getElementById("inputAnnRingkasan");
        if (ringkEl) ringkEl.value = ann.ringkasan || "";
        const isiEl = document.getElementById("inputAnnIsi");
        if (isiEl) isiEl.value = ann.isi || "";

        Forms.openModal("modalTambahPengumuman");
    },

    deletePengumuman(id) {
        if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;
        StorageManager.deleteAnnouncement(id);
        this.renderAdminPengumumanList();
        this.updateAdminBadgeCounts();
        if (typeof App.renderDashboardPengumuman === "function") {
            App.renderDashboardPengumuman();
        }
        App.showToast("Pengumuman berhasil dihapus!");
    },

    // =========================================================================
    // 8. MANAJEMEN AGENDA TERDEKAT (SUPER ADMIN & ADMIN KESISWAAN)
    // =========================================================================
    renderAdminAgendaTerdekatList() {
        const container = document.getElementById("adminAgendaTerdekatListContainer");
        if (!container) return;

        const agendas = StorageManager.getAgendaTerdekat();
        if (agendas.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-muted); background: #ffffff; border: 1px dashed var(--border); border-radius: var(--radius-md);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⏰</div>
                    <strong style="color: var(--text-main);">Belum Ada Agenda Terdekat</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Klik "+ Tambah Agenda Terdekat" untuk menjadwalkan agenda sekolah.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = agendas.map(agn => `
            <div class="agenda-admin-card">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 0.5rem; flex-wrap: wrap;">
                        <span class="agenda-countdown-badge" style="font-size: 0.725rem;">
                            ${this.escapeHtml(agn.countdown || '📅 Agenda')}
                        </span>
                        <span class="status-pill pill-blue" style="font-size: 0.725rem;">${this.escapeHtml(agn.kategori || 'Kesiswaan')}</span>
                    </div>
                    <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.35rem; line-height: 1.4;">
                        ${this.escapeHtml(agn.nama)}
                    </h4>
                    <p style="font-size: 0.825rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.75rem;">
                        ${this.escapeHtml(agn.keterangan || '')}
                    </p>
                    <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.25rem; color: var(--text-main); margin-bottom: 1rem; background: #f8fafc; padding: 0.65rem; border-radius: 6px;">
                        <div>🗓️ <strong>${this.escapeHtml(agn.tanggal)}</strong></div>
                        <div>📍 <span>${this.escapeHtml(agn.tempat)}</span></div>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid var(--border); padding-top: 0.75rem; gap: 0.5rem;">
                    <button class="btn btn-outline btn-sm" onclick="AdminPortal.openAddAgendaModal('${agn.id}')" title="Edit Agenda">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="AdminPortal.deleteAgendaTerdekat('${agn.id}')" title="Hapus Agenda">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        `).join('');
    },

    openAddAgendaModal(id = null) {
        const editIdEl = document.getElementById("inputAgendaEditId");
        if (editIdEl) editIdEl.value = id || "";
        const titleEl = document.getElementById("modalAgendaTitle");
        const btnText = document.getElementById("btnSaveAgendaText");

        if (id) {
            const list = StorageManager.getAgendaTerdekat();
            const agn = list.find(a => a.id === id);
            if (!agn) return;
            if (titleEl) titleEl.textContent = "✏️ Edit Agenda Terdekat";
            if (btnText) btnText.textContent = "💾 Simpan Perubahan";
            document.getElementById("inputAgendaNama").value = agn.nama || "";
            document.getElementById("inputAgendaTanggal").value = agn.tanggal || "";
            document.getElementById("inputAgendaTempat").value = agn.tempat || "";
            document.getElementById("inputAgendaKategori").value = agn.kategori || "";
            document.getElementById("inputAgendaCountdown").value = agn.countdown || "";
            document.getElementById("inputAgendaKeterangan").value = agn.keterangan || "";
        } else {
            if (titleEl) titleEl.textContent = "⏰ Tambah Agenda Terdekat";
            if (btnText) btnText.textContent = "💾 Simpan Agenda";
            document.getElementById("inputAgendaNama").value = "";
            document.getElementById("inputAgendaTanggal").value = "";
            document.getElementById("inputAgendaTempat").value = "";
            document.getElementById("inputAgendaKategori").value = "Kesiswaan";
            document.getElementById("inputAgendaCountdown").value = "🔥 Terdekat Pekan Ini";
            document.getElementById("inputAgendaKeterangan").value = "";
        }

        Forms.openModal("modalTambahAgendaTerdekat");
    },

    handleSaveAgendaTerdekat(event) {
        event.preventDefault();
        const editId = document.getElementById("inputAgendaEditId").value;
        const nama = document.getElementById("inputAgendaNama").value.trim();
        const tanggal = document.getElementById("inputAgendaTanggal").value.trim();
        const tempat = document.getElementById("inputAgendaTempat").value.trim();
        const kategori = document.getElementById("inputAgendaKategori").value.trim();
        const countdown = document.getElementById("inputAgendaCountdown").value.trim();
        const keterangan = document.getElementById("inputAgendaKeterangan").value.trim();

        if (editId) {
            StorageManager.updateAgendaTerdekat(editId, { nama, tanggal, tempat, kategori, countdown, keterangan });
            App.showToast("Agenda terdekat berhasil diperbarui!");
        } else {
            StorageManager.addAgendaTerdekat({ nama, tanggal, tempat, kategori, countdown, keterangan });
            App.showToast("Agenda terdekat baru berhasil ditambahkan!");
        }

        Forms.closeModal("modalTambahAgendaTerdekat");
        this.renderAdminAgendaTerdekatList();
        this.updateAdminBadgeCounts();
        if (typeof App.renderDashboardAgendaTerdekat === "function") {
            App.renderDashboardAgendaTerdekat();
        }
    },

    deleteAgendaTerdekat(id) {
        if (!confirm("Apakah Anda yakin ingin menghapus agenda terdekat ini?")) return;
        StorageManager.deleteAgendaTerdekat(id);
        this.renderAdminAgendaTerdekatList();
        this.updateAdminBadgeCounts();
        if (typeof App.renderDashboardAgendaTerdekat === "function") {
            App.renderDashboardAgendaTerdekat();
        }
        App.showToast("Agenda terdekat berhasil dihapus!");
    },

    // =========================================================================
    // 9. MANAJEMEN TATA TERTIB (KHUSUS SUPER ADMIN)
    // =========================================================================
    renderAdminTataTertibList() {
        const container = document.getElementById("adminTataTertibListContainer");
        if (!container) return;

        const rules = StorageManager.getTataTertib();
        container.innerHTML = rules.map((r, catIdx) => `
            <div class="tatatertib-admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                        <span class="status-pill ${r.badgeClass || 'pill-blue'}" style="font-size: 0.725rem;">
                            ${this.escapeHtml(r.kategoriLabel)}
                        </span>
                        <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 0.25rem;">
                            ${this.escapeHtml(r.judul)}
                        </h4>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${r.butirAturan.length} Butir Ketentuan</span>
                        <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 2px 8px;" onclick="AdminPortal.openEditTataTertibCategoryModal(${catIdx})" title="Edit Judul Kategori">✏️ Edit Judul</button>
                    </div>
                </div>
                <ol style="padding-left: 1.25rem; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
                    ${r.butirAturan.map((b, ruleIdx) => `
                        <li style="font-size: 0.875rem; color: var(--text-main); line-height: 1.5;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                                <span style="flex: 1;">${this.escapeHtml(b)}</span>
                                <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center;">
                                    <button type="button" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.75rem; color: var(--primary); font-weight: 600;" onclick="AdminPortal.openEditTataTertibModal(${catIdx}, ${ruleIdx})" title="Edit Butir Aturan Ini">✏️ Edit</button>
                                    <button type="button" class="btn btn-outline btn-sm" style="padding: 2px 6px; font-size: 0.75rem; color: #dc2626;" onclick="AdminPortal.deleteTataTertibRule(${catIdx}, ${ruleIdx})" title="Hapus Aturan Ini">✕</button>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ol>
            </div>
        `).join('');
    },

    openAddTataTertibModal() {
        document.getElementById("inputTTText").value = "";
        Forms.openModal("modalTambahTataTertib");
    },

    handleSaveNewTataTertib(event) {
        event.preventDefault();
        const kategori = document.getElementById("inputTTKategori").value;
        const text = document.getElementById("inputTTText").value.trim();
        if (!text) return;

        const rules = StorageManager.getTataTertib();
        const target = rules.find(r => r.kategori === kategori);
        if (target) {
            target.butirAturan.push(text);
            StorageManager.saveTataTertib(rules);
            App.showToast("Aturan tata tertib baru berhasil ditambahkan!");
            Forms.closeModal("modalTambahTataTertib");
            this.renderAdminTataTertibList();
            if (typeof App.renderDashboardTataTertib === "function") {
                App.renderDashboardTataTertib();
            }
        }
    },

    openEditTataTertibModal(catIdx, ruleIdx) {
        const rules = StorageManager.getTataTertib();
        if (!rules[catIdx] || !rules[catIdx].butirAturan[ruleIdx]) return;

        const cat = rules[catIdx];
        const ruleText = cat.butirAturan[ruleIdx];

        const catInput = document.getElementById("editTTCatIdx");
        const ruleInput = document.getElementById("editTTRuleIdx");
        const labelInput = document.getElementById("editTTKategoriLabel");
        const textInput = document.getElementById("editTTText");

        if (catInput) catInput.value = catIdx;
        if (ruleInput) ruleInput.value = ruleIdx;
        if (labelInput) labelInput.value = `${cat.kategoriLabel || ''} - ${cat.judul || ''}`;
        if (textInput) textInput.value = ruleText;

        Forms.openModal("modalEditTataTertib");
    },

    handleSaveEditTataTertib(event) {
        event.preventDefault();
        const catIdx = parseInt(document.getElementById("editTTCatIdx").value, 10);
        const ruleIdx = parseInt(document.getElementById("editTTRuleIdx").value, 10);
        const newText = document.getElementById("editTTText").value.trim();

        if (!newText) {
            App.showToast("Teks aturan tidak boleh kosong!");
            return;
        }

        const rules = StorageManager.getTataTertib();
        if (rules[catIdx] && rules[catIdx].butirAturan && rules[catIdx].butirAturan[ruleIdx] !== undefined) {
            rules[catIdx].butirAturan[ruleIdx] = newText;
            StorageManager.saveTataTertib(rules);
            App.showToast("Butir aturan tata tertib berhasil diperbarui!");
            Forms.closeModal("modalEditTataTertib");
            this.renderAdminTataTertibList();
            if (typeof App.renderDashboardTataTertib === "function") {
                App.renderDashboardTataTertib();
            }
        }
    },

    openEditTataTertibCategoryModal(catIdx) {
        const rules = StorageManager.getTataTertib();
        if (!rules[catIdx]) return;

        const cat = rules[catIdx];
        const catIdxInput = document.getElementById("editTTCatOnlyIdx");
        const labelInput = document.getElementById("editTTCatLabel");
        const judulInput = document.getElementById("editTTCatJudul");

        if (catIdxInput) catIdxInput.value = catIdx;
        if (labelInput) labelInput.value = cat.kategoriLabel || "";
        if (judulInput) judulInput.value = cat.judul || "";

        Forms.openModal("modalEditTataTertibCategory");
    },

    handleSaveEditTataTertibCategory(event) {
        event.preventDefault();
        const catIdx = parseInt(document.getElementById("editTTCatOnlyIdx").value, 10);
        const catLabel = document.getElementById("editTTCatLabel").value.trim();
        const judul = document.getElementById("editTTCatJudul").value.trim();

        if (!catLabel || !judul) {
            App.showToast("Label kategori dan judul tidak boleh kosong!");
            return;
        }

        const rules = StorageManager.getTataTertib();
        if (rules[catIdx]) {
            rules[catIdx].kategoriLabel = catLabel;
            rules[catIdx].judul = judul;
            StorageManager.saveTataTertib(rules);
            App.showToast("Judul kategori tata tertib berhasil diperbarui!");
            Forms.closeModal("modalEditTataTertibCategory");
            this.renderAdminTataTertibList();
            if (typeof App.renderDashboardTataTertib === "function") {
                App.renderDashboardTataTertib();
            }
        }
    },

    deleteTataTertibRule(catIdx, ruleIdx) {
        if (!confirm("Apakah Anda yakin ingin menghapus butir aturan ini?")) return;
        const rules = StorageManager.getTataTertib();
        if (rules[catIdx] && rules[catIdx].butirAturan[ruleIdx]) {
            rules[catIdx].butirAturan.splice(ruleIdx, 1);
            StorageManager.saveTataTertib(rules);
            App.showToast("Butir aturan berhasil dihapus!");
            this.renderAdminTataTertibList();
            if (typeof App.renderDashboardTataTertib === "function") {
                App.renderDashboardTataTertib();
            }
        }
    },

    // =========================================================================
    // 10. MANAJEMEN PROGRAM KERJA SEKBID 1 - 10 (KHUSUS SUPER ADMIN)
    // =========================================================================
    currentAdminSekbidIdx: 0,

    renderAdminSekbidList(sekbidIndex = null) {
        if (sekbidIndex !== null) this.currentAdminSekbidIdx = sekbidIndex;
        const navContainer = document.getElementById("adminSekbidSelectorNav");
        const formContainer = document.getElementById("adminSekbidEditorFormContainer");
        if (!navContainer || !formContainer) return;

        const sekbids = StorageManager.getSekbidPrograms();
        const idx = this.currentAdminSekbidIdx;

        // Render Selector Pills
        navContainer.innerHTML = sekbids.map((s, i) => `
            <button type="button" class="${i === idx ? 'active' : ''}" onclick="AdminPortal.selectAdminSekbid(${i})">
                Sekbid ${s.nomor}: ${s.namaSingkat}
            </button>
        `).join('');

        const cur = sekbids[idx];
        const programLines = (cur.programKerja || []).map(p => typeof p === 'string' ? p : (p.nama + ' - ' + p.deskripsi)).join('\n');

        formContainer.innerHTML = `
            <form onsubmit="AdminPortal.handleSaveSekbid(event, ${idx})">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span style="font-size: 1.75rem;">${cur.ikon}</span>
                        <div>
                            <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--primary); margin: 0;">Sekbid ${cur.nomor}: ${this.escapeHtml(cur.nama)}</h4>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">${this.escapeHtml(cur.namaSingkat)}</span>
                        </div>
                    </div>
                    <span class="status-pill pill-blue">OSIS Sekbid ${cur.nomor}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group-clean">
                            <label style="font-size: 0.825rem; font-weight: 700;">Guru Pembina Sekbid</label>
                            <input type="text" id="editSekbidPembina" class="form-control-clean" value="${this.escapeHtml(cur.pembina || '')}" required>
                        </div>
                        <div class="form-group-clean">
                            <label style="font-size: 0.825rem; font-weight: 700;">Ketua Sekbid (Siswa)</label>
                            <input type="text" id="editSekbidKetua" class="form-control-clean" value="${this.escapeHtml(cur.ketua || '')}" required>
                        </div>
                    </div>

                    <div class="form-group-clean">
                        <label style="font-size: 0.825rem; font-weight: 700;">Fokus & Visi Sekbid</label>
                        <textarea id="editSekbidVisi" class="form-control-clean" rows="2" required>${this.escapeHtml(cur.visi || '')}</textarea>
                    </div>

                    <div class="form-group-clean">
                        <label style="font-size: 0.825rem; font-weight: 700;">Daftar Program Kerja (Tulis 1 program per baris dengan format: Nama Program - Rincian)</label>
                        <textarea id="editSekbidPrograms" class="form-control-clean" rows="6" placeholder="Contoh: Pemilihan Ketua OSIS - Penyelenggaraan pemilu demokratis..." required>${this.escapeHtml(programLines)}</textarea>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
                        <button type="submit" class="btn btn-primary">
                            💾 Simpan Perubahan Sekbid ${cur.nomor}
                        </button>
                    </div>
                </div>
            </form>
        `;
    },

    selectAdminSekbid(index) {
        this.renderAdminSekbidList(index);
    },

    handleSaveSekbid(event, index) {
        event.preventDefault();
        const sekbids = StorageManager.getSekbidPrograms();
        const cur = sekbids[index];
        if (!cur) return;

        const pembina = document.getElementById("editSekbidPembina").value.trim();
        const ketua = document.getElementById("editSekbidKetua").value.trim();
        const visi = document.getElementById("editSekbidVisi").value.trim();
        const progText = document.getElementById("editSekbidPrograms").value.trim();

        const rawLines = progText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const parsedPrograms = rawLines.map(line => {
            const parts = line.split(' - ');
            if (parts.length > 1) {
                return { nama: parts[0].trim(), deskripsi: parts.slice(1).join(' - ').trim(), status: "Aktif Terlaksana" };
            }
            return { nama: line, deskripsi: "Program kerja aktif kesiswaan", status: "Aktif Terlaksana" };
        });

        cur.pembina = pembina;
        cur.ketua = ketua;
        cur.visi = visi;
        cur.programKerja = parsedPrograms;

        StorageManager.saveSekbidPrograms(sekbids);
        App.showToast(`Program kerja Sekbid ${cur.nomor} berhasil diperbarui!`);
        this.renderAdminSekbidList(index);
        if (typeof App.renderDashboardSekbid === "function") {
            App.renderDashboardSekbid(index);
        }
    }
};
