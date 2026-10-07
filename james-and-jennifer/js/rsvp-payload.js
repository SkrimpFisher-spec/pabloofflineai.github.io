/**
 * RSVP payload for FormSubmit. Declines do not require an email.
 */
(function (root) {
    "use strict";

    function validateRsvp(p) {
        if (!p || !p.fullName) return "Please enter your name.";
        if (!p.attending) return "";
        if (!p.email) return "Please enter your email so we can confirm your RSVP.";
        if (!p.plusOneChoice) return "Please let us know if you are bringing a plus one.";
        if (p.plusOneChoice === "yes" && !p.plusOneName) return "Please enter your plus one's name.";
        return "";
    }

    function formatRsvpText(p) {
        var displayName = p.fullName || ((p.firstName || "") + " " + (p.lastName || "")).trim();
        var lines = [
            "Wedding RSVP — Jennifer & James",
            "Submitted: " + (p.submittedAt || ""),
            "",
            "Name: " + displayName,
            "Attendance: " + (p.attending ? "Happily Accepts" : "Regretfully Declines")
        ];

        if (p.attending) {
            lines.push(
                "Email: " + p.email,
                "Phone: " + (p.phone || "(none)"),
                "Mailing address: " + (p.addressLine || "(none)"),
                "Plus one: " + (p.plusOneChoice === "yes" ? "Yes" : "No")
            );
            if (p.plusOneChoice === "yes") lines.push("Plus one name: " + p.plusOneName);
            lines.push(
                "Song request: " + (p.songRequest || "(none)"),
                "Artist: " + (p.songArtist || "(none)"),
                "Message: " + (p.message || "(none)")
            );
        }

        return lines.join("\n");
    }

    function registrantConfirmation(p) {
        var who = p.firstName || p.fullName || "there";
        if (!p.attending) {
            return "Hello " + who + ", thank you for letting us know. We will miss you on February 7, 2027.";
        }
        var plus = p.plusOneChoice === "yes" && p.plusOneName
            ? " We have " + p.plusOneName + " down as your plus one."
            : "";
        return "Hello " + who + ", your RSVP is confirmed for Jennifer and James on Sunday, February 7, 2027. The ceremony is at 3:30 PM at The Glade Venue, 871 Pine Hill Road, Cairo, GA 39828. Guests can arrive at 3:00 PM. The reception is 4:00 PM to 9:00 PM and is indoors." + plus + " We cannot wait to celebrate with you.";
    }

    function buildFormSubmitBody(p, cfg) {
        var displayName = p.fullName || ((p.firstName || "") + " " + (p.lastName || "")).trim();
        var subjectSuffix = p.attending ? "Attending" : "Declined";
        var body = {
            name: displayName,
            attendance: p.attending ? "Happily Accepts" : "Regretfully Declines",
            email: p.email || "",
            phone: p.phone || "",
            mailing_address: p.addressLine || "",
            plus_one: p.attending ? (p.plusOneChoice === "yes" ? "Yes" : "No") : "",
            plus_one_name: p.plusOneName || "",
            song: p.songRequest || "",
            artist: p.songArtist || "",
            guest_message: p.message || "",
            message: formatRsvpText(p),
            _subject: "Wedding RSVP: " + displayName + " — " + subjectSuffix,
            _template: "table"
        };

        if (p.email) {
            body._replyto = p.email;
            body._autoresponse = registrantConfirmation(p);
        }
        if (cfg && cfg.nextUrl) body._next = cfg.nextUrl;

        return body;
    }

    root.weddingRsvpPayload = {
        validateRsvp: validateRsvp,
        formatRsvpText: formatRsvpText,
        buildFormSubmitBody: buildFormSubmitBody,
        registrantConfirmation: registrantConfirmation
    };
})(typeof globalThis !== "undefined" ? globalThis : this);
