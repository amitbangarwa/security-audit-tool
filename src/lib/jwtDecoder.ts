import { SENSITIVE_CLAIMS } from '@/constants/headers';
import type { ExpiryStatus, JWTAnalysis, JWTHeader, JWTPayload, RawJWT } from '@/types';

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
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
    return {
      status: 'not-yet-valid',
      label: `Not valid until ${new Date(payload.nbf * 1000).toLocaleString()}`,
    };
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
    days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

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
