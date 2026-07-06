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

    var stepName = document.getElementById("rsvpStepName");
    var stepAttendance = document.getElementById("rsvpStepAttendance");
    var stepDetails = document.getElementById("rsvpStepDetails");
    var continueBtn = document.getElementById("rsvpContinueBtn");
    var greetingEl = document.getElementById("rsvpGreeting");

    var guestFirstName = "";
    var guestLastName = "";

    function showError(el, msg) {
        el.textContent = msg;
        el.classList.add("visible");
    }

    function clearError(el) {
        el.textContent = "";
        el.classList.remove("visible");
    }

    function showStep(step) {
        [stepName, stepAttendance, stepDetails].forEach(function (s) {
            if (s) s.classList.add("rsvp-step--hidden");
        });
        if (step) step.classList.remove("rsvp-step--hidden");
    }

    function setSubmitVisible(visible) {
        if (submitBtn) submitBtn.classList.toggle("rsvp-step--hidden", !visible);
    }

    function getAttending() {
        var checked = document.querySelector('input[name="attending"]:checked');
        return checked ? checked.value === "yes" : null;
    }

    if (continueBtn) {
        continueBtn.addEventListener("click", function () {
            clearError(formError);
            guestFirstName = document.getElementById("firstName").value.trim();
            guestLastName = document.getElementById("lastName").value.trim();

            if (!guestFirstName || !guestLastName) {
                showError(formError, "Please enter your first and last name.");
                return;
            }

            if (greetingEl) {
                greetingEl.textContent = "Hello, " + guestFirstName + "!";
            }

            document.querySelectorAll('input[name="attending"]').forEach(function (r) {
                r.checked = false;
            });

            showStep(stepAttendance);
            setSubmitVisible(false);
        });
    }

    document.querySelectorAll('input[name="attending"]').forEach(function (r) {
        r.addEventListener("change", function () {
            clearError(formError);

            if (r.value === "yes") {
                showStep(stepDetails);
                setSubmitVisible(true);
            } else {
                showStep(stepAttendance);
                setSubmitVisible(true);
            }
        });
    });

    function formatRsvpText(p) {
        var lines = [
            "Wedding RSVP — Jennifer & James",
            "Submitted: " + new Date().toLocaleString(),
            "",
            "Name: " + p.firstName + " " + p.lastName,
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
        var subjectSuffix = p.attending ? "Attending" : "Declined";
        var guestEmail = p.email || cfg.formSubmitEmail || "";

        if (cfg.web3formsKey) {
            return fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    access_key: cfg.web3formsKey,
                    subject: "RSVP: " + p.firstName + " " + p.lastName + " — " + subjectSuffix,
                    from_name: p.firstName + " " + p.lastName,
                    email: guestEmail,
                    phone: p.phone || "",
                    message: formatRsvpText(p)
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
            name: p.firstName + " " + p.lastName,
            attending: p.attending ? "Happily Accepts" : "Regretfully Declines",
            message: formatRsvpText(p),
            _subject: "Wedding RSVP: " + p.firstName + " " + p.lastName + " — " + subjectSuffix,
            _template: "table",
            _captcha: "false"
        };

        if (p.attending) {
            body.email = p.email;
            body.phone = p.phone || "";
            body.address = p.addressLine || "";
            body.meal = p.mealChoice || "";
            body.dietary = p.dietaryRestrictions || "";
            body.song = p.songRequest || "";
            body.artist = p.songArtist || "";
            body.guest_message = p.message || "";
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
              return { ok: true, guestNotified: !!p.email };
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

        var attendingChoice = getAttending();
        if (attendingChoice === null) {
            showError(formError, "Please let us know if you'll be joining us.");
            return;
        }

        var attending = attendingChoice === "yes";
        var mealEl = document.querySelector('input[name="meal"]:checked');

        var payload = {
            firstName: guestFirstName || document.getElementById("firstName").value.trim(),
            lastName: guestLastName || document.getElementById("lastName").value.trim(),
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

        if (!payload.firstName || !payload.lastName) {
            showError(formError, "Please enter your name.");
            submitBtn.disabled = false;
            return;
        }

        if (attending && !payload.email) {
            showError(formError, "Please enter your email so we can confirm your RSVP.");
            submitBtn.disabled = false;
            return;
        }

        submitBtn.disabled = true;

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
