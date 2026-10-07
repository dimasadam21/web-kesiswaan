# Aturan Otomatisasi Git untuk Proyek Web Kesiswaan

Setiap kali AI Agent / asisten melakukan modifikasi, penambahan, atau perbaikan berkas di repositori ini:
1. Pastikan kode valid (tidak ada kesalahan sintaks atau bug).
2. Naikkan versi cache di `sw.js` jika terdapat modifikasi tampilan frontend `index.html` atau berkas JavaScript/CSS.
3. **WAJIB OTOMATIS MELAKUKAN GIT COMMIT DAN PUSH KE GITHUB**:
   - Jalankan: `git add -A; git commit -m "<deskripsi ringkas>"; git push origin main`
   - Jangan menunggu user bertanya "apakah sudah push git?". Selalu push secara otomatis pada setiap penyelesaian tugas jika repositori GitHub telah terhubung.
