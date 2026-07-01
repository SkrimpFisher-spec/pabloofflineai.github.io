(function () {
    "use strict";

    var tokenKey = "wedding_admin_token";
    var loginScreen = document.getElementById("loginScreen");
    var dashboard = document.getElementById("dashboard");
    var loginBtn = document.getElementById("loginBtn");
    var loginError = document.getElementById("loginError");
    var logoutBtn = document.getElementById("logoutBtn");

    function getToken() { return sessionStorage.getItem(tokenKey); }
    function setToken(t) { sessionStorage.setItem(tokenKey, t); }
    function clearToken() { sessionStorage.removeItem(tokenKey); }

    function authHeaders() {
        return { Authorization: "Bearer " + getToken() };
    }

    function showLogin() {
        loginScreen.style.display = "block";
        dashboard.style.display = "none";
    }

    function showDashboard() {
        loginScreen.style.display = "none";
        dashboard.style.display = "block";
        loadSummary();
    }

    loginBtn.addEventListener("click", function () {
        var pw = document.getElementById("adminPassword").value;
        loginError.classList.remove("visible");
        loginBtn.disabled = true;

        fetch(window.weddingApi.url("/api/admin/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: pw })
        })
            .then(function (res) {
                if (!res.ok) throw new Error("Invalid password.");
                return res.json();
            })
            .then(function (data) {
                setToken(data.token);
                showDashboard();
            })
            .catch(function (err) {
                loginError.textContent = err.message;
                loginError.classList.add("visible");
            })
            .finally(function () { loginBtn.disabled = false; });
    });

    logoutBtn.addEventListener("click", function () {
        clearToken();
        showLogin();
    });

    document.getElementById("exportCsv").addEventListener("click", function (e) {
        e.preventDefault();
        downloadExport("/api/export/csv", "wedding-rsvps.csv");
    });

    document.getElementById("exportAddr").addEventListener("click", function (e) {
        e.preventDefault();
        downloadExport("/api/export/addresses", "wedding-addresses.csv");
    });

    function downloadExport(path, filename) {
        fetch(window.weddingApi.url(path), { headers: authHeaders() })
            .then(function (res) {
                if (!res.ok) throw new Error("Export failed.");
                return res.blob();
            })
            .then(function (blob) {
                var a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
            })
            .catch(function (err) { alert(err.message); });
    }

    function loadSummary() {
        fetch(window.weddingApi.url("/api/admin/summary"), { headers: authHeaders() })
            .then(function (res) {
                if (res.status === 401) { clearToken(); showLogin(); throw new Error("Session expired."); }
                if (!res.ok) throw new Error("Could not load dashboard.");
                return res.json();
            })
            .then(renderSummary)
            .catch(function (err) {
                if (err.message !== "Session expired.") alert(err.message);
            });
    }

    function renderSummary(data) {
        document.getElementById("statGrid").innerHTML = [
            stat("Invited", data.totalInvited),
            stat("Replies", data.totalReplies),
            stat("Coming", data.attending),
            stat("Declined", data.declined),
            stat("Pending", data.pending)
        ].join("");

        var meals = document.getElementById("mealTotals");
        meals.innerHTML = Object.keys(data.mealTotals || {}).length
            ? Object.entries(data.mealTotals).map(function (e) {
                return '<span class="chip">' + e[0] + ": " + e[1] + "</span>";
            }).join("")
            : '<span class="chip">No meal selections yet</span>';

        var allergySection = document.getElementById("allergySection");
        var allergyList = document.getElementById("allergyList");
        if (data.allergyAlerts && data.allergyAlerts.length) {
            allergySection.style.display = "block";
            allergyList.innerHTML = data.allergyAlerts.map(function (g) {
                return '<div class="allergy-card"><strong>' + esc(g.firstName + " " + g.lastName) +
                    '</strong> &mdash; ' + esc(g.dietaryRestrictions) + "</div>";
            }).join("");
        } else {
            allergySection.style.display = "none";
        }

        document.getElementById("songList").innerHTML = (data.songRequests || []).length
            ? data.songRequests.map(function (s) {
                return '<div class="song-card"><strong>' + esc(s.song) +
                    (s.artist ? " &mdash; " + esc(s.artist) : "") +
                    '</strong><span>Requested by: ' + esc(s.requestedBy.join(", ")) + "</span></div>";
            }).join("")
            : '<p style="color:var(--charcoal-soft);">No song requests yet.</p>';

        var guests = data.guests || [];
        document.getElementById("guestTable").innerHTML =
            "<thead><tr><th>Name</th><th>Code</th><th>Status</th><th>Meal</th><th>Email</th></tr></thead><tbody>" +
            guests.map(function (g) {
                return "<tr><td>" + esc(g.firstName + " " + g.lastName) + "</td><td>" + esc(g.inviteCode) +
                    '</td><td class="' + (g.attending ? "status-yes" : "status-no") + '">' +
                    (g.attending ? "Coming" : "Declined") + "</td><td>" + esc(g.mealChoice || "-") +
                    "</td><td>" + esc(g.email) + "</td></tr>";
            }).join("") + "</tbody>";
    }

    function stat(label, num) {
        return '<div class="stat-card"><div class="stat-num">' + num + '</div><div class="stat-label">' + label + "</div></div>";
    }

    function esc(s) {
        var d = document.createElement("div");
        d.textContent = s || "";
        return d.innerHTML;
    }

    if (getToken()) showDashboard();
    else showLogin();
})();
