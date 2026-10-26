# 📱 Aplikasi Android Web Kesiswaan (APK & AAB)

Dokumen ini berisi informasi resmi, panduan instalasi, dan aset build untuk aplikasi Android **Sistem Informasi Kesiswaan**.

---

## 📦 Berkas yang Tersedia

1. **`kesiswaan.apk`** (Ukuran: ~2.97 MB)
   - Berkas siap install langsung di semua HP/Tablet Android.
   - Universal (Mendukung ARM64, ARMv7, x86_64).
   - Sudah ditandatangani secara resmi (Signed Release).
   - Dapat diunduh langsung melalui web di: `https://web-kesiswaan.vercel.app/kesiswaan.apk`

2. **`Sistem-Informasi-Kesiswaan.aab`** (Android App Bundle)
   - Format standar resmi Google Play Store.
   - Siap diunggah ke Google Play Console jika ingin dipublikasikan ke Play Store.

3. **`signing.keystore` & `signing-key-info.txt`**
   - Sertifikat digital resmi untuk penandatanganan aplikasi rilis.
   - Simpan berkas ini dengan aman untuk pembaruan versi mendatang di Play Store.

4. **Direktori `android/`**
   - Source code lengkap proyek Android (Gradle + Google Android Browser Helper / TWA).
   - Dapat dibuka dan dikembangkan langsung menggunakan Android Studio.

---

## 📲 Spesifikasi Aplikasi

| Parameter | Keterangan |
| :--- | :--- |
| **Nama Aplikasi** | Sistem Informasi Kesiswaan (Kesiswaan) |
| **Package ID** | `id.sch.kesiswaan.app` |
| **Versi** | 1.0.0 (Build 1) |
| **Min SDK** | Android 7.0 Nougat (API 24) |
| **Target SDK** | Android 15/16 (API 36) |
| **Teknologi** | Google Trusted Web Activity (TWA) + Native WebView Fallback |
| **Warna Tema** | Status Bar: `#0f172a` (Dark Slate), Aksen: `#2563eb` (Royal Blue) |
| **Hosting Web** | `https://web-kesiswaan.vercel.app` |

---

## 🚀 Panduan Instalasi di HP Android

1. **Unduh Berkas APK:**
   - Melalui link langsung: [Unduh kesiswaan.apk](https://web-kesiswaan.vercel.app/kesiswaan.apk)
   - Atau salin berkas `kesiswaan.apk` dari repositori ini ke HP Anda (melalui WhatsApp, Google Drive, atau kabel USB).

2. **Buka Berkas APK:**
   - Buka aplikasi **File Manager** atau ketuk notifikasi unduhan yang selesai.
   - Ketuk berkas `kesiswaan.apk`.

3. **Izinkan Sumber Tidak Dikenal (Jika diminta):**
   - Android biasanya menampilkan peringatan keamanan: *"Demi keamanan, ponsel Anda saat ini tidak diizinkan memasang aplikasi tidak dikenal dari sumber ini."*
   - Ketuk **Setelan (Settings)** -> Aktifkan centang **Izinkan dari sumber ini (Allow from this source)**.
   - Tekan tombol kembali (Back).

4. **Pasang Aplikasi:**
   - Ketuk **Install (Pasang)** dan tunggu beberapa detik hingga proses selesai.
   - Ketuk **Buka (Open)** untuk langsung menjalankan aplikasi.

5. **Selesai!**
   - Ikon **Kesiswaan** sekarang tersedia di layar utama (Home Screen) dan laci aplikasi (App Drawer) HP Anda.

---

## ✨ Keunggulan Versi APK

* **Tampilan Native Penuh:** Berjalan dalam mode Fullscreen tanpa bilah alamat browser (URL bar).
* **Auto-Update Konten:** Karena terhubung ke sistem PWA berlisensi TWA, setiap pembaruan fitur web kesiswaan akan langsung termuat di aplikasi tanpa perlu mengunduh ulang APK!
* **Akses Cepat & Ringan:** Ukuran aplikasi sangat kecil (~2.9 MB) dan tidak membebani memori HP guru maupun siswa.
* **Mendukung Kamera & File Upload:** Dapat langsung memotret bukti pelanggaran atau sertifikat piagam prestasi siswa langsung dari HP.
* **Mendukung Ekspor & Cetak:** Fitur ekspor Excel dan cetak kartu siswa/rapor karakter berjalan lancar.
