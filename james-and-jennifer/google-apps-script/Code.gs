/**
 * Wedding RSVP → this spreadsheet.
 *
 * One-time setup (the Google account that should own the RSVPs):
 * 1. Create a blank Google Sheet.
 * 2. Extensions → Apps Script. Replace the default file with this one. Save.
 * 3. Deploy → New deployment → gear → Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 4. Copy the Web app URL (it ends in /exec).
 * 5. Paste that URL into site/js/config.js as googleScriptUrl.
 * 6. Open the /exec URL once. That builds the Dashboard and RSVPs tabs.
 *
 * After any later edit here: Deploy → Manage deployments → Edit → New version.
 * Guests are not sent a confirmation email.
 */
var HEADERS = [
  "Timestamp",
  "Name",
  "Attendance",
  "Email",
  "Phone",
  "Mailing address",
  "Plus one",
  "Plus one name",
  "Song",
  "Artist",
  "Message"
];

function doGet() {
  ensureSheets_(true);
  return HtmlService.createHtmlOutput(
    "The wedding RSVP sheet is ready. New submissions appear on the RSVPs tab. Totals and charts are on Dashboard. Guests are not sent a confirmation email."
  );
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var attendance = String(p.attendance || "").trim();
  var attending = attendance === "Happily Accepts";
  var declining = attendance === "Regretfully Declines";
  var next = safeNext_(p._next, attending);

  if (String(p.website || "").trim() || String(p._honey || "").trim()) {
    return redirect_(next);
  }
  if (!attending && !declining) {
    return HtmlService.createHtmlOutput("<p>Please go back and choose whether you are attending.</p>");
  }

  var name = String(p.name || "").replace(/\s+/g, " ").trim();
  if (!name) {
    return HtmlService.createHtmlOutput("<p>Please go back and enter your name.</p>");
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    ensureSheets_(false);
    SpreadsheetApp.getActive().getSheetByName("RSVPs").appendRow([
      new Date(),
      name,
      attendance,
      attending ? String(p.email || "").trim() : "",
      attending ? String(p.phone || "").trim() : "",
      attending ? String(p.mailing_address || "").trim() : "",
      attending ? String(p.plus_one || "").trim() : "",
      attending ? String(p.plus_one_name || "").trim() : "",
      attending ? String(p.song || "").trim() : "",
      attending ? String(p.artist || "").trim() : "",
      attending ? String(p.guest_message || "").trim() : ""
    ]);
    writeDashboard_();
  } finally {
    lock.releaseLock();
  }

  return redirect_(next);
}

function ensureSheets_(moveDashboard) {
  var ss = SpreadsheetApp.getActive();
  var rsvp = ss.getSheetByName("RSVPs");
  if (!rsvp) rsvp = ss.insertSheet("RSVPs");
  if (String(rsvp.getRange(1, 1).getValue()) !== "Timestamp") {
    rsvp.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  rsvp.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#3d4a3e")
    .setFontColor("#ffffff");
  rsvp.setFrozenRows(1);
  rsvp.setColumnWidth(1, 180);
  rsvp.setColumnWidth(2, 180);
  rsvp.setColumnWidth(6, 240);
  rsvp.setColumnWidth(11, 240);
  rsvp.getRange("A2:A1000").setNumberFormat("MMM d, yyyy h:mm AM/PM");
  if (!rsvp.getFilter()) {
    rsvp.getRange(1, 1, 1000, HEADERS.length).createFilter();
  }

  var dash = ss.getSheetByName("Dashboard");
  if (!dash) dash = ss.insertSheet("Dashboard");
  writeDashboard_();

  if (moveDashboard && ss.getSheets()[0].getName() !== "Dashboard") {
    ss.setActiveSheet(dash);
    ss.moveActiveSheet(1);
  }

  var stray = ss.getSheetByName("Sheet1");
  if (stray && ss.getSheets().length > 1 && stray.getLastRow() === 0) {
    ss.deleteSheet(stray);
  }
}

function writeDashboard_() {
  var dash = SpreadsheetApp.getActive().getSheetByName("Dashboard");
  var rows = [
    ["Jennifer & James", ""],
    ["Sunday, February 7, 2027", ""],
    ["The Glade Venue, 871 Pine Hill Road, Cairo, GA 39828", ""],
    ["Ceremony 3:30 PM. Reception 4:00-9:00 PM, indoors. RSVPs by December 7, 2026.", ""],
    ["", ""],
    ["Totals", ""],
    ["RSVPs received", ""],
    ["Happily accepts", ""],
    ["Regretfully declines", ""],
    ["Plus ones", ""],
    ["People attending", ""],
    ["Song requests", ""],
    ["Latest RSVP", ""],
    ["People attending counts each acceptance plus each plus one.", ""],
    ["Each row on the RSVPs tab is one submission. Submitting twice adds a second row.", ""],
    ["The site does not send guests a confirmation email.", ""],
    ["", ""],
    ["Names submitted more than once", ""]
  ];

  dash.getRange(1, 1, rows.length, 2).setValues(rows);
  dash.getRange("B7:B13").setFormulas([
    ["=COUNTA(RSVPs!B2:B)"],
    ["=COUNTIF(RSVPs!C2:C,\"Happily Accepts\")"],
    ["=COUNTIF(RSVPs!C2:C,\"Regretfully Declines\")"],
    ["=COUNTIFS(RSVPs!C2:C,\"Happily Accepts\",RSVPs!G2:G,\"Yes\")"],
    ["=B8+B10"],
    ["=COUNTIF(RSVPs!I2:I,\"?*\")"],
    ["=IF(B7=0,\"none\",TEXT(MAX(RSVPs!A2:A),\"MMM d, yyyy, h:mm AM/PM\"))"]
  ]);
  dash.getRange("B19:B40").clearContent();
  dash.getRange("A19").setFormula(
    "=IFERROR(QUERY(RSVPs!B2:B,\"select B, count(B) where B is not null group by B having count(B) > 1 label B 'Name', count(B) 'Times'\",0),\"None\")"
  );
  dash.getRange(1, 1, 4, 1).setFontWeight("bold");
  dash.getRange("A1").setFontSize(18);
  dash.getRange("A6:B6").setFontWeight("bold").setBackground("#3d4a3e").setFontColor("#ffffff");
  dash.getRange("A7:A13").setFontWeight("bold");
  dash.setColumnWidth(1, 280);
  dash.setColumnWidth(2, 220);
  dash.setColumnWidth(4, 460);

  dash.getRange("AA1").setValue("Attendance");
  dash.getRange("AA2:AA3").setValues([["Happily accepts"], ["Regretfully declines"]]);
  dash.getRange("AB2").setFormula("=B8");
  dash.getRange("AB3").setFormula("=B9");
  dash.getRange("AA5").setValue("Plus ones");
  dash.getRange("AA6:AA7").setValues([["Bringing a plus one"], ["No plus one"]]);
  dash.getRange("AB6").setFormula("=B10");
  dash.getRange("AB7").setFormula("=MAX(0,B8-B10)");
  dash.getRange("AA9").setValue("RSVPs by day");
  dash.getRange("AA10").setFormula(
    "=IFERROR(QUERY(RSVPs!A2:A,\"select toDate(A), count(A) where A is not null group by toDate(A) label toDate(A) 'Day', count(A) 'RSVPs'\",0),\"\")"
  );

  var charts = dash.getCharts();
  for (var i = 0; i < charts.length; i++) dash.removeChart(charts[i]);

  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dash.getRange("AA2:AB3"))
    .setPosition(6, 4, 0, 0)
    .setOption("title", "Attendance")
    .setOption("width", 420)
    .setOption("height", 280)
    .setOption("legend", { position: "bottom" })
    .setOption("pieSliceText", "value")
    .build());

  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dash.getRange("AA6:AB7"))
    .setPosition(20, 4, 0, 0)
    .setOption("title", "Plus ones, among accepts")
    .setOption("width", 420)
    .setOption("height", 280)
    .setOption("legend", { position: "bottom" })
    .setOption("pieSliceText", "value")
    .build());

  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(dash.getRange("AA10:AB40"))
    .setPosition(34, 4, 0, 0)
    .setOption("title", "RSVPs by day")
    .setOption("width", 520)
    .setOption("height", 280)
    .setOption("legend", { position: "none" })
    .setOption("hAxis", { title: "Day" })
    .setOption("vAxis", { title: "RSVPs", minValue: 0 })
    .build());

  dash.hideColumns(27, 2);
}

function safeNext_(raw, attending) {
  var fallback = "https://www.pablooffline.com/james-and-jennifer/rsvp-" + (attending ? "yes" : "no") + ".html";
  var value = String(raw || "").split("#")[0];
  var match = value.match(/^(https?:)\/\/([^\/?#]+)(\/[^?#]*)?$/i);
  if (!match) return fallback;
  var host = match[2].toLowerCase().split(":")[0];
  var allowed = {
    "www.pablooffline.com": true,
    "pablooffline.com": true,
    "pabloofflineai.github.io": true,
    "localhost": true,
    "127.0.0.1": true
  };
  if (!allowed[host]) return fallback;
  if (!/\/rsvp-(yes|no)\.html$/i.test(match[3] || "/")) return fallback;
  return value;
}

function redirect_(url) {
  var href = String(url).replace(/"/g, "%22");
  var html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\">"
    + "<meta http-equiv=\"refresh\" content=\"0;url=" + href + "\">"
    + "<script>window.top.location.replace(" + JSON.stringify(url) + ");</script>"
    + "</head><body><p><a href=\"" + href + "\">Continue</a></p></body></html>";
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
