# Browser Security Audit Tool

A Chrome extension for instant security header auditing and JWT inspection.

## Development

```bash
npm install
npm run dev          # Watch mode — reload extension in chrome://extensions after changes
npm run build        # Production build
npm run test         # Unit tests
npm run test:e2e     # E2E tests (requires built dist/)
npm run package      # Zip for distribution
```

## Load in Chrome

1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked" and select `dist/`

## Tech Stack

- React 18 + TypeScript
- Vite + vite-plugin-web-extension
- Tailwind CSS
- Zustand
- Vitest + Playwright

## Privacy

Zero telemetry. No network requests. All processing is local.
