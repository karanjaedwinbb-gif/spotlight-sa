# Spotlight SA – Adelaide Salon Digital Marketing Consultancy

> **Tagline:** "Helping Adelaide beauty salons turn online attention into customer bookings."  
> **Focus:** Independent beauty salons in metropolitan Adelaide (lashes, brows, nails, waxing, and skin treatments).  
> **Repository:** `https://github.com/karanjaedwinbb-gif/spotlight-sa`  
> **GitHub Pages:** `https://karanjaedwinbb-gif.github.io/spotlight-sa/`

---

## 1. Project Overview & File Structure

Spotlight SA is a responsive, multi-page website engineered with clean **HTML5, CSS3, and vanilla JavaScript**. It features the signature **warm cream/tan light mode** (default), a deep charcoal **dark mode**, full **SEO / AEO / GEO** search optimization, and automated **GitHub Actions** deployment to **GitHub Pages**.

```text
├── index.html                  # HOME: Balanced hero, 3 core services, strategic framework, AEO cards
├── about.html                  # ABOUT: Consultancy purpose, Adelaide salon audience, outcome methodology
├── services.html               # SERVICES: Problem, Solution, Benefits, Cybersecurity guide, FAQ accordion
├── growth-check.html           # SALON GROWTH CHECK: Interactive 6-question diagnostic assessment
├── contact.html                # CONTACT: Consultation form with validation and instant mailto: dispatch
├── style.css                   # Main stylesheet: Responsive, dual-theme (Warm Cream & Dark), WCAG AA
├── script.js                   # Vanilla JS: Theme engine, GA4 event tracker, quiz logic, form handler
├── vite.config.ts              # Multi-page build config with /spotlight-sa/ production base path
├── package.json                # Project dependencies and build scripts
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow for automated GitHub Pages publishing
├── public/
│   ├── robots.txt              # Search engine crawler instructions with live sitemap URL
│   ├── sitemap.xml             # Canonical sitemap for all 5 pages
│   └── assets/
│       └── images/             # Local optimized imagery (consultancy, local SEO map, salon interior)
└── README.md                   # Complete operational, deployment, and analytics documentation
```

---

## 2. Key Improvements Implemented

### A. Layout Balance & Typography (No Oversized Text or Wasted Space)
- **Balanced Hero Section:** Refined `.hero-title` font scale to `clamp(1.85rem, 2.75vw, 2.5rem)` with `line-height: 1.2` and intentional column widths (`max-w-xl`), preventing awkward multi-line text sprawl and isolated word wraps.
- **Harmonious Grid Proportions:** Restructured `.hero-grid` to an even `1fr 1fr` split so the consultancy image and headline text have matching visual weight.
- **No Overflow on Mobile/Tablet:** Responsive breakpoints gracefully collapse columns vertically at `992px` and `768px`, ensuring clean mobile reading without horizontal scrolling.

### B. Full Image Coverage (No Letterboxing or Blank Margins)
- **100% Container Coverage:** Applied `width: 100%; height: 100%; object-fit: cover; object-position: center;` to `.hero-image-frame img` and `.split-image-container img`.
- **Adelaide Tablet & Consultation Image:** Configured `.split-image-container` with defined aspect ratios and desktop stretching (`align-items: stretch; height: 100%; min-height: 380px;`). The Adelaide consultation desk photo completely fills its frame from edge to edge without any empty bands or letterboxing.
- **Aspect Ratio Balance:** Hero and split images maintain clean `4:3` proportions on laptop/desktop screens to prevent tall, empty gaps beside text blocks.

### C. Restored Warm Tan / Cream Light Mode (Default)
- **Main Canvas:** `#FAF7F2` (signature warm cream)
- **Alternate Sections & Strips:** `#F4EFEA` (light tan)
- **Cards, Panels & Surfaces:** `#FFFDF9` (soft warm cream surface, avoiding stark hospital-white)
- **Borders & Dividers:** `#E8E0D5` (warm tan border)
- **Text Palette:** `#212523` (charcoal primary) and `#575E59` (muted charcoal)
- **Accent Rose:** `#B86B73` (with hover `#9E555C` and tint `#F5EAEB`)
- **Initial Default:** If a visitor has not explicitly selected a theme, the warm cream light mode is loaded by default.
- **Dark Mode Intact:** Deep charcoal `#121514` with soft rose accents remains fully accessible via the top-right header toggle.

### D. GitHub Pages Base Path & Asset Bundling
- `vite.config.ts` sets `base: command === 'build' ? '/spotlight-sa/' : '/'`.
- In production, all asset references, images, scripts, and stylesheets are bundled and automatically prefixed with `/spotlight-sa/assets/...`.
- In local development (`npm run dev`), the dev server continues to serve from `/` on port 3000.
- Live repository canonical links and sitemap entries point to `https://karanjaedwinbb-gif.github.io/spotlight-sa/`.

### E. GitHub Actions Deployment (`.github/workflows/deploy.yml`)
- Triggered automatically on push to `main` (and via manual `workflow_dispatch`).
- Uses Node.js 20 without forcing `cache: 'npm'` (preventing build errors when `package-lock.json` is absent).
- Executes `npm install --legacy-peer-deps` as required by the lecturer.
- Runs `npm run build` and deploys `./dist` to GitHub Pages using official `actions/deploy-pages@v4`.

---

## 3. How to Deploy to GitHub

### Option 1: Pushing via Git CLI
```bash
git init
git add .
git commit -m "feat: complete Spotlight SA with warm cream theme, balanced layout, and GitHub Pages CI/CD"
git branch -M main
git remote add origin https://github.com/karanjaedwinbb-gif/spotlight-sa.git
git push -u origin main
```

### Option 2: Uploading via GitHub Web UI
1. Export or download the project files.
2. Go to your repository at [https://github.com/karanjaedwinbb-gif/spotlight-sa](https://github.com/karanjaedwinbb-gif/spotlight-sa).
3. Click **Add file** &rarr; **Upload files**.
4. Drag and drop all project files (`index.html`, `about.html`, `services.html`, `growth-check.html`, `contact.html`, `style.css`, `script.js`, `vite.config.ts`, `.github/`, `public/`, etc.).
5. Commit to `main`.
6. Go to **Settings** &rarr; **Pages**, ensure **Source** is set to **GitHub Actions**. The workflow will build and publish the site automatically.

---

## 4. Google Analytics 4 (GA4) Setup & Verification

1. Open `script.js` and locate line 30:
   ```javascript
   const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';
   ```
2. Replace `'G-XXXXXXXXXX'` with your active GA4 Measurement ID (e.g., `'G-3ABC4DEF56'`).
3. Push the change to GitHub.
4. **Verification:**
   - **Realtime Report:** Open Google Analytics 4 &rarr; **Reports** &rarr; **Realtime**. Open the live site in another tab; active users and custom events (`cta_click`, `growth_check_start`, etc.) appear within 15–30 seconds.
   - **Deduplication:** Repeated rapid clicks on the same button or step are automatically filtered to avoid skewed metrics.

---

## 5. Verification Checklist

- [x] Warm cream (`#FAF7F2`) and tan (`#F4EFEA`) light theme is active by default.
- [x] Dark mode toggle functions with zero flash on load.
- [x] Hero headline and copy are appropriately proportioned with no awkward line breaks.
- [x] All images (hero, Adelaide consultation tablet, and salon interior) fill their frames 100% with `object-fit: cover`.
- [x] All five HTML pages are generated and linked.
- [x] Vite production base path configured to `/spotlight-sa/`.
- [x] `.github/workflows/deploy.yml` configured with Node 20, `--legacy-peer-deps`, and no lockfile cache requirement.
- [x] All student/academic prototype disclaimers removed.
- [x] GA4 event tracking, deduplication, and contact form validation tested and working.
