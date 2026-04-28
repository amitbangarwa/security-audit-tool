import { create } from 'zustand';
import { auditHeaders } from '@/lib/headerAudit';
import { decodeJWT } from '@/lib/jwtDecoder';
import { calculateScore } from '@/lib/scoreCalculator';
import type {
  AuditState,
  HeaderAuditResult,
  JWTAnalysis,
  SecurityScore,
  UserSettings,
} from '@/types';

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

async function loadPersistedSettings(): Promise<UserSettings> {
  try {
    const stored = await chrome.storage.local.get('settings');
    if (stored.settings) {
      return { ...DEFAULT_SETTINGS, ...stored.settings };
    }
  } catch {
    // Extension context not available (e.g., in tests)
  }
  return DEFAULT_SETTINGS;
}

function persistSettings(settings: UserSettings): void {
  try {
    chrome.storage.local.set({ settings }).catch(() => {});
  } catch {
    // Extension context not available
  }
}

export const useAuditStore = create<AuditStore>((set, get) => {
  // Load persisted settings on store creation
  loadPersistedSettings().then((settings) => set({ settings }));

  return {
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
      set((state) => {
        const updated = { ...state.settings, ...partial };
        persistSettings(updated);
        return { settings: updated };
      }),

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
          const cookieResponse = await chrome.runtime.sendMessage({
            type: 'GET_HTTPONLY_COOKIES',
            url,
          });
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
        // biome-ignore lint/suspicious/noConsole: error logging needed for debugging extension failures
        console.error('Audit failed:', err);
        set({ status: 'error', errorType: 'no-headers' });
      }
    },

    reloadAndRerun: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const tabId = tab.id;
          await chrome.tabs.reload(tabId);
          // Wait for the tab to finish loading before re-running audit
          const RELOAD_TIMEOUT_MS = 15_000;
          const timeoutId = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            get().runAudit();
          }, RELOAD_TIMEOUT_MS);
          const listener = (updatedTabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
              clearTimeout(timeoutId);
              chrome.tabs.onUpdated.removeListener(listener);
              get().runAudit();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        }
      } catch {
        // Tab may have been closed — attempt audit with whatever state exists
        get().runAudit();
      }
    },
  };
});
