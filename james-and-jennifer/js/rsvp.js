(function () {
    "use strict";

    var form = document.getElementById("rsvpForm");
    if (!form) return;

    var formError = document.getElementById("formError");
    var submitBtn = document.getElementById("submitBtn");
    var declineBtn = document.getElementById("rsvpDeclineBtn");
    var confirmation = document.getElementById("confirmation");
    var confirmMessage = document.getElementById("confirmMessage");
    var confirmEmailNote = document.getElementById("confirmEmailNote");
    var confirmClose = document.getElementById("confirmClose");
    var cfg = window.WEDDING_CONFIG || {};

    var stepName = document.getElementById("rsvpStepName");
    var stepAttendance = document.getElementById("rsvpStepAttendance");
    var stepDetails = document.getElementById("rsvpStepDetails");
    var continueBtn = document.getElementById("rsvpContinueBtn");
    var greetingEl = document.getElementById("rsvpGreeting");
    var guestNameInput = document.getElementById("guestName");

    var guestFullName = "";
    var guestAttending = null;

    function showError(el, msg) {
        el.textContent = msg;
        el.classList.add("visible");
    }

    function clearError(el) {
        el.textContent = "";
        el.classList.remove("visible");
    }

    function parseGuestName(full) {
        var trimmed = full.trim();
        var parts = trimmed.split(/\s+/).filter(Boolean);
        return {
            fullName: trimmed,
            firstName: parts[0] || "",
            lastName: parts.slice(1).join(" ")
        };
    }

    function readGuestName() {
        return guestFullName || (guestNameInput ? guestNameInput.value.trim() : "");
    }

    function showStep(step) {
        [stepName, stepAttendance, stepDetails].forEach(function (s) {
            if (s) s.classList.add("rsvp-step--hidden");
        });
        if (step) step.classList.remove("rsvp-step--hidden");
    }

    function setDeclineVisible(visible) {
        if (declineBtn) declineBtn.classList.toggle("rsvp-step--hidden", !visible);
    }

    function formatRsvpText(p) {
        var displayName = p.fullName || (p.firstName + " " + p.lastName).trim();
        var lines = [
            "Wedding RSVP — Jennifer & James",
            "Submitted: " + new Date().toLocaleString(),
            "",
            "Name: " + displayName,
            "Attendance: " + (p.attending ? "Happily Accepts" : "Regretfully Declines")
        ];

        if (p.attending) {
            lines.push(
                "Email: " + p.email,
                "Phone: " + (p.phone || "(none)"),
                "Meal: " + (p.mealChoice || "(n/a)"),
                "Dietary: " + (p.dietaryRestrictions || "(none)"),
                "Mailing address: " + (p.addressLine || "(none)"),
                "Song request: " + (p.songRequest || "(none)"),
                "Artist: " + (p.songArtist || "(none)"),
                "Message: " + (p.message || "(none)")
            );
        }

        return lines.join("\n");
    }

    function deliverRsvp(p) {
        var displayName = p.fullName || (p.firstName + " " + p.lastName).trim();
        var subjectSuffix = p.attending ? "Attending" : "Declined";
        var formatted = formatRsvpText(p);

        if (cfg.web3formsKey) {
            return fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    access_key: cfg.web3formsKey,
                    subject: "RSVP: " + displayName + " — " + subjectSuffix,
                    from_name: displayName,
                    email: p.email || cfg.formSubmitEmail || "",
                    phone: p.phone || "",
                    message: formatted
                })
            }).then(function (res) { return res.json(); })
              .then(function (data) {
                  if (!data.success) throw new Error(data.message || "Could not send RSVP.");
                  return { ok: true, guestNotified: !!p.email };
              });
        }

        var email = (cfg.formSubmitEmail || "").trim();
        if (!email) {
            return Promise.reject(new Error(
                "RSVP is not connected yet. Add your email to js/config.js (formSubmitEmail)."
            ));
        }

        var body = {
            name: displayName,
            attending: p.attending ? "Happily Accepts" : "Regretfully Declines",
            email: p.email || "",
            phone: p.phone || "",
            address: p.addressLine || "",
            meal: p.mealChoice || "",
            dietary: p.dietaryRestrictions || "",
            song: p.songRequest || "",
            artist: p.songArtist || "",
            guest_message: p.message || "",
            message: formatted,
            _subject: "Wedding RSVP: " + displayName + " — " + subjectSuffix,
            _captcha: "false"
        };

        if (p.attending && p.email) {
            body._replyto = p.email;
            body._autoresponse = "Thank you! Your RSVP for Jennifer & James's wedding on February 7, 2027 has been received. We can't wait to celebrate with you!";
        }

        return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(email), {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(body)
        }).then(function (res) { return res.json(); })
          .then(function (data) {
              if (data.success !== "true" && data.success !== true) {
                  throw new Error("Could not send RSVP. Try again in a moment.");
              }
              return { ok: true, guestNotified: !!(p.attending && p.email) };
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

    function buildPayload(attending) {
        var parsed = parseGuestName(readGuestName());
        var mealEl = document.querySelector('input[name="meal"]:checked');

        return {
            fullName: parsed.fullName,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            email: attending ? document.getElementById("email").value.trim() : null,
            phone: attending ? (document.getElementById("phone").value.trim() || null) : null,
            addressLine: attending ? (document.getElementById("address").value.trim() || null) : null,
            attending: attending,
            mealChoice: attending && mealEl ? mealEl.value : null,
            dietaryRestrictions: attending ? (document.getElementById("dietary").value.trim() || null) : null,
            songRequest: attending ? (document.getElementById("song").value.trim() || null) : null,
            songArtist: attending ? (document.getElementById("artist").value.trim() || null) : null,
            message: attending ? (document.getElementById("message").value.trim() || null) : null
        };
    }

    function sendRsvp(attending, triggerBtn) {
        clearError(formError);

        if (form.querySelector('[name="website"]').value) {
            showConfirmation("Thank you!", true, false);
            return;
        }

        var payload = buildPayload(attending);

        if (!payload.fullName) {
            showError(formError, "Please enter your name.");
            return;
        }

        if (attending && !payload.email) {
            showError(formError, "Please enter your email so we can confirm your RSVP.");
            return;
        }

        if (triggerBtn) triggerBtn.disabled = true;

        deliverRsvp(payload)
            .then(function (result) {
                showConfirmation(
                    attending
                        ? "We cannot wait to celebrate with you!"
                        : "Thank you for letting us know. You will be missed.",
                    attending,
                    result.guestNotified
                );
            })
            .catch(function (err) {
                showError(formError, err.message || "Submission failed.");
            })
            .finally(function () {
                if (triggerBtn) triggerBtn.disabled = false;
            });
    }

    if (continueBtn) {
        continueBtn.addEventListener("click", function () {
            clearError(formError);
            guestFullName = guestNameInput ? guestNameInput.value.trim() : "";

            if (!guestFullName) {
                showError(formError, "Please enter your name.");
                return;
            }

            var parsed = parseGuestName(guestFullName);
            if (greetingEl) {
                greetingEl.textContent = "Hello, " + parsed.firstName + "!";
            }

            guestAttending = null;
            document.querySelectorAll('input[name="attending"]').forEach(function (r) {
                r.checked = false;
            });

            setDeclineVisible(false);
            showStep(stepAttendance);
        });
    }

    document.querySelectorAll('input[name="attending"]').forEach(function (r) {
        r.addEventListener("change", function () {
            clearError(formError);
            guestAttending = r.value;

            if (r.value === "yes") {
                setDeclineVisible(false);
                showStep(stepDetails);
            } else {
                showStep(stepAttendance);
                setDeclineVisible(true);
            }
        });
    });

    if (declineBtn) {
        declineBtn.addEventListener("click", function () {
            if (guestAttending !== "no") {
                showError(formError, "Please choose Regretfully Declines before sending.");
                return;
            }
            sendRsvp(false, declineBtn);
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", function () {
            if (guestAttending !== "yes") {
                showError(formError, "Please choose Happily Accepts and complete the form.");
                return;
            }
            sendRsvp(true, submitBtn);
        });
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
    });

    form.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" || e.target.tagName === "TEXTAREA") return;

        e.preventDefault();

        if (guestNameInput && e.target === guestNameInput && continueBtn) {
            continueBtn.click();
        }
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
