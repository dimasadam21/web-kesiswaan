/**
 * DATA AWAL (SEEDER) SISTEM KESISWAAN SEKOLAH
 * Dilengkapi akun Super Admin, data guru yang dapat dikelola, foto prestasi, dan pengaturan sekolah.
 */

const DEFAULT_CONFIG = {
    schoolName: "SMA NEGERI 1 KREASI BANGSA",
    schoolMotto: "Berkarakter Unggul, Berprestasi Gemilang, Berbudaya Disiplin",
    headerBadgeText: "🛡️ Portal Kesiswaan & Kedisiplinan",
    schoolAddress: "Jl. Ki Hajar Dewantara No. 101, Kota Pendidikan - Telp. (021) 7890-1234",
    schoolLogo: "🏫",
    schoolLogoUrl: "",
    logoSize: 46, // slider 36 - 80 px
    logoShape: "rounded", // "rounded", "circle", "squircle", "square"
    logoBg: "white", // "white", "theme", "transparent"
    titleFontSize: "normal", // "small", "normal", "large", "xlarge"
    mottoFontSize: "normal", // "small", "normal", "large"
    badgeFontSize: "normal", // "small", "normal", "large"
    baseFontSize: "normal", // "compact", "normal", "relaxed", "large"
    dashboardBgUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80",
    themeColor: "#2563eb", // Biru Royal Default
    schoolFont: "'Plus Jakarta Sans', sans-serif",
    wallpaperEffect: "light",
    academicYear: "2025/2026",
    headmaster: "Dr. H. Sulaiman Effendi, M.Pd",
    headOfStudentAffairs: "Dra. Hj. Siti Rahma, M.Pd",
    bkCoordinator: "Bambang Wijaya, S.Pd, M.Kons"
};

// TEMPLATE DEFAULT SURAT PANGGILAN ORANG TUA (BISA DIEDIT SUPER ADMIN)
const DEFAULT_SURAT_TEMPLATE = {
    kopInstansi: "PEMERINTAH PROVINSI PENDIDIKAN",
    nomorFormat: "421.3 / {NOMOR} / KESISWAAN / {TAHUN}",
    perihal: "PANGGILAN ORANG TUA / WALI SISWA",
    hariKerjaOffset: 2,
    waktu: "Pukul 08.30 WIB s.d Selesai",
    tempat: "Ruang Bimbingan Konseling (BK) / Ruang Kesiswaan",
    pembuka: "Sehubungan dengan evaluasi tata tertib serta pembinaan kedisiplinan dan karakter putra/putri Bapak/Ibu di lingkungan sekolah, dengan ini kami mengharapkan kehadiran Bapak/Ibu orang tua/wali dari:",
    penutup: "Mengingat pentingnya koordinasi pembinaan karakter ini demi kelancaran proses pendidikan dan masa depan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktu yang telah ditentukan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.",
    pejabatKiriJabatan: "Koordinator Guru BK",
    pejabatKiriNama: "Bambang Wijaya, S.Pd",
    pejabatKananJabatan: "Wakil Kepala Sekolah Bidang Kesiswaan",
    pejabatKananNama: "Dra. Hj. Siti Rahma"
};

const DEFAULT_QUOTES = [
    {
        quote: "Disiplin adalah jembatan antara cita-cita mulia dan pencapaian yang nyata.",
        tokoh: "Ki Hajar Dewantara",
        warna: "ocean",
        font: "playfair",
        efek: "all",
        kategori: "💡 Kata Mutiara & Motivasi Hari Ini"
    },
    {
        quote: "Keberhasilan bukanlah sebuah kebetulan, melainkan buah dari kerja keras, ketekunan, dan akhlak yang mulia.",
        tokoh: "B.J. Habibie",
        warna: "gold",
        font: "caveat",
        efek: "all",
        kategori: "🌟 Motivasi Berkarakter"
    },
    {
        quote: "Juara sejati tidak hanya unggul dalam prestasi, namun juga rendah hati dan berkarakter terpuji.",
        tokoh: "Pesan Kesiswaan",
        warna: "emerald",
        font: "outfit",
        efek: "all",
        kategori: "🏆 Semangat Juara & Prestasi"
    },
    {
        quote: "Pendidikan adalah senjata paling ampuh untuk mengubah masa depan menjadi lebih gemilang.",
        tokoh: "Nelson Mandela",
        warna: "purple",
        font: "merriweather",
        efek: "glow",
        kategori: "📜 Nasihat Bijak Kehidupan"
    }
];

// DAFTAR RESMI PEMBINA ORGANISASI & EKSTRAKURIKULER
const DEFAULT_PEMBINA_LIST = [
    "OSIS",
    "Dewan Ambalan",
    "PMR",
    "ROHIS",
    "PKS",
    "STUPA",
    "Patigeni",
    "Redicator",
    "Robotika",
    "Kandang Barong",
    "SM",
    "English Club",
    "Nihongo Club",
    "Paduan Suara",
    "Green School",
    "Voli",
    "Sepak Bola",
    "Basket",
    "Pencak Silat",
    "Taekwondo"
];

const DEFAULT_TEACHERS = [
    {
        username: "admin",
        password: "123",
        name: "Super Administrator IT",
        role: "superadmin",
        roleLabel: "Admin",
        sekbid: "Semua Sekbid (Koordinator Utama)",
        pembina: "OSIS, Robotika",
        pokja: "Pokja Sistem & IT Kesiswaan",
        icon: "👑"
    },
    {
        username: "kesiswaan",
        password: "123",
        name: "Dra. Hj. Siti Rahma, M.Pd",
        role: "guru",
        roleLabel: "Waka Kesiswaan",
        sekbid: "Pembina Umum Seluruh Sekbid",
        pembina: "OSIS, Dewan Ambalan, PMR",
        pokja: "Pokja Karakter & Budaya Sekolah",
        icon: "👩‍💼"
    },
    {
        username: "gurubk",
        password: "123",
        name: "Bambang Wijaya, S.Pd, M.Kons",
        role: "guru",
        roleLabel: "Koordinator BK",
        sekbid: "Sekbid 2: Budi Pekerti Luhur",
        pembina: "PKS, ROHIS",
        pokja: "Pokja Kedisiplinan & Tata Tertib Siswa",
        icon: "👨‍🏫"
    },
    {
        username: "walikelas",
        password: "123",
        name: "Budi Santoso, S.Kom",
        role: "guru",
        roleLabel: "Staf Sekbid 9",
        sekbid: "Sekbid 9: Teknologi Informasi & Komunikasi (TIK)",
        pembina: "Robotika, Redicator",
        pokja: "Pokja Prestasi & Pengembangan Bakat Lomba",
        icon: "🧑‍🏫"
    }
];

const DAFTAR_KEGIATAN = [
    {
        id: "ACT-01",
        nama: "Latihan Dasar Kepemimpinan Siswa (LDKS) 2026",
        tanggal: "15 - 17 Maret 2026",
        kategori: "Kepemimpinan & Karakter",
        tempat: "Bumi Perkemahan Mandalawangi",
        keterangan: "Pembekalan kepemimpinan untuk seluruh pengurus OSIS dan MPK."
    },
    {
        id: "ACT-02",
        nama: "Bulan Bahasa & Pekan Literasi Budaya",
        tanggal: "24 - 28 Maret 2026",
        kategori: "Akademik & Seni",
        tempat: "Aula Utama & Lapangan Sekolah",
        keterangan: "Lomba cipta baca puisi, speech contest, dan pameran buku."
    },
    {
        id: "ACT-03",
        nama: "Sosialisasi Disiplin & Anti-Perundungan (Bullying)",
        tanggal: "04 April 2026",
        kategori: "Kedisiplinan & BK",
        tempat: "Auditorium Sekolah",
        keterangan: "Seminar edukasi karakter bersama psikolog remaja & dinas kepolisian."
    },
    {
        id: "ACT-04",
        nama: "Classmeeting & Turnamen Olahraga Antar Kelas",
        tanggal: "12 - 16 April 2026",
        kategori: "Olahraga & Kebersamaan",
        tempat: "GOR Sport Center Sekolah",
        keterangan: "Kompetisi futsal, basket 3x3, e-sport edukasi, dan tari tradisional."
    }
];

const DEFAULT_RULES = [
    { minPoint: 0, maxPoint: 15, status: "Aman / Pembinaan Ringan", action: "Peringatan lisan & pembinaan wali kelas", badgeClass: "pill-green" },
    { minPoint: 16, maxPoint: 30, status: "Peringatan Tertulis I", action: "Peringatan tertulis & pembinaan Guru BK", badgeClass: "pill-yellow" },
    { minPoint: 31, maxPoint: 50, status: "Panggilan Orang Tua I", action: "Surat Panggilan Orang Tua I & Surat Perjanjian I", badgeClass: "pill-yellow" },
    { minPoint: 51, maxPoint: 75, status: "Surat Peringatan 1 (SP 1)", action: "Panggilan Orang Tua II, SP 1 & Skorsing 3 Hari", badgeClass: "pill-red" },
    { minPoint: 76, maxPoint: 99, status: "Surat Peringatan 2 (SP 2)", action: "Panggilan Orang Tua III, SP 2 & Skorsing 1 Minggu", badgeClass: "pill-red" },
    { minPoint: 100, maxPoint: 9999, status: "Surat Peringatan 3 (SP 3 / Dikeluarkan)", action: "Konferensi Kasus & Pengembalian Siswa ke Orang Tua", badgeClass: "pill-red" }
];

const MASTER_PELANGGARAN = [
    { id: "P01", kategori: "Kedisiplinan", nama: "Terlambat masuk sekolah (1-15 menit)", poin: 5 },
    { id: "P02", kategori: "Kedisiplinan", nama: "Terlambat masuk sekolah (>15 menit)", poin: 10 },
    { id: "P03", kategori: "Kedisiplinan", nama: "Keluar kelas/sekolah tanpa izin (Membolos)", poin: 20 },
    { id: "P04", kategori: "Kedisiplinan", nama: "Tidak mengikuti upacara bendera / apel pagi", poin: 10 },
    { id: "P05", kategori: "Kedisiplinan", nama: "Tidak masuk sekolah tanpa keterangan (Alfa)", poin: 10 },
    { id: "P06", kategori: "Kerapian", nama: "Seragam tidak lengkap / tidak beratribut resmi", poin: 5 },
    { id: "P07", kategori: "Kerapian", nama: "Pakaian ketat, tidak dimasukkan, atau tidak sesuai jadwal", poin: 5 },
    { id: "P08", kategori: "Kerapian", nama: "Rambut gondrong / diwarnai (Laki-laki)", poin: 10 },
    { id: "P09", kategori: "Etika", nama: "Menggunakan HP saat KBM tanpa instruksi guru", poin: 10 },
    { id: "P10", kategori: "Etika", nama: "Bersikap tidak sopan / membantah guru atau karyawan", poin: 25 },
    { id: "P11", kategori: "Berat", nama: "Merokok / membawa rokok atau vape di lingkungan sekolah", poin: 40 },
    { id: "P12", kategori: "Berat", nama: "Terlibat perkelahian / tawuran di dalam atau luar sekolah", poin: 75 },
    { id: "P13", kategori: "Berat", nama: "Melakukan perundungan (Bullying) fisik atau verbal", poin: 50 },
    { id: "P14", kategori: "Berat", nama: "Membawa senjata tajam atau benda berbahaya", poin: 80 }
];

const MASTER_PRESTASI = [
    { id: "PR01", kategori: "Akademik", nama: "Juara 1 Lomba Akademik / Olimpiade Sains Nasional", poin: 100 },
    { id: "PR02", kategori: "Akademik", nama: "Juara 2/3 Olimpiade Sains Tingkat Nasional", poin: 80 },
    { id: "PR03", kategori: "Akademik", nama: "Juara 1 Lomba Akademik Tingkat Provinsi", poin: 60 },
    { id: "PR04", kategori: "Akademik", nama: "Juara 2/3 Lomba Akademik Tingkat Provinsi", poin: 50 },
    { id: "PR05", kategori: "Akademik", nama: "Juara 1/2/3 Lomba Akademik Tingkat Kota/Kabupaten", poin: 35 },
    { id: "PR06", kategori: "Non-Akademik", nama: "Juara 1 Kejuaraan Olahraga / Seni Tingkat Nasional", poin: 90 },
    { id: "PR07", kategori: "Non-Akademik", nama: "Juara 1 Kejuaraan Olahraga / Seni Tingkat Provinsi", poin: 55 },
    { id: "PR08", kategori: "Non-Akademik", nama: "Juara 1/2/3 Kejuaraan Olahraga / Seni Kota/Kabupaten", poin: 30 },
    { id: "PR09", kategori: "Karakter", nama: "Ketua OSIS / MPK Aktif dan Berintegritas", poin: 30 },
    { id: "PR10", kategori: "Karakter", nama: "Hafiz Quran (Juz Amma / 3+ Juz)", poin: 40 },
    { id: "PR11", kategori: "Karakter", nama: "Aksi Terpuji (Mengembalikan Barang Berharga)", poin: 20 }
];

const INITIAL_STUDENTS = [
    {
        id: "SIS-001",
        no: 1,
        nis: "230101",
        nisn: "0061234501",
        nama: "Ahmad Fauzan Syahputra",
        gender: "L",
        kelas: "XII RPL 1",
        jurusan: "Rekayasa Perangkat Lunak",
        nomorHp: "0812-9876-5401",
        alamat: "Jl. Cendrawasih No. 12, RT 02/RW 04, Kel. Sukamaju, Kec. Cilodong",
        mapsAlamat: "https://maps.google.com/?q=-6.2088,106.8456",
        namaOrtuBapak: "H. Syahputra, S.E",
        namaOrtuIbu: "Hj. Ratna Juwita",
        noHpBapak: "0812-3456-7890",
        noHpIbu: "0813-9876-5432",
        inputSpmb: "SPMB-2023-PRESTASI-001",
        waliKelas: "Budi Santoso, S.Kom",
        kontakOrtu: "0812-3456-7890",
        foto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
        prestasi: [
            {
                id: "PR-HIST-01",
                tanggal: "2026-02-14",
                nama: "Juara 1 Lomba Web Design & Coding EduTech 2026",
                kategori: "Akademik",
                tingkat: "Nasional",
                peringkat: "Juara 1",
                poin: 100,
                foto: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
                keterangan: "Mewakili provinsi ke tingkat nasional di Bandung dan meraih medali emas inovasi teknologi.",
                pencatat: "Dra. Hj. Siti Rahma (Kesiswaan)"
            },
            {
                id: "PR-HIST-02",
                tanggal: "2025-11-20",
                nama: "Ketua Panitia Bulan Bahasa & Literasi 2025",
                kategori: "Karakter",
                tingkat: "Sekolah",
                peringkat: "Apresiasi",
                poin: 20,
                foto: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80",
                keterangan: "Keberhasilan mengoordinasikan kegiatan literasi sekolah dengan keterlibatan 800+ siswa.",
                pencatat: "Budi Santoso, S.Kom"
            }
        ],
        pelanggaran: [
            {
                id: "PL-HIST-01",
                tanggal: "2026-01-10",
                nama: "Terlambat masuk sekolah (1-15 menit)",
                kategori: "Kedisiplinan",
                poin: 5,
                sanksi: "Tadarus pagi 15 menit & piket perpustakaan",
                pencatat: "H. Mustofa, M.Pd (Guru Piket)"
            }
        ]
    },
    {
        id: "SIS-002",
        no: 2,
        nis: "240201",
        nisn: "0061234502",
        nama: "Nabila Aurelia Putri",
        gender: "P",
        kelas: "XI MIPA 2",
        jurusan: "MIPA",
        nomorHp: "0813-8899-5402",
        alamat: "Komplek Taman Asri Blok B3 No. 7, Kel. Melati Indah",
        mapsAlamat: "https://maps.google.com/?q=-6.2150,106.8520",
        namaOrtuBapak: "Ir. Hendra Gunawan",
        namaOrtuIbu: "Dewi Handayani, S.Pd",
        noHpBapak: "0813-8899-1122",
        noHpIbu: "0812-7766-5544",
        inputSpmb: "SPMB-2024-ZONASI-042",
        waliKelas: "Dewi Lestari, M.Pd",
        kontakOrtu: "0813-8899-1122",
        foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        prestasi: [
            {
                id: "PR-HIST-03",
                tanggal: "2026-01-25",
                nama: "Medali Emas Olimpiade Biologi Pelajar (OSN-P)",
                kategori: "Akademik",
                tingkat: "Provinsi",
                peringkat: "Juara 1",
                poin: 60,
                foto: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
                keterangan: "Lolos dengan skor tertinggi se-provinsi dan melaju ke Olimpiade Sains Nasional.",
                pencatat: "Dewi Lestari, M.Pd"
            },
            {
                id: "PR-HIST-04",
                tanggal: "2025-10-18",
                nama: "Juara 2 Debat Bahasa Inggris Tingkat Kota",
                kategori: "Akademik",
                tingkat: "Kota/Kabupaten",
                peringkat: "Juara 2",
                poin: 35,
                foto: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
                keterangan: "Inter-Highschool English Debating Championship 2025.",
                pencatat: "Farhan Hakim, S.Pd"
            }
        ],
        pelanggaran: []
    },
    {
        id: "SIS-003",
        no: 3,
        nis: "230103",
        nisn: "0061234503",
        nama: "Reza Aditya Pratama",
        gender: "L",
        kelas: "XII TKJ 2",
        jurusan: "Teknik Komputer & Jaringan",
        nomorHp: "0852-7711-5403",
        alamat: "Jl. Dahlia Raya No. 88, RT 01/RW 09, Kel. Pondok Damai",
        mapsAlamat: "https://maps.google.com/?q=-6.2200,106.8400",
        namaOrtuBapak: "Agus Setiadi",
        namaOrtuIbu: "Siti Aminah",
        noHpBapak: "0852-7711-4433",
        noHpIbu: "0853-4433-2211",
        inputSpmb: "SPMB-2023-AFIRMASI-015",
        waliKelas: "Agus Salim, S.T",
        kontakOrtu: "0852-7711-4433",
        foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
        prestasi: [],
        pelanggaran: [
            {
                id: "PL-HIST-02",
                tanggal: "2026-01-08",
                nama: "Merokok / membawa rokok atau vape di lingkungan sekolah",
                kategori: "Berat",
                poin: 40,
                sanksi: "Pembinaan BK & Surat komitmen",
                pencatat: "Bambang Wijaya, S.Pd (BK)"
            },
            {
                id: "PL-HIST-03",
                tanggal: "2026-02-02",
                nama: "Keluar kelas/sekolah tanpa izin (Membolos)",
                kategori: "Kedisiplinan",
                poin: 20,
                sanksi: "Panggilan Orang Tua I & Tugas Literasi",
                pencatat: "Agus Salim, S.T"
            }
        ]
    },
    {
        id: "SIS-004",
        no: 4,
        nis: "240301",
        nisn: "0061234504",
        nama: "Dimas Arya Pangestu",
        gender: "L",
        kelas: "XI TKJ 1",
        jurusan: "Teknik Komputer & Jaringan",
        nomorHp: "0819-2233-5404",
        alamat: "Jl. Anggrek No. 4, RT 05/RW 02, Kel. Cisalak Pasar",
        mapsAlamat: "https://maps.google.com/?q=-6.2280,106.8600",
        namaOrtuBapak: "Bambang Pangestu",
        namaOrtuIbu: "Nurul Hidayati",
        noHpBapak: "0819-2233-4455",
        noHpIbu: "0818-6655-4433",
        inputSpmb: "SPMB-2024-REGULER-112",
        waliKelas: "Iwan Setiawan, S.Pd",
        kontakOrtu: "0819-2233-4455",
        foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
        prestasi: [],
        pelanggaran: [
            {
                id: "PL-HIST-05",
                tanggal: "2026-01-12",
                nama: "Terlibat perkelahian / tawuran di dalam atau luar sekolah",
                kategori: "Berat",
                poin: 75,
                sanksi: "Panggilan Orang Tua, Skorsing 3 Hari & SP 1",
                pencatat: "Bambang Wijaya, S.Pd (BK)"
            },
            {
                id: "PL-HIST-06",
                tanggal: "2026-02-05",
                nama: "Keluar kelas/sekolah tanpa izin (Membolos)",
                kategori: "Kedisiplinan",
                poin: 20,
                sanksi: "Peringatan Keras Tim Kesiswaan",
                pencatat: "H. Mustofa, M.Pd"
            }
        ]
    },
    {
        id: "SIS-005",
        no: 5,
        nis: "230401",
        nisn: "0061234505",
        nama: "Siti Nurhaliza Zahra",
        gender: "P",
        kelas: "XII AKL 1",
        jurusan: "Akuntansi",
        nomorHp: "0878-5544-5405",
        alamat: "Jl. Kenanga Timur No. 19, Kel. Mekarjaya",
        mapsAlamat: "https://maps.google.com/?q=-6.2110,106.8390",
        namaOrtuBapak: "H. Lukman Hakim",
        namaOrtuIbu: "Faridah Zahra",
        noHpBapak: "0878-5544-3322",
        noHpIbu: "0877-3322-1100",
        inputSpmb: "SPMB-2023-PRESTASI-029",
        waliKelas: "Rina Kusuma, S.E",
        kontakOrtu: "0878-5544-3322",
        foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
        prestasi: [
            {
                id: "PR-HIST-05",
                tanggal: "2026-02-01",
                nama: "Juara 1 Lomba Kompetensi Akuntansi Tingkat Kota",
                kategori: "Akademik",
                tingkat: "Kota/Kabupaten",
                peringkat: "Juara 1",
                poin: 35,
                foto: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
                keterangan: "Lomba Akuntansi Keuangan Lembaga Tingkat Kota Bandung.",
                pencatat: "Rina Kusuma, S.E"
            },
            {
                id: "PR-HIST-06",
                tanggal: "2025-09-10",
                nama: "Hafiz Quran 5 Juz Teruji",
                kategori: "Karakter",
                tingkat: "Sekolah",
                peringkat: "Mumtaz",
                poin: 40,
                foto: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80",
                keterangan: "Wisuda Tahfidz Angkatan 2025 dengan predikat kelulusan Mumtaz.",
                pencatat: "Ust. M. Ridwan, M.Ag"
            }
        ],
        pelanggaran: []
    },
    {
        id: "SIS-008",
        nisn: "0061234508",
        nama: "Fajar Ramadhan",
        gender: "L",
        kelas: "XII TBSM 1",
        jurusan: "Teknik Bisnis Sepeda Motor",
        waliKelas: "Wawan Kurniawan, S.T",
        kontakOrtu: "0856-1122-3344",
        foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
        prestasi: [],
        pelanggaran: [
            {
                id: "PL-HIST-09",
                tanggal: "2026-01-15",
                nama: "Merokok / membawa rokok di lingkungan sekolah",
                kategori: "Berat",
                poin: 40,
                sanksi: "Panggilan Wali Murid",
                pencatat: "Bambang Wijaya, S.Pd (BK)"
            },
            {
                id: "PL-HIST-10",
                tanggal: "2026-01-29",
                nama: "Mencemarkan nama baik guru di media sosial",
                kategori: "Etika",
                poin: 35,
                sanksi: "Permohonan maaf terbuka & SP 1",
                pencatat: "Dra. Hj. Siti Rahma (Kesiswaan)"
            },
            {
                id: "PL-HIST-11",
                tanggal: "2026-02-16",
                nama: "Keluar kelas tanpa izin (Membolos)",
                kategori: "Kedisiplinan",
                poin: 20,
                sanksi: "Panggilan Orang Tua III, SP 2 & Skorsing",
                pencatat: "Wawan Kurniawan, S.T"
            }
        ]
    }
];


// ==========================================================================
// PROGRAM KERJA SEKSI BIDANG (SEKBID 1 - 10) OSIS & KESISWAAN
// ==========================================================================
const DEFAULT_SEKBID_PROGRAMS = [
    {
        id: "SEKBID-01",
        nomor: 1,
        nama: "Seksi Bidang 1: Pembinaan Keimanan & Ketakwaan terhadap Tuhan YME",
        namaSingkat: "Keimanan & Ketakwaan",
        ikon: "🕌",
        warna: "#0d9488",
        pembina: "Ust. M. Ridwan, M.Ag",
        ketuaSiswa: "Ahmad Fauzan Syahputra (Rohis)",
        visi: "Mewujudkan generasi pelajar yang beriman teguh, bertakwa, berakhlak karimah, serta toleran antar umat beragama.",
        programKerja: [
            {
                nama: "Kajian Rutin Keputrian & Rohis Jumat",
                periode: "Setiap Jumat Siang",
                sasaran: "Seluruh Siswa Muslim",
                status: "Sedang Berjalan",
                badgeClass: "pill-blue",
                keterangan: "Pembinaan akidah, fiqih remaja, dan pembentukan akhlak terpuji."
            },
            {
                nama: "Peringatan Hari Besar Islam (PHBI)",
                periode: "Triwulanan",
                sasaran: "Seluruh Warga Sekolah",
                status: "Terencana",
                badgeClass: "pill-yellow",
                keterangan: "Penyelenggaraan Isra Mi'raj, Maulid Nabi, dan Idul Adha dengan kegiatan bermakna."
            },
            {
                nama: "Pesantren Ramadhan & Baksos Peduli Sesama",
                periode: "Bulan Ramadhan",
                sasaran: "Siswa & Masyarakat Sekitar",
                status: "Terencana",
                badgeClass: "pill-yellow",
                keterangan: "Tadarus Al-Qur'an massal, buka puasa bersama, dan santunan anak yatim piatu."
            },
            {
                nama: "Persekutuan Doa & Kebaktian Pelajar Kristiani",
                periode: "Setiap Jumat Pagi",
                sasaran: "Siswa Kristen & Katolik",
                status: "Sedang Berjalan",
                badgeClass: "pill-blue",
                keterangan: "Ibadah bersama dan pembinaan spiritual bagi pelajar Kristiani."
            }
        ]
    },
    {
        id: "SEKBID-02",
        nomor: 2,
        nama: "Seksi Bidang 2: Pembinaan Budi Pekerti Luhur & Akhlak Mulia",
        namaSingkat: "Budi Pekerti & Karakter",
        ikon: "🤝",
        warna: "#2563eb",
        pembina: "Bambang Wijaya, S.Pd, M.Kons (BK)",
        ketuaSiswa: "Muhammad Rayhan (OSIS)",
        visi: "Membangun kultur sekolah yang beradab, berkarakter 5S, santun, dan bebas dari perundungan (anti-bullying).",
        programKerja: [
            {
                nama: "Gerakan Budaya 5S (Senyum, Salam, Sapa, Sopan, Santun)",
                periode: "Setiap Hari Sekolah",
                sasaran: "Seluruh Warga Sekolah",
                status: "Sedang Berjalan",
                badgeClass: "pill-green",
                keterangan: "Penyambutan siswa di pintu gerbang utama oleh guru piket dan perwakilan OSIS."
            },
            {
                nama: "Satgas Sahabat Sebaya & Duta Anti-Perundungan",
                periode: "Semester Genap",
                sasaran: "Perwakilan Siswa Tiap Kelas",
                status: "Terlaksana",
                badgeClass: "pill-green",
                keterangan: "Pelatihan resolusi konflik damai, mediasi teman sebaya, dan pelaporan perundungan aman."
            },
            {
                nama: "Operasi Penertiban Kerapian & Atribut Sekolah",
                periode: "Setiap Senin Pagi",
                sasaran: "Seluruh Siswa",
                status: "Sedang Berjalan",
                badgeClass: "pill-blue",
                keterangan: "Pengecekan kelengkapan dasi, ikat pinggang, kaos kaki, dan potongan rambut rapi."
            }
        ]
    },
    {
        id: "SEKBID-03",
        nomor: 3,
        nama: "Seksi Bidang 3: Pembinaan Kepribadian Unggul, Wawasan Kebangsaan & Bela Negara",
        namaSingkat: "Wawasan Kebangsaan & Bela Negara",
        ikon: "🇮🇩",
        warna: "#dc2626",
        pembina: "Drs. H. Suryono (Paskibra)",
        ketuaSiswa: "Reza Aditya Pratama",
        visi: "Menumbuhkan jiwa patriotisme, kedisiplinan tinggi, cinta tanah air, dan loyalitas terhadap NKRI.",
        programKerja: [
            {
                nama: "Penyelenggaraan Upacara Bendera Khidmat",
                periode: "Setiap Hari Senin",
                sasaran: "Seluruh Civitas Akademika",
                status: "Sedang Berjalan",
                badgeClass: "pill-green",
                keterangan: "Penggiliran petugas upacara antar kelas dengan supervisi pembina Paskibra."
            },
            {
                nama: "Latihan Dasar Kepemimpinan Siswa (LDKS)",
                periode: "Semester Genap (April 2026)",
                sasaran: "Pengurus OSIS, MPK & Ekstrakurikuler",
                status: "Terencana",
                badgeClass: "pill-yellow",
                keterangan: "Pembekalan kepemimpinan lapangan, problem solving, dan ketahanan mental."
            },
            {
                nama: "Peringatan Hari Pahlawan & Seminar Bela Negara",
                periode: "Bulan November",
                sasaran: "Siswa Kelas X & XI",
                status: "Terencana",
                badgeClass: "pill-yellow",
                keterangan: "Kunjungan ke museum perjuangan dan diskusi wawasan kebangsaan bersama TNI/Polri."
            }
        ]
    },
    {
        id: "SEKBID-04",
        nomor: 4,
        nama: "Seksi Bidang 4: Pembinaan Prestasi Akademik, Seni & Olahraga",
        namaSingkat: "Prestasi, Seni & Olahraga",
        ikon: "🏆",
        warna: "#ea580c",
        pembina: "Dewi Lestari, M.Pd & Dra. Hj. Siti Rahma",
        ketuaSiswa: "Nabila Aurelia Putri",
        visi: "Mengoptimalkan potensi bakat minat siswa hingga meraih prestasi juara di tingkat daerah, nasional, dan internasional.",
        programKerja: [
            {
                nama: "Klinik Olimpiade Sains Nasional (OSN) & Riset Pelajar",
                periode: "Setiap Pekan (Selasa & Kamis)",
                sasaran: "Klub Sains & Riset",
                status: "Sedang Berjalan",
                badgeClass: "pill-blue",
                keterangan: "Bimbingan materi advance matematika, fisika, kimia, biologi, informatika, dan astronomi."
            },
            {
                nama: "Turnamen Olahraga Classmeeting & Liga Sekolah",
                periode: "Akhir Semester",
                sasaran: "Seluruh Kelas",
                status: "Terlaksana",
                badgeClass: "pill-green",
                keterangan: "Pertandingan futsal, basket 3x3, voli, dan bulu tangkis antar kelas."
            },
            {
                nama: "Pentas Seni (Pensi) & Festival Budaya Pelajar",
                periode: "Akhir Tahun Ajaran",
                sasaran: "Warga Sekolah & Umum",
                status: "Terencana",
                badgeClass: "pill-yellow",
                keterangan: "Eksibisi karya seni rupa, pertunjukan teater, band musik sekolah, dan tari kreasi."
            }
        ]
    },
    {
        id: "SEKBID-05",
        nomor: 5,
        nama: "Seksi Bidang 5: Pembinaan Demokrasi, HAM, Lingkungan Hidup & Kepekaan Sosial",
        namaSingkat: "Demokrasi & Lingkungan Hidup",
        ikon: "🌱",
        warna: "#16a34a",
        pembina: "Rina Kusuma, S.E",
        ketuaSiswa: "Siti Nurhaliza Zahra",
        visi: "Mendorong nilai demokrasi sehat, kepedulian lingkungan hijau asri, dan empati sosial tinggi.",
        programKerja: [
            {
                nama: "Pemilihan Ketua OSIS (Pilketos) Berbasis E-Voting",
                periode: "Awal Semester Ganjil",
                sasaran: "Seluruh Siswa, Guru & Karyawan",
                status: "Terlaksana",
                badgeClass: "pill-green",
                keterangan: "Edukasi pemilu jurdil melalui debat kandidat dan sistem voting digital transparan."
            },
            {
                nama: "Gerakan Sekolah Adiwiyata & Bank Sampah Digital",
                periode: "Berkelanjutan",
                sasaran: "Seluruh Kelas",
                status: "Sedang Berjalan",
                badgeClass: "pill-blue",
                keterangan: "Pengelolaan pilah sampah organik-anorganik dan pemeliharaan taman kelas asri."
            },
            {
                nama: "Bakti Sosial & Tanggap Darurat Bencana",
                periode: "Kondisional / Insidental",
                sasaran: "Warga Membutuhkan",
                status: "Sedang Berjalan",
                badgeClass: "pill-blue",
                keterangan: "Penggalangan dana sukarela dan bantuan kemanusiaan tanggap bencana alam."
            }
        ]
    },
    {
        id: "SEKBID-06",
        nomor: 6,
        nama: "Seksi Bidang 6: Pembinaan Kreativitas, Keterampilan & Kewirausahaan",
        namaSingkat: "Kewirausahaan & Kreativitas",
        ikon: "💡",
        warna: "#ca8a04",
        pembina: "Farhan Hakim, S.Pd",
        ketuaSiswa: "Dimas Arya Pangestu",
        visi: "Menumbuhkan jiwa mandiri, inovasi produk, kecakapan hidup (life skills), dan semangat enterpreneur muda.",
        programKerja: [
            {
                nama: "Bazar Kewirausahaan & Expo Proyek P5 Siswa",
                periode: "Semester Genap",
                sasaran: "Siswa Kelas X & XI",
                status: "Terencana",
                badgeClass: "pill-yellow",
                keterangan: "Pameran karya inovasi produk olahan pangan lokal, kerajinan daur ulang, dan stand usaha."
            },
            {
                nama: "Pemberdayaan Koperasi Siswa (Kopsis) Mandiri",
                periode: "Setiap Hari Sekolah",
                sasaran: "Anggota Koperasi Siswa",
                status: "Sedang Berjalan",
                badgeClass: "pill-green",
                keterangan: "Penyediaan alat tulis, seragam, dan pelatihan pencatatan kas ritel praktis."
            }
        ]
    },
    {
        id: "SEKBID-07",
        nomor: 7,
        nama: "Seksi Bidang 7: Pembinaan Kualitas Jasmani, Kesehatan & Gizi",
        namaSingkat: "Jasmani, Kesehatan & Gizi",
        ikon: "🍎",
        warna: "#0284c7",
        pembina: "Hendra Wijaya, S.Pd (PMR & Olahraga)",
        ketuaSiswa: "Alya Sabrina",
        visi: "Mewujudkan siswa yang sehat fisik, bugar, memiliki ketahanan tubuh prima, dan mengerti pola hidup higienis.",
        programKerja: [
            {
                nama: "Jumat Bugar: Senam Kesegaran Jasmani (SKJ) Bersama",
                periode: "Dua Pekan Sekali (Jumat Pagi)",
                sasaran: "Seluruh Warga Sekolah",
                status: "Sedang Berjalan",
                badgeClass: "pill-green",
                keterangan: "Senam aerobik bersama di lapangan dengan instruktur bergilir."
            },
            {
                nama: "Edukasi Gizi Seimbang & Minum Tablet Tambah Darah (TTD)",
                periode: "Bulanan",
                sasaran: "Siswi Remaja Putri",
                status: "Sedang Berjalan",
                badgeClass: "pill-blue",
                keterangan: "Kerjasama dengan Puskesmas untuk pencegahan anemia dan edukasi makanan sehat bergizi."
            },
            {
                nama: "UKS Siaga & Pelayanan P3K Cepat",
                periode: "Harian",
                sasaran: "Pasien Sekolah",
                status: "Sedang Berjalan",
                badgeClass: "pill-green",
                keterangan: "Penyediaan obat pertolongan pertama dan ruang istirahat yang higienis."
            }
        ]
    },
    {
        id: "SEKBID-08",
        nomor: 8,
        nama: "Seksi Bidang 8: Pembinaan Sastra, Bahasa & Budaya",
        namaSingkat: "Sastra & Budaya",
        ikon: "🎭",
        warna: "#9333ea",
        pembina: "Siti Maryam, S.Pd",
        ketuaSiswa: "Putri Anggraini",
        visi: "Melestarikan kekayaan budaya nusantara dan mengasah kepekaan sastra serta kecintaan membaca.",
        programKerja: [
            {
                nama: "Pojok Literasi & Majalah Dinding (Mading) Berkala",
                periode: "Dwi Mingguan",
                sasaran: "Redaksi Kelas",
                status: "Sedang Berjalan",
                badgeClass: "pill-blue",
                keterangan: "Penerbitan karya puisi, cerpen, artikel edukatif, dan poster informasi siswa."
            },
            {
                nama: "Peringatan Bulan Bahasa & Lomba Menulis Cerpen",
                periode: "Bulan Oktober",
                sasaran: "Seluruh Siswa",
                status: "Terlaksana",
                badgeClass: "pill-green",
                keterangan: "Apresiasi sastra dan gelar wicara bersama penulis nasional."
            }
        ]
    },
    {
        id: "SEKBID-09",
        nomor: 9,
        nama: "Seksi Bidang 9: Pembinaan Teknologi Informasi & Komunikasi (TIK)",
        namaSingkat: "Teknologi Informasi & Komunikasi (TIK)",
        ikon: "💻",
        warna: "#3b82f6",
        pembina: "Budi Santoso, S.Kom",
        ketuaSiswa: "Ahmad Fauzan Syahputra",
        visi: "Memajukan literasi teknologi digital, keamanan siber, dan publikasi multimedia kesiswaan yang kredibel.",
        programKerja: [
            {
                nama: "Pengelolaan & Pembaruan Web Kesiswaan Terpadu",
                periode: "Berkelanjutan",
                sasaran: "Publik & Komunitas Sekolah",
                status: "Sedang Berjalan",
                badgeClass: "pill-green",
                keterangan: "Sistem pencatatan prestasi, transparansi kegiatan, tata tertib, dan rekapitulasi poin."
            },
            {
                nama: "Workshop Cyber Safety & Etika Bersosial Media",
                periode: "Semester Genap (Maret 2026)",
                sasaran: "Seluruh Siswa",
                status: "Terencana",
                badgeClass: "pill-yellow",
                keterangan: "Edukasi privasi data pribadi, pencegahan cyberbullying, dan literasi anti-hoaks."
            },
            {
                nama: "Tim Kreatif Dokumentasi & Liputan Acara Sekolah",
                periode: "Setiap Kegiatan",
                sasaran: "Liputan Media Sosial",
                status: "Sedang Berjalan",
                badgeClass: "pill-green",
                keterangan: "Fotografi profesional, liputan video reels, dan publikasi prestasi siswa."
            }
        ]
    },
    {
        id: "SEKBID-10",
        nomor: 10,
        nama: "Seksi Bidang 10: Pembinaan Komunikasi Bahasa Asing / International Club",
        namaSingkat: "Bahasa Asing & Internasional",
        ikon: "🌐",
        warna: "#059669",
        pembina: "Linda Permatasari, M.Hum",
        ketuaSiswa: "Kevin Sanjaya",
        visi: "Mempersiapkan siswa memiliki kecakapan komunikasi global, percaya diri berbicara bahasa asing, dan berwawasan internasional.",
        programKerja: [
            {
                nama: "English Club (EC) & Japanese / Arabic Corner",
                periode: "Setiap Kamis Sore",
                sasaran: "Anggota Klub Bahasa",
                status: "Sedang Berjalan",
                badgeClass: "pill-blue",
                keterangan: "Latihan percakapan tematik, debat bahasa Inggris santai, dan bedah film edukatif."
            },
            {
                nama: "School English Speech & Storytelling Contest",
                periode: "Semester Genap",
                sasaran: "Seluruh Perwakilan Kelas",
                status: "Terencana",
                badgeClass: "pill-yellow",
                keterangan: "Asah keterampilan public speaking dan kepercayaan diri tampil di panggung."
            }
        ]
    }
];

// ==========================================================================
// TATA TERTIB & PEDOMAN KEDISIPLINAN SISWA RESMI
// ==========================================================================
const DEFAULT_TATA_TERTIB = [
    {
        id: "TT-01",
        kategori: "kehadiran",
        kategoriLabel: "🕒 Waktu & Kehadiran",
        judul: "Jam Masuk & Presensi Kehadiran Siswa",
        ikon: "⏰",
        poinRentang: "Poin 5 - 20",
        butirAturan: [
            "Bel masuk sekolah berbunyi tepat pukul 07.00 WIB. Siswa wajib hadir di sekolah paling lambat 15 menit sebelum bel berbunyi (06.45 WIB).",
            "Pukul 07.00 - 07.15 WIB diawali kegiatan pembiasaan: menyanyikan Lagu Indonesia Raya, tadarus Al-Qur'an / doa bersama, dan literasi pagi.",
            "Siswa yang tiba di sekolah setelah pukul 07.00 WIB dinyatakan terlambat dan wajib melapor ke Guru Piket untuk mendapatkan surat izin masuk kelas (Terlambat 1-15 menit: Poin 5; Terlambat >15 menit: Poin 10).",
            "Siswa yang tidak hadir karena sakit wajib menyerahkan surat keterangan dokter atau surat dari orang tua/wali. Ketidakhadiran tanpa izin (Alfa) dikenakan sanksi Poin 10.",
            "Siswa dilarang meninggalkan area sekolah selama jam pelajaran berlangsung tanpa izin tertulis dari Guru Piket / Guru BK (Membolos dikenakan sanksi Poin 20)."
        ]
    },
    {
        id: "TT-02",
        kategori: "seragam",
        kategoriLabel: "👔 Seragam & Kerapian",
        judul: "Standar Pakaian Seragam & Atribut Kerapian",
        ikon: "👔",
        poinRentang: "Poin 5 - 10",
        butirAturan: [
            "Senin & Selasa: Seragam Putih Abu-Abu lengkap dengan badge OSIS, lambang sekolah, dasi, ikat pinggang resmi sekolah, dan kaos kaki putih di atas mata kaki.",
            "Rabu: Seragam Khas Sekolah / Kejuruan rapi dan sopan.",
            "Kamis: Pakaian Batik Sekolah dengan bawahan sesuai ketentuan.",
            "Jumat: Seragam Pramuka Lengkap / Busana Muslim Sekolah berpenampilan bersih.",
            "Sepatu wajib dominan hitam (minimal 80% warna hitam) bertali rapi.",
            "Kerapian Rambut Siswa Laki-Laki: Dipotong rapi standar 3-2-1 (tidak menyentuh alis, telinga, atau kerah baju), tidak dicat warna, serta tidak bertato/tindik.",
            "Kerapian Siswi Perempuan: Mengenakan pakaian seragam tidak ketat, jilbab rapi sesuai warna seragam, dan tidak menggunakan perhiasan atau riasan berlebihan."
        ]
    },
    {
        id: "TT-03",
        kategori: "etika",
        kategoriLabel: "🤝 Etika & Karakter",
        judul: "Tata Krama, Sopan Santun & Karakter Pelajar",
        ikon: "🤝",
        poinRentang: "Poin 10 - 25",
        butirAturan: [
            "Menjunjung tinggi budaya 5S (Senyum, Salam, Sapa, Sopan, Santun) kepada Guru, Karyawan, Tamu, dan sesama pelajar di dalam maupun luar sekolah.",
            "Dilarang mengaktifkan, memainkan game, atau menggunakan gawai/HP saat KBM berlangsung tanpa instruksi guru pengajar.",
            "Menjaga kebersihan ruang kelas, selasar, laboratorium, toilet, dan fasilitas sekolah dengan membuang sampah pada tempat pemilahan.",
            "Menghargai keberagaman suku, agama, dan latar belakang sesama warga sekolah. Bersikap inklusif dan saling tolong-menolong.",
            "Dilarang bersikap menentang, bersikap tidak sopan, atau berkata kasar kepada guru dan staf pengajar (Poin 25)."
        ]
    },
    {
        id: "TT-04",
        kategori: "larangan",
        kategoriLabel: "⚠️ Larangan Keras",
        judul: "Pelanggaran Berat & Kebijakan Toleransi Nol",
        ikon: "🚫",
        poinRentang: "Poin 40 - 100",
        butirAturan: [
            "Dilarang keras merokok, membawa rokok tembakau maupun rokok elektrik (vape) di lingkungan sekolah atau selama mengenakan atribut seragam sekolah (Poin 40).",
            "Dilarang keras melakukan perundungan (bullying) fisik, verbal, pengucilan, maupun cyberbullying di media sosial (Poin 50).",
            "Dilarang keras terlibat perkelahian perseorangan maupun tawuran antarpelajar di dalam ataupun di luar lingkungan sekolah (Poin 75).",
            "Dilarang keras membawa senjata tajam, senjata api, atau benda berbahaya yang tidak terkait dengan alat pembelajaran (Poin 80).",
            "Dilarang keras membawa, mengedarkan, atau mengonsumsi minuman keras beralkohol dan narkotika/zat adiktif (Langsung SP 3 / Dikeluarkan dari sekolah)."
        ]
    },
    {
        id: "TT-05",
        kategori: "sanksi",
        kategoriLabel: "⚖️ Sistem Poin & Sanksi",
        judul: "Mekanisme Akumulasi Poin Pelanggaran & Poin Apresiasi",
        ikon: "⚖️",
        poinRentang: "Tahapan SP 1 - SP 3",
        butirAturan: [
            "Rentang 0 - 15 Poin (Aman / Pembinaan Ringan): Peringatan lisan, konseling awal, dan pencatatan oleh Wali Kelas.",
            "Rentang 16 - 30 Poin (Peringatan Tertulis): Pemanggilan oleh Guru BK, penandatanganan surat peringatan pembinaan karakter.",
            "Rentang 31 - 50 Poin (Panggilan Orang Tua I): Penerbitan Surat Panggilan Resmi ke Orang Tua/Wali dan penandatanganan komitmen bersama.",
            "Rentang 51 - 75 Poin (Surat Peringatan 1 / SP 1): Pemanggilan Orang Tua II, penerbitan surat SP 1, dan skorsing pembinaan di rumah selama 3 hari.",
            "Rentang 76 - 99 Poin (Surat Peringatan 2 / SP 2): Pemanggilan Orang Tua III, penerbitan surat SP 2, dan skorsing pembinaan 1 minggu.",
            "Akumulasi 100+ Poin (Surat Peringatan 3 / SP 3): Konferensi kasus dewan guru, Kepala Sekolah, dan pengembalian pembinaan siswa kepada orang tua/wali.",
            "Hak Apresiasi Siswa: Siswa yang berprestasi mendapatkan poin penghargaan dan piagam apresiasi resmi yang tertera pada Rapor Karakter."
        ]
    }
];

// ==========================================================================
// PAPAN PENGUMUMAN RESMI KESISWAAN
// ==========================================================================
const DEFAULT_PENGUMUMAN = [
    {
        id: "ANN-01",
        kategori: "penting",
        kategoriLabel: "🔴 PENTING",
        badgeClass: "pill-red",
        judul: "Penegakan Disiplin Jam Masuk & Kerapian Seragam Semester Genap",
        tanggal: "22 Maret 2026",
        penulis: "Dra. Hj. Siti Rahma (Wakasek Kesiswaan)",
        ringkasan: "Pemberitahuan kepada seluruh siswa mengenai penertiban presensi pagi pukul 07.00 WIB dan pemeriksaan atribut seragam resmi sekolah.",
        isi: "Diberitahukan kepada seluruh siswa-siswi SMA Negeri 1 Kreasi Bangsa bahwa terhitung mulai pekan depan, Tim Kesiswaan bersama Guru Piket akan melaksanakan penertiban kedisiplinan secara intensif:\n\n1. Gerbang sekolah ditutup tepat pukul 07.00 WIB. Siswa yang hadir setelah pukul 07.00 WIB wajib mengikuti pembinaan tadarus pagi di serambi masjid sekolah sebelum menerima izin masuk KBM.\n2. Seluruh siswa wajib memakai atribut seragam lengkap (topi, dasi, ikat pinggang hitam berlogo sekolah, kaos kaki putih, dan sepatu dominan hitam bertali).\n3. Bagi siswa laki-laki yang rambutnya telah melebihi batas ketentuan 3-2-1, diimbau untuk segera merapikan sebelum hari Senin mendatang.\n\nMari kita jaga bersama marwah dan budaya disiplin sekolah kita. Atas perhatian dan kerjasama seluruh siswa, kami ucapkan terima kasih."
    },
    {
        id: "ANN-02",
        kategori: "prestasi",
        kategoriLabel: "🟢 PRESTASI",
        badgeClass: "pill-green",
        judul: "Apresiasi Juara 1 Nasional Lomba Web Coding & Medali Emas OSN Biologi",
        tanggal: "18 Maret 2026",
        penulis: "Pokja Prestasi & Pengembangan Bakat",
        ringkasan: "Sekolah menyampaikan selamat dan apresiasi setinggi-tingginya kepada Ahmad Fauzan Syahputra dan Nabila Aurelia Putri atas torehan juara tingkat nasional & provinsi.",
        isi: "Keluarga Besar SMA Negeri 1 Kreasi Bangsa menyampaikan rasa bangga dan apresiasi setinggi-tingginya kepada:\n\n1. **Ahmad Fauzan Syahputra (Kelas XII RPL 1)** - Meraih **Juara 1 Tingkat Nasional** pada ajang Web Design & Coding EduTech 2026 di Bandung (+100 Poin Prestasi).\n2. **Nabila Aurelia Putri (Kelas XI MIPA 2)** - Meraih **Medali Emas (Juara 1)** Olimpiade Sains Nasional Tingkat Provinsi (OSN-P) Bidang Biologi dan lolos ke Tingkat Nasional (+60 Poin Prestasi).\n\nPiagam penghargaan dan beasiswa apresiasi kesiswaan akan diserahkan secara resmi saat apel bendera hari Senin mendatang. Semoga pencapaian ini menjadi inspirasi dan pemantik semangat juang bagi seluruh rekan-rekan pelajar lainnya."
    },
    {
        id: "ANN-03",
        kategori: "kegiatan",
        kategoriLabel: "🔵 KEGIATAN",
        badgeClass: "pill-blue",
        judul: "Pendaftaran Calon Peserta Latihan Dasar Kepemimpinan Siswa (LDKS) 2026",
        tanggal: "14 Maret 2026",
        penulis: "Pembina OSIS & MPK (Drs. H. Suryono)",
        ringkasan: "Pendaftaran peserta LDKS 2026 bagi pengurus OSIS, MPK, dan calon ketua ekstrakurikuler periode 2026/2027 telah resmi dibuka.",
        isi: "Disampaikan kepada seluruh pengurus OSIS, MPK, serta delegasi calon pemimpin ekstrakurikuler sekolah:\n\nKegiatan Latihan Dasar Kepemimpinan Siswa (LDKS) Tahun Ajaran 2025/2026 akan dilaksanakan pada:\n- **Hari/Tanggal**: Rabu s.d. Jumat, 15 - 17 April 2026\n- **Lokasi**: Bumi Perkemahan Mandalawangi, Cibodas\n- **Agenda Utama**: Pembekalan leadership, ketahanan mental, problem solving organisasi, manajemen waktu, dan wawasan kebangsaan.\n\nBagi siswa kelas X dan XI yang berminat mendaftar, formulir registrasi dapat diambil di Ruang Kesiswaan atau diunduh melalui pengumuman kesiswaan. Pendaftaran ditutup pada 30 Maret 2026."
    },
    {
        id: "ANN-04",
        kategori: "informasi",
        kategoriLabel: "🟡 INFORMASI",
        badgeClass: "pill-yellow",
        judul: "Layanan Konseling Ramah Remaja & Tes Minat Bakat Karir di Ruang BK",
        tanggal: "08 Maret 2026",
        penulis: "Koordinator BK (Bambang Wijaya, S.Pd)",
        ringkasan: "Ruang Bimbingan Konseling (BK) menyediakan sesi konseling terbuka, pendampingan pemilihan jurusan perguruan tinggi, dan konsultasi pribadi.",
        isi: "Dalam rangka mendukung kenyamanan belajar dan kesehatan mental siswa, Unit Bimbingan Konseling (BK) membuka layanan konsultasi ramah anak:\n\n1. **Konseling Pribadi & Sosial**: Terbuka setiap hari kerja di jam istirahat atau sepulang sekolah. Kerahasiaan cerita dan data siswa 100% dijamin.\n2. **Bimbingan Karir & Masuk PTN/PTS**: Khusus siswa kelas XII, tersedia fasilitas asesmen minat bakat, simulasi skor SNBP/SNBT, serta konsultasi portofolio prestasi.\n3. Siswa dapat membuat janji temu langsung ke Ruang BK atau melalui perwakilan wali kelas masing-masing.\n\nIngat, Ruang BK adalah sahabat siswa, tempat berbagi solusi, bukan ruang hukuman!"
    }
];

