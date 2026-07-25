# OmniStream Web Hub

A blazing-fast, single-page media dashboard that unifies **Pluto TV**, **Roku**, **YouTube Live**, and **Twitch** streams into one customizable, glassmorphic grid.

**Live demo path:** `https://pabloofflineai.github.io/omnistream/`

## Features

- **Cross-platform aggregation** — Manage streams from Pluto TV, Roku, YouTube, and Twitch in one responsive grid
- **Inline modal player** — Watch embeds without leaving the dashboard (YouTube & Twitch; Pluto/Roku open externally when iframe-blocked)
- **Live status detection** — Twitch channels checked via Helix API (optional Client-ID) or decapi.me fallback; auto-refreshes every 5 minutes
- **Platform filters & search** — Filter by platform or search by title
- **Persistent customization** — Edit, add, delete channels; toggle active/inactive; saved to `localStorage`
- **Export / Import** — Backup and restore your channel config as JSON
- **Twitch quick nav** — Header links to Following and My Games directories

## Tech Stack

| Layer | Choice |
|-------|--------|
| Markup | HTML5 |
| Styling | Tailwind CSS (CDN) + custom glassmorphism CSS |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | `localStorage` |
| Icons | Font Awesome 6 |
| Font | Inter (Google Fonts) |

## File Structure

```
omnistream/
├── index.html   # Layout, modals, Tailwind config
├── app.js       # Grid rendering, live checks, edit/save logic
└── README.md    # This file
```

## Local Development

1. Clone the repo:
   ```bash
   git clone https://github.com/pabloofflineai/pabloofflineai.github.io.git
   cd pabloofflineai.github.io/omnistream
   ```

2. Serve locally (any static server works):
   ```bash
   npx serve .
   # or open index.html directly in a browser
   ```

3. Open `http://localhost:3000` (or file path) and test:
   - Grid renders default channels
   - Click a card → inline player modal
   - Footer **Edit URLs & Channels** → add/modify/save
   - Export JSON → Import JSON round-trip

## Twitch Live Detection (Optional)

For reliable Twitch live checks, register an app at [dev.twitch.tv](https://dev.twitch.tv/console/apps) and paste your **Client-ID** into the Edit modal. Without it, the dashboard falls back to a public status endpoint.

## Deploy to GitHub Pages

1. Commit and push the `omnistream/` folder to your `main` branch
2. GitHub Pages serves from the repo root — access at:
   ```
   https://pabloofflineai.github.io/omnistream/
   ```
3. If using a custom domain via Porkbun, add a CNAME record pointing to `pabloofflineai.github.io` (already configured at repo root)

## Customization Checklist

- [ ] Edit default channels in `app.js` → `DEFAULT_CHANNELS`
- [ ] Add your Twitch Client-ID in Edit mode for live detection
- [ ] Replace thumbnail URLs with your own preview images
- [ ] Export config after setup as a backup

## Browser Support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). Requires JavaScript and `localStorage`.

---

*OmniStream Engine · Configured locally via browser storage*
