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

    function showError(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.classList.add("visible");
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function clearError(el) {
        if (!el) return;
        el.textContent = "";
        el.classList.remove("visible");
    }

    function stepIsVisible(step) {
        return step && !step.classList.contains("rsvp-step--hidden");
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

    function getAttendingChoice() {
        var checked = document.querySelector('input[name="attending"]:checked');
        return checked ? checked.value : null;
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
        if (window.weddingRsvpPayload) return window.weddingRsvpPayload.formatRsvpText(p);
        return "";
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
                    email: p.email || "",
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

        var next = new URL(p.attending ? "rsvp-yes.html" : "rsvp-no.html", window.location.href);
        next.search = "";
        next.hash = "";
        var postCfg = {
            formSubmitEmail: email,
            nextUrl: next.toString()
        };
        var body = window.weddingRsvpPayload
            ? window.weddingRsvpPayload.buildFormSubmitBody(p, postCfg)
            : { name: displayName, message: formatted };
        delete body._formsubmit_to;

        var post = document.createElement("form");
        post.method = "POST";
        post.action = "https://formsubmit.co/" + email;
        post.acceptCharset = "UTF-8";
        post.style.display = "none";
        Object.keys(body).forEach(function (key) {
            if (body[key] === undefined || body[key] === null) return;
            var input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(body[key]);
            post.appendChild(input);
        });
        document.body.appendChild(post);
        post.submit();
        return new Promise(function () {});
    }

    function showConfirmation(message, attending, guestNotified, summary) {
        if (!confirmation || !confirmMessage) return;
        confirmMessage.textContent = message;
        var summaryEl = document.getElementById("confirmSummary");
        if (summaryEl) {
            summaryEl.textContent = summary || "";
            summaryEl.hidden = !summary;
        }
        if (confirmEmailNote) {
            confirmEmailNote.textContent = guestNotified
                ? "A confirmation was sent to your email."
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
        var emailEl = document.getElementById("email");
        var phoneEl = document.getElementById("phone");
        var addressEl = document.getElementById("address");
        var songEl = document.getElementById("song");
        var artistEl = document.getElementById("artist");
        var messageEl = document.getElementById("message");
        var plusOneEl = document.querySelector('input[name="plusOne"]:checked');
        var plusOneNameEl = document.getElementById("plusOneName");
        var plusOneChoice = attending && plusOneEl ? plusOneEl.value : null;

        return {
            fullName: parsed.fullName,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            email: attending && emailEl ? emailEl.value.trim() : null,
            phone: attending && phoneEl ? (phoneEl.value.trim() || null) : null,
            addressLine: attending && addressEl ? (addressEl.value.trim() || null) : null,
            attending: attending,
            plusOneChoice: plusOneChoice,
            plusOneName: plusOneChoice === "yes" && plusOneNameEl ? (plusOneNameEl.value.trim() || null) : null,
            songRequest: attending && songEl ? (songEl.value.trim() || null) : null,
            songArtist: attending && artistEl ? (artistEl.value.trim() || null) : null,
            message: attending && messageEl ? (messageEl.value.trim() || null) : null,
            submittedAt: new Date().toLocaleString()
        };
    }

    function rsvpSummary(p) {
        var lines = [p.attending ? "Attendance: Happily Accepts" : "Attendance: Regretfully Declines"];
        if (p.attending && p.plusOneChoice === "yes") lines.push("Plus one: " + p.plusOneName);
        if (p.attending && p.plusOneChoice === "no") lines.push("Plus one: No");
        return lines.join(". ") + ".";
    }

    function setSubmitting(triggerBtn, submitting) {
        if (!triggerBtn) return;
        triggerBtn.disabled = submitting;
        if (submitBtn && triggerBtn === submitBtn) {
            submitBtn.textContent = submitting ? "Sending..." : "Submit RSVP";
        }
        if (declineBtn && triggerBtn === declineBtn) {
            declineBtn.textContent = submitting ? "Sending..." : "Send Regretful Decline";
        }
    }

    function sendRsvp(attending, triggerBtn) {
        clearError(formError);

        var honeypot = form.querySelector('[name="website"]');
        var honey = form.querySelector('[name="_honey"]');
        if ((honeypot && honeypot.value) || (honey && honey.value)) {
            showConfirmation("Thank you!", true, false);
            return;
        }

        var payload = buildPayload(attending);
        var validationError = window.weddingRsvpPayload
            ? window.weddingRsvpPayload.validateRsvp(payload)
            : (!payload.fullName ? "Please enter your name." : "");

        if (validationError) {
            showError(formError, validationError);
            return;
        }

        setSubmitting(triggerBtn, true);

        deliverRsvp(payload)
            .then(function (result) {
                showConfirmation(
                    attending
                        ? "We cannot wait to celebrate with you!"
                        : "Thank you for letting us know. You will be missed.",
                    attending,
                    result.guestNotified,
                    rsvpSummary(payload)
                );
            })
            .catch(function (err) {
                showError(formError, err.message || "Submission failed.");
            })
            .finally(function () {
                setSubmitting(triggerBtn, false);
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

            document.querySelectorAll('input[name="attending"]').forEach(function (r) {
                r.checked = false;
            });

            setDeclineVisible(false);
            showStep(stepAttendance);
        });
    }

    document.querySelectorAll('input[name="plusOne"]').forEach(function (r) {
        r.addEventListener("change", function () {
            var group = document.getElementById("plusOneNameGroup");
            var show = this.checked && this.value === "yes";
            if (group) group.classList.toggle("rsvp-step--hidden", !show);
            if (!show) {
                var nameInput = document.getElementById("plusOneName");
                if (nameInput) nameInput.value = "";
            }
        });
    });

    document.querySelectorAll('input[name="attending"]').forEach(function (r) {
        r.addEventListener("change", function () {
            clearError(formError);

            if (this.value === "yes") {
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
            if (getAttendingChoice() !== "no") {
                showError(formError, "Please choose Regretfully Declines before sending.");
                return;
            }
            sendRsvp(false, declineBtn);
        });
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearError(formError);

        if (stepIsVisible(stepDetails)) {
            if (getAttendingChoice() !== "yes") {
                showError(formError, "Please choose Happily Accepts before submitting.");
                return;
            }
            sendRsvp(true, submitBtn);
            return;
        }

        if (stepIsVisible(stepName) && guestNameInput && guestNameInput.value.trim() && continueBtn) {
            continueBtn.click();
            return;
        }

        if (stepIsVisible(stepAttendance)) {
            showError(formError, "Please choose whether you'll be joining us.");
        }
    });

    if (confirmation) {
        confirmation.addEventListener("click", function (e) {
            if (e.target === confirmation) confirmation.classList.remove("visible");
        });
    }

    if (confirmClose) {
        confirmClose.addEventListener("click", function () {
            confirmation.classList.remove("visible");
        });
    }

    var returned = new URLSearchParams(window.location.search).get("rsvp");
    if (window.location.hash === "#rsvp=yes") returned = "yes";
    if (window.location.hash === "#rsvp=no") returned = "no";
    if (returned === "yes" || returned === "no") {
        showConfirmation(
            returned === "yes"
                ? "We cannot wait to celebrate with you!"
                : "Thank you for letting us know. You will be missed.",
            returned === "yes",
            returned === "yes",
            returned === "yes" ? "Attendance: Happily Accepts." : "Attendance: Regretfully Declines."
        );
        var clean = new URL(window.location.href);
        clean.searchParams.delete("rsvp");
        clean.hash = "";
        window.history.replaceState({}, "", clean.pathname + clean.search);
    }
})();
