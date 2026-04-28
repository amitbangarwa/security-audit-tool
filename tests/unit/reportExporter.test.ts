import { describe, expect, it } from 'vitest';
import { buildReport } from '@/lib/reportExporter';
import type { AuditState } from '@/types';

const baseState: AuditState = {
  status: 'complete',
  url: 'https://example.com',
  isHttps: true,
  headerResults: [
    {
      headerName: 'content-security-policy',
      displayName: 'Content-Security-Policy',
      status: 'pass',
      value: "default-src 'self'",
      message: 'CSP is set with no unsafe directives detected.',
      recommendation: '',
      weight: 20,
      score: 20,
    },
    {
      headerName: 'x-frame-options',
      displayName: 'X-Frame-Options',
      status: 'missing',
      value: null,
      message: 'Header not set.',
      recommendation: 'Add: X-Frame-Options: DENY',
      weight: 10,
      score: 0,
    },
  ],
  jwtAnalyses: [],
  score: { total: 75, band: 'attention', httpsCapApplied: false },
  errorType: null,
  injectionFailed: false,
  lastAuditTime: Date.now(),
};

describe('buildReport', () => {
  it('generates a markdown report with headers section', () => {
    const report = buildReport(baseState);
    expect(report).toContain('# Security Audit Report');
    expect(report).toContain('**URL:** https://example.com');
    expect(report).toContain('**Score:** 75 / 100 (attention)');
    expect(report).toContain('**HTTPS:** Yes');
  });

  it('includes pass/fail icons for header results', () => {
    const report = buildReport(baseState);
    expect(report).toContain('**Content-Security-Policy:** PASS');
    expect(report).toContain('**X-Frame-Options:** MISSING');
  });

  it('shows "No JWTs detected" when there are none', () => {
    const report = buildReport(baseState);
    expect(report).toContain('No JWTs detected.');
  });

  it('lists JWTs when present', () => {
    const stateWithJwts: AuditState = {
      ...baseState,
      jwtAnalyses: [
        {
          raw: { source: 'localStorage', key: 'access_token', token: 'eyJ...' },
          header: { alg: 'HS256', typ: 'JWT' },
          payload: { sub: '123' },
          expiryStatus: 'expired',
          expiryLabel: 'Expired 2 days ago',
          sensitiveClaims: ['sub'],
          decodeError: null,
        },
      ],
    };
    const report = buildReport(stateWithJwts);
    expect(report).toContain('**access_token** (localStorage)');
    expect(report).toContain('Expired 2 days ago');
  });

  it('shows HTTPS: No for HTTP sites', () => {
    const report = buildReport({ ...baseState, isHttps: false });
    expect(report).toContain('**HTTPS:** No');
  });
});
