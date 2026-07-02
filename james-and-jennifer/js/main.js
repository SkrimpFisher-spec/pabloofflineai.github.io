(function () {
    "use strict";

    var cfg = window.WEDDING_CONFIG || {};

    function apiUrl(path) {
        var base = (cfg.apiBase || "").replace(/\/$/, "");
        return base + path;
    }

    window.weddingApi = { url: apiUrl };

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Floating stars — staggered so they never cluster at the top on load
    var particles = document.getElementById("particles");
    if (particles && !prefersReducedMotion) {
        var starCount = window.innerWidth < 768 ? 22 : 32;
        for (var i = 0; i < starCount; i++) {
            var star = document.createElement("div");
            star.className = "star";
            var size = 5 + Math.random() * 7;
            star.style.width = size + "px";
            star.style.height = size + "px";
            star.style.left = (4 + Math.random() * 92) + "%";
            var floatDur = 12 + Math.random() * 16;
            var twinkleDur = 2 + Math.random() * 2.5;
            star.style.animationDuration = floatDur + "s, " + twinkleDur + "s";
            // Spread starts across the full cycle; negative delay = already in motion
            var phase = (i / starCount) * floatDur + Math.random() * 4;
            star.style.animationDelay = (-phase) + "s, " + (Math.random() * twinkleDur) + "s";
            particles.appendChild(star);
        }
    }

    // Hero uses hero.png (floral); fallback keeps sage gradient if missing
    var heroBg = document.getElementById("heroBg");
    if (heroBg) {
        var img = new Image();
        img.onerror = function () { heroBg.classList.add("no-photo"); };
        img.src = "assets/hero.png";
    }

    // Subtle hero parallax (desktop only)
    if (heroBg && !prefersReducedMotion && window.innerWidth >= 768) {
        var parallaxTicking = false;
        function updateHeroParallax() {
            var y = Math.min(window.scrollY * 0.18, 120);
            heroBg.style.setProperty("--hero-parallax", y + "px");
            parallaxTicking = false;
        }
        window.addEventListener("scroll", function () {
            if (!parallaxTicking) {
                parallaxTicking = true;
                requestAnimationFrame(updateHeroParallax);
            }
        }, { passive: true });
        updateHeroParallax();
    }

    // Countdown to ceremony (Feb 7, 2027 at 3:30 PM local)
    function parseCountdownTarget() {
        var dateStr = cfg.weddingDate || "2027-02-07";
        var parts = dateStr.split("-");
        var y = parseInt(parts[0], 10);
        var m = parseInt(parts[1], 10) - 1;
        var d = parseInt(parts[2], 10);
        var h = typeof cfg.countdownHour === "number" ? cfg.countdownHour : 15;
        var min = typeof cfg.countdownMinute === "number" ? cfg.countdownMinute : 30;
        return new Date(y, m, d, h, min, 0, 0);
    }

    var weddingDate = parseCountdownTarget();
    var cdDays = document.getElementById("cdDays");
    var cdHours = document.getElementById("cdHours");
    var cdMins = document.getElementById("cdMins");
    var countdownNote = document.getElementById("countdownNote");

    function applyThirtyDayMood(daysLeft) {
        if (daysLeft <= 30 && daysLeft >= 0) {
            document.body.classList.add("within-thirty-days");
            if (countdownNote) countdownNote.hidden = false;
        } else {
            document.body.classList.remove("within-thirty-days");
            if (countdownNote) countdownNote.hidden = true;
        }
    }

    function tickCountdown() {
        var now = new Date();
        var diff = weddingDate.getTime() - now.getTime();
        if (diff < 0) diff = 0;
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var mins = Math.floor((diff % 3600000) / 60000);
        if (cdDays) cdDays.textContent = String(days);
        if (cdHours) cdHours.textContent = String(hours);
        if (cdMins) cdMins.textContent = String(mins);
        applyThirtyDayMood(days);
    }
    tickCountdown();
    setInterval(tickCountdown, 60000);

    var deadlineEl = document.getElementById("rsvpDeadline");
    if (deadlineEl && cfg.rsvpDeadline) deadlineEl.textContent = cfg.rsvpDeadline;

    // Scroll reveal
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add("visible");
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        reveals.forEach(function (el) { obs.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add("visible"); });
    }

    // FAQ accordion (single section)
    document.querySelectorAll(".faq-item .faq-question").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var item = btn.closest(".faq-item");
            item.classList.toggle("open");
        });
    });

    // Music toggle
    var musicBtn = document.getElementById("musicToggle");
    var bgMusic = document.getElementById("bgMusic");
    if (musicBtn && bgMusic) {
        musicBtn.addEventListener("click", function () {
            if (bgMusic.paused) {
                bgMusic.play().catch(function () {});
                musicBtn.style.color = "var(--gold)";
            } else {
                bgMusic.pause();
                musicBtn.style.color = "";
            }
        });
    }

    // Elegant confetti — petals and gold dots, staggered drift
    window.launchConfetti = function () {
        if (prefersReducedMotion) return;

        var colors = ["#b8956a", "#d4b896", "#dce8d8", "#faf7f2", "#96784f", "#a3b89c"];
        var count = window.innerWidth < 768 ? 32 : 44;

        for (var c = 0; c < count; c++) {
            var piece = document.createElement("div");
            var isPetal = Math.random() > 0.35;
            piece.className = "confetti-piece " + (isPetal ? "confetti-piece--petal" : "confetti-piece--dot");
            var w = isPetal ? (6 + Math.random() * 6) : (4 + Math.random() * 4);
            var h = isPetal ? (8 + Math.random() * 8) : w;
            piece.style.width = w + "px";
            piece.style.height = h + "px";
            piece.style.left = (8 + Math.random() * 84) + "vw";
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.setProperty("--confetti-dur", (2.8 + Math.random() * 2.2) + "s");
            piece.style.setProperty("--confetti-delay", (c * 45 + Math.random() * 120) + "ms");
            piece.style.setProperty("--confetti-spin", (180 + Math.random() * 540) + "deg");
            piece.style.setProperty("--confetti-drift", (-40 + Math.random() * 80) + "px");
            document.body.appendChild(piece);
            (function (el) {
                setTimeout(function () { el.remove(); }, 5500);
            })(piece);
        }
    };
})();
