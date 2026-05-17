# safetynet.social — Static Website

Marketing and foundation website for **SafetyNet Foundation** (Stichting SafetyNet, KvK 97663069).  
Hosted on **Cloudflare Pages** from this repository.

## Structure

```
/
├── index.html          # Home
├── safetynet.html      # Project overview
├── team.html           # Team
├── faq.html            # FAQ
├── donate.html         # Donate (SEPA)
├── about.html          # About
├── privacy.html        # Privacy Policy  [noindex]
├── terms.html          # Terms of Use    [noindex]
├── favicon.ico         # Site favicon
├── safetynet-whitepaper.pdf
├── _headers            # Cloudflare Pages: security + cache headers
├── assets/
│   ├── styles.css              # Global stylesheet
│   ├── ecr-qr-donate-5eur-safetynet.png
│   └── img/
│       ├── og-card.jpg         # OG / Twitter card image (1200×630 px) — TODO
│       └── default-profile-pic.png
└── .gitignore
```

## Tech stack

- Vanilla HTML5 + CSS custom properties + one inline JS IIFE (donate page)
- No framework, no build step, no dependencies
- Cloudflare Pages (static hosting) with edge-injected Cloudflare Web Analytics

## Local development

Open any `.html` file directly in a browser — no server required.  
For accurate header testing:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Deployment

Push to `main` → Cloudflare Pages auto-deploys.

**Build settings in Cloudflare Pages:**
- Framework preset: `None`
- Build command: *(empty)*
- Build output directory: `/` (root)

## Assets to keep up to date

| File | Notes |
|---|---|
| `assets/img/og-card.jpg` | 1200×630 px OG card — create before first deploy |
| `assets/ecr-qr-donate-5eur-safetynet.png` | Replace with true PNG at ≥280×280 px |
| `favicon.ico` | Add if not already present |
| `safetynet-whitepaper.pdf` | Add if not already present |

## Licence

© 2025 SafetyNet Foundation. All rights reserved.
