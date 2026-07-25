# Clover Hill Media

Personal channel dashboard — streaming, live TV, and vibes in one TV-style guide.

**Live:** [https://www.pablooffline.com/clover-hill-media/](https://www.pablooffline.com/clover-hill-media/)

## Features

- **Streaming** — Twitch games, streamers, direct links
- **Live TV** — Roku linear, Pluto, YouTube live news
- **Vibes** — Built-in ambiance presets + your YouTube 24/7 rows
- **Edit channel guide** — Custom tabs, types, order, and 24/7 vs live status
- **Export / Import** — Move your guide between browsers

## Project layout

```
clover-hill-media/
  index.html   # UI shell
  app.js       # Guide logic, filters, live checks
  README.md
```

## Local preview

```bash
git clone https://github.com/SkrimpFisher-spec/pabloofflineai.github.io.git
cd pabloofflineai.github.io/clover-hill-media
npx --yes serve ..
# open http://localhost:3000/clover-hill-media/
```

Use a local HTTP server — `file://` may block localStorage.

## Deploy

This repo is GitHub Pages on `main`. Push changes to publish:

```bash
git add clover-hill-media/
git commit -m "Update Clover Hill Media"
git push origin main
```

Site URL: `https://www.pablooffline.com/clover-hill-media/`

Channel data is stored in the browser (`localStorage` keys still use the legacy `omnistream_` prefix for backward compatibility).

## Optional: YouTube API key

YouTube live status is checked automatically. If checks fail in your browser, add a YouTube Data API v3 key in **Edit channel guide** (stored locally only).
