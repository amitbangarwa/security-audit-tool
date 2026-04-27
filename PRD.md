# Product Requirements Document
## Browser Security Audit Tool — Chrome Extension

**Version:** 1.0  
**Author:** Amit  
**Status:** Draft  
**Last Updated:** April 2026  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Target Users](#4-target-users)
5. [User Stories](#5-user-stories)
6. [Feature Requirements](#6-feature-requirements)
7. [Security Headers Audit Spec](#7-security-headers-audit-spec)
8. [JWT Inspector Spec](#8-jwt-inspector-spec)
9. [Scoring System](#9-scoring-system)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [Technical Constraints](#11-technical-constraints)
12. [Permissions Model](#12-permissions-model)
13. [Privacy & Data Policy](#13-privacy--data-policy)
14. [Performance Requirements](#14-performance-requirements)
15. [Error States](#15-error-states)
16. [Future Roadmap](#16-future-roadmap)
17. [Success Metrics](#17-success-metrics)

---

## 1. Overview

**Browser Security Audit Tool** is a Chrome extension that gives developers, security engineers, and QA teams an instant, one-click security posture assessment of any website they are visiting. It audits HTTP response headers for security best practices and automatically detects, decodes, and inspects JWTs stored in `localStorage`, `sessionStorage`, and cookies — all without leaving the browser.

---

## 2. Problem Statement

Security auditing of web applications today requires:

- Switching between the browser DevTools, third-party sites like securityheaders.com, and manual JWT decoders like jwt.io
- Copy-pasting tokens out of storage panels and into external tools — a potential data leakage vector
- No aggregated view that correlates headers + token data in a single workflow

This creates friction for developers doing daily security hygiene checks, and introduces risk when developers paste tokens from production apps into public decode tools.

**The gap:** There is no lightweight, privacy-first, single-click tool that combines header auditing and JWT inspection in the developer's own browser context.

---

## 3. Goals & Non-Goals

### Goals

- Audit all major HTTP security response headers against a defined rubric and surface pass/warn/fail per header
- Detect JWTs in `localStorage`, `sessionStorage`, and accessible cookies on any page
- Decode and display JWT header, payload, and signature status without any network request
- Provide an overall security score (0–100) per page
- Work entirely client-side — no data ever leaves the browser
- Load and render audit results in under 500ms

### Non-Goals (v1.0)

- Modifying headers or injecting CSP rules
- Auditing WebSocket or GraphQL security
- Scanning for XSS, SQLi, or other code-level vulnerabilities
- Authenticating to or scraping pages behind login walls
- Supporting Firefox, Edge, or Safari (Chrome/Chromium only in v1.0)
- Automated scheduled audits or historical diff tracking

---

## 4. Target Users

### Primary: Frontend / Full-Stack Developers

Building or reviewing web applications who want to verify security headers are set correctly before or after deployment.

**Needs:** Fast feedback, technical detail, specific guidance on what's missing and how to fix it.

### Secondary: Security Engineers / Penetration Testers

Doing reconnaissance or review of web applications as part of a security assessment workflow.

**Needs:** Raw header values, full JWT payload dump, flag for sensitive claims (`roles`, `permissions`, `sub`).

### Tertiary: QA Engineers

Verifying that security headers meet company policy requirements as part of a release checklist.

**Needs:** Pass/fail verdicts, shareable summary, overall score.

---

## 5. User Stories

| ID | As a… | I want to… | So that… |
|----|--------|------------|----------|
| US-01 | Developer | Click the extension icon and see all security headers for the current page | I can verify my app's headers without leaving the browser |
| US-02 | Developer | See a clear pass/warn/fail verdict per header with a brief explanation | I know exactly what is wrong and why |
| US-03 | Developer | See a fix recommendation inline with each failing header | I can remediate without searching documentation |
| US-04 | Security Engineer | See the raw value of each header alongside the verdict | I can assess nuance beyond simple pass/fail |
| US-05 | Developer | See all JWTs found on the page in one list | I don't have to manually dig through DevTools storage |
| US-06 | Developer | Click a JWT to decode it and see header, payload, and expiry status | I can inspect tokens without pasting them into external tools |
| US-07 | Security Engineer | See highlighted sensitive claims (roles, permissions, sub, email) | I can quickly spot over-privileged tokens |
| US-08 | Developer | See an overall security score for the page | I have a quick summary to share or track |
| US-09 | QA Engineer | Copy the audit result as a formatted text summary | I can paste it into a ticket or test report |
| US-10 | Developer | Re-run the audit on demand without re-opening the popup | I can re-check after making header changes |
| US-11 | Developer | See if a cookie is HttpOnly and therefore not inspectable | I understand why a token can't be decoded |
| US-12 | Any user | Know that no data is ever sent anywhere | I trust the tool with production tokens |

---

## 6. Feature Requirements

### F-01: Security Headers Audit

**Priority:** P0 — Must Have

- On popup open, automatically trigger an audit of the active tab's response headers
- Display results in a scrollable list grouped by severity: Critical → Warning → Info
- Each header row shows: header name, status badge (Pass / Warn / Fail / Missing), raw value (collapsible), explanation, fix recommendation
- Headers that are missing entirely are shown as "Missing" with highest prominence
- A "Rerun Audit" button allows re-triggering without closing the popup

### F-02: JWT Detection & Inspection

**Priority:** P0 — Must Have

- Automatically scan `localStorage`, `sessionStorage`, and `document.cookie` on the active tab on popup open
- List all detected JWTs with: source (localStorage / sessionStorage / cookie), storage key name, token prefix (first 20 chars)
- Clicking a JWT row expands an inline decoder panel showing:
  - Algorithm (`alg`) and type (`typ`) from header
  - All payload claims in a formatted key-value list
  - Expiry status: Valid / Expired / No expiry set, with human-readable time remaining or time since expiry
  - Sensitive claims highlighted: `sub`, `email`, `roles`, `permissions`, `scope`, `groups`
- HttpOnly cookies are listed as detected but non-decodable, with an explanation

### F-03: Security Score

**Priority:** P1 — Should Have

- Compute a 0–100 score based on header audit results
- Display score prominently in the popup header area with a colour-coded ring (green ≥ 80, amber 50–79, red < 50)
- Score breakdown tooltip shows per-category contribution
- Score is recomputed on every re-run

### F-04: Copy Summary

**Priority:** P1 — Should Have

- A "Copy Report" button exports a plain-text or Markdown summary of the audit result to clipboard
- Summary includes: URL, timestamp, score, per-header verdicts, JWT count and expiry status

### F-05: Settings Panel

**Priority:** P2 — Nice to Have

- Toggle: show/hide passing headers (default: show all)
- Toggle: show/hide raw header values by default (default: collapsed)
- Toggle: highlight sensitive JWT claims (default: on)

---

## 7. Security Headers Audit Spec

Each header is evaluated against the following criteria. Weights contribute to the security score.

| Header | Pass Condition | Warn Condition | Fail / Missing | Weight |
|--------|---------------|----------------|----------------|--------|
| `Content-Security-Policy` | Present, non-trivial (not `unsafe-inline` + `unsafe-eval` together) | Present but contains `unsafe-inline` or `unsafe-eval` | Absent | 20 pts |
| `Strict-Transport-Security` | Present, `max-age` ≥ 31536000, includes `includeSubDomains` | Present, `max-age` < 31536000 or missing `includeSubDomains` | Absent | 15 pts |
| `X-Content-Type-Options` | `nosniff` | Any other value | Absent | 10 pts |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` — or CSP `frame-ancestors` present | `ALLOW-FROM` (deprecated) | Absent (and no `frame-ancestors` in CSP) | 10 pts |
| `Referrer-Policy` | `no-referrer`, `strict-origin`, or `strict-origin-when-cross-origin` | `same-origin` or `origin` | Absent or `unsafe-url` | 10 pts |
| `Permissions-Policy` | Present with at least 3 directives | Present but minimal | Absent | 10 pts |
| `Cross-Origin-Opener-Policy` | `same-origin` | `same-origin-allow-popups` | Absent | 10 pts |
| `Cross-Origin-Embedder-Policy` | `require-corp` | — | Absent | 10 pts |
| `Cross-Origin-Resource-Policy` | `same-origin` or `same-site` | `cross-origin` | Absent | 5 pts |

**Special rules:**
- Site served over HTTP (not HTTPS): automatic cap of 40 pts regardless of header scores, and a top-level warning banner
- `Content-Security-Policy-Report-Only` present but no enforced CSP: flag as Warn, not Pass
- `X-Frame-Options` is deprecated in favour of CSP `frame-ancestors` — if `frame-ancestors` is present in CSP, `X-Frame-Options` absence does not penalise

---

## 8. JWT Inspector Spec

### Detection

```
JWT regex pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g
```

Sources scanned:
1. `localStorage` — all keys, all values
2. `sessionStorage` — all keys, all values
3. `document.cookie` — all accessible (non-HttpOnly) cookie values
4. `chrome.cookies` API — used to enumerate HttpOnly cookies by name only (cannot decode)

### Decoding

- Decoding is 100% client-side using `atob()` with base64url normalisation
- No network requests are made during decode
- Signature is NOT verified (this requires the secret/public key — out of scope for v1)
- A clear disclaimer is shown: "Signature not verified"

### Expiry Logic

- If `exp` claim is present: compare against `Date.now() / 1000`
  - > current time: show "Valid — expires in X hours/days"
  - < current time: show "Expired X hours/days ago" (red badge)
- If `nbf` claim is present: check if token is not yet valid
- If no `exp`: show "No expiry — token does not expire" (amber badge)

### Sensitive Claims

These claims are highlighted with an amber background in the decoded payload:

`sub`, `email`, `name`, `phone_number`, `roles`, `role`, `permissions`, `scope`, `groups`, `org`, `tenant`, `admin`, `is_admin`, `user_id`, `uid`

---

## 9. Scoring System

```
Base Score = Sum of weights for all headers that PASS
Deductions:
  - Each WARN header: deduct 50% of that header's weight
  - HTTP (not HTTPS): cap total at 40
  - CSP with both unsafe-inline AND unsafe-eval: additional -10

Final Score = clamp(Base Score - Deductions, 0, 100)
```

### Score Bands

| Score | Label | Ring Colour |
|-------|-------|-------------|
| 80–100 | Secure | Green |
| 50–79 | Needs Attention | Amber |
| 0–49 | At Risk | Red |

---

## 10. UI/UX Requirements

### Popup Dimensions

- Width: 420px (fixed)
- Height: auto, max 580px with internal scroll
- No browser-level resize

### Layout

```
┌─────────────────────────────────────────┐
│  🔒 Security Audit    [Score Ring]  [⟳] │  ← Header bar
│  current-domain.com                      │
├─────────────────────────────────────────┤
│  [ Headers ]  [ JWTs ]  [ Settings ]     │  ← Tab bar
├─────────────────────────────────────────┤
│                                          │
│  Tab content (scrollable)                │
│                                          │
├─────────────────────────────────────────┤
│  [ Copy Report ]          [ Docs ↗ ]    │  ← Footer
└─────────────────────────────────────────┘
```

### Header Tab

- Group headers by: Critical Issues → Warnings → Passed → Not Applicable
- Each row: coloured status pill + header name + chevron to expand raw value + fix text
- Missing critical headers are pinned to top, visually distinct (red left border)

### JWT Tab

- If no JWTs found: empty state with a friendly message and a note about HttpOnly cookies
- Each JWT card: source badge + key name + truncated token + expand button
- Expanded: two-column layout — left: header/payload claims, right: expiry status + sensitive claim highlights

### Design Tokens

- Font: system-ui stack (no external font load)
- Border radius: 6px for cards, 4px for pills
- Transitions: 150ms ease for expand/collapse
- Dark mode: respects `prefers-color-scheme`

---

## 11. Technical Constraints

- **Manifest Version:** V3 (required by Chrome Web Store as of 2024)
- **Service Worker:** Must persist header cache to `chrome.storage.session` — service workers terminate after ~30s idle, in-memory state is lost
- **Content Script isolation:** Runs in an isolated world — shares `window`/`localStorage` with the page but not the JS heap
- **HttpOnly cookies:** Only name/domain/path accessible via `chrome.cookies` API from the service worker. Values are not readable by design — this is a feature of the browser security model, not a bug to work around
- **CSP on extension pages:** The extension's own popup HTML must not use inline scripts — all JS must be in separate files (MV3 requirement)
- **`webRequest` in MV3:** Read-only. Headers can be observed and cached but not modified

---

## 12. Permissions Model

| Permission | Justification | User-facing prompt |
|------------|--------------|-------------------|
| `activeTab` | Read current tab URL and inject content script | "Read and change data on the current website" |
| `scripting` | Programmatically inject content script | Bundled with activeTab |
| `cookies` | Enumerate cookies (including HttpOnly names) | "Read and change your cookie data" |
| `storage` | Persist header cache across service worker restarts | Silent |
| `webRequest` | Observe HTTP response headers | "Read your browsing history" |
| `host_permissions: <all_urls>` | Required for webRequest across all domains | "Read and change all your data on all websites" |

**Note:** `<all_urls>` is the most sensitive permission and will trigger a prominent warning in the Chrome Web Store listing. This must be clearly explained in the store description and privacy policy.

---

## 13. Privacy & Data Policy

- **Zero data exfiltration:** No analytics, no telemetry, no remote logging
- **No external requests:** The extension makes zero network requests. All processing is local
- **Token data never leaves the browser:** JWTs are decoded in-memory using `atob()` — no third-party decode service is called
- **Storage:** Only the current tab's header cache is stored in `chrome.storage.session` (cleared on browser close). No persistent storage of page data
- **Open source:** Full source code is published on GitHub so the no-telemetry claim is auditable

---

## 14. Performance Requirements

| Metric | Target |
|--------|--------|
| Popup open to first render | < 200ms |
| Header audit result display | < 500ms after popup open |
| JWT scan completion | < 300ms for pages with < 50 storage keys |
| Popup bundle size (JS + CSS) | < 150KB gzipped |
| Memory footprint | < 20MB active |
| Service worker startup | < 100ms |

---

## 15. Error States

| Scenario | Behaviour |
|----------|-----------|
| Extension opened on `chrome://` or `edge://` page | Show "Cannot audit browser internal pages" with icon |
| Extension opened on a `file://` page | Show "Cannot audit local files" with note to use a local server |
| Content script injection fails (strict CSP on page) | Show partial results with a warning banner: "Storage scan unavailable — page CSP blocked script injection" |
| No headers cached (tab loaded before extension installed) | Show "Reload the page to capture headers" with a one-click reload button |
| Network error / offline page | Show "No response headers available" |
| JWT `atob()` decode fails (malformed token) | Show "Token appears malformed — could not decode" inline |

---

## 16. Future Roadmap

### v1.1
- Firefox support (WebExtensions API compatibility layer)
- Audit history: last 10 audited URLs with score diff
- Configurable header policy profiles (OWASP strict, custom)

### v1.2
- Export as PDF report
- Team sync: share audit results via a link (encrypted, ephemeral)
- Bulk audit mode: run against a list of URLs via sitemap

### v2.0
- HTTPS certificate inspection (expiry, cipher suite, chain)
- Cookie attribute auditor (`Secure`, `SameSite`, `HttpOnly` completeness check)
- Subresource Integrity (SRI) checker for all `<script>` and `<link>` tags
- Mixed content detection

---

## 17. Success Metrics

| Metric | 30-day target | 90-day target |
|--------|--------------|--------------|
| Chrome Web Store installs | 500 | 2,000 |
| Weekly active users | 200 | 800 |
| Store rating | ≥ 4.2 / 5 | ≥ 4.5 / 5 |
| Popup load time p95 | < 400ms | < 300ms |
| Zero data-related support tickets | ✓ | ✓ |

---

*End of PRD v1.0*
