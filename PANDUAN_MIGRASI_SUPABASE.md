# ⚡ Panduan Lengkap Migrasi Web Kesiswaan ke Supabase, GitHub & Vercel
### Aplikasi: Sistem Informasi Kesiswaan (SiKesiswaan)
**Akun:** Sama seperti proyek **Presensi Ibadah (S-I-I-P)** (`dimasadam21`)

---

## 📋 1. Ringkasan Eksekutif Arsitektur Baru

Sistem Kesiswaan kini telah dilengkapi adapter backend modern yang siap dihubungkan ke **Supabase Cloud (PostgreSQL & Storage)**, dikelola melalui **GitHub**, dan di-hosting di **Vercel** dengan arsitektur berkinerja tinggi:

| Komponen | Versi Lama (Standalone / GAS) | Arsitektur Baru (Supabase + GitHub + Vercel) |
| :--- | :--- | :--- |
| **Database** | LocalStorage Browser / Google Sheets | **PostgreSQL di Supabase Cloud (Terpusat & Multi-User)** |
| **Penyimpanan Berkas** | Base64 lokal / Google Drive | **Supabase Storage Bucket (`kesiswaan_files`)** |
| **Kecepatan Query** | Tergantung koneksi lokal / antrean GAS | **Sub-100 ms (PostgREST CDN Cepat)** |
| **Kapasitas & Beban** | Terbatas kuota browser (5-10 MB) | **Skala enterprise (Jutaan data siswa & rekam poin)** |
| **Version Control** | Manual lokal | **GitHub (`dimasadam21/web-kesiswaan`)** |
| **Hosting & CI/CD** | Web lokal / Apps Script | **Vercel Edge Network (Auto Deploy on Git Push)** |

---

## 🗄️ 2. Langkah Membuat Project Baru di Supabase

Sesuai preferensi Anda untuk membuat project baru di akun Supabase yang sama:

### Langkah A: Buat Project di Supabase Dashboard
1. Buka [https://app.supabase.com](https://app.supabase.com) dan login dengan akun Supabase yang sama seperti Presensi Ibadah.
2. Klik tombol **"New Project"**.
3. Isi formulir:
   - **Name:** `Web Kesiswaan` (atau `SiKesiswaan`)
   - **Database Password:** Buat password yang kuat dan catat dengan aman.
   - **Region:** Pilih **Singapore (`ap-southeast-1`)** *(region latensi tercepat untuk pengguna Indonesia)*.
   - **Pricing Plan:** Free tier.
4. Klik **"Create new project"** dan tunggu 1-2 menit hingga status database aktif (`Active`).

### Langkah B: Jalankan Skrip Database PostgreSQL
1. Di bilah menu kiri dashboard Supabase, klik **SQL Editor** (ikon terminal/SQL).
2. Klik **"+ New query"**.
3. Buka berkas [supabase_kesiswaan_schema.sql](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/supabase_kesiswaan_schema.sql) di proyek ini.
4. Salin seluruh isi berkas tersebut, tempel ke dalam SQL Editor Supabase.
5. Klik tombol hijau **"Run"** (atau tekan `Ctrl + Enter`).
6. Muncul pesan `Success. No rows returned`. Seluruh tabel (`siswa`, `guru`, `pelanggaran`, `prestasi`, `kegiatan`, `pengumuman`, `quotes`, `rules`, `pengaturan`), storage bucket `kesiswaan_files`, serta data awal (seeder) telah selesai dibuat!

### Langkah C: Ambil Kredensial API Project
1. Di menu kiri dashboard Supabase, klik ikon **Settings** (roda gigi) > pilih **API**.
2. Salin 2 nilai berikut:
   - **Project URL:** Contoh `https://abcdefghijklmn.supabase.co`
   - **Project API Keys (anon / public):** Salin token `eyJhbGciOi...`

---

## 🔗 3. Menghubungkan Supabase ke Web Kesiswaan

Anda dapat menghubungkan web ke Supabase dengan **sangat mudah tanpa perlu mengedit kode**:

1. Jalankan aplikasi Web Kesiswaan di browser.
2. Di pojok kanan atas (header), klik tombol badge **"Setup Cloud DB"** (atau titik biru).
3. Jendela modal **Konfigurasi Supabase Cloud** akan muncul:
   - Masukkan **Supabase Project URL**.
   - Masukkan **Public Anon Key**.
   - Storage Bucket: biarkan `kesiswaan_files`.
4. Klik tombol **"🔍 Tes Koneksi"**.
   - Jika muncul centang hijau `✅ Koneksi Berhasil!`, klik **"💾 Simpan & Sinkronkan"**.
5. Status badge di header akan berubah menjadi **"🟢 Cloud PostgreSQL Terhubung"**.
   - Semua data siswa, pelanggaran, prestasi, pengumuman, dan konfigurasi sekolah akan otomatis tersinkronkan dua arah secara real-time!

---

## 🐙 4. Repositori GitHub (`dimasadam21/web-kesiswaan`)

Repositori Git lokal telah diinisialisasi dan dikonfigurasi dengan akun GitHub Anda:
- **Username:** `dimasadam21`
- **Email:** `dimasadam21@users.noreply.github.com`
- **Remote Origin:** `https://github.com/dimasadam21/web-kesiswaan.git`
- **Branch Utama:** `main`

### Langkah Pertama (Satu Kali Saja):
1. Buka [https://github.com/new](https://github.com/new).
2. Masukkan **Repository name:** `web-kesiswaan`.
3. Pilih **Public** (atau Private sesuai preferensi Anda).
4. Jangan centang "Add a README file" (karena file proyek sudah lengkap).
5. Klik **"Create repository"**.
6. Jalankan perintah push di terminal proyek:
   ```bash
   git push -u origin main
   ```

### Fitur Auto Push Otomatis:
Sama persis seperti proyek Presensi Ibadah, Anda dapat mengaktifkan auto commit & push setiap kali mengedit berkas:
- Klik ganda (double-click) berkas [start-auto-push.bat](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/start-auto-push.bat).
- Setiap kali ada berkas diedit dan disimpan, otomatis di-commit & di-push ke GitHub dalam 5 detik.

---

## ▲ 5. Menghubungkan & Deploy ke Vercel

Setelah repositori GitHub `web-kesiswaan` terbuat:

1. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub `dimasadam21` yang sama seperti Presensi Ibadah.
2. Di dashboard Vercel, klik tombol **"Add New..."** > pilih **"Project"**.
3. Cari repositori **`web-kesiswaan`**, lalu klik tombol **"Import"**.
4. Pengaturan build:
   - **Framework Preset:** *Other* (Static HTML/JS).
   - **Root Directory:** `./`
   - Berkas [vercel.json](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/vercel.json) sudah otomatis terpasang untuk clean URLs, header PWA, dan proteksi keamanan.
5. Klik tombol **"Deploy"**.
6. Dalam hitungan detik, website Kesiswaan Anda telah live dengan domain gratis seperti:
   `https://web-kesiswaan.vercel.app` (dapat disambungkan juga ke custom domain sekolah).
7. Setiap kali Anda melakukan `git push origin main` (atau via auto-push), Vercel akan otomatis mendeteksi dan memperbarui web dalam sekejap!

---

## 📁 6. Berkas Penting Migrasi

| Berkas | Fungsi |
| :--- | :--- |
| [supabase_kesiswaan_schema.sql](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/supabase_kesiswaan_schema.sql) | Skrip SQL lengkap untuk membuat tabel, relasi, indeks, RLS, storage bucket, dan seeder data |
| [js/supabase-client.js](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/js/supabase-client.js) | Mesin adapter sinkronisasi real-time dua arah antara web & Supabase Cloud |
| [vercel.json](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/vercel.json) | Konfigurasi serverless hosting Vercel & PWA caching |
| [.gitignore](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/.gitignore) | Menjaga kredensial rahasia dan file temporer tidak bocor ke Git |
| [AGENTS.md](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/AGENTS.md) | Pedoman otomatisasi agent untuk selalu push ke GitHub |
| [auto-git-push.js](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/auto-git-push.js) | Skrip watcher otomatis commit & push ke branch `main` |
| [start-auto-push.bat](file:///d:/Adam/Anti%20Gravity/Web%20Kesiswaan/start-auto-push.bat) | File batch untuk menjalankan auto-push dengan 1 klik |
