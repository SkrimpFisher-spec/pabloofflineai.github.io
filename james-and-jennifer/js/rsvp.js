(function () {
    "use strict";

    var inviteGate = document.getElementById("inviteGate");
    var formWrap = document.getElementById("rsvpFormWrap");
    var inviteInput = document.getElementById("inviteCodeInput");
    var inviteBtn = document.getElementById("inviteCodeBtn");
    var inviteError = document.getElementById("inviteError");
    var welcomeBanner = document.getElementById("welcomeBanner");
    var form = document.getElementById("rsvpForm");
    var formError = document.getElementById("formError");
    var submitBtn = document.getElementById("submitBtn");
    var mealSection = document.getElementById("mealSection");
    var dietSection = document.getElementById("dietSection");
    var confirmation = document.getElementById("confirmation");
    var confirmMessage = document.getElementById("confirmMessage");

    var currentCode = "";

    function showError(el, msg) {
        el.textContent = msg;
        el.classList.add("visible");
    }

    function clearError(el) {
        el.textContent = "";
        el.classList.remove("visible");
    }

    function fillForm(data) {
        if (!data) return;
        document.getElementById("firstName").value = data.firstName || "";
        document.getElementById("lastName").value = data.lastName || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("phone").value = data.phone || "";
        document.getElementById("address").value = data.addressLine || "";
        document.getElementById("city").value = data.city || "";
        document.getElementById("state").value = data.state || "";
        document.getElementById("zip").value = data.zip || "";
        document.getElementById("dietary").value = data.dietaryRestrictions || "";
        document.getElementById("song").value = data.songRequest || "";
        document.getElementById("artist").value = data.songArtist || "";
        document.getElementById("message").value = data.message || "";

        var attending = data.attending !== false;
        document.querySelector('input[name="attending"][value="yes"]').checked = attending;
        document.querySelector('input[name="attending"][value="no"]').checked = !attending;
        toggleMealSections(attending);

        if (data.mealChoice) {
            var mealRadio = document.querySelector('input[name="meal"][value="' + data.mealChoice + '"]');
            if (mealRadio) mealRadio.checked = true;
        }
    }

    function toggleMealSections(attending) {
        var sections = document.querySelectorAll(".meal-section");
        sections.forEach(function (s) {
            s.classList.toggle("hidden", !attending);
        });
    }

    document.querySelectorAll('input[name="attending"]').forEach(function (r) {
        r.addEventListener("change", function () {
            toggleMealSections(r.value === "yes");
        });
    });

    function unlockForm(inviteData) {
        currentCode = inviteData.code;
        inviteGate.style.display = "none";
        formWrap.style.display = "block";
        welcomeBanner.textContent = "Welcome, " + inviteData.householdLabel;
        welcomeBanner.classList.add("visible");
        if (inviteData.existing) fillForm(inviteData.existing);
    }

    function lookupCode(code) {
        clearError(inviteError);
        inviteBtn.disabled = true;
        fetch(window.weddingApi.url("/api/invite/" + encodeURIComponent(code)))
            .then(function (res) {
                if (!res.ok) throw new Error("Invalid invitation code.");
                return res.json();
            })
            .then(function (data) {
                unlockForm({
                    code: data.code,
                    householdLabel: data.householdLabel,
                    existing: data.existing
                });
            })
            .catch(function (err) {
                showError(inviteError, err.message || "Could not verify code.");
            })
            .finally(function () { inviteBtn.disabled = false; });
    }

    inviteBtn.addEventListener("click", function () {
        var code = (inviteInput.value || "").trim();
        if (!code) { showError(inviteError, "Please enter your RSVP code."); return; }
        lookupCode(code);
    });

    inviteInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); inviteBtn.click(); }
    });

    // URL param ?code=MILLER-042
    var params = new URLSearchParams(window.location.search);
    var urlCode = params.get("code");
    if (urlCode) {
        inviteInput.value = urlCode;
        lookupCode(urlCode);
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearError(formError);
        submitBtn.disabled = true;

        var attending = document.querySelector('input[name="attending"]:checked').value === "yes";
        var mealEl = document.querySelector('input[name="meal"]:checked');

        var payload = {
            inviteCode: currentCode,
            firstName: document.getElementById("firstName").value.trim(),
            lastName: document.getElementById("lastName").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim() || null,
            addressLine: document.getElementById("address").value.trim() || null,
            city: document.getElementById("city").value.trim() || null,
            state: document.getElementById("state").value.trim() || null,
            zip: document.getElementById("zip").value.trim() || null,
            attending: attending,
            mealChoice: attending && mealEl ? mealEl.value : null,
            dietaryRestrictions: document.getElementById("dietary").value.trim() || null,
            songRequest: document.getElementById("song").value.trim() || null,
            songArtist: document.getElementById("artist").value.trim() || null,
            message: document.getElementById("message").value.trim() || null,
            website: form.querySelector('[name="website"]').value
        };

        fetch(window.weddingApi.url("/api/rsvp"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
            .then(function (r) {
                if (!r.ok) throw new Error(r.data.error || "Submission failed.");
                confirmMessage.textContent = r.data.message;
                confirmation.classList.add("visible");
                if (window.launchConfetti) window.launchConfetti();
            })
            .catch(function (err) {
                showError(formError, err.message);
            })
            .finally(function () { submitBtn.disabled = false; });
    });

    confirmation.addEventListener("click", function () {
        confirmation.classList.remove("visible");
    });
})();
