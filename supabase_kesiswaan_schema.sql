-- ==============================================================================
-- SKEMA DATABASE LENGKAP SISTEM INFORMASI KESISWAAN (SIKESISWAAN)
-- UNTUK SUPABASE CLOUD (POSTGRESQL & STORAGE)
-- ==============================================================================
-- Petunjuk:
-- 1. Buka Dashboard Supabase Anda (https://app.supabase.com)
-- 2. Pilih Project Anda -> Buka menu "SQL Editor" di bilah kiri
-- 3. Klik "+ New query", salin dan tempel SELURUH isi file ini
-- 4. Klik tombol "Run" (atau Ctrl + Enter)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABEL PENGATURAN SEKOLAH & BRANDING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pengaturan (
    parameter VARCHAR(100) PRIMARY KEY,
    nilai TEXT NOT NULL,
    deskripsi TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- ==============================================================================
-- 3. TABEL GURU & TIM KESISWAAN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.guru (
    username VARCHAR(50) PRIMARY KEY,
    password TEXT NOT NULL,
    nama VARCHAR(150) NOT NULL,
    role VARCHAR(30) DEFAULT 'guru' CHECK (role IN ('superadmin', 'guru')),
    role_label VARCHAR(100) DEFAULT 'Staf Kesiswaan',
    sekbid VARCHAR(150) DEFAULT '-',
    pokja VARCHAR(150) DEFAULT '-',
    pembina TEXT DEFAULT '-',
    icon VARCHAR(20) DEFAULT '👨‍🏫',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- ==============================================================================
-- 4. TABEL SISWA (18+ ATRIBUT LENGKAP)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.siswa (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'SIS-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0'),
    no INT DEFAULT 1,
    foto TEXT DEFAULT '',
    nis VARCHAR(30) DEFAULT '',
    nisn VARCHAR(30) UNIQUE NOT NULL,
    nama VARCHAR(150) NOT NULL,
    gender VARCHAR(5) DEFAULT 'L' CHECK (gender IN ('L', 'P')),
    kelas VARCHAR(50) NOT NULL,
    jurusan VARCHAR(100) DEFAULT '-',
    nomor_hp VARCHAR(50) DEFAULT '',
    alamat TEXT DEFAULT '',
    maps_alamat TEXT DEFAULT '',
    nama_ortu_bapak VARCHAR(100) DEFAULT '',
    nama_ortu_ibu VARCHAR(100) DEFAULT '',
    no_hp_bapak VARCHAR(50) DEFAULT '',
    no_hp_ibu VARCHAR(50) DEFAULT '',
    input_spmb VARCHAR(100) DEFAULT '',
    wali_kelas VARCHAR(100) DEFAULT '-',
    kontak_ortu VARCHAR(100) DEFAULT '-',
    status VARCHAR(20) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif', 'Lulus', 'Pindah')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- ==============================================================================
-- 5. TABEL PELANGGARAN SISWA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pelanggaran (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'PL-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
    nisn VARCHAR(30) NOT NULL REFERENCES public.siswa(nisn) ON UPDATE CASCADE ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    nama VARCHAR(200) NOT NULL,
    kasus TEXT DEFAULT '',
    kategori VARCHAR(50) DEFAULT 'Kedisiplinan',
    poin INT NOT NULL DEFAULT 5,
    sanksi TEXT DEFAULT 'Pembinaan lisan',
    pencatat VARCHAR(100) DEFAULT 'Guru Piket',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- ==============================================================================
-- 6. TABEL PRESTASI SISWA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.prestasi (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'PR-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
    nisn VARCHAR(30) NOT NULL REFERENCES public.siswa(nisn) ON UPDATE CASCADE ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    nama VARCHAR(200) NOT NULL,
    kategori VARCHAR(50) DEFAULT 'Akademik',
    tingkat VARCHAR(50) DEFAULT 'Sekolah',
    peringkat VARCHAR(50) DEFAULT 'Juara 1',
    penyelenggara VARCHAR(150) DEFAULT '-',
    piagam TEXT DEFAULT '',
    poin INT NOT NULL DEFAULT 20,
    foto TEXT DEFAULT '',
    keterangan TEXT DEFAULT '',
    pencatat VARCHAR(100) DEFAULT 'Tim Kesiswaan',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- ==============================================================================
-- 7. TABEL KEGIATAN & AGENDA KESISWAAN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.kegiatan (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'ACT-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
    nama VARCHAR(200) NOT NULL,
    tanggal VARCHAR(100) NOT NULL,
    kategori VARCHAR(100) DEFAULT 'Kegiatan Sekolah',
    tempat VARCHAR(150) DEFAULT 'Lingkungan Sekolah',
    keterangan TEXT DEFAULT '',
    foto TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- ==============================================================================
-- 8. TABEL PENGUMUMAN RESMI
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pengumuman (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'ANN-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
    kategori VARCHAR(50) DEFAULT 'informasi',
    kategori_label VARCHAR(50) DEFAULT '🟡 INFORMASI',
    badge_class VARCHAR(50) DEFAULT 'pill-yellow',
    judul VARCHAR(200) NOT NULL,
    tanggal VARCHAR(50) NOT NULL,
    penulis VARCHAR(100) DEFAULT 'Tim Kesiswaan',
    ringkasan TEXT DEFAULT '',
    isi TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- ==============================================================================
-- 9. TABEL KATA MUTIARA & MOTIVASI (QUOTES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quotes (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    tokoh VARCHAR(100) DEFAULT 'Pesan Kesiswaan',
    warna VARCHAR(50) DEFAULT 'ocean',
    font VARCHAR(50) DEFAULT 'playfair',
    efek VARCHAR(50) DEFAULT 'all',
    kategori VARCHAR(100) DEFAULT '💡 Kata Mutiara & Motivasi Hari Ini',
    custom_color VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('asia/jakarta', NOW())
);

-- ==============================================================================
-- 10. TABEL ATURAN RENTANG POIN & SANKSI (RULES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rules (
    id SERIAL PRIMARY KEY,
    min_point INT NOT NULL,
    max_point INT NOT NULL,
    status VARCHAR(100) NOT NULL,
    action TEXT NOT NULL,
    badge_class VARCHAR(50) DEFAULT 'pill-green'
);

-- ==============================================================================
-- 11. TABEL TEMPLATE SURAT PANGGILAN ORANG TUA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.surat_template (
    parameter VARCHAR(100) PRIMARY KEY,
    nilai TEXT NOT NULL,
    deskripsi TEXT
);

-- ==============================================================================
-- 12. TABEL PROGRAM KERJA SEKBID (1 - 10)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sekbid_programs (
    id VARCHAR(50) PRIMARY KEY,
    nomor INT NOT NULL,
    nama VARCHAR(200) NOT NULL,
    nama_singkat VARCHAR(100) NOT NULL,
    ikon VARCHAR(20) DEFAULT '🛡️',
    warna VARCHAR(30) DEFAULT '#2563eb',
    pembina VARCHAR(150) DEFAULT '-',
    ketua_siswa VARCHAR(150) DEFAULT '-',
    visi TEXT DEFAULT '',
    program_kerja JSONB DEFAULT '[]'::jsonb
);

-- ==============================================================================
-- 13. TABEL TATA TERTIB RESMI
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tata_tertib (
    id VARCHAR(50) PRIMARY KEY,
    kategori VARCHAR(50) NOT NULL,
    kategori_label VARCHAR(100) NOT NULL,
    judul VARCHAR(200) NOT NULL,
    ikon VARCHAR(20) DEFAULT '📋',
    poin_rentang VARCHAR(50) DEFAULT 'Poin 5 - 20',
    butir_aturan JSONB DEFAULT '[]'::jsonb
);

-- ==============================================================================
-- 14. INDEXING UNTUK QUERY PERFORMA TINGGI
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_siswa_nisn ON public.siswa(nisn);
CREATE INDEX IF NOT EXISTS idx_siswa_nama ON public.siswa(nama);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON public.siswa(kelas);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_nisn ON public.pelanggaran(nisn);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_tanggal ON public.pelanggaran(tanggal);
CREATE INDEX IF NOT EXISTS idx_prestasi_nisn ON public.prestasi(nisn);
CREATE INDEX IF NOT EXISTS idx_prestasi_tanggal ON public.prestasi(tanggal);
CREATE INDEX IF NOT EXISTS idx_guru_username ON public.guru(username);

-- ==============================================================================
-- 15. AUTO UPDATE TRIGGER TIMESTAMP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('asia/jakarta', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pengaturan_updated_at ON public.pengaturan;
CREATE TRIGGER trg_pengaturan_updated_at
BEFORE UPDATE ON public.pengaturan
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_siswa_updated_at ON public.siswa;
CREATE TRIGGER trg_siswa_updated_at
BEFORE UPDATE ON public.siswa
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_guru_updated_at ON public.guru;
CREATE TRIGGER trg_guru_updated_at
BEFORE UPDATE ON public.guru
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sekbid_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tata_tertib ENABLE ROW LEVEL SECURITY;

-- Pengaturan
DROP POLICY IF EXISTS "Public Read Pengaturan" ON public.pengaturan;
CREATE POLICY "Public Read Pengaturan" ON public.pengaturan FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Pengaturan" ON public.pengaturan;
CREATE POLICY "Public Manage Pengaturan" ON public.pengaturan FOR ALL USING (true) WITH CHECK (true);

-- Guru
DROP POLICY IF EXISTS "Public Read Guru" ON public.guru;
CREATE POLICY "Public Read Guru" ON public.guru FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Guru" ON public.guru;
CREATE POLICY "Public Manage Guru" ON public.guru FOR ALL USING (true) WITH CHECK (true);

-- Siswa
DROP POLICY IF EXISTS "Public Read Siswa" ON public.siswa;
CREATE POLICY "Public Read Siswa" ON public.siswa FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Siswa" ON public.siswa;
CREATE POLICY "Public Manage Siswa" ON public.siswa FOR ALL USING (true) WITH CHECK (true);

-- Pelanggaran
DROP POLICY IF EXISTS "Public Read Pelanggaran" ON public.pelanggaran;
CREATE POLICY "Public Read Pelanggaran" ON public.pelanggaran FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Pelanggaran" ON public.pelanggaran;
CREATE POLICY "Public Manage Pelanggaran" ON public.pelanggaran FOR ALL USING (true) WITH CHECK (true);

-- Prestasi
DROP POLICY IF EXISTS "Public Read Prestasi" ON public.prestasi;
CREATE POLICY "Public Read Prestasi" ON public.prestasi FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Prestasi" ON public.prestasi;
CREATE POLICY "Public Manage Prestasi" ON public.prestasi FOR ALL USING (true) WITH CHECK (true);

-- Kegiatan
DROP POLICY IF EXISTS "Public Read Kegiatan" ON public.kegiatan;
CREATE POLICY "Public Read Kegiatan" ON public.kegiatan FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Kegiatan" ON public.kegiatan;
CREATE POLICY "Public Manage Kegiatan" ON public.kegiatan FOR ALL USING (true) WITH CHECK (true);

-- Pengumuman
DROP POLICY IF EXISTS "Public Read Pengumuman" ON public.pengumuman;
CREATE POLICY "Public Read Pengumuman" ON public.pengumuman FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Pengumuman" ON public.pengumuman;
CREATE POLICY "Public Manage Pengumuman" ON public.pengumuman FOR ALL USING (true) WITH CHECK (true);

-- Quotes
DROP POLICY IF EXISTS "Public Read Quotes" ON public.quotes;
CREATE POLICY "Public Read Quotes" ON public.quotes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Quotes" ON public.quotes;
CREATE POLICY "Public Manage Quotes" ON public.quotes FOR ALL USING (true) WITH CHECK (true);

-- Rules
DROP POLICY IF EXISTS "Public Read Rules" ON public.rules;
CREATE POLICY "Public Read Rules" ON public.rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Rules" ON public.rules;
CREATE POLICY "Public Manage Rules" ON public.rules FOR ALL USING (true) WITH CHECK (true);

-- Surat Template
DROP POLICY IF EXISTS "Public Read SuratTemplate" ON public.surat_template;
CREATE POLICY "Public Read SuratTemplate" ON public.surat_template FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage SuratTemplate" ON public.surat_template;
CREATE POLICY "Public Manage SuratTemplate" ON public.surat_template FOR ALL USING (true) WITH CHECK (true);

-- Sekbid Programs
DROP POLICY IF EXISTS "Public Read Sekbid" ON public.sekbid_programs;
CREATE POLICY "Public Read Sekbid" ON public.sekbid_programs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Sekbid" ON public.sekbid_programs;
CREATE POLICY "Public Manage Sekbid" ON public.sekbid_programs FOR ALL USING (true) WITH CHECK (true);

-- Tata Tertib
DROP POLICY IF EXISTS "Public Read TataTertib" ON public.tata_tertib;
CREATE POLICY "Public Read TataTertib" ON public.tata_tertib FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage TataTertib" ON public.tata_tertib FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 17. SUPABASE STORAGE (BUCKET: kesiswaan_files)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('kesiswaan_files', 'kesiswaan_files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Kebijakan Akses Storage Publik
DROP POLICY IF EXISTS "Public Access Storage Kesiswaan" ON storage.objects;
CREATE POLICY "Public Access Storage Kesiswaan" ON storage.objects
FOR ALL USING (bucket_id = 'kesiswaan_files') WITH CHECK (bucket_id = 'kesiswaan_files');

-- ==============================================================================
-- 18. DATA SEEDER AWAL LENGKAP (DEFAULT VALUES)
-- ==============================================================================

-- A. PENGATURAN SEKOLAH
INSERT INTO public.pengaturan (parameter, nilai, deskripsi) VALUES
('schoolName', 'SMA NEGERI 1 KREASI BANGSA', 'Nama resmi sekolah'),
('schoolMotto', 'Berkarakter Unggul, Berprestasi Gemilang, Berbudaya Disiplin', 'Motto kesiswaan'),
('headerBadgeText', '🛡️ Portal Kesiswaan & Kedisiplinan', 'Teks pill badge header'),
('schoolAddress', 'Jl. Ki Hajar Dewantara No. 101, Kota Pendidikan - Telp. (021) 7890-1234', 'Alamat lengkap'),
('schoolLogo', '🏫', 'Ikon emoji logo bawaan'),
('schoolLogoUrl', '', 'URL gambar logo khusus'),
('logoSize', '46', 'Ukuran logo px'),
('logoShape', 'rounded', 'Bentuk logo'),
('logoBg', 'white', 'Latar belakang logo'),
('titleFontSize', 'normal', 'Ukuran font judul'),
('mottoFontSize', 'normal', 'Ukuran font motto'),
('badgeFontSize', 'normal', 'Ukuran font badge'),
('baseFontSize', 'normal', 'Ukuran font dasar'),
('dashboardBgUrl', 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80', 'Foto latar belakang'),
('themeColor', '#2563eb', 'Warna primer tema'),
('schoolFont', '''Plus Jakarta Sans'', sans-serif', 'Font keluarga sekolah'),
('wallpaperEffect', 'light', 'Efek transparansi wallpaper'),
('academicYear', '2025/2026', 'Tahun ajaran aktif'),
('headmaster', 'Dr. H. Sulaiman Effendi, M.Pd', 'Nama Kepala Sekolah'),
('headOfStudentAffairs', 'Dra. Hj. Siti Rahma, M.Pd', 'Nama Waka Kesiswaan'),
('bkCoordinator', 'Bambang Wijaya, S.Pd, M.Kons', 'Nama Koordinator BK')
ON CONFLICT (parameter) DO UPDATE SET nilai = EXCLUDED.nilai;

-- B. AKUN GURU & KESISWAAN
INSERT INTO public.guru (username, password, nama, role, role_label, sekbid, pokja, pembina, icon) VALUES
('admin', '123', 'Super Administrator IT', 'superadmin', 'Admin', 'Semua Sekbid (Koordinator Utama)', 'Pokja Sistem & IT Kesiswaan', 'OSIS, Robotika', '👑'),
('kesiswaan', '123', 'Dra. Hj. Siti Rahma, M.Pd', 'guru', 'Waka Kesiswaan', 'Pembina Umum Seluruh Sekbid', 'Pokja Karakter & Budaya Sekolah', 'OSIS, Dewan Ambalan, PMR', '👩‍💼'),
('gurubk', '123', 'Bambang Wijaya, S.Pd, M.Kons', 'guru', 'Koordinator BK', 'Sekbid 2: Budi Pekerti Luhur', 'Pokja Kedisiplinan & Tata Tertib Siswa', 'PKS, ROHIS', '👨‍🏫'),
('walikelas', '123', 'Budi Santoso, S.Kom', 'guru', 'Staf Sekbid 9', 'Sekbid 9: Teknologi Informasi & Komunikasi (TIK)', 'Pokja Prestasi & Pengembangan Bakat Lomba', 'Robotika, Redicator', '🧑‍🏫')
ON CONFLICT (username) DO NOTHING;

-- C. TEMPLATE SURAT PANGGILAN ORANG TUA
INSERT INTO public.surat_template (parameter, nilai, deskripsi) VALUES
('kopInstansi', E'PEMERINTAH PROVINSI JAWA TENGAH\nDINAS PENDIDIKAN DAN KEBUDAYAAN\nSMK NEGERI 1 MAGELANG', 'Kop instansi surat'),
('nomorFormat', '421.3 / {NOMOR} / SMKN1.MGL / {TAHUN}', 'Format penomoran surat resmi'),
('perihal', 'PANGGILAN ORANG TUA / WALI SISWA', 'Perihal surat'),
('hariKerjaOffset', '2', 'Jeda hari pemanggilan'),
('waktu', 'Pukul 08.30 WIB s.d Selesai', 'Waktu menghadap'),
('tempat', 'Ruang Bimbingan Konseling (BK) / Ruang Kesiswaan', 'Lokasi ruangan pertemuan'),
('pembuka', 'Sehubungan dengan evaluasi tata tertib serta pembinaan kedisiplinan dan karakter putra/putri Bapak/Ibu di lingkungan sekolah, dengan ini kami mengharapkan kehadiran Bapak/Ibu orang tua/wali dari:', 'Paragraf pembuka'),
('penutup', 'Mengingat pentingnya koordinasi pembinaan karakter ini demi kelancaran proses pendidikan dan masa depan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktu yang telah ditentukan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.', 'Paragraf penutup'),
('pejabatKiriJabatan', 'Koordinator Guru BK', 'Jabatan pejabat tanda tangan kiri'),
('pejabatKiriNama', 'Bambang Wijaya, S.Pd', 'Nama pejabat kiri'),
('pejabatKananJabatan', 'Wakil Kepala Sekolah Bidang Kesiswaan', 'Jabatan pejabat tanda tangan kanan'),
('pejabatKananNama', 'Dra. Hj. Siti Rahma', 'Nama pejabat kanan')
ON CONFLICT (parameter) DO UPDATE SET nilai = EXCLUDED.nilai;

-- D. RULES RENTANG POIN
DELETE FROM public.rules;
INSERT INTO public.rules (min_point, max_point, status, action, badge_class) VALUES
(0, 15, 'Aman / Pembinaan Ringan', 'Peringatan lisan & pembinaan wali kelas', 'pill-green'),
(16, 30, 'Peringatan Tertulis I', 'Peringatan tertulis & pembinaan Guru BK', 'pill-yellow'),
(31, 50, 'Panggilan Orang Tua I', 'Surat Panggilan Orang Tua I & Surat Perjanjian I', 'pill-yellow'),
(51, 75, 'Surat Peringatan 1 (SP 1)', 'Panggilan Orang Tua II, SP 1 & Skorsing 3 Hari', 'pill-red'),
(76, 99, 'Surat Peringatan 2 (SP 2)', 'Panggilan Orang Tua III, SP 2 & Skorsing 1 Minggu', 'pill-red'),
(100, 9999, 'Surat Peringatan 3 (SP 3 / Dikeluarkan)', 'Konferensi Kasus & Pengembalian Siswa ke Orang Tua', 'pill-red');

-- E. KATA-KATA MUTIARA (QUOTES)
DELETE FROM public.quotes;
INSERT INTO public.quotes (quote, tokoh, warna, font, efek, kategori) VALUES
('Disiplin adalah jembatan antara cita-cita mulia dan pencapaian yang nyata.', 'Ki Hajar Dewantara', 'ocean', 'playfair', 'all', '💡 Kata Mutiara & Motivasi Hari Ini'),
('Keberhasilan bukanlah sebuah kebetulan, melainkan buah dari kerja keras, ketekunan, dan akhlak yang mulia.', 'B.J. Habibie', 'gold', 'caveat', 'all', '🌟 Motivasi Berkarakter'),
('Juara sejati tidak hanya unggul dalam prestasi, namun juga rendah hati dan berkarakter terpuji.', 'Pesan Kesiswaan', 'emerald', 'outfit', 'all', '🏆 Semangat Juara & Prestasi'),
('Pendidikan adalah senjata paling ampuh untuk mengubah masa depan menjadi lebih gemilang.', 'Nelson Mandela', 'purple', 'merriweather', 'glow', '📜 Nasihat Bijak Kehidupan');

-- F. DATA SISWA AWAL
INSERT INTO public.siswa (id, no, foto, nis, nisn, nama, gender, kelas, jurusan, nomor_hp, alamat, maps_alamat, nama_ortu_bapak, nama_ortu_ibu, no_hp_bapak, no_hp_ibu, input_spmb, wali_kelas, kontak_ortu, status) VALUES
('SIS-001', 1, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80', '230101', '0061234501', 'Ahmad Fauzan Syahputra', 'L', 'XII RPL 1', 'Rekayasa Perangkat Lunak', '0812-9876-5401', 'Jl. Cendrawasih No. 12, RT 02/RW 04, Kel. Sukamaju', 'https://maps.google.com/?q=-6.2088,106.8456', 'H. Syahputra, S.E', 'Hj. Ratna Juwita', '0812-3456-7890', '0813-9876-5432', 'SPMB-2023-PRESTASI-001', 'Budi Santoso, S.Kom', '0812-3456-7890', 'Aktif'),
('SIS-002', 2, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', '240201', '0061234502', 'Nabila Aurelia Putri', 'P', 'XI MIPA 2', 'MIPA', '0813-8899-5402', 'Komplek Taman Asri Blok B3 No. 7', 'https://maps.google.com/?q=-6.2150,106.8520', 'Ir. Hendra Gunawan', 'Dewi Handayani, S.Pd', '0813-8899-1122', '0812-7766-5544', 'SPMB-2024-ZONASI-042', 'Dewi Lestari, M.Pd', '0813-8899-1122', 'Aktif'),
('SIS-003', 3, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', '230103', '0061234503', 'Reza Aditya Pratama', 'L', 'XII TKJ 2', 'Teknik Komputer & Jaringan', '0852-7711-5403', 'Jl. Dahlia Raya No. 88, RT 01/RW 09', 'https://maps.google.com/?q=-6.2200,106.8400', 'Agus Setiadi', 'Siti Aminah', '0852-7711-4433', '0853-4433-2211', 'SPMB-2023-AFIRMASI-015', 'Agus Salim, S.T', '0852-7711-4433', 'Aktif'),
('SIS-004', 4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', '240301', '0061234504', 'Dimas Arya Pangestu', 'L', 'XI TKJ 1', 'Teknik Komputer & Jaringan', '0819-2233-5404', 'Jl. Anggrek No. 4, RT 05/RW 02', 'https://maps.google.com/?q=-6.2280,106.8600', 'Bambang Pangestu', 'Nurul Hidayati', '0819-2233-4455', '0818-6655-4433', 'SPMB-2024-REGULER-112', 'Iwan Setiawan, S.Pd', '0819-2233-4455', 'Aktif'),
('SIS-005', 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', '230401', '0061234505', 'Siti Nurhaliza Zahra', 'P', 'XII AKL 1', 'Akuntansi', '0878-5544-5405', 'Jl. Kenanga Timur No. 19', 'https://maps.google.com/?q=-6.2110,106.8390', 'H. Lukman Hakim', 'Faridah Zahra', '0878-5544-3322', '0877-3322-1100', 'SPMB-2023-PRESTASI-029', 'Rina Kusuma, S.E', '0878-5544-3322', 'Aktif'),
('SIS-008', 6, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', '230501', '0061234508', 'Fajar Ramadhan', 'L', 'XII TBSM 1', 'Teknik Bisnis Sepeda Motor', '0856-1122-3344', 'Jl. Veteran No. 45', '', 'Ramadhan S.', 'Wahyuni', '0856-1122-3344', '', 'SPMB-2023-REGULER-045', 'Wawan Kurniawan, S.T', '0856-1122-3344', 'Aktif')
ON CONFLICT (nisn) DO NOTHING;

-- G. DATA PRESTASI AWAL
INSERT INTO public.prestasi (id, nisn, tanggal, nama, kategori, tingkat, peringkat, penyelenggara, piagam, poin, foto, keterangan, pencatat) VALUES
('PR-HIST-01', '0061234501', '2026-02-14', 'Juara 1 Lomba Web Design & Coding EduTech 2026', 'Akademik', 'Nasional', 'Juara 1', 'Kementerian Pendidikan', '', 100, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80', 'Mewakili provinsi ke tingkat nasional di Bandung dan meraih medali emas.', 'Dra. Hj. Siti Rahma (Kesiswaan)'),
('PR-HIST-02', '0061234501', '2025-11-20', 'Ketua Panitia Bulan Bahasa & Literasi 2025', 'Karakter', 'Sekolah', 'Apresiasi', 'OSIS Skanisa', '', 20, 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80', 'Keberhasilan mengoordinasikan kegiatan literasi dengan 800+ siswa.', 'Budi Santoso, S.Kom'),
('PR-HIST-03', '0061234502', '2026-01-25', 'Medali Emas Olimpiade Biologi Pelajar (OSN-P)', 'Akademik', 'Provinsi', 'Juara 1', 'Dinas Pendidikan Provinsi', '', 60, 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80', 'Lolos dengan skor tertinggi se-provinsi dan melaju ke OSN.', 'Dewi Lestari, M.Pd'),
('PR-HIST-04', '0061234502', '2025-10-18', 'Juara 2 Debat Bahasa Inggris Tingkat Kota', 'Akademik', 'Kota/Kabupaten', 'Juara 2', 'MGMP Bahasa Inggris', '', 35, 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80', 'Inter-Highschool English Debating Championship 2025.', 'Farhan Hakim, S.Pd'),
('PR-HIST-05', '0061234505', '2026-02-01', 'Juara 1 Lomba Kompetensi Akuntansi Tingkat Kota', 'Akademik', 'Kota/Kabupaten', 'Juara 1', 'Forum Akuntan Muda', '', 35, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80', 'Lomba Akuntansi Keuangan Lembaga Tingkat Kota.', 'Rina Kusuma, S.E')
ON CONFLICT (id) DO NOTHING;

-- H. DATA PELANGGARAN AWAL
INSERT INTO public.pelanggaran (id, nisn, tanggal, nama, kasus, kategori, poin, sanksi, pencatat) VALUES
('PL-HIST-01', '0061234501', '2026-01-10', 'Terlambat masuk sekolah (1-15 menit)', 'Terlambat datang 10 menit karena macet jalan raya', 'Kedisiplinan', 5, 'Tadarus pagi 15 menit & piket perpustakaan', 'H. Mustofa, M.Pd (Guru Piket)'),
('PL-HIST-02', '0061234503', '2026-01-08', 'Merokok / membawa rokok atau vape di lingkungan sekolah', 'Ditemukan membawa rokok di kantin belakang', 'Berat', 40, 'Pembinaan BK & Surat komitmen', 'Bambang Wijaya, S.Pd (BK)'),
('PL-HIST-03', '0061234503', '2026-02-02', 'Keluar kelas/sekolah tanpa izin (Membolos)', 'Meninggalkan jam pelajaran ke-5 tanpa izin', 'Kedisiplinan', 20, 'Panggilan Orang Tua I & Tugas Literasi', 'Agus Salim, S.T'),
('PL-HIST-09', '0061234508', '2026-01-15', 'Merokok / membawa rokok di lingkungan sekolah', 'Membawa rokok di area parkir siswa', 'Berat', 40, 'Panggilan Wali Murid', 'Bambang Wijaya, S.Pd (BK)'),
('PL-HIST-10', '0061234508', '2026-01-29', 'Mencemarkan nama baik guru di media sosial', 'Komentar tidak pantas di postingan sekolah', 'Etika', 35, 'Permohonan maaf terbuka & SP 1', 'Dra. Hj. Siti Rahma (Kesiswaan)'),
('PL-HIST-11', '0061234508', '2026-02-16', 'Keluar kelas tanpa izin (Membolos)', 'Melompati pagar sekolah saat jam istirahat kedua', 'Kedisiplinan', 20, 'Panggilan Orang Tua III, SP 2 & Skorsing', 'Wawan Kurniawan, S.T')
ON CONFLICT (id) DO NOTHING;

-- I. DATA KEGIATAN AWAL
INSERT INTO public.kegiatan (id, nama, tanggal, kategori, tempat, keterangan) VALUES
('ACT-01', 'Latihan Dasar Kepemimpinan Siswa (LDKS) 2026', '15 - 17 Maret 2026', 'Kepemimpinan & Karakter', 'Bumi Perkemahan Mandalawangi', 'Pembekalan kepemimpinan untuk seluruh pengurus OSIS dan MPK.'),
('ACT-02', 'Bulan Bahasa & Pekan Literasi Budaya', '24 - 28 Maret 2026', 'Akademik & Seni', 'Aula Utama & Lapangan Sekolah', 'Lomba cipta baca puisi, speech contest, dan pameran buku.'),
('ACT-03', 'Sosialisasi Disiplin & Anti-Perundungan (Bullying)', '04 April 2026', 'Kedisiplinan & BK', 'Auditorium Sekolah', 'Seminar edukasi karakter bersama psikolog remaja & dinas kepolisian.'),
('ACT-04', 'Classmeeting & Turnamen Olahraga Antar Kelas', '12 - 16 April 2026', 'Olahraga & Kebersamaan', 'GOR Sport Center Sekolah', 'Kompetisi futsal, basket 3x3, e-sport edukasi, dan tari tradisional.')
ON CONFLICT (id) DO NOTHING;

-- J. DATA PENGUMUMAN AWAL
INSERT INTO public.pengumuman (id, kategori, kategori_label, badge_class, judul, tanggal, penulis, ringkasan, isi) VALUES
('ANN-01', 'kedisiplinan', '🔴 KEDISIPLINAN', 'pill-red', 'Penegakan Ketertiban & Operasi Atribut Seragam Lengkap Semester Genap', '10 Maret 2026', 'Tim Kesiswaan & BK', 'Diberitahukan kepada seluruh siswa bahwa mulai Senin depan akan dilaksanakan penertiban kelengkapan atribut seragam sekolah.', 'Seluruh siswa wajib mengenakan atribut resmi: dasi, ikat pinggang berlogo sekolah, kaos kaki putih di atas mata kaki, serta potongan rambut rapi maksimal 2 cm bagi siswa laki-laki. Pelanggaran berulang akan dikenakan akumulasi poin kedisiplinan dan panggilan orang tua.')
ON CONFLICT (id) DO NOTHING;
