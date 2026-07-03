# Catherine Crump — ALPHA (experimental)

An experimental redesign of [catherine-crump.com](https://beta.catherine-crump.com),
served at **alpha.catherine-crump.com**. Single long-scroll page, evolved
Berkeley-scholarly theme with motion, an animated "data network" hero, a career
timeline, and an interactive publications explorer.

Plain HTML/CSS/JS, no build step.

## Structure
- `index.html` — the whole site (hero, about, timeline, focus, publications, CL60, contact)
- `css/alpha.css` — theme + motion
- `js/alpha.js` — hero canvas, scroll progress, reveal-on-scroll, scrollspy, count-up, mobile nav
- `js/publications-data.js` — the 28-entry `PUBLICATIONS` array (shared shape with beta)
- `js/explorer.js` — interactive publications explorer (search, category/topic filters, year chart, sort)
- `assets/` — headshot, favicon, CL60 logo

## Editing publications
Edit the array in `js/publications-data.js` (same format as the beta site). Topics
are derived automatically from title/venue keywords in `js/explorer.js`.

## Local preview
```bash
python3 -m http.server 8102
```

## Deploy
GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.
Custom domain `alpha.catherine-crump.com` via the `CNAME` file (DNS: CNAME
`alpha` → `homejeopardy.github.io`).
