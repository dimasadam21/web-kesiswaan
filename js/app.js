/**
 * APP CONTROLLER (SIKESISWAAN)
 * Mendukung Dasbor Dinamis, Animasi Slider Prestasi Berjalan, dan Hak Akses Super Admin.
 */

const App = {
    quoteIndex: 0,
    currentSlideIndex: 0,
    sliderInterval: null,
    achievementSlides: [],

    init() {
        StorageManager.init();
        if (window.SupabaseClient && typeof SupabaseClient.init === "function") {
            SupabaseClient.init();
        }
        AuthManager.init();
        SiswaPortal.init();
        AdminPortal.init();
        Forms.init();

        this.applyConfigBranding();
        this.renderPublicDashboard();
        this.updateViewBasedOnAuth();

        // Pantau status login
        AuthManager.onAuthChange((user) => {
            this.updateViewBasedOnAuth();
            if (user) {
                if (user.role === "superadmin") {
                    this.showToast(`Selamat datang, Super Admin ${user.name}!`);
                } else if (user.role === "guru") {
                    this.showToast(`Selamat datang, ${user.name}`);
                } else {
                    this.showToast(`Selamat datang, ${user.name}!`);
                }
            } else {
                this.showToast("Anda telah keluar dari sistem.");
            }
        });

        // Developer / Testing Hook: otomatis login jika ada query param
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get("autologin") === "admin") {
                AuthManager.loginAsTeacher("admin", "123");
                if (params.get("tab")) {
                    AdminPortal.switchAdminTab(params.get("tab"));
                }
                if (params.get("modal") === "settings") {
                    Forms.openSchoolSettingsModal();
                } else if (params.get("modal") === "achievement") {
                    Forms.openAchievementModal(params.get("studentId") || null);
                    if (params.get("juara")) {
                        const jSel = document.getElementById("formPrestasiJuara");
                        if (jSel) { jSel.value = params.get("juara"); jSel.dispatchEvent(new Event("change")); }
                    }
                    if (params.get("tingkat")) {
                        const tSel = document.getElementById("formPrestasiTingkat");
                        if (tSel) { tSel.value = params.get("tingkat"); tSel.dispatchEvent(new Event("change")); }
                    }
                } else if (params.get("modal") === "activity") {
                    Forms.openActivityModal();
                } else if (params.get("modal") === "violation") {
                    Forms.openViolationModal(params.get("studentId") || null);
                    if (params.get("select_violation")) {
                        const sel = document.getElementById("formPelanggaranKatalog");
                        if (sel) {
                            sel.value = params.get("select_violation");
                            sel.dispatchEvent(new Event("change"));
                        }
                    }
                } else if (params.get("modal") === "manage_rules") {
                    Forms.openManageViolationsRulesModal();
                    if (params.get("rules_subtab")) {
                        Forms.switchViolationsRulesSubTab(params.get("rules_subtab"));
                    }
                }
            } else if (params.get("autologin") === "guru") {
                AuthManager.loginAsTeacher("kesiswaan", "123");
                if (params.get("modal") === "violation") {
                    Forms.openViolationModal(params.get("studentId") || null);
                    if (params.get("select_violation")) {
                        const sel = document.getElementById("formPelanggaranKatalog");
                        if (sel) {
                            sel.value = params.get("select_violation");
                            sel.dispatchEvent(new Event("change"));
                        }
                    }
                }
            } else if (params.get("autologin") === "siswa") {
                AuthManager.loginAsStudent("0061234501");
            }
            if (params.get("demo_branding") === "1") {
                const cfg = StorageManager.getConfig();
                cfg.schoolLogoUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%231e3a8a'/><polygon points='50,15 85,75 15,75' fill='%23fbbf24'/><circle cx='50' cy='55' r='14' fill='%23ffffff'/><text x='50' y='60' font-size='14' text-anchor='middle' font-weight='bold' fill='%231e3a8a'>SK</text></svg>";
                cfg.dashboardBgUrl = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1600&q=80";
                StorageManager.updateConfig(cfg);
                this.applyConfigBranding();
            }
        } catch (e) {
            console.error("Autologin parameter error:", e);
        }
    },

    // 1. Terapkan Branding & Pengaturan Sekolah Dinamis
    applyConfigBranding() {
        const config = StorageManager.getConfig();

        // Terapkan Warna Tema Aksen
        if (config.themeColor) {
            document.documentElement.style.setProperty('--primary', config.themeColor);
            // primary-hover sedikit lebih gelap
            document.documentElement.style.setProperty('--primary-hover', config.themeColor);
        }

        // 1. Terapkan Font Utama Sekolah
        if (config.schoolFont) {
            document.body.style.fontFamily = config.schoolFont;
            document.documentElement.style.setProperty('--font-main', config.schoolFont);
        }

        // 2. Terapkan Skala Ukuran Font Seluruh Website
        const baseScales = {
            compact: "95%",
            normal: "100%",
            relaxed: "105%",
            large: "110%"
        };
        document.documentElement.style.fontSize = baseScales[config.baseFontSize] || "100%";

        // 3. Terapkan Nama & Motto Sekolah
        const headerName = document.getElementById("headerSchoolName");
        const headerMotto = document.getElementById("headerSchoolMotto");
        const footerName = document.getElementById("footerSchoolName");
        const headerGuestPill = document.getElementById("headerGuestPill");
        const headerGuestBadge = document.getElementById("headerGuestBadgeText");

        if (headerName) headerName.textContent = config.schoolName || "SiKesiswaan";
        if (headerMotto) headerMotto.textContent = config.schoolMotto || "";
        if (footerName) footerName.textContent = config.schoolName || "SiKesiswaan";

        // Terapkan Teks Label Portal Header (Pill)
        const badgeText = config.headerBadgeText || "🛡️ Portal Kesiswaan & Kedisiplinan";
        if (headerGuestBadge) {
            headerGuestBadge.textContent = badgeText;
        } else if (headerGuestPill) {
            const span = headerGuestPill.querySelector("span");
            if (span) span.textContent = badgeText;
            else headerGuestPill.textContent = badgeText;
        }

        // 4. Terapkan Skala Ukuran Huruf Header (Judul, Motto, dan Badge)
        const titleSizes = {
            small: "1.02rem",
            normal: "1.18rem",
            large: "1.38rem",
            xlarge: "1.58rem"
        };
        const titleVal = titleSizes[config.titleFontSize] || "1.18rem";
        document.documentElement.style.setProperty('--header-title-size', titleVal);
        if (headerName) headerName.style.fontSize = titleVal;

        const mottoSizes = {
            small: "0.70rem",
            normal: "0.78rem",
            large: "0.88rem"
        };
        const mottoVal = mottoSizes[config.mottoFontSize] || "0.78rem";
        document.documentElement.style.setProperty('--header-motto-size', mottoVal);
        if (headerMotto) headerMotto.style.fontSize = mottoVal;

        const badgeSizes = {
            small: "0.78rem",
            normal: "0.85rem",
            large: "0.95rem"
        };
        const badgeVal = badgeSizes[config.badgeFontSize] || "0.85rem";
        document.documentElement.style.setProperty('--header-badge-size', badgeVal);
        if (headerGuestPill) headerGuestPill.style.fontSize = badgeVal;

        // 5. Terapkan Logo yang Proporsional & Luwes (Ukuran, Bentuk, Latar)
        const headerLogo = document.getElementById("headerLogoIcon");
        const logoSize = parseInt(config.logoSize, 10) || 46;
        document.documentElement.style.setProperty('--header-logo-size', `${logoSize}px`);

        let logoRadius = "12px";
        if (config.logoShape === "circle") logoRadius = "50%";
        else if (config.logoShape === "squircle") logoRadius = "18px";
        else if (config.logoShape === "square") logoRadius = "4px";
        else logoRadius = "12px"; // rounded default
        document.documentElement.style.setProperty('--header-logo-radius', logoRadius);

        if (headerLogo) {
            headerLogo.style.width = `${logoSize}px`;
            headerLogo.style.height = `${logoSize}px`;
            headerLogo.style.borderRadius = logoRadius;
            headerLogo.style.flexShrink = "0";

            let bgStyle = "#ffffff";
            if (config.logoBg === "transparent") bgStyle = "transparent";
            else if (config.logoBg === "theme") bgStyle = config.themeColor || "var(--primary)";
            else bgStyle = "#ffffff";

            if (config.schoolLogoUrl) {
                headerLogo.innerHTML = `<img src="${config.schoolLogoUrl}" alt="Logo Sekolah" style="width: 100%; height: 100%; object-fit: contain; border-radius: inherit; display: block;">`;
                headerLogo.style.background = bgStyle;
                headerLogo.style.border = config.logoBg === "transparent" ? "none" : "1px solid var(--border)";
                headerLogo.style.padding = config.logoBg === "transparent" ? "0" : "3px";
                headerLogo.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
            } else {
                const emojiFontSize = Math.max(18, Math.round(logoSize * 0.52));
                headerLogo.innerHTML = `<span style="font-size: ${emojiFontSize}px; line-height: 1; display: inline-flex; align-items: center; justify-content: center;">${config.schoolLogo || "🏫"}</span>`;
                headerLogo.style.background = config.logoBg === "white" ? "#f8fafc" : (config.logoBg === "theme" ? (config.themeColor || "var(--primary)") : "transparent");
                headerLogo.style.border = config.logoBg === "transparent" ? "none" : "1px solid var(--border)";
                headerLogo.style.padding = "0";
                headerLogo.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
            }
        }

        // Terapkan Wallpaper Tema Latar Belakang (Penuh Sampai Pojok Layar)
        const wallpaperBg = document.getElementById("appWallpaperBg");
        const wallpaperOverlay = document.getElementById("appWallpaperOverlay");
        const viewPublic = document.getElementById("viewDashboardPublic");

        if (config.dashboardBgUrl) {
            if (wallpaperBg) {
                wallpaperBg.style.backgroundImage = `url("${config.dashboardBgUrl}")`;
                wallpaperBg.style.display = "block";
                // Ambient depth-of-field lembut agar foto sekolah tetap hidup, jernih, dan sangat nyaman di mata
                wallpaperBg.style.filter = "blur(2px) brightness(0.98) saturate(1.02)";
                wallpaperBg.style.transform = "scale(1.02)";
            }
            if (wallpaperOverlay) {
                wallpaperOverlay.style.display = "block";
                const effect = config.wallpaperEffect || "light";
                if (effect === "dark") {
                    wallpaperOverlay.style.background = "linear-gradient(180deg, rgba(15, 23, 42, 0.65) 0%, rgba(15, 23, 42, 0.82) 100%)";
                    wallpaperOverlay.style.backdropFilter = "blur(6px)";
                    if (wallpaperBg) wallpaperBg.style.filter = "blur(3px) brightness(0.70) saturate(0.85)";
                } else if (effect === "glass") {
                    wallpaperOverlay.style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(248, 250, 252, 0.65) 100%)";
                    wallpaperOverlay.style.backdropFilter = "blur(8px)";
                    if (wallpaperBg) wallpaperBg.style.filter = "blur(3px) brightness(0.96) saturate(0.90)";
                } else if (effect === "vignette") {
                    wallpaperOverlay.style.background = "radial-gradient(circle at 50% 35%, rgba(248, 250, 252, 0.40) 25%, rgba(15, 23, 42, 0.65) 100%)";
                    wallpaperOverlay.style.backdropFilter = "blur(3px)";
                    if (wallpaperBg) wallpaperBg.style.filter = "blur(2px) brightness(0.94) saturate(0.95)";
                } else {
                    // light / default: Rekomendasi Profesional Seimbang & Jelas Terlihat
                    wallpaperOverlay.style.background = "linear-gradient(180deg, rgba(248, 250, 252, 0.42) 0%, rgba(241, 245, 249, 0.58) 100%)";
                    wallpaperOverlay.style.backdropFilter = "blur(2.5px)";
                    if (wallpaperBg) wallpaperBg.style.filter = "blur(2px) brightness(0.98) saturate(1.02)";
                }
            }
            document.body.classList.add("has-wallpaper-active");
        } else {
            if (wallpaperBg) {
                wallpaperBg.style.backgroundImage = "none";
                wallpaperBg.style.display = "none";
            }
            if (wallpaperOverlay) {
                wallpaperOverlay.style.display = "none";
            }
            document.body.classList.remove("has-wallpaper-active");
        }

        if (viewPublic) {
            viewPublic.style.backgroundImage = "none";
            viewPublic.classList.remove("dashboard-custom-bg");
        }
    },

    // 2. Dasbor Publik Awal
    renderPublicDashboard() {
        this.displayQuote();
        this.renderDashboardPengumuman();
        this.initPrestasiSlider();
        this.renderDashboardKegiatan();
        this.renderDashboardTataTertib('all');
        this.renderDashboardAgendaTerdekat();
        this.renderDashboardSekbid(0);
    },

    displayQuote(specifiedIndex = null) {
        const quotes = StorageManager.getQuotes();
        if (!quotes || quotes.length === 0) return;

        if (specifiedIndex !== null && specifiedIndex >= 0 && specifiedIndex < quotes.length) {
            this.quoteIndex = specifiedIndex;
        }

        const qCard = document.getElementById("quoteCard");
        const qElem = document.getElementById("quoteText");
        const aElem = document.getElementById("quoteAuthor");
        const bElem = document.getElementById("quoteBadge");

        const item = quotes[this.quoteIndex % quotes.length];
        if (qElem && aElem) {
            qElem.textContent = `"${item.quote}"`;
            aElem.textContent = `— ${item.tokoh}`;
        }
        if (bElem) {
            bElem.textContent = item.kategori || "💡 Kata Mutiara & Motivasi Hari Ini";
        }

        if (qCard) {
            // Bersihkan kelas tema, font, dan efek sebelumnya
            qCard.className = "quote-card";
            if (qElem) qElem.className = "quote-text";

            const warna = item.warna || "ocean";
            const font = item.font || "playfair";
            const efek = item.efek || "all";

            // Pasang tema warna
            if (warna === "custom" && item.customColor) {
                qCard.style.background = item.customColor;
                qCard.style.border = "1px solid rgba(255, 255, 255, 0.35)";
            } else {
                qCard.style.background = "";
                qCard.style.border = "";
                qCard.classList.add(`quote-theme-${warna}`);
            }

            // Pasang font
            if (qElem) {
                qElem.classList.add(`quote-font-${font}`);
            }

            // Pasang efek visual
            if (efek === "all") {
                qCard.classList.add("quote-fx-all", "quote-fx-glow", "quote-fx-shimmer", "quote-fx-float");
            } else if (efek !== "none") {
                qCard.classList.add(`quote-fx-${efek}`);
            }
        }
    },

    nextQuote() {
        const quotes = StorageManager.getQuotes();
        this.quoteIndex = (this.quoteIndex + 1) % quotes.length;
        this.displayQuote();
    },

    // 3. SLIDER PRESTASI DENGAN ANIMASI POP-UP & GANTI FOTO OTOMATIS
    initPrestasiSlider() {
        const wrapper = document.getElementById("showcaseSliderWrapper");
        const dotsBox = document.getElementById("sliderDotsBox");
        if (!wrapper || !dotsBox) return;

        // Kumpulkan semua prestasi dari semua siswa
        const students = StorageManager.getStudents();
        let list = [];
        students.forEach(s => {
            (s.prestasi || []).forEach(p => {
                list.push({
                    ...p,
                    siswaNama: s.nama,
                    siswaKelas: s.kelas,
                    siswaFoto: s.foto
                });
            });
        });

        // Urutkan berdasarkan tanggal prestasi terbaru
        list.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
        this.achievementSlides = list;

        if (list.length === 0) {
            wrapper.innerHTML = `
                <div style="padding: 2.5rem; text-align: center; width: 100%; color: var(--text-muted);">
                    <div style="font-size: 2rem;">🏆</div>
                    <p>Belum ada data prestasi siswa tercatat.</p>
                </div>
            `;
            dotsBox.innerHTML = "";
            return;
        }

        // Render Slide HTML
        wrapper.innerHTML = list.map((item, idx) => `
            <div class="showcase-slide ${idx === 0 ? 'active' : ''}" id="slide-${idx}">
                <div class="showcase-photo-frame">
                    <img src="${item.foto || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'}" alt="${item.nama}">
                    <div class="showcase-floating-badge">🏆 ${item.peringkat}</div>
                </div>
                <div class="showcase-details">
                    <div class="showcase-winner-name">⭐ ${item.siswaNama} • ${item.siswaKelas}</div>
                    <h4>${item.nama}</h4>
                    <p class="showcase-description">${item.keterangan || 'Prestasi kebanggaan sekolah yang diraih melalui kerja keras dan dedikasi.'}</p>
                    <div class="showcase-meta-row">
                        <span class="status-pill pill-gray">Tingkat ${item.tingkat}</span>
                        <span class="status-pill pill-gray">📅 ${item.tanggal}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Render Dots
        dotsBox.innerHTML = list.map((_, idx) => `
            <div class="slider-dot ${idx === 0 ? 'active' : ''}" onclick="App.goToPrestasiSlide(${idx})"></div>
        `).join('');

        // Mulai Rotasi Otomatis (Setiap 4.5 detik)
        this.startSliderTimer();

        // Pause saat kursor mouse di atas slider
        wrapper.onmouseenter = () => clearInterval(this.sliderInterval);
        wrapper.onmouseleave = () => this.startSliderTimer();
    },

    startSliderTimer() {
        clearInterval(this.sliderInterval);
        if (this.achievementSlides.length > 1) {
            this.sliderInterval = setInterval(() => {
                this.nextPrestasiSlide();
            }, 4500);
        }
    },

    goToPrestasiSlide(index) {
        if (this.achievementSlides.length === 0) return;
        const total = this.achievementSlides.length;
        this.currentSlideIndex = (index + total) % total;

        document.querySelectorAll(".showcase-slide").forEach((s, i) => {
            s.classList.toggle("active", i === this.currentSlideIndex);
        });

        document.querySelectorAll(".slider-dot").forEach((d, i) => {
            d.classList.toggle("active", i === this.currentSlideIndex);
        });
    },

    nextPrestasiSlide() {
        this.goToPrestasiSlide(this.currentSlideIndex + 1);
    },

    prevPrestasiSlide() {
        this.goToPrestasiSlide(this.currentSlideIndex - 1);
    },

    renderDashboardKegiatan() {
        const container = document.getElementById("dashboardKegiatanList");
        if (!container) return;

        const activities = StorageManager.getActivities();

        if (activities.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted); background: #ffffff; border: 1px dashed var(--border); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem;">📅</div>
                    <p style="margin-top: 0.25rem;">Belum ada agenda kegiatan kesiswaan yang dijadwalkan.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(act => `
            <div class="kegiatan-card-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; flex-wrap: wrap; gap: 0.25rem;">
                    <span class="kegiatan-date-badge">📅 ${act.tanggal}</span>
                    <span class="status-pill pill-gray" style="font-size: 0.7rem;">${act.kategori || 'Kegiatan'}</span>
                </div>
                <h4 style="font-size: 0.95rem; margin-bottom: 0.2rem;">${act.nama}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${act.keterangan}</p>
                <div style="font-size: 0.75rem; color: var(--text-main); margin-top: 0.35rem;">
                    📍 Lokasi: <strong>${act.tempat}</strong>
                </div>
            </div>
        `).join('');

        this.renderDashboardAgendaTerdekat();
    },

    renderDashboardAgendaTerdekat() {
        const container = document.getElementById("dashboardAgendaTerdekatList");
        if (!container) return;

        const activities = StorageManager.getActivities();
        if (activities.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted); background: #ffffff; border: 1px dashed var(--border); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem;">⏰</div>
                    <p style="margin-top: 0.25rem;">Belum ada agenda terdekat yang dijadwalkan.</p>
                </div>
            `;
            return;
        }

        // Tampilkan 3-4 agenda terdekat dengan kartu beraksen highlight & countdown
        container.innerHTML = activities.slice(0, 4).map((act, idx) => `
            <div class="agenda-terdekat-card ${idx === 0 ? 'priority-card' : ''}">
                <div class="agenda-terdekat-header">
                    <span class="agenda-countdown-badge">${idx === 0 ? '🔥 Terdekat Pekan Ini' : '📅 Agenda ' + (idx + 1)}</span>
                    <span class="status-pill pill-blue">${act.kategori || 'Kesiswaan'}</span>
                </div>
                <h4 class="agenda-terdekat-title">${act.nama}</h4>
                <p class="agenda-terdekat-desc">${act.keterangan}</p>
                <div class="agenda-terdekat-footer">
                    <div class="agenda-footer-item">
                        <span>🗓️</span> <strong>${act.tanggal}</strong>
                    </div>
                    <div class="agenda-footer-item">
                        <span>📍</span> <span>${act.tempat}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // =========================================================================
    // 2.5 PAPAN PENGUMUMAN KESISWAAN
    // =========================================================================
    currentPengumumanFilter: 'all',

    renderDashboardPengumuman(category = null) {
        const container = document.getElementById("dashboardPengumumanList");
        if (!container) return;

        if (category !== null) {
            this.currentPengumumanFilter = category;
        }

        const allAnnouncements = StorageManager.getAnnouncements();
        let filtered = allAnnouncements;
        if (this.currentPengumumanFilter !== 'all') {
            filtered = allAnnouncements.filter(a => a.kategori === this.currentPengumumanFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-muted); background: #f8fafc; border: 1px dashed var(--border); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📢</div>
                    <strong style="color: var(--text-main);">Tidak Ada Pengumuman Pada Kategori Ini</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Pilih kategori lain untuk melihat rilis pengumuman kesiswaan lainnya.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(ann => `
            <div class="pengumuman-card ${ann.kategori}">
                <div>
                    <div class="pengumuman-meta">
                        <span class="status-pill ${ann.badgeClass || 'pill-blue'}" style="font-size: 0.725rem;">
                            ${ann.kategoriLabel || ann.kategori.toUpperCase()}
                        </span>
                        <span>📅 ${ann.tanggal}</span>
                    </div>
                    <h4 class="pengumuman-title">${ann.judul}</h4>
                    <p class="pengumuman-summary">${ann.ringkasan}</p>
                </div>
                <div>
                    <div class="pengumuman-author-badge">
                        <span>✍️ ${ann.penulis}</span>
                    </div>
                    <button class="pengumuman-read-btn" onclick="App.openDetailPengumuman('${ann.id}')">
                        Baca Selengkapnya ➔
                    </button>
                </div>
            </div>
        `).join('');
    },

    filterPengumuman(category) {
        const pills = document.querySelectorAll("#pengumumanFilterPills .filter-pill-btn");
        pills.forEach(btn => {
            const isTarget = btn.getAttribute("onclick")?.includes(`'${category}'`);
            btn.classList.toggle("active", Boolean(isTarget));
        });
        this.renderDashboardPengumuman(category);
    },

    openDetailPengumuman(id) {
        const announcements = StorageManager.getAnnouncements();
        const ann = announcements.find(a => a.id === id);
        if (!ann) {
            this.showToast("Pengumuman tidak ditemukan.");
            return;
        }

        const bElem = document.getElementById("detailPengumumanCategoryBadge");
        const tElem = document.getElementById("detailPengumumanTanggal");
        const jElem = document.getElementById("detailPengumumanJudul");
        const pElem = document.getElementById("detailPengumumanPenulis");
        const iElem = document.getElementById("detailPengumumanIsi");

        if (bElem) {
            bElem.className = `status-pill ${ann.badgeClass || 'pill-blue'}`;
            bElem.textContent = ann.kategoriLabel || ann.kategori.toUpperCase();
        }
        if (tElem) tElem.textContent = `📅 ${ann.tanggal}`;
        if (jElem) jElem.textContent = ann.judul;
        if (pElem) pElem.textContent = ann.penulis;
        if (iElem) iElem.textContent = ann.isi;

        Forms.openModal("modalDetailPengumuman");
    },

    handleSaveNewAnnouncement(event) {
        event.preventDefault();
        const kategori = document.getElementById("inputAnnKategori").value;
        const judul = document.getElementById("inputAnnJudul").value.trim();
        const penulis = document.getElementById("inputAnnPenulis").value.trim();
        const ringkasan = document.getElementById("inputAnnRingkasan").value.trim();
        const isi = document.getElementById("inputAnnIsi").value.trim();

        if (!judul || !isi) {
            this.showToast("Judul dan isi pengumuman wajib diisi.");
            return;
        }

        const labels = {
            penting: { label: "🔴 PENTING", badge: "pill-red" },
            prestasi: { label: "🟢 PRESTASI", badge: "pill-green" },
            kegiatan: { label: "🔵 KEGIATAN", badge: "pill-blue" },
            informasi: { label: "🟡 INFORMASI", badge: "pill-yellow" }
        };

        const meta = labels[kategori] || labels.informasi;

        StorageManager.addAnnouncement({
            kategori,
            kategoriLabel: meta.label,
            badgeClass: meta.badge,
            judul,
            penulis,
            ringkasan: ringkasan || isi.substring(0, 120) + "...",
            isi
        });

        this.showToast("Pengumuman baru berhasil dipublikasikan di Dasbor!");
        Forms.closeModal("modalTambahPengumuman");
        this.renderDashboardPengumuman();
    },

    // =========================================================================
    // 3.5 PROGRAM KERJA SEKBID 1 - 10
    // =========================================================================
    currentSekbidIndex: 0,

    renderDashboardSekbid(sekbidIndex = 0) {
        const navContainer = document.getElementById("dashboardSekbidNav");
        const cardContainer = document.getElementById("dashboardSekbidCard");
        if (!navContainer || !cardContainer) return;

        const sekbids = StorageManager.getSekbidPrograms();
        if (!sekbids || sekbids.length === 0) return;

        if (sekbidIndex < 0 || sekbidIndex >= sekbids.length) {
            sekbidIndex = 0;
        }
        this.currentSekbidIndex = sekbidIndex;

        // Render Nav Pills
        navContainer.innerHTML = sekbids.map((s, idx) => `
            <button class="sekbid-pill-btn ${idx === sekbidIndex ? 'active' : ''}" onclick="App.selectSekbid(${idx})">
                <span>${s.ikon}</span>
                <span>Sekbid ${s.nomor}: ${s.namaSingkat}</span>
            </button>
        `).join('');

        // Render Active Sekbid Card
        const cur = sekbids[sekbidIndex];
        cardContainer.innerHTML = `
            <div class="sekbid-hero-header">
                <div class="sekbid-hero-left">
                    <div class="sekbid-large-icon">${cur.ikon}</div>
                    <div>
                        <h4 class="sekbid-title-text">${cur.nama}</h4>
                        <div class="sekbid-meta-sub">
                            👨‍🏫 Pembina: <strong>${cur.pembina}</strong> • 🧑‍🎓 Koordinator Siswa: <strong>${cur.ketuaSiswa}</strong>
                        </div>
                    </div>
                </div>
                <span class="status-pill pill-blue">OSIS Sekbid ${cur.nomor}</span>
            </div>

            <div class="sekbid-visi-box">
                <span style="font-size: 1.15rem;">🎯</span>
                <div>
                    <strong>Fokus & Visi Sekbid:</strong> ${cur.visi}
                </div>
            </div>

            <div class="sekbid-programs-wrap">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h5 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main);">
                        📋 Agenda & Program Kerja Unggulan (${cur.programKerja.length} Program):
                    </h5>
                    <span style="font-size: 0.775rem; color: var(--text-muted);">Tahun Ajaran 2025/2026</span>
                </div>

                <div class="program-card-grid">
                    ${cur.programKerja.map((prog, pIdx) => `
                        <div class="program-item-box">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.5rem;">
                                <strong style="font-size: 0.925rem; color: var(--text-main);">${pIdx + 1}. ${prog.nama}</strong>
                                <span class="status-pill ${prog.badgeClass || 'pill-blue'}" style="font-size: 0.675rem; white-space: nowrap;">
                                    ${prog.status}
                                </span>
                            </div>
                            <div style="font-size: 0.775rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                                ⏱️ Periode: <strong>${prog.periode}</strong> • 🎯 Sasaran: <strong>${prog.sasaran}</strong>
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-main); margin: 0; line-height: 1.45;">
                                ${prog.keterangan}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    selectSekbid(index) {
        this.renderDashboardSekbid(index);
    },

    // =========================================================================
    // 4.5 PEDOMAN TATA TERTIB & KARAKTER SISWA
    // =========================================================================
    currentTataTertibCategory: 'all',
    tataTertibSearchTerm: '',

    renderDashboardTataTertib(category = null, searchQuery = null) {
        const container = document.getElementById("dashboardTataTertibContent");
        if (!container) return;

        if (category !== null) {
            this.currentTataTertibCategory = category;
        }
        if (searchQuery !== null) {
            this.tataTertibSearchTerm = searchQuery.toLowerCase().trim();
        }

        const allRules = StorageManager.getTataTertib();
        let filtered = allRules;

        if (this.currentTataTertibCategory !== 'all') {
            filtered = filtered.filter(r => r.kategori === this.currentTataTertibCategory);
        }

        if (this.tataTertibSearchTerm) {
            filtered = filtered.filter(r => {
                const inTitle = r.judul.toLowerCase().includes(this.tataTertibSearchTerm);
                const inCategory = r.kategoriLabel.toLowerCase().includes(this.tataTertibSearchTerm);
                const inRules = r.butirAturan.some(b => b.toLowerCase().includes(this.tataTertibSearchTerm));
                return inTitle || inCategory || inRules;
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="padding: 2.5rem; text-align: center; color: var(--text-muted); background: #f8fafc; border: 1px dashed var(--border); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
                    <strong style="color: var(--text-main);">Tidak Ada Butir Tata Tertib yang Cocok</strong>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Coba gunakan kata kunci pencarian yang lain.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(rule => `
            <div class="tata-tertib-card">
                <div class="tata-tertib-card-header">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span style="font-size: 1.4rem;">${rule.ikon}</span>
                        <div>
                            <h4 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--text-main);">${rule.judul}</h4>
                            <span style="font-size: 0.775rem; color: var(--text-muted);">${rule.kategoriLabel}</span>
                        </div>
                    </div>
                    <span class="status-pill pill-yellow" style="font-weight: 700;">${rule.poinRentang}</span>
                </div>
                <ol class="tata-tertib-rule-list">
                    ${rule.butirAturan.map(b => {
                        let highlighted = b;
                        if (this.tataTertibSearchTerm) {
                            const regex = new RegExp(`(${this.tataTertibSearchTerm})`, 'gi');
                            highlighted = b.replace(regex, '<mark style="background: #fef08a; padding: 0 2px; border-radius: 2px;">$1</mark>');
                        }
                        return `<li>${highlighted}</li>`;
                    }).join('')}
                </ol>
            </div>
        `).join('');
    },

    filterTataTertib(category) {
        const tabs = document.querySelectorAll("#tataTertibTabs .tata-tertib-tab-btn");
        tabs.forEach(btn => {
            const isTarget = btn.getAttribute("onclick")?.includes(`'${category}'`);
            btn.classList.toggle("active", Boolean(isTarget));
        });
        this.renderDashboardTataTertib(category, this.tataTertibSearchTerm);
    },

    handleSearchTataTertib(query) {
        this.renderDashboardTataTertib(this.currentTataTertibCategory, query);
    },

    scrollToSection(sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
            const headerHeight = document.querySelector('.site-header')?.offsetHeight || 70;
            const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight - 16;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },

    // 4. Alur Tampilan Berdasarkan Status Login
    updateViewBasedOnAuth() {
        const user = AuthManager.getCurrentUser();
        const viewPublic = document.getElementById("viewDashboardPublic");
        const viewSiswa = document.getElementById("viewPortalSiswa");
        const viewGuru = document.getElementById("viewPortalGuru");

        const headerGuest = document.getElementById("headerGuestPill");
        const headerUser = document.getElementById("headerUserPill");
        const headerUserName = document.getElementById("headerUserName");
        const headerUserBadge = document.getElementById("headerUserBadge");
        const superAdminToolbar = document.getElementById("superAdminToolbar");
        const btnTambahSiswa = document.getElementById("btnTambahSiswaSuperAdmin");
        const btnImporSiswa = document.getElementById("btnImporSiswaSuperAdmin");
        const btnKelolaSiswa = document.getElementById("btnKelolaSiswaSuperAdmin");

        if (!user) {
            // BELUM LOGIN
            if (viewPublic) viewPublic.style.display = "block";
            if (viewSiswa) viewSiswa.style.display = "none";
            if (viewGuru) viewGuru.style.display = "none";

            if (headerGuest) headerGuest.style.display = "flex";
            if (headerUser) headerUser.style.display = "none";
            if (superAdminToolbar) superAdminToolbar.style.display = "none";
            if (btnTambahSiswa) btnTambahSiswa.style.display = "none";
            if (btnImporSiswa) btnImporSiswa.style.display = "none";
            if (btnKelolaSiswa) btnKelolaSiswa.style.display = "none";
        } else if (user.role === "siswa") {
            // SISWA LOGIN
            if (viewPublic) viewPublic.style.display = "none";
            if (viewSiswa) viewSiswa.style.display = "block";
            if (viewGuru) viewGuru.style.display = "none";

            if (headerGuest) headerGuest.style.display = "none";
            if (headerUser) headerUser.style.display = "flex";
            if (headerUserName) headerUserName.textContent = `🎓 ${user.name} (${user.kelas})`;
            if (headerUserBadge) headerUserBadge.className = "user-badge-pill";
            if (superAdminToolbar) superAdminToolbar.style.display = "none";
            if (btnTambahSiswa) btnTambahSiswa.style.display = "none";
            if (btnImporSiswa) btnImporSiswa.style.display = "none";
            if (btnKelolaSiswa) btnKelolaSiswa.style.display = "none";

            SiswaPortal.renderMyStudentPortal(user.studentId);
        } else if (user.role === "guru" || user.role === "superadmin") {
            // GURU ATAU SUPER ADMIN LOGIN
            if (viewPublic) viewPublic.style.display = "none";
            if (viewSiswa) viewSiswa.style.display = "none";
            if (viewGuru) viewGuru.style.display = "block";

            if (headerGuest) headerGuest.style.display = "none";
            if (headerUser) headerUser.style.display = "flex";

            if (user.role === "superadmin") {
                if (headerUserName) headerUserName.textContent = `👑 Super Admin: ${user.name}`;
                if (headerUserBadge) headerUserBadge.className = "user-badge-pill superadmin";
                if (superAdminToolbar) superAdminToolbar.style.display = "block";
                if (btnTambahSiswa) btnTambahSiswa.style.display = "inline-flex";
                if (btnImporSiswa) btnImporSiswa.style.display = "inline-flex";
                if (btnKelolaSiswa) btnKelolaSiswa.style.display = "inline-flex";
            } else {
                if (headerUserName) headerUserName.textContent = `${user.icon || '👨‍🏫'} ${user.name}`;
                if (headerUserBadge) headerUserBadge.className = "user-badge-pill";
                if (superAdminToolbar) superAdminToolbar.style.display = "none";
                if (btnTambahSiswa) btnTambahSiswa.style.display = "none";
                if (btnImporSiswa) btnImporSiswa.style.display = "none";
                if (btnKelolaSiswa) btnKelolaSiswa.style.display = "none";
            }

            AdminPortal.initTeacherPortal(user);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    },

    // 5. Handler Login Siswa & Guru
    handleStudentLogin(event) {
        event.preventDefault();
        const query = document.getElementById("loginStudentQuery").value;
        try {
            AuthManager.loginAsStudent(query);
        } catch (err) {
            this.showToast(err.message);
        }
    },

    quickStudentLogin(nisn) {
        try {
            AuthManager.loginAsStudent(nisn);
        } catch (err) {
            this.showToast(err.message);
        }
    },

    handleTeacherLogin(event) {
        event.preventDefault();
        const u = document.getElementById("loginTeacherUsername").value;
        const p = document.getElementById("loginTeacherPassword").value;
        try {
            AuthManager.loginAsTeacher(u, p);
        } catch (err) {
            this.showToast(err.message);
        }
    },

    quickTeacherLogin(username, password) {
        const uInput = document.getElementById("loginTeacherUsername");
        const pInput = document.getElementById("loginTeacherPassword");
        if (uInput) uInput.value = username;
        if (pInput) pInput.value = password;
        try {
            AuthManager.loginAsTeacher(username, password);
        } catch (err) {
            this.showToast(err.message);
        }
    },

    goToHome() {
        if (!AuthManager.isLoggedIn()) {
            this.updateViewBasedOnAuth();
        }
    },

    closeModal(modalId) {
        if (window.Forms && typeof Forms.closeModal === "function") {
            Forms.closeModal(modalId);
        }
    },

    closeAllModals() {
        if (window.Forms && typeof Forms.closeAllModals === "function") {
            Forms.closeAllModals();
        }
    },

    showToast(message) {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = "toast-clean";
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
