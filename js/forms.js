/**
 * CONTROLLER FORMULIR & MODAL
 * Mendukung input foto prestasi, pengaturan sekolah oleh Super Admin, kelola anggota guru, dan kata mutiara.
 */

const Forms = {
    uploadedLogoUrl: null,
    uploadedDashboardBgUrl: null,
    uploadedPrestasiFotoUrl: null,
    uploadedPrestasiPiagamUrl: null,

    init() {
        this.bindEvents();
        this.populateDropdowns();
    },

    resizeImageFile(file, maxWidth, maxHeight, quality, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const isPng = file.type === "image/png" || file.type === "image/svg+xml";
                const dataUrl = canvas.toDataURL(isPng ? "image/png" : "image/jpeg", quality || 0.82);
                callback(dataUrl);
            };
            img.onerror = () => {
                App.showToast("Gagal memproses file gambar.");
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            App.showToast("Gagal membaca file gambar.");
        };
        reader.readAsDataURL(file);
    },

    clearLogoUpload() {
        this.uploadedLogoUrl = "";
        const box = document.getElementById("logoPreviewBox");
        if (box) box.style.display = "none";
        const fileInput = document.getElementById("setSchoolLogoFile");
        if (fileInput) fileInput.value = "";
        this.updateSettingsLivePreview();
    },

    clearDashboardBgUpload() {
        this.uploadedDashboardBgUrl = "";
        const box = document.getElementById("bgPreviewBox");
        if (box) box.style.display = "none";
        const fileInput = document.getElementById("setDashboardBgFile");
        if (fileInput) fileInput.value = "";
    },

    clearPrestasiPiagamUpload() {
        this.uploadedPrestasiPiagamUrl = "";
        const box = document.getElementById("prestasiPiagamPreviewBox");
        if (box) box.style.display = "none";
        const fileInput = document.getElementById("formPrestasiPiagamFile");
        if (fileInput) fileInput.value = "";
        const urlInput = document.getElementById("formPrestasiPiagamUrl");
        if (urlInput) urlInput.value = "";
    },

    clearPrestasiFotoUpload() {
        this.uploadedPrestasiFotoUrl = "";
        const box = document.getElementById("prestasiFotoPreviewBox");
        if (box) box.style.display = "none";
        const fileInput = document.getElementById("formPrestasiFotoFile");
        if (fileInput) fileInput.value = "";
        const urlInput = document.getElementById("formPrestasiFoto");
        if (urlInput) urlInput.value = "";
    },

    updatePrestasiPointsCalculation() {
        const juara = document.getElementById("formPrestasiJuara")?.value || "";
        const tingkat = document.getElementById("formPrestasiTingkat")?.value || "";

        let base = 30;
        const t = tingkat.toLowerCase();
        const j = juara.toLowerCase();

        if (t.includes("internasional")) base = 120;
        else if (t.includes("nasional")) base = 90;
        else if (t.includes("provinsi") || t.includes("jateng") || t.includes("diy")) base = 60;
        else if (t.includes("karesidenan")) base = 45;
        else if (t.includes("kota") || t.includes("kabupaten")) base = 30;

        let bonus = 0;
        if (j === "juara 1") bonus = 15;
        else if (j === "juara 2") bonus = 10;
        else if (j === "juara 3") bonus = 5;
        else if (j.includes("harapan 1")) bonus = 0;
        else if (j.includes("harapan 2")) bonus = -5;
        else if (j.includes("harapan 3")) bonus = -10;

        const totalPoints = Math.max(10, base + bonus);

        const badge = document.getElementById("prestasiPoinBadge");
        if (badge) badge.textContent = `+${totalPoints} Poin`;

        const hiddenInput = document.getElementById("formPrestasiPoin");
        if (hiddenInput) hiddenInput.value = totalPoints;
    },

    bindEvents() {
        // Submit Pelanggaran
        const vForm = document.getElementById("violationForm");
        if (vForm) {
            vForm.addEventListener("submit", (e) => this.handleViolationSubmit(e));
        }

        // Submit Prestasi
        const aForm = document.getElementById("achievementForm");
        if (aForm) {
            aForm.addEventListener("submit", (e) => this.handleAchievementSubmit(e));
        }

        // Submit Siswa Baru
        const sForm = document.getElementById("studentForm");
        if (sForm) {
            sForm.addEventListener("submit", (e) => this.handleStudentSubmit(e));
        }

        // Upload Logo Sekolah
        const logoFileInput = document.getElementById("setSchoolLogoFile");
        if (logoFileInput) {
            logoFileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.resizeImageFile(file, 220, 220, 0.85, (base64) => {
                        this.uploadedLogoUrl = base64;
                        const preview = document.getElementById("logoPreviewImg");
                        const box = document.getElementById("logoPreviewBox");
                        if (preview && box) {
                            preview.src = base64;
                            box.style.display = "flex";
                        }
                        this.updateSettingsLivePreview();
                    });
                }
            });
        }

        // Upload Wallpaper Dasbor
        const bgFileInput = document.getElementById("setDashboardBgFile");
        if (bgFileInput) {
            bgFileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.resizeImageFile(file, 1600, 1000, 0.75, (base64) => {
                        this.uploadedDashboardBgUrl = base64;
                        const preview = document.getElementById("bgPreviewImg");
                        const box = document.getElementById("bgPreviewBox");
                        if (preview && box) {
                            preview.src = base64;
                            box.style.display = "flex";
                        }
                    });
                }
            });
        }

        // Upload Piagam / Sertifikat Kejuaraan
        const piagamFileInput = document.getElementById("formPrestasiPiagamFile");
        if (piagamFileInput) {
            piagamFileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.resizeImageFile(file, 1000, 800, 0.82, (base64) => {
                        this.uploadedPrestasiPiagamUrl = base64;
                        const preview = document.getElementById("prestasiPiagamPreviewImg");
                        const box = document.getElementById("prestasiPiagamPreviewBox");
                        if (preview && box) {
                            preview.src = base64;
                            box.style.display = "flex";
                        }
                    });
                }
            });
        }

        // Upload Foto Dokumentasi Prestasi (Tidak Wajib)
        const presFileInput = document.getElementById("formPrestasiFotoFile");
        if (presFileInput) {
            presFileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.resizeImageFile(file, 900, 600, 0.80, (base64) => {
                        this.uploadedPrestasiFotoUrl = base64;
                        const preview = document.getElementById("prestasiFotoPreviewImg");
                        const box = document.getElementById("prestasiFotoPreviewBox");
                        if (preview && box) {
                            preview.src = base64;
                            box.style.display = "flex";
                        }
                    });
                }
            });
        }

        // Kalkulasi Poin Reward saat Peringkat atau Tingkat dipilih
        const presJuara = document.getElementById("formPrestasiJuara");
        if (presJuara) {
            presJuara.addEventListener("change", () => this.updatePrestasiPointsCalculation());
        }

        const presTingkat = document.getElementById("formPrestasiTingkat");
        if (presTingkat) {
            presTingkat.addEventListener("change", () => this.updatePrestasiPointsCalculation());
        }

        // Dropdown Katalog Pelanggaran Auto-fill & Kalkulasi Rekap Poin
        const vCat = document.getElementById("formPelanggaranKatalog");
        if (vCat) {
            vCat.addEventListener("change", (e) => {
                const id = e.target.value;
                const violations = StorageManager.getViolationsMaster();
                const item = violations.find(p => p.id === id);
                const sId = document.getElementById("formPelanggaranSiswaId").value;
                const student = StorageManager.getStudentById(sId);

                if (item) {
                    document.getElementById("formPelanggaranNama").value = item.nama;
                    document.getElementById("formPelanggaranPoin").value = item.poin;
                    document.getElementById("formPelanggaranKategori").value = item.kategori || "Kedisiplinan";
                    this.updateViolationCalculation(student, item);
                } else {
                    document.getElementById("formPelanggaranNama").value = "";
                    document.getElementById("formPelanggaranPoin").value = 0;
                    this.updateViolationCalculation(student, null);
                }
            });
        }

        // Klik luar modal untuk menutup
        document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
            backdrop.addEventListener("click", (e) => {
                if (e.target === backdrop) this.closeAllModals();
            });
        });
    },

    populateDropdowns() {
        // Dropdown Katalog Pelanggaran Resmi (Kelolaan Super Admin, Poin Langsung Muncul)
        const pelKatalog = document.getElementById("formPelanggaranKatalog");
        if (pelKatalog) {
            const violations = StorageManager.getViolationsMaster();
            pelKatalog.innerHTML = `
                <option value="">-- Pilih Jenis Pelanggaran --</option>
                ${violations.map(p => `
                    <option value="${p.id}">[${p.poin} Poin] ${p.nama} (${p.kategori || 'Kedisiplinan'})</option>
                `).join('')}
            `;
        }
    },

    openModal(modalId) {
        this.closeAllModals();
        const m = document.getElementById(modalId);
        if (m) {
            m.classList.add("show");
            document.body.style.overflow = "hidden";
        }
    },

    closeModal(modalId) {
        if (modalId) {
            const m = document.getElementById(modalId);
            if (m) {
                m.classList.remove("show");
            }
            // Jika modal yang ditutup adalah modalEditTeacher, kembali buka modalManageTeachers
            if (modalId === "modalEditTeacher") {
                this.openManageTeachersModal();
                return;
            }
        } else {
            this.closeAllModals();
            return;
        }

        const remaining = document.querySelectorAll(".modal-backdrop.show");
        if (!remaining || remaining.length === 0) {
            document.body.style.overflow = "auto";
        }
    },

    closeAllModals() {
        document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("show"));
        document.body.style.overflow = "auto";
    },

    // Rekapitulasi Otomatis Poin, Riwayat Pelanggaran & Sanksi Terkunci
    updateViolationCalculation(student, violationItem) {
        if (!student) {
            const sId = document.getElementById("formPelanggaranSiswaId")?.value;
            student = StorageManager.getStudentById(sId);
        }

        const poinLama = student ? (student.pelanggaran || []).reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0) : 0;
        const poinBaru = violationItem ? Number(violationItem.poin) : 0;
        const poinTotal = poinLama + poinBaru;

        // Update indikator angka di kotak rekap
        const elLama = document.getElementById("rekapPoinLama");
        const elBaru = document.getElementById("rekapPoinBaru");
        const elTotal = document.getElementById("rekapPoinTotal");
        const elPill = document.getElementById("rekapPointCalculationPill");

        if (elLama) elLama.textContent = `${poinLama} Poin`;
        if (elBaru) elBaru.textContent = `+${poinBaru} Poin`;
        if (elTotal) elTotal.textContent = `${poinTotal} Poin`;
        if (elPill) elPill.textContent = `${poinLama} + ${poinBaru} = ${poinTotal} Poin`;

        // Render riwayat pelanggaran sebelumnya
        const riwayatContainer = document.getElementById("formPelanggaranRiwayatList");
        if (riwayatContainer) {
            if (student && student.pelanggaran && student.pelanggaran.length > 0) {
                riwayatContainer.innerHTML = student.pelanggaran.map((p) => `
                    <div style="padding: 4px 0; border-bottom: 1px dotted #fca5a5; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <span style="color: #64748b; font-size: 0.7rem;">${p.tanggal || '-'}</span> 
                            <strong style="color: #b91c1c;">${p.nama}</strong> 
                            <span class="status-pill pill-red" style="font-size: 0.65rem; padding: 1px 6px;">+${p.poin} Poin</span>
                        </div>
                        <span style="color: #7f1d1d; font-size: 0.7rem; font-style: italic; white-space: nowrap;">
                            ${p.sanksi || '-'}
                        </span>
                    </div>
                `).join('');
            } else {
                riwayatContainer.innerHTML = `
                    <div style="color: #16a34a; font-weight: 500; padding: 3px 0;">
                        ✨ Siswa belum memiliki catatan pelanggaran sebelumnya (Catatan Bersih).
                    </div>
                `;
            }
        }

        // Cari sanksi & status otomatis berdasarkan rentangan poin dari aturan resmi
        const rule = StorageManager.getRuleForPoints(poinTotal);
        const sanksiInput = document.getElementById("formPelanggaranSanksi");
        if (sanksiInput) {
            sanksiInput.value = rule.action || rule.tindakLanjut || "Peringatan lisan & pembinaan wali kelas";
        }

        const badge = document.getElementById("formPelanggaranStatusBadge");
        if (badge) {
            badge.textContent = rule.status;
            badge.className = `status-pill ${rule.badgeClass || 'pill-green'}`;
        }
    },

    openViolationModal(preselectedStudentId = null) {
        let student = null;
        if (preselectedStudentId) {
            student = StorageManager.getStudentById(preselectedStudentId);
        }
        if (!student && AdminPortal.selectedStudent) {
            student = AdminPortal.selectedStudent;
        }
        if (!student) {
            const students = StorageManager.getStudents();
            if (students && students.length > 0) {
                student = students[0];
            }
        }

        if (!student) {
            App.showToast("Belum ada data siswa.");
            return;
        }

        // Kunci siswa yang dituju (tanpa dropdown lain)
        AdminPortal.selectedStudent = student;
        document.getElementById("formPelanggaranSiswaId").value = student.id;
        document.getElementById("formPelanggaranLockedNama").textContent = student.nama;
        document.getElementById("formPelanggaranLockedInfo").textContent = `NISN: ${student.nisn} • Kelas: ${student.kelas} (${student.jurusan || '-'})`;

        // Tanggal kejadian tepat di bawah nama siswa
        document.getElementById("formPelanggaranTanggal").value = new Date().toISOString().split("T")[0];

        // Reset pilihan katalog jenis pelanggaran
        this.populateDropdowns();
        const vCat = document.getElementById("formPelanggaranKatalog");
        if (vCat) vCat.value = "";
        document.getElementById("formPelanggaranNama").value = "";
        document.getElementById("formPelanggaranPoin").value = 0;
        document.getElementById("formPelanggaranKategori").value = "Kedisiplinan";

        // Inisialisasi rekap poin & riwayat awal
        this.updateViolationCalculation(student, null);

        this.openModal("modalViolation");
    },

    openAchievementModal(preselectedStudentId = null) {
        let student = null;
        if (preselectedStudentId) {
            student = StorageManager.getStudentById(preselectedStudentId);
        }
        if (!student && AdminPortal.selectedStudent) {
            student = AdminPortal.selectedStudent;
        }
        if (!student) {
            const students = StorageManager.getStudents();
            if (students && students.length > 0) {
                student = students[0];
            }
        }

        if (!student) {
            App.showToast("Belum ada data siswa.");
            return;
        }

        // Kunci siswa yang dituju (tanpa dropdown lain)
        AdminPortal.selectedStudent = student;
        document.getElementById("formPrestasiSiswaId").value = student.id;
        document.getElementById("formPrestasiLockedNama").textContent = student.nama;
        document.getElementById("formPrestasiLockedInfo").textContent = `NISN: ${student.nisn} • Kelas: ${student.kelas} (${student.jurusan || '-'})`;

        const form = document.getElementById("achievementForm");
        if (form) form.reset();
        this.clearPrestasiFotoUpload();
        this.clearPrestasiPiagamUpload();

        document.getElementById("formPrestasiTanggal").value = new Date().toISOString().split("T")[0];
        const juaraSelect = document.getElementById("formPrestasiJuara");
        if (juaraSelect) juaraSelect.value = "";
        const tingkatSelect = document.getElementById("formPrestasiTingkat");
        if (tingkatSelect) tingkatSelect.value = "";
        this.updatePrestasiPointsCalculation();

        this.openModal("modalAchievement");
    },

    openStudentModal() {
        if (!AuthManager.isSuperAdmin()) {
            App.showToast("Fitur tambah siswa baru hanya dapat diakses oleh Super Admin!");
            return;
        }
        const form = document.getElementById("studentForm");
        if (form) form.reset();
        this.openModal("modalStudent");
    },

    // 1. Submit Pelanggaran
    handleViolationSubmit(e) {
        e.preventDefault();
        const studentId = document.getElementById("formPelanggaranSiswaId").value;
        const nama = document.getElementById("formPelanggaranNama").value;
        const poin = Number(document.getElementById("formPelanggaranPoin").value);
        const tanggal = document.getElementById("formPelanggaranTanggal").value;
        const sanksi = document.getElementById("formPelanggaranSanksi").value;
        const kategori = document.getElementById("formPelanggaranKategori").value || "Kedisiplinan";

        if (!studentId) {
            App.showToast("Siswa target belum terpilih!");
            return;
        }

        if (!nama || !poin) {
            App.showToast("Pilih jenis pelanggaran dari daftar resmi terlebih dahulu!");
            return;
        }

        try {
            StorageManager.addViolation(studentId, {
                nama,
                kategori,
                poin: Number(poin),
                tanggal,
                sanksi,
                pencatat: AuthManager.getCurrentUser() ? AuthManager.getCurrentUser().name : "Guru Piket"
            });

            this.closeAllModals();

            if (AuthManager.isTeacher()) {
                AdminPortal.renderTeacherAllStudents();
                AdminPortal.selectTargetStudent(studentId);
            }

            if (AuthManager.isStudent() && AuthManager.getCurrentUser().studentId === studentId) {
                SiswaPortal.renderMyStudentPortal(studentId);
            }

            const student = StorageManager.getStudentById(studentId);
            App.showToast(`Pelanggaran siswa ${student.nama} (${poin} Poin) berhasil disimpan. Sanksi: ${sanksi}`);
        } catch (err) {
            App.showToast(err.message);
        }
    },

    // 2. Submit Prestasi Siswa
    handleAchievementSubmit(e) {
        e.preventDefault();
        const studentId = document.getElementById("formPrestasiSiswaId").value;
        const peringkat = document.getElementById("formPrestasiJuara").value;
        const tingkat = document.getElementById("formPrestasiTingkat").value;
        const nama = document.getElementById("formPrestasiNama").value.trim();
        const penyelenggara = document.getElementById("formPrestasiPenyelenggara").value.trim();
        const tanggal = document.getElementById("formPrestasiTanggal").value;
        const poin = Number(document.getElementById("formPrestasiPoin").value) || 30;

        // Piagam (Upload File atau URL)
        const piagamUrlInput = document.getElementById("formPrestasiPiagamUrl")?.value.trim();
        const piagam = this.uploadedPrestasiPiagamUrl || piagamUrlInput || "";

        // Foto Dokumentasi (Upload File atau URL - Tidak Wajib)
        const fotoUrlInput = document.getElementById("formPrestasiFoto")?.value.trim();
        const foto = this.uploadedPrestasiFotoUrl || fotoUrlInput || piagam || undefined;

        if (!studentId) {
            App.showToast("Siswa target belum terpilih!");
            return;
        }

        if (!peringkat || !tingkat || !nama || !penyelenggara) {
            App.showToast("Lengkapi peringkat juara, tingkat, nama kejuaraan, dan penyelenggara!");
            return;
        }

        const keterangan = `${peringkat} Tingkat ${tingkat} • Penyelenggara: ${penyelenggara}`;

        try {
            StorageManager.addAchievement(studentId, {
                nama,
                kategori: "Akademik",
                tingkat,
                peringkat,
                penyelenggara,
                piagam,
                poin: Number(poin),
                tanggal,
                foto,
                keterangan,
                pencatat: AuthManager.getCurrentUser() ? AuthManager.getCurrentUser().name : "Tim Kesiswaan"
            });

            this.closeAllModals();

            if (AuthManager.isTeacher()) {
                AdminPortal.renderTeacherAllStudents();
                AdminPortal.renderAdminPrestasiList();
                AdminPortal.selectTargetStudent(studentId);
            }

            if (AuthManager.isStudent() && AuthManager.getCurrentUser().studentId === studentId) {
                SiswaPortal.renderMyStudentPortal(studentId);
            }

            // Refresh Slider Prestasi Dasbor Utama
            App.initPrestasiSlider();

            const student = StorageManager.getStudentById(studentId);
            App.showToast(`Prestasi ${student.nama} (${peringkat} ${tingkat} - ${nama}) berhasil disimpan (+${poin} Poin)!`);
        } catch (err) {
            App.showToast(err.message);
        }
    },

    // 3. Tambah Siswa Baru & Pengelolaan Foto
    handleAddStudentFotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            this.addStudentCurrentFoto = evt.target.result;
            const preview = document.getElementById("formAddStudentFotoPreview");
            if (preview) preview.src = this.addStudentCurrentFoto;
        };
        reader.readAsDataURL(file);
    },

    handleAddStudentFotoUrlInput(url) {
        if (!url) return;
        this.addStudentCurrentFoto = url.trim();
        const preview = document.getElementById("formAddStudentFotoPreview");
        if (preview) preview.src = this.addStudentCurrentFoto;
    },

    handleAddStudent(e) {
        this.handleStudentSubmit(e);
    },

    handleStudentSubmit(e) {
        e.preventDefault();
        const nisn = document.getElementById("formStudentNisn").value.trim();
        const nama = document.getElementById("formStudentNama").value.trim();
        const gender = document.getElementById("formStudentGender").value;
        const kelas = document.getElementById("formStudentKelas").value.trim();
        const jurusan = document.getElementById("formStudentJurusan").value.trim();
        const waliKelas = document.getElementById("formStudentWali").value.trim();
        const nis = document.getElementById("formStudentNis") ? document.getElementById("formStudentNis").value.trim() : "";
        const nomorHp = document.getElementById("formStudentNomorHp") ? document.getElementById("formStudentNomorHp").value.trim() : "";
        const spmb = document.getElementById("formStudentSpmb") ? document.getElementById("formStudentSpmb").value.trim() : "";
        const namaBapak = document.getElementById("formStudentNamaBapak") ? document.getElementById("formStudentNamaBapak").value.trim() : "";
        const hpBapak = document.getElementById("formStudentHpBapak") ? document.getElementById("formStudentHpBapak").value.trim() : "";
        const namaIbu = document.getElementById("formStudentNamaIbu") ? document.getElementById("formStudentNamaIbu").value.trim() : "";
        const hpIbu = document.getElementById("formStudentHpIbu") ? document.getElementById("formStudentHpIbu").value.trim() : "";
        const alamat = document.getElementById("formStudentAlamat") ? document.getElementById("formStudentAlamat").value.trim() : "";
        const mapsAlamat = document.getElementById("formStudentMapsAlamat") ? document.getElementById("formStudentMapsAlamat").value.trim() : "";

        if (!nisn || !nama || !kelas) {
            App.showToast("NISN, Nama, dan Kelas wajib diisi!");
            return;
        }

        try {
            const newStudent = StorageManager.addStudent({
                foto: this.addStudentCurrentFoto || "",
                nis,
                nisn,
                nama,
                gender,
                kelas,
                jurusan,
                waliKelas,
                nomorHp,
                inputSpmb: spmb,
                namaOrtuBapak: namaBapak,
                noHpBapak: hpBapak,
                namaOrtuIbu: namaIbu,
                noHpIbu: hpIbu,
                alamat,
                mapsAlamat,
                kontakOrtu: hpBapak || hpIbu || "-"
            });

            this.closeAllModals();
            this.populateDropdowns();

            if (AuthManager.isTeacher()) {
                AdminPortal.renderTeacherAllStudents();
                AdminPortal.selectTargetStudent(newStudent.id);
            }

            App.showToast(`Siswa baru ${nama} berhasil ditambahkan.`);
        } catch (err) {
            App.showToast(err.message);
        }
    },

    // 3B. EDIT PROFIL SISWA (LENGKAP SESUAI FORMAT EXCEL IMPOR)
    openEditStudentModal(studentId) {
        const id = studentId || (AdminPortal.selectedStudent ? AdminPortal.selectedStudent.id : null);
        if (!id) {
            App.showToast("Pilih siswa yang ingin diedit terlebih dahulu!");
            return;
        }

        const student = StorageManager.getStudentById(id);
        if (!student) {
            App.showToast("Data siswa tidak ditemukan.");
            return;
        }

        this.editStudentCurrentId = student.id;
        this.editStudentCurrentFoto = student.foto || "";

        // Isi field form edit
        document.getElementById("formEditStudentId").value = student.id;
        document.getElementById("formEditStudentNis").value = student.nis || "";
        document.getElementById("formEditStudentNisn").value = student.nisn || "";
        document.getElementById("formEditStudentGender").value = student.gender || "L";
        document.getElementById("formEditStudentNama").value = student.nama || "";
        document.getElementById("formEditStudentKelas").value = student.kelas || "";
        document.getElementById("formEditStudentJurusan").value = student.jurusan || "";
        document.getElementById("formEditStudentWali").value = student.waliKelas || "";
        document.getElementById("formEditStudentNomorHp").value = student.nomorHp || "";
        document.getElementById("formEditStudentSpmb").value = student.inputSpmb || "";
        document.getElementById("formEditStudentNamaBapak").value = student.namaOrtuBapak || "";
        document.getElementById("formEditStudentHpBapak").value = student.noHpBapak || "";
        document.getElementById("formEditStudentNamaIbu").value = student.namaOrtuIbu || "";
        document.getElementById("formEditStudentHpIbu").value = student.noHpIbu || "";
        document.getElementById("formEditStudentAlamat").value = student.alamat || "";
        document.getElementById("formEditStudentMapsAlamat").value = student.mapsAlamat || "";

        const preview = document.getElementById("formEditStudentFotoPreview");
        if (preview) {
            preview.src = student.foto || (student.gender === 'P' 
                ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"
                : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80");
        }

        const fileInput = document.getElementById("formEditStudentFotoFile");
        if (fileInput) fileInput.value = "";
        const urlInput = document.getElementById("formEditStudentFotoUrl");
        if (urlInput) urlInput.value = "";

        this.openModal("modalEditStudent");
    },

    handleEditStudentFotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            this.editStudentCurrentFoto = evt.target.result;
            const preview = document.getElementById("formEditStudentFotoPreview");
            if (preview) preview.src = this.editStudentCurrentFoto;
        };
        reader.readAsDataURL(file);
    },

    handleEditStudentFotoUrlInput(url) {
        if (!url) return;
        this.editStudentCurrentFoto = url.trim();
        const preview = document.getElementById("formEditStudentFotoPreview");
        if (preview) preview.src = this.editStudentCurrentFoto;
    },

    testOpenMaps() {
        const mapsVal = document.getElementById("formEditStudentMapsAlamat").value.trim();
        const alamatVal = document.getElementById("formEditStudentAlamat").value.trim();
        if (mapsVal) {
            window.open(mapsVal, "_blank");
        } else if (alamatVal) {
            window.open("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(alamatVal), "_blank");
        } else {
            App.showToast("Isi alamat lengkap atau link Google Maps terlebih dahulu!");
        }
    },

    handleSaveEditStudent(e) {
        e.preventDefault();
        const id = document.getElementById("formEditStudentId").value;
        const nisn = document.getElementById("formEditStudentNisn").value.trim();
        const nama = document.getElementById("formEditStudentNama").value.trim();
        const gender = document.getElementById("formEditStudentGender").value;
        const kelas = document.getElementById("formEditStudentKelas").value.trim();
        const jurusan = document.getElementById("formEditStudentJurusan").value.trim();
        const waliKelas = document.getElementById("formEditStudentWali").value.trim();
        const nis = document.getElementById("formEditStudentNis").value.trim();
        const nomorHp = document.getElementById("formEditStudentNomorHp").value.trim();
        const spmb = document.getElementById("formEditStudentSpmb").value.trim();
        const namaBapak = document.getElementById("formEditStudentNamaBapak").value.trim();
        const hpBapak = document.getElementById("formEditStudentHpBapak").value.trim();
        const namaIbu = document.getElementById("formEditStudentNamaIbu").value.trim();
        const hpIbu = document.getElementById("formEditStudentHpIbu").value.trim();
        const alamat = document.getElementById("formEditStudentAlamat").value.trim();
        const mapsAlamat = document.getElementById("formEditStudentMapsAlamat").value.trim();

        if (!nisn || !nama || !kelas) {
            App.showToast("NISN, Nama, dan Kelas wajib diisi!");
            return;
        }

        try {
            const updated = StorageManager.updateStudent(id, {
                foto: this.editStudentCurrentFoto || "",
                nis,
                nisn,
                nama,
                gender,
                kelas,
                jurusan,
                waliKelas,
                nomorHp,
                inputSpmb: spmb,
                namaOrtuBapak: namaBapak,
                noHpBapak: hpBapak,
                namaOrtuIbu: namaIbu,
                noHpIbu: hpIbu,
                alamat,
                mapsAlamat,
                kontakOrtu: hpBapak || hpIbu || "-"
            });

            this.closeAllModals();

            if (AuthManager.isTeacher()) {
                AdminPortal.renderTeacherAllStudents();
                if (AdminPortal.selectedStudent && AdminPortal.selectedStudent.id === id) {
                    AdminPortal.selectTargetStudent(id);
                }
            }

            App.showToast(`✅ Profil siswa ${updated.nama} berhasil diperbarui.`);
        } catch (err) {
            App.showToast(err.message);
        }
    },

    // 3C. FITUR IMPOR SISWA EXCEL / CSV (KHUSUS SUPER ADMIN)
    openImportStudentsModal() {
        if (!AuthManager.isSuperAdmin()) {
            App.showToast("Fitur impor siswa massal hanya dapat diakses oleh Super Admin!");
            return;
        }

        this.parsedImportRows = [];
        const fileInput = document.getElementById("importStudentFileInput");
        if (fileInput) fileInput.value = "";
        const pasteArea = document.getElementById("importStudentPasteArea");
        if (pasteArea) pasteArea.value = "";
        const statusText = document.getElementById("importFileStatusText");
        if (statusText) statusText.textContent = "Mendukung berkas Microsoft Excel (.xlsx, .xls) dan CSV (.csv)";

        const summary = document.getElementById("importSummaryBadge");
        if (summary) {
            summary.className = "status-pill pill-gray";
            summary.textContent = "0 siswa terdeteksi";
        }

        const tbody = document.getElementById("importPreviewTableBody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        Belum ada berkas yang diunggah. Silakan pilih berkas Excel atau tempel baris data di atas.
                    </td>
                </tr>
            `;
        }

        const btnExec = document.getElementById("btnExecuteImport");
        if (btnExec) btnExec.disabled = true;

        this.switchImportTab('file');
        this.openModal("modalImportStudents");
    },

    switchImportTab(tab) {
        const btnFile = document.getElementById("tabBtnImportFile");
        const btnPaste = document.getElementById("tabBtnImportPaste");
        const panelFile = document.getElementById("importPanelFile");
        const panelPaste = document.getElementById("importPanelPaste");

        if (tab === 'file') {
            if (btnFile) btnFile.classList.add("active");
            if (btnPaste) btnPaste.classList.remove("active");
            if (panelFile) panelFile.style.display = "block";
            if (panelPaste) panelPaste.style.display = "none";
        } else {
            if (btnFile) btnFile.classList.remove("active");
            if (btnPaste) btnPaste.classList.add("active");
            if (panelFile) panelFile.style.display = "none";
            if (panelPaste) panelPaste.style.display = "block";
        }
    },

    downloadStudentExcelTemplate() {
        const sampleData = [
            {
                "No": 1,
                "Foto": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
                "NIS": "230101",
                "NISN": "0061234501",
                "Nama": "Ahmad Fauzan Syahputra",
                "Kelas": "XII RPL 1",
                "Jurusan": "Rekayasa Perangkat Lunak",
                "Nomor HP": "0812-9876-5401",
                "Alamat": "Jl. Cendrawasih No. 12, RT 02/RW 04, Kel. Sukamaju",
                "Maps Alamat": "https://maps.google.com/?q=-6.2088,106.8456",
                "Nama Ortu Bapak": "H. Syahputra, S.E",
                "Nama Ortu Ibu": "Hj. Ratna Juwita",
                "No HP Bapak": "0812-3456-7890",
                "No HP Ibu": "0813-9876-5432",
                "Input SPMB": "SPMB-2023-PRESTASI-001"
            },
            {
                "No": 2,
                "Foto": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                "NIS": "240201",
                "NISN": "0061234502",
                "Nama": "Nabila Aurelia Putri",
                "Kelas": "XI MIPA 2",
                "Jurusan": "MIPA",
                "Nomor HP": "0813-8899-5402",
                "Alamat": "Komplek Taman Asri Blok B3 No. 7, Kel. Melati Indah",
                "Maps Alamat": "https://maps.google.com/?q=-6.2150,106.8520",
                "Nama Ortu Bapak": "Ir. Hendra Gunawan",
                "Nama Ortu Ibu": "Dewi Handayani, S.Pd",
                "No HP Bapak": "0813-8899-1122",
                "No HP Ibu": "0812-7766-5544",
                "Input SPMB": "SPMB-2024-ZONASI-042"
            }
        ];

        if (window.XLSX && XLSX.utils && XLSX.writeFile) {
            try {
                const ws = XLSX.utils.json_to_sheet(sampleData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
                XLSX.writeFile(wb, "Template_Impor_Siswa_Kesiswaan.xlsx");
                App.showToast("Template Excel (.xlsx) berhasil diunduh.");
                return;
            } catch (e) {
                console.warn("Gagal ekspor XLSX, beralih ke CSV:", e);
            }
        }

        // Fallback jika XLSX gagal/offline
        this.downloadStudentCsvTemplate();
    },

    downloadStudentCsvTemplate() {
        const headers = [
            "No", "Foto", "NIS", "NISN", "Nama", "Kelas", "Jurusan", 
            "Nomor HP", "Alamat", "Maps Alamat", "Nama Ortu Bapak", "Nama Ortu Ibu", 
            "No HP Bapak", "No HP Ibu", "Input SPMB"
        ];

        const rows = [
            [
                "1", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
                "230101", "0061234501", "Ahmad Fauzan Syahputra", "XII RPL 1", "Rekayasa Perangkat Lunak",
                "0812-9876-5401", "Jl. Cendrawasih No. 12, RT 02/RW 04, Kel. Sukamaju",
                "https://maps.google.com/?q=-6.2088,106.8456", "H. Syahputra, S.E", "Hj. Ratna Juwita",
                "0812-3456-7890", "0813-9876-5432", "SPMB-2023-PRESTASI-001"
            ],
            [
                "2", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                "240201", "0061234502", "Nabila Aurelia Putri", "XI MIPA 2", "MIPA",
                "0813-8899-5402", "Komplek Taman Asri Blok B3 No. 7, Kel. Melati Indah",
                "https://maps.google.com/?q=-6.2150,106.8520", "Ir. Hendra Gunawan", "Dewi Handayani, S.Pd",
                "0813-8899-1122", "0812-7766-5544", "SPMB-2024-ZONASI-042"
            ]
        ];

        const escapeCsv = (val) => {
            if (val === undefined || val === null) return '""';
            const s = String(val).replace(/"/g, '""');
            return `"${s}"`;
        };

        const csvContent = "\uFEFF" + [
            headers.map(escapeCsv).join(","),
            ...rows.map(r => r.map(escapeCsv).join(","))
        ].join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "Template_Impor_Siswa_Kesiswaan.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        App.showToast("Template CSV (.csv) berhasil diunduh.");
    },

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add("dragover");
    },

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove("dragover");
    },

    handleDropFile(e) {
        e.preventDefault();
        e.currentTarget.classList.remove("dragover");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            this.handleImportFile({ target: { files: e.dataTransfer.files } });
        }
    },

    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const statusText = document.getElementById("importFileStatusText");
        if (statusText) statusText.textContent = `Memproses: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`;

        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'xlsx' || ext === 'xls') {
            if (window.XLSX && XLSX.read) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                        this.processImportData(json);
                        if (statusText) statusText.textContent = `✅ Berhasil membaca: ${file.name} (${json.length} baris data)`;
                    } catch (err) {
                        App.showToast("Gagal membaca berkas Excel: " + err.message);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                App.showToast("Modul Excel sedang memuat. Silakan gunakan format CSV atau tempel teks.");
            }
        } else {
            // CSV / TXT
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const parsed = this.parseCsvText(text);
                    this.processImportData(parsed);
                    if (statusText) statusText.textContent = `✅ Berhasil membaca: ${file.name} (${parsed.length} baris data)`;
                } catch (err) {
                    App.showToast("Gagal membaca berkas CSV: " + err.message);
                }
            };
            reader.readAsText(file, "UTF-8");
        }
    },

    handlePasteImport(text) {
        if (!text || !text.trim()) {
            this.parsedImportRows = [];
            this.renderImportPreview([]);
            return;
        }
        const parsed = this.parseCsvText(text);
        this.processImportData(parsed);
    },

    parseCsvText(text) {
        const lines = text.trim().split(/\r\n|\n|\r/);
        if (lines.length < 2) return [];

        // Deteksi delimiter (tab atau koma atau titik-koma)
        const firstLine = lines[0];
        let delimiter = ",";
        if (firstLine.includes("\t")) delimiter = "\t";
        else if (firstLine.includes(";") && !firstLine.includes(",")) delimiter = ";";

        const parseLine = (line) => {
            const row = [];
            let inQuotes = false;
            let current = "";
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"' || char === "'") {
                    inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                    row.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
            row.push(current.trim());
            return row;
        };

        const headers = parseLine(lines[0]);
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = parseLine(lines[i]);
            const rowObj = {};
            headers.forEach((h, idx) => {
                rowObj[h] = values[idx] || "";
            });
            result.push(rowObj);
        }

        return result;
    },

    mapExcelRow(row) {
        const keys = Object.keys(row);
        const getVal = (patterns) => {
            for (const k of keys) {
                const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                for (const p of patterns) {
                    if (cleanKey === p || cleanKey.includes(p)) {
                        return row[k] !== undefined && row[k] !== null ? String(row[k]).trim() : '';
                    }
                }
            }
            return '';
        };

        return {
            no: getVal(['no', 'nomor']),
            foto: getVal(['foto', 'photo', 'gambar']),
            nis: getVal(['nis', 'nomorinduksiswa', 'induk']),
            nisn: getVal(['nisn', 'nomornis']),
            nama: getVal(['nama', 'namalengkap', 'namasiswa', 'student']),
            gender: getVal(['gender', 'jk', 'jeniskelamin', 'lp']) || 'L',
            kelas: getVal(['kelas', 'tingkat', 'class']),
            jurusan: getVal(['jurusan', 'peminatan', 'kejuruan', 'kompetensikeahlian']),
            nomorHp: getVal(['nomorhp', 'nohpsiswa', 'hpsiswa', 'telepon', 'whatsapp', 'wa']),
            alamat: getVal(['alamat', 'domisili', 'tempattinggal', 'address']),
            mapsAlamat: getVal(['mapsalamat', 'maps', 'googlemaps', 'linkmaps', 'titikmaps', 'lokasi']),
            namaOrtuBapak: getVal(['namaortubapak', 'namaayah', 'namabapak', 'bapak', 'ayah']),
            namaOrtuIbu: getVal(['namaortuibu', 'namaibu', 'ibu']),
            noHpBapak: getVal(['nohpbapak', 'hpbapak', 'teleponbapak', 'hpayah', 'nohpayah', 'wabapak']),
            noHpIbu: getVal(['nohpibu', 'hpibu', 'teleponibu', 'waibu']),
            inputSpmb: getVal(['inputspmb', 'spmb', 'jalurspmb', 'nopendaftaran', 'ppdb']),
            waliKelas: getVal(['walikelas', 'wali', 'guruwali']) || '-'
        };
    },

    processImportData(rawRows) {
        if (!rawRows || rawRows.length === 0) {
            this.parsedImportRows = [];
            this.renderImportPreview([]);
            return;
        }

        const mapped = rawRows
            .map(r => this.mapExcelRow(r))
            .filter(r => r.nisn || r.nama);

        this.parsedImportRows = mapped;
        this.renderImportPreview(mapped);

        const summary = document.getElementById("importSummaryBadge");
        const btnExec = document.getElementById("btnExecuteImport");

        if (mapped.length > 0) {
            if (summary) {
                summary.className = "status-pill pill-green";
                summary.textContent = `✅ ${mapped.length} siswa siap diimpor`;
            }
            if (btnExec) btnExec.disabled = false;
        } else {
            if (summary) {
                summary.className = "status-pill pill-yellow";
                summary.textContent = "0 data valid ditemukan";
            }
            if (btnExec) btnExec.disabled = true;
        }
    },

    renderImportPreview(rows) {
        const tbody = document.getElementById("importPreviewTableBody");
        if (!tbody) return;

        if (rows.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        Belum ada data siswa yang terbaca atau kolom NISN/Nama kosong.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rows.map((r, idx) => `
            <tr>
                <td>${r.no || (idx + 1)}</td>
                <td><span style="font-weight: 600;">${r.nis || '-'}</span></td>
                <td><strong style="color: var(--primary);">${r.nisn || '-'}</strong></td>
                <td><strong style="color: var(--text-main);">${r.nama || '-'}</strong></td>
                <td><span class="status-pill pill-gray">${r.gender || 'L'}</span></td>
                <td><span class="status-pill pill-gray">${r.kelas || '-'}</span></td>
                <td>${r.jurusan || '-'}</td>
                <td>${r.nomorHp || '-'}</td>
                <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis;">${r.alamat || '-'}</td>
                <td>${r.namaOrtuBapak || '-'}</td>
                <td>${r.namaOrtuIbu || '-'}</td>
                <td>${r.noHpBapak || '-'}</td>
                <td>${r.noHpIbu || '-'}</td>
                <td><span class="badge-spmb-pill">${r.inputSpmb || '-'}</span></td>
            </tr>
        `).join('');
    },

    handleExecuteImport() {
        if (!this.parsedImportRows || this.parsedImportRows.length === 0) {
            App.showToast("Tidak ada data siswa yang siap diimpor!");
            return;
        }

        const modeRadio = document.querySelector('input[name="radioImportMode"]:checked');
        const mode = modeRadio ? modeRadio.value : 'upsert';

        if (mode === 'replace') {
            if (!confirm("PERINGATAN: Opsi 'Gantikan Seluruh Data Siswa' akan menghapus seluruh data siswa lama. Yakin ingin melanjutkan?")) {
                return;
            }
        }

        try {
            const res = StorageManager.importStudents(this.parsedImportRows, mode);
            this.closeAllModals();

            if (AuthManager.isTeacher()) {
                AdminPortal.renderTeacherAllStudents();
                const students = StorageManager.getStudents();
                if (students.length > 0) {
                    AdminPortal.selectTargetStudent(students[0].id);
                }
            }

            App.showToast(`🎉 Sukses! ${res.total} data siswa diproses (${res.added} siswa baru, ${res.updated} diperbarui).`);
        } catch (err) {
            App.showToast("Gagal melakukan impor: " + err.message);
        }
    },

    // 4. SUPER ADMIN: PENGATURAN SEKOLAH, TULISAN, UKURAN, FONT, LOGO & TEMA
    switchSettingsTab(tabName) {
        const tabs = ['text', 'sizing', 'theme'];
        tabs.forEach(t => {
            const btn = document.getElementById(`tabBtnSettings${t.charAt(0).toUpperCase() + t.slice(1)}`);
            const pane = document.getElementById(`tabSettingsPane${t.charAt(0).toUpperCase() + t.slice(1)}`);
            if (btn) btn.classList.toggle('active', t === tabName);
            if (pane) pane.classList.toggle('active', t === tabName);
        });
    },

    resetHeaderBadgeDefault() {
        const input = document.getElementById("setSchoolHeaderBadge");
        if (input) {
            input.value = "🛡️ Portal Kesiswaan & Kedisiplinan";
            this.updateSettingsLivePreview();
        }
    },

    setLogoSizePreset(size) {
        const slider = document.getElementById("setSchoolLogoSize");
        if (slider) {
            slider.value = size;
            this.updateSettingsLivePreview();
        }
    },

    setLogoShape(shape) {
        const hidden = document.getElementById("setSchoolLogoShape");
        if (hidden) hidden.value = shape;
        const container = document.getElementById("shapeGridContainer");
        if (container) {
            const cards = container.querySelectorAll(".shape-picker-card");
            cards.forEach(c => {
                c.classList.toggle("active", c.getAttribute("data-shape") === shape);
            });
        }
        this.updateSettingsLivePreview();
    },

    updateSettingsLivePreview() {
        const nameInput = document.getElementById("setSchoolName");
        const mottoInput = document.getElementById("setSchoolMotto");
        const badgeInput = document.getElementById("setSchoolHeaderBadge");
        const logoEmojiInput = document.getElementById("setSchoolLogo");
        const logoSizeInput = document.getElementById("setSchoolLogoSize");
        const logoShapeInput = document.getElementById("setSchoolLogoShape");
        const logoBgInput = document.getElementById("setSchoolLogoBg");
        const titleSizeInput = document.getElementById("setSchoolTitleSize");
        const mottoSizeInput = document.getElementById("setSchoolMottoSize");
        const badgeSizeInput = document.getElementById("setSchoolBadgeSize");
        const fontInput = document.getElementById("setSchoolFont");
        const themeSelect = document.getElementById("setThemeColor");
        const themeCustom = document.getElementById("setThemeColorCustom");

        const schoolName = (nameInput?.value.trim()) || "SMA NEGERI 1 KREASI BANGSA";
        const schoolMotto = (mottoInput?.value.trim()) || "Berkarakter Unggul, Berprestasi Gemilang, Berbudaya Disiplin";
        const badgeText = (badgeInput?.value.trim()) || "🛡️ Portal Kesiswaan & Kedisiplinan";
        const logoEmoji = (logoEmojiInput?.value.trim()) || "🏫";
        const logoSize = parseInt(logoSizeInput?.value, 10) || 46;
        const logoShape = logoShapeInput?.value || "rounded";
        const logoBg = logoBgInput?.value || "white";
        const titleSize = titleSizeInput?.value || "normal";
        const mottoSize = mottoSizeInput?.value || "normal";
        const badgeSize = badgeSizeInput?.value || "normal";
        const font = fontInput?.value || "'Plus Jakarta Sans', sans-serif";
        const themeColor = (themeSelect?.value === "custom" ? themeCustom?.value : themeSelect?.value) || "#2563eb";

        // Update indikator badge ukuran logo
        const sizeBadge = document.getElementById("logoSizeValBadge");
        if (sizeBadge) sizeBadge.textContent = `${logoSize} px`;

        // Update Font Sample Card
        const fontSample = document.getElementById("fontSamplePreview");
        if (fontSample) fontSample.style.fontFamily = font;

        // Update Simulasi Header Navbar
        const simName = document.getElementById("simSchoolName");
        const simMotto = document.getElementById("simSchoolMotto");
        const simBadgeText = document.getElementById("simBadgeText");
        const simGuestPill = document.getElementById("simGuestPill");
        const simLogo = document.getElementById("simLogoIcon");

        const titleSizes = { small: "1.00rem", normal: "1.18rem", large: "1.38rem", xlarge: "1.58rem" };
        const mottoSizes = { small: "0.70rem", normal: "0.78rem", large: "0.88rem" };
        const badgeSizes = { small: "0.78rem", normal: "0.85rem", large: "0.95rem" };

        if (simName) {
            simName.textContent = schoolName;
            simName.style.fontFamily = font;
            simName.style.fontSize = titleSizes[titleSize] || "1.18rem";
        }

        if (simMotto) {
            simMotto.textContent = schoolMotto;
            simMotto.style.fontFamily = font;
            simMotto.style.fontSize = mottoSizes[mottoSize] || "0.78rem";
        }

        if (simBadgeText) simBadgeText.textContent = badgeText;
        if (simGuestPill) {
            simGuestPill.style.fontSize = badgeSizes[badgeSize] || "0.85rem";
            simGuestPill.style.fontFamily = font;
        }

        if (simLogo) {
            simLogo.style.width = `${logoSize}px`;
            simLogo.style.height = `${logoSize}px`;

            let radius = "12px";
            if (logoShape === "circle") radius = "50%";
            else if (logoShape === "squircle") radius = "18px";
            else if (logoShape === "square") radius = "4px";
            else radius = "12px";
            simLogo.style.borderRadius = radius;

            let bgStyle = "#ffffff";
            if (logoBg === "transparent") bgStyle = "transparent";
            else if (logoBg === "theme") bgStyle = themeColor;
            else bgStyle = "#ffffff";

            if (this.uploadedLogoUrl) {
                simLogo.innerHTML = `<img src="${this.uploadedLogoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: inherit; display: block;">`;
                simLogo.style.background = bgStyle;
                simLogo.style.border = logoBg === "transparent" ? "none" : "1px solid var(--border)";
                simLogo.style.padding = logoBg === "transparent" ? "0" : "3px";
                simLogo.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
            } else {
                const emojiFontSize = Math.max(16, Math.round(logoSize * 0.52));
                simLogo.innerHTML = `<span style="font-size: ${emojiFontSize}px; line-height: 1; display: inline-flex; align-items: center; justify-content: center;">${logoEmoji}</span>`;
                simLogo.style.background = logoBg === "white" ? "#f8fafc" : (logoBg === "theme" ? themeColor : "transparent");
                simLogo.style.border = logoBg === "transparent" ? "none" : "1px solid var(--border)";
                simLogo.style.padding = "0";
                simLogo.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
            }
        }
    },

    openSchoolSettingsModal() {
        const config = StorageManager.getConfig();

        // 1. Data Teks & Identitas
        const nameInput = document.getElementById("setSchoolName");
        const logoEmojiInput = document.getElementById("setSchoolLogo");
        const mottoInput = document.getElementById("setSchoolMotto");
        const badgeInput = document.getElementById("setSchoolHeaderBadge");
        const addressInput = document.getElementById("setSchoolAddress");
        const headmasterInput = document.getElementById("setHeadmaster");
        const headOfStudentInput = document.getElementById("setHeadOfStudent");

        if (nameInput) nameInput.value = config.schoolName || "";
        if (logoEmojiInput) logoEmojiInput.value = config.schoolLogo || "🏫";
        if (mottoInput) mottoInput.value = config.schoolMotto || "";
        if (badgeInput) badgeInput.value = config.headerBadgeText || "🛡️ Portal Kesiswaan & Kedisiplinan";
        if (addressInput) addressInput.value = config.schoolAddress || "";
        if (headmasterInput) headmasterInput.value = config.headmaster || "";
        if (headOfStudentInput) headOfStudentInput.value = config.headOfStudentAffairs || "";

        // 2. Data Ukuran & Bentuk Logo
        const logoSizeInput = document.getElementById("setSchoolLogoSize");
        if (logoSizeInput) logoSizeInput.value = config.logoSize || 46;

        const logoShape = config.logoShape || "rounded";
        const shapeHidden = document.getElementById("setSchoolLogoShape");
        if (shapeHidden) shapeHidden.value = logoShape;
        this.setLogoShape(logoShape);

        const logoBgSelect = document.getElementById("setSchoolLogoBg");
        if (logoBgSelect && config.logoBg) logoBgSelect.value = config.logoBg;

        const titleSizeSelect = document.getElementById("setSchoolTitleSize");
        if (titleSizeSelect && config.titleFontSize) titleSizeSelect.value = config.titleFontSize;

        const mottoSizeSelect = document.getElementById("setSchoolMottoSize");
        if (mottoSizeSelect && config.mottoFontSize) mottoSizeSelect.value = config.mottoFontSize;

        const badgeSizeSelect = document.getElementById("setSchoolBadgeSize");
        if (badgeSizeSelect && config.badgeFontSize) badgeSizeSelect.value = config.badgeFontSize;

        const baseScaleSelect = document.getElementById("setSchoolBaseFontScale");
        if (baseScaleSelect && config.baseFontSize) baseScaleSelect.value = config.baseFontSize;

        // 3. Tema Warna & Custom Picker
        const themeColor = config.themeColor || "#2563eb";
        const themeSelect = document.getElementById("setThemeColor");
        const themeCustom = document.getElementById("setThemeColorCustom");
        if (themeSelect) {
            let matched = false;
            for (let opt of themeSelect.options) {
                if (opt.value.toLowerCase() === themeColor.toLowerCase()) {
                    themeSelect.value = opt.value;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                themeSelect.value = "custom";
                if (themeCustom) themeCustom.style.display = "block";
            } else {
                if (themeCustom) themeCustom.style.display = "block";
            }
        }
        if (themeCustom) themeCustom.value = themeColor;

        // Font Utama Website Sekolah
        const schoolFontSelect = document.getElementById("setSchoolFont");
        if (schoolFontSelect && config.schoolFont) {
            schoolFontSelect.value = config.schoolFont;
        }

        // Efek Wallpaper Dasbor
        const wpEffectSelect = document.getElementById("setWallpaperEffect");
        if (wpEffectSelect && config.wallpaperEffect) {
            wpEffectSelect.value = config.wallpaperEffect;
        }

        // Pratinjau Logo Upload
        this.uploadedLogoUrl = config.schoolLogoUrl || "";
        const logoPreview = document.getElementById("logoPreviewImg");
        const logoBox = document.getElementById("logoPreviewBox");
        const logoFileInput = document.getElementById("setSchoolLogoFile");
        if (logoFileInput) logoFileInput.value = "";

        if (this.uploadedLogoUrl && logoPreview && logoBox) {
            logoPreview.src = this.uploadedLogoUrl;
            logoBox.style.display = "flex";
        } else if (logoBox) {
            logoBox.style.display = "none";
        }

        // Pratinjau Wallpaper Tema Dasbor
        this.uploadedDashboardBgUrl = config.dashboardBgUrl || "";
        const bgPreview = document.getElementById("bgPreviewImg");
        const bgBox = document.getElementById("bgPreviewBox");
        const bgFileInput = document.getElementById("setDashboardBgFile");
        if (bgFileInput) bgFileInput.value = "";

        if (this.uploadedDashboardBgUrl && bgPreview && bgBox) {
            bgPreview.src = this.uploadedDashboardBgUrl;
            bgBox.style.display = "flex";
        } else if (bgBox) {
            bgBox.style.display = "none";
        }

        // Buka tab pertama dan update pratinjau langsung
        this.switchSettingsTab('text');
        this.updateSettingsLivePreview();

        this.openModal("modalSchoolSettings");
    },

    handleThemeColorPresetChange() {
        const select = document.getElementById("setThemeColor");
        const custom = document.getElementById("setThemeColorCustom");
        if (!select || !custom) return;
        if (select.value === "custom") {
            custom.style.display = "block";
            custom.click();
        } else {
            custom.value = select.value;
        }
        this.updateSettingsLivePreview();
    },

    handleCustomThemeColorInput() {
        const select = document.getElementById("setThemeColor");
        if (select) select.value = "custom";
        this.updateSettingsLivePreview();
    },

    handleSaveSchoolSettings(e) {
        e.preventDefault();
        const currentConfig = StorageManager.getConfig();
        const themeSelect = document.getElementById("setThemeColor") ? document.getElementById("setThemeColor").value : "#2563eb";
        const themeCustom = document.getElementById("setThemeColorCustom") ? document.getElementById("setThemeColorCustom").value : "#2563eb";
        const finalTheme = themeSelect === "custom" ? themeCustom : themeSelect;

        const newConfig = {
            schoolName: (document.getElementById("setSchoolName")?.value.trim()) || "SiKesiswaan",
            schoolLogo: (document.getElementById("setSchoolLogo")?.value.trim()) || "🏫",
            schoolLogoUrl: this.uploadedLogoUrl !== null ? this.uploadedLogoUrl : (currentConfig.schoolLogoUrl || ""),
            dashboardBgUrl: this.uploadedDashboardBgUrl !== null ? this.uploadedDashboardBgUrl : (currentConfig.dashboardBgUrl || ""),
            schoolMotto: (document.getElementById("setSchoolMotto")?.value.trim()) || "",
            headerBadgeText: (document.getElementById("setSchoolHeaderBadge")?.value.trim()) || "🛡️ Portal Kesiswaan & Kedisiplinan",
            logoSize: parseInt(document.getElementById("setSchoolLogoSize")?.value, 10) || 46,
            logoShape: document.getElementById("setSchoolLogoShape")?.value || "rounded",
            logoBg: document.getElementById("setSchoolLogoBg")?.value || "white",
            titleFontSize: document.getElementById("setSchoolTitleSize")?.value || "normal",
            mottoFontSize: document.getElementById("setSchoolMottoSize")?.value || "normal",
            badgeFontSize: document.getElementById("setSchoolBadgeSize")?.value || "normal",
            baseFontSize: document.getElementById("setSchoolBaseFontScale")?.value || "normal",
            themeColor: finalTheme,
            schoolFont: document.getElementById("setSchoolFont") ? document.getElementById("setSchoolFont").value : "'Plus Jakarta Sans', sans-serif",
            wallpaperEffect: document.getElementById("setWallpaperEffect") ? document.getElementById("setWallpaperEffect").value : "light",
            schoolAddress: (document.getElementById("setSchoolAddress")?.value.trim()) || "",
            headmaster: (document.getElementById("setHeadmaster")?.value.trim()) || "",
            headOfStudentAffairs: (document.getElementById("setHeadOfStudent")?.value.trim()) || ""
        };

        StorageManager.updateConfig(newConfig);
        App.applyConfigBranding();
        this.closeAllModals();
        App.showToast("🎉 Pengaturan tulisan, font, logo & tema berhasil disimpan!");
    },

    // 4B. MODAL AGENDA KEGIATAN KESISWAAN (ADMIN & SUPER ADMIN)
    openActivityModal() {
        const form = document.getElementById("activityForm");
        if (form) form.reset();
        this.openModal("modalActivity");
    },

    handleActivitySubmit(e) {
        e.preventDefault();
        const nama = document.getElementById("formActivityNama").value.trim();
        const tanggal = document.getElementById("formActivityTanggal").value.trim();
        const kategori = document.getElementById("formActivityKategori").value;
        const tempat = document.getElementById("formActivityTempat").value.trim();
        const keterangan = document.getElementById("formActivityKeterangan").value.trim();

        if (!nama || !tanggal || !tempat || !keterangan) {
            App.showToast("Lengkapi seluruh formulir kegiatan kesiswaan!");
            return;
        }

        try {
            StorageManager.addActivity({
                nama,
                tanggal,
                kategori,
                tempat,
                keterangan
            });

            this.closeAllModals();
            AdminPortal.renderAdminKegiatanList();
            App.renderDashboardKegiatan();
            App.showToast(`Agenda "${nama}" berhasil ditambahkan ke kegiatan kesiswaan!`);
        } catch (err) {
            App.showToast(err.message);
        }
    },

    // 5. SUPER ADMIN: KELOLA ANGGOTA GURU & TIM KESISWAAN
    pembinaSelectedNew: [],
    pembinaSelectedEdit: [],
    customPembinaNew: [],
    customPembinaEdit: [],

    initPembinaSelector(mode, initialSelected = []) {
        const isNew = mode === 'new';
        const defaultList = (typeof DEFAULT_PEMBINA_LIST !== 'undefined') ? DEFAULT_PEMBINA_LIST : [
            "OSIS", "Dewan Ambalan", "PMR", "ROHIS", "PKS", "STUPA", "Patigeni", "Redicator", 
            "Robotika", "Kandang Barong", "SM", "English Club", "Nihongo Club", "Paduan Suara", 
            "Green School", "Voli", "Sepak Bola", "Basket", "Pencak Silat", "Taekwondo"
        ];

        const selectedSet = new Set(initialSelected.map(s => String(s).trim()).filter(Boolean));
        if (isNew) {
            this.pembinaSelectedNew = Array.from(selectedSet);
        } else {
            this.pembinaSelectedEdit = Array.from(selectedSet);
        }

        // Kumpulkan semua pilihan: default list + custom yang ada di initialSelected
        const customItems = [];
        selectedSet.forEach(item => {
            if (!defaultList.includes(item)) {
                customItems.push(item);
            }
        });

        if (isNew) {
            this.customPembinaNew = customItems;
        } else {
            this.customPembinaEdit = customItems;
        }

        this.renderPembinaChips(mode);
    },

    renderPembinaChips(mode) {
        const isNew = mode === 'new';
        const grid = document.getElementById(isNew ? "newTeacherPembinaChipsGrid" : "editTeacherPembinaChipsGrid");
        const hiddenInput = document.getElementById(isNew ? "newTeacherPokja" : "editTeacherPokja");
        if (!grid) return;

        const defaultList = (typeof DEFAULT_PEMBINA_LIST !== 'undefined') ? DEFAULT_PEMBINA_LIST : [];
        const customList = isNew ? this.customPembinaNew : this.customPembinaEdit;
        const currentSelected = isNew ? this.pembinaSelectedNew : this.pembinaSelectedEdit;

        const allItems = [...defaultList, ...customList];

        grid.innerHTML = allItems.map(item => {
            const isActive = currentSelected.includes(item);
            return `
                <div class="pembina-chip ${isActive ? 'active' : ''}" onclick="Forms.togglePembinaChip('${mode}', '${item.replace(/'/g, "\\'")}')">
                    <span>${isActive ? '✓' : '+'}</span> ${item}
                </div>
            `;
        }).join('');

        if (hiddenInput) {
            hiddenInput.value = currentSelected.join(", ");
        }
    },

    togglePembinaChip(mode, name) {
        const isNew = mode === 'new';
        let selected = isNew ? this.pembinaSelectedNew : this.pembinaSelectedEdit;
        const idx = selected.indexOf(name);

        if (idx > -1) {
            selected.splice(idx, 1);
        } else {
            selected.push(name);
        }

        if (isNew) {
            this.pembinaSelectedNew = selected;
        } else {
            this.pembinaSelectedEdit = selected;
        }

        this.renderPembinaChips(mode);
    },

    addCustomPembinaChip(mode) {
        const isNew = mode === 'new';
        const input = document.getElementById(isNew ? "newTeacherCustomPembinaInput" : "editTeacherCustomPembinaInput");
        if (!input) return;

        const val = input.value.trim();
        if (!val) return;

        const customList = isNew ? this.customPembinaNew : this.customPembinaEdit;
        const selected = isNew ? this.pembinaSelectedNew : this.pembinaSelectedEdit;

        if (!customList.includes(val)) {
            customList.push(val);
        }
        if (!selected.includes(val)) {
            selected.push(val);
        }

        if (isNew) {
            this.customPembinaNew = customList;
            this.pembinaSelectedNew = selected;
        } else {
            this.customPembinaEdit = customList;
            this.pembinaSelectedEdit = selected;
        }

        input.value = "";
        this.renderPembinaChips(mode);
    },

    openManageTeachersModal() {
        this.initPembinaSelector('new', []);
        this.renderTeachersList();
        const roleSelect = document.getElementById("newTeacherRoleSelect");
        if (roleSelect) roleSelect.value = "Waka Kesiswaan";
        this.handleNewTeacherJabatanChange();
        this.openModal("modalManageTeachers");
    },

    handleNewTeacherJabatanChange() {
        const roleSelect = document.getElementById("newTeacherRoleSelect");
        const sekbidRow = document.getElementById("newTeacherSekbidPembinaRow");
        const waliWrap = document.getElementById("newTeacherWaliKelasWrap");

        if (!roleSelect) return;
        const isWali = roleSelect.value === "Wali Kelas";

        if (sekbidRow) sekbidRow.style.display = isWali ? "none" : "grid";
        if (waliWrap) {
            waliWrap.style.display = isWali ? "block" : "none";
            if (isWali) {
                const currentTingkat = document.getElementById("newTeacherWaliTingkat")?.value;
                this.selectWaliTingkat('new', currentTingkat || 'X');
            }
        }
    },

    selectWaliTingkat(mode, tingkat) {
        const prefix = mode === 'edit' ? 'editTeacher' : 'newTeacher';
        const tingkats = ['X', 'XI', 'XII'];
        tingkats.forEach(t => {
            const btn = document.getElementById(`btnTingkat${t}_${mode}`);
            if (btn) {
                if (t === tingkat) {
                    btn.style.background = 'var(--primary)';
                    btn.style.color = '#ffffff';
                    btn.style.borderColor = 'var(--primary)';
                } else {
                    btn.style.background = mode === 'edit' ? '#ffffff' : '#f8fafc';
                    btn.style.color = 'var(--text-main)';
                    btn.style.borderColor = 'var(--border)';
                }
            }
        });

        const hiddenTingkat = document.getElementById(`${prefix}WaliTingkat`);
        if (hiddenTingkat) hiddenTingkat.value = tingkat;

        const selectKelas = document.getElementById(`${prefix}WaliKelasSelect`);
        if (selectKelas && typeof DAFTAR_WALI_KELAS_MASTER !== 'undefined') {
            const filtered = DAFTAR_WALI_KELAS_MASTER.filter(w => w.tingkat === tingkat);
            selectKelas.innerHTML = `
                <option value="">-- Pilih Kelas ${tingkat} (${filtered.length} Kelas) --</option>
                ${filtered.map(w => `
                    <option value="${w.kode}" data-nama="${w.nama}" data-username="${w.username}" data-password="${w.password}" data-label="${w.label}">
                        ${w.label || w.kode} — ${w.nama}
                    </option>
                `).join('')}
            `;
        }
    },

    handleWaliKelasSelect(mode) {
        const prefix = mode === 'edit' ? 'editTeacher' : 'newTeacher';
        const select = document.getElementById(`${prefix}WaliKelasSelect`);
        if (!select) return;
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;

        const nama = selectedOption.getAttribute('data-nama');
        const username = selectedOption.getAttribute('data-username');
        const password = selectedOption.getAttribute('data-password');

        // Auto-fill nama guru sesuai kelas
        const nameInput = document.getElementById(mode === 'edit' ? 'editTeacherName' : 'newTeacherName');
        if (nameInput && nama) nameInput.value = nama;

        // Auto-fill username (kata pertama, huruf kecil)
        const userInput = document.getElementById(mode === 'edit' ? 'editTeacherUsernameDisplay' : 'newTeacherUsername');
        if (userInput && username) userInput.value = username;

        // Auto-fill password (kata pertama + 123)
        const passInput = document.getElementById(mode === 'edit' ? 'editTeacherPassword' : 'newTeacherPassword');
        if (passInput && password) passInput.value = password;
    },

    seedAllOfficialWaliKelas() {
        if (typeof DAFTAR_WALI_KELAS_MASTER === 'undefined' || !DAFTAR_WALI_KELAS_MASTER.length) {
            App.showToast("Data master wali kelas tidak ditemukan!");
            return;
        }

        if (!confirm("Daftarkan sekaligus seluruh 60 akun Wali Kelas resmi SMK Negeri 1 Magelang (Tahun Ajaran 2026/2027)?\n\n- Username: kata pertama nama guru (huruf kecil)\n- Password: kata pertama nama + 123\n- Kelas: X, XI, XII")) {
            return;
        }

        try {
            let addedCount = 0;
            let updatedCount = 0;
            const existingTeachers = StorageManager.getTeachers();

            DAFTAR_WALI_KELAS_MASTER.forEach(w => {
                const foundIndex = existingTeachers.findIndex(t => 
                    t.username.toLowerCase() === w.username.toLowerCase() || 
                    (t.roleLabel && t.roleLabel === `Wali Kelas ${w.kode}`)
                );

                const teacherPayload = {
                    name: w.nama,
                    username: w.username,
                    password: w.password,
                    role: "guru",
                    roleLabel: `Wali Kelas ${w.kode}`,
                    sekbid: "-",
                    pembina: "-",
                    pokja: `Wali Kelas ${w.kode}`,
                    kelas: w.kode,
                    icon: "🧑‍🏫"
                };

                if (foundIndex === -1) {
                    StorageManager.addTeacher(teacherPayload);
                    addedCount++;
                } else {
                    StorageManager.updateTeacher(existingTeachers[foundIndex].username, teacherPayload);
                    updatedCount++;
                }
            });

            this.renderTeachersList();
            App.showToast(`Sukses! ${addedCount} Wali Kelas baru ditambahkan, ${updatedCount} diperbarui.`);
        } catch (err) {
            App.showToast(err.message);
        }
    },

    renderTeachersList() {
        const container = document.getElementById("teachersListContainer");
        if (!container) return;

        const teachers = StorageManager.getTeachers();

        container.innerHTML = teachers.map(t => {
            const hasSekbid = t.sekbid && t.sekbid !== "-";
            const pembinaStr = t.pembina || t.pokja || "";
            const hasPembina = pembinaStr && pembinaStr !== "-";

            return `
            <div style="background: #ffffff; border: 1px solid var(--border); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 0.65rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); transition: border-color 0.2s;" onmouseenter="this.style.borderColor='var(--primary)'" onmouseleave="this.style.borderColor='var(--border)'">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
                        <strong style="font-size: 0.98rem; color: var(--text-main);">${t.icon || '👨‍🏫'} ${t.name}</strong>
                        ${t.role === 'superadmin' ? `<span class="badge" style="background: #fef3c7; color: #92400e; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 99px;">👑 Super Admin</span>` : ''}
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 3px;">
                        Username: <strong style="color: var(--text-main);">${t.username}</strong> • Jabatan: <span style="font-weight: 600; color: var(--primary);">${t.roleLabel || t.role}</span>
                    </div>
                    ${(hasSekbid || hasPembina) ? `
                    <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap; margin-top: 0.4rem;">
                        ${hasSekbid ? `<span class="quote-pill-tag" style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">🏷️ ${t.sekbid}</span>` : ''}
                        ${hasPembina ? `<span class="quote-pill-tag" style="background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff;">🎖️ Pembina: ${pembinaStr}</span>` : ''}
                    </div>
                    ` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
                    <button type="button" class="btn btn-outline btn-sm" onclick="Forms.openEditTeacherModal('${t.username}')" style="padding: 0.38rem 0.75rem; font-weight: 600; color: var(--primary); border-color: var(--primary-light);">
                        ✏️ Edit
                    </button>
                    ${t.username !== 'admin' ? `
                        <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); padding: 0.38rem 0.65rem;" onclick="Forms.handleDeleteTeacher('${t.username}')">
                            Hapus
                        </button>
                    ` : `<span class="status-pill pill-yellow" style="font-size: 0.7rem; padding: 4px 8px;">Akun Utama</span>`}
                </div>
            </div>
            `;
        }).join('');
    },

    handleAddTeacher(e) {
        e.preventDefault();
        const name = document.getElementById("newTeacherName").value.trim();
        const rolePreset = document.getElementById("newTeacherRoleSelect").value;
        const selectedKelas = document.getElementById("newTeacherWaliKelasSelect")?.value;
        const isWali = rolePreset === "Wali Kelas";
        const roleLabel = (isWali && selectedKelas) ? `Wali Kelas ${selectedKelas}` : rolePreset;
        const role = (roleLabel.includes("Super Admin") || roleLabel.toLowerCase() === "admin") ? "superadmin" : "guru";
        const sekbid = isWali ? "-" : document.getElementById("newTeacherSekbid").value;
        const pembina = isWali ? "-" : (this.pembinaSelectedNew.join(", ") || "-");
        const username = document.getElementById("newTeacherUsername").value.trim();
        const password = document.getElementById("newTeacherPassword").value.trim();

        if (!name || !username || !password) {
            App.showToast("Nama, username, dan password guru wajib diisi!");
            return;
        }

        try {
            StorageManager.addTeacher({
                name,
                role,
                roleLabel,
                sekbid,
                pembina,
                pokja: isWali && selectedKelas ? `Wali Kelas ${selectedKelas}` : pembina,
                kelas: isWali ? selectedKelas : "-",
                username,
                password,
                icon: role === "superadmin" ? "👑" : (isWali ? "🧑‍🏫" : (roleLabel.includes("Konseling") || roleLabel.includes("BK") ? "👨‍🏫" : (roleLabel.includes("Waka") ? "👩‍💼" : "🧑‍🏫")))
            });

            document.getElementById("addTeacherForm").reset();
            this.initPembinaSelector('new', []);
            this.handleNewTeacherJabatanChange();
            this.renderTeachersList();
            App.showToast(`Guru ${name} berhasil didaftarkan.`);
        } catch (err) {
            App.showToast(err.message);
        }
    },

    openEditTeacherModal(username) {
        const teacher = StorageManager.getTeacherByUsername(username);
        if (!teacher) {
            App.showToast("Data guru tidak ditemukan!");
            return;
        }

        document.getElementById("editTeacherUsername").value = teacher.username;
        const usernameInput = document.getElementById("editTeacherUsernameDisplay");
        const helpEl = document.getElementById("editTeacherUsernameHelp");
        if (usernameInput) {
            usernameInput.value = teacher.username;
            if (teacher.username.toLowerCase() === "admin") {
                usernameInput.readOnly = true;
                usernameInput.style.background = "#f1f5f9";
                usernameInput.style.cursor = "not-allowed";
                usernameInput.title = "Username akun Super Admin utama 'admin' tidak dapat diubah demi keamanan sistem.";
                if (helpEl) helpEl.textContent = "🔒 Akun Super Admin utama 'admin' dikunci demi keamanan sistem.";
            } else {
                usernameInput.readOnly = false;
                usernameInput.style.background = "#ffffff";
                usernameInput.style.cursor = "text";
                usernameInput.title = "Ketik untuk mengganti username akun login";
                if (helpEl) helpEl.textContent = "✏️ Username dapat diubah (huruf/angka tanpa spasi).";
            }
        }
        document.getElementById("editTeacherName").value = teacher.name;
        document.getElementById("editTeacherPassword").value = teacher.password || "";
        document.getElementById("editTeacherRole").value = teacher.role || "guru";

        // Jabatan Preset / Custom / Wali Kelas
        const jabatanSelect = document.getElementById("editTeacherJabatanPreset");
        const customJabatanInput = document.getElementById("editTeacherCustomJabatan");
        let matched = false;
        if (jabatanSelect) {
            for (let opt of jabatanSelect.options) {
                if (opt.value === teacher.roleLabel || (teacher.roleLabel && teacher.roleLabel.startsWith("Wali Kelas") && opt.value === "Wali Kelas")) {
                    jabatanSelect.value = opt.value;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                jabatanSelect.value = "custom";
                if (customJabatanInput) {
                    customJabatanInput.value = teacher.roleLabel || "";
                    customJabatanInput.style.display = "block";
                }
            } else {
                if (customJabatanInput) {
                    customJabatanInput.value = "";
                    customJabatanInput.style.display = "none";
                }
            }
        }

        this.handleEditTeacherJabatanChange();

        // Jika wali kelas, pilih tingkat dan kelasnya
        if (teacher.roleLabel && teacher.roleLabel.startsWith("Wali Kelas")) {
            const rawKelas = teacher.kelas || teacher.roleLabel.replace("Wali Kelas", "").trim();
            let matchedTingkat = "X";
            if (rawKelas.startsWith("XII")) matchedTingkat = "XII";
            else if (rawKelas.startsWith("XI")) matchedTingkat = "XI";

            this.selectWaliTingkat('edit', matchedTingkat);
            const selectKelas = document.getElementById("editTeacherWaliKelasSelect");
            if (selectKelas) selectKelas.value = rawKelas;
        }

        // Sekbid
        const sekbidSelect = document.getElementById("editTeacherSekbid");
        if (sekbidSelect) {
            sekbidSelect.value = teacher.sekbid || "-";
        }

        // Pembina chips (bisa pilih lebih dari 1)
        const currentPembinaRaw = teacher.pembina || teacher.pokja || "";
        const parsedPembinaList = currentPembinaRaw
            ? currentPembinaRaw.split(",").map(s => s.trim()).filter(s => s && s !== "-")
            : [];
        this.initPembinaSelector('edit', parsedPembinaList);

        this.openModal("modalEditTeacher");
    },

    handleEditTeacherJabatanChange() {
        const select = document.getElementById("editTeacherJabatanPreset");
        const customInput = document.getElementById("editTeacherCustomJabatan");
        const roleSelect = document.getElementById("editTeacherRole");
        const sekbidRow = document.getElementById("editTeacherSekbidPembinaRow");
        const waliWrap = document.getElementById("editTeacherWaliKelasWrap");

        if (select && customInput) {
            if (select.value === "custom") {
                customInput.style.display = "block";
                customInput.focus();
            } else {
                customInput.style.display = "none";
            }

            if ((select.value.includes("Super Admin") || select.value === "Admin") && roleSelect) {
                roleSelect.value = "superadmin";
            }
        }

        const isWali = select && select.value === "Wali Kelas";
        if (sekbidRow) sekbidRow.style.display = isWali ? "none" : "block";
        if (waliWrap) {
            waliWrap.style.display = isWali ? "block" : "none";
            if (isWali) {
                const currentTingkat = document.getElementById("editTeacherWaliTingkat")?.value;
                this.selectWaliTingkat('edit', currentTingkat || 'X');
            }
        }
    },

    handleSaveEditTeacher(e) {
        e.preventDefault();
        const oldUsername = document.getElementById("editTeacherUsername").value;
        const newUsername = (document.getElementById("editTeacherUsernameDisplay")?.value || oldUsername).trim();
        const name = document.getElementById("editTeacherName").value.trim();
        const presetJabatan = document.getElementById("editTeacherJabatanPreset").value;
        const customJabatan = document.getElementById("editTeacherCustomJabatan").value.trim();
        const selectedKelas = document.getElementById("editTeacherWaliKelasSelect")?.value;
        const isWali = presetJabatan === "Wali Kelas";

        let roleLabel;
        if (isWali) {
            roleLabel = selectedKelas ? `Wali Kelas ${selectedKelas}` : "Wali Kelas";
        } else if (presetJabatan === "custom" && customJabatan) {
            roleLabel = customJabatan;
        } else {
            roleLabel = presetJabatan === "custom" ? "Staf Kesiswaan" : presetJabatan;
        }

        const role = document.getElementById("editTeacherRole").value;
        const sekbid = isWali ? "-" : document.getElementById("editTeacherSekbid").value;
        const pembina = isWali ? "-" : (this.pembinaSelectedEdit.join(", ") || "-");
        const password = document.getElementById("editTeacherPassword").value.trim();

        if (!newUsername || !name || !password) {
            App.showToast("Username, nama, dan password guru wajib diisi!");
            return;
        }

        try {
            const updatedTeacher = StorageManager.updateTeacher(oldUsername, {
                username: newUsername,
                name,
                role,
                roleLabel,
                sekbid,
                pembina,
                pokja: isWali && selectedKelas ? `Wali Kelas ${selectedKelas}` : pembina,
                kelas: isWali ? selectedKelas : "-",
                password,
                icon: role === "superadmin" ? "👑" : (isWali ? "🧑‍🏫" : (roleLabel.includes("Konseling") || roleLabel.includes("BK") ? "👨‍🏫" : (roleLabel.includes("Waka") ? "👩‍💼" : "🧑‍🏫")))
            });

            // Sinkronkan sesi jika yang diedit adalah akun yang sedang aktif login
            if (AuthManager.currentUser && AuthManager.currentUser.username.toLowerCase() === oldUsername.toLowerCase()) {
                AuthManager.currentUser.username = updatedTeacher.username;
                AuthManager.currentUser.name = name;
                AuthManager.currentUser.role = role;
                AuthManager.currentUser.roleLabel = roleLabel;
                sessionStorage.setItem("kesiswaan_auth_session", JSON.stringify(AuthManager.currentUser));
                AuthManager.notifyListeners();
            }

            this.closeModal("modalEditTeacher");
            this.renderTeachersList();
            App.showToast(`Data guru ${name} (${updatedTeacher.username}) berhasil diperbarui!`);
        } catch (err) {
            App.showToast(err.message);
        }
    },

    handleDeleteTeacher(username) {
        if (confirm(`Yakin ingin menghapus akun guru ${username}?`)) {
            try {
                StorageManager.deleteTeacher(username);
                this.renderTeachersList();
                App.showToast("Akun guru berhasil dihapus.");
            } catch (err) {
                App.showToast(err.message);
            }
        }
    },

    // 6. SUPER ADMIN: KELOLA KATA MUTIARA
    openManageQuotesModal() {
        this.renderQuotesList();
        this.updateQuoteLivePreview();
        this.openModal("modalManageQuotes");
    },

    handleQuoteThemeChange() {
        const themeSelect = document.getElementById("newQuoteWarna");
        const customInput = document.getElementById("newQuoteCustomColor");
        if (themeSelect && customInput) {
            if (themeSelect.value === "custom") {
                customInput.style.display = "block";
                customInput.click();
            } else {
                customInput.style.display = "none";
            }
        }
        this.updateQuoteLivePreview();
    },

    updateQuoteLivePreview() {
        const textElem = document.getElementById("newQuoteText");
        const authorElem = document.getElementById("newQuoteAuthor");
        const kategoriElem = document.getElementById("newQuoteKategori");
        const warnaElem = document.getElementById("newQuoteWarna");
        const customColorElem = document.getElementById("newQuoteCustomColor");
        const fontElem = document.getElementById("newQuoteFont");
        const efekElem = document.getElementById("newQuoteEfek");

        const previewCard = document.getElementById("quoteLivePreviewCard");
        const prevBadge = document.getElementById("prevQuoteBadge");
        const prevText = document.getElementById("prevQuoteText");
        const prevAuthor = document.getElementById("prevQuoteAuthor");

        if (!previewCard || !prevText || !prevAuthor) return;

        const textVal = (textElem && textElem.value.trim()) || "Disiplin adalah jembatan antara cita-cita mulia dan pencapaian yang nyata.";
        const authorVal = (authorElem && authorElem.value.trim()) || "Ki Hajar Dewantara";
        const kategoriVal = (kategoriElem && kategoriElem.value) || "💡 Kata Mutiara & Motivasi Hari Ini";
        const warnaVal = (warnaElem && warnaElem.value) || "ocean";
        const fontVal = (fontElem && fontElem.value) || "playfair";
        const efekVal = (efekElem && efekElem.value) || "all";

        prevText.textContent = `"${textVal}"`;
        prevAuthor.textContent = `— ${authorVal}`;
        if (prevBadge) prevBadge.textContent = kategoriVal;

        // Reset classes
        previewCard.className = "quote-card";
        prevText.className = "quote-text";

        // Apply theme color
        if (warnaVal === "custom" && customColorElem) {
            previewCard.style.background = customColorElem.value;
            previewCard.style.border = "1px solid rgba(255, 255, 255, 0.35)";
        } else {
            previewCard.style.background = "";
            previewCard.style.border = "";
            previewCard.classList.add(`quote-theme-${warnaVal}`);
        }

        // Apply font
        prevText.classList.add(`quote-font-${fontVal}`);

        // Apply effects
        if (efekVal === "all") {
            previewCard.classList.add("quote-fx-all", "quote-fx-glow", "quote-fx-shimmer", "quote-fx-float");
        } else if (efekVal !== "none") {
            previewCard.classList.add(`quote-fx-${efekVal}`);
        }
    },

    renderQuotesList() {
        const container = document.getElementById("quotesListContainer");
        if (!container) return;

        const quotes = StorageManager.getQuotes();

        const themeLabels = {
            ocean: "🌊 Ocean",
            gold: "👑 Gold",
            emerald: "🌿 Emerald",
            purple: "🔮 Amethyst",
            ruby: "🍷 Ruby",
            sunset: "🌅 Sunset",
            dark: "🌌 Midnight",
            glass: "💎 Glass",
            custom: "🎨 Kustom"
        };

        const fontLabels = {
            playfair: "📜 Playfair (Serif)",
            caveat: "✒️ Caveat (Handwriting)",
            merriweather: "📖 Merriweather",
            cinzel: "🏛️ Cinzel",
            outfit: "💎 Outfit",
            jakarta: "🎯 Jakarta Sans"
        };

        const efekLabels = {
            all: "🌟 Komplet",
            glow: "✨ Glow",
            watermark: "❝ ❞ Watermark",
            shimmer: "💫 Shimmer",
            float: "🪟 3D Hover",
            neon: "⚡ Neon",
            none: "Standar"
        };

        container.innerHTML = quotes.map((q, idx) => {
            const warnaKey = q.warna || "ocean";
            const fontKey = q.font || "playfair";
            const efekKey = q.efek || "all";
            const kategori = q.kategori || "💡 Kata Mutiara";

            return `
            <div style="background: #ffffff; border: 1px solid var(--border); border-radius: 10px; padding: 0.75rem 0.9rem; margin-bottom: 0.55rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); transition: border-color 0.2s;" onmouseenter="this.style.borderColor='var(--primary)'" onmouseleave="this.style.borderColor='var(--border)'">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; gap: 0.3rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.35rem;">
                        <span class="quote-pill-tag" style="background: #eff6ff; color: #1d4ed8;">${kategori}</span>
                        <span class="quote-pill-tag" style="background: #f1f5f9; color: #334155;">${themeLabels[warnaKey] || warnaKey}</span>
                        <span class="quote-pill-tag" style="background: #f8fafc; color: #475569;">${fontLabels[fontKey] || fontKey}</span>
                        ${efekKey !== "none" ? `<span class="quote-pill-tag" style="background: #fef3c7; color: #92400e;">${efekLabels[efekKey] || efekKey}</span>` : ''}
                    </div>
                    <div class="quote-font-${fontKey}" style="font-size: 0.95rem; color: var(--text-main); line-height: 1.4; word-break: break-word;">
                        "${q.quote}"
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-top: 3px;">
                        — ${q.tokoh}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
                    <button type="button" class="btn btn-outline btn-sm" title="Tampilkan di Dasbor Sekarang" onclick="Forms.previewQuoteOnDashboard(${idx})" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">
                        👁️ Tampilkan
                    </button>
                    ${quotes.length > 1 ? `
                        <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); padding: 0.35rem 0.55rem;" title="Hapus Kata Mutiara" onclick="Forms.handleDeleteQuote(${idx})">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
            `;
        }).join('');
    },

    previewQuoteOnDashboard(index) {
        App.displayQuote(index);
        App.showToast("Kata mutiara kini aktif ditampilkan di dasbor utama!");
    },

    handleAddQuote(e) {
        e.preventDefault();
        const quote = document.getElementById("newQuoteText").value.trim();
        const tokoh = document.getElementById("newQuoteAuthor").value.trim();
        const kategori = document.getElementById("newQuoteKategori") ? document.getElementById("newQuoteKategori").value : "💡 Kata Mutiara & Motivasi Hari Ini";
        const warna = document.getElementById("newQuoteWarna") ? document.getElementById("newQuoteWarna").value : "ocean";
        const customColor = document.getElementById("newQuoteCustomColor") ? document.getElementById("newQuoteCustomColor").value : "";
        const font = document.getElementById("newQuoteFont") ? document.getElementById("newQuoteFont").value : "playfair";
        const efek = document.getElementById("newQuoteEfek") ? document.getElementById("newQuoteEfek").value : "all";

        if (!quote || !tokoh) {
            App.showToast("Kutipan dan tokoh wajib diisi!");
            return;
        }

        StorageManager.addQuote({
            quote,
            tokoh,
            kategori,
            warna,
            customColor: warna === "custom" ? customColor : "",
            font,
            efek
        });

        document.getElementById("addQuoteForm").reset();
        const customInput = document.getElementById("newQuoteCustomColor");
        if (customInput) customInput.style.display = "none";

        this.renderQuotesList();
        this.updateQuoteLivePreview();
        App.displayQuote(0); // langsung tampilkan kutipan baru yang baru saja ditambahkan di dasbor
        App.showToast("Kata mutiara baru dengan desain khusus berhasil ditambahkan!");
    },

    handleDeleteQuote(index) {
        StorageManager.deleteQuote(index);
        this.renderQuotesList();
        this.updateQuoteLivePreview();
        App.displayQuote();
        App.showToast("Kata mutiara dihapus.");
    },

    // 7. SUPER ADMIN: KELOLA JENIS PELANGGARAN & RENTANGAN ATURAN SANKSI
    openManageViolationsRulesModal() {
        if (!AuthManager.isSuperAdmin()) {
            App.showToast("Fitur ini khusus untuk Super Admin!");
            return;
        }

        this.editingViolationMasterId = null;
        this.editingRuleIndex = null;
        this.switchViolationsRulesSubTab('violations');
        this.renderViolationsMasterList();
        this.renderRulesList();
        this.openModal("modalManageViolationsRules");
    },

    switchViolationsRulesSubTab(tabName) {
        const btnV = document.getElementById("tabBtnManageViolations");
        const btnR = document.getElementById("tabBtnManageRules");
        const btnS = document.getElementById("tabBtnManageSurat");
        const paneV = document.getElementById("subPaneManageViolations");
        const paneR = document.getElementById("subPaneManageRules");
        const paneS = document.getElementById("subPaneManageSurat");

        if (btnV) btnV.classList.toggle("active", tabName === "violations");
        if (btnR) btnR.classList.toggle("active", tabName === "rules");
        if (btnS) btnS.classList.toggle("active", tabName === "surat");

        if (paneV) paneV.style.display = tabName === "violations" ? "block" : "none";
        if (paneR) paneR.style.display = tabName === "rules" ? "block" : "none";
        if (paneS) paneS.style.display = tabName === "surat" ? "block" : "none";

        if (tabName === "surat") {
            this.renderSuratTemplateForm();
        }
    },

    editingViolationMasterId: null,

    renderViolationsMasterList() {
        const container = document.getElementById("violationsMasterListContainer");
        if (!container) return;

        const list = StorageManager.getViolationsMaster();
        if (list.length === 0) {
            container.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Belum ada jenis pelanggaran terdaftar.</div>`;
            return;
        }

        container.innerHTML = list.map((v) => {
            if (this.editingViolationMasterId === v.id) {
                return `
                    <div style="background: #f8fafc; border: 2px solid var(--primary); border-radius: 6px; padding: 0.75rem; margin-bottom: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">✏️ Edit Jenis Pelanggaran & Poin</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">Maks. 150 Poin</span>
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <label style="display: block; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.2rem; color: var(--text-main);">Jenis / Nama Pelanggaran *</label>
                            <input type="text" id="editViolationName_${v.id}" class="form-control-clean" value="${(v.nama || '').replace(/"/g, '&quot;')}" placeholder="Nama pelanggaran" required style="width: 100%; font-size: 0.85rem;">
                        </div>
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.6rem;">
                            <div style="flex: 2;">
                                <label style="display: block; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.2rem; color: var(--text-main);">Kategori</label>
                                <select id="editViolationKategori_${v.id}" class="form-control-clean" style="width: 100%; font-size: 0.85rem;">
                                    <option value="Kedisiplinan" ${v.kategori === 'Kedisiplinan' ? 'selected' : ''}>Kedisiplinan</option>
                                    <option value="Kerapian" ${v.kategori === 'Kerapian' ? 'selected' : ''}>Kerapian</option>
                                    <option value="Etika" ${v.kategori === 'Etika' ? 'selected' : ''}>Etika & Sopan Santun</option>
                                    <option value="Berat" ${v.kategori === 'Berat' ? 'selected' : ''}>Pelanggaran Berat</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.2rem; color: var(--text-main);">Bobot Poin (1-150) *</label>
                                <input type="number" id="editViolationPoints_${v.id}" class="form-control-clean" min="1" max="150" value="${v.poin}" required style="width: 100%; font-size: 0.85rem;">
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 0.4rem;">
                            <button type="button" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 0.8rem;" onclick="Forms.handleCancelEditViolationMaster()">
                                Batal
                            </button>
                            <button type="button" class="btn btn-primary btn-sm" style="padding: 4px 12px; font-size: 0.8rem;" onclick="Forms.handleSaveEditViolationMaster('${v.id}')">
                                💾 Simpan Perubahan
                            </button>
                        </div>
                    </div>
                `;
            }

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: #ffffff; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 0.4rem;">
                    <div style="flex: 1; padding-right: 0.5rem;">
                        <strong style="font-size: 0.9rem; color: var(--text-main); display: block; line-height: 1.3;">${v.nama}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Kategori: ${v.kategori || 'Kedisiplinan'}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
                        <span class="status-pill pill-red" style="font-size: 0.75rem; font-weight: 700;">+${v.poin} Poin</span>
                        <button type="button" class="btn btn-outline btn-sm" style="color: var(--primary); border-color: var(--primary); padding: 3px 8px; font-size: 0.75rem;" onclick="Forms.handleStartEditViolationMaster('${v.id}')" title="Edit jenis pelanggaran & poin">
                            ✏️ Edit
                        </button>
                        ${list.length > 1 ? `
                            <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); padding: 3px 8px; font-size: 0.75rem;" onclick="Forms.handleDeleteViolationMaster('${v.id}')" title="Hapus dari katalog">
                                🗑️ Hapus
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    handleStartEditViolationMaster(id) {
        this.editingViolationMasterId = id;
        this.renderViolationsMasterList();
        setTimeout(() => {
            const el = document.getElementById(`editViolationName_${id}`);
            if (el) {
                el.focus();
                el.select();
            }
        }, 50);
    },

    handleCancelEditViolationMaster() {
        this.editingViolationMasterId = null;
        this.renderViolationsMasterList();
    },

    handleSaveEditViolationMaster(id) {
        const inputNama = document.getElementById(`editViolationName_${id}`);
        const inputKategori = document.getElementById(`editViolationKategori_${id}`);
        const inputPoin = document.getElementById(`editViolationPoints_${id}`);

        if (!inputNama || !inputPoin) return;

        const nama = inputNama.value.trim();
        const kategori = inputKategori ? inputKategori.value : "Kedisiplinan";
        const poin = Number(inputPoin.value);

        if (!nama) {
            App.showToast("Nama jenis pelanggaran wajib diisi!");
            inputNama.focus();
            return;
        }

        if (isNaN(poin) || poin < 1 || poin > 150) {
            App.showToast("Bobot poin harus antara 1 sampai 150!");
            inputPoin.focus();
            return;
        }

        const updated = StorageManager.updateViolationMaster(id, { nama, kategori, poin });
        if (updated) {
            this.editingViolationMasterId = null;
            this.renderViolationsMasterList();
            this.populateDropdowns();
            App.showToast(`Jenis pelanggaran "${nama}" (${poin} Poin) berhasil diperbarui.`);
        } else {
            App.showToast("Gagal memperbarui data jenis pelanggaran.");
        }
    },

    handleAddViolationMaster(e) {
        e.preventDefault();
        const nama = document.getElementById("newViolationName").value.trim();
        const kategori = document.getElementById("newViolationKategori").value;
        const poin = Number(document.getElementById("newViolationPoints").value);

        if (!nama) {
            App.showToast("Nama pelanggaran wajib diisi!");
            return;
        }
        if (isNaN(poin) || poin < 1 || poin > 150) {
            App.showToast("Bobot poin harus antara 1 sampai 150!");
            return;
        }

        StorageManager.addViolationMaster({ nama, kategori, poin });
        document.getElementById("addViolationMasterForm").reset();
        document.getElementById("newViolationPoints").value = "10";

        this.renderViolationsMasterList();
        this.populateDropdowns();
        App.showToast(`Jenis pelanggaran "${nama}" (${poin} Poin) berhasil ditambahkan ke katalog resmi.`);
    },

    handleDeleteViolationMaster(id) {
        if (!confirm("Hapus jenis pelanggaran ini dari katalog resmi?")) return;

        if (this.editingViolationMasterId === id) {
            this.editingViolationMasterId = null;
        }

        StorageManager.deleteViolationMaster(id);
        this.renderViolationsMasterList();
        this.populateDropdowns();
        App.showToast("Jenis pelanggaran berhasil dihapus.");
    },

    editingRuleIndex: null,

    renderRulesList() {
        const container = document.getElementById("rulesListContainer");
        if (!container) return;

        const rules = StorageManager.getRules();
        if (rules.length === 0) {
            container.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Belum ada aturan rentang poin sanksi terdaftar.</div>`;
            return;
        }

        container.innerHTML = rules.map((r, idx) => {
            if (this.editingRuleIndex === idx) {
                return `
                    <div style="background: #f8fafc; border: 2px solid var(--primary); border-radius: 8px; padding: 0.85rem; margin-bottom: 0.65rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-size: 0.82rem; font-weight: 700; color: var(--primary);">✏️ Edit Rentang Poin & Sanksi #${idx + 1}</span>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">(Gunakan 9999 untuk tanpa batas / ∞)</span>
                        </div>
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 0.35rem;">
                                <label style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0;">Min Poin:</label>
                                <input type="number" id="editRuleMinPoint_${idx}" class="form-control-clean" min="0" value="${r.minPoint}" required style="width: 75px; font-size: 0.85rem; padding: 4px 8px;">
                                <span style="font-size: 0.8rem; font-weight: 600;">-</span>
                                <label style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0;">Max Poin:</label>
                                <input type="number" id="editRuleMaxPoint_${idx}" class="form-control-clean" min="1" value="${r.maxPoint >= 9999 ? 9999 : r.maxPoint}" required style="width: 75px; font-size: 0.85rem; padding: 4px 8px;" title="9999 = tanpa batas (∞)">
                            </div>
                            <div style="flex: 1; min-width: 140px;">
                                <select id="editRuleBadgeClass_${idx}" class="form-control-clean" style="width: 100%; font-size: 0.85rem; padding: 4px 8px;">
                                    <option value="pill-green" ${r.badgeClass === 'pill-green' ? 'selected' : ''}>🟢 Hijau (Aman/Ringan)</option>
                                    <option value="pill-yellow" ${r.badgeClass === 'pill-yellow' ? 'selected' : ''}>🟡 Kuning (Peringatan/Ortu)</option>
                                    <option value="pill-red" ${r.badgeClass === 'pill-red' ? 'selected' : ''}>🔴 Merah (SP/Skorsing/Keras)</option>
                                </select>
                            </div>
                            <div style="flex: 2; min-width: 180px;">
                                <input type="text" id="editRuleStatus_${idx}" class="form-control-clean" value="${(r.status || '').replace(/"/g, '&quot;')}" placeholder="Nama Status Tingkatan" required style="width: 100%; font-size: 0.85rem; padding: 4px 8px;">
                            </div>
                        </div>
                        <div style="margin-bottom: 0.6rem;">
                            <label style="display: block; font-size: 0.75rem; font-weight: 600; margin-bottom: 2px;">Tindak Lanjut & Sanksi Otomatis:</label>
                            <input type="text" id="editRuleAction_${idx}" class="form-control-clean" value="${(r.action || r.tindakLanjut || '').replace(/"/g, '&quot;')}" placeholder="Sanksi / Tindak lanjut otomatis..." required style="width: 100%; font-size: 0.85rem; padding: 6px 10px;">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 0.4rem;">
                            <button type="button" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 0.8rem;" onclick="Forms.handleCancelEditRule()">
                                Batal
                            </button>
                            <button type="button" class="btn btn-primary btn-sm" style="padding: 4px 12px; font-size: 0.8rem;" onclick="Forms.handleSaveEditRule(${idx})">
                                💾 Simpan Rentang & Sanksi
                            </button>
                        </div>
                    </div>
                `;
            }

            return `
                <div style="background: #ffffff; border: 1px solid var(--border); border-radius: 8px; padding: 0.85rem; margin-bottom: 0.65rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.4rem;">
                        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                            <span class="status-pill ${r.badgeClass || 'pill-green'}" style="font-weight: 700; font-size: 0.8rem;">
                                ${r.minPoint} - ${r.maxPoint >= 9999 ? '∞' : r.maxPoint} Poin
                            </span>
                            <strong style="font-size: 0.9rem; color: var(--text-main);">${r.status}</strong>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <span style="font-size: 0.72rem; color: var(--text-muted); margin-right: 0.2rem;">Rentang Poin #${idx + 1}</span>
                            <button type="button" class="btn btn-outline btn-sm" style="color: var(--primary); border-color: var(--primary); padding: 2px 7px; font-size: 0.75rem;" onclick="Forms.handleStartEditRule(${idx})" title="Edit rentang poin, status & sanksi">
                                ✏️ Edit Rentang
                            </button>
                            ${rules.length > 1 ? `
                                <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); padding: 2px 7px; font-size: 0.75rem;" onclick="Forms.handleDeleteRule(${idx})" title="Hapus aturan rentang ini">
                                    🗑️ Hapus
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <input type="text" id="ruleActionInput_${idx}" class="form-control-clean" value="${(r.action || r.tindakLanjut || '').replace(/"/g, '&quot;')}" style="flex: 1; font-size: 0.85rem; font-weight: 500;" placeholder="Sanksi / Tindak lanjut otomatis...">
                        <button type="button" class="btn btn-primary btn-sm" onclick="Forms.handleSaveRuleRow(${idx})" style="white-space: nowrap; padding: 0.45rem 0.85rem;">
                            💾 Simpan Sanksi
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    handleStartEditRule(index) {
        this.editingRuleIndex = index;
        this.renderRulesList();
        setTimeout(() => {
            const input = document.getElementById(`editRuleStatus_${index}`);
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    },

    handleCancelEditRule() {
        this.editingRuleIndex = null;
        this.renderRulesList();
    },

    handleSaveEditRule(index) {
        const minInput = document.getElementById(`editRuleMinPoint_${index}`);
        const maxInput = document.getElementById(`editRuleMaxPoint_${index}`);
        const badgeInput = document.getElementById(`editRuleBadgeClass_${index}`);
        const statusInput = document.getElementById(`editRuleStatus_${index}`);
        const actionInput = document.getElementById(`editRuleAction_${index}`);

        if (!minInput || !maxInput || !statusInput || !actionInput) return;

        const minPoint = Number(minInput.value);
        const maxPoint = Number(maxInput.value);
        const badgeClass = badgeInput ? badgeInput.value : "pill-yellow";
        const status = statusInput.value.trim();
        const action = actionInput.value.trim();

        if (isNaN(minPoint) || minPoint < 0) {
            App.showToast("Batas minimum poin harus angka >= 0!");
            minInput.focus();
            return;
        }

        if (isNaN(maxPoint) || maxPoint < minPoint) {
            App.showToast("Batas maksimum poin harus berupa angka dan lebih besar atau sama dengan batas minimum!");
            maxInput.focus();
            return;
        }

        if (!status) {
            App.showToast("Nama status tingkatan tidak boleh kosong!");
            statusInput.focus();
            return;
        }

        if (!action) {
            App.showToast("Tindak lanjut / sanksi otomatis tidak boleh kosong!");
            actionInput.focus();
            return;
        }

        StorageManager.updateRule(index, { minPoint, maxPoint, badgeClass, status, action });
        this.editingRuleIndex = null;
        this.renderRulesList();
        App.showToast(`Rentang poin & sanksi "${status}" berhasil diperbarui!`);
    },

    handleAddRule(e) {
        e.preventDefault();
        const minInput = document.getElementById("newRuleMinPoint");
        const maxInput = document.getElementById("newRuleMaxPoint");
        const badgeInput = document.getElementById("newRuleBadgeClass");
        const statusInput = document.getElementById("newRuleStatus");
        const actionInput = document.getElementById("newRuleAction");

        if (!minInput || !maxInput || !statusInput || !actionInput) return;

        const minPoint = Number(minInput.value);
        const maxPoint = Number(maxInput.value);
        const badgeClass = badgeInput ? badgeInput.value : "pill-yellow";
        const status = statusInput.value.trim();
        const action = actionInput.value.trim();

        if (isNaN(minPoint) || minPoint < 0) {
            App.showToast("Batas minimum poin harus angka >= 0!");
            minInput.focus();
            return;
        }

        if (isNaN(maxPoint) || maxPoint < minPoint) {
            App.showToast("Batas maksimum poin harus lebih besar atau sama dengan batas minimum!");
            maxInput.focus();
            return;
        }

        if (!status) {
            App.showToast("Nama status tingkatan sanksi wajib diisi!");
            statusInput.focus();
            return;
        }

        if (!action) {
            App.showToast("Tindak lanjut dan sanksi wajib diisi!");
            actionInput.focus();
            return;
        }

        StorageManager.addRule({ minPoint, maxPoint, badgeClass, status, action });
        document.getElementById("addRuleForm").reset();
        this.editingRuleIndex = null;
        this.renderRulesList();
        App.showToast(`Aturan rentang "${status}" (${minPoint}-${maxPoint >= 9999 ? '∞' : maxPoint} Poin) berhasil ditambahkan!`);
    },

    handleDeleteRule(index) {
        const rules = StorageManager.getRules();
        const r = rules[index];
        const statusName = r ? r.status : `#${index + 1}`;

        if (!confirm(`Hapus aturan rentang sanksi "${statusName}"?`)) return;

        if (this.editingRuleIndex === index) {
            this.editingRuleIndex = null;
        }

        StorageManager.deleteRule(index);
        this.renderRulesList();
        App.showToast(`Aturan rentang sanksi "${statusName}" berhasil dihapus.`);
    },

    handleResetRulesToDefault() {
        if (!confirm("Kembalikan seluruh susunan rentang poin & sanksi otomatis ke konfigurasi standar sekolah?")) return;

        StorageManager.resetRulesToDefault();
        this.editingRuleIndex = null;
        this.renderRulesList();
        App.showToast("Seluruh aturan rentang poin & sanksi berhasil dikembalikan ke standar awal.");
    },

    handleSaveRuleRow(index) {
        const input = document.getElementById(`ruleActionInput_${index}`);
        if (!input) return;

        const newAction = input.value.trim();
        if (!newAction) {
            App.showToast("Teks sanksi tidak boleh kosong!");
            return;
        }

        const rules = StorageManager.getRules();
        if (rules[index]) {
            rules[index].action = newAction;
            rules[index].tindakLanjut = newAction;
            StorageManager.updateRules(rules);
            App.showToast(`Sanksi rentang poin ${rules[index].minPoint}-${rules[index].maxPoint >= 9999 ? '∞' : rules[index].maxPoint} berhasil diperbarui!`);
        }
    },

    // 8. TEMPLATE SURAT PANGGILAN ORANG TUA (SUPER ADMIN)
    renderSuratTemplateForm() {
        const t = StorageManager.getSuratTemplate();
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val !== undefined ? val : "";
        };

        setVal("setSuratKopInstansi", t.kopInstansi);
        setVal("setSuratNomorFormat", t.nomorFormat);
        setVal("setSuratPerihal", t.perihal);
        setVal("setSuratHariKerjaOffset", t.hariKerjaOffset);
        setVal("setSuratWaktu", t.waktu);
        setVal("setSuratTempat", t.tempat);
        setVal("setSuratPembuka", t.pembuka);
        setVal("setSuratPenutup", t.penutup);
        setVal("setSuratPejabatKiriJabatan", t.pejabatKiriJabatan);
        setVal("setSuratPejabatKiriNama", t.pejabatKiriNama);
        setVal("setSuratPejabatKananJabatan", t.pejabatKananJabatan);
        setVal("setSuratPejabatKananNama", t.pejabatKananNama);
    },

    handleSaveSuratTemplate(e) {
        e.preventDefault();
        const getVal = (id) => document.getElementById(id)?.value?.trim() || "";

        const updated = {
            kopInstansi: getVal("setSuratKopInstansi"),
            nomorFormat: getVal("setSuratNomorFormat"),
            perihal: getVal("setSuratPerihal"),
            hariKerjaOffset: Number(document.getElementById("setSuratHariKerjaOffset")?.value) || 2,
            waktu: getVal("setSuratWaktu"),
            tempat: getVal("setSuratTempat"),
            pembuka: getVal("setSuratPembuka"),
            penutup: getVal("setSuratPenutup"),
            pejabatKiriJabatan: getVal("setSuratPejabatKiriJabatan"),
            pejabatKiriNama: getVal("setSuratPejabatKiriNama"),
            pejabatKananJabatan: getVal("setSuratPejabatKananJabatan"),
            pejabatKananNama: getVal("setSuratPejabatKananNama")
        };

        StorageManager.updateSuratTemplate(updated);
        App.showToast("Format Surat Panggilan Ortu berhasil disimpan oleh Super Admin!");
    },

    resetSuratTemplateToDefault() {
        if (!confirm("Kembalikan format surat panggilan orang tua ke konfigurasi standar sekolah?")) return;
        StorageManager.updateSuratTemplate(DEFAULT_SURAT_TEMPLATE);
        this.renderSuratTemplateForm();
        App.showToast("Format surat panggilan berhasil dikembalikan ke standar.");
    },

    // 9. MODAL & PRATINJAU SURAT PANGGILAN ORANG TUA (DOC / PDF)
    currentSuratStudentId: null,

    openSuratPanggilanModal(studentId) {
        const student = StorageManager.getStudentById(studentId);
        if (!student) {
            App.showToast("Siswa tidak ditemukan.");
            return;
        }

        if (!StorageManager.isStudentEligibleForSummons(student)) {
            App.showToast("Siswa belum memenuhi batas SP (<31 Poin) untuk penerbitan surat panggilan orang tua.");
            return;
        }

        this.currentSuratStudentId = student.id;
        const status = StorageManager.calculateStudentStatus(student);

        const subTitle = document.getElementById("modalSuratPanggilanSub");
        if (subTitle) {
            subTitle.textContent = `Panggilan Orang Tua untuk: ${student.nama} • Status: ${status.statusText} (${status.totalPoinPelanggaran} Poin Pelanggaran)`;
        }

        const preview = document.getElementById("previewSuratContainer");
        if (preview) {
            preview.innerHTML = this.generateSuratPanggilanHtml(student, false);
        }

        this.openModal("modalSuratPanggilan");
    },

    generateSuratPanggilanHtml(student, isForDoc = false) {
        const template = StorageManager.getSuratTemplate();
        const config = StorageManager.getConfig();
        const status = StorageManager.calculateStudentStatus(student);

        const nomorSurat = (template.nomorFormat || "421.3 / {NOMOR} / KESISWAAN / {TAHUN}")
            .replace("{NOMOR}", String(Math.floor(100 + Math.random() * 900)))
            .replace("{TAHUN}", new Date().getFullYear());

        const tanggalSurat = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const tglPanggilan = new Date();
        const offsetDays = Number(template.hariKerjaOffset) || 2;
        tglPanggilan.setDate(tglPanggilan.getDate() + offsetDays);
        const formatTglPanggilan = tglPanggilan.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const violationsList = student.pelanggaran || [];

        return `
            <!-- KOP SURAT RESMI -->
            <div style="border-bottom: 3px double #000000; padding-bottom: 12px; margin-bottom: 20px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 15px;">
                ${config.logo && config.logo.startsWith("data:image") ? `
                    <img src="${config.logo}" alt="Logo" style="width: 70px; height: 70px; object-fit: contain;">
                ` : `
                    <div style="font-size: 2.8rem; line-height: 1;">${config.logo || '🏫'}</div>
                `}
                <div style="text-align: center; flex: 1;">
                    <h3 style="font-size: 13pt; margin: 0; font-weight: bold; text-transform: uppercase; color: #000;">${template.kopInstansi}</h3>
                    <h1 style="font-size: 17pt; margin: 3px 0; font-weight: 800; text-transform: uppercase; color: #000;">${config.schoolName}</h1>
                    <p style="font-size: 9pt; margin: 0; color: #333;">${config.schoolAddress}</p>
                </div>
            </div>

            <!-- NOMOR, LAMPIRAN, PERIHAL & TANGGAL -->
            <table style="width: 100%; margin-bottom: 20px; font-size: 11pt; border-collapse: collapse;">
                <tr>
                    <td style="width: 60%; vertical-align: top;">
                        <table style="border-collapse: collapse;">
                            <tr><td style="padding: 2px 0; width: 85px;">Nomor</td><td style="width: 15px;">:</td><td>${nomorSurat}</td></tr>
                            <tr><td style="padding: 2px 0;">Lampiran</td><td>:</td><td>1 (Satu) Berkas Lembar Rekap</td></tr>
                            <tr><td style="padding: 2px 0;">Perihal</td><td>:</td><td><strong style="text-decoration: underline;">${template.perihal} (${status.statusText})</strong></td></tr>
                        </table>
                    </td>
                    <td style="width: 40%; vertical-align: top; text-align: right;">
                        Kota Pendidikan, ${tanggalSurat}
                    </td>
                </tr>
            </table>

            <!-- KEPADA YTH -->
            <div style="font-size: 11pt; margin-bottom: 18px; line-height: 1.4;">
                Kepada Yth.<br>
                <strong>Bapak / Ibu Orang Tua / Wali Siswa dari: ${student.nama}</strong><br>
                di Tempat
            </div>

            <!-- PARAGRAF PEMBUKA -->
            <p style="font-size: 11pt; text-align: justify; margin-bottom: 12px; line-height: 1.5;">
                ${template.pembuka}
            </p>

            <!-- BIODATA SISWA -->
            <table style="width: 95%; margin: 0 auto 16px auto; font-size: 10.5pt; border-collapse: collapse; background: #fafafa; border: 1px solid #e2e8f0;">
                <tr><td style="padding: 5px 10px; width: 28%;">Nama Lengkap Siswa</td><td style="width: 3%;">:</td><td style="padding: 5px 10px;"><strong>${student.nama}</strong></td></tr>
                <tr><td style="padding: 5px 10px;">NISN</td><td>:</td><td style="padding: 5px 10px;">${student.nisn}</td></tr>
                <tr><td style="padding: 5px 10px;">Kelas / Jurusan</td><td>:</td><td style="padding: 5px 10px;">${student.kelas} (${student.jurusan})</td></tr>
                <tr><td style="padding: 5px 10px;">Wali Kelas</td><td>:</td><td style="padding: 5px 10px;">${student.waliKelas}</td></tr>
                <tr><td style="padding: 5px 10px;">Total Akumulasi Poin</td><td>:</td><td style="padding: 5px 10px;"><strong style="color: #b91c1c; font-size: 11pt;">${status.totalPoinPelanggaran} Poin</strong></td></tr>
                <tr><td style="padding: 5px 10px;">Kadar Sanksi / Tindakan</td><td>:</td><td style="padding: 5px 10px;"><strong style="color: #1e3a8a;">${status.statusText}</strong> (${status.actionText})</td></tr>
            </table>

            <!-- TABEL DAFTAR KASUS PELANGGARAN SISWA -->
            <div style="font-size: 10.5pt; font-weight: bold; margin-bottom: 6px;">
                Rincian Riwayat Pelanggaran Siswa:
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 10pt;">
                <thead>
                    <tr style="background-color: #f1f5f9;">
                        <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 5%;">No</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 18%;">Tanggal</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 45%;">Jenis Pelanggaran</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 12%; text-align: center;">Bobot Poin</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 20%;">Sanksi yang Telah Diberikan</th>
                    </tr>
                </thead>
                <tbody>
                    ${violationsList.length > 0 ? violationsList.map((pl, idx) => `
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx + 1}</td>
                            <td style="border: 1px solid #000; padding: 6px;">${pl.tanggal}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: 600;">${pl.nama}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center; color: #b91c1c; font-weight: bold;">+${pl.poin}</td>
                            <td style="border: 1px solid #000; padding: 6px;">${pl.sanksi || '-'}</td>
                        </tr>
                    `).join('') : `
                        <tr><td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: center;">Tidak ada data pelanggaran</td></tr>
                    `}
                </tbody>
            </table>

            <!-- JADWAL KEHADIRAN ORTU -->
            <p style="font-size: 11pt; margin-bottom: 10px; line-height: 1.5;">
                Sehubungan dengan hal tersebut di atas, kami mengharapkan kehadiran Bapak/Ibu orang tua/wali siswa ke sekolah untuk berkoordinasi langsung dengan pihak sekolah pada:
            </p>
            <div style="margin-left: 20px; margin-bottom: 18px; font-size: 10.5pt; line-height: 1.8;">
                <table style="border-collapse: collapse;">
                    <tr><td style="width: 120px;"><strong>Hari / Tanggal</strong></td><td style="width: 15px;">:</td><td><strong>${formatTglPanggilan}</strong></td></tr>
                    <tr><td><strong>Waktu</strong></td><td>:</td><td><strong>${template.waktu}</strong></td></tr>
                    <tr><td><strong>Tempat</strong></td><td>:</td><td><strong>${template.tempat}</strong></td></tr>
                    <tr><td><strong>Menghadap</strong></td><td>:</td><td>Tim Bimbingan Konseling (BK) & Tim Kesiswaan</td></tr>
                </table>
            </div>

            <!-- PARAGRAF PENUTUP -->
            <p style="font-size: 11pt; text-align: justify; margin-bottom: 25px; line-height: 1.5;">
                ${template.penutup}
            </p>

            <!-- TANDA TANGAN 2 PEJABAT -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 35px; font-size: 11pt; page-break-inside: avoid;">
                <tr>
                    <td style="width: 50%; text-align: center; vertical-align: top;">
                        <p style="margin: 0 0 65px 0;">
                            Mengetahui,<br>
                            ${template.pejabatKiriJabatan || 'Koordinator Guru BK'}
                        </p>
                        <p style="margin: 0; font-weight: bold; text-decoration: underline;">
                            ${template.pejabatKiriNama || config.bkCoordinator}
                        </p>
                        <span style="font-size: 9pt; color: #444;">NIP. 19780512 200312 1 005</span>
                    </td>
                    <td style="width: 50%; text-align: center; vertical-align: top;">
                        <p style="margin: 0 0 65px 0;">
                            Wakil Kepala Sekolah<br>
                            ${template.pejabatKananJabatan || 'Bidang Kesiswaan'}
                        </p>
                        <p style="margin: 0; font-weight: bold; text-decoration: underline;">
                            ${template.pejabatKananNama || config.headOfStudentAffairs}
                        </p>
                        <span style="font-size: 9pt; color: #444;">NIP. 19720315 199802 2 001</span>
                    </td>
                </tr>
            </table>
        `;
    },

    downloadCurrentSuratDoc() {
        if (!this.currentSuratStudentId) {
            App.showToast("Tidak ada siswa yang dipilih.");
            return;
        }

        const student = StorageManager.getStudentById(this.currentSuratStudentId);
        if (!student) return;

        const status = StorageManager.calculateStudentStatus(student);
        const innerHtml = this.generateSuratPanggilanHtml(student, true);

        const wordDocContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Surat Panggilan Orang Tua - ${student.nama}</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page {
                        size: 21.0cm 29.7cm; /* A4 */
                        margin: 2.0cm 2.0cm 2.0cm 2.0cm;
                        mso-page-orientation: portrait;
                    }
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 11.5pt;
                        line-height: 1.4;
                        color: #000000;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                    }
                </style>
            </head>
            <body>
                ${innerHtml}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + wordDocContent], { type: 'application/msword;charset=utf-8' });
        const cleanName = student.nama.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanSp = status.statusText.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Surat_Panggilan_Ortu_${cleanName}_${cleanSp}.doc`;

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        App.showToast(`Berkas Word (${filename}) berhasil diunduh! Siap diedit di Microsoft Word / WPS.`);
    },

    printCurrentSuratPdf() {
        if (!this.currentSuratStudentId) {
            App.showToast("Tidak ada siswa yang dipilih.");
            return;
        }

        const student = StorageManager.getStudentById(this.currentSuratStudentId);
        if (!student) return;

        const printContainer = document.getElementById("printSuratContainer");
        if (!printContainer) return;

        printContainer.innerHTML = this.generateSuratPanggilanHtml(student, false);
        window.print();
    },

    printSuratPanggilan(studentId) {
        this.openSuratPanggilanModal(studentId);
    }
};

