(function () {
    "use strict";

    var form = document.getElementById("rsvpForm");
    var formError = document.getElementById("formError");
    var submitBtn = document.getElementById("submitBtn");
    var confirmation = document.getElementById("confirmation");
    var confirmMessage = document.getElementById("confirmMessage");
    var confirmEmailNote = document.getElementById("confirmEmailNote");
    var confirmClose = document.getElementById("confirmClose");
    var cfg = window.WEDDING_CONFIG || {};

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

    function formatRsvpText(p) {
        var lines = [
            "Wedding RSVP — Jennifer & James",
            "Submitted: " + new Date().toLocaleString(),
            "",
            "Name: " + p.firstName + " " + p.lastName,
            "Email: " + p.email,
            "Phone: " + (p.phone || "(none)"),
            "Attendance: " + (p.attending ? "Happily Accepts" : "Regretfully Declines"),
            "Meal: " + (p.mealChoice || "(n/a)"),
            "Dietary: " + (p.dietaryRestrictions || "(none)"),
            "Mailing address: " + (p.addressLine || "(none)"),
            "Song request: " + (p.songRequest || "(none)"),
            "Artist: " + (p.songArtist || "(none)"),
            "Message: " + (p.message || "(none)")
        ];
        return lines.join("\n");
    }

    function deliverRsvp(p) {
        if (cfg.web3formsKey) {
            return fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    access_key: cfg.web3formsKey,
                    subject: "RSVP: " + p.firstName + " " + p.lastName + " — " + (p.attending ? "Attending" : "Declined"),
                    from_name: p.firstName + " " + p.lastName,
                    email: p.email,
                    phone: p.phone || "",
                    message: formatRsvpText(p)
                })
            }).then(function (res) { return res.json(); })
              .then(function (data) {
                  if (!data.success) throw new Error(data.message || "Could not send RSVP.");
                  return { ok: true, guestNotified: true };
              });
        }

        var email = (cfg.formSubmitEmail || "").trim();
        if (!email) {
            return Promise.reject(new Error(
                "RSVP is not connected yet. Add your email to js/config.js (formSubmitEmail)."
            ));
        }

        return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(email), {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                name: p.firstName + " " + p.lastName,
                email: p.email,
                phone: p.phone || "",
                address: p.addressLine || "",
                attending: p.attending ? "Happily Accepts" : "Regretfully Declines",
                meal: p.mealChoice || "",
                dietary: p.dietaryRestrictions || "",
                song: p.songRequest || "",
                artist: p.songArtist || "",
                guest_message: p.message || "",
                message: formatRsvpText(p),
                _subject: "Wedding RSVP: " + p.firstName + " " + p.lastName + " — " + (p.attending ? "Attending" : "Declined"),
                _template: "table",
                _captcha: "false",
                _autoresponse: "Thank you! Your RSVP for Jennifer & James's wedding on February 7, 2027 has been received. We can't wait to celebrate with you!"
            })
        }).then(function (res) { return res.json(); })
          .then(function (data) {
              if (data.success !== "true" && data.success !== true) {
                  throw new Error("Could not send RSVP. Try again in a moment.");
              }
              return { ok: true, guestNotified: true };
          });
    }

    function showConfirmation(message, attending, guestNotified) {
        confirmMessage.textContent = message;
        if (confirmEmailNote) {
            confirmEmailNote.textContent = guestNotified
                ? "A confirmation copy was sent to your email."
                : "";
            confirmEmailNote.hidden = !guestNotified;
        }
        if (window.weddingCalendar) {
            window.weddingCalendar.showInConfirmation(attending);
        }
        confirmation.classList.add("visible");
        if (window.launchConfetti && attending) window.launchConfetti();
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearError(formError);

        if (form.querySelector('[name="website"]').value) {
            showConfirmation("Thank you!", true, false);
            return;
        }

        submitBtn.disabled = true;

        var attending = document.querySelector('input[name="attending"]:checked').value === "yes";
        var mealEl = document.querySelector('input[name="meal"]:checked');

        var payload = {
            firstName: document.getElementById("firstName").value.trim(),
            lastName: document.getElementById("lastName").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim() || null,
            addressLine: document.getElementById("address").value.trim() || null,
            attending: attending,
            mealChoice: attending && mealEl ? mealEl.value : null,
            dietaryRestrictions: document.getElementById("dietary").value.trim() || null,
            songRequest: document.getElementById("song").value.trim() || null,
            songArtist: document.getElementById("artist").value.trim() || null,
            message: document.getElementById("message").value.trim() || null
        };

        if (!payload.firstName || !payload.lastName || !payload.email) {
            showError(formError, "Please fill in your name and email.");
            submitBtn.disabled = false;
            return;
        }

        deliverRsvp(payload)
            .then(function () {
                showConfirmation(
                    attending
                        ? "We cannot wait to celebrate with you!"
                        : "Thank you for letting us know. You will be missed.",
                    attending,
                    true
                );
            })
            .catch(function (err) {
                showError(formError, err.message || "Submission failed.");
            })
            .finally(function () { submitBtn.disabled = false; });
    });

    confirmation.addEventListener("click", function (e) {
        if (e.target === confirmation) confirmation.classList.remove("visible");
    });

    if (confirmClose) {
        confirmClose.addEventListener("click", function () {
            confirmation.classList.remove("visible");
        });
    }
})();
