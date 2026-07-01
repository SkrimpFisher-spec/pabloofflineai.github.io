(function () {
    "use strict";

    var cfg = window.WEDDING_CONFIG || {};

    function apiUrl(path) {
        var base = (cfg.apiBase || "").replace(/\/$/, "");
        return base + path;
    }

    window.weddingApi = { url: apiUrl };

    // Floating stars
    var particles = document.getElementById("particles");
    if (particles) {
        for (var i = 0; i < 36; i++) {
            var star = document.createElement("div");
            star.className = "star";
            var size = 5 + Math.random() * 7;
            star.style.width = size + "px";
            star.style.height = size + "px";
            star.style.left = Math.random() * 100 + "%";
            star.style.animationDuration = (10 + Math.random() * 14) + "s, " + (1.8 + Math.random() * 2.5) + "s";
            star.style.animationDelay = (Math.random() * 12) + "s, " + (Math.random() * 2) + "s";
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

    // Countdown
    var weddingDate = new Date(cfg.weddingDate || "2027-02-07T16:30:00");
    var cdDays = document.getElementById("cdDays");
    var cdHours = document.getElementById("cdHours");
    var cdMins = document.getElementById("cdMins");

    function tickCountdown() {
        var now = new Date();
        var diff = weddingDate - now;
        if (diff < 0) diff = 0;
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var mins = Math.floor((diff % 3600000) / 60000);
        if (cdDays) cdDays.textContent = days;
        if (cdHours) cdHours.textContent = hours;
        if (cdMins) cdMins.textContent = mins;
    }
    tickCountdown();
    setInterval(tickCountdown, 30000);

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

    // Confetti
    window.launchConfetti = function () {
        var colors = ["#b8956a", "#d4b896", "#faf7f2", "#96784f"];
        for (var c = 0; c < 80; c++) {
            var piece = document.createElement("div");
            piece.style.cssText = "position:fixed;z-index:2000;width:8px;height:8px;top:-10px;left:" +
                (Math.random() * 100) + "vw;background:" + colors[Math.floor(Math.random() * colors.length)] +
                ";animation:confettiFall " + (2 + Math.random() * 2) + "s ease-in forwards;pointer-events:none;";
            document.body.appendChild(piece);
            setTimeout(function (el) { el.remove(); }, 4000, piece);
        }
        if (!document.getElementById("confettiStyle")) {
            var s = document.createElement("style");
            s.id = "confettiStyle";
            s.textContent = "@keyframes confettiFall{to{transform:translateY(100vh) rotate(720deg);opacity:0;}}";
            document.head.appendChild(s);
        }
    };
})();
