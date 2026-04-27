# Browser Security Audit Tool — Chrome Extension

## Project Overview

Chrome Extension (Manifest V3) that provides one-click security header auditing and JWT inspection.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Biome

**Specs:**
- `PRD.md` — Product requirements and acceptance criteria
- `FUNCTIONAL_SPEC.md` — Implementation blueprint with exact code for every file

## Post-Task Workflow (MANDATORY)

After completing each task, follow this sequence **before** proceeding to the next task:

### Step 1: Lint & Format
```bash
npx @biomejs/biome check --write src/ tests/
```
Fix any remaining issues that `--write` cannot auto-fix.

### Step 2: Type Check
```bash
npm run typecheck
```
Fix all TypeScript errors before proceeding.

### Step 3: Run Tests (if tests exist)
```bash
npm run test 2>/dev/null || true
```
Fix any failing tests that relate to the current task.

### Step 4: Code Review
Use the `superpowers:requesting-code-review` skill to review the completed task against the FUNCTIONAL_SPEC.md. Fix any issues found.

### Step 5: Commit
Commit with a descriptive message in this format:
```
feat(phase-N): <short description of what was built>
```

## Code Conventions

- **Linter/Formatter:** Biome (NOT ESLint + Prettier). Config in `biome.json`.
- **Imports:** Use `@/` alias for `src/` paths
- **Types:** All shared types in `src/types/index.ts`
- **Constants:** Header rules and sensitive claims in `src/constants/headers.ts`
- **Components:** Functional components, no class components
- **State:** Zustand store only, no prop drilling beyond 1 level
- **Styling:** Tailwind CSS utility classes, `darkMode: 'media'`
- **No inline scripts** in HTML files (MV3 requirement)
- **No network requests** from extension code (privacy-first)

## File Structure Reference

```
browser-security-audit/
├── src/
│   ├── background/index.ts          # Service worker
│   ├── content/index.ts             # Content script
│   ├── popup/                       # React popup app
│   │   ├── components/              # UI components
│   │   ├── store/                   # Zustand store
│   │   ├── App.tsx, main.tsx        # Entry points
│   │   └── index.html, index.css
│   ├── lib/                         # Business logic
│   ├── types/index.ts               # Shared types
│   └── constants/headers.ts         # Header rules
├── tests/
│   ├── unit/                        # Vitest unit tests
│   └── e2e/                         # Playwright E2E tests
├── biome.json                       # Linter/formatter config
├── manifest.json                    # Chrome extension manifest
└── vite.config.ts                   # Build config
```

## Commands

```bash
npm run dev          # Watch mode build
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # Biome lint
npm run format       # Biome format
npm run check        # Biome lint + format
npm run test         # Unit tests (vitest)
npm run test:e2e     # E2E tests (playwright)
npm run package      # Zip for distribution
```
