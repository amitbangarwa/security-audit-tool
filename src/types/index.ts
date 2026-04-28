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
  score: number;
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
  injectionFailed: boolean;
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
