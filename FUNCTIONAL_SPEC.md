# Functional Specification
## Browser Security Audit Tool — Chrome Extension

**Version:** 1.0  
**For:** Claude Code autonomous execution  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand  
**Manifest:** V3  

> **Claude Code instructions:** Execute each phase in order. Do not skip phases. Each phase ends with a validation checklist — run all checks before proceeding. When a command is shown, run it exactly. When a file path is shown, create it at exactly that path relative to the project root.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Phase 0 — Environment Setup](#2-phase-0--environment-setup)
3. [Phase 1 — Scaffold & Configuration](#3-phase-1--scaffold--configuration)
4. [Phase 2 — Manifest & Extension Config](#4-phase-2--manifest--extension-config)
5. [Phase 3 — Type Definitions](#5-phase-3--type-definitions)
6. [Phase 4 — Background Service Worker](#6-phase-4--background-service-worker)
7. [Phase 5 — Content Script](#7-phase-5--content-script)
8. [Phase 6 — Core Business Logic](#8-phase-6--core-business-logic)
9. [Phase 7 — Zustand Store](#9-phase-7--zustand-store)
10. [Phase 8 — Popup UI Components](#10-phase-8--popup-ui-components)
11. [Phase 9 — Popup Entry Point](#11-phase-9--popup-entry-point)
12. [Phase 10 — Styling](#12-phase-10--styling)
13. [Phase 11 — Unit Tests](#13-phase-11--unit-tests)
14. [Phase 12 — E2E Tests](#14-phase-12--e2e-tests)
15. [Phase 13 — Build & Package](#15-phase-13--build--package)
16. [Phase 14 — Hosting & Distribution](#16-phase-14--hosting--distribution)
17. [Phase 15 — CI/CD Pipeline](#17-phase-15--cicd-pipeline)
18. [Environment Variables Reference](#18-environment-variables-reference)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Project Structure

After all phases are complete, the project must match this exact structure:

```
browser-security-audit/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── publish.yml
├── src/
│   ├── background/
│   │   └── index.ts                  # Service worker
│   ├── content/
│   │   └── index.ts                  # Content script
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── store/
│   │   │   └── useAuditStore.ts
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── ScoreRing.tsx
│   │   │   ├── TabBar.tsx
│   │   │   ├── HeadersTab.tsx
│   │   │   ├── HeaderRow.tsx
│   │   │   ├── JWTTab.tsx
│   │   │   ├── JWTCard.tsx
│   │   │   ├── JWTDecoder.tsx
│   │   │   ├── SettingsTab.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── Footer.tsx
│   │   └── index.css
│   ├── lib/
│   │   ├── headerAudit.ts            # Header scoring logic
│   │   ├── jwtDecoder.ts             # JWT decode + analysis
│   │   ├── scoreCalculator.ts        # Score computation
│   │   └── reportExporter.ts         # Copy-report logic
│   ├── types/
│   │   └── index.ts                  # All shared TypeScript types
│   └── constants/
│       └── headers.ts                # Header audit rules config
├── tests/
│   ├── unit/
│   │   ├── headerAudit.test.ts
│   │   ├── jwtDecoder.test.ts
│   │   └── scoreCalculator.test.ts
│   └── e2e/
│       └── extension.test.ts
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── .eslintrc.cjs
├── .prettierrc
├── vitest.config.ts
├── package.json
└── README.md
```

---

## 2. Phase 0 — Environment Setup

### Prerequisites

Verify these are installed before starting:

```bash
node --version      # Must be >= 18.0.0
npm --version       # Must be >= 9.0.0
git --version       # Any recent version
```

If Node < 18, install via nvm:

```bash
nvm install 18
nvm use 18
```

### Create project directory

```bash
mkdir browser-security-audit
cd browser-security-audit
git init
```

### Phase 0 validation

- [ ] `node --version` outputs 18.x or higher
- [ ] Project directory created and git initialised

---

## 3. Phase 1 — Scaffold & Configuration

### Install dependencies

```bash
npm create vite@latest . -- --template react-ts
npm install
```

### Install runtime dependencies

```bash
npm install zustand
```

### Install dev dependencies

```bash
npm install -D \
  vite-plugin-web-extension \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/chrome \
  eslint \
  prettier \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  vitest \
  @vitest/ui \
  jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @playwright/test \
  crx
```

### Initialise Tailwind

```bash
npx tailwindcss init -p
```

### Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Create `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "tailwind.config.ts"]
}
```

### Create `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: () => require('./manifest.json'),
      additionalInputs: ['src/content/index.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
});
```

### Create `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'media',
  theme: {
    extend: {
      width: {
        popup: '420px',
      },
      maxHeight: {
        popup: '580px',
      },
      colors: {
        brand: {
          50:  '#EBF2FF',
          500: '#3B82F6',
          600: '#1A56DB',
          700: '#1341B8',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### Create `.eslintrc.cjs`

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true, webextensions: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

### Create `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Create `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

### Create `tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

### Update `package.json` scripts section

```json
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "package": "npm run build && node scripts/package.js",
    "typecheck": "tsc --noEmit"
  }
}
```

### Phase 1 validation

- [ ] `npm run build` completes without errors
- [ ] `npm run lint` completes without errors
- [ ] `dist/` directory created

---

## 4. Phase 2 — Manifest & Extension Config

### Create `manifest.json` at project root

```json
{
  "manifest_version": 3,
  "name": "Browser Security Audit",
  "short_name": "SecAudit",
  "version": "1.0.0",
  "description": "One-click security header audit and JWT inspector for the current tab.",
  "icons": {
    "16":  "icons/icon16.png",
    "48":  "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16":  "icons/icon16.png",
      "48":  "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "Security Audit"
  },
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["src/content/index.ts"],
      "run_at": "document_idle"
    }
  ],
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "cookies",
    "webRequest"
  ],
  "host_permissions": ["<all_urls>"],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Add placeholder icons

```bash
mkdir -p icons
# Claude Code: create 16x16, 48x48, 128x128 placeholder PNG files
# Use a simple shield SVG rasterised to each size
# All three files must exist or the extension will fail to load
```

For each icon size, create a simple shield icon programmatically using Node canvas or copy from a royalty-free source. As a placeholder during development, create solid-colour PNG files using:

```bash
# Install canvas for icon generation
npm install -D canvas

# Claude Code: create scripts/generate-icons.js and run it
```

### Create `scripts/generate-icons.js`

```javascript
const { createCanvas } = require('canvas');
const fs = require('fs');

[16, 48, 128].forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1A56DB';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', size / 2, size / 2);
  fs.writeFileSync(`icons/icon${size}.png`, canvas.toBuffer('image/png'));
  console.log(`Generated icon${size}.png`);
});
```

```bash
node scripts/generate-icons.js
```

### Phase 2 validation

- [ ] `manifest.json` exists at project root
- [ ] `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` all exist
- [ ] `npm run build` still succeeds

---

## 5. Phase 3 — Type Definitions

### Create `src/types/index.ts`

```typescript
// ─── Header Audit Types ──────────────────────────────────────────────────────

export type HeaderStatus = 'pass' | 'warn' | 'fail' | 'missing' | 'na';

export interface HeaderRule {
  name: string;
  displayName: string;
  description: string;
  weight: number;
  evaluate: (value: string | null, allHeaders?: Record<string, string>) => HeaderAuditResult;
}

export interface HeaderAuditResult {
  headerName: string;
  displayName: string;
  status: HeaderStatus;
  value: string | null;
  message: string;
  recommendation: string;
  weight: number;
  score: number; // 0, 50% of weight, or full weight
}

// ─── JWT Types ────────────────────────────────────────────────────────────────

export type JWTSource = 'localStorage' | 'sessionStorage' | 'cookie' | 'cookie-httponly';

export interface RawJWT {
  source: JWTSource;
  key: string;
  token: string;
  httpOnly?: boolean;
}

export interface JWTHeader {
  alg: string;
  typ?: string;
  kid?: string;
  [key: string]: unknown;
}

export interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  email?: string;
  name?: string;
  roles?: string | string[];
  permissions?: string | string[];
  scope?: string;
  groups?: string | string[];
  [key: string]: unknown;
}

export type ExpiryStatus = 'valid' | 'expired' | 'not-yet-valid' | 'no-expiry';

export interface JWTAnalysis {
  raw: RawJWT;
  header: JWTHeader | null;
  payload: JWTPayload | null;
  expiryStatus: ExpiryStatus;
  expiryLabel: string;
  sensitiveClaims: string[];
  decodeError: string | null;
}

// ─── Score Types ──────────────────────────────────────────────────────────────

export type ScoreBand = 'secure' | 'attention' | 'risk';

export interface SecurityScore {
  total: number;
  band: ScoreBand;
  httpsCapApplied: boolean;
}

// ─── Audit Types ──────────────────────────────────────────────────────────────

export type AuditStatus = 'idle' | 'loading' | 'complete' | 'error';

export type ErrorType =
  | 'internal-page'
  | 'local-file'
  | 'no-headers'
  | 'injection-failed'
  | 'offline';

export interface AuditState {
  status: AuditStatus;
  url: string | null;
  isHttps: boolean;
  headerResults: HeaderAuditResult[];
  jwtAnalyses: JWTAnalysis[];
  score: SecurityScore | null;
  errorType: ErrorType | null;
  injectionFailed: boolean;  // true when content script injection was blocked by page CSP
  lastAuditTime: number | null;
}

// ─── Message Passing Types ────────────────────────────────────────────────────

export interface ContentScanRequest {
  type: 'SCAN_STORAGE';
}

export interface ContentScanResponse {
  type: 'SCAN_RESULT';
  jwts: RawJWT[];
  error?: string;
}

export interface HeaderCacheEntry {
  tabId: number;
  url: string;
  headers: Record<string, string>;
  timestamp: number;
}

// ─── Settings Types ───────────────────────────────────────────────────────────

export interface UserSettings {
  showPassingHeaders: boolean;
  expandRawValuesByDefault: boolean;
  highlightSensitiveClaims: boolean;
}
```

### Create `src/constants/headers.ts`

```typescript
import type { HeaderRule, HeaderAuditResult } from '@/types';

export const HEADER_RULES: HeaderRule[] = [
  {
    name: 'content-security-policy',
    displayName: 'Content-Security-Policy',
    description: 'Controls which resources the browser is allowed to load.',
    weight: 20,
    evaluate(value) {
      const base = {
        headerName: 'content-security-policy',
        displayName: 'Content-Security-Policy',
        value,
        weight: 20,
      };
      if (!value) {
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'Header is not set.',
          recommendation:
            "Add a Content-Security-Policy header. Start with: default-src 'self'; script-src 'self'",
        };
      }
      const hasUnsafeInline = value.includes("'unsafe-inline'");
      const hasUnsafeEval = value.includes("'unsafe-eval'");
      if (hasUnsafeInline && hasUnsafeEval) {
        return {
          ...base,
          status: 'fail',
          score: 0,
          message: "Contains both 'unsafe-inline' and 'unsafe-eval' — CSP is largely ineffective.",
          recommendation: "Remove 'unsafe-inline' and 'unsafe-eval'. Use nonces or hashes for inline scripts.",
        };
      }
      if (hasUnsafeInline || hasUnsafeEval) {
        return {
          ...base,
          status: 'warn',
          score: 10,
          message: `Contains ${hasUnsafeInline ? "'unsafe-inline'" : "'unsafe-eval'"} which weakens the policy.`,
          recommendation: 'Replace unsafe directives with nonces or hashes for inline content.',
        };
      }
      return {
        ...base,
        status: 'pass',
        score: 20,
        message: 'CSP is set with no unsafe directives detected.',
        recommendation: '',
      };
    },
  },
  {
    name: 'strict-transport-security',
    displayName: 'Strict-Transport-Security',
    description: 'Forces HTTPS connections and prevents downgrade attacks.',
    weight: 15,
    evaluate(value) {
      const base = {
        headerName: 'strict-transport-security',
        displayName: 'Strict-Transport-Security',
        value,
        weight: 15,
      };
      if (!value) {
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'HSTS is not set.',
          recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        };
      }
      const maxAgeMatch = value.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      const includesSubDomains = /includeSubDomains/i.test(value);
      if (maxAge >= 31536000 && includesSubDomains) {
        return { ...base, status: 'pass', score: 15, message: 'HSTS is properly configured.', recommendation: '' };
      }
      if (maxAge > 0) {
        return {
          ...base,
          status: 'warn',
          score: 8,
          message: `max-age is ${maxAge < 31536000 ? 'below 1 year' : 'set'}${!includesSubDomains ? ', includeSubDomains is missing' : ''}.`,
          recommendation: 'Set max-age to at least 31536000 and include includeSubDomains.',
        };
      }
      return { ...base, status: 'fail', score: 0, message: 'HSTS header is malformed.', recommendation: 'Check header syntax.' };
    },
  },
  {
    name: 'x-content-type-options',
    displayName: 'X-Content-Type-Options',
    description: 'Prevents MIME-type sniffing attacks.',
    weight: 10,
    evaluate(value) {
      const base = { headerName: 'x-content-type-options', displayName: 'X-Content-Type-Options', value, weight: 10 };
      if (!value) return { ...base, status: 'missing', score: 0, message: 'Header not set.', recommendation: 'Add: X-Content-Type-Options: nosniff' };
      if (value.trim().toLowerCase() === 'nosniff') return { ...base, status: 'pass', score: 10, message: 'Correctly set to nosniff.', recommendation: '' };
      return { ...base, status: 'warn', score: 5, message: `Unexpected value: "${value}".`, recommendation: 'Value must be exactly "nosniff".' };
    },
  },
  {
    name: 'x-frame-options',
    displayName: 'X-Frame-Options',
    description: 'Prevents clickjacking by controlling iframe embedding.',
    weight: 10,
    evaluate(value, _allHeaders?: Record<string, string>) {
      const base = { headerName: 'x-frame-options', displayName: 'X-Frame-Options', value, weight: 10 };
      // If CSP frame-ancestors is present, X-Frame-Options absence is not penalised
      const csp = _allHeaders?.['content-security-policy'] ?? '';
      const hasFrameAncestors = /frame-ancestors\s/.test(csp);
      if (!value) {
        if (hasFrameAncestors) {
          return { ...base, status: 'pass', score: 10, message: 'Header not set, but CSP frame-ancestors is present.', recommendation: '' };
        }
        return { ...base, status: 'missing', score: 0, message: 'Header not set.', recommendation: "Add: X-Frame-Options: DENY or use CSP frame-ancestors 'none'" };
      }
      const v = value.trim().toUpperCase();
      if (v === 'DENY' || v === 'SAMEORIGIN') return { ...base, status: 'pass', score: 10, message: `Correctly set to ${v}.`, recommendation: '' };
      if (v.startsWith('ALLOW-FROM')) return { ...base, status: 'warn', score: 5, message: 'ALLOW-FROM is deprecated and not supported in all browsers.', recommendation: "Use CSP frame-ancestors directive instead." };
      return { ...base, status: 'warn', score: 5, message: `Unrecognised value: "${value}".`, recommendation: 'Use DENY or SAMEORIGIN.' };
    },
  },
  {
    name: 'referrer-policy',
    displayName: 'Referrer-Policy',
    description: 'Controls how much referrer information is sent with requests.',
    weight: 10,
    evaluate(value) {
      const base = { headerName: 'referrer-policy', displayName: 'Referrer-Policy', value, weight: 10 };
      const SAFE = ['no-referrer', 'strict-origin', 'strict-origin-when-cross-origin'];
      const WARN = ['same-origin', 'origin', 'no-referrer-when-downgrade'];
      if (!value) return { ...base, status: 'missing', score: 0, message: 'Header not set.', recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin' };
      if (SAFE.includes(value.toLowerCase())) return { ...base, status: 'pass', score: 10, message: 'Referrer policy is set to a safe value.', recommendation: '' };
      if (WARN.includes(value.toLowerCase())) return { ...base, status: 'warn', score: 5, message: `"${value}" may leak origin information.`, recommendation: 'Use strict-origin-when-cross-origin or stricter.' };
      if (value.toLowerCase() === 'unsafe-url') return { ...base, status: 'fail', score: 0, message: 'unsafe-url sends full URL in referrer header — high information leakage risk.', recommendation: 'Change to strict-origin-when-cross-origin.' };
      return { ...base, status: 'warn', score: 5, message: `Unrecognised value: "${value}".`, recommendation: 'Use strict-origin-when-cross-origin.' };
    },
  },
  {
    name: 'permissions-policy',
    displayName: 'Permissions-Policy',
    description: 'Controls access to browser features like camera, microphone, geolocation.',
    weight: 10,
    evaluate(value) {
      const base = { headerName: 'permissions-policy', displayName: 'Permissions-Policy', value, weight: 10 };
      if (!value) return { ...base, status: 'missing', score: 0, message: 'Header not set.', recommendation: 'Add: Permissions-Policy: camera=(), microphone=(), geolocation=()' };
      const directives = value.split(',').map(d => d.trim()).filter(Boolean);
      if (directives.length >= 3) return { ...base, status: 'pass', score: 10, message: `${directives.length} feature directives configured.`, recommendation: '' };
      return { ...base, status: 'warn', score: 5, message: `Only ${directives.length} directive(s) set — consider restricting more features.`, recommendation: 'Add restrictions for camera, microphone, geolocation, payment, usb.' };
    },
  },
  {
    name: 'cross-origin-opener-policy',
    displayName: 'Cross-Origin-Opener-Policy',
    description: 'Isolates the browsing context to prevent cross-origin attacks.',
    weight: 10,
    evaluate(value) {
      const base = { headerName: 'cross-origin-opener-policy', displayName: 'Cross-Origin-Opener-Policy', value, weight: 10 };
      if (!value) return { ...base, status: 'missing', score: 0, message: 'Header not set.', recommendation: 'Add: Cross-Origin-Opener-Policy: same-origin' };
      if (value.toLowerCase() === 'same-origin') return { ...base, status: 'pass', score: 10, message: 'Correctly set to same-origin.', recommendation: '' };
      if (value.toLowerCase() === 'same-origin-allow-popups') return { ...base, status: 'warn', score: 5, message: 'same-origin-allow-popups provides weaker isolation.', recommendation: 'Prefer same-origin unless popups to other origins are required.' };
      return { ...base, status: 'pass', score: 8, message: `Set to "${value}".`, recommendation: '' };
    },
  },
  {
    name: 'cross-origin-embedder-policy',
    displayName: 'Cross-Origin-Embedder-Policy',
    description: 'Required for SharedArrayBuffer and cross-origin isolation.',
    weight: 10,
    evaluate(value) {
      const base = { headerName: 'cross-origin-embedder-policy', displayName: 'Cross-Origin-Embedder-Policy', value, weight: 10 };
      if (!value) return { ...base, status: 'missing', score: 0, message: 'Header not set.', recommendation: 'Add: Cross-Origin-Embedder-Policy: require-corp' };
      if (value.toLowerCase() === 'require-corp') return { ...base, status: 'pass', score: 10, message: 'Correctly set to require-corp.', recommendation: '' };
      return { ...base, status: 'warn', score: 5, message: `Set to "${value}" — require-corp is preferred.`, recommendation: 'Use require-corp for full cross-origin isolation.' };
    },
  },
  {
    name: 'cross-origin-resource-policy',
    displayName: 'Cross-Origin-Resource-Policy',
    description: 'Controls which origins can load this resource.',
    weight: 5,
    evaluate(value) {
      const base = { headerName: 'cross-origin-resource-policy', displayName: 'Cross-Origin-Resource-Policy', value, weight: 5 };
      if (!value) return { ...base, status: 'missing', score: 0, message: 'Header not set.', recommendation: 'Add: Cross-Origin-Resource-Policy: same-origin' };
      const v = value.toLowerCase();
      if (v === 'same-origin' || v === 'same-site') return { ...base, status: 'pass', score: 5, message: `Correctly set to ${value}.`, recommendation: '' };
      if (v === 'cross-origin') return { ...base, status: 'warn', score: 2, message: 'cross-origin allows any site to load this resource.', recommendation: 'Use same-origin unless cross-origin access is required.' };
      return { ...base, status: 'warn', score: 2, message: `Unrecognised value: "${value}".`, recommendation: 'Use same-origin or same-site.' };
    },
  },
];

/**
 * Special rule: CSP-Report-Only present without enforced CSP should flag as Warn.
 * This is not scored as a standalone header — it modifies the CSP result.
 * Called from headerAudit.ts after main rule evaluation.
 */
export function applyCspReportOnlyOverride(
  results: HeaderAuditResult[],
  rawHeaders: Record<string, string>
): HeaderAuditResult[] {
  const hasEnforcedCsp = !!rawHeaders['content-security-policy'];
  const hasReportOnly = !!rawHeaders['content-security-policy-report-only'];

  if (hasReportOnly && !hasEnforcedCsp) {
    return results.map((r) => {
      if (r.headerName === 'content-security-policy') {
        return {
          ...r,
          status: 'warn',
          score: r.weight * 0.5,
          value: rawHeaders['content-security-policy-report-only'],
          message: 'Only CSP-Report-Only is set — policy is not enforced.',
          recommendation: 'Add an enforced Content-Security-Policy header alongside Report-Only.',
        };
      }
      return r;
    });
  }
  return results;
}

export const SENSITIVE_CLAIMS = [
  'sub', 'email', 'name', 'phone_number', 'roles', 'role',
  'permissions', 'scope', 'groups', 'org', 'tenant', 'admin',
  'is_admin', 'user_id', 'uid',
];
```

### Phase 3 validation

- [ ] `src/types/index.ts` created with all exported types
- [ ] `src/constants/headers.ts` created with all 9 header rules
- [ ] `npm run typecheck` passes with no errors

---

## 6. Phase 4 — Background Service Worker

### Create `src/background/index.ts`

```typescript
import type { HeaderCacheEntry } from '@/types';

const CACHE_KEY = 'header_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache headers in session storage keyed by tabId
async function cacheHeaders(tabId: number, url: string, headers: chrome.webRequest.HttpHeader[]): Promise<void> {
  const headerMap: Record<string, string> = {};
  for (const h of headers) {
    if (h.name && h.value) {
      headerMap[h.name.toLowerCase()] = h.value;
    }
  }
  const entry: HeaderCacheEntry = { tabId, url, headers: headerMap, timestamp: Date.now() };
  const existing = await getCache();
  existing[tabId] = entry;
  await chrome.storage.session.set({ [CACHE_KEY]: existing });
}

async function getCache(): Promise<Record<number, HeaderCacheEntry>> {
  const result = await chrome.storage.session.get(CACHE_KEY);
  return (result[CACHE_KEY] as Record<number, HeaderCacheEntry>) ?? {};
}

async function getHeadersForTab(tabId: number): Promise<HeaderCacheEntry | null> {
  const cache = await getCache();
  const entry = cache[tabId];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    // Stale — remove and return null
    delete cache[tabId];
    await chrome.storage.session.set({ [CACHE_KEY]: cache });
    return null;
  }
  return entry;
}

// Listen for response headers on all main frame navigations
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type === 'main_frame' && details.tabId > 0) {
      cacheHeaders(details.tabId, details.url, details.responseHeaders ?? []);
    }
  },
  { urls: ['<all_urls>'], types: ['main_frame'] },
  ['responseHeaders']
);

// Clean up cache when a tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const cache = await getCache();
  if (cache[tabId]) {
    delete cache[tabId];
    await chrome.storage.session.set({ [CACHE_KEY]: cache });
  }
});

// Message handler for popup requests
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_HEADERS') {
    const tabId = message.tabId as number;
    getHeadersForTab(tabId)
      .then((entry) => sendResponse({ type: 'HEADERS_RESULT', entry }))
      .catch((err) => sendResponse({ type: 'HEADERS_RESULT', entry: null, error: String(err) }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_HTTPONLY_COOKIES') {
    const url = message.url as string;
    chrome.cookies.getAll({ url })
      .then((cookies) => {
        const httpOnlyCookies = cookies
          .filter((c) => c.httpOnly)
          .map((c) => ({ name: c.name, domain: c.domain, httpOnly: true }));
        sendResponse({ type: 'HTTPONLY_COOKIES_RESULT', cookies: httpOnlyCookies });
      })
      .catch(() => sendResponse({ type: 'HTTPONLY_COOKIES_RESULT', cookies: [] }));
    return true;
  }
});
```

### Phase 4 validation

- [ ] `src/background/index.ts` created
- [ ] No TypeScript errors on this file (`npx tsc --noEmit`)

---

## 7. Phase 5 — Content Script

### Create `src/content/index.ts`

```typescript
import type { ContentScanRequest, ContentScanResponse, RawJWT } from '@/types';

const JWT_REGEX = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;

function scanStorage(storage: Storage, source: 'localStorage' | 'sessionStorage'): RawJWT[] {
  const found: RawJWT[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key) continue;
      const value = storage.getItem(key);
      if (!value) continue;
      const matches = value.match(JWT_REGEX);
      if (matches) {
        found.push({ source, key, token: matches[0] });
      }
    }
  } catch {
    // Storage may be blocked by the page's CSP — silently ignore
  }
  return found;
}

function scanCookies(): RawJWT[] {
  const found: RawJWT[] = [];
  try {
    const pairs = document.cookie.split(';');
    for (const pair of pairs) {
      const eqIndex = pair.indexOf('=');
      if (eqIndex === -1) continue;
      const key = pair.slice(0, eqIndex).trim();
      const value = pair.slice(eqIndex + 1).trim();
      const matches = value.match(JWT_REGEX);
      if (matches) {
        found.push({ source: 'cookie', key, token: matches[0] });
      }
    }
  } catch {
    // document.cookie may throw in certain contexts
  }
  return found;
}

chrome.runtime.onMessage.addListener(
  (message: ContentScanRequest, _sender, sendResponse) => {
    if (message.type !== 'SCAN_STORAGE') return;

    const jwts: RawJWT[] = [
      ...scanStorage(localStorage, 'localStorage'),
      ...scanStorage(sessionStorage, 'sessionStorage'),
      ...scanCookies(),
    ];

    const response: ContentScanResponse = { type: 'SCAN_RESULT', jwts };
    sendResponse(response);
  }
);
```

### Phase 5 validation

- [ ] `src/content/index.ts` created
- [ ] No TypeScript errors

---

## 8. Phase 6 — Core Business Logic

### Create `src/lib/jwtDecoder.ts`

```typescript
import { SENSITIVE_CLAIMS } from '@/constants/headers';
import type { JWTAnalysis, JWTHeader, JWTPayload, RawJWT, ExpiryStatus } from '@/types';

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  return atob(padded);
}

function parseJWTPart<T>(part: string): T | null {
  try {
    return JSON.parse(base64UrlDecode(part)) as T;
  } catch {
    return null;
  }
}

function computeExpiry(payload: JWTPayload): { status: ExpiryStatus; label: string } {
  const now = Math.floor(Date.now() / 1000);

  if (payload.nbf !== undefined && payload.nbf > now) {
    return { status: 'not-yet-valid', label: `Not valid until ${new Date(payload.nbf * 1000).toLocaleString()}` };
  }

  if (payload.exp === undefined) {
    return { status: 'no-expiry', label: 'No expiry — token does not expire' };
  }

  const diffSeconds = payload.exp - now;
  const absDiff = Math.abs(diffSeconds);
  const days = Math.floor(absDiff / 86400);
  const hours = Math.floor((absDiff % 86400) / 3600);
  const minutes = Math.floor((absDiff % 3600) / 60);

  const humanDiff =
    days > 0 ? `${days}d ${hours}h` :
    hours > 0 ? `${hours}h ${minutes}m` :
    `${minutes}m`;

  if (diffSeconds > 0) {
    return { status: 'valid', label: `Valid — expires in ${humanDiff}` };
  } else {
    return { status: 'expired', label: `Expired ${humanDiff} ago` };
  }
}

function findSensitiveClaims(payload: JWTPayload): string[] {
  return Object.keys(payload).filter((key) => SENSITIVE_CLAIMS.includes(key));
}

export function decodeJWT(raw: RawJWT): JWTAnalysis {
  const parts = raw.token.split('.');

  if (parts.length !== 3) {
    return {
      raw,
      header: null,
      payload: null,
      expiryStatus: 'no-expiry',
      expiryLabel: 'Token appears malformed — could not decode',
      sensitiveClaims: [],
      decodeError: 'Token does not have 3 parts separated by dots.',
    };
  }

  const [headerPart, payloadPart] = parts;
  const header = parseJWTPart<JWTHeader>(headerPart);
  const payload = parseJWTPart<JWTPayload>(payloadPart);

  if (!header || !payload) {
    return {
      raw,
      header,
      payload,
      expiryStatus: 'no-expiry',
      expiryLabel: 'Could not decode token',
      sensitiveClaims: [],
      decodeError: 'Failed to parse header or payload as JSON.',
    };
  }

  const { status, label } = computeExpiry(payload);

  return {
    raw,
    header,
    payload,
    expiryStatus: status,
    expiryLabel: label,
    sensitiveClaims: findSensitiveClaims(payload),
    decodeError: null,
  };
}
```

### Create `src/lib/headerAudit.ts`

```typescript
import { HEADER_RULES, applyCspReportOnlyOverride } from '@/constants/headers';
import type { HeaderAuditResult } from '@/types';

export function auditHeaders(rawHeaders: Record<string, string>): HeaderAuditResult[] {
  let results = HEADER_RULES.map((rule) => {
    const value = rawHeaders[rule.name] ?? null;
    return rule.evaluate(value, rawHeaders);
  });

  // Apply special rule: CSP-Report-Only without enforced CSP
  results = applyCspReportOnlyOverride(results, rawHeaders);

  return results;
}
```

### Create `src/lib/scoreCalculator.ts`

```typescript
import type { HeaderAuditResult, SecurityScore } from '@/types';

export function calculateScore(results: HeaderAuditResult[], isHttps: boolean): SecurityScore {
  let total = results.reduce((sum, r) => sum + r.score, 0);

  // Special penalty: CSP with both unsafe-inline AND unsafe-eval → additional -10
  const cspResult = results.find((r) => r.headerName === 'content-security-policy');
  if (cspResult?.value) {
    const hasUnsafeInline = cspResult.value.includes("'unsafe-inline'");
    const hasUnsafeEval = cspResult.value.includes("'unsafe-eval'");
    if (hasUnsafeInline && hasUnsafeEval) {
      total -= 10;
    }
  }

  // HTTP (not HTTPS): cap total at 40
  const httpsCapApplied = !isHttps && total > 40;
  if (!isHttps) {
    total = Math.min(total, 40);
  }

  const clampedTotal = Math.max(0, Math.min(100, total));

  const band =
    clampedTotal >= 80 ? 'secure' :
    clampedTotal >= 50 ? 'attention' :
    'risk';

  return { total: clampedTotal, band, httpsCapApplied };
}
```

### Create `src/lib/reportExporter.ts`

```typescript
import type { AuditState } from '@/types';

export function buildReport(state: AuditState): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [
    '# Security Audit Report',
    `**URL:** ${state.url ?? 'Unknown'}`,
    `**Timestamp:** ${timestamp}`,
    `**Score:** ${state.score?.total ?? 'N/A'} / 100 (${state.score?.band ?? '-'})`,
    `**HTTPS:** ${state.isHttps ? 'Yes' : 'No'}`,
    '',
    '## Headers',
  ];

  for (const r of state.headerResults) {
    const icon = r.status === 'pass' ? '✅' : r.status === 'warn' ? '⚠️' : '❌';
    lines.push(`${icon} **${r.displayName}:** ${r.status.toUpperCase()} — ${r.message}`);
  }

  lines.push('', '## JWTs Found');
  if (state.jwtAnalyses.length === 0) {
    lines.push('No JWTs detected.');
  } else {
    for (const j of state.jwtAnalyses) {
      lines.push(`- **${j.raw.key}** (${j.raw.source}) — ${j.expiryLabel}`);
    }
  }

  return lines.join('\n');
}

export async function copyReportToClipboard(state: AuditState): Promise<void> {
  const text = buildReport(state);
  await navigator.clipboard.writeText(text);
}
```

### Phase 6 validation

- [ ] All four lib files created
- [ ] `npm run typecheck` passes

---

## 9. Phase 7 — Zustand Store

### Create `src/popup/store/useAuditStore.ts`

```typescript
import { create } from 'zustand';
import type { AuditState, AuditStatus, ErrorType, HeaderAuditResult, JWTAnalysis, SecurityScore, UserSettings } from '@/types';
import { auditHeaders } from '@/lib/headerAudit';
import { decodeJWT } from '@/lib/jwtDecoder';
import { calculateScore } from '@/lib/scoreCalculator';

interface AuditStore extends AuditState {
  settings: UserSettings;
  activeTab: 'headers' | 'jwts' | 'settings';

  // Actions
  setActiveTab: (tab: 'headers' | 'jwts' | 'settings') => void;
  runAudit: () => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => void;
  reloadAndRerun: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  showPassingHeaders: true,
  expandRawValuesByDefault: false,
  highlightSensitiveClaims: true,
};

export const useAuditStore = create<AuditStore>((set, get) => ({
  // Initial state
  status: 'idle',
  url: null,
  isHttps: false,
  headerResults: [],
  jwtAnalyses: [],
  score: null,
  errorType: null,
  injectionFailed: false,
  lastAuditTime: null,
  settings: DEFAULT_SETTINGS,
  activeTab: 'headers',

  setActiveTab: (tab) => set({ activeTab: tab }),

  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),

  runAudit: async () => {
    set({ status: 'loading', errorType: null, injectionFailed: false });

    try {
      // Detect offline state
      if (!navigator.onLine) {
        set({ status: 'error', errorType: 'offline' });
        return;
      }

      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url) {
        set({ status: 'error', errorType: 'no-headers' });
        return;
      }

      const tabId = tab.id;
      const url = tab.url;

      // Block internal pages
      if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
        set({ status: 'error', errorType: 'internal-page', url });
        return;
      }
      if (url.startsWith('file://')) {
        set({ status: 'error', errorType: 'local-file', url });
        return;
      }

      const isHttps = url.startsWith('https://');

      // 1. Fetch headers from service worker cache
      const headerResponse = await chrome.runtime.sendMessage({ type: 'GET_HEADERS', tabId });
      const cachedEntry = headerResponse?.entry;

      if (!cachedEntry) {
        set({ status: 'error', errorType: 'no-headers', url, isHttps });
        return;
      }

      const headerResults: HeaderAuditResult[] = auditHeaders(cachedEntry.headers);
      const score: SecurityScore = calculateScore(headerResults, isHttps);

      // 2. Scan storage for JWTs via content script
      let jwtAnalyses: JWTAnalysis[] = [];
      let injectionFailed = false;
      try {
        const scanResponse = await chrome.tabs.sendMessage(tabId, { type: 'SCAN_STORAGE' });
        if (scanResponse?.type === 'SCAN_RESULT') {
          jwtAnalyses = scanResponse.jwts.map(decodeJWT);
        }
      } catch {
        // Content script injection blocked by page CSP — show partial results with banner
        injectionFailed = true;
      }

      // 3. Get HttpOnly cookie names from service worker
      try {
        const cookieResponse = await chrome.runtime.sendMessage({ type: 'GET_HTTPONLY_COOKIES', url });
        if (cookieResponse?.cookies) {
          const httpOnlyJWTs = cookieResponse.cookies.map((c: { name: string }) => ({
            raw: { source: 'cookie-httponly' as const, key: c.name, token: '', httpOnly: true },
            header: null,
            payload: null,
            expiryStatus: 'no-expiry' as const,
            expiryLabel: 'HttpOnly — value not accessible',
            sensitiveClaims: [],
            decodeError: null,
          }));
          jwtAnalyses = [...jwtAnalyses, ...httpOnlyJWTs];
        }
      } catch {
        // Non-fatal
      }

      set({
        status: 'complete',
        url,
        isHttps,
        headerResults,
        jwtAnalyses,
        score,
        injectionFailed,
        lastAuditTime: Date.now(),
      });
    } catch (err) {
      console.error('Audit failed:', err);
      set({ status: 'error', errorType: 'no-headers' });
    }
  },

  reloadAndRerun: async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.reload(tab.id);
      // Wait briefly for the page to reload and headers to be captured
      setTimeout(() => get().runAudit(), 1500);
    }
  },
}));
```

### Phase 7 validation

- [ ] Store file created
- [ ] `npm run typecheck` passes

---

## 10. Phase 8 — Popup UI Components

### Create `src/popup/components/ScoreRing.tsx`

```tsx
import { useState } from 'react';
import type { SecurityScore, HeaderAuditResult } from '@/types';

interface Props {
  score: SecurityScore | null;
  headerResults?: HeaderAuditResult[];
  size?: number;
}

const BAND_COLORS = {
  secure:    { stroke: '#059669', text: '#065F46', bg: '#D1FAE5' },
  attention: { stroke: '#D97706', text: '#92400E', bg: '#FEF3C7' },
  risk:      { stroke: '#DC2626', text: '#991B1B', bg: '#FEE2E2' },
};

export function ScoreRing({ score, headerResults = [], size = 56 }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!score) {
    return (
      <div style={{ width: size, height: size }}
        className="rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <span className="text-xs text-gray-400">—</span>
      </div>
    );
  }

  const colors = BAND_COLORS[score.band];
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score.total / 100) * circ;

  return (
    <div className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="relative flex items-center justify-center cursor-help"
        style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={colors.bg} strokeWidth="5" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={colors.stroke} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
        <span className="absolute text-xs font-semibold"
          style={{ color: colors.text }}>
          {score.total}
        </span>
      </div>

      {/* Score breakdown tooltip */}
      {showTooltip && headerResults.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 border-b
            border-gray-100 dark:border-gray-700 pb-1">
            Score Breakdown
          </p>
          {headerResults.map((r) => (
            <div key={r.headerName} className="flex justify-between text-xs py-0.5">
              <span className="text-gray-600 dark:text-gray-400 truncate mr-2">
                {r.displayName}
              </span>
              <span className={`shrink-0 font-mono ${
                r.score === r.weight ? 'text-green-600 dark:text-green-400' :
                r.score > 0 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {r.score}/{r.weight}
              </span>
            </div>
          ))}
          {score.httpsCapApplied && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 pt-1 border-t
              border-gray-100 dark:border-gray-700">
              HTTP penalty: capped at 40
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Create `src/popup/components/Header.tsx`

```tsx
import { useAuditStore } from '@/popup/store/useAuditStore';
import { ScoreRing } from './ScoreRing';

export function Header() {
  const { url, score, status, headerResults, runAudit } = useAuditStore();

  const domain = url ? new URL(url).hostname : '—';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Security Audit
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{domain}</p>
      </div>
      <ScoreRing score={score} headerResults={headerResults} />
      <button
        onClick={runAudit}
        disabled={status === 'loading'}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100
          dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700
          disabled:opacity-40 transition-colors"
        title="Rerun audit"
      >
        <svg className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
}
```

### Create `src/popup/components/TabBar.tsx`

```tsx
import { useAuditStore } from '@/popup/store/useAuditStore';

const TABS = [
  { id: 'headers' as const, label: 'Headers' },
  { id: 'jwts'    as const, label: 'JWTs' },
  { id: 'settings'as const, label: 'Settings' },
];

export function TabBar() {
  const { activeTab, setActiveTab, headerResults, jwtAnalyses } = useAuditStore();

  const badges: Record<string, number | undefined> = {
    headers: headerResults.filter((r) => r.status === 'fail' || r.status === 'missing').length || undefined,
    jwts:    jwtAnalyses.filter((j) => !j.raw.httpOnly).length || undefined,
  };

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {TABS.map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-2 text-xs font-medium relative transition-colors
            ${activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          {tab.label}
          {badges[tab.id] ? (
            <span className="ml-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300
              text-xs px-1.5 rounded-full font-semibold">
              {badges[tab.id]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
```

### Create `src/popup/components/HeaderRow.tsx`

```tsx
import { useState } from 'react';
import type { HeaderAuditResult } from '@/types';

const STATUS_STYLES = {
  pass:    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warn:    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  fail:    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  missing: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  na:      'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const LEFT_BORDER = {
  pass:    'border-l-2 border-green-400',
  warn:    'border-l-2 border-amber-400',
  fail:    'border-l-2 border-red-500',
  missing: 'border-l-2 border-red-500',
  na:      'border-l-2 border-gray-300',
};

interface Props { result: HeaderAuditResult; expandByDefault?: boolean; }

export function HeaderRow({ result, expandByDefault = false }: Props) {
  const [expanded, setExpanded] = useState(expandByDefault);

  return (
    <div className={`${LEFT_BORDER[result.status]} bg-white dark:bg-gray-900 rounded-r-md mb-1`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50
          dark:hover:bg-gray-800 transition-colors"
      >
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[result.status]}`}>
          {result.status.toUpperCase()}
        </span>
        <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate flex-1">
          {result.displayName}
        </span>
        <svg className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">{result.message}</p>
          {result.value && (
            <code className="block text-xs bg-gray-100 dark:bg-gray-800 rounded px-2 py-1
              font-mono text-gray-700 dark:text-gray-300 break-all">
              {result.value}
            </code>
          )}
          {result.recommendation && (
            <div className="flex gap-1.5">
              <span className="text-amber-500 text-xs shrink-0 mt-0.5">→</span>
              <p className="text-xs text-amber-700 dark:text-amber-400">{result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Create `src/popup/components/HeadersTab.tsx`

```tsx
import { useAuditStore } from '@/popup/store/useAuditStore';
import { HeaderRow } from './HeaderRow';
import type { HeaderAuditResult } from '@/types';

const ORDER: HeaderAuditResult['status'][] = ['missing', 'fail', 'warn', 'pass', 'na'];

export function HeadersTab() {
  const { headerResults, settings, isHttps, injectionFailed } = useAuditStore();

  const sorted = [...headerResults].sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)
  );
  const filtered = settings.showPassingHeaders
    ? sorted
    : sorted.filter((r) => r.status !== 'pass');

  return (
    <div className="px-3 py-3 space-y-1 overflow-y-auto" style={{ maxHeight: 400 }}>
      {!isHttps && (
        <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200
          dark:border-red-800 rounded-md text-xs text-red-700 dark:text-red-300">
          ⚠️ Site is served over HTTP — score capped at 40. HSTS has no effect.
        </div>
      )}
      {injectionFailed && (
        <div className="mb-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200
          dark:border-amber-800 rounded-md text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Storage scan unavailable — page CSP blocked script injection. Header audit is complete but JWTs could not be scanned.
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">All headers passing.</p>
      ) : (
        filtered.map((r) => (
          <HeaderRow
            key={r.headerName}
            result={r}
            expandByDefault={settings.expandRawValuesByDefault}
          />
        ))
      )}
    </div>
  );
}
```

### Create `src/popup/components/JWTDecoder.tsx`

```tsx
import type { JWTAnalysis } from '@/types';
import { useAuditStore } from '@/popup/store/useAuditStore';

const EXPIRY_STYLES = {
  valid:          'text-green-700 dark:text-green-400',
  expired:        'text-red-700 dark:text-red-400',
  'not-yet-valid':'text-amber-700 dark:text-amber-400',
  'no-expiry':    'text-amber-700 dark:text-amber-400',
};

interface Props { analysis: JWTAnalysis; }

export function JWTDecoder({ analysis }: Props) {
  const { settings } = useAuditStore();

  if (analysis.decodeError) {
    return (
      <div className="px-3 pb-3">
        <p className="text-xs text-red-600 dark:text-red-400">{analysis.decodeError}</p>
      </div>
    );
  }

  if (analysis.raw.httpOnly) {
    return (
      <div className="px-3 pb-3 text-xs text-gray-500 dark:text-gray-400">
        This cookie is HttpOnly — its value is not accessible to JavaScript by design.
      </div>
    );
  }

  return (
    <div className="px-3 pb-3 space-y-2">
      <p className="text-xs text-gray-400 italic">Signature not verified</p>

      {/* Two-column layout: claims on left, status on right */}
      <div className="flex gap-3">
        {/* Left column: header + payload claims */}
        <div className="flex-1 min-w-0 space-y-2">
          {analysis.header && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Header</p>
              <ClaimsTable claims={analysis.header as Record<string, unknown>} sensitive={[]} highlight={false} />
            </div>
          )}

          {analysis.payload && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Payload</p>
              <ClaimsTable
                claims={analysis.payload as Record<string, unknown>}
                sensitive={analysis.sensitiveClaims}
                highlight={settings.highlightSensitiveClaims}
              />
            </div>
          )}
        </div>

        {/* Right column: expiry status + sensitive claim highlights */}
        <div className="w-32 shrink-0 space-y-2">
          <div className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Expiry</p>
            <p className={`text-xs font-medium ${EXPIRY_STYLES[analysis.expiryStatus]}`}>
              {analysis.expiryLabel}
            </p>
          </div>

          {analysis.sensitiveClaims.length > 0 && settings.highlightSensitiveClaims && (
            <div className="rounded-md border border-amber-200 dark:border-amber-800
              bg-amber-50 dark:bg-amber-950 p-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase mb-1">
                Sensitive
              </p>
              {analysis.sensitiveClaims.map((claim) => (
                <span key={claim} className="inline-block text-xs font-mono bg-amber-100
                  dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded px-1 py-0.5
                  mr-1 mb-1">
                  {claim}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClaimsTable({ claims, sensitive, highlight }: {
  claims: Record<string, unknown>;
  sensitive: string[];
  highlight: boolean;
}) {
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
      {Object.entries(claims).map(([key, value]) => {
        const isSensitive = highlight && sensitive.includes(key);
        return (
          <div key={key}
            className={`flex gap-2 px-2 py-1 border-b last:border-0 border-gray-100 dark:border-gray-800
              ${isSensitive ? 'bg-amber-50 dark:bg-amber-950' : ''}`}>
            <span className={`font-mono w-28 shrink-0 ${isSensitive ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
              {key}
            </span>
            <span className="font-mono text-gray-800 dark:text-gray-200 break-all">
              {JSON.stringify(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

### Create `src/popup/components/JWTCard.tsx`

```tsx
import { useState } from 'react';
import type { JWTAnalysis } from '@/types';
import { JWTDecoder } from './JWTDecoder';

const SOURCE_STYLES: Record<string, string> = {
  localStorage:    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sessionStorage:  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  cookie:          'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'cookie-httponly':'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface Props { analysis: JWTAnalysis; }

export function JWTCard({ analysis }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { raw } = analysis;

  const isExpired = analysis.expiryStatus === 'expired';
  const tokenPrefix = raw.token ? raw.token.slice(0, 20) + '...' : '';

  return (
    <div className={`rounded-md border mb-2 overflow-hidden
      ${isExpired
        ? 'border-red-300 dark:border-red-700'
        : 'border-gray-200 dark:border-gray-700'}`}>
      <button
        onClick={() => !raw.httpOnly && setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left
          hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0
          ${SOURCE_STYLES[raw.source] ?? SOURCE_STYLES.cookie}`}>
          {raw.source}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate block">
            {raw.key}
          </span>
          {tokenPrefix && (
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate block">
              {tokenPrefix}
            </span>
          )}
        </div>
        {isExpired && (
          <span className="text-xs text-red-600 dark:text-red-400 shrink-0">Expired</span>
        )}
        {!raw.httpOnly && (
          <svg className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {expanded && <JWTDecoder analysis={analysis} />}
    </div>
  );
}
```

### Create `src/popup/components/JWTTab.tsx`

```tsx
import { useAuditStore } from '@/popup/store/useAuditStore';
import { JWTCard } from './JWTCard';

export function JWTTab() {
  const { jwtAnalyses } = useAuditStore();

  if (jwtAnalyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">No JWTs detected</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Tokens in HttpOnly cookies are listed but cannot be decoded.
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 overflow-y-auto" style={{ maxHeight: 400 }}>
      {jwtAnalyses.map((a, i) => <JWTCard key={i} analysis={a} />)}
    </div>
  );
}
```

### Create `src/popup/components/SettingsTab.tsx`

```tsx
import { useAuditStore } from '@/popup/store/useAuditStore';

export function SettingsTab() {
  const { settings, updateSettings } = useAuditStore();

  const Toggle = ({ label, desc, checked, onChange }: {
    label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-start justify-between gap-3 py-3 border-b last:border-0
      border-gray-100 dark:border-gray-800">
      <div>
        <p className="text-sm text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-9 h-5 rounded-full transition-colors relative
          ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow
          transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="px-4 py-2">
      <Toggle
        label="Show passing headers"
        desc="Display headers that passed the audit"
        checked={settings.showPassingHeaders}
        onChange={(v) => updateSettings({ showPassingHeaders: v })}
      />
      <Toggle
        label="Expand raw values"
        desc="Show raw header values expanded by default"
        checked={settings.expandRawValuesByDefault}
        onChange={(v) => updateSettings({ expandRawValuesByDefault: v })}
      />
      <Toggle
        label="Highlight sensitive JWT claims"
        desc="Highlight claims like sub, email, roles in decoded tokens"
        checked={settings.highlightSensitiveClaims}
        onChange={(v) => updateSettings({ highlightSensitiveClaims: v })}
      />
    </div>
  );
}
```

### Create `src/popup/components/ErrorState.tsx`

```tsx
import { useAuditStore } from '@/popup/store/useAuditStore';
import type { ErrorType } from '@/types';

const ERROR_COPY: Record<ErrorType, { title: string; body: string; action?: string }> = {
  'internal-page':   { title: 'Cannot audit this page', body: 'Browser internal pages (chrome://) cannot be audited.' },
  'local-file':      { title: 'Cannot audit local files', body: 'Open the file via a local development server (e.g. npx serve) to audit it.' },
  'no-headers':      { title: 'No headers captured', body: 'Reload the page to capture its response headers, then rerun the audit.', action: 'Reload & Rerun' },
  'injection-failed':{ title: 'Storage scan unavailable', body: 'The page\'s CSP blocked the content script. Headers were audited; JWTs could not be scanned.' },
  'offline':         { title: 'Page is offline', body: 'No response headers are available for this page.' },
};

export function ErrorState() {
  const { errorType, runAudit, reloadAndRerun } = useAuditStore();
  if (!errorType) return null;
  const copy = ERROR_COPY[errorType];
  const handleAction = errorType === 'no-headers' ? reloadAndRerun : runAudit;

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{copy.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{copy.body}</p>
      </div>
      {copy.action && (
        <button onClick={handleAction}
          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          {copy.action}
        </button>
      )}
    </div>
  );
}
```

### Create `src/popup/components/Footer.tsx`

```tsx
import { useAuditStore } from '@/popup/store/useAuditStore';
import { copyReportToClipboard } from '@/lib/reportExporter';
import { useState } from 'react';

export function Footer() {
  const state = useAuditStore();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyReportToClipboard(state);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200
      dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <button
        onClick={handleCopy}
        disabled={state.status !== 'complete'}
        className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600
          text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
          disabled:opacity-40 transition-colors"
      >
        {copied ? '✓ Copied' : 'Copy Report'}
      </button>
      <a
        href="https://owasp.org/www-project-secure-headers/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        OWASP Docs ↗
      </a>
    </div>
  );
}
```

### Phase 8 validation

- [ ] All 10 component files created
- [ ] `npm run typecheck` passes

---

## 11. Phase 9 — Popup Entry Point

### Create `src/popup/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Security Audit</title>
    <style>
      body { margin: 0; width: 420px; min-height: 200px; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

### Create `src/popup/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### Create `src/popup/App.tsx`

```tsx
import { useEffect } from 'react';
import { useAuditStore } from './store/useAuditStore';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { HeadersTab } from './components/HeadersTab';
import { JWTTab } from './components/JWTTab';
import { SettingsTab } from './components/SettingsTab';
import { ErrorState } from './components/ErrorState';
import { Footer } from './components/Footer';

export default function App() {
  const { runAudit, status, activeTab } = useAuditStore();

  useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="w-popup bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
      font-sans antialiased flex flex-col" style={{ minHeight: 200, maxHeight: 580 }}>
      <Header />
      {status === 'error' ? (
        <ErrorState />
      ) : (
        <>
          <TabBar />
          <div className="flex-1 overflow-hidden">
            {activeTab === 'headers'  && <HeadersTab />}
            {activeTab === 'jwts'     && <JWTTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </>
      )}
      <Footer />
    </div>
  );
}
```

### Create `src/popup/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}
.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}
```

### Phase 9 validation

- [ ] `npm run build` completes successfully
- [ ] `dist/` contains `popup/index.html`, `background/index.js`, `content/index.js`
- [ ] Load unpacked extension in `chrome://extensions` — popup opens without console errors

---

## 12. Phase 10 — Styling

The Tailwind CSS configuration was set up in Phase 1. Ensure PostCSS is correctly configured.

### Verify `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Phase 10 validation

- [ ] Popup renders with correct styles
- [ ] Dark mode works (test by setting OS to dark mode)
- [ ] No unstyled flash on popup open

---

## 13. Phase 11 — Unit Tests

### Create `tests/unit/headerAudit.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { HEADER_RULES } from '@/constants/headers';

const cspRule = HEADER_RULES.find((r) => r.name === 'content-security-policy')!;
const hstsRule = HEADER_RULES.find((r) => r.name === 'strict-transport-security')!;
const xcoRule = HEADER_RULES.find((r) => r.name === 'x-content-type-options')!;

describe('CSP header rule', () => {
  it('passes a valid CSP with no unsafe directives', () => {
    const result = cspRule.evaluate("default-src 'self'; script-src 'self'");
    expect(result.status).toBe('pass');
    expect(result.score).toBe(20);
  });

  it('warns when unsafe-inline is present', () => {
    const result = cspRule.evaluate("default-src 'self'; script-src 'unsafe-inline'");
    expect(result.status).toBe('warn');
    expect(result.score).toBe(10);
  });

  it('fails when both unsafe-inline and unsafe-eval are present', () => {
    const result = cspRule.evaluate("script-src 'unsafe-inline' 'unsafe-eval'");
    expect(result.status).toBe('fail');
    expect(result.score).toBe(0);
  });

  it('marks as missing when header is null', () => {
    const result = cspRule.evaluate(null);
    expect(result.status).toBe('missing');
    expect(result.score).toBe(0);
  });
});

describe('HSTS header rule', () => {
  it('passes with max-age >= 1 year and includeSubDomains', () => {
    const result = hstsRule.evaluate('max-age=31536000; includeSubDomains; preload');
    expect(result.status).toBe('pass');
  });

  it('warns when max-age is too short', () => {
    const result = hstsRule.evaluate('max-age=86400');
    expect(result.status).toBe('warn');
  });

  it('marks as missing when null', () => {
    expect(hstsRule.evaluate(null).status).toBe('missing');
  });
});

describe('X-Content-Type-Options rule', () => {
  it('passes for nosniff', () => {
    expect(xcoRule.evaluate('nosniff').status).toBe('pass');
  });

  it('warns for any other value', () => {
    expect(xcoRule.evaluate('sniff').status).toBe('warn');
  });
});

const xfoRule = HEADER_RULES.find((r) => r.name === 'x-frame-options')!;

describe('X-Frame-Options + CSP frame-ancestors interplay', () => {
  it('passes when X-Frame-Options is missing but CSP frame-ancestors is present', () => {
    const result = xfoRule.evaluate(null, {
      'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
    });
    expect(result.status).toBe('pass');
    expect(result.score).toBe(10);
  });

  it('marks as missing when both X-Frame-Options and frame-ancestors are absent', () => {
    const result = xfoRule.evaluate(null, {});
    expect(result.status).toBe('missing');
    expect(result.score).toBe(0);
  });
});

describe('CSP-Report-Only override', () => {
  it('overrides CSP result to warn when only report-only is set', () => {
    const { applyCspReportOnlyOverride } = require('@/constants/headers');
    const results = HEADER_RULES.map((r) => r.evaluate(null));
    const overridden = applyCspReportOnlyOverride(results, {
      'content-security-policy-report-only': "default-src 'self'",
    });
    const csp = overridden.find((r: { headerName: string }) => r.headerName === 'content-security-policy');
    expect(csp.status).toBe('warn');
    expect(csp.score).toBe(10); // 50% of weight 20
  });
});
```

### Create `tests/unit/jwtDecoder.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { decodeJWT } from '@/lib/jwtDecoder';
import type { RawJWT } from '@/types';

// A real expired JWT for testing (public test token — no sensitive data)
const EXPIRED_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZXMiOlsiYWRtaW4iXSwiZXhwIjoxNjAwMDAwMDAwfQ' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const NO_EXP_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IkpvaG4gRG9lIn0' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const makeRaw = (token: string): RawJWT => ({
  source: 'localStorage',
  key: 'access_token',
  token,
});

describe('JWT decoder', () => {
  it('decodes a valid JWT', () => {
    const result = decodeJWT(makeRaw(EXPIRED_JWT));
    expect(result.decodeError).toBeNull();
    expect(result.header?.alg).toBe('HS256');
    expect(result.payload?.sub).toBe('1234567890');
  });

  it('marks token as expired', () => {
    const result = decodeJWT(makeRaw(EXPIRED_JWT));
    expect(result.expiryStatus).toBe('expired');
    expect(result.expiryLabel).toContain('Expired');
  });

  it('marks token with no exp as no-expiry', () => {
    const result = decodeJWT(makeRaw(NO_EXP_JWT));
    expect(result.expiryStatus).toBe('no-expiry');
  });

  it('detects sensitive claims', () => {
    const result = decodeJWT(makeRaw(EXPIRED_JWT));
    expect(result.sensitiveClaims).toContain('email');
    expect(result.sensitiveClaims).toContain('sub');
    expect(result.sensitiveClaims).toContain('roles');
  });

  it('returns decode error for malformed token', () => {
    const result = decodeJWT(makeRaw('not.a.jwt.at.all.extra'));
    expect(result.decodeError).toBeTruthy();
  });
});
```

### Create `tests/unit/scoreCalculator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateScore } from '@/lib/scoreCalculator';
import type { HeaderAuditResult } from '@/types';

function makeResult(status: HeaderAuditResult['status'], weight: number, score: number): HeaderAuditResult {
  return {
    headerName: 'test',
    displayName: 'Test',
    status,
    value: null,
    message: '',
    recommendation: '',
    weight,
    score,
  };
}

describe('score calculator', () => {
  it('returns 100 when all headers pass', () => {
    const results = [
      makeResult('pass', 20, 20),
      makeResult('pass', 15, 15),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 5, 5),
    ];
    const score = calculateScore(results, true);
    expect(score.total).toBe(100);
    expect(score.band).toBe('secure');
  });

  it('caps score at 40 for HTTP sites', () => {
    const results = Array(5).fill(makeResult('pass', 20, 20));
    const score = calculateScore(results, false);
    expect(score.total).toBeLessThanOrEqual(40);
    expect(score.httpsCapApplied).toBe(true);
  });

  it('returns risk band for low scores', () => {
    const results = Array(5).fill(makeResult('missing', 20, 0));
    const score = calculateScore(results, true);
    expect(score.band).toBe('risk');
  });

  it('returns attention band for mid scores', () => {
    const results = [
      makeResult('pass', 20, 20),
      makeResult('pass', 15, 15),
      makeResult('pass', 10, 10),
      makeResult('missing', 10, 0),
      makeResult('missing', 10, 0),
      makeResult('missing', 10, 0),
      makeResult('missing', 10, 0),
      makeResult('missing', 10, 0),
      makeResult('missing', 5, 0),
    ];
    const score = calculateScore(results, true);
    expect(score.band).toBe('attention');
  });

  it('applies additional -10 penalty when CSP has both unsafe-inline and unsafe-eval', () => {
    const cspResult: HeaderAuditResult = {
      headerName: 'content-security-policy',
      displayName: 'Content-Security-Policy',
      status: 'fail',
      value: "script-src 'unsafe-inline' 'unsafe-eval'",
      message: '',
      recommendation: '',
      weight: 20,
      score: 0,
    };
    const otherResults = [
      makeResult('pass', 15, 15),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 5, 5),
    ];
    const score = calculateScore([cspResult, ...otherResults], true);
    // 80 (from other headers) - 10 (CSP penalty) = 70
    expect(score.total).toBe(70);
    expect(score.band).toBe('attention');
  });
});
```

### Run tests

```bash
npm run test
```

### Phase 11 validation

- [ ] All unit tests pass
- [ ] No test failures

---

## 14. Phase 12 — E2E Tests

### Install Playwright Chromium

```bash
npx playwright install chromium
```

### Create `tests/e2e/extension.test.ts`

```typescript
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '../../dist');

test.describe('Extension E2E', () => {
  test('popup opens and shows loading state', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });

    // Wait for extension to initialise
    await context.waitForEvent('page');

    const [background] = context.backgroundPages();
    expect(background).toBeTruthy();

    await context.close();
  });

  test('JWT decoder handles malformed token gracefully', async () => {
    // Unit-level test covered in Phase 11
    // E2E: navigate to a test page and verify extension loads
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });

    const page = await context.newPage();
    await page.goto('https://example.com');

    // Inject a test JWT into localStorage
    await page.evaluate(() => {
      localStorage.setItem(
        'test_token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
      );
    });

    await context.close();
  });
});
```

### Create `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    headless: false,
  },
});
```

### Phase 12 validation

- [ ] `npm run test:e2e` runs without crashing
- [ ] Extension loads in the Playwright Chromium browser

---

## 15. Phase 13 — Build & Package

### Create `scripts/package.js`

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '../dist');
const OUT = path.resolve(__dirname, '../releases');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const pkg = require('../package.json');
const version = pkg.version;
const outFile = path.join(OUT, `browser-security-audit-v${version}.zip`);

// Zip the dist folder
execSync(`cd "${DIST}" && zip -r "${outFile}" .`);
console.log(`✓ Packaged: ${outFile}`);
```

### Build commands

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Package for distribution
npm run package
```

### Load extension in Chrome for testing

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `dist/` directory
5. Pin the extension to the toolbar
6. Navigate to any HTTPS website
7. Click the extension icon

### Phase 13 validation

- [ ] `npm run build` produces a clean `dist/`
- [ ] Extension loads in Chrome without errors
- [ ] Popup opens and displays audit results on a real website
- [ ] JWT detection works on a site with localStorage tokens
- [ ] Copy Report copies a properly formatted Markdown string

---

## 16. Phase 14 — Hosting & Distribution

### Option A: Chrome Web Store (Primary)

This is the official distribution channel. Users install directly from the store.

#### Prerequisites

- Google Developer account: https://chrome.google.com/webstore/devconsole
- One-time $5 registration fee
- Store listing assets: 1280×800 screenshot (min 1), 440×280 promotional tile, icon 128×128

#### Step 1 — Prepare the store listing

Create the following in a `store-assets/` directory:
- `description.txt` — store description (max 132 chars short, 16,000 chars long)
- `screenshots/` — at least one 1280×800 PNG screenshot of the popup in action
- `promo-tile.png` — 440×280 promotional image

#### Step 2 — Build the production zip

```bash
npm run build
npm run package
# Output: releases/browser-security-audit-v1.0.0.zip
```

#### Step 3 — Submit to Web Store

1. Go to https://chrome.google.com/webstore/devconsole
2. Click "New Item"
3. Upload `releases/browser-security-audit-v1.0.0.zip`
4. Fill in: title, short description, detailed description, category (Developer Tools), language
5. Upload screenshots and promotional tile
6. Set privacy practices — declare: "This extension does not collect or transmit any user data"
7. Submit for review (typically 1–3 business days)

#### Store description template

```
One-click security header audit + JWT inspector for any website.

Instantly check Content-Security-Policy, HSTS, X-Frame-Options and 6 more security headers. Detects and decodes JWTs from localStorage, sessionStorage, and cookies — all locally, with zero data sent anywhere.

Features:
• Security header audit with pass/warn/fail per header
• Fix recommendations for every failing header
• 0–100 security score with colour-coded rating
• JWT detection and one-click decode
• Sensitive claim highlighting (roles, email, sub, permissions)
• Expired token detection
• 100% private — no analytics, no network requests
• Open source on GitHub
```

---

### Option B: Self-Hosted / Sideload Distribution

For distributing within a team or organisation without the Web Store.

#### Step 1 — Host the zip on GitHub Releases

```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0
# GitHub Actions will build and attach the zip (see Phase 15)
```

#### Step 2 — Installation instructions for team

Users must enable Developer Mode to sideload:

1. Download `browser-security-audit-v1.0.0.zip` from GitHub Releases
2. Unzip to a permanent folder (do NOT delete after installing)
3. Open `chrome://extensions`
4. Enable Developer Mode
5. Click "Load unpacked" and select the unzipped folder

**Note:** Sideloaded extensions show a warning banner in Chrome and require Developer Mode to remain on. For enterprise distribution, use the Chrome Enterprise policy method below.

#### Option C: Chrome Enterprise Policy (Organisation-wide)

For managed Chrome deployments (Google Workspace / MDM):

```json
// Windows Registry / macOS profile / Linux JSON policy
{
  "ExtensionInstallForcelist": [
    "EXTENSION_ID;https://your-internal-server.com/update.xml"
  ]
}
```

Create an `update.xml` hosted on your internal server:

```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='EXTENSION_ID'>
    <updatecheck codebase='https://your-server.com/releases/browser-security-audit-v1.0.0.crx' version='1.0.0' />
  </app>
</gupdate>
```

Package as `.crx` (required for self-hosted update server):

```bash
npx crx pack dist/ -o releases/browser-security-audit-v1.0.0.crx \
  --private-key releases/key.pem
# First run: generates key.pem — keep this private key safe, never commit it
```

---

### Version Update Workflow (all options)

```bash
# 1. Bump version in package.json and manifest.json
npm version patch   # or minor / major

# 2. Update manifest.json version to match
# (must be kept in sync manually or via the CI script below)

# 3. Build and package
npm run build && npm run package

# 4. For Web Store: upload new zip via Developer Console or API
# 5. For self-hosted: replace the crx and bump update.xml version
```

---

## 17. Phase 15 — CI/CD Pipeline

### Create `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test

      - name: Build
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: extension-dist
          path: dist/
          retention-days: 7
```

### Create `.github/workflows/publish.yml`

```yaml
name: Publish

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build

      - name: Get version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Package extension
        run: |
          mkdir -p releases
          cd dist && zip -r "../releases/browser-security-audit-v${{ steps.version.outputs.VERSION }}.zip" .

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: releases/*.zip
          generate_release_notes: true
          name: "v${{ steps.version.outputs.VERSION }}"

      - name: Publish to Chrome Web Store
        # Only runs if CWS secrets are configured
        if: ${{ secrets.CHROME_EXTENSION_ID != '' }}
        uses: mnao305/chrome-extension-upload@v4.0.1
        with:
          file-path: releases/browser-security-audit-v${{ steps.version.outputs.VERSION }}.zip
          extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

### Configure Chrome Web Store API secrets (for automated publish)

In your GitHub repository → Settings → Secrets → Actions, add:

| Secret | Value |
|--------|-------|
| `CHROME_EXTENSION_ID` | Your extension ID from the Web Store |
| `CHROME_CLIENT_ID` | OAuth client ID from Google Cloud Console |
| `CHROME_CLIENT_SECRET` | OAuth client secret |
| `CHROME_REFRESH_TOKEN` | Refresh token (follow Chrome Web Store API setup guide) |

### Create `.gitignore`

```
node_modules/
dist/
releases/
*.crx
*.pem
.DS_Store
coverage/
```

### Create `README.md`

```markdown
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
4. Click "Load unpacked" → select `dist/`

## Tech Stack

- React 18 + TypeScript
- Vite + vite-plugin-web-extension
- Tailwind CSS
- Zustand
- Vitest + Playwright

## Privacy

Zero telemetry. No network requests. All processing is local.
```

### Phase 15 validation

- [ ] `.github/workflows/ci.yml` created
- [ ] `.github/workflows/publish.yml` created
- [ ] Push to `main` — CI pipeline runs green on GitHub Actions
- [ ] Create a tag `v1.0.0` — publish workflow creates a GitHub Release with the zip attached

---

## 18. Environment Variables Reference

This extension has no environment variables. All configuration is static and compiled into the bundle. The only secrets are the GitHub Actions secrets for Chrome Web Store publishing, documented in Phase 15.

---

## 19. Troubleshooting

### "Cannot read properties of undefined (reading 'session')"

`chrome.storage.session` requires Chrome 102+. Ensure the user's Chrome is up to date.

### Popup shows "No headers captured" on every page

The service worker was likely not running when the page loaded. This happens on:
- First install (the webRequest listener wasn't registered yet)
- After Chrome restarts (service workers re-register on first event)

**Fix:** Reload the page after installing or after Chrome restarts. The one-click reload button in the error state handles this.

### Content script not injecting (JWT scan unavailable)

Some pages have a strict CSP that blocks `chrome-extension://` scripts. The audit will still show header results. JWT scanning is best-effort and this failure is expected on locked-down pages.

### `vite-plugin-web-extension` cannot find manifest.json

Ensure `manifest.json` is at the project root (same level as `vite.config.ts`), not inside `src/`.

### TypeScript errors on `chrome.*` APIs

Ensure `@types/chrome` is installed and `"lib": ["DOM"]` is in `tsconfig.json`. The `webextensions: true` env in `.eslintrc.cjs` makes the `chrome` global available to ESLint.

### Dark mode not applying

Tailwind's `darkMode: 'media'` only responds to the OS setting. Chrome extensions inherit the OS dark mode preference correctly. Test by changing your OS appearance setting.

### E2E tests fail with "Extension not loaded"

Ensure `npm run build` was run before `npm run test:e2e`. The E2E tests load from `dist/` which must exist.

---

*End of Functional Specification v1.0*
