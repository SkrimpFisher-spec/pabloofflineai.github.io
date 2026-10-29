/**
 * RSVP payload for the Google Sheet. Declines do not require an email.
 * The site does not send a confirmation email.
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

    function buildSheetBody(p, cfg) {
        var displayName = p.fullName || ((p.firstName || "") + " " + (p.lastName || "")).trim();
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
            guest_message: p.message || ""
        };
        if (cfg && cfg.nextUrl) body._next = cfg.nextUrl;
        return body;
    }

    root.weddingRsvpPayload = {
        validateRsvp: validateRsvp,
        formatRsvpText: formatRsvpText,
        buildSheetBody: buildSheetBody
    };
})(typeof globalThis !== "undefined" ? globalThis : this);
