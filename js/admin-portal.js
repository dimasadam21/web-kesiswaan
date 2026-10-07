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

        // Tampilkan siswa pertama sebagai contoh awal
        const students = StorageManager.getStudents();
        if (students.length > 0) {
            this.selectTargetStudent(students[0].id);
        }

        this.renderTeacherAllStudents();
        this.renderAdminPrestasiList();
        this.renderAdminKegiatanList();
        this.updateAdminBadgeCounts();

        const btnTambahSiswa = document.getElementById("btnTambahSiswaSuperAdmin");
        if (btnTambahSiswa) {
            btnTambahSiswa.style.display = AuthManager.isSuperAdmin() ? "inline-flex" : "none";
        }

        this.switchAdminTab(this.currentTab || 'siswa');
    },

    // 0. Beralih Antara Sub-Tab Admin (Siswa, Prestasi, Kegiatan)
    switchAdminTab(tabName) {
        this.currentTab = tabName;

        const tabBtns = {
            siswa: document.getElementById("adminTabBtnSiswa"),
            prestasi: document.getElementById("adminTabBtnPrestasi"),
            kegiatan: document.getElementById("adminTabBtnKegiatan")
        };

        const panes = {
            siswa: document.getElementById("adminPaneSiswa"),
            prestasi: document.getElementById("adminPanePrestasi"),
            kegiatan: document.getElementById("adminPaneKegiatan")
        };

        // Update Tombol Tab
        Object.keys(tabBtns).forEach(key => {
            if (tabBtns[key]) {
                tabBtns[key].classList.toggle("active", key === tabName);
            }
        });

        // Update Panel Tampilan
        Object.keys(panes).forEach(key => {
            if (panes[key]) {
                panes[key].style.display = key === tabName ? "block" : "none";
            }
        });

        if (tabName === "prestasi") {
            this.renderAdminPrestasiList();
        } else if (tabName === "kegiatan") {
            this.renderAdminKegiatanList();
        }

        this.updateAdminBadgeCounts();
    },

    updateAdminBadgeCounts() {
        const allPrestasi = StorageManager.getAllAchievements();
        const allKegiatan = StorageManager.getActivities();

        const badgePres = document.getElementById("adminPrestasiCountBadge");
        if (badgePres) badgePres.textContent = allPrestasi.length;

        const badgeKeg = document.getElementById("adminKegiatanCountBadge");
        if (badgeKeg) badgeKeg.textContent = allKegiatan.length;
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
        document.getElementById("targetStudentPoinPrestasi").textContent = `+${st.totalPoinPrestasi} Poin`;

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
                title.textContent = "🏆 10 Siswa Teratas (Poin Prestasi Tertinggi)";
            } else if (mode === 'pelanggaran') {
                title.textContent = "⚠️ 10 Siswa Teratas (Poin Pelanggaran Tertinggi)";
            } else {
                title.textContent = "🌟 10 Siswa Teratas (Poin Tertinggi)";
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
                score = st.totalPoinPrestasi || 0;
            } else if (mode === 'pelanggaran') {
                score = st.totalPoinPelanggaran || 0;
            } else {
                score = Math.max(st.totalPoinPrestasi || 0, st.totalPoinPelanggaran || 0);
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
                        <strong style="color: ${st.totalPoinPrestasi > 0 ? 'var(--success)' : 'var(--text-muted)'};">
                            +${st.totalPoinPrestasi} Poin
                        </strong>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${(s.prestasi || []).length} Prestasi</div>
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
                            <span class="status-pill pill-green">+${p.poin} Poin</span>
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
    }
};
