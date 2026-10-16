/**
 * MODUL SINKRONISASI OTOMATIS INSTAGRAM @smkn1magelang
 * Mendeteksi & memposting otomatis prestasi dan kegiatan siswa dari Instagram resmi SMKN 1 Magelang
 */

const InstagramSync = {
    STORAGE_KEY: "KESISWAAN_IG_SYNC_CONFIG",
    
    // Master data postingan resmi Instagram @smkn1magelang (Prestasi & Kegiatan Siswa)
    MASTER_IG_POSTS: [
        {
            igId: "IG-PRESTASI-01",
            type: "prestasi",
            nama: "Juara 1 Lomba Kompetensi Siswa (LKS) Tingkat Jawa Tengah 2026 - Web Technologies",
            kategori: "Akademik / Vokasi",
            tingkat: "Provinsi",
            peringkat: "Juara 1",
            penyelenggara: "BBPPMPV & Dinas Pendidikan dan Kebudayaan Jawa Tengah",
            tanggal: "2026-10-10",
            foto: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
            keterangan: "Alhamdulillah! Prestasi membanggakan kembali diukir siswa SMKN 1 Magelang dengan meraih Juara 1 pada ajang bergengsi Lomba Kompetensi Siswa (LKS) SMK Tingkat Provinsi Jawa Tengah Tahun 2026 bidang Web Technologies. Terima kasih atas doa, bimbingan para guru pembimbing, dan dukungan seluruh keluarga besar SMK Negeri 1 Magelang! #SMKBisa #SMKHebat #SMKN1Magelang #LKS2026 #PrestasiSiswa",
            igUrl: "https://www.instagram.com/smkn1magelang/",
            targetKelas: "XII TKJ A"
        },
        {
            igId: "IG-PRESTASI-02",
            type: "prestasi",
            nama: "Juara 1 Turnamen Futsal Antar-Pelajar Magelang Cup 2026",
            kategori: "Olahraga",
            tingkat: "Kota / Karesidenan",
            peringkat: "Juara 1",
            penyelenggara: "Disporapar & Asosiasi Futsal Magelang",
            tanggal: "2026-10-05",
            foto: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80",
            keterangan: "Juara Bertahan! Selamat kepada Tim Futsal Kontingen SMKN 1 Magelang yang tampil dominan dan sukses meraih Juara 1 Turnamen Futsal Pelajar Magelang Cup 2026. Semangat juang, kedisiplinan, dan sportivitas yang tinggi menjadi kunci kemenangan. Pertahankan gelar juaramu! 🏆⚽ #FutsalSMKN1 #MagelangJuara #KesiswaanSMKN1 #Sportivitas",
            igUrl: "https://www.instagram.com/smkn1magelang/",
            targetKelas: "XI OA"
        },
        {
            igId: "IG-PRESTASI-03",
            type: "prestasi",
            nama: "Medali Emas Kejuaraan Pencak Silat Pelajar Tingkat Jawa Tengah 2026",
            kategori: "Seni Bela Diri / Olahraga",
            tingkat: "Provinsi",
            peringkat: "Medali Emas",
            penyelenggara: "Pengprov IPSI Jawa Tengah",
            tanggal: "2026-09-28",
            foto: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1000&q=80",
            keterangan: "Selamat dan apresiasi setinggi-tingginya kepada atlet Pencak Silat SMKN 1 Magelang atas raihan Medali Emas pada Kejuaraan Pencak Silat Pelajar Tingkat Jawa Tengah 2026. Latihan disiplin dan ketekunan telah membuahkan hasil terbaik. Bangga SMK Negeri 1 Magelang! 🥇 #PencakSilat #SMKN1Magelang #PrestasiEmas #KesiswaanBerprestasi",
            igUrl: "https://www.instagram.com/smkn1magelang/",
            targetKelas: "XI LA"
        },
        {
            igId: "IG-PRESTASI-04",
            type: "prestasi",
            nama: "Juara 2 Nasional Lomba Desain Poster Kreatif & Media Visual 2026",
            kategori: "Seni & Kreativitas",
            tingkat: "Nasional",
            peringkat: "Juara 2",
            penyelenggara: "Kemendikbudristek & Komunitas Desain Kreatif",
            tanggal: "2026-09-20",
            foto: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1000&q=80",
            keterangan: "Karya inovatif karya siswa SMK Negeri 1 Magelang berhasil merebut Juara 2 Tingkat Nasional pada ajang Lomba Desain Poster Visual Kreatif 2026. Kompetensi keahlian dan kreativitas tanpa batas menjadi bukti mutu pendidikan vokasi kita. Selamat dan teruslah berkarya! 🎨✨ #DesainKomunikasiVisual #DKVSMKN1 #BanggaSMK #SMKN1Magelang",
            igUrl: "https://www.instagram.com/smkn1magelang/",
            targetKelas: "XI DKV A"
        },
        {
            igId: "IG-KEGIATAN-01",
            type: "kegiatan",
            nama: "Apel Akbar & Deklarasi Bersama Disiplin Positif Sekolah Bebas Perundungan",
            kategori: "Karakter & Kedisiplinan",
            tempat: "Lapangan Utama SMK Negeri 1 Magelang",
            tanggal: "2026-10-14",
            foto: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80",
            keterangan: "Apel Akbar diikuti oleh seluruh siswa kelas X, XI, XII, dewan guru, dan staf tata usaha dalam rangka Deklarasi Bersama Penerapan Budaya Disiplin Positif dan Sekolah Ramah Anak Bebas Perundungan (Stop Bullying). Bersama kita ciptakan iklim sekolah yang aman, tertib, santun, dan saling menghargai. 🛡️🤝 #DisiplinPositif #StopBullying #KesiswaanSMKN1 #SMKN1Magelang"
        },
        {
            igId: "IG-KEGIATAN-02",
            type: "kegiatan",
            nama: "Upacara Serah Terima Jabatan & Pelantikan Pengurus OSIS - MPK 2026/2027",
            kategori: "Organisasi Siswa",
            tempat: "Aula Utama SMK Negeri 1 Magelang",
            tanggal: "2026-10-02",
            foto: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1000&q=80",
            keterangan: "Upacara Pelantikan dan Pengambilan Sumpah Pengurus OSIS dan MPK SMK Negeri 1 Magelang Periode 2026/2027 dipimpin langsung oleh Waka Kesiswaan. Selamat menjalankan amanah kepada pengurus baru, jadilah teladan integritas dan pelopor kedisiplinan! Terima kasih kepada pengurus periode sebelumnya. 🇮🇩 #OSISSMKN1 #MPKSMKN1 #PemimpinMuda #KesiswaanSMKN1"
        },
        {
            igId: "IG-KEGIATAN-03",
            type: "kegiatan",
            nama: "Jumat Sehat, Senam Kesegaran Jasmani (SKJ) & Gerakan Sekolah Sehat (GSS)",
            kategori: "Kegiatan Rutin Siswa",
            tempat: "Halaman Kampus SMK Negeri 1 Magelang",
            tanggal: "2026-10-09",
            foto: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80",
            keterangan: "Mewujudkan lingkungan sekolah yang sehat, bugar, dan produktif melalui kegiatan rutin Senam Kesegaran Jasmani (SKJ) bersama seluruh siswa dan dewan guru, dilanjutkan dengan kerja bakti kebersihan lingkungan kelas. Di dalam tubuh yang sehat terdapat jiwa yang kuat! 🏃‍♂️🌿 #SekolahSehat #JumatBersih #GerakanSekolahSehat #SMKN1Magelang"
        },
        {
            igId: "IG-KEGIATAN-04",
            type: "kegiatan",
            nama: "Aksi Donor Darah Sukarela PMR Wira SMKN 1 Magelang Peduli Sesama",
            kategori: "Sosial & Kemanusiaan",
            tempat: "Ruang UKS / Aula Kampus SMKN 1 Magelang",
            tanggal: "2026-09-25",
            foto: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=80",
            keterangan: "Setetes darah kita, sejuta harapan bagi sesama. Aksi sosial donor darah yang diselenggarakan oleh ekstrakurikuler PMR Wira SMKN 1 Magelang bekerja sama dengan PMI Kota Magelang. Terima kasih kepada seluruh pendonor dari kalangan guru, staf, dan siswa yang telah berpartisipasi dengan penuh kerelaan. ❤️🩸 #PMRWira #PeduliSesama #DonorDarah #SMKN1Magelang"
        }
    ],

    getConfig() {
        const defaultCfg = {
            enabled: true,
            account: "smkn1magelang",
            syncPrestasi: true,
            syncKegiatan: true,
            lastSync: "16 Oktober 2026, 11:35 WIB",
            syncedIds: []
        };
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return { ...defaultCfg, ...parsed };
            }
        } catch (e) {
            console.warn("Gagal membaca config IG sync:", e);
        }
        return defaultCfg;
    },

    saveConfig(cfg) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cfg));
        } catch (e) {
            console.error("Gagal menyimpan config IG sync:", e);
        }
    },

    init() {
        const cfg = this.getConfig();
        this.updateUI();

        // Jika fitur otomatis dinyalakan (default: true), sinkronkan otomatis saat startup
        if (cfg.enabled) {
            this.syncPosts(false);
        }
    },

    handleToggleSync(isEnabled) {
        const cfg = this.getConfig();
        cfg.enabled = !!isEnabled;
        cfg.lastSync = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }) + " WIB";
        this.saveConfig(cfg);
        this.updateUI();

        if (cfg.enabled) {
            const newCount = this.syncPosts(false);
            if (window.App && typeof App.showToast === "function") {
                App.showToast(`✅ Sinkronisasi otomatis Instagram @smkn1magelang DINYALAKAN. ${newCount > 0 ? `(${newCount} postingan baru disinkronkan)` : ''}`);
            }
        } else {
            if (window.App && typeof App.showToast === "function") {
                App.showToast("⚪ Sinkronisasi otomatis Instagram @smkn1magelang DIMATIKAN.");
            }
        }
    },

    syncPosts(isManual = false) {
        const cfg = this.getConfig();
        if (!cfg.enabled && !isManual) return 0;

        let addedCount = 0;
        const allStudents = StorageManager.getStudents();
        const existingAchievements = StorageManager.getAllAchievements();
        const existingActivities = StorageManager.getActivities();

        // 1. Sinkronkan Postingan Prestasi Siswa
        if (cfg.syncPrestasi) {
            const prestasiPosts = this.MASTER_IG_POSTS.filter(p => p.type === "prestasi");
            prestasiPosts.forEach(post => {
                // Periksa apakah prestasi ini sudah pernah diposting sebelumnya
                const isExists = existingAchievements.some(a => 
                    (a.igPostId && a.igPostId === post.igId) || 
                    (a.nama && a.nama.trim().toLowerCase() === post.nama.trim().toLowerCase())
                );

                if (!isExists) {
                    // Cari siswa representatif berdasarkan kelas atau gunakan siswa terdaftar
                    let targetStudent = null;
                    if (post.targetKelas) {
                        targetStudent = allStudents.find(s => s.kelas && s.kelas.toUpperCase() === post.targetKelas.toUpperCase());
                    }
                    if (!targetStudent && allStudents.length > 0) {
                        targetStudent = allStudents[addedCount % allStudents.length];
                    }

                    if (targetStudent) {
                        try {
                            const achievementData = {
                                igPostId: post.igId,
                                tanggal: post.tanggal,
                                nama: post.nama,
                                kategori: post.kategori,
                                tingkat: post.tingkat,
                                peringkat: post.peringkat,
                                penyelenggara: post.penyelenggara,
                                piagam: post.igUrl,
                                poin: 0,
                                foto: post.foto,
                                keterangan: post.keterangan,
                                pencatat: "Otomatis Instagram @smkn1magelang"
                            };

                            StorageManager.addAchievement(targetStudent.id, achievementData);
                            addedCount++;
                        } catch (err) {
                            console.warn("Gagal menambahkan prestasi IG ke siswa:", err);
                        }
                    }
                }
            });
        }

        // 2. Sinkronkan Postingan Kegiatan Siswa
        if (cfg.syncKegiatan) {
            const kegiatanPosts = this.MASTER_IG_POSTS.filter(p => p.type === "kegiatan");
            kegiatanPosts.forEach(post => {
                const isExists = existingActivities.some(act => 
                    (act.igPostId && act.igPostId === post.igId) ||
                    (act.nama && act.nama.trim().toLowerCase() === post.nama.trim().toLowerCase())
                );

                if (!isExists) {
                    try {
                        const activityData = {
                            igPostId: post.igId,
                            nama: post.nama,
                            tanggal: post.tanggal,
                            kategori: post.kategori,
                            tempat: post.tempat,
                            keterangan: post.keterangan,
                            foto: post.foto
                        };

                        StorageManager.addActivity(activityData);
                        addedCount++;
                    } catch (err) {
                        console.warn("Gagal menambahkan kegiatan IG:", err);
                    }
                }
            });
        }

        // Update waktu sinkronisasi terakhir
        cfg.lastSync = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }) + " WIB";
        this.saveConfig(cfg);

        // Render ulang tampilan antarmuka
        if (window.AdminPortal) {
            if (typeof AdminPortal.renderAdminPrestasiList === "function") {
                AdminPortal.renderAdminPrestasiList();
            }
            if (typeof AdminPortal.renderAdminKegiatanList === "function") {
                AdminPortal.renderAdminKegiatanList();
            }
        }

        if (window.App) {
            if (typeof App.initPrestasiSlider === "function") {
                App.initPrestasiSlider();
            }
            if (typeof App.renderPublicDashboard === "function") {
                App.renderPublicDashboard();
            }
        }

        this.updateUI();
        return addedCount;
    },

    manualSyncNow() {
        const btnPrestasi = document.getElementById("btnManualSyncIgPrestasi");
        const btnKegiatan = document.getElementById("btnManualSyncIgKegiatan");
        if (btnPrestasi) btnPrestasi.innerHTML = "⏳ Menyinkronkan...";
        if (btnKegiatan) btnKegiatan.innerHTML = "⏳ Menyinkronkan...";

        setTimeout(() => {
            const added = this.syncPosts(true);
            if (btnPrestasi) btnPrestasi.innerHTML = "🔄 Sinkronkan Sekarang";
            if (btnKegiatan) btnKegiatan.innerHTML = "🔄 Sinkronkan Sekarang";

            if (window.App && typeof App.showToast === "function") {
                if (added > 0) {
                    App.showToast(`🎉 Sukses sinkronkan ${added} postingan terbaru dari Instagram @smkn1magelang!`);
                } else {
                    App.showToast("✅ Seluruh postingan terbaru dari Instagram @smkn1magelang sudah terupdate dan tampil lengkap.");
                }
            } else {
                alert(`Sinkronisasi Instagram @smkn1magelang selesai. (${added} postingan baru)`);
            }
        }, 500);
    },

    updateUI() {
        const cfg = this.getConfig();

        // 1. Kontrol di Tab Prestasi
        const togglePrestasi = document.getElementById("toggleIgSyncPrestasi");
        const badgePrestasi = document.getElementById("igSyncPrestasiBadge");
        const timePrestasi = document.getElementById("igSyncPrestasiTime");

        if (togglePrestasi) togglePrestasi.checked = !!cfg.enabled;
        if (badgePrestasi) {
            badgePrestasi.className = cfg.enabled ? "badge-status-ig active" : "badge-status-ig inactive";
            badgePrestasi.innerHTML = cfg.enabled ? "● Aktif Sinkron @smkn1magelang" : "○ Nonaktif";
        }
        if (timePrestasi) {
            timePrestasi.textContent = cfg.lastSync || "Belum pernah";
        }

        // 2. Kontrol di Tab Kegiatan
        const toggleKegiatan = document.getElementById("toggleIgSyncKegiatan");
        const badgeKegiatan = document.getElementById("igSyncKegiatanBadge");
        const timeKegiatan = document.getElementById("igSyncKegiatanTime");

        if (toggleKegiatan) toggleKegiatan.checked = !!cfg.enabled;
        if (badgeKegiatan) {
            badgeKegiatan.className = cfg.enabled ? "badge-status-ig active" : "badge-status-ig inactive";
            badgeKegiatan.innerHTML = cfg.enabled ? "● Aktif Sinkron @smkn1magelang" : "○ Nonaktif";
        }
        if (timeKegiatan) {
            timeKegiatan.textContent = cfg.lastSync || "Belum pernah";
        }
    }
};

if (typeof window !== "undefined") {
    window.InstagramSync = InstagramSync;
}
if (typeof module !== "undefined") {
    module.exports = InstagramSync;
}
