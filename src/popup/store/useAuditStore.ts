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

  updateSettings: (partial) => set((state) => ({ settings: { ...state.settings, ...partial } })),

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
