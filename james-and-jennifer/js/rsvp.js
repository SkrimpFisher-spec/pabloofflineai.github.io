(function () {
    "use strict";

    var form = document.getElementById("rsvpForm");
    var formError = document.getElementById("formError");
    var submitBtn = document.getElementById("submitBtn");
    var confirmation = document.getElementById("confirmation");
    var confirmMessage = document.getElementById("confirmMessage");

    function showError(el, msg) {
        el.textContent = msg;
        el.classList.add("visible");
    }

    function clearError(el) {
        el.textContent = "";
        el.classList.remove("visible");
    }

    function toggleMealSections(attending) {
        document.querySelectorAll(".meal-section").forEach(function (s) {
            s.classList.toggle("hidden", !attending);
        });
    }

    document.querySelectorAll('input[name="attending"]').forEach(function (r) {
        r.addEventListener("change", function () {
            toggleMealSections(r.value === "yes");
        });
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearError(formError);
        submitBtn.disabled = true;

        var attending = document.querySelector('input[name="attending"]:checked').value === "yes";
        var mealEl = document.querySelector('input[name="meal"]:checked');

        var payload = {
            inviteCode: "",
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
