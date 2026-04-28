import type { HeaderCacheEntry } from '@/types';

const CACHE_KEY = 'header_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache headers in session storage keyed by tabId
async function cacheHeaders(
  tabId: number,
  url: string,
  headers: chrome.webRequest.HttpHeader[]
): Promise<void> {
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
    chrome.cookies
      .getAll({ url })
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
