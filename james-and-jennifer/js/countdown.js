/**
 * Countdown math for February 7, 2027 at 3:30 PM America/New_York.
 * Zero is shown only once that instant has been reached.
 */
(function (root) {
    "use strict";

    function wallTimeToUtcMs(year, month, day, hour, minute, timeZone) {
        var formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timeZone,
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        function read(ms) {
            var map = {};
            formatter.formatToParts(new Date(ms)).forEach(function (part) {
                if (part.type !== "literal") map[part.type] = part.value;
            });
            var hourValue = Number(map.hour);
            if (hourValue === 24) hourValue = 0;
            return Date.UTC(
                Number(map.year),
                Number(map.month) - 1,
                Number(map.day),
                hourValue,
                Number(map.minute),
                Number(map.second)
            );
        }

        var desired = Date.UTC(year, month - 1, day, hour, minute, 0);
        var utcGuess = desired;
        var zonedAsUtc = read(utcGuess);
        var corrected = utcGuess - (zonedAsUtc - desired);
        var check = read(corrected);
        if (check !== desired) corrected = corrected - (check - desired);
        return corrected;
    }

    function remainingUntil(nowMs, targetMs) {
        var diff = targetMs - nowMs;
        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        var totalSeconds = Math.ceil(diff / 1000);
        return {
            days: Math.floor(totalSeconds / 86400),
            hours: Math.floor((totalSeconds % 86400) / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60
        };
    }

    root.weddingCountdown = {
        wallTimeToUtcMs: wallTimeToUtcMs,
        remainingUntil: remainingUntil
    };
})(typeof globalThis !== "undefined" ? globalThis : this);
