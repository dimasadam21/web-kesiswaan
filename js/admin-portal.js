/**
 * PORTAL GURU & KESISWAAN (SETELAH GURU / ADMIN / SUPER ADMIN LOGIN)
 * Fitur Utama: 
 * 1. Sub-navigasi terpisah: Cari Siswa, Presensi & Disiplin Kelas, Rekap Riwayat Sebelumnya, Kelola Prestasi, dan Kelola Kegiatan.
 * 2. Kelola banyak prestasi siswa dengan thumbnail foto & hapus prestasi (otomatis tayang di slider dasbor).
 * 3. Kelola agenda kegiatan kesiswaan dengan tambah & hapus kegiatan (otomatis tayang di agenda dasbor).
 */

const AdminPortal = {
    selectedStudent: null,
    currentTab: 'siswa',
    currentAttendanceDate: null,
    currentAttendanceClass: 'X TKP',
    currentRekapView: 'siswa',
    currentRekapFilterMonth: '',

    getTodayDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    getDayOfWeek(dateStr) {
        if (!dateStr) dateStr = this.getTodayDate();
        const parts = String(dateStr).split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getDay();
        }
        return new Date(dateStr + "T00:00:00").getDay();
    },

    init() {
        this.currentAttendanceDate = this.getTodayDate();
        this.updateAttendanceDayDisplay(this.currentAttendanceDate);
    },

    updateAttendanceDayDisplay(dateStr) {
        if (!dateStr) dateStr = this.currentAttendanceDate || this.getTodayDate();
        const dayOfWeek = this.getDayOfWeek(dateStr);
        const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
        const dayName = dayNames[dayOfWeek] || "";

        const badgeDay = document.getElementById("attDayNameBadge");
        if (badgeDay) {
            badgeDay.textContent = dayName;
        }

        const dateInput = document.getElementById("attFilterTanggal");
        if (dateInput && !dateInput.value) {
            dateInput.value = dateStr;
        }

        const bannerText = this.getHariKegiatanText(dateStr);
        const headerBanner = document.getElementById("attHeaderBannerText");
        if (headerBanner) {
            headerBanner.textContent = `📅 ${bannerText}`;
        }

        const tableBanner = document.getElementById("attTableActivityBanner");
        if (tableBanner) {
            tableBanner.textContent = bannerText;
        }
    },

    initTeacherPortal(user) {
        // Otomatiskan tanggal presensi sesuai hari lokal saat ini saat mengisi
        this.currentAttendanceDate = this.getTodayDate();
        this.updateAttendanceDayDisplay(this.currentAttendanceDate);

        const greeting = document.getElementById("teacherGreetingName");
        if (greeting) {
            greeting.textContent = `${user.name} (${user.roleLabel})`;
        }

        const searchInput = document.getElementById("teacherSearchStudentInput");
        if (searchInput) searchInput.value = "";

        const dropdown = document.getElementById("teacherSearchDropdown");
        if (dropdown) dropdown.style.display = "none";

        const isSuperAdmin = AuthManager.isSuperAdmin();
        const isWaliKelas = AuthManager.isWaliKelas();

        if (user && user.kelas && user.kelas !== "-") {
            this.currentAttendanceClass = user.kelas;
        } else {
            this.currentAttendanceClass = "X TKP";
        }

        const isAdminKesiswaan = !isSuperAdmin && !isWaliKelas;

        // Sembunyikan tombol catat pelanggaran, prestasi & edit profil untuk Wali Kelas (hanya melihat)
        const btnTargetAddVio = document.getElementById("btnTargetAddViolation");
        const btnTargetAddAch = document.getElementById("btnTargetAddAchievement");
        const btnTargetEditStu = document.getElementById("btnTargetEditStudent");
        if (btnTargetAddVio) btnTargetAddVio.style.display = isWaliKelas ? "none" : "inline-flex";
        if (btnTargetAddAch) btnTargetAddAch.style.display = isWaliKelas ? "none" : "inline-flex";
        if (btnTargetEditStu) btnTargetEditStu.style.display = isWaliKelas ? "none" : "inline-flex";

        // Tampilkan tombol tab Presensi & Rekap Riwayat HANYA untuk Wali Kelas
        const btnPresensi = document.getElementById("adminTabBtnPresensi");
        if (btnPresensi) {
            btnPresensi.style.display = isWaliKelas ? "inline-flex" : "none";
        }
        const btnRiwayat = document.getElementById("adminTabBtnRiwayat");
        if (btnRiwayat) {
            btnRiwayat.style.display = isWaliKelas ? "inline-flex" : "none";
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

        const btnToggleRambut = document.getElementById("btnToggleRambutSuperAdmin");
        if (btnToggleRambut) {
            btnToggleRambut.style.display = (isSuperAdmin || isAdminKesiswaan) ? "inline-flex" : "none";
            this.updateRambutToggleButton();
        }

        // Inisialisasi dropdown kelas presensi
        this.populateAttendanceClassOptions();

        // Tampilkan siswa pertama sebagai contoh awal di tab siswa
        const students = StorageManager.getStudents();
        if (students.length > 0) {
            this.selectTargetStudent(students[0].id);
        }

        // Tentukan dan aktifkan tab pertama secara instan
        const initialTab = isWaliKelas ? 'presensi' : (this.currentTab || 'siswa');
        this.switchAdminTab(initialTab);

        // Tunda pembaruan badge counts dan data latar belakang agar transisi login instan (< 15ms)
        setTimeout(() => {
            this.updateAdminBadgeCounts();
        }, 50);
    },

    // 0. Beralih Antara Sub-Tab Admin
    switchAdminTab(tabName) {
        this.currentTab = tabName;

        const tabBtns = {
            presensi: [document.getElementById("adminTabBtnPresensi"), document.getElementById("hubTabBtnPresensi")],
            riwayat: [document.getElementById("adminTabBtnRiwayat"), document.getElementById("hubTabBtnRiwayat")],
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
            riwayat: document.getElementById("adminPaneRiwayat"),
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
        } else if (tabName === "siswa") {
            this.renderTeacherAllStudents();
        } else if (tabName === "riwayat") {
            this.renderAttendanceHistory();
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
            dropdown.innerHTML = "";
            return;
        }

        const tokens = q.split(/\s+/).filter(Boolean);
        const students = StorageManager.getStudents() || [];

        const matches = students.filter(s => {
            const nama = (s.nama || "").toLowerCase();
            const nis = String(s.nis || "").toLowerCase();
            const nisn = String(s.nisn || "").toLowerCase();
            const kelas = (s.kelas || "").toLowerCase();
            const jurusan = (s.jurusan || "").toLowerCase();

            return tokens.every(t => 
                nama.includes(t) || 
                nis.includes(t) || 
                nisn.includes(t) || 
                kelas.includes(t) ||
                jurusan.includes(t)
            );
        });

        // Urutkan kecocokan: Yang diawali query diletakkan paling atas
        matches.sort((a, b) => {
            const aName = (a.nama || "").toLowerCase();
            const bName = (b.nama || "").toLowerCase();
            const aStarts = aName.startsWith(q);
            const bStarts = bName.startsWith(q);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return aName.localeCompare(bName);
        });

        if (matches.length === 0) {
            dropdown.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); font-size: 0.85rem; text-align: center;">Tidak ada siswa yang cocok dengan "<strong>${query}</strong>".</div>`;
            dropdown.style.display = "block";
            return;
        }

        const maxDisplay = 10;
        const displayed = matches.slice(0, maxDisplay);

        const highlight = (text) => {
            let res = text || "";
            tokens.forEach(t => {
                const cleanT = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (cleanT) {
                    const reg = new RegExp(`(${cleanT})`, 'gi');
                    res = res.replace(reg, '<mark style="background: #fef08a; color: #1e293b; padding: 0 2px; border-radius: 3px; font-weight: 700;">$1</mark>');
                }
            });
            return res;
        };

        const fallbackFemale = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80";
        const fallbackMale = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";

        let html = displayed.map(s => {
            const st = StorageManager.calculateStudentStatus(s);
            const fallbackAvatar = s.gender === 'P' ? fallbackFemale : fallbackMale;
            const fotoUrl = s.foto || fallbackAvatar;
            const highlightedName = highlight(s.nama);

            return `
                <div style="padding: 0.65rem 0.9rem; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; transition: background 0.15s;"
                     onclick="AdminPortal.selectTargetStudent('${s.id}')"
                     onmouseover="this.style.background='#f1f5f9'"
                     onmouseout="this.style.background='#ffffff'">
                    <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0; flex: 1;">
                        <img src="${fotoUrl}" alt="Foto" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0;" onerror="this.src='${fallbackAvatar}'">
                        <div style="min-width: 0;">
                            <strong style="color: var(--text-main); font-size: 0.88rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${highlightedName}</strong>
                            <div style="font-size: 0.74rem; color: var(--text-muted);"><span style="background: #e0f2fe; color: #0369a1; font-weight: 700; padding: 1px 5px; border-radius: 4px;">${s.kelas}</span>${(s.nis || s.nisn) ? ` • NIS: ${s.nis || '-'} • NISN: ${s.nisn || '-'}` : ''}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                        <span class="status-pill ${st.badgeClass}" style="font-size: 0.7rem; padding: 2px 7px;">${st.statusText}</span>
                        <span style="font-size: 0.75rem; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 6px;">👉 Buka</span>
                    </div>
                </div>
            `;
        }).join('');

        if (matches.length > maxDisplay) {
            html += `<div style="padding: 0.5rem; background: #f8fafc; font-size: 0.74rem; color: var(--text-muted); text-align: center; border-top: 1px solid var(--border);">Menampilkan 10 dari total ${matches.length} siswa cocok. Ketik lebih spesifik...</div>`;
        }

        dropdown.innerHTML = html;
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

        const students = StorageManager.getStudents() || [];
        const tokens = q.split(/\s+/).filter(Boolean);
        const match = students.find(s => {
            const n = (s.nama || "").toLowerCase();
            const nis = String(s.nis || "").toLowerCase();
            const nisn = String(s.nisn || "").toLowerCase();
            return tokens.every(t => n.includes(t) || nis.includes(t) || nisn.includes(t));
        });

        if (match) {
            this.selectTargetStudent(match.id);
        } else {
            App.showToast("Siswa tidak ditemukan.");
        }
    },

    // 2. Pilih Siswa yang Dituju (Menampilkan Kartu Tindakan Siswa)
    selectTargetStudent(studentId, isSilent = false) {
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
        const fallbackAvatar = student.gender === "P" 
            ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" 
            : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80";
        const elFoto = document.getElementById("targetStudentFoto");
        if (elFoto) {
            elFoto.src = student.foto || fallbackAvatar;
            elFoto.onerror = function() { this.src = fallbackAvatar; };
        }

        document.getElementById("targetStudentNama").textContent = student.nama;
        const nisnText = (student.nisn && student.nisn !== "-") ? `NISN: ${student.nisn} • ` : "";
        const jurusanText = (student.jurusan && student.jurusan !== "-") ? ` (${student.jurusan})` : "";
        document.getElementById("targetStudentInfo").textContent = `${nisnText}Kelas: ${student.kelas}${jurusanText}`;
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

        const hpBapakWrap = document.getElementById("targetStudentHpBapakWrap");
        const elHpBapak = document.getElementById("targetStudentHpBapak");
        if (hpBapakWrap) {
            if (student.noHpBapak && student.noHpBapak !== "-") {
                hpBapakWrap.style.display = "inline";
                if (elHpBapak) elHpBapak.textContent = student.noHpBapak;
            } else {
                hpBapakWrap.style.display = "none";
            }
        }

        const elIbu = document.getElementById("targetStudentIbu");
        if (elIbu) elIbu.textContent = student.namaOrtuIbu || "-";

        const hpIbuWrap = document.getElementById("targetStudentHpIbuWrap");
        const elHpIbu = document.getElementById("targetStudentHpIbu");
        if (hpIbuWrap) {
            if (student.noHpIbu && student.noHpIbu !== "-") {
                hpIbuWrap.style.display = "inline";
                if (elHpIbu) elHpIbu.textContent = student.noHpIbu;
            } else {
                hpIbuWrap.style.display = "none";
            }
        }

        const elAlamat = document.getElementById("targetStudentAlamat");
        if (elAlamat) elAlamat.textContent = student.alamat || "-";

        const mapsBtn = document.getElementById("targetStudentMapsLink");
        if (mapsBtn) {
            if (student.mapsAlamat && student.mapsAlamat.trim() && student.mapsAlamat !== "-") {
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

        // KONTROL OTOMATIS SURAT PANGGILAN ORANG TUA (>= 31 Poin)
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

        // Kontrol tombol aksi pada kartu siswa terpilih: Wali Kelas hanya melihat
        const isWaliKelas = AuthManager.isWaliKelas();
        const btnTargetAddVio = document.getElementById("btnTargetAddViolation");
        const btnTargetAddAch = document.getElementById("btnTargetAddAchievement");
        const btnTargetEditStu = document.getElementById("btnTargetEditStudent");
        if (btnTargetAddVio) btnTargetAddVio.style.display = isWaliKelas ? "none" : "inline-flex";
        if (btnTargetAddAch) btnTargetAddAch.style.display = isWaliKelas ? "none" : "inline-flex";
        if (btnTargetEditStu) btnTargetEditStu.style.display = isWaliKelas ? "none" : "inline-flex";

        // Render riwayat pelanggaran & prestasi siswa pada tab kartu
        this.renderTargetStudentRecords(student);

        if (!isSilent) {
            App.showToast(`Siswa terpilih: ${student.nama}`);
        }
    },

    activeTargetTab: 'pelanggaran',

    switchTargetStudentTab(tab) {
        this.activeTargetTab = tab;
        const btnVio = document.getElementById("tabBtnTargetViolations");
        const btnAch = document.getElementById("tabBtnTargetAchievements");
        const paneVio = document.getElementById("targetStudentViolationsPane");
        const paneAch = document.getElementById("targetStudentAchievementsPane");

        if (btnVio) {
            btnVio.classList.toggle("active", tab === 'pelanggaran');
            btnVio.style.borderBottom = tab === 'pelanggaran' ? '2px solid var(--danger)' : '2px solid transparent';
            btnVio.style.color = tab === 'pelanggaran' ? 'var(--danger)' : 'var(--text-muted)';
            btnVio.style.fontWeight = tab === 'pelanggaran' ? '700' : '600';
        }
        if (btnAch) {
            btnAch.classList.toggle("active", tab === 'prestasi');
            btnAch.style.borderBottom = tab === 'prestasi' ? '2px solid var(--success)' : '2px solid transparent';
            btnAch.style.color = tab === 'prestasi' ? 'var(--success)' : 'var(--text-muted)';
            btnAch.style.fontWeight = tab === 'prestasi' ? '700' : '600';
        }
        if (paneVio) paneVio.style.display = tab === 'pelanggaran' ? 'block' : 'none';
        if (paneAch) paneAch.style.display = tab === 'prestasi' ? 'block' : 'none';
    },

    renderTargetStudentRecords(student) {
        if (!student) return;
        const isWaliKelas = AuthManager.isWaliKelas();

        // 1. Render Riwayat Pelanggaran Siswa
        const vContent = document.getElementById("targetStudentViolationsContent");
        const vBadge = document.getElementById("badgeTargetViolCount");
        const viols = student.pelanggaran || [];
        if (vBadge) vBadge.textContent = viols.length;

        if (vContent) {
            if (viols.length === 0) {
                vContent.innerHTML = `
                    <div style="padding: 1.25rem; text-align: center; background: #f0fdf4; border: 1px dashed #86efac; border-radius: 8px; color: #166534; font-size: 0.85rem;">
                        <span style="font-size: 1.3rem; display: block; margin-bottom: 4px;">✨</span>
                        <strong>Catatan Kedisiplinan Bersih (0 Poin)</strong>
                        <p style="margin: 3px 0 0 0; font-size: 0.78rem; color: #15803d;">Siswa ini belum memiliki riwayat pelanggaran tata tertib.</p>
                    </div>
                `;
            } else {
                vContent.innerHTML = `
                    <div class="simple-table-container" style="box-shadow: none; border: 1px solid var(--border); overflow-x: auto;">
                        <table class="simple-table" style="font-size: 0.82rem; margin-bottom: 0;">
                            <thead>
                                <tr style="background: #fef2f2;">
                                    <th width="6%" style="text-align: center;">No</th>
                                    <th width="15%">Tanggal</th>
                                    <th width="32%">Pelanggaran & Kategori</th>
                                    <th width="14%">Bobot Poin</th>
                                    <th width="21%">Sanksi / Pembinaan</th>
                                    <th width="12%" style="text-align: center;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${viols.map((v, idx) => `
                                    <tr>
                                        <td style="text-align: center; font-weight: 600; color: var(--text-muted);">${idx + 1}</td>
                                        <td style="white-space: nowrap; font-family: monospace;">📅 ${v.tanggal || '-'}</td>
                                        <td>
                                            <strong style="color: #991b1b; display: block;">${Forms.escapeHtml(v.nama || '-')}</strong>
                                            <span style="font-size: 0.7rem; color: var(--text-muted);">Kategori: ${Forms.escapeHtml(v.kategori || 'Kedisiplinan')} • Dicatat: ${Forms.escapeHtml(v.pencatat || 'Guru')}</span>
                                        </td>
                                        <td>
                                            <span class="badge" style="background: #fee2e2; color: #991b1b; font-weight: 700; font-size: 0.76rem; padding: 2px 7px; border-radius: 99px;">
                                                +${v.poin || 0} Poin
                                            </span>
                                        </td>
                                        <td style="font-size: 0.76rem; color: #475569;">${Forms.escapeHtml(v.sanksi || '-')}</td>
                                        <td style="text-align: center; white-space: nowrap;">
                                            ${!isWaliKelas ? `
                                            <button type="button" class="btn btn-outline btn-sm" onclick="Forms.openEditStudentViolationModal('${student.id}', '${v.id}')" style="padding: 2px 7px; font-size: 0.72rem; color: #0284c7; border-color: #7dd3fc; background: #f0f9ff; margin-right: 3px;" title="Ubah data pelanggaran ini">
                                                ✏️ Ubah
                                            </button>
                                            <button type="button" class="btn btn-outline btn-sm" onclick="AdminPortal.handleDeleteStudentViolation('${student.id}', '${v.id}', '${Forms.escapeHtml(v.nama || 'Pelanggaran')}')" style="padding: 2px 7px; font-size: 0.72rem; color: #dc2626; border-color: #fca5a5; background: #fef2f2;" title="Hapus catatan pelanggaran ini">
                                                🗑️ Hapus
                                            </button>
                                            ` : `
                                            <span style="font-size: 0.72rem; color: var(--text-muted);">👁️ Terkunci</span>
                                            `}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }

        // 2. Render Riwayat Prestasi Siswa
        const aContent = document.getElementById("targetStudentAchievementsContent");
        const aBadge = document.getElementById("badgeTargetAchCount");
        const achs = student.prestasi || [];
        if (aBadge) aBadge.textContent = achs.length;

        if (aContent) {
            if (achs.length === 0) {
                aContent.innerHTML = `
                    <div style="padding: 1.25rem; text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; color: #64748b; font-size: 0.85rem;">
                        <span style="font-size: 1.3rem; display: block; margin-bottom: 4px;">🏆</span>
                        <strong>Belum Ada Catatan Prestasi</strong>
                        <p style="margin: 3px 0 0 0; font-size: 0.78rem;">Siswa ini belum memiliki catatan kejuaraan atau prestasi yang tercatat.</p>
                    </div>
                `;
            } else {
                aContent.innerHTML = `
                    <div class="simple-table-container" style="box-shadow: none; border: 1px solid var(--border); overflow-x: auto;">
                        <table class="simple-table" style="font-size: 0.82rem; margin-bottom: 0;">
                            <thead>
                                <tr style="background: #f0fdf4;">
                                    <th width="6%" style="text-align: center;">No</th>
                                    <th width="15%">Tanggal</th>
                                    <th width="35%">Nama Kejuaraan & Prestasi</th>
                                    <th width="18%">Tingkat & Penyelenggara</th>
                                    <th width="14%">Piagam / Foto</th>
                                    <th width="12%" style="text-align: center;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${achs.map((p, idx) => `
                                    <tr>
                                        <td style="text-align: center; font-weight: 600; color: var(--text-muted);">${idx + 1}</td>
                                        <td style="white-space: nowrap; font-family: monospace;">📅 ${p.tanggal || '-'}</td>
                                        <td>
                                            <strong style="color: #166534; display: block;">${Forms.escapeHtml(p.nama || '-')}</strong>
                                            <span class="badge" style="background: #dcfce7; color: #166534; font-size: 0.7rem; font-weight: 700; padding: 1px 6px; border-radius: 99px;">
                                                🏆 ${Forms.escapeHtml(p.peringkat || 'Juara')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style="font-weight: 600;">${Forms.escapeHtml(p.tingkat || 'Sekolah')}</div>
                                            <div style="font-size: 0.72rem; color: var(--text-muted);">${Forms.escapeHtml(p.penyelenggara || '-')}</div>
                                        </td>
                                        <td>
                                            <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                                                ${p.piagam ? `<a href="${p.piagam}" target="_blank" class="status-pill pill-yellow" style="font-size: 0.68rem; text-decoration: none; padding: 1px 6px;">📜 Piagam</a>` : ''}
                                                ${p.foto ? `<a href="${p.foto}" target="_blank" class="status-pill pill-blue" style="font-size: 0.68rem; text-decoration: none; padding: 1px 6px;">📸 Foto</a>` : ''}
                                                ${!p.piagam && !p.foto ? '<span style="font-size: 0.7rem; color: var(--text-muted);">-</span>' : ''}
                                            </div>
                                        </td>
                                        <td style="text-align: center; white-space: nowrap;">
                                            ${!isWaliKelas ? `
                                            <button type="button" class="btn btn-outline btn-sm" onclick="AdminPortal.handleDeleteAchievement('${p.id}', '${Forms.escapeHtml(p.nama || 'Prestasi')}')" style="padding: 2px 7px; font-size: 0.72rem; color: #dc2626; border-color: #fca5a5; background: #fef2f2;" title="Hapus catatan prestasi ini">
                                                🗑️ Hapus
                                            </button>
                                            ` : `
                                            <span style="font-size: 0.72rem; color: var(--text-muted);">👁️ Terkunci</span>
                                            `}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
    },

    handleDeleteStudentViolation(studentId, violationId, violationName) {
        if (AuthManager.isWaliKelas()) {
            App.showToast("Wali Kelas hanya memiliki hak akses melihat data.");
            return;
        }
        if (!confirm(`Yakin ingin menghapus catatan pelanggaran "${violationName || 'ini'}"? Poin pelanggaran siswa akan otomatis berkurang.`)) {
            return;
        }
        const success = StorageManager.deleteStudentViolation(studentId, violationId);
        if (success) {
            this.selectTargetStudent(studentId, true);
            this.renderTeacherAllStudents();
            if (typeof this.renderClassAttendance === "function") {
                this.renderClassAttendance();
            }
            App.showToast(`Catatan pelanggaran "${violationName}" berhasil dihapus.`);
        } else {
            App.showToast("Gagal menghapus catatan pelanggaran.");
        }
    },

    // 3. Tombol-Tombol Aksi pada Siswa yang Dituju
    actionAddViolation() {
        if (AuthManager.isWaliKelas()) {
            App.showToast("Akses dibatasi. Wali Kelas hanya memiliki hak akses melihat data siswa.");
            return;
        }
        if (!this.selectedStudent) {
            const students = StorageManager.getStudents();
            if (students.length > 0) this.selectTargetStudent(students[0].id);
        }
        if (!this.selectedStudent) return;
        Forms.openViolationModal(this.selectedStudent.id);
    },

    actionAddAchievement() {
        if (AuthManager.isWaliKelas()) {
            App.showToast("Akses dibatasi. Wali Kelas hanya memiliki hak akses melihat data siswa.");
            return;
        }
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

    topStudentsSort: 'pelanggaran', // 'pelanggaran' | 'prestasi' | 'recorded' | 'top10'
    teacherTableSearchQuery: '',
    teacherTableClassFilter: '',

    setTopStudentsSort(mode) {
        this.topStudentsSort = mode;
        const btnPrestasi = document.getElementById("btnSortPrestasi");
        const btnPelanggaran = document.getElementById("btnSortPelanggaran");
        const btnAll = document.getElementById("btnSortAll");
        const btnTop10 = document.getElementById("btnSortTop10");

        if (btnPelanggaran) btnPelanggaran.classList.toggle("active", mode === 'pelanggaran');
        if (btnPrestasi) btnPrestasi.classList.toggle("active", mode === 'prestasi');
        if (btnAll) btnAll.classList.toggle("active", mode === 'recorded' || mode === 'max');
        if (btnTop10) btnTop10.classList.toggle("active", mode === 'top10');

        this.renderTeacherAllStudents();
    },

    handleTableSearch(val) {
        this.teacherTableSearchQuery = val || '';
        this.renderTeacherAllStudents();
    },

    handleTableClassFilter(val) {
        this.teacherTableClassFilter = val || '';
        this.renderTeacherAllStudents();
    },

    populateTableClassFilter(students) {
        const select = document.getElementById("teacherTableClassFilter");
        if (!select || select.options.length > 1) return;

        const classesSet = new Set();
        (students || []).forEach(s => {
            if (s.kelas) classesSet.add(s.kelas);
        });

        const sortedClasses = Array.from(classesSet).sort((a, b) => {
            return StorageManager.normalizeClassName(a).localeCompare(StorageManager.normalizeClassName(b));
        });

        sortedClasses.forEach(cls => {
            const opt = document.createElement("option");
            opt.value = cls;
            opt.textContent = cls;
            select.appendChild(opt);
        });

        if (AuthManager.isWaliKelas()) {
            const cur = AuthManager.getCurrentUser();
            if (cur && cur.kelas) {
                select.value = cur.kelas;
                this.teacherTableClassFilter = cur.kelas;
            }
        }
    },

    // 4. Render Tabel Siapa Saja Siswa Tercatat Pelanggaran maupun Prestasi
    renderTeacherAllStudents() {
        const tbody = document.getElementById("teacherAllStudentsTableBody");
        if (!tbody) return;

        const students = StorageManager.getStudents() || [];
        const mode = this.topStudentsSort || 'pelanggaran';
        const searchQuery = (this.teacherTableSearchQuery || '').toLowerCase().trim();
        const classFilter = this.teacherTableClassFilter || '';
        const isWaliKelas = AuthManager.isWaliKelas();

        this.populateTableClassFilter(students);

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

        // Hitung status untuk seluruh siswa
        const studentsWithStatus = students.map(s => {
            const st = StorageManager.calculateStudentStatus(s);
            const violPoints = st.totalPoinPelanggaran || 0;
            const violCount = (s.pelanggaran || []).length;
            const achCount = (s.prestasi || []).length;
            return {
                student: s,
                status: st,
                violPoints,
                violCount,
                achCount,
                isRecorded: violPoints > 0 || achCount > 0
            };
        });

        // Hitung total counter global untuk badge tombol filter
        const countViolGlobal = studentsWithStatus.filter(x => x.violPoints > 0).length;
        const countAchGlobal = studentsWithStatus.filter(x => x.achCount > 0).length;
        const countAllGlobal = studentsWithStatus.filter(x => x.isRecorded).length;

        const badgeViol = document.getElementById("countBadgePelanggaran");
        const badgeAch = document.getElementById("countBadgePrestasi");
        const badgeAll = document.getElementById("countBadgeAll");
        if (badgeViol) badgeViol.textContent = countViolGlobal;
        if (badgeAch) badgeAch.textContent = countAchGlobal;
        if (badgeAll) badgeAll.textContent = countAllGlobal;

        // Filter berdasarkan mode tampilan
        let filtered = [];
        if (mode === 'pelanggaran') {
            filtered = studentsWithStatus.filter(x => x.violPoints > 0);
            filtered.sort((a, b) => {
                if (b.violPoints !== a.violPoints) return b.violPoints - a.violPoints;
                return a.student.nama.localeCompare(b.student.nama);
            });
        } else if (mode === 'prestasi') {
            filtered = studentsWithStatus.filter(x => x.achCount > 0);
            filtered.sort((a, b) => {
                if (b.achCount !== a.achCount) return b.achCount - a.achCount;
                if (a.violPoints !== b.violPoints) return a.violPoints - b.violPoints;
                return a.student.nama.localeCompare(b.student.nama);
            });
        } else if (mode === 'recorded' || mode === 'max') {
            filtered = studentsWithStatus.filter(x => x.isRecorded);
            filtered.sort((a, b) => {
                if (b.violPoints !== a.violPoints) return b.violPoints - a.violPoints;
                if (b.achCount !== a.achCount) return b.achCount - a.achCount;
                return a.student.nama.localeCompare(b.student.nama);
            });
        } else {
            // mode 'top10': 10 peringkat teratas
            filtered = [...studentsWithStatus];
            filtered.sort((a, b) => {
                const scoreA = Math.max(a.violPoints, a.achCount);
                const scoreB = Math.max(b.violPoints, b.achCount);
                if (scoreB !== scoreA) return scoreB - scoreA;
                return a.student.nama.localeCompare(b.student.nama);
            });
            filtered = filtered.slice(0, 10);
        }

        // Terapkan filter kelas jika ada
        if (classFilter) {
            filtered = filtered.filter(x => StorageManager.isClassMatch(x.student.kelas, classFilter));
        }

        // Terapkan kata kunci pencarian jika ada
        if (searchQuery) {
            filtered = filtered.filter(x => {
                const s = x.student;
                const nama = (s.nama || '').toLowerCase();
                const nisn = (s.nisn || '').toLowerCase();
                const nis = (s.nis || '').toLowerCase();
                const kelas = (s.kelas || '').toLowerCase();
                return nama.includes(searchQuery) || nisn.includes(searchQuery) || nis.includes(searchQuery) || kelas.includes(searchQuery);
            });
        }

        // Update teks ringkasan & judul
        const summaryEl = document.getElementById("teacherTableStatusSummary");
        if (summaryEl) {
            summaryEl.innerHTML = `Menampilkan <strong>${filtered.length}</strong> siswa tercatat`;
        }

        const titleEl = document.getElementById("topStudentsTitle");
        const iconEl = document.getElementById("topStudentsBadgeIcon");
        if (titleEl) {
            if (mode === 'pelanggaran') {
                titleEl.textContent = `⚠️ Siswa Tercatat Pelanggaran (${filtered.length} Siswa)`;
                if (iconEl) iconEl.textContent = "⚠️";
            } else if (mode === 'prestasi') {
                titleEl.textContent = `🏆 Siswa Tercatat Prestasi (${filtered.length} Siswa)`;
                if (iconEl) iconEl.textContent = "🏆";
            } else if (mode === 'recorded' || mode === 'max') {
                titleEl.textContent = `👥 Seluruh Siswa Tercatat Pelanggaran & Prestasi (${filtered.length} Siswa)`;
                if (iconEl) iconEl.textContent = "👥";
            } else {
                titleEl.textContent = "🌟 10 Siswa Peringkat Teratas";
                if (iconEl) iconEl.textContent = "🌟";
            }
        }

        // Tampilan kosong jika tidak ada data yang cocok
        if (filtered.length === 0) {
            let emptyTitle = "Belum Ada Siswa yang Tercatat";
            let emptyDesc = "Seluruh data siswa dalam kondisi bersih (0 poin). Setiap perubahan atau pencatatan pelanggaran/prestasi oleh guru akan langsung muncul di sini secara otomatis.";
            let emptyIcon = "🌱";

            if (searchQuery || classFilter) {
                emptyTitle = "Tidak Ada Data Siswa yang Sesuai";
                emptyDesc = "Coba ubah kata kunci pencarian atau sesuaikan pilihan filter kelas di atas.";
                emptyIcon = "🔍";
            } else if (mode === 'pelanggaran') {
                emptyTitle = "Seluruh Siswa Berstatus Bersih (0 Poin Pelanggaran)";
                emptyDesc = "Tidak ada siswa yang tercatat melakukan pelanggaran pada periode ini. Saat guru mencatat pelanggaran di presensi atau tindakan siswa, daftar ini akan langsung terisi.";
                emptyIcon = "🛡️";
            } else if (mode === 'prestasi') {
                emptyTitle = "Belum Ada Catatan Prestasi Siswa";
                emptyDesc = "Belum ada torehan kejuaraan/prestasi yang tercatat. Klik '+ Catat Prestasi Baru' untuk menambahkan torehan prestasi siswa.";
                emptyIcon = "🏆";
            }

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2.8rem 1.5rem; color: var(--text-muted); background: #fafafa;">
                        <div style="font-size: 2.2rem; margin-bottom: 0.6rem;">${emptyIcon}</div>
                        <strong style="color: var(--text-main); font-size: 1.05rem; display: block; margin-bottom: 6px;">${emptyTitle}</strong>
                        <p style="font-size: 0.85rem; max-width: 540px; margin: 0 auto 16px auto; line-height: 1.5;">${emptyDesc}</p>
                        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                            <button type="button" class="btn btn-outline btn-sm" onclick="Forms.openManageStudentsModal()">
                                👥 Buka Seluruh Data 2.107 Siswa
                            </button>
                            ${!isWaliKelas ? `
                            <button type="button" class="btn btn-danger btn-sm" onclick="Forms.openViolationModal()">
                                ⚠️ + Catat Pelanggaran
                            </button>
                            <button type="button" class="btn btn-success btn-sm" onclick="Forms.openAchievementModal()">
                                🏆 + Catat Prestasi
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map((item, idx) => {
            const s = item.student;
            const st = item.status;
            const isSelected = this.selectedStudent && this.selectedStudent.id === s.id;
            const isSp = StorageManager.isStudentEligibleForSummons(s);

            let rankBadge = '';
            if (idx === 0 && (item.violPoints > 0 || item.achCount > 0)) {
                rankBadge = `<span class="rank-badge rank-1" title="Peringkat 1">🥇 1</span>`;
            } else if (idx === 1 && (item.violPoints > 0 || item.achCount > 0)) {
                rankBadge = `<span class="rank-badge rank-2" title="Peringkat 2">🥈 2</span>`;
            } else if (idx === 2 && (item.violPoints > 0 || item.achCount > 0)) {
                rankBadge = `<span class="rank-badge rank-3" title="Peringkat 3">🥉 3</span>`;
            } else {
                rankBadge = `<span class="rank-badge rank-other">${idx + 1}</span>`;
            }

            // Pelanggaran summary
            let violSummaryHtml = '';
            if (item.violPoints > 0) {
                const recentViols = (s.pelanggaran || []).slice(0, 2).map(v => 
                    `<span style="display: inline-block; background: #fee2e2; color: #991b1b; font-size: 0.68rem; font-weight: 600; padding: 1px 6px; border-radius: 4px; margin-top: 2px; margin-right: 3px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${Forms.escapeHtml(v.nama)} (${v.poin} Poin)">${Forms.escapeHtml(v.nama)} (+${v.poin})</span>`
                ).join('');
                violSummaryHtml = `
                    <div>
                        <strong style="color: var(--danger); font-size: 0.95rem;">${item.violPoints} Poin</strong>
                        <span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 4px;">(${item.violCount} Kasus)</span>
                    </div>
                    <div style="line-height: 1.2;">${recentViols}${(s.pelanggaran || []).length > 2 ? `<span style="font-size: 0.65rem; color: var(--text-muted);">+${(s.pelanggaran || []).length - 2} lainnya</span>` : ''}</div>
                `;
            } else {
                violSummaryHtml = `<span style="color: #16a34a; font-size: 0.8rem; font-weight: 600;">✨ 0 Poin</span>`;
            }

            // Prestasi summary
            let achSummaryHtml = '';
            if (item.achCount > 0) {
                const recentAch = (s.prestasi || []).slice(0, 1).map(p => 
                    `<div style="font-size: 0.72rem; color: #15803d; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;" title="${Forms.escapeHtml(p.peringkat || '')} ${Forms.escapeHtml(p.nama || '')}">🏆 ${Forms.escapeHtml(p.peringkat || 'Juara')} - ${Forms.escapeHtml(p.nama || '')}</div>`
                ).join('');
                achSummaryHtml = `
                    <div>
                        <strong style="color: var(--success); font-size: 0.95rem;">${item.achCount} Prestasi</strong>
                    </div>
                    ${recentAch}
                `;
            } else {
                achSummaryHtml = `<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>`;
            }

            return `
                <tr style="${isSelected ? 'background: #eff6ff; font-weight: 600;' : ''}">
                    <td style="text-align: center;">${rankBadge}</td>
                    <td>
                        <div style="font-weight: 700; color: var(--text-main); font-size: 0.92rem;">${Forms.escapeHtml(s.nama)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">
                            ${(s.nisn || s.nis) ? `NISN: ${Forms.escapeHtml(s.nisn || '-')}${s.nis ? ' • NIS: ' + Forms.escapeHtml(s.nis) : ''}` : `Kelas: ${Forms.escapeHtml(s.kelas)}`}
                        </div>
                        ${isSp ? `<span class="status-pill pill-red" style="font-size: 0.65rem; padding: 1px 6px; margin-top: 2px;">⚠️ ${st.statusText}</span>` : ''}
                    </td>
                    <td>
                        <span class="status-pill pill-gray" style="font-weight: 700;">${Forms.escapeHtml(s.kelas)}</span>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${Forms.escapeHtml(s.waliKelas || '-')}</div>
                    </td>
                    <td>${violSummaryHtml}</td>
                    <td>${achSummaryHtml}</td>
                    <td>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button class="btn ${isSelected ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="AdminPortal.selectTargetStudent('${s.id}')" style="padding: 3px 8px; font-size: 0.75rem;">
                                ${isSelected ? '✓ Terpilih' : '👉 Pilih'}
                            </button>
                            ${!isWaliKelas ? `
                            <button class="btn btn-danger btn-sm" onclick="Forms.openViolationModal('${s.id}')" style="padding: 3px 8px; font-size: 0.75rem;" title="Catat Pelanggaran Siswa Ini">
                                ⚠️ + Pelanggaran
                            </button>
                            <button class="btn btn-success btn-sm" onclick="Forms.openAchievementModal('${s.id}')" style="padding: 3px 8px; font-size: 0.75rem;" title="Catat Prestasi Siswa Ini">
                                🏆 + Prestasi
                            </button>
                            ${isSp ? `
                                <button class="btn btn-warning btn-sm" onclick="Forms.openSuratPanggilanModal('${s.id}')" style="padding: 3px 8px; font-size: 0.75rem;" title="Cetak Surat Panggilan SP (${st.statusText})">
                                    📄 Surat SP
                                </button>
                            ` : ''}
                            ` : ''}
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

        if (window.InstagramSync && typeof InstagramSync.updateUI === "function") {
            InstagramSync.updateUI();
        }

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
                if (this.selectedStudent) {
                    this.selectTargetStudent(this.selectedStudent.id, true);
                }
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

        if (window.InstagramSync && typeof InstagramSync.updateUI === "function") {
            InstagramSync.updateUI();
        }

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
        if (!dateStr) dateStr = this.currentAttendanceDate || this.getTodayDate();
        const dayOfWeek = this.getDayOfWeek(dateStr); // 0: Minggu, 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat, 6: Sabtu
        const schedule = StorageManager.getAttendanceSchedule();

        // 1. Hari Senin: otomatis ada tambahan tulisan upacara -> "SENIN UPACARA"
        if (dayOfWeek === 1) {
            if (schedule && schedule[1] && schedule[1].aktif !== false && schedule[1].kode) {
                return schedule[1].kode;
            }
            return "SENIN UPACARA";
        }

        // 2. Hari Rabu: otomatis -> "RABU SENAM"
        if (dayOfWeek === 3) {
            if (schedule && schedule[3] && schedule[3].aktif !== false && schedule[3].kode) {
                return schedule[3].kode;
            }
            return "RABU SENAM";
        }

        // 3. Hari Jum'at: otomatis -> "JUM'AT SENAM"
        if (dayOfWeek === 5) {
            if (schedule && schedule[5] && schedule[5].aktif !== false && schedule[5].kode && schedule[5].kode !== "JUMAT SENAM") {
                return schedule[5].kode;
            }
            return "JUM'AT SENAM";
        }

        // 4. Selebihnya tulisan hari biasa sesuai nama harinya: "SELASA", "KAMIS", "SABTU", "MINGGU"
        if (schedule && schedule[dayOfWeek] && schedule[dayOfWeek].aktif && schedule[dayOfWeek].kode) {
            return schedule[dayOfWeek].kode;
        }

        const defaultDayLabels = {
            2: "SELASA",
            4: "KAMIS",
            6: "SABTU",
            0: "MINGGU"
        };

        return defaultDayLabels[dayOfWeek] || "SENIN UPACARA";
    },

    populateAttendanceClassOptions() {
        const select = document.getElementById("attFilterKelas");
        const selectWrap = document.getElementById("attFilterKelasWrap");
        const waliIndicator = document.getElementById("attWaliKelasIndicator");
        const waliBadgeText = document.getElementById("attWaliKelasBadgeText");

        const currentUser = AuthManager.getCurrentUser();
        const isSuperAdmin = AuthManager.isSuperAdmin();
        const hasAssignedClass = currentUser && currentUser.kelas && currentUser.kelas !== "-";
        const isWaliKelas = !isSuperAdmin && hasAssignedClass;

        if (isWaliKelas) {
            // Otomatiskan ke kelas wali kelas yang diampu dan hilangkan dropdown pilihan kelas
            this.currentAttendanceClass = currentUser.kelas;
            if (selectWrap) selectWrap.style.display = "none";
            if (waliIndicator) {
                waliIndicator.style.display = "flex";
                if (waliBadgeText) waliBadgeText.textContent = currentUser.kelas;
            }
            return;
        }

        // Tampilkan dropdown kelas untuk Super Admin & Guru Kesiswaan umum
        if (selectWrap) selectWrap.style.display = "flex";
        if (waliIndicator) waliIndicator.style.display = "none";

        if (!select) return;
        select.disabled = false;

        const classes = (typeof DAFTAR_WALI_KELAS_MASTER !== 'undefined')
            ? DAFTAR_WALI_KELAS_MASTER.map(w => w.kode)
            : ["X TKP", "X DPIB", "XI BA", "XII BA"];

        const uniqueClasses = Array.from(new Set(classes));

        select.innerHTML = uniqueClasses.map(cls => {
            const selected = cls === this.currentAttendanceClass ? 'selected' : '';
            return `<option value="${cls}" ${selected}>${cls}</option>`;
        }).join('');
    },

    handleAttendanceDateChange(val) {
        if (!val) return;
        this.currentAttendanceDate = val;
        this._attendanceDirty = false;
        this.updateAttendanceDayDisplay(val);
        this.renderClassAttendance();
    },

    handleAttendanceClassChange(val) {
        if (!val) return;
        this.currentAttendanceClass = val;
        this._attendanceDirty = false;
        this.renderClassAttendance();
    },

    syncCurrentClassStudents() {
        if (!this.currentAttendanceClass) return;
        let students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);
        if (!students || students.length === 0) {
            StorageManager.syncAllStudentsMaster(true);
            students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);
        }
        this.renderClassAttendance();
        if (students && students.length > 0) {
            App.showToast(`✅ Berhasil menyinkronkan ${students.length} siswa untuk kelas ${this.currentAttendanceClass}!`);
            if (typeof SyncManager !== "undefined") {
                SyncManager.broadcast("STUDENTS_UPDATED");
            }
        } else {
            App.showToast(`Data siswa untuk kelas ${this.currentAttendanceClass} tidak ditemukan.`);
        }
    },

    renderClassAttendance() {
        const tbody = document.getElementById("attTableBody");
        if (!tbody) return;

        const currentUser = AuthManager.getCurrentUser();
        const isSuperAdmin = AuthManager.isSuperAdmin();
        const hasAssignedClass = currentUser && currentUser.kelas && currentUser.kelas !== "-";
        const isWaliKelas = !isSuperAdmin && hasAssignedClass;

        // Otomatiskan ke kelas yang diampu wali kelas
        if (isWaliKelas) {
            this.currentAttendanceClass = currentUser.kelas;
        } else if (!this.currentAttendanceClass) {
            this.currentAttendanceClass = hasAssignedClass ? currentUser.kelas : "X TKP";
        }

        // Tampilkan / sembunyikan kontrol kelas sesuai hak akses
        this.populateAttendanceClassOptions();

        // Otomatiskan tanggal presensi sesuai hari lokal saat ini jika belum ditentukan
        if (!this.currentAttendanceDate) {
            this.currentAttendanceDate = this.getTodayDate();
        }

        const dateInput = document.getElementById("attFilterTanggal");
        if (dateInput && dateInput.value !== this.currentAttendanceDate) {
            dateInput.value = this.currentAttendanceDate;
        }

        const classSelect = document.getElementById("attFilterKelas");
        if (classSelect && classSelect.value !== this.currentAttendanceClass) {
            classSelect.value = this.currentAttendanceClass;
        }

        const dayOfWeek = this.getDayOfWeek(this.currentAttendanceDate);
        this.updateAttendanceDayDisplay(this.currentAttendanceDate);

        const isRambutActive = StorageManager.isRambutChecklistActive(this.currentAttendanceDate);
        const isNoRambut = !isRambutActive; // Default hanya keluar pada Senin Minggu Pertama atau jika diatur aktif oleh Super Admin
        this.updateRambutToggleButton();

        const bannerText = this.getHariKegiatanText(this.currentAttendanceDate);
        const tableBanner = document.getElementById("attTableActivityBanner");
        if (tableBanner) {
            tableBanner.textContent = bannerText;
            tableBanner.colSpan = isNoRambut ? 4 : 5;
        }

        const thRambut = document.getElementById("attColHeaderRambut");
        if (thRambut) {
            thRambut.style.display = isNoRambut ? "none" : "";
        }

        const ruleRambut = document.getElementById("attRuleRambutText");
        if (ruleRambut) {
            ruleRambut.innerHTML = isNoRambut
                ? "• <strong>Make up</strong>: Otomatis masuk pelanggaran <em>Make up</em> (+10 Poin)."
                : "• <strong>Rambut / Make up</strong>: Otomatis masuk pelanggaran <em>Rambut/Make up</em> (+10 Poin).";
        }

        // Pastikan siswa untuk kelas target sudah disiapkan dan diambil
        let students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);
        if (students.length === 0 && typeof MASTER_STUDENTS_LIST !== 'undefined') {
            StorageManager.syncAllStudentsMaster(true);
            students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);
        }

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
                    <td colspan="${isNoRambut ? 6 : 7}" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
                        Belum ada data siswa terdaftar untuk kelas <strong>${this.currentAttendanceClass}</strong>.<br>
                        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                            <button type="button" class="btn btn-primary btn-sm" onclick="AdminPortal.syncCurrentClassStudents()">
                                🔄 Sinkronkan Siswa Kelas Ini
                            </button>
                            ${AuthManager.isSuperAdmin() ? '<button type="button" class="btn btn-outline btn-sm" onclick="Forms.handleSyncAllStudents()">🔄 Sinkronkan 60 Kelas (Super Admin)</button>' : ''}
                        </div>
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

            const rambutTd = isNoRambut ? '' : `
                <td style="padding: 4px; border-right: 1px solid #e2e8f0; vertical-align: middle;">
                    <input type="checkbox" class="att-checkbox-custom" ${rec.rambut ? 'checked' : ''} onchange="AdminPortal.handleViolationCheckbox('${s.id}', 'rambut', this.checked)" title="Rambut panjang/dicat">
                </td>
            `;

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
                    ${rambutTd}
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

        // Perbarui status tombol simpan (Merah jika belum disimpan / ada perubahan, Hijau jika sudah tersimpan)
        if (this._attendanceDirty) {
            this.updateSaveButtonUI('unsaved', attData ? (attData.savedAt || attData.updatedAt) : null);
        } else if (attData && attData.isSaved) {
            this.updateSaveButtonUI('saved', attData.savedAt || attData.updatedAt);
        } else {
            this.updateSaveButtonUI('unsaved', attData ? (attData.savedAt || attData.updatedAt) : null);
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

            // Catat pelanggaran Alpha: 15 poin
            if (!currentRec.violations.alphaId) {
                const viol = StorageManager.addStudentViolation(studentId, {
                    nama: "Tidak masuk tanpa keterangan/Alpha baik pelajaran/upacara/senam",
                    kategori: "Kedisiplinan",
                    poin: 15,
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

        this._attendanceDirty = true;
        attData.isSaved = false;
        attData.records[studentId] = currentRec;
        StorageManager.saveClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate, attData);
        this.renderClassAttendance();
        this.renderTeacherAllStudents();
        if (this.selectedStudent && this.selectedStudent.id === studentId) {
            this.selectTargetStudent(studentId, true);
        }
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
            // Tambahkan pelanggaran Alpha jika belum ada (15 poin)
            if (!currentRec.violations.alphaId) {
                const viol = StorageManager.addStudentViolation(studentId, {
                    nama: "Tidak masuk tanpa keterangan/Alpha baik pelajaran/upacara/senam",
                    kategori: "Kedisiplinan",
                    poin: 15,
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

        this._attendanceDirty = true;
        attData.isSaved = false;
        attData.records[studentId] = currentRec;
        StorageManager.saveClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate, attData);
        this.renderClassAttendance();
        this.renderTeacherAllStudents();
        if (this.selectedStudent && this.selectedStudent.id === studentId) {
            this.selectTargetStudent(studentId, true);
        }
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
            let poinViol = 10;
            let sanksiViol = "";

            if (field === 'rambut' || field === 'makeup') {
                namaViol = "Rambut panjang (untuk putra)/dicat (untuk putra&putri)/make up berlebih";
                poinViol = 10;
                sanksiViol = field === 'rambut' 
                    ? "Peringatan lisan & potong/rapikan rambut sesuai ketentuan" 
                    : "Peringatan & pembersihan riasan make up berlebih";
            } else if (field === 'atribut' || field === 'seragam') {
                namaViol = "Atribut seragam tidak lengkap/tidak benar";
                poinViol = 10;
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

        this._attendanceDirty = true;
        attData.isSaved = false;
        attData.records[studentId] = currentRec;
        StorageManager.saveClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate, attData);
        this.renderClassAttendance();
        this.renderTeacherAllStudents();
        if (this.selectedStudent && this.selectedStudent.id === studentId) {
            this.selectTargetStudent(studentId, true);
        }
    },

    markAllStudentsPresent() {
        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate) || {
            records: {},
            kegiatan: this.getHariKegiatanText(this.currentAttendanceDate)
        };
        if (!attData.records) attData.records = {};

        const students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);

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

        this._attendanceDirty = true;
        attData.isSaved = false;
        StorageManager.saveClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate, attData);
        this.renderClassAttendance();
        this.renderTeacherAllStudents();
        if (this.selectedStudent) {
            this.selectTargetStudent(this.selectedStudent.id, true);
        }
        App.showToast(`Seluruh siswa kelas ${this.currentAttendanceClass} berhasil ditandai Hadir! Klik tombol SIMPAN untuk menyimpan data.`);
    },

    // SIMPAN RESMI PRESENSI KELAS (DENGAN FEEDBACK TOMBOL MERAH -> HIJAU)
    saveCurrentAttendance() {
        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate) || {
            records: {},
            kegiatan: this.getHariKegiatanText(this.currentAttendanceDate)
        };
        if (!attData.records) attData.records = {};

        const students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);
        students.forEach(s => {
            if (!attData.records[s.id]) {
                attData.records[s.id] = {
                    status: 'alpha',
                    rambut: false,
                    atribut: false,
                    makeup: false,
                    seragam: false,
                    violations: {}
                };
            }
        });

        const nowIso = new Date().toISOString();
        attData.isSaved = true;
        attData.savedAt = nowIso;
        attData.updatedAt = nowIso;
        attData.kegiatan = this.getHariKegiatanText(this.currentAttendanceDate);

        StorageManager.saveClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate, attData);
        this._attendanceDirty = false;
        this.attendanceSaveState = 'saved';
        this.attendanceSavedAt = nowIso;

        // Perbarui tampilan tombol jadi HIJAU
        this.updateSaveButtonUI('saved', nowIso);

        // Mainkan audio chime konfirmasi
        this.playSaveSound();

        // Haptic feedback untuk perangkat sentuh
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(40); } catch(e) {}
        }

        App.showToast(`✅ Data presensi kelas ${this.currentAttendanceClass} tanggal ${this.currentAttendanceDate} berhasil disimpan!`);
    },

    updateSaveButtonUI(state, isoTimestamp) {
        const btnLarge = document.getElementById("btnSaveAttendanceLarge");
        const iconWrap = document.getElementById("attSaveLargeIcon");
        const titleEl = document.getElementById("attSaveLargeTitle");
        const subEl = document.getElementById("attSaveLargeSub");
        const statusBadge = document.getElementById("attSaveStatusBadge");
        const statusText = document.getElementById("attSaveStatusText");
        const timestampText = document.getElementById("attSaveTimestampText");

        const btnHeader = document.getElementById("btnSaveAttendanceHeader");
        const headerIcon = document.getElementById("attSaveHeaderIcon");
        const headerTitle = document.getElementById("attSaveHeaderTitle");

        const timeStr = this.formatSavedTimestamp(isoTimestamp);

        if (state === 'saved') {
            this.attendanceSaveState = 'saved';

            if (btnLarge) {
                btnLarge.className = "att-save-btn att-save-btn-saved att-save-pop";
                setTimeout(() => {
                    if (btnLarge) btnLarge.classList.remove('att-save-pop');
                }, 400);
            }
            if (iconWrap) {
                iconWrap.innerHTML = `
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
            }
            if (titleEl) titleEl.textContent = "PRESENSI BERHASIL DISIMPAN";
            if (subEl) subEl.textContent = `Tersimpan aman pada ${timeStr} • Siap diekspor atau dicetak`;

            if (statusBadge) {
                statusBadge.className = "att-save-status-badge badge-saved";
            }
            if (statusText) statusText.textContent = "Data Tersimpan & Tersinkron";
            if (timestampText) timestampText.innerHTML = `Terakhir disimpan: <strong>${timeStr}</strong>`;

            if (btnHeader) {
                btnHeader.className = "btn-save-header att-header-saved";
            }
            if (headerIcon) headerIcon.textContent = "✅";
            if (headerTitle) headerTitle.textContent = "Tersimpan";
        } else {
            this.attendanceSaveState = 'unsaved';

            if (btnLarge) {
                btnLarge.className = "att-save-btn att-save-btn-unsaved";
            }
            if (iconWrap) {
                iconWrap.innerHTML = `
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                `;
            }
            if (titleEl) titleEl.textContent = "SIMPAN PRESENSI KELAS";
            if (subEl) subEl.textContent = "Klik setelah selesai mengisi untuk menyimpan data presensi";

            if (statusBadge) {
                statusBadge.className = "att-save-status-badge badge-unsaved";
            }
            if (statusText) statusText.textContent = "Ada perubahan belum disimpan";
            if (timestampText) {
                timestampText.innerHTML = (isoTimestamp && isoTimestamp !== "null")
                    ? `Terakhir disimpan: <strong>${timeStr}</strong> (ada perubahan)`
                    : `Terakhir disimpan: <em>Belum disimpan</em>`;
            }

            if (btnHeader) {
                btnHeader.className = "btn-save-header att-header-unsaved";
            }
            if (headerIcon) headerIcon.textContent = "💾";
            if (headerTitle) headerTitle.textContent = "Simpan Presensi";
        }
    },

    formatSavedTimestamp(isoStr) {
        if (!isoStr || isoStr === "null") return "Belum disimpan";
        try {
            const d = new Date(isoStr);
            if (isNaN(d.getTime())) return "Belum disimpan";
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            const s = String(d.getSeconds()).padStart(2, '0');
            return `${h}:${m}:${s} WIB`;
        } catch (e) {
            return "Tersimpan";
        }
    },

    playSaveSound() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch (e) {}
    },

    updateRambutToggleButton() {
        const btn = document.getElementById("btnToggleRambutSuperAdmin");
        if (!btn) return;

        const isSuperAdmin = AuthManager.isSuperAdmin();
        const isAdminKesiswaan = AuthManager.isAdminKesiswaan();
        if (!isSuperAdmin && !isAdminKesiswaan) {
            btn.style.display = "none";
            return;
        }

        btn.style.display = "inline-flex";
        const date = this.currentAttendanceDate || this.getTodayDate();
        const isActive = StorageManager.isRambutChecklistActive(date);
        const isFirstMonday = StorageManager.isFirstMondayOfMonth(date);
        const settings = StorageManager.getAttendanceSettings();
        const isOverridden = settings.rambutOverrides && typeof settings.rambutOverrides[date] === "boolean";

        if (isActive) {
            btn.style.background = "#f0fdf4";
            btn.style.borderColor = "#86efac";
            btn.style.color = "#15803d";
            btn.innerHTML = `💇 Cek Rambut: <strong>Aktif</strong>${isOverridden ? ' ⚡' : (isFirstMonday ? ' (Senin Ke-1)' : '')}`;
            btn.title = `Cek list rambut AKTIF untuk tanggal ${date}. Klik untuk menonaktifkan.`;
        } else {
            btn.style.background = "#ffffff";
            btn.style.borderColor = "#cbd5e1";
            btn.style.color = "#64748b";
            btn.innerHTML = `💇 Cek Rambut: <strong>Nonaktif</strong>${isOverridden ? ' ⚡' : ''}`;
            btn.title = `Cek list rambut NONAKTIF untuk tanggal ${date} (Hanya aktif otomatis pada Senin Minggu Pertama). Klik untuk mengaktifkan.`;
        }
    },

    quickToggleRambutSuperAdmin() {
        if (!AuthManager.isSuperAdmin() && !AuthManager.isAdminKesiswaan()) {
            App.showToast("Hanya Super Admin yang dapat mengubah instrumen cek list rambut.");
            return;
        }
        const date = this.currentAttendanceDate || this.getTodayDate();
        const isCurrentlyActive = StorageManager.isRambutChecklistActive(date);
        const newActive = !isCurrentlyActive;
        StorageManager.setRambutOverrideForDate(date, newActive);
        this.renderClassAttendance();
        this.updateRambutToggleButton();
        App.showToast(newActive 
            ? `💇 Cek List Rambut berhasil DITAMBAHKAN (Aktif) untuk tanggal ${date}` 
            : `💇 Cek List Rambut berhasil DIHAPUS (Nonaktif) untuk tanggal ${date}`);
    },

    exportAttendanceToExcel() {
        const students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);
        students.sort((a, b) => (a.no || 0) - (b.no || 0));

        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate);
        const records = (attData && attData.records) ? attData.records : {};
        const bannerText = this.getHariKegiatanText(this.currentAttendanceDate);
        const dayOfWeek = this.getDayOfWeek(this.currentAttendanceDate);
        const isNoRambut = !StorageManager.isRambutChecklistActive(this.currentAttendanceDate);

        const exportData = students.map((s, idx) => {
            const rec = records[s.id] || { status: 'alpha', rambut: false, atribut: false, makeup: false, seragam: false };
            const statusUpper = (rec.status || 'alpha').toUpperCase();
            const row = {
                "No": s.no || (idx + 1),
                "Nama Siswa": s.nama,
                "Kelas": s.kelas,
                "Tanggal": this.currentAttendanceDate,
                "Kegiatan": bannerText,
                "Kehadiran": statusUpper
            };
            if (!isNoRambut) {
                row["Rambut (10 Poin)"] = rec.rambut ? "Melanggar" : "Rapi";
            }
            row["Atribut (10 Poin)"] = rec.atribut ? "Melanggar" : "Lengkap";
            row["Make up (10 Poin)"] = rec.makeup ? "Melanggar" : "Rapi";
            row["Seragam (10 Poin)"] = rec.seragam ? "Melanggar" : "Rapi";
            return row;
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
        const students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);
        students.sort((a, b) => (a.no || 0) - (b.no || 0));

        const attData = StorageManager.getClassAttendance(this.currentAttendanceClass, this.currentAttendanceDate);
        const records = (attData && attData.records) ? attData.records : {};
        const bannerText = this.getHariKegiatanText(this.currentAttendanceDate);
        const dayOfWeek = this.getDayOfWeek(this.currentAttendanceDate);
        const isNoRambut = !StorageManager.isRambutChecklistActive(this.currentAttendanceDate);

        const template = StorageManager.getSuratTemplate();
        const config = StorageManager.getConfig();
        const wakaNama = config.headOfStudentAffairs || template.pejabatNama || 'Morlan Purba Sibarani, S.Pd., M.Si.';
        const wakaJabatan = template.pejabatJabatan || 'Waka Kesiswaan SMKN 1 Magelang';
        let wakaNip = config.headOfStudentAffairsNip || template.pejabatNip || 'NIP. 19740315 200501 1 004';
        if (wakaNip && !wakaNip.toUpperCase().startsWith('NIP')) {
            wakaNip = `NIP. ${wakaNip}`;
        }

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
                    ${!isNoRambut ? `<td style="border: 1px solid #000; text-align: center; padding: 4px;">${rec.rambut ? '✓' : ''}</td>` : ''}
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
                            <th colspan="${isNoRambut ? 4 : 5}" style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #eee; text-transform: uppercase;">
                                ${bannerText}
                            </th>
                        </tr>
                        <tr>
                            <th style="border: 1px solid #000; width: 90px; padding: 6px;">Kehadiran</th>
                            ${!isNoRambut ? '<th style="border: 1px solid #000; width: 60px; padding: 6px;">Rambut</th>' : ''}
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
                    <div style="text-align: center; width: 250px;">
                        <br>
                        ${wakaJabatan}
                        <br><br><br><br>
                        <strong>${wakaNama}</strong><br>
                        ${wakaNip}
                    </div>
                    <div style="text-align: center; width: 250px;">
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

    // =========================================================================
    // FITUR: REKAP RIWAYAT SEBELUMNYA (PRESENSI & KEDISIPLINAN KELAS)
    // =========================================================================
    populateRekapClassOptions() {
        const selectWrap = document.getElementById("rekapFilterKelasWrap");
        const select = document.getElementById("rekapFilterKelas");
        const waliIndicator = document.getElementById("rekapWaliKelasIndicator");
        const waliBadgeText = document.getElementById("rekapWaliKelasBadgeText");

        const currentUser = AuthManager.getCurrentUser();
        const isSuperAdmin = AuthManager.isSuperAdmin();
        const hasAssignedClass = currentUser && currentUser.kelas && currentUser.kelas !== "-";
        const isWaliKelas = !isSuperAdmin && hasAssignedClass;

        if (isWaliKelas) {
            this.currentAttendanceClass = currentUser.kelas;
            if (selectWrap) selectWrap.style.display = "none";
            if (waliIndicator) {
                waliIndicator.style.display = "flex";
                if (waliBadgeText) waliBadgeText.textContent = currentUser.kelas;
            }
            return;
        }

        if (selectWrap) selectWrap.style.display = "flex";
        if (waliIndicator) waliIndicator.style.display = "none";
        if (!select) return;

        const classes = (typeof DAFTAR_WALI_KELAS_MASTER !== 'undefined')
            ? DAFTAR_WALI_KELAS_MASTER.map(w => w.kode)
            : ["X TKP", "X DPIB", "XI BA", "XII BA"];

        const uniqueClasses = Array.from(new Set(classes));
        select.innerHTML = uniqueClasses.map(cls => {
            const selected = cls === this.currentAttendanceClass ? 'selected' : '';
            return `<option value="${cls}" ${selected}>${cls}</option>`;
        }).join('');
    },

    handleRekapClassChange(val) {
        if (!val) return;
        this.currentAttendanceClass = val;
        const attSelect = document.getElementById("attFilterKelas");
        if (attSelect) attSelect.value = val;
        this.renderAttendanceHistory();
    },

    handleRekapMonthChange(val) {
        this.currentRekapFilterMonth = val || '';
        this.renderAttendanceHistory();
    },

    switchRekapView(view) {
        this.currentRekapView = view;
        const btnSiswa = document.getElementById("rekapViewBtnSiswa");
        const btnHarian = document.getElementById("rekapViewBtnHarian");
        if (btnSiswa && btnHarian) {
            if (view === 'siswa') {
                btnSiswa.style.background = "#ffffff";
                btnSiswa.style.color = "var(--primary)";
                btnSiswa.style.boxShadow = "0 1px 2px rgba(0,0,0,0.08)";
                btnHarian.style.background = "transparent";
                btnHarian.style.color = "var(--text-muted)";
                btnHarian.style.boxShadow = "none";
            } else {
                btnHarian.style.background = "#ffffff";
                btnHarian.style.color = "var(--primary)";
                btnHarian.style.boxShadow = "0 1px 2px rgba(0,0,0,0.08)";
                btnSiswa.style.background = "transparent";
                btnSiswa.style.color = "var(--text-muted)";
                btnSiswa.style.boxShadow = "none";
            }
        }
        this.renderAttendanceHistoryTable();
    },

    renderAttendanceHistory() {
        const currentUser = AuthManager.getCurrentUser();
        const isSuperAdmin = AuthManager.isSuperAdmin();
        const hasAssignedClass = currentUser && currentUser.kelas && currentUser.kelas !== "-";
        const isWaliKelas = !isSuperAdmin && hasAssignedClass;

        if (isWaliKelas) {
            this.currentAttendanceClass = currentUser.kelas;
        } else if (!this.currentAttendanceClass) {
            this.currentAttendanceClass = hasAssignedClass ? currentUser.kelas : "X TKP";
        }

        this.populateRekapClassOptions();

        // Pastikan siswa untuk kelas target siap
        const students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);
        students.sort((a, b) => (a.no || 0) - (b.no || 0));

        let sessions = StorageManager.getAllClassAttendances(this.currentAttendanceClass);
        if (this.currentRekapFilterMonth) {
            sessions = sessions.filter(s => {
                if (!s.tanggal) return false;
                const m = s.tanggal.split('-')[1];
                return m === this.currentRekapFilterMonth;
            });
        }

        const totalSesi = sessions.length;
        let totalHadir = 0, totalIzin = 0, totalSakit = 0, totalAlpha = 0;
        let totalPelanggaran = 0;

        sessions.forEach(sess => {
            const records = sess.records || {};
            students.forEach(s => {
                const rec = records[s.id] || { status: 'alpha' };
                const st = (rec.status || 'alpha').toLowerCase();
                if (st === 'hadir') totalHadir++;
                else if (st === 'izin') totalIzin++;
                else if (st === 'sakit') totalSakit++;
                else totalAlpha++;

                if (rec.rambut || rec.atribut || rec.makeup || rec.seragam) {
                    totalPelanggaran++;
                }
            });
        });

        const totalEntries = totalSesi * (students.length || 1);
        const persenKehadiran = totalEntries > 0 ? Math.round((totalHadir / totalEntries) * 100) : 100;

        const kpiPersen = document.getElementById("rekapKpiPersenHadir");
        if (kpiPersen) kpiPersen.textContent = `${persenKehadiran}%`;

        const kpiSesi = document.getElementById("rekapKpiTotalSesi");
        if (kpiSesi) kpiSesi.textContent = `${totalSesi} Hari`;

        const kpiSiswa = document.getElementById("rekapKpiTotalSiswa");
        if (kpiSiswa) kpiSiswa.textContent = `${students.length} Siswa`;

        const kpiIzinSakit = document.getElementById("rekapKpiIzinSakit");
        if (kpiIzinSakit) kpiIzinSakit.textContent = `${totalIzin} Izin • ${totalSakit} Sakit`;

        const kpiAlphaDisiplin = document.getElementById("rekapKpiAlphaDisiplin");
        if (kpiAlphaDisiplin) kpiAlphaDisiplin.textContent = `${totalAlpha} Alpha • ${totalPelanggaran} Disiplin`;

        this.renderAttendanceHistoryTable();
    },

    renderAttendanceHistoryTable() {
        const thead = document.getElementById("rekapTableHeader");
        const tbody = document.getElementById("rekapTableBody");
        const badgeInfo = document.getElementById("rekapTableInfoBadge");
        if (!thead || !tbody) return;

        const students = StorageManager.ensureStudentsForClass(this.currentAttendanceClass);
        students.sort((a, b) => (a.no || 0) - (b.no || 0));

        let sessions = StorageManager.getAllClassAttendances(this.currentAttendanceClass);
        if (this.currentRekapFilterMonth) {
            sessions = sessions.filter(s => {
                if (!s.tanggal) return false;
                const m = s.tanggal.split('-')[1];
                return m === this.currentRekapFilterMonth;
            });
        }

        const totalSesi = sessions.length;

        if (this.currentRekapView === 'siswa') {
            if (badgeInfo) badgeInfo.textContent = `Rekapitulasi Kehadiran Siswa Kelas ${this.currentAttendanceClass} (${totalSesi} Sesi Tercatat)`;

            thead.innerHTML = `
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                    <th style="width: 45px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.85rem;">No</th>
                    <th style="width: 110px; border-right: 1px solid #cbd5e1; padding: 8px 6px; font-weight: 800; font-size: 0.85rem;">NIS / NISN</th>
                    <th style="border-right: 1px solid #cbd5e1; text-align: left; padding: 8px 12px; font-weight: 800; font-size: 0.85rem; min-width: 200px;">Nama Siswa</th>
                    <th style="width: 55px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem; color: #16a34a;" title="Hadir">H</th>
                    <th style="width: 55px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem; color: #d97706;" title="Izin">I</th>
                    <th style="width: 55px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem; color: #2563eb;" title="Sakit">S</th>
                    <th style="width: 55px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem; color: #dc2626;" title="Alpha">A</th>
                    <th style="width: 95px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem;">Disiplin</th>
                    <th style="width: 100px; border-right: 1px solid #cbd5e1; padding: 8px 6px; font-weight: 800; font-size: 0.825rem;">% Hadir</th>
                    <th style="width: 85px; padding: 8px 6px; font-weight: 800; font-size: 0.825rem;">Aksi</th>
                </tr>
            `;

            if (students.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" style="padding: 2.5rem; color: var(--text-muted);">Belum ada data siswa untuk kelas ini.</td></tr>`;
                return;
            }

            tbody.innerHTML = students.map((s, idx) => {
                let hadir = 0, izin = 0, sakit = 0, alpha = 0;
                let pelanggaran = 0;

                sessions.forEach(sess => {
                    const rec = (sess.records && sess.records[s.id]) || { status: 'alpha' };
                    const st = (rec.status || 'alpha').toLowerCase();
                    if (st === 'hadir') hadir++;
                    else if (st === 'izin') izin++;
                    else if (st === 'sakit') sakit++;
                    else alpha++;

                    if (rec.rambut || rec.atribut || rec.makeup || rec.seragam) {
                        pelanggaran++;
                    }
                });

                const persen = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 100;
                let badgeColor = "#16a34a";
                let badgeBg = "#dcfce7";
                if (persen < 75) {
                    badgeColor = "#dc2626";
                    badgeBg = "#fee2e2";
                } else if (persen < 90) {
                    badgeColor = "#d97706";
                    badgeBg = "#fef3c7";
                }

                return `
                    <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 700; color: var(--text-muted);">${s.no || (idx + 1)}</td>
                        <td style="padding: 6px 6px; border-right: 1px solid #e2e8f0; font-size: 0.82rem; color: var(--text-muted);">${s.nis || s.nisn || '-'}</td>
                        <td style="padding: 6px 12px; border-right: 1px solid #e2e8f0; text-align: left; font-weight: 700; color: var(--text-main); font-size: 0.88rem;">${this.escapeHtml(s.nama)}</td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 800; color: #16a34a;">${hadir}</td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 800; color: #d97706;">${izin}</td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 800; color: #2563eb;">${sakit}</td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 800; color: #dc2626;">${alpha}</td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-size: 0.82rem; font-weight: 700; color: ${pelanggaran > 0 ? '#b91c1c' : '#64748b'};">
                            ${pelanggaran > 0 ? `⚠️ ${pelanggaran}` : '✓ Rapi'}
                        </td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0;">
                            <span style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 800; padding: 2px 8px; border-radius: 6px; font-size: 0.82rem;">${persen}%</span>
                        </td>
                        <td style="padding: 6px 4px;">
                            <button class="btn btn-sm btn-outline" style="padding: 2px 8px; font-size: 0.75rem;" onclick="AdminPortal.selectTargetStudent('${s.id}'); AdminPortal.switchAdminTab('siswa');" title="Lihat Profil Siswa di Cari Siswa">
                                🔍 Detail
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            // View Sesi Harian
            if (badgeInfo) badgeInfo.textContent = `Daftar Sesi Presensi Harian Kelas ${this.currentAttendanceClass} (${totalSesi} Tanggal)`;

            thead.innerHTML = `
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                    <th style="width: 45px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.85rem;">No</th>
                    <th style="width: 140px; border-right: 1px solid #cbd5e1; padding: 8px 6px; font-weight: 800; font-size: 0.85rem;">Tanggal</th>
                    <th style="border-right: 1px solid #cbd5e1; text-align: left; padding: 8px 12px; font-weight: 800; font-size: 0.85rem;">Agenda Kegiatan</th>
                    <th style="width: 75px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem; color: #16a34a;">Hadir</th>
                    <th style="width: 65px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem; color: #d97706;">Izin</th>
                    <th style="width: 65px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem; color: #2563eb;">Sakit</th>
                    <th style="width: 65px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem; color: #dc2626;">Alpha</th>
                    <th style="width: 90px; border-right: 1px solid #cbd5e1; padding: 8px 4px; font-weight: 800; font-size: 0.825rem;">Disiplin</th>
                    <th style="width: 160px; padding: 8px 6px; font-weight: 800; font-size: 0.825rem;">Aksi</th>
                </tr>
            `;

            if (sessions.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="padding: 2.5rem; color: var(--text-muted);">Belum ada riwayat presensi yang tercatat untuk periode ini.</td></tr>`;
                return;
            }

            tbody.innerHTML = sessions.map((sess, idx) => {
                let hadir = 0, izin = 0, sakit = 0, alpha = 0;
                let violations = 0;

                const records = sess.records || {};
                students.forEach(s => {
                    const rec = records[s.id] || { status: 'alpha' };
                    const st = (rec.status || 'alpha').toLowerCase();
                    if (st === 'hadir') hadir++;
                    else if (st === 'izin') izin++;
                    else if (st === 'sakit') sakit++;
                    else alpha++;

                    if (rec.rambut || rec.atribut || rec.makeup || rec.seragam) {
                        violations++;
                    }
                });

                return `
                    <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
                        <td style="padding: 6px 8px; border-right: 1px solid #e2e8f0; font-weight: 700; color: var(--text-main); font-size: 0.85rem;">${sess.tanggal}</td>
                        <td style="padding: 6px 12px; border-right: 1px solid #e2e8f0; text-align: left; font-weight: 600; font-size: 0.85rem;">
                            <span class="badge-spmb-pill" style="font-size: 0.75rem;">${this.escapeHtml(sess.kegiatan || 'Presensi')}</span>
                        </td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 800; color: #16a34a;">${hadir}</td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 800; color: #d97706;">${izin}</td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 800; color: #2563eb;">${sakit}</td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 800; color: #dc2626;">${alpha}</td>
                        <td style="padding: 6px 4px; border-right: 1px solid #e2e8f0; font-weight: 700; color: ${violations > 0 ? '#b91c1c' : '#64748b'};">
                            ${violations > 0 ? `⚠️ ${violations}` : '✓ Rapi'}
                        </td>
                        <td style="padding: 6px 8px;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                                <button class="btn btn-sm btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" onclick="AdminPortal.openAttendanceDateFromHistory('${sess.tanggal}')" title="Buka dan Edit Presensi Tanggal Ini">
                                    📝 Buka
                                </button>
                                <button class="btn btn-sm btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" onclick="AdminPortal.printAttendanceDateFromHistory('${sess.tanggal}')" title="Cetak Blangko Presensi Tanggal Ini">
                                    🖨️ Cetak
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    },

    openAttendanceDateFromHistory(dateStr) {
        if (!dateStr) return;
        this.currentAttendanceDate = dateStr;
        this._attendanceDirty = false;
        const dateInput = document.getElementById("attFilterTanggal");
        if (dateInput) dateInput.value = dateStr;
        this.switchAdminTab('presensi');
        App.showToast(`Membuka blangko presensi tanggal ${dateStr}`);
    },

    printAttendanceDateFromHistory(dateStr) {
        if (!dateStr) return;
        this.currentAttendanceDate = dateStr;
        const dateInput = document.getElementById("attFilterTanggal");
        if (dateInput) dateInput.value = dateStr;
        this.printAttendanceSheet();
    },

    exportRekapRiwayatToExcel() {
        const targetClass = this.currentAttendanceClass || 'X TKP';
        const students = StorageManager.ensureStudentsForClass(targetClass);
        students.sort((a, b) => (a.no || 0) - (b.no || 0));

        let sessions = StorageManager.getAllClassAttendances(targetClass);
        if (this.currentRekapFilterMonth) {
            sessions = sessions.filter(s => {
                if (!s.tanggal) return false;
                const m = s.tanggal.split('-')[1];
                return m === this.currentRekapFilterMonth;
            });
        }

        const totalSesi = sessions.length;

        const exportData = students.map((s, idx) => {
            let hadir = 0, izin = 0, sakit = 0, alpha = 0;
            let rambut = 0, atribut = 0, makeup = 0, seragam = 0;

            sessions.forEach(sess => {
                const rec = (sess.records && sess.records[s.id]) || { status: 'alpha' };
                const st = (rec.status || 'alpha').toLowerCase();
                if (st === 'hadir') hadir++;
                else if (st === 'izin') izin++;
                else if (st === 'sakit') sakit++;
                else alpha++;

                if (rec.rambut) rambut++;
                if (rec.atribut) atribut++;
                if (rec.makeup) makeup++;
                if (rec.seragam) seragam++;
            });

            const totalPelanggaran = rambut + atribut + makeup + seragam;
            const persen = totalSesi > 0 ? `${Math.round((hadir / totalSesi) * 100)}%` : '100%';

            return {
                "No": s.no || (idx + 1),
                "NIS": s.nis || "-",
                "NISN": s.nisn || "-",
                "Nama Siswa": s.nama,
                "Kelas": s.kelas || targetClass,
                "Total Hari Presensi": totalSesi,
                "Hadir (H)": hadir,
                "Izin (I)": izin,
                "Sakit (S)": sakit,
                "Alpha (A)": alpha,
                "% Kehadiran": persen,
                "Pelanggaran Rambut": rambut,
                "Pelanggaran Atribut": atribut,
                "Pelanggaran Make up": makeup,
                "Pelanggaran Seragam": seragam,
                "Total Catatan Disiplin": totalPelanggaran
            };
        });

        if (typeof XLSX === 'undefined') {
            App.showToast("Pustaka SheetJS belum termuat. Periksa koneksi internet.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Presensi");

        const cleanClass = targetClass.replace(/[^a-zA-Z0-9]/g, '_');
        const monthSuffix = this.currentRekapFilterMonth ? `_Bulan_${this.currentRekapFilterMonth}` : '_Semua_Riwayat';
        const filename = `Rekap_Presensi_${cleanClass}${monthSuffix}.xlsx`;

        XLSX.writeFile(workbook, filename);
        App.showToast(`Berkas Excel (${filename}) berhasil diunduh!`);
    },

    printRekapRiwayat() {
        const targetClass = this.currentAttendanceClass || 'X TKP';
        const students = StorageManager.ensureStudentsForClass(targetClass);
        students.sort((a, b) => (a.no || 0) - (b.no || 0));

        let sessions = StorageManager.getAllClassAttendances(targetClass);
        if (this.currentRekapFilterMonth) {
            sessions = sessions.filter(s => {
                if (!s.tanggal) return false;
                const m = s.tanggal.split('-')[1];
                return m === this.currentRekapFilterMonth;
            });
        }

        const totalSesi = sessions.length;
        const config = StorageManager.getConfig();
        const template = StorageManager.getSuratTemplate();
        const tahunAjaran = config.academicYear || "2026/2027";
        const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const namaBulanMap = {
            "01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
            "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
            "09": "September", "10": "Oktober", "11": "November", "12": "Desember"
        };
        const periodeLabel = this.currentRekapFilterMonth
            ? `BULAN ${namaBulanMap[this.currentRekapFilterMonth] ? namaBulanMap[this.currentRekapFilterMonth].toUpperCase() : this.currentRekapFilterMonth} ${new Date().getFullYear()}`
            : `KESELURUHAN RIWAYAT (TOTAL ${totalSesi} HARI PRESENSI)`;

        const wakaNama = config.headOfStudentAffairs || template.pejabatNama || 'Morlan Purba Sibarani, S.Pd., M.Si.';
        const wakaJabatan = template.pejabatJabatan || 'Wakasek Bidang Kesiswaan';
        let wakaNip = config.headOfStudentAffairsNip || template.pejabatNip || 'NIP. 19740315 200501 1 004';
        if (wakaNip && !wakaNip.toUpperCase().startsWith('NIP')) {
            wakaNip = `NIP. ${wakaNip}`;
        }

        let namaWaliKelas = "-";
        const currentUser = AuthManager.getCurrentUser();
        if (currentUser && currentUser.roleLabel && currentUser.roleLabel.toLowerCase().includes("wali")) {
            namaWaliKelas = currentUser.name;
        } else if (typeof DAFTAR_WALI_KELAS_MASTER !== 'undefined') {
            const foundWali = DAFTAR_WALI_KELAS_MASTER.find(w => w.kode === targetClass || (w.label && w.label.includes(targetClass)));
            if (foundWali) namaWaliKelas = foundWali.nama;
        }

        const rowsHtml = students.map((s, idx) => {
            let hadir = 0, izin = 0, sakit = 0, alpha = 0;
            let pelanggaran = 0;

            sessions.forEach(sess => {
                const rec = (sess.records && sess.records[s.id]) || { status: 'alpha' };
                const st = (rec.status || 'alpha').toLowerCase();
                if (st === 'hadir') hadir++;
                else if (st === 'izin') izin++;
                else if (st === 'sakit') sakit++;
                else alpha++;

                if (rec.rambut || rec.atribut || rec.makeup || rec.seragam) {
                    pelanggaran++;
                }
            });

            const persen = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 100;

            return `
                <tr>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${s.no || (idx + 1)}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${s.nis || s.nisn || '-'}</td>
                    <td style="border: 1px solid #000; padding: 4px 8px; text-align: left;">${s.nama}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: bold;">${hadir}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${izin}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${sakit}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px; color: ${alpha > 0 ? '#b91c1c' : '#000'}; font-weight: ${alpha > 0 ? 'bold' : 'normal'};">${alpha}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${pelanggaran}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: bold;">${persen}%</td>
                </tr>
            `;
        }).join('');

        const printContainer = document.getElementById("printRaporContainer");
        if (!printContainer) return;

        printContainer.innerHTML = `
            <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #000; padding: 1.5cm 1cm;">
                ${StorageManager.getOfficialKopHtml()}

                <div style="text-align: center; margin: 15px 0 20px 0;">
                    <h2 style="margin: 0; font-size: 13pt; text-transform: uppercase; font-weight: 800; text-decoration: underline;">
                        REKAPITULASI PRESENSI &amp; KEDISIPLINAN SISWA
                    </h2>
                    <h3 style="margin: 4px 0 0 0; font-size: 11pt; text-transform: uppercase;">
                        KELAS ${targetClass} &bull; TAHUN AJARAN ${tahunAjaran}
                    </h3>
                    <div style="margin-top: 4px; font-size: 9.5pt; font-weight: 600; color: #333;">
                        Periode: ${periodeLabel} &bull; Jumlah Siswa: ${students.length} Orang
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 9pt; text-align: center;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th rowspan="2" style="border: 1px solid #000; width: 35px; padding: 5px; vertical-align: middle;">No</th>
                            <th rowspan="2" style="border: 1px solid #000; width: 85px; padding: 5px; vertical-align: middle;">NIS / NISN</th>
                            <th rowspan="2" style="border: 1px solid #000; text-align: left; padding: 5px 8px; vertical-align: middle;">Nama Siswa</th>
                            <th colspan="4" style="border: 1px solid #000; padding: 4px; font-weight: bold;">Kehadiran (${totalSesi} Hari)</th>
                            <th rowspan="2" style="border: 1px solid #000; width: 75px; padding: 5px; vertical-align: middle;">Catatan Disiplin</th>
                            <th rowspan="2" style="border: 1px solid #000; width: 65px; padding: 5px; vertical-align: middle;">% Hadir</th>
                        </tr>
                        <tr style="background: #f8fafc;">
                            <th style="border: 1px solid #000; width: 45px; padding: 4px;">H</th>
                            <th style="border: 1px solid #000; width: 45px; padding: 4px;">I</th>
                            <th style="border: 1px solid #000; width: 45px; padding: 4px;">S</th>
                            <th style="border: 1px solid #000; width: 45px; padding: 4px;">A</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div style="margin-top: 2rem; display: flex; justify-content: space-between; page-break-inside: avoid; font-size: 10pt;">
                    <div style="text-align: center; width: 260px;">
                        Mengetahui,<br>
                        ${wakaJabatan}
                        <br><br><br><br>
                        <strong>${wakaNama}</strong><br>
                        ${wakaNip}
                    </div>
                    <div style="text-align: center; width: 260px;">
                        Magelang, ${tanggalCetak}<br>
                        Wali Kelas ${targetClass}
                        <br><br><br><br>
                        <strong>${namaWaliKelas}</strong>
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
