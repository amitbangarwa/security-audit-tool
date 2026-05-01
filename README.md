<p align="center">
  <img src="public/icons/icon128.png" alt="Browser Security Audit" width="80" />
</p>

<h1 align="center">Browser Security Audit</h1>

<p align="center">
  One-click security header auditing and JWT inspection for any website — right from your browser toolbar.
</p>

<p align="center">
  <a href="../../releases/latest"><img src="https://img.shields.io/github/v/release/amitbangarwa/security-audit-tool?style=flat-square&label=latest%20release" alt="Latest Release"></a>
  <a href="../../actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/amitbangarwa/security-audit-tool/ci.yml?style=flat-square&label=CI" alt="CI Status"></a>
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License">
</p>

---

<!-- TODO: Replace with actual demo GIF
Record a ~10 second GIF showing:
1. Click the extension icon on any website
2. Score ring animates in
3. Scroll through header results
4. Switch to JWT tab

Tools to record:
- macOS: Kap (free, https://getkap.co)
- Any OS: ScreenToGif, LICEcap, or built-in screen recorder + ffmpeg

Save as .github/assets/demo.gif (keep under 5MB), then uncomment the line below:
-->
<!-- <p align="center"><img src=".github/assets/demo.gif" alt="Demo" width="400"></p> -->

## What It Does

Open any website, click the extension icon, and instantly see:

- **Security Score (0–100)** — weighted score across 9 critical HTTP security headers
- **Header Audit** — pass/warn/fail status for each header with fix recommendations
- **JWT Inspector** — finds JWTs in localStorage, sessionStorage, and cookies, decodes them, flags expired tokens and sensitive claims
- **HttpOnly Detection** — surfaces HttpOnly cookie names (values stay protected)

### Headers Audited

| Header | Weight | Why It Matters |
|--------|--------|----------------|
| Content-Security-Policy | 20 | Prevents XSS and injection attacks |
| Strict-Transport-Security | 15 | Forces HTTPS connections |
| X-Content-Type-Options | 10 | Stops MIME-type sniffing |
| X-Frame-Options | 10 | Prevents clickjacking |
| Referrer-Policy | 10 | Controls information leakage |
| Permissions-Policy | 10 | Restricts browser feature access |
| Cross-Origin-Opener-Policy | 10 | Isolates browsing context |
| Cross-Origin-Embedder-Policy | 10 | Enables cross-origin isolation |
| Cross-Origin-Resource-Policy | 5 | Controls cross-origin resource sharing |

<!-- TODO: Add screenshot
Take a screenshot of the popup showing a real audit with a mix of pass/warn/fail results.
Save as .github/assets/screenshot.png, then uncomment:
-->
<!-- <p align="center"><img src=".github/assets/screenshot.png" alt="Audit screenshot" width="360"></p> -->

## Install

### From GitHub Releases (recommended)

1. Download the latest `.zip` from [**Releases**](../../releases/latest)
2. Unzip to a permanent folder
3. Open **chrome://extensions**
4. Enable **Developer Mode** (top-right toggle)
5. Click **Load unpacked** → select the unzipped folder
6. Click the extension icon in your toolbar to audit any page

### From Source

```bash
git clone https://github.com/amitbangarwa/security-audit-tool.git
cd security-audit-tool
npm install
npm run build
```

Then load `dist/` as an unpacked extension (steps 3–6 above).

## Features

- **Zero network requests** — all analysis runs locally in your browser
- **Manifest V3** — modern Chrome extension architecture
- **Dark mode** — follows your system preference
- **Export report** — copy a Markdown audit report to clipboard
- **Privacy-first** — no telemetry, no tracking, no data leaves your machine

## Development

```bash
npm install          # Install dependencies
npm run dev          # Watch mode — auto-rebuilds on file changes
npm run build        # Production build
npm run test         # Unit tests (43 tests)
npm run typecheck    # TypeScript type checking
npm run check        # Biome lint + format
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite + vite-plugin-web-extension |
| Styling | Tailwind CSS |
| State | Zustand |
| Linting | Biome |
| Testing | Vitest + Playwright |

### Project Structure

```
src/
├── background/      # Service worker — intercepts response headers
├── content/         # Content script — scans storage for JWTs
├── popup/           # React popup UI
│   ├── components/  # ScoreRing, HeaderRow, JWTCard, etc.
│   └── store/       # Zustand store
├── lib/             # Business logic (audit, decode, score, export)
├── types/           # Shared TypeScript types
└── constants/       # Header rules and sensitive claim definitions
```

## Releasing

```bash
npm version patch    # Bumps version in package.json + manifest.json
git push origin master --tags
```

Pushing the tag triggers CI which builds, tests, and creates a GitHub Release with the extension zip attached.

## Privacy

**This extension makes zero network requests.** All header analysis and JWT decoding happens entirely in your browser. No data is collected, transmitted, or stored externally.

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes and add tests
4. Open a PR against `master` — CI must pass before merging

## License

[MIT](LICENSE)
