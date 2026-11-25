# Andrew Cottam — Consultancy Website

A single-page, static personal website presenting Andrew Cottam as an independent geospatial and nature-data consultant. Plain HTML/CSS/JS, no build step, no backend, no cookies or trackers.

## 📑 Table of Contents

---

- [Running locally](#running-locally)
- [Deploying](#deploying)
- [Replacing placeholders](#replacing-placeholders)
- [Structure](#structure)
- [Accessibility and SEO](#accessibility-and-seo)

---

## Running locally

No build tools or dependencies are needed — it's plain HTML/CSS/JS. From this folder, serve it with any static file server, e.g.:

```bash
cd andrew-cottam-consultancy
python3 -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## Deploying

### Option A — GitHub Pages (this repo)

This repo (`web_apps`) is already served from the `gh-pages` branch. Once this folder is committed and pushed to `gh-pages`, the site will be live at:

```
https://<your-github-username>.github.io/web_apps/andrew-cottam-consultancy/
```

No further configuration is needed — GitHub Pages serves static files directly.

### Option B — Netlify (standalone, shorter URL)

1. Create a free Netlify account.
2. "Add new site" → "Import an existing project" → connect this GitHub repo.
3. Set the **base directory** to `andrew-cottam-consultancy` and leave the build command empty (publish directory: `andrew-cottam-consultancy` or `.` relative to the base directory).
4. Deploy. Netlify gives you a `*.netlify.app` URL, and you can attach a custom domain for free under Site settings → Domain management.

## Replacing placeholders

- **`public/Andrew_Cottam_CV.pdf`** — the real CV. Keep this filename so the "Download CV" buttons keep working; replace the file whenever the CV is updated.
- **`public/logos/`** — organisation logos (`restor`, `overstory`, `jrc`, `unep-wcmc`, `jncc`), extracted from the CV PDF. Not currently shown (the Experience timeline is text-only); to show a logo, uncomment the matching `<img>` line in `index.html` (look for `<!-- <img src="public/logos/..." ... /> -->` inside `#experience`).
- **`public/headshot.jpg`** — the hero photo, also resized into `public/favicon-16.png` / `favicon-32.png` / `favicon-180.png` for the browser tab icon. Replace `headshot.jpg` and regenerate the favicons with `sips` if the photo changes, e.g. `sips -s format png -z 32 32 public/headshot.jpg --out public/favicon-32.png`.
- **Open Graph preview image (optional)** — for a richer LinkedIn preview, add a 1200×630 image (e.g. `public/og-image.png`) and uncomment the `og:image` meta tag near the top of `index.html`, using the site's full deployed URL.

## Structure

```
andrew-cottam-consultancy/
├── index.html        # all page content
├── styles.css         # design tokens, layout, components
├── main.js            # mobile nav toggle + footer year
├── public/
│   ├── Andrew_Cottam_CV.pdf   # placeholder — replace with real CV
│   ├── favicon.svg
│   └── logos/                 # placeholder — add organisation logos here
└── README.md
```

## Accessibility and SEO

- Semantic landmarks (`header`, `main`, `footer`), a skip-to-content link, and visible focus states.
- Colour palette checked for WCAG AA contrast (charcoal text on off-white/white, white text on the deep forest-green hero).
- `alt` text on all meaningful images; decorative icons are marked `aria-hidden`.
- `<title>`, meta description, and Open Graph tags are set in `index.html` for search engines and LinkedIn link previews.
- System font stack (no external font requests), no analytics, no cookies.
