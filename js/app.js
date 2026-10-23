/**
 * APP CONTROLLER (SIKESISWAAN)
 * Mendukung Dasbor Dinamis, Animasi Slider Prestasi Berjalan, dan Hak Akses Super Admin.
 */

const App = {
    quoteIndex: 0,
    currentSlideIndex: 0,
    sliderInterval: null,
    achievementSlides: [],
    suggestActiveIndex: -1,
    currentSuggestMatches: [],

    init() {
        try { StorageManager.init(); } catch (e) { console.error("StorageManager init error", e); }
        if (window.SupabaseClient && typeof SupabaseClient.init === "function") {
            try { SupabaseClient.init(); } catch (e) { console.error("SupabaseClient init error", e); }
        }
        try { AuthManager.init(); } catch (e) { console.error("AuthManager init error", e); }
        try { SiswaPortal.init(); } catch (e) { console.error("SiswaPortal init error", e); }
        try { AdminPortal.init(); } catch (e) { console.error("AdminPortal init error", e); }
        try { Forms.init(); } catch (e) { console.error("Forms init error", e); }

        // Pantau status login lebih awal agar selalu terdaftar
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

        try { this.applyConfigBranding(); } catch (e) { console.error("applyConfigBranding error", e); }
        try { this.renderPublicDashboard(); } catch (e) { console.error("renderPublicDashboard error", e); }
        try { this.updateViewBasedOnAuth(); } catch (e) { console.error("updateViewBasedOnAuth error", e); }
        try { this.initQuoteTimer(); } catch (e) { console.error("initQuoteTimer error", e); }
        if (window.InstagramSync && typeof InstagramSync.init === "function") {
            try { InstagramSync.init(); } catch (e) { console.error("InstagramSync init error", e); }
        }

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

        // Bersihkan sisa elemen contoh akun siswa jika tersisa dari cache DOM
        document.querySelectorAll('.demo-hint-box').forEach(el => el.remove());

        // Tutup dropdown saran pencarian siswa jika klik di luar
        document.addEventListener("click", (e) => {
            const dropdown = document.getElementById("loginStudentSuggestDropdown");
            const input = document.getElementById("loginStudentQuery");
            const clearBtn = document.getElementById("clearLoginStudentQuery");
            if (dropdown && dropdown.style.display !== "none") {
                if (!dropdown.contains(e.target) && e.target !== input && (!clearBtn || !clearBtn.contains(e.target))) {
                    dropdown.style.display = "none";
                }
            }
        });
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
        let badgeText = (config.headerBadgeText || "").trim();
        if (badgeText === "🛡️ Portal Kesiswaan & Kedisiplinan") {
            badgeText = "";
            config.headerBadgeText = "";
            StorageManager.saveConfig(config);
        }
        if (headerGuestBadge) {
            headerGuestBadge.textContent = badgeText;
        } else if (headerGuestPill) {
            const span = headerGuestPill.querySelector("span");
            if (span) span.textContent = badgeText;
            else headerGuestPill.textContent = badgeText;
        }
        if (headerGuestPill) {
            headerGuestPill.style.display = badgeText ? "flex" : "none";
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

            const logoImgSrc = (config.schoolLogoUrl && config.schoolLogoUrl.trim() && config.schoolLogoUrl !== "🏫") ? config.schoolLogoUrl : "logo-smk.png";
            headerLogo.innerHTML = `<img src="${logoImgSrc}" alt="Logo SMK Negeri 1 Magelang" style="width: 100%; height: 100%; object-fit: contain; border-radius: inherit; display: block;">`;
            headerLogo.style.background = bgStyle;
            headerLogo.style.border = config.logoBg === "transparent" ? "none" : "1px solid var(--border)";
            headerLogo.style.padding = config.logoBg === "transparent" ? "0" : "3px";
            headerLogo.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
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
        this.initPublicRekapitulasi();
    },
    initQuoteTimer() {
        if (this._quoteIntervalTimer) {
            clearInterval(this._quoteIntervalTimer);
            this._quoteIntervalTimer = null;
        }

        const cfg = StorageManager.getQuoteConfig();
        const mins = parseInt(cfg.intervalMinutes, 10);
        if (cfg.mode === "ai" && mins > 0) {
            this._quoteIntervalTimer = setInterval(() => {
                this.nextQuote();
            }, mins * 60 * 1000);
        }
    },

    getActiveQuoteList() {
        const cfg = StorageManager.getQuoteConfig();
        if (cfg.mode === "ai" && typeof MASTER_AI_QUOTES !== 'undefined' && Array.isArray(MASTER_AI_QUOTES) && MASTER_AI_QUOTES.length > 0) {
            if (cfg.filterPref === "indo") {
                const indo = MASTER_AI_QUOTES.filter(q => q.asal && !q.asal.includes("Dunia"));
                if (indo.length > 0) return indo;
            } else if (cfg.filterPref === "world") {
                const world = MASTER_AI_QUOTES.filter(q => q.asal && q.asal.includes("Dunia"));
                if (world.length > 0) return world;
            }
            return MASTER_AI_QUOTES;
        }
        return StorageManager.getQuotes();
    },

    displayQuote(specifiedIndex = null) {
        const quotes = this.getActiveQuoteList();
        if (!quotes || quotes.length === 0) return;

        if (specifiedIndex !== null) {
            this.quoteIndex = specifiedIndex;
        }

        const qCard = document.getElementById("quoteCard");
        const qElem = document.getElementById("quoteText");
        const aElem = document.getElementById("quoteAuthor");
        const bElem = document.getElementById("quoteBadge");

        const item = quotes[(this.quoteIndex || 0) % quotes.length];
        if (!item) return;

        // Efek transisi halus saat berganti kutipan
        if (qCard) {
            qCard.style.transition = "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
            qCard.style.opacity = "0.75";
            qCard.style.transform = "scale(0.99)";
            setTimeout(() => {
                if (qElem && aElem) {
                    qElem.textContent = `"${item.quote}"`;
                    aElem.textContent = `— ${item.tokoh}${item.asal ? ` (${item.asal})` : ''}`;
                }
                if (bElem) {
                    bElem.textContent = item.kategori || "💡 Kata Mutiara & Motivasi Hari Ini";
                }
                qCard.style.opacity = "1";
                qCard.style.transform = "scale(1)";
            }, 120);
        } else {
            if (qElem && aElem) {
                qElem.textContent = `"${item.quote}"`;
                aElem.textContent = `— ${item.tokoh}${item.asal ? ` (${item.asal})` : ''}`;
            }
            if (bElem) {
                bElem.textContent = item.kategori || "💡 Kata Mutiara & Motivasi Hari Ini";
            }
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
        const quotes = this.getActiveQuoteList();
        this.quoteIndex = ((this.quoteIndex || 0) + 1) % quotes.length;
        const cfg = StorageManager.getQuoteConfig();
        cfg.currentIndex = this.quoteIndex;
        StorageManager.saveQuoteConfig(cfg);
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

        const agendas = StorageManager.getAgendaTerdekat();
        if (agendas.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted); background: #ffffff; border: 1px dashed var(--border); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem;">⏰</div>
                    <p style="margin-top: 0.25rem;">Belum ada agenda terdekat yang dijadwalkan.</p>
                </div>
            `;
            return;
        }

        // Tampilkan agenda terdekat dengan kartu beraksen highlight & countdown
        container.innerHTML = agendas.slice(0, 4).map((act, idx) => `
            <div class="agenda-terdekat-card ${idx === 0 ? 'priority-card' : ''}">
                <div class="agenda-terdekat-header">
                    <span class="agenda-countdown-badge">${act.countdown || (idx === 0 ? '🔥 Terdekat Pekan Ini' : '📅 Agenda ' + (idx + 1))}</span>
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
        const editId = document.getElementById("inputAnnEditId")?.value;

        if (editId) {
            StorageManager.updateAnnouncement(editId, {
                kategori,
                kategoriLabel: meta.label,
                badgeClass: meta.badge,
                judul,
                penulis,
                ringkasan: ringkasan || isi.substring(0, 120) + "...",
                isi
            });
            this.showToast("Pengumuman berhasil diperbarui!");
        } else {
            StorageManager.addAnnouncement({
                kategori,
                kategoriLabel: meta.label,
                badgeClass: meta.badge,
                judul,
                penulis,
                ringkasan: ringkasan || isi.substring(0, 120) + "...",
                isi
            });
            this.showToast("Pengumuman baru berhasil dipublikasikan!");
        }

        Forms.closeModal("modalTambahPengumuman");
        const editIdElAfter = document.getElementById("inputAnnEditId");
        if (editIdElAfter) editIdElAfter.value = "";
        this.renderDashboardPengumuman();
        if (window.AdminPortal) {
            AdminPortal.renderAdminPengumumanList();
            AdminPortal.updateAdminBadgeCounts();
        }
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
                    <span style="font-size: 0.775rem; color: var(--text-muted);">Tahun Ajaran ${StorageManager.getConfig().academicYear || '2026/2027'}</span>
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
        const config = (window.StorageManager && typeof StorageManager.getConfig === "function") 
            ? (StorageManager.getConfig() || {}) 
            : {};
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

            const hasBadge = config && config.headerBadgeText && config.headerBadgeText.trim() && config.headerBadgeText.trim() !== "🛡️ Portal Kesiswaan & Kedisiplinan";
            if (headerGuest) headerGuest.style.display = hasBadge ? "flex" : "none";
            if (headerUser) headerUser.style.display = "none";
            if (superAdminToolbar) superAdminToolbar.style.display = "none";
            if (btnTambahSiswa) btnTambahSiswa.style.display = "none";
            if (btnImporSiswa) btnImporSiswa.style.display = "none";
            if (btnKelolaSiswa) btnKelolaSiswa.style.display = "none";

            const btnTeacherLogin = document.getElementById("btnSubmitTeacherLogin");
            if (btnTeacherLogin) {
                btnTeacherLogin.disabled = false;
                btnTeacherLogin.innerHTML = `Masuk Portal Kesiswaan`;
            }

            const pInput = document.getElementById("loginTeacherPassword");
            if (pInput) pInput.value = "";

            this.renderPublicDashboard();
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

            const adminTabsNav = document.querySelector(".admin-tabs-nav");
            if (user.role === "superadmin") {
                if (headerUserName) headerUserName.textContent = `👑 Super Admin: ${user.name}`;
                if (headerUserBadge) headerUserBadge.className = "user-badge-pill superadmin";
                if (superAdminToolbar) superAdminToolbar.style.display = "block";
                if (adminTabsNav) adminTabsNav.style.display = "none";
            } else {
                if (headerUserName) headerUserName.textContent = `${user.icon || '👨‍🏫'} ${user.name}`;
                if (headerUserBadge) headerUserBadge.className = "user-badge-pill";
                if (superAdminToolbar) superAdminToolbar.style.display = "none";
                if (adminTabsNav) adminTabsNav.style.display = "flex";
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

    escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    clearStudentSearchInput() {
        const input = document.getElementById("loginStudentQuery");
        const clearBtn = document.getElementById("clearLoginStudentQuery");
        const dropdown = document.getElementById("loginStudentSuggestDropdown");
        if (input) {
            input.value = "";
            input.focus();
        }
        if (clearBtn) clearBtn.style.display = "none";
        if (dropdown) {
            dropdown.style.display = "none";
            dropdown.innerHTML = "";
        }
        this.suggestActiveIndex = -1;
        this.currentSuggestMatches = [];
    },

    handleStudentSearchKeydown(event) {
        const dropdown = document.getElementById("loginStudentSuggestDropdown");
        if (!dropdown || dropdown.style.display === "none") return;

        const items = dropdown.querySelectorAll(".suggest-item");
        if (items.length === 0) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            this.suggestActiveIndex++;
            if (this.suggestActiveIndex >= items.length) {
                this.suggestActiveIndex = 0;
            }
            this.updateSuggestHighlight(items);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            this.suggestActiveIndex--;
            if (this.suggestActiveIndex < 0) {
                this.suggestActiveIndex = items.length - 1;
            }
            this.updateSuggestHighlight(items);
        } else if (event.key === "Enter") {
            if (this.suggestActiveIndex >= 0 && this.suggestActiveIndex < this.currentSuggestMatches.length) {
                event.preventDefault();
                const selectedStudent = this.currentSuggestMatches[this.suggestActiveIndex];
                if (selectedStudent) {
                    this.selectStudentFromSuggest(selectedStudent.id);
                }
            }
        } else if (event.key === "Escape") {
            dropdown.style.display = "none";
            this.suggestActiveIndex = -1;
        }
    },

    updateSuggestHighlight(items) {
        items.forEach((item, idx) => {
            if (idx === this.suggestActiveIndex) {
                item.classList.add("highlighted");
                item.scrollIntoView({ block: "nearest" });
            } else {
                item.classList.remove("highlighted");
            }
        });
    },

    handleStudentSearchSuggest(query) {
        const dropdown = document.getElementById("loginStudentSuggestDropdown");
        const clearBtn = document.getElementById("clearLoginStudentQuery");
        if (!dropdown) return;

        const raw = query || "";
        if (clearBtn) {
            clearBtn.style.display = raw.trim().length > 0 ? "flex" : "none";
        }

        const q = raw.trim().toLowerCase();
        if (!q || q.length < 1) {
            dropdown.style.display = "none";
            dropdown.innerHTML = "";
            this.suggestActiveIndex = -1;
            this.currentSuggestMatches = [];
            return;
        }

        const tokens = q.split(/\s+/).filter(Boolean);
        const students = StorageManager.getStudents() || [];

        const matches = students.filter(s => {
            const nama = (s.nama || "").toLowerCase();
            const nis = String(s.nis || "").toLowerCase();
            const nisn = String(s.nisn || "").toLowerCase();
            const kelas = (s.kelas || "").toLowerCase();
            const jurusan = (s.jurusan || "").toLowerCase();

            return tokens.every(token => 
                nama.includes(token) || 
                nis.includes(token) || 
                nisn.includes(token) || 
                kelas.includes(token) ||
                jurusan.includes(token)
            );
        });

        // Urutkan: Nama yang berawalan query berada di urutan atas
        matches.sort((a, b) => {
            const aName = (a.nama || "").toLowerCase();
            const bName = (b.nama || "").toLowerCase();
            const aStarts = aName.startsWith(q);
            const bStarts = bName.startsWith(q);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return aName.localeCompare(bName);
        });

        if (matches.length === 0) {
            this.suggestActiveIndex = -1;
            this.currentSuggestMatches = [];
            dropdown.innerHTML = `
                <div class="suggest-empty">
                    <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">🔍</div>
                    Tidak ada siswa ditemukan dengan kata kunci "<strong>${this.escapeHtml(query)}</strong>".<br>
                    <small style="color: var(--text-muted);">Pastikan ejaan nama, NIS, atau kelas sudah sesuai.</small>
                </div>
            `;
            dropdown.style.display = "block";
            return;
        }

        const maxDisplay = 10;
        const displayed = matches.slice(0, maxDisplay);
        this.currentSuggestMatches = displayed;
        this.suggestActiveIndex = -1;

        const highlight = (text) => {
            if (!text) return "";
            let escapedText = this.escapeHtml(text);
            tokens.forEach(t => {
                const cleanT = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (cleanT) {
                    const reg = new RegExp(`(${cleanT})`, 'gi');
                    escapedText = escapedText.replace(reg, '<mark style="background: #fef08a; color: #1e293b; padding: 0 3px; border-radius: 3px; font-weight: 700;">$1</mark>');
                }
            });
            return escapedText;
        };

        let html = displayed.map((s, idx) => {
            const highlightedName = highlight(s.nama || '-');

            return `
                <div class="suggest-item" onclick="App.selectStudentFromSuggest('${this.escapeHtml(s.id)}')" data-index="${idx}">
                    <span class="suggest-name">${highlightedName}</span>
                    <span class="suggest-badge-class">${this.escapeHtml(s.kelas || '-')}</span>
                </div>
            `;
        }).join('');

        if (matches.length > maxDisplay) {
            html += `
                <div class="suggest-footer">
                    Menampilkan <strong>${maxDisplay}</strong> dari total <strong>${matches.length}</strong> siswa yang cocok. Ketik lebih spesifik jika nama Anda belum muncul...
                </div>
            `;
        }

        dropdown.innerHTML = html;
        dropdown.style.display = "block";
    },

    selectStudentFromSuggest(studentId) {
        const student = StorageManager.getStudentById(studentId);
        const dropdown = document.getElementById("loginStudentSuggestDropdown");
        if (dropdown) dropdown.style.display = "none";
        this.suggestActiveIndex = -1;
        this.currentSuggestMatches = [];

        if (!student) return;

        const input = document.getElementById("loginStudentQuery");
        if (input) input.value = student.nama;
        const clearBtn = document.getElementById("clearLoginStudentQuery");
        if (clearBtn) clearBtn.style.display = "flex";

        try {
            AuthManager.loginAsStudent(student.id);
            this.showToast(`🎉 Berhasil masuk sebagai ${student.nama} (${student.kelas || '-'})`);
        } catch (err) {
            this.showToast(err.message);
        }
    },

    handleTeacherLogin(event) {
        event.preventDefault();
        const u = document.getElementById("loginTeacherUsername")?.value || "";
        const p = document.getElementById("loginTeacherPassword")?.value || "";
        const submitBtn = event.submitter || document.getElementById("btnSubmitTeacherLogin") || event.target?.querySelector('button[type="submit"]');

        let originalContent = "";
        if (submitBtn) {
            originalContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>⏳ Masuk...</span>`;
        }

        try {
            AuthManager.loginAsTeacher(u, p);
            // AuthManager.notifyListeners() secara otomatis langsung memicu this.updateViewBasedOnAuth().
            // Tidak perlu duplikasi pemanggilan di sini.
        } catch (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }
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

    togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const eyeOpen = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        const eyeClosed = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

        if (input.type === "password") {
            input.type = "text";
            if (btn) {
                btn.innerHTML = eyeClosed;
                btn.title = "Sembunyikan password";
                btn.setAttribute("aria-label", "Sembunyikan password");
            }
        } else {
            input.type = "password";
            if (btn) {
                btn.innerHTML = eyeOpen;
                btn.title = "Lihat password";
                btn.setAttribute("aria-label", "Lihat password");
            }
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
    },

    // =========================================================================
    // 3.6 PAPAN REKAPITULASI PELANGGARAN & PRESTASI SISWA (TERBUKA / DAPAT DILIHAT SIAPA SAJA)
    // =========================================================================
    publicRekapTab: 'pelanggaran', // 'pelanggaran' | 'prestasi' | 'all'
    publicRekapSearchQuery: '',
    publicRekapClassFilter: '',
    publicRekapStatusFilter: '',
    selectedPublicStudentId: null,
    publicStudentDetailTab: 'pelanggaran',

    initPublicRekapitulasi() {
        this.populatePublicRekapClassFilter();
        this.renderPublicRekapitulasi();
    },

    setPublicRekapTab(tab) {
        this.publicRekapTab = tab;
        const btnPel = document.getElementById("publicRekapTabBtnPelanggaran");
        const btnPres = document.getElementById("publicRekapTabBtnPrestasi");
        const btnAll = document.getElementById("publicRekapTabBtnAll");

        if (btnPel) btnPel.classList.toggle("active", tab === 'pelanggaran');
        if (btnPres) btnPres.classList.toggle("active", tab === 'prestasi');
        if (btnAll) btnAll.classList.toggle("active", tab === 'all');

        this.renderPublicRekapitulasi();
    },

    handlePublicRekapSearch(val) {
        this.publicRekapSearchQuery = (val || '').toLowerCase().trim();
        const clearBtn = document.getElementById("btnClearPublicRekapSearch");
        if (clearBtn) clearBtn.style.display = this.publicRekapSearchQuery ? "inline-block" : "none";
        this.renderPublicRekapitulasi();
    },

    clearPublicRekapSearch() {
        this.publicRekapSearchQuery = '';
        const input = document.getElementById("publicRekapSearchInput");
        if (input) input.value = '';
        const clearBtn = document.getElementById("btnClearPublicRekapSearch");
        if (clearBtn) clearBtn.style.display = "none";
        this.renderPublicRekapitulasi();
    },

    handlePublicRekapClassFilter(val) {
        this.publicRekapClassFilter = val || '';
        this.renderPublicRekapitulasi();
    },

    handlePublicRekapStatusFilter(val) {
        this.publicRekapStatusFilter = val || '';
        this.renderPublicRekapitulasi();
    },

    populatePublicRekapClassFilter() {
        const select = document.getElementById("publicRekapClassFilter");
        if (!select) return;
        const students = StorageManager.getStudents() || [];
        const classesSet = new Set();
        students.forEach(s => {
            if (s.kelas) classesSet.add(s.kelas);
        });
        const sortedClasses = Array.from(classesSet).sort((a, b) => {
            return StorageManager.normalizeClassName(a).localeCompare(StorageManager.normalizeClassName(b));
        });
        const curVal = select.value;
        select.innerHTML = `<option value="">🌐 Semua Kelas</option>` + sortedClasses.map(c => `
            <option value="${this.escapeHtml(c)}" ${c === curVal ? 'selected' : ''}>${this.escapeHtml(c)}</option>
        `).join('');
    },

    renderPublicRekapitulasi() {
        const thead = document.getElementById("publicRekapTableHeader");
        const tbody = document.getElementById("publicRekapTableBody");
        if (!tbody || !thead) return;

        const allRecorded = (typeof StorageManager !== "undefined" && StorageManager.getAllRecordedStudents) 
            ? StorageManager.getAllRecordedStudents() 
            : [];
        const allStudents = (typeof StorageManager !== "undefined" && StorageManager.getStudents) 
            ? StorageManager.getStudents() 
            : [];
        const totalStudentsCount = allStudents.length || 2107;

        // Hitung KPI Global
        const violStudents = allRecorded.filter(x => x.violPoints > 0);
        const achStudents = allRecorded.filter(x => x.achCount > 0);
        const totalViolPoints = violStudents.reduce((acc, x) => acc + (x.violPoints || 0), 0);
        const totalAchCount = achStudents.reduce((acc, x) => acc + (x.achCount || 0), 0);
        const perluPerhatianCount = violStudents.filter(x => x.violPoints >= 31).length;
        const totalTertibCount = Math.max(0, totalStudentsCount - violStudents.length);
        const persenDisiplin = ((totalTertibCount / Math.max(1, totalStudentsCount)) * 100).toFixed(1);

        // Update Kartu KPI
        const kpiMelanggarEl = document.getElementById("publicRekapKpiSiswaMelanggar");
        const kpiPoinEl = document.getElementById("publicRekapKpiTotalPoin");
        const kpiPrestasiEl = document.getElementById("publicRekapKpiSiswaPrestasi");
        const kpiAchCountEl = document.getElementById("publicRekapKpiTotalPrestasi");
        const kpiPerhatianEl = document.getElementById("publicRekapKpiPerluPerhatian");
        const kpiTertibEl = document.getElementById("publicRekapKpiSiswaTertib");
        const kpiTertibCountEl = document.getElementById("publicRekapKpiTertibCount");

        if (kpiMelanggarEl) kpiMelanggarEl.textContent = `${violStudents.length} Siswa`;
        if (kpiPoinEl) kpiPoinEl.textContent = `${totalViolPoints} Total Poin`;
        if (kpiPrestasiEl) kpiPrestasiEl.textContent = `${achStudents.length} Siswa`;
        if (kpiAchCountEl) kpiAchCountEl.textContent = `${totalAchCount} Capaian Prestasi`;
        if (kpiPerhatianEl) kpiPerhatianEl.textContent = `${perluPerhatianCount} Siswa`;
        if (kpiTertibEl) kpiTertibEl.textContent = `${persenDisiplin}%`;
        if (kpiTertibCountEl) kpiTertibCountEl.textContent = `${totalTertibCount} Siswa Bersih`;

        // Update Counter Tab Badges
        const badgePel = document.getElementById("publicRekapBadgePelanggaran");
        const badgePres = document.getElementById("publicRekapBadgePrestasi");
        const badgeAll = document.getElementById("publicRekapBadgeAll");
        if (badgePel) badgePel.textContent = violStudents.length;
        if (badgePres) badgePres.textContent = achStudents.length;
        if (badgeAll) badgeAll.textContent = allRecorded.length;

        // Filter berdasarkan tab aktif
        let filtered = [];
        if (this.publicRekapTab === 'pelanggaran') {
            filtered = [...violStudents];
            filtered.sort((a, b) => {
                if (b.violPoints !== a.violPoints) return b.violPoints - a.violPoints;
                return (a.student.nama || '').localeCompare(b.student.nama || '');
            });
        } else if (this.publicRekapTab === 'prestasi') {
            filtered = [...achStudents];
            filtered.sort((a, b) => {
                if (b.achCount !== a.achCount) return b.achCount - a.achCount;
                return (a.student.nama || '').localeCompare(b.student.nama || '');
            });
        } else {
            // all
            filtered = [...allRecorded];
            filtered.sort((a, b) => {
                if (b.violPoints !== a.violPoints) return b.violPoints - a.violPoints;
                if (b.achCount !== a.achCount) return b.achCount - a.achCount;
                return (a.student.nama || '').localeCompare(b.student.nama || '');
            });
        }

        // Filter Kelas jika dipilih
        if (this.publicRekapClassFilter) {
            filtered = filtered.filter(x => StorageManager.isClassMatch(x.student.kelas, this.publicRekapClassFilter));
        }

        // Filter Status Sanksi
        if (this.publicRekapStatusFilter) {
            const f = this.publicRekapStatusFilter;
            filtered = filtered.filter(x => {
                const pts = x.violPoints || 0;
                if (f === 'sp3') return pts >= 100;
                if (f === 'sp2') return pts >= 76 && pts <= 99;
                if (f === 'sp1') return pts >= 51 && pts <= 75;
                if (f === 'panggilan') return pts >= 31 && pts <= 50;
                if (f === 'peringatan') return pts >= 16 && pts <= 30;
                if (f === 'aman') return pts <= 15;
                return true;
            });
        }

        // Filter Kata Kunci Pencarian
        if (this.publicRekapSearchQuery) {
            const q = this.publicRekapSearchQuery;
            filtered = filtered.filter(x => {
                const s = x.student || {};
                const nama = (s.nama || '').toLowerCase();
                const nisn = (s.nisn || '').toLowerCase();
                const nis = (s.nis || '').toLowerCase();
                const kelas = (s.kelas || '').toLowerCase();
                const wali = (s.waliKelas || '').toLowerCase();
                const pelStr = (s.pelanggaran || []).map(p => `${p.nama} ${p.sanksi} ${p.pencatat}`).join(' ').toLowerCase();
                const achStr = (s.prestasi || []).map(pr => `${pr.nama} ${pr.peringkat} ${pr.penyelenggara} ${pr.tingkat} ${pr.pencatat}`).join(' ').toLowerCase();
                return nama.includes(q) || nisn.includes(q) || nis.includes(q) || kelas.includes(q) || wali.includes(q) || pelStr.includes(q) || achStr.includes(q);
            });
        }

        // Update indikator teks jumlah data yang tampil
        const showingEl = document.getElementById("publicRekapShowingText");
        if (showingEl) {
            showingEl.textContent = `Menampilkan ${filtered.length} siswa tercatat`;
        }

        // Render Header & Body Tabel sesuai tab aktif
        const tab = this.publicRekapTab;
        if (tab === 'pelanggaran') {
            thead.innerHTML = `
                <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="width: 50px; text-align: center;">No</th>
                    <th style="min-width: 230px;">Siswa & Kelas</th>
                    <th style="width: 140px; text-align: center;">Akumulasi Poin</th>
                    <th style="min-width: 250px;">Kasus Pelanggaran Terbaru</th>
                    <th style="min-width: 170px;">Guru / Kesiswaan Pencatat</th>
                    <th style="width: 120px; text-align: center;">Aksi</th>
                </tr>
            `;
        } else if (tab === 'prestasi') {
            thead.innerHTML = `
                <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="width: 50px; text-align: center;">No</th>
                    <th style="min-width: 230px;">Siswa & Kelas</th>
                    <th style="min-width: 250px;">Kejuaraan & Prestasi Terakhir</th>
                    <th style="width: 150px;">Tingkat & Tanggal</th>
                    <th style="min-width: 170px;">Bukti & Pembina</th>
                    <th style="width: 120px; text-align: center;">Aksi</th>
                </tr>
            `;
        } else {
            // all
            thead.innerHTML = `
                <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="width: 50px; text-align: center;">No</th>
                    <th style="min-width: 230px;">Siswa & Kelas</th>
                    <th style="width: 140px; text-align: center;">Pelanggaran</th>
                    <th style="width: 140px; text-align: center;">Prestasi</th>
                    <th style="min-width: 220px;">Status Pembinaan Sekolah</th>
                    <th style="width: 120px; text-align: center;">Aksi</th>
                </tr>
            `;
        }

        if (filtered.length === 0) {
            let emptyIcon = "✨";
            let emptyTitle = "Belum Ada Siswa Tercatat";
            let emptyDesc = "Seluruh siswa berada dalam kondisi tertib dan bersih (0 poin). Data pelanggaran maupun prestasi yang diinput oleh semua guru otomatis langsung tampil di sini.";
            if (this.publicRekapSearchQuery || this.publicRekapClassFilter || this.publicRekapStatusFilter) {
                emptyIcon = "🔍";
                emptyTitle = "Tidak Ada Data yang Cocok";
                emptyDesc = "Coba ubah kata kunci pencarian atau sesuaikan pilihan filter kelas / status di atas.";
            } else if (tab === 'pelanggaran') {
                emptyIcon = "🛡️";
                emptyTitle = "Seluruh Siswa Tertib & Bersih";
                emptyDesc = "Tidak ada catatan pelanggaran siswa pada periode ini. Saat guru atau kesiswaan menginput pelanggaran, data akan otomatis tertera di papan terbuka ini.";
            } else if (tab === 'prestasi') {
                emptyIcon = "🏆";
                emptyTitle = "Belum Ada Catatan Prestasi";
                emptyDesc = "Belum ada torehan kejuaraan siswa yang diinputkan oleh tim kesiswaan / pembina prestasi.";
            }

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); background: #fafafa;">
                        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${emptyIcon}</div>
                        <strong style="color: var(--text-main); font-size: 1.1rem; display: block; margin-bottom: 6px;">${emptyTitle}</strong>
                        <p style="font-size: 0.85rem; max-width: 500px; margin: 0 auto; line-height: 1.5;">${emptyDesc}</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map((item, idx) => {
            const s = item.student;
            const st = item.status;
            const fallbackAvatar = s.gender === "P" 
                ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80" 
                : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=160&q=80";

            const studentCol = `
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${s.foto || fallbackAvatar}" alt="${this.escapeHtml(s.nama)}" onerror="this.src='${fallbackAvatar}'" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0;">
                    <div style="min-width: 0;">
                        <strong style="color: var(--text-main); font-size: 0.9rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${this.escapeHtml(s.nama)}
                        </strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">
                            <span>NISN: ${s.nisn || '-'}</span> • <strong style="color: #1e40af;">${this.escapeHtml(s.kelas || '-')}</strong>
                        </div>
                        <div style="font-size: 0.7rem; color: #64748b; margin-top: 1px;">
                            Wali: ${this.escapeHtml(s.waliKelas || '-')}
                        </div>
                    </div>
                </div>
            `;

            const actionBtn = `
                <button type="button" class="btn btn-outline btn-sm" onclick="App.openPublicStudentDetailModal('${s.id}')" style="font-size: 0.76rem; padding: 0.35rem 0.65rem; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;" title="Lihat riwayat lengkap kedisiplinan dan prestasi siswa ini">
                    👁️ Riwayat
                </button>
            `;

            if (tab === 'pelanggaran') {
                const lp = item.lastPelanggaran || {};
                const pelCount = item.violCount || 1;
                return `
                    <tr>
                        <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
                        <td>${studentCol}</td>
                        <td style="text-align: center;">
                            <span class="status-pill pill-red" style="font-weight: 800; font-size: 0.82rem; padding: 3px 8px; display: inline-block;">
                                ${item.violPoints} Poin
                            </span>
                            <div style="margin-top: 4px;">
                                <span class="status-pill ${st.badgeClass}" style="font-size: 0.68rem; padding: 1px 6px;">
                                    ${st.statusText}
                                </span>
                            </div>
                        </td>
                        <td>
                            <strong style="color: #991b1b; display: block; font-size: 0.85rem;">
                                ${this.escapeHtml(lp.nama || '-')}
                            </strong>
                            <div style="font-size: 0.75rem; color: #475569; margin-top: 2px;">
                                📅 ${lp.tanggal || '-'} • Sanksi: <em>${this.escapeHtml(lp.sanksi || '-')}</em>
                            </div>
                            ${pelCount > 1 ? `<div style="font-size: 0.7rem; color: #b91c1c; font-weight: 600; margin-top: 2px;">+ ${pelCount - 1} pelanggaran lainnya</div>` : ''}
                        </td>
                        <td>
                            <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">
                                👨‍🏫 ${this.escapeHtml(lp.pencatat || 'Guru Piket')}
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 1px;">
                                Kategori: ${this.escapeHtml(lp.kategori || 'Kedisiplinan')}
                            </div>
                        </td>
                        <td style="text-align: center;">${actionBtn}</td>
                    </tr>
                `;
            } else if (tab === 'prestasi') {
                const lp = item.lastPrestasi || {};
                const achCount = item.achCount || 1;
                return `
                    <tr>
                        <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
                        <td>${studentCol}</td>
                        <td>
                            <strong style="color: #166534; display: block; font-size: 0.88rem;">
                                ${this.escapeHtml(lp.nama || '-')}
                            </strong>
                            <div style="display: flex; gap: 4px; align-items: center; margin-top: 3px; flex-wrap: wrap;">
                                <span class="badge" style="background: #dcfce7; color: #166534; font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 99px;">
                                    🏆 ${this.escapeHtml(lp.peringkat || 'Juara')}
                                </span>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">${this.escapeHtml(lp.penyelenggara || '-')}</span>
                            </div>
                            ${achCount > 1 ? `<div style="font-size: 0.7rem; color: #15803d; font-weight: 600; margin-top: 2px;">+ ${achCount - 1} kejuaraan lainnya</div>` : ''}
                        </td>
                        <td>
                            <span class="status-pill pill-blue" style="font-size: 0.72rem;">${this.escapeHtml(lp.tingkat || 'Sekolah')}</span>
                            <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px; font-family: monospace;">📅 ${lp.tanggal || '-'}</div>
                        </td>
                        <td>
                            <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap; margin-bottom: 4px;">
                                ${lp.piagam ? `<a href="${lp.piagam}" target="_blank" class="status-pill pill-yellow" style="font-size: 0.68rem; text-decoration: none; padding: 1px 6px;">📜 Piagam</a>` : ''}
                                ${lp.foto ? `<a href="${lp.foto}" target="_blank" class="status-pill pill-blue" style="font-size: 0.68rem; text-decoration: none; padding: 1px 6px;">📸 Foto</a>` : ''}
                                ${!lp.piagam && !lp.foto ? '<span style="font-size: 0.7rem; color: var(--text-muted);">-</span>' : ''}
                            </div>
                            <div style="font-size: 0.75rem; color: #334155;">
                                Pembina: <strong>${this.escapeHtml(lp.pencatat || 'Tim Kesiswaan')}</strong>
                            </div>
                        </td>
                        <td style="text-align: center;">${actionBtn}</td>
                    </tr>
                `;
            } else {
                // all
                return `
                    <tr>
                        <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
                        <td>${studentCol}</td>
                        <td style="text-align: center;">
                            <span class="status-pill ${item.violPoints > 0 ? 'pill-red' : 'pill-green'}" style="font-weight: 800; font-size: 0.8rem;">
                                ${item.violPoints} Poin
                            </span>
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">${item.violCount} Kasus</div>
                        </td>
                        <td style="text-align: center;">
                            <span class="status-pill ${item.achCount > 0 ? 'pill-green' : 'pill-gray'}" style="font-weight: 800; font-size: 0.8rem;">
                                ${item.achCount} Prestasi
                            </span>
                        </td>
                        <td>
                            <span class="status-pill ${st.badgeClass}" style="font-size: 0.75rem;">
                                ${st.statusText}
                            </span>
                            <div style="font-size: 0.73rem; color: #475569; margin-top: 3px;">
                                ${this.escapeHtml(st.actionText || '-')}
                            </div>
                        </td>
                        <td style="text-align: center;">${actionBtn}</td>
                    </tr>
                `;
            }
        }).join('');
    },

    openPublicStudentDetailModal(studentId) {
        const student = StorageManager.getStudentById(studentId);
        if (!student) {
            this.showToast("Data siswa tidak ditemukan.");
            return;
        }

        this.selectedPublicStudentId = studentId;
        const st = StorageManager.calculateStudentStatus(student);

        const modal = document.getElementById("modalPublicStudentDetail");
        if (!modal) return;

        const fallbackAvatar = student.gender === "P" 
            ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80" 
            : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=240&q=80";

        const imgEl = document.getElementById("publicStudentModalFoto");
        if (imgEl) {
            imgEl.src = student.foto || fallbackAvatar;
            imgEl.onerror = () => { imgEl.src = fallbackAvatar; };
        }

        const nameEl = document.getElementById("publicStudentModalNama");
        if (nameEl) nameEl.textContent = student.nama;

        const infoEl = document.getElementById("publicStudentModalInfo");
        if (infoEl) infoEl.textContent = `NISN: ${student.nisn || '-'} • NIS: ${student.nis || '-'} • Kelas: ${student.kelas || '-'} (${student.jurusan || '-'})`;

        const waliEl = document.getElementById("publicStudentModalWali");
        if (waliEl) waliEl.textContent = `Wali Kelas: ${student.waliKelas || '-'}`;

        const poinPelEl = document.getElementById("publicStudentModalPoinPelanggaran");
        if (poinPelEl) poinPelEl.textContent = `${st.totalPoinPelanggaran} Poin`;

        const statusPelEl = document.getElementById("publicStudentModalStatusPill");
        if (statusPelEl) {
            statusPelEl.className = `status-pill ${st.badgeClass}`;
            statusPelEl.textContent = st.statusText;
        }

        const countPresEl = document.getElementById("publicStudentModalCountPrestasi");
        if (countPresEl) countPresEl.textContent = `${(student.prestasi || []).length} Capaian`;

        const saldoKebaikanEl = document.getElementById("publicStudentModalSaldoKebaikan");
        if (saldoKebaikanEl) saldoKebaikanEl.textContent = `${st.saldoPoinKebaikan}/100`;

        this.switchPublicStudentModalTab('pelanggaran');

        modal.classList.add("show");
        document.body.style.overflow = "hidden";
    },

    closePublicStudentDetailModal() {
        const modal = document.getElementById("modalPublicStudentDetail");
        if (modal) modal.classList.remove("show");
        document.body.style.overflow = "auto";
        this.selectedPublicStudentId = null;
    },

    switchPublicStudentModalTab(tab) {
        this.publicStudentDetailTab = tab;
        const btnPel = document.getElementById("publicModalTabBtnPelanggaran");
        const btnPres = document.getElementById("publicModalTabBtnPrestasi");
        const panePel = document.getElementById("publicModalPanePelanggaran");
        const panePres = document.getElementById("publicModalPanePrestasi");

        if (btnPel) btnPel.classList.toggle("active", tab === 'pelanggaran');
        if (btnPres) btnPres.classList.toggle("active", tab === 'prestasi');
        if (panePel) panePel.style.display = tab === 'pelanggaran' ? 'block' : 'none';
        if (panePres) panePres.style.display = tab === 'prestasi' ? 'block' : 'none';

        if (!this.selectedPublicStudentId) return;
        const student = StorageManager.getStudentById(this.selectedPublicStudentId);
        if (!student) return;

        if (tab === 'pelanggaran') {
            const list = student.pelanggaran || [];
            if (!panePel) return;
            if (list.length === 0) {
                panePel.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: #f0fdf4; border-radius: 8px;">
                        <div style="font-size: 2rem; margin-bottom: 0.25rem;">✨</div>
                        <strong style="color: #166534;">Siswa Tidak Memiliki Catatan Pelanggaran</strong>
                        <p style="font-size: 0.8rem; margin-top: 4px;">Catatan kedisiplinan siswa ini 100% bersih (0 poin).</p>
                    </div>
                `;
            } else {
                panePel.innerHTML = `
                    <div class="table-responsive">
                        <table class="table-modern" style="font-size: 0.82rem;">
                            <thead>
                                <tr style="background: #fef2f2;">
                                    <th style="width: 40px; text-align: center;">No</th>
                                    <th style="width: 100px;">Tanggal</th>
                                    <th>Jenis Pelanggaran</th>
                                    <th style="width: 70px; text-align: center;">Poin</th>
                                    <th>Sanksi / Tindak Lanjut</th>
                                    <th>Guru / Pencatat</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${list.map((p, i) => `
                                    <tr>
                                        <td style="text-align: center; font-weight: 700;">${i + 1}</td>
                                        <td style="font-family: monospace; white-space: nowrap;">📅 ${p.tanggal || '-'}</td>
                                        <td>
                                            <strong style="color: #991b1b;">${this.escapeHtml(p.nama || '-')}</strong>
                                            <div style="font-size: 0.7rem; color: var(--text-muted);">Kategori: ${this.escapeHtml(p.kategori || 'Kedisiplinan')}</div>
                                        </td>
                                        <td style="text-align: center;">
                                            <span class="status-pill pill-red" style="font-weight: 800;">+${p.poin || 0}</span>
                                        </td>
                                        <td>${this.escapeHtml(p.sanksi || '-')}</td>
                                        <td><strong>${this.escapeHtml(p.pencatat || 'Guru')}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } else {
            const list = student.prestasi || [];
            if (!panePres) return;
            if (list.length === 0) {
                panePres.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: #f8fafc; border-radius: 8px;">
                        <div style="font-size: 2rem; margin-bottom: 0.25rem;">🏆</div>
                        <strong style="color: var(--text-main);">Belum Ada Catatan Prestasi</strong>
                        <p style="font-size: 0.8rem; margin-top: 4px;">Siswa belum tercatat meraih kejuaraan pada sistem.</p>
                    </div>
                `;
            } else {
                panePres.innerHTML = `
                    <div class="table-responsive">
                        <table class="table-modern" style="font-size: 0.82rem;">
                            <thead>
                                <tr style="background: #f0fdf4;">
                                    <th style="width: 40px; text-align: center;">No</th>
                                    <th style="width: 100px;">Tanggal</th>
                                    <th>Nama Kejuaraan / Prestasi</th>
                                    <th style="width: 130px;">Tingkat & Peringkat</th>
                                    <th>Penyelenggara / Pembina</th>
                                    <th style="width: 100px; text-align: center;">Bukti</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${list.map((pr, i) => `
                                    <tr>
                                        <td style="text-align: center; font-weight: 700;">${i + 1}</td>
                                        <td style="font-family: monospace; white-space: nowrap;">📅 ${pr.tanggal || '-'}</td>
                                        <td>
                                            <strong style="color: #166534;">${this.escapeHtml(pr.nama || '-')}</strong>
                                        </td>
                                        <td>
                                            <span class="badge" style="background: #dcfce7; color: #166534; font-weight: 700; font-size: 0.72rem; padding: 2px 7px; border-radius: 99px;">
                                                🏆 ${this.escapeHtml(pr.peringkat || 'Juara')}
                                            </span>
                                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Tingkat ${this.escapeHtml(pr.tingkat || 'Sekolah')}</div>
                                        </td>
                                        <td>
                                            <div>${this.escapeHtml(pr.penyelenggara || '-')}</div>
                                            <div style="font-size: 0.72rem; color: #475569; margin-top: 2px;">Pembina: <strong>${this.escapeHtml(pr.pencatat || 'Tim Kesiswaan')}</strong></div>
                                        </td>
                                        <td style="text-align: center;">
                                            <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
                                                ${pr.piagam ? `<a href="${pr.piagam}" target="_blank" class="status-pill pill-yellow" style="font-size: 0.68rem; text-decoration: none;">📜 Piagam</a>` : ''}
                                                ${pr.foto ? `<a href="${pr.foto}" target="_blank" class="status-pill pill-blue" style="font-size: 0.68rem; text-decoration: none;">📸 Foto</a>` : ''}
                                                ${!pr.piagam && !pr.foto ? '<span style="color: var(--text-muted);">-</span>' : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
    },

    printStudentRaporFromPublic(studentId) {
        if (!studentId && this.selectedPublicStudentId) {
            studentId = this.selectedPublicStudentId;
        }
        if (!studentId) return;
        if (window.AdminPortal && typeof AdminPortal.selectTargetStudent === "function" && typeof AdminPortal.actionPrintReport === "function") {
            AdminPortal.selectTargetStudent(studentId, true);
            AdminPortal.actionPrintReport();
        } else if (window.SiswaPortal && typeof SiswaPortal.printRaporKarakter === "function") {
            SiswaPortal.renderMyStudentPortal(studentId);
            SiswaPortal.printRaporKarakter();
        } else {
            window.print();
        }
    },

    printPublicRekap() {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            window.print();
            return;
        }

        const allRecorded = StorageManager.getAllRecordedStudents();
        const tab = this.publicRekapTab;
        let titleTab = "Rekapitulasi Pelanggaran & Prestasi Siswa";
        if (tab === 'pelanggaran') titleTab = "Rekapitulasi Siswa Tercatat Pelanggaran";
        if (tab === 'prestasi') titleTab = "Rekapitulasi Siswa Berprestasi";

        let filtered = [...allRecorded];
        if (tab === 'pelanggaran') filtered = filtered.filter(x => x.violPoints > 0);
        else if (tab === 'prestasi') filtered = filtered.filter(x => x.achCount > 0);

        if (this.publicRekapClassFilter) {
            filtered = filtered.filter(x => StorageManager.isClassMatch(x.student.kelas, this.publicRekapClassFilter));
        }

        const cfg = StorageManager.getConfig() || {};
        const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>${titleTab} - ${cfg.schoolName || 'SMK Negeri 1 Magelang'}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; font-size: 11pt; color: #111; }
                    .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 16px; }
                    .kop h2 { margin: 0; font-size: 14pt; }
                    .kop h3 { margin: 2px 0; font-size: 12pt; }
                    .kop p { margin: 2px 0; font-size: 9pt; color: #444; }
                    .title { text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
                    .meta { text-align: center; font-size: 9pt; color: #555; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
                    th, td { border: 1px solid #444; padding: 6px 8px; }
                    th { background: #f2f2f2; font-weight: bold; }
                    .ttd-box { margin-top: 30px; display: flex; justify-content: flex-end; }
                    .ttd-inner { width: 260px; text-align: center; }
                    @media print {
                        @page { size: portrait; margin: 15mm; }
                    }
                </style>
            </head>
            <body>
                <div class="kop">
                    <h2>PEMERINTAH PROVINSI JAWA TENGAH</h2>
                    <h3>DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
                    <h2>${cfg.schoolName || 'SMK NEGERI 1 MAGELANG'}</h2>
                    <p>${cfg.schoolAddress || 'Jl. Cawang No. 2, Magelang'}</p>
                </div>
                <div class="title">${titleTab}</div>
                <div class="meta">Filter: ${this.publicRekapClassFilter ? 'Kelas ' + this.publicRekapClassFilter : 'Seluruh Kelas'} • Dicetak pada: ${nowStr}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px;">No</th>
                            <th>Nama Siswa</th>
                            <th style="width: 85px;">NISN</th>
                            <th style="width: 75px;">Kelas</th>
                            <th style="width: 65px; text-align: center;">Poin</th>
                            <th>Status / Kasus Terakhir / Prestasi</th>
                            <th style="width: 140px;">Guru / Pencatat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? '<tr><td colspan="7" style="text-align: center; padding: 20px;">Tidak ada data siswa tercatat.</td></tr>' : filtered.map((x, i) => `
                            <tr>
                                <td style="text-align: center;">${i + 1}</td>
                                <td><strong>${x.student.nama}</strong></td>
                                <td>${x.student.nisn || '-'}</td>
                                <td>${x.student.kelas || '-'}</td>
                                <td style="text-align: center; font-weight: bold; color: ${x.violPoints > 0 ? '#b91c1c' : '#15803d'};">
                                    ${x.violPoints || 0}
                                </td>
                                <td>
                                    ${tab === 'prestasi' && x.lastPrestasi 
                                        ? `<strong>${x.lastPrestasi.nama}</strong> (${x.lastPrestasi.peringkat} - Tingkat ${x.lastPrestasi.tingkat})` 
                                        : (x.lastPelanggaran 
                                            ? `<strong>${x.lastPelanggaran.nama}</strong> (Status: ${x.status.statusText})` 
                                            : x.status.statusText)}
                                </td>
                                <td>${(tab === 'prestasi' && x.lastPrestasi ? x.lastPrestasi.pencatat : (x.lastPelanggaran ? x.lastPelanggaran.pencatat : '-')) || 'Tim Kesiswaan'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="ttd-box">
                    <div class="ttd-inner">
                        <div>Magelang, ${nowStr}</div>
                        <div style="margin-top: 4px; font-weight: bold;">Waka Kesiswaan</div>
                        <div style="margin-top: 55px; font-weight: bold; text-decoration: underline;">${cfg.headOfStudentAffairs || 'Morlan Purba Sibarani, S.Pd., M.Si.'}</div>
                        <div>${cfg.headOfStudentAffairsNip || 'NIP. 19740315 200501 1 004'}</div>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    exportPublicRekapToExcel() {
        const allRecorded = StorageManager.getAllRecordedStudents();
        const tab = this.publicRekapTab;
        let filtered = [...allRecorded];
        if (tab === 'pelanggaran') filtered = filtered.filter(x => x.violPoints > 0);
        else if (tab === 'prestasi') filtered = filtered.filter(x => x.achCount > 0);

        if (this.publicRekapClassFilter) {
            filtered = filtered.filter(x => StorageManager.isClassMatch(x.student.kelas, this.publicRekapClassFilter));
        }

        const rows = [
            ["No", "Nama Siswa", "NIS", "NISN", "Kelas", "Jurusan", "Wali Kelas", "Total Poin Pelanggaran", "Status Sanksi", "Total Prestasi", "Kasus / Prestasi Terakhir", "Tanggal", "Pencatat"]
        ];

        filtered.forEach((x, i) => {
            const s = x.student;
            const lp = x.lastPelanggaran;
            const lpr = x.lastPrestasi;
            const kasusText = tab === 'prestasi' && lpr ? lpr.nama : (lp ? lp.nama : '-');
            const tglText = tab === 'prestasi' && lpr ? lpr.tanggal : (lp ? lp.tanggal : '-');
            const pencatatText = tab === 'prestasi' && lpr ? lpr.pencatat : (lp ? lp.pencatat : '-');

            rows.push([
                i + 1,
                s.nama || '',
                s.nis || '',
                s.nisn || '',
                s.kelas || '',
                s.jurusan || '',
                s.waliKelas || '',
                x.violPoints || 0,
                x.status.statusText || 'Aman',
                x.achCount || 0,
                kasusText,
                tglText,
                pencatatText
            ]);
        });

        const csvContent = "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const dateStr = new Date().toISOString().split("T")[0];
        a.download = `Rekap_Kesiswaan_SMKN1_Magelang_${this.publicRekapTab}_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast("File rekapan Excel berhasil diunduh!");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
