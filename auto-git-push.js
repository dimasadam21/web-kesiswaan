const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = __dirname;
let debounceTimer = null;
let changedFiles = new Set();
let isPushing = false;

console.log('====================================================');
console.log(' 🚀 AUTO GIT PUSH AKTIF - WEB KESISWAAN');
console.log(' Memantau perubahan file di: ' + PROJECT_DIR);
console.log(' Setiap file diedit & disimpan, otomatis');
console.log(' commit & push ke GitHub dalam 5 detik.');
console.log(' Tekan Ctrl+C untuk menghentikan.');
console.log('====================================================\n');

function triggerPush() {
  if (isPushing) {
    debounceTimer = setTimeout(triggerPush, 3000);
    return;
  }

  try {
    // Cek apakah ada perubahan di git
    const status = execSync('git status --porcelain', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim();
    if (!status) {
      changedFiles.clear();
      return;
    }

    isPushing = true;
    const now = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const fileList = Array.from(changedFiles).slice(0, 3).join(', ') || 'file update';
    console.log(`[${now}] 📝 Terdeteksi perubahan: ${fileList}`);
    console.log(`[${now}] 📦 Menjalankan git add & git commit...`);

    execSync('git add -A', { cwd: PROJECT_DIR, stdio: 'inherit' });
    const commitMsg = `Auto sync: ${now} - Update ${fileList}`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: PROJECT_DIR, stdio: 'inherit' });

    console.log(`[${now}] 🚀 Melakukan push ke origin main...`);
    execSync('git push origin main', { cwd: PROJECT_DIR, stdio: 'inherit' });
    console.log(`[${now}] ✅ SUKSES! Perubahan berhasil tersimpan dan ter-push ke GitHub.\n`);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString('id-ID')}] ⚠️ Gagal auto push (akan dicoba lagi jika ada perubahan baru):`, err.message);
  } finally {
    changedFiles.clear();
    isPushing = false;
  }
}

// Pantau folder proyek secara rekursif
try {
  fs.watch(PROJECT_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    // Abaikan direktori .git, file temporer Excel (~$), dan file log
    if (filename.includes('.git') || filename.includes('~$') || filename.endsWith('.tmp') || filename.includes('node_modules')) {
      return;
    }

    changedFiles.add(path.basename(filename));
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerPush, 5000);
  });
} catch (e) {
  console.error('Gagal memulai file watcher:', e.message);
}
