import { describe, expect, it } from 'vitest';
import { HEADER_RULES } from '@/constants/headers';

// biome-ignore lint/style/noNonNullAssertion: test setup - rules are known to exist
const referrerRule = HEADER_RULES.find((r) => r.name === 'referrer-policy')!;
// biome-ignore lint/style/noNonNullAssertion: test setup - rules are known to exist
const permissionsRule = HEADER_RULES.find((r) => r.name === 'permissions-policy')!;
// biome-ignore lint/style/noNonNullAssertion: test setup - rules are known to exist
const coopRule = HEADER_RULES.find((r) => r.name === 'cross-origin-opener-policy')!;
// biome-ignore lint/style/noNonNullAssertion: test setup - rules are known to exist
const coepRule = HEADER_RULES.find((r) => r.name === 'cross-origin-embedder-policy')!;
// biome-ignore lint/style/noNonNullAssertion: test setup - rules are known to exist
const corpRule = HEADER_RULES.find((r) => r.name === 'cross-origin-resource-policy')!;

describe('Referrer-Policy rule', () => {
  it('passes for strict-origin-when-cross-origin', () => {
    const result = referrerRule.evaluate('strict-origin-when-cross-origin');
    expect(result.status).toBe('pass');
    expect(result.score).toBe(10);
  });

  it('warns for same-origin', () => {
    const result = referrerRule.evaluate('same-origin');
    expect(result.status).toBe('warn');
    expect(result.score).toBe(5);
  });

  it('fails for unsafe-url', () => {
    const result = referrerRule.evaluate('unsafe-url');
    expect(result.status).toBe('fail');
    expect(result.score).toBe(0);
  });

  it('marks as missing when null', () => {
    expect(referrerRule.evaluate(null).status).toBe('missing');
  });
});

describe('Permissions-Policy rule', () => {
  it('passes with 3+ directives', () => {
    const result = permissionsRule.evaluate('camera=(), microphone=(), geolocation=()');
    expect(result.status).toBe('pass');
    expect(result.score).toBe(10);
  });

  it('warns with fewer than 3 directives', () => {
    const result = permissionsRule.evaluate('camera=()');
    expect(result.status).toBe('warn');
    expect(result.score).toBe(5);
  });

  it('marks as missing when null', () => {
    expect(permissionsRule.evaluate(null).status).toBe('missing');
  });
});

describe('Cross-Origin-Opener-Policy rule', () => {
  it('passes for same-origin', () => {
    const result = coopRule.evaluate('same-origin');
    expect(result.status).toBe('pass');
    expect(result.score).toBe(10);
  });

  it('warns for same-origin-allow-popups', () => {
    const result = coopRule.evaluate('same-origin-allow-popups');
    expect(result.status).toBe('warn');
    expect(result.score).toBe(5);
  });

  it('marks as missing when null', () => {
    expect(coopRule.evaluate(null).status).toBe('missing');
  });
});

describe('Cross-Origin-Embedder-Policy rule', () => {
  it('passes for require-corp', () => {
    const result = coepRule.evaluate('require-corp');
    expect(result.status).toBe('pass');
    expect(result.score).toBe(10);
  });

  it('warns for other values', () => {
    const result = coepRule.evaluate('credentialless');
    expect(result.status).toBe('warn');
    expect(result.score).toBe(5);
  });

  it('marks as missing when null', () => {
    expect(coepRule.evaluate(null).status).toBe('missing');
  });
});

describe('Cross-Origin-Resource-Policy rule', () => {
  it('passes for same-origin', () => {
    const result = corpRule.evaluate('same-origin');
    expect(result.status).toBe('pass');
    expect(result.score).toBe(5);
  });

  it('warns for cross-origin', () => {
    const result = corpRule.evaluate('cross-origin');
    expect(result.status).toBe('warn');
    expect(result.score).toBe(2);
  });

  it('marks as missing when null', () => {
    expect(corpRule.evaluate(null).status).toBe('missing');
  });
});
