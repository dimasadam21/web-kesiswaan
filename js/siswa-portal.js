/**
 * PORTAL SISWA (SETELAH SISWA LOGIN)
 * Menampilkan catatan diri sendiri: poin, riwayat prestasi & pelanggaran (Read-Only)
 */

const SiswaPortal = {
    currentStudent: null,

    init() {},

    renderMyStudentPortal(studentId) {
        const student = StorageManager.getStudentById(studentId);
        if (!student) return;

        this.currentStudent = student;
        const status = StorageManager.calculateStudentStatus(student);

        // Header info siswa
        document.getElementById("studentWelcomeName").textContent = student.nama;
        document.getElementById("studentWelcomeSub").textContent = `NISN: ${student.nisn} • Kelas: ${student.kelas} (${student.jurusan}) • Wali Kelas: ${student.waliKelas}`;

        // 3 Kotak Poin
        document.getElementById("studentPoinPelanggaran").textContent = `${status.totalPoinPelanggaran}`;
        document.getElementById("studentActionTindakan").textContent = status.actionText;

        document.getElementById("studentPoinPrestasi").textContent = `${(student.prestasi || []).length}`;
        document.getElementById("studentPrestasiCount").textContent = `${(student.prestasi || []).length} Capaian Resmi`;

        document.getElementById("studentIndeksNilai").textContent = `${status.saldoPoinKebaikan}/100`;

        // Render List Prestasi
        this.renderMyPrestasi(student.prestasi || []);

        // Render List Pelanggaran
        this.renderMyPelanggaran(student.pelanggaran || []);
    },

    switchSubTab(tabName) {
        const btnPrestasi = document.getElementById("btnTabPrestasi");
        const btnPelanggaran = document.getElementById("btnTabPelanggaran");
        const subPrestasi = document.getElementById("studentSubPrestasi");
        const subPelanggaran = document.getElementById("studentSubPelanggaran");

        if (tabName === "prestasi") {
            btnPrestasi.classList.add("active");
            btnPelanggaran.classList.remove("active");
            subPrestasi.style.display = "block";
            subPelanggaran.style.display = "none";
        } else {
            btnPrestasi.classList.remove("active");
            btnPelanggaran.classList.add("active");
            subPrestasi.style.display = "none";
            subPelanggaran.style.display = "block";
        }
    },

    renderMyPrestasi(prestasiList) {
        const container = document.getElementById("studentMyPrestasiList");
        if (!container) return;

        if (prestasiList.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem; background: #ffffff; border: 1px solid var(--border); border-radius: 12px; color: var(--text-muted);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏆</div>
                    <strong style="color: var(--text-main);">Belum Ada Catatan Prestasi</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Terus asah bakat dan kejar prestasi untuk mengharumkan nama sekolah!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = prestasiList.map(pr => `
            <div class="record-card achievement">
                <div>
                    <h4 style="font-size: 1rem; color: var(--text-main);">${pr.nama}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                        Tingkat: <strong>${pr.tingkat}</strong> • Capaian: <strong>${pr.peringkat}</strong>
                    </p>
                    <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 4px;">
                        📅 Tanggal: ${pr.tanggal} • Dicatat: ${pr.pencatat || 'Tim Kesiswaan'}
                    </p>
                </div>
                <span class="status-pill pill-green" style="font-size: 0.75rem;">🏆 ${pr.peringkat || 'Juara'}</span>
            </div>
        `).join('');
    },

    renderMyPelanggaran(pelanggaranList) {
        const container = document.getElementById("studentMyPelanggaranList");
        if (!container) return;

        if (pelanggaranList.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem; background: #ffffff; border: 1px solid var(--border); border-radius: 12px; color: var(--text-muted);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌟</div>
                    <strong style="color: var(--success-text);">Catatan Bersih Tanpa Pelanggaran</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Luar biasa! Pertahankan kedisiplinan dan kepatuhan terhadap tata tertib sekolah.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pelanggaranList.map(pl => `
            <div class="record-card violation">
                <div>
                    <h4 style="font-size: 1rem; color: var(--text-main);">${pl.nama}</h4>
                    <p style="font-size: 0.85rem; color: var(--danger-text); margin-top: 2px;">
                        Sanksi yang Diterima: <strong>${pl.sanksi}</strong>
                    </p>
                    <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 4px;">
                        📅 Tanggal: ${pl.tanggal} • Guru Pelapor: ${pl.pencatat || 'Guru Piket'}
                    </p>
                </div>
                <span class="status-pill pill-red">-${pl.poin} Poin</span>
            </div>
        `).join('');
    },

    // 4. RAPOR KARAKTER SISWA (PDF DENGAN BIODATA & REKAP LENGKAP)
    openRaporKarakterModal(studentId) {
        let student = studentId ? StorageManager.getStudentById(studentId) : this.currentStudent;
        if (!student) {
            App.showToast("Data siswa tidak ditemukan.");
            return;
        }

        this.currentStudent = student;
        const preview = document.getElementById("previewRaporKarakterContent");
        if (preview) {
            preview.innerHTML = this.generateRaporKarakterHtml(student);
        }

        Forms.openModal("modalRaporKarakter");
    },

    executePrintRapor() {
        if (!this.currentStudent) {
            App.showToast("Data siswa belum dipilih.");
            return;
        }

        const printContainer = document.getElementById("printRaporContainer");
        if (!printContainer) return;

        printContainer.innerHTML = this.generateRaporKarakterHtml(this.currentStudent);
        window.print();
    },

    printRaporKarakter(studentId) {
        this.openRaporKarakterModal(studentId || (this.currentStudent ? this.currentStudent.id : null));
    },

    generateRaporKarakterHtml(student) {
        const status = StorageManager.calculateStudentStatus(student);
        const config = StorageManager.getConfig();
        const template = StorageManager.getSuratTemplate();

        const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const nomorRapor = StorageManager.getFormattedRaporNumber(new Date());
        const tahunAjaran = config.academicYear || "2026/2027";

        // Dapatkan nama wali kelas otomatis jika belum ada di data siswa
        let namaWaliKelas = student.waliKelas && student.waliKelas !== "-" ? student.waliKelas : "";
        if (!namaWaliKelas && typeof DAFTAR_WALI_KELAS_MASTER !== 'undefined') {
            const foundWali = DAFTAR_WALI_KELAS_MASTER.find(w => w.kode === student.kelas || (w.label && w.label.includes(student.kelas)));
            if (foundWali) namaWaliKelas = foundWali.nama;
        }
        if (!namaWaliKelas) namaWaliKelas = student.waliKelas || "-";

        // Data Pejabat Tertinggi Pengesahan: Wakasek Kesiswaan (Tersinkron dengan Super Admin)
        const wakaNama = config.headOfStudentAffairs || template.pejabatNama || 'Morlan Purba Sibarani, S.Pd., M.Si.';
        const wakaJabatan = template.pejabatJabatan || 'Wakasek Bidang Kesiswaan';
        let wakaNip = config.headOfStudentAffairsNip || template.pejabatNip || 'NIP. 19740315 200501 1 004';
        if (wakaNip && !wakaNip.toUpperCase().startsWith('NIP')) {
            wakaNip = `NIP. ${wakaNip}`;
        }

        return `
            <!-- KOP SURAT RESMI STANDAR (PERSIS KOP SP) -->
            ${StorageManager.getOfficialKopHtml()}

            <!-- JUDUL DOKUMEN RAPOR -->
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="font-size: 13.5pt; font-weight: 800; text-decoration: underline; margin: 0; text-transform: uppercase; line-height: 1.35; letter-spacing: 0.5px; color: #000;">
                    RAPOR CAPAIAN KARAKTER, PRESTASI &amp; CATATAN KEDISIPLINAN<br>
                    SISWA SMKN 1 MAGELANG
                </h2>
                <div style="font-size: 11pt; font-weight: 700; margin-top: 5px; text-transform: uppercase; color: #000; letter-spacing: 0.5px;">
                    TAHUN AJARAN ${tahunAjaran}
                </div>
                <div style="font-size: 10pt; margin-top: 5px; color: #222; font-weight: 600;">
                    No. ${nomorRapor} &bull; Tanggal Terbit: ${tanggalCetak}
                </div>
            </div>

            <!-- BIODATA SISWA LENGKAP -->
            <div style="font-size: 11pt; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                I. IDENTITAS & BIODATA SISWA
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5pt; background: #fafafa; border: 1px solid #cbd5e1;">
                <tr>
                    <td style="padding: 5px 8px; width: 18%; font-weight: 600;">Nama Lengkap</td>
                    <td style="width: 2%;">:</td>
                    <td style="padding: 5px 8px; width: 34%;"><strong>${student.nama}</strong></td>
                    <td style="padding: 5px 8px; width: 18%; font-weight: 600;">NIS / NISN</td>
                    <td style="width: 2%;">:</td>
                    <td style="padding: 5px 8px;">${student.nis || '-'} / ${student.nisn}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 8px; font-weight: 600;">Kelas / Jurusan</td>
                    <td>:</td>
                    <td style="padding: 5px 8px;">${student.kelas} (${student.jurusan})</td>
                    <td style="padding: 5px 8px; font-weight: 600;">Jenis Kelamin</td>
                    <td>:</td>
                    <td style="padding: 5px 8px;">${student.gender === 'P' ? 'Perempuan' : 'Laki-Laki'}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 8px; font-weight: 600;">No. HP Siswa</td>
                    <td>:</td>
                    <td style="padding: 5px 8px;">${student.nomorHp || '-'}</td>
                    <td style="padding: 5px 8px; font-weight: 600;">Wali Kelas</td>
                    <td>:</td>
                    <td style="padding: 5px 8px;"><strong>${namaWaliKelas}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 5px 8px; font-weight: 600;">Orang Tua (Ayah)</td>
                    <td>:</td>
                    <td style="padding: 5px 8px;">${student.namaOrtuBapak || '-'} (${student.noHpBapak || '-'})</td>
                    <td style="padding: 5px 8px; font-weight: 600;">Orang Tua (Ibu)</td>
                    <td>:</td>
                    <td style="padding: 5px 8px;">${student.namaOrtuIbu || '-'} (${student.noHpIbu || '-'})</td>
                </tr>
                <tr>
                    <td style="padding: 5px 8px; font-weight: 600;">Alamat Lengkap</td>
                    <td>:</td>
                    <td style="padding: 5px 8px;" colspan="4">${student.alamat || '-'}</td>
                </tr>
                <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1;">
                    <td style="padding: 6px 8px; font-weight: 600;">Akumulasi Pelanggaran</td>
                    <td>:</td>
                    <td style="padding: 6px 8px;"><strong style="color: #b91c1c;">${status.totalPoinPelanggaran} Poin</strong> (${status.statusText})</td>
                    <td style="padding: 6px 8px; font-weight: 600;">Total Prestasi</td>
                    <td>:</td>
                    <td style="padding: 6px 8px;"><strong style="color: #15803d;">${(student.prestasi || []).length} Capaian Kejuaraan</strong></td>
                </tr>
            </table>

            <!-- BAGIAN A: RIWAYAT PRESTASI & PENGHARGAAN -->
            <div style="font-size: 11pt; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                II. REKAPITULASI PRESTASI & PENGHARGAAN SISWA
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5pt;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="border: 1px solid #000; padding: 6px; width: 5%; text-align: center;">No</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 14%;">Tanggal</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 38%;">Nama Prestasi / Kejuaraan</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 18%;">Tingkat & Peringkat</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 25%;">Penyelenggara</th>
                    </tr>
                </thead>
                <tbody>
                    ${(student.prestasi && student.prestasi.length > 0) ? student.prestasi.map((pr, i) => `
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${i + 1}</td>
                            <td style="border: 1px solid #000; padding: 6px;">${pr.tanggal}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: 600;">${pr.nama}</td>
                            <td style="border: 1px solid #000; padding: 6px;">${pr.tingkat} (${pr.peringkat})</td>
                            <td style="border: 1px solid #000; padding: 6px;">${pr.penyelenggara || '-'}</td>
                        </tr>
                    `).join('') : `
                        <tr><td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: center; color: #64748b;"><em>Belum ada catatan riwayat prestasi.</em></td></tr>
                    `}
                </tbody>
            </table>

            <!-- BAGIAN B: RIWAYAT PELANGGARAN TATA TERTIB -->
            <div style="font-size: 11pt; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                III. REKAPITULASI PELANGGARAN TATA TERTIB SEKOLAH
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5pt;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="border: 1px solid #000; padding: 6px; width: 5%; text-align: center;">No</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 14%;">Tanggal</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 38%;">Jenis Pelanggaran</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 10%; text-align: center;">Poin</th>
                        <th style="border: 1px solid #000; padding: 6px; width: 33%;">Sanksi yang Telah Diterima</th>
                    </tr>
                </thead>
                <tbody>
                    ${(student.pelanggaran && student.pelanggaran.length > 0) ? student.pelanggaran.map((pl, i) => `
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${i + 1}</td>
                            <td style="border: 1px solid #000; padding: 6px;">${pl.tanggal}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: 600;">${pl.nama}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center; color: #b91c1c; font-weight: bold;">+${pl.poin}</td>
                            <td style="border: 1px solid #000; padding: 6px;">${pl.sanksi || '-'}</td>
                        </tr>
                    `).join('') : `
                        <tr><td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: center; color: #166534;"><em>Catatan Bersih! Siswa tidak memiliki pelanggaran tata tertib.</em></td></tr>
                    `}
                </tbody>
            </table>

            <!-- BAGIAN C: KESIMPULAN & EVALUASI PEMBINAAN KARAKTER -->
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 25px; font-size: 10pt;">
                <strong>Evaluasi & Catatan Pembinaan Karakter:</strong>
                <p style="margin: 4px 0 0 0; line-height: 1.5; color: #334155;">
                    ${status.totalPoinPelanggaran === 0 ? 
                        `Siswa menunjukkan integritas tinggi, kepatuhan tata tertib yang sangat baik, serta kedisiplinan teladan bagi siswa lainnya.` : 
                        (status.totalPoinPelanggaran < 31 ? 
                            `Siswa berada dalam kategori pembinaan ringan. Diperlukan motivasi dan pengawasan konsisten dari wali kelas dan orang tua agar tidak mengulangi pelanggaran.` : 
                            `Siswa telah mencapai batas sanksi resmi (${status.statusText}). Diperlukan bimbingan intensif dari Tim BK, Kesiswaan, serta kehadiran orang tua/wali untuk koordinasi pembinaan.`)}
                </p>
            </div>

            <!-- TANDA TANGAN RESMI PENGESAHAN (TERTINGGI: WAKA KESISWAAN) -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 10pt; text-align: center; page-break-inside: avoid;">
                <tr>
                    <td style="width: 50%; vertical-align: top; padding-bottom: 50px;">
                        Orang Tua / Wali Siswa,
                        <div style="height: 50px;"></div>
                        <strong style="text-decoration: underline;">( ${student.namaOrtuBapak || student.namaOrtuIbu || '....................................................'} )</strong>
                    </td>
                    <td style="width: 50%; vertical-align: top; padding-bottom: 50px;">
                        Magelang, ${tanggalCetak}<br>
                        Wali Kelas <strong>${student.kelas}</strong>,
                        <div style="height: 50px;"></div>
                        <strong style="text-decoration: underline;">${namaWaliKelas}</strong><br>
                        <span style="font-size: 9pt; color: #444;">NIP. -</span>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="padding-top: 15px; text-align: center; vertical-align: top;">
                        <p style="margin: 0 0 4px 0; font-size: 10pt; font-weight: 600;">
                            Mengetahui,<br>
                            <span>${wakaJabatan}</span>
                        </p>
                        <div style="height: 65px; display: flex; align-items: center; justify-content: center; margin: 4px 0;">
                            ${template.ttdImageUrl ? `
                                <img src="${template.ttdImageUrl}" alt="Tanda Tangan" style="max-height: 60px; max-width: 170px; object-fit: contain;">
                            ` : `
                                <div style="height: 50px;"></div>
                            `}
                        </div>
                        <p style="margin: 0; font-weight: bold; text-decoration: underline; font-size: 10.5pt;">
                            ${wakaNama}
                        </p>
                        <span style="font-size: 9.5pt; color: #222;">${wakaNip}</span>
                    </td>
                </tr>
            </table>
        `;
    }
};
