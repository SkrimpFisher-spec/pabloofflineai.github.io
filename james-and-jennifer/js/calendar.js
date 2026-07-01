/**
 * Calendar helpers for RSVP confirmation and reminders.
 */
(function () {
    "use strict";

    var cfg = window.WEDDING_CONFIG || {};

    function pad(n) { return n < 10 ? "0" + n : "" + n; }

    function formatGoogleUtc(isoLocal) {
        var d = new Date(isoLocal);
        var y = d.getUTCFullYear();
        var mo = pad(d.getUTCMonth() + 1);
        var da = pad(d.getUTCDate());
        var h = pad(d.getUTCHours());
        var mi = pad(d.getUTCMinutes());
        var s = pad(d.getUTCSeconds());
        return y + mo + da + "T" + h + mi + s + "Z";
    }

    function toUtcIso(isoLocal) {
        var d = new Date(isoLocal);
        return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    }

    window.weddingCalendar = {
        googleUrl: function () {
            var title = encodeURIComponent(cfg.eventTitle || "James & Jennifer's Wedding");
            var start = formatGoogleUtc(cfg.eventStart || "2027-02-07T21:30:00.000Z");
            var end = formatGoogleUtc(cfg.eventEnd || "2027-02-08T04:00:00.000Z");
            var details = encodeURIComponent(cfg.eventDetails || "Ceremony at 4:30 PM. We cannot wait to celebrate with you!");
            var location = encodeURIComponent(cfg.eventLocation || "2396 Juniper Creek Rd, Quincy, FL 32351");
            var tz = encodeURIComponent(cfg.eventTimezone || "America/New_York");
            return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + title +
                "&dates=" + start + "/" + end + "&details=" + details + "&location=" + location + "&ctz=" + tz;
        },

        outlookUrl: function () {
            var title = encodeURIComponent(cfg.eventTitle || "James & Jennifer's Wedding");
            var start = new Date(cfg.eventStart || "2027-02-07T21:30:00.000Z").toISOString();
            var end = new Date(cfg.eventEnd || "2027-02-08T04:00:00.000Z").toISOString();
            var body = encodeURIComponent(cfg.eventDetails || "Ceremony at 4:30 PM.");
            var location = encodeURIComponent(cfg.eventLocation || "2396 Juniper Creek Rd, Quincy, FL 32351");
            return "https://outlook.live.com/calendar/0/deeplink/compose?subject=" + title +
                "&body=" + body + "&location=" + location + "&startdt=" + start + "&enddt=" + end + "&allday=false";
        },

        downloadIcs: function () {
            var title = cfg.eventTitle || "James & Jennifer's Wedding";
            var location = cfg.eventLocation || "2396 Juniper Creek Rd, Quincy, FL 32351";
            var start = cfg.eventStartLocal || "20271017T163000";
            var end = cfg.eventEndLocal || "20271017T230000";
            var tz = cfg.eventTimezone || "America/New_York";
            var ics = [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//James and Jennifer Wedding//EN",
                "BEGIN:VEVENT",
                "UID:wedding-james-jennifer-2027@pablooffline.com",
                "DTSTART;TZID=" + tz + ":" + start,
                "DTEND;TZID=" + tz + ":" + end,
                "SUMMARY:" + title,
                "LOCATION:" + location,
                "DESCRIPTION:Ceremony at 4:30 PM. Reception to follow.",
                "BEGIN:VALARM",
                "TRIGGER:-P1D",
                "ACTION:DISPLAY",
                "DESCRIPTION:Wedding tomorrow",
                "END:VALARM",
                "END:VEVENT",
                "END:VCALENDAR"
            ].join("\r\n");

            var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "james-jennifer-wedding.ics";
            a.click();
            URL.revokeObjectURL(a.href);
        },

        showInConfirmation: function (attending) {
            var block = document.getElementById("calendarActions");
            if (!block) return;
            block.style.display = attending ? "block" : "none";
            if (!attending) return;

            var google = document.getElementById("calGoogle");
            var outlook = document.getElementById("calOutlook");
            var apple = document.getElementById("calApple");
            if (google) google.href = window.weddingCalendar.googleUrl();
            if (outlook) outlook.href = window.weddingCalendar.outlookUrl();
            if (apple) {
                apple.onclick = function (e) {
                    e.preventDefault();
                    window.weddingCalendar.downloadIcs();
                };
            }
        }
    };
})();
