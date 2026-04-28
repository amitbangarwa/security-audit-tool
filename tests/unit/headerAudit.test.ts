import { describe, expect, it } from 'vitest';
import { applyCspReportOnlyOverride, HEADER_RULES } from '@/constants/headers';

// biome-ignore lint/style/noNonNullAssertion: test setup - rules are known to exist
const cspRule = HEADER_RULES.find((r) => r.name === 'content-security-policy')!;
// biome-ignore lint/style/noNonNullAssertion: test setup - rules are known to exist
const hstsRule = HEADER_RULES.find((r) => r.name === 'strict-transport-security')!;
// biome-ignore lint/style/noNonNullAssertion: test setup - rules are known to exist
const xcoRule = HEADER_RULES.find((r) => r.name === 'x-content-type-options')!;

describe('CSP header rule', () => {
  it('passes a valid CSP with no unsafe directives', () => {
    const result = cspRule.evaluate("default-src 'self'; script-src 'self'");
    expect(result.status).toBe('pass');
    expect(result.score).toBe(20);
  });

  it('warns when unsafe-inline is present', () => {
    const result = cspRule.evaluate("default-src 'self'; script-src 'unsafe-inline'");
    expect(result.status).toBe('warn');
    expect(result.score).toBe(10);
  });

  it('fails when both unsafe-inline and unsafe-eval are present', () => {
    const result = cspRule.evaluate("script-src 'unsafe-inline' 'unsafe-eval'");
    expect(result.status).toBe('fail');
    expect(result.score).toBe(0);
  });

  it('marks as missing when header is null', () => {
    const result = cspRule.evaluate(null);
    expect(result.status).toBe('missing');
    expect(result.score).toBe(0);
  });
});

describe('HSTS header rule', () => {
  it('passes with max-age >= 1 year and includeSubDomains', () => {
    const result = hstsRule.evaluate('max-age=31536000; includeSubDomains; preload');
    expect(result.status).toBe('pass');
  });

  it('warns when max-age is too short', () => {
    const result = hstsRule.evaluate('max-age=86400');
    expect(result.status).toBe('warn');
  });

  it('marks as missing when null', () => {
    expect(hstsRule.evaluate(null).status).toBe('missing');
  });
});

describe('X-Content-Type-Options rule', () => {
  it('passes for nosniff', () => {
    expect(xcoRule.evaluate('nosniff').status).toBe('pass');
  });

  it('warns for any other value', () => {
    expect(xcoRule.evaluate('sniff').status).toBe('warn');
  });
});

// biome-ignore lint/style/noNonNullAssertion: test setup - rule is known to exist
const xfoRule = HEADER_RULES.find((r) => r.name === 'x-frame-options')!;

describe('X-Frame-Options + CSP frame-ancestors interplay', () => {
  it('passes when X-Frame-Options is missing but CSP frame-ancestors is present', () => {
    const result = xfoRule.evaluate(null, {
      'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
    });
    expect(result.status).toBe('pass');
    expect(result.score).toBe(10);
  });

  it('marks as missing when both X-Frame-Options and frame-ancestors are absent', () => {
    const result = xfoRule.evaluate(null, {});
    expect(result.status).toBe('missing');
    expect(result.score).toBe(0);
  });
});

describe('CSP-Report-Only override', () => {
  it('overrides CSP result to warn when only report-only is set', () => {
    const results = HEADER_RULES.map((r) => r.evaluate(null));
    const overridden = applyCspReportOnlyOverride(results, {
      'content-security-policy-report-only': "default-src 'self'",
    });
    const csp = overridden.find((r) => r.headerName === 'content-security-policy');
    expect(csp?.status).toBe('warn');
    expect(csp?.score).toBe(10);
  });
});
