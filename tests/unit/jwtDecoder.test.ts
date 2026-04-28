import { describe, expect, it } from 'vitest';
import { decodeJWT } from '@/lib/jwtDecoder';
import type { RawJWT } from '@/types';

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
