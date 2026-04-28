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

chrome.runtime.onMessage.addListener((message: ContentScanRequest, _sender, sendResponse) => {
  if (message.type !== 'SCAN_STORAGE') return;

  const jwts: RawJWT[] = [
    ...scanStorage(localStorage, 'localStorage'),
    ...scanStorage(sessionStorage, 'sessionStorage'),
    ...scanCookies(),
  ];

  const response: ContentScanResponse = { type: 'SCAN_RESULT', jwts };
  sendResponse(response);
});
