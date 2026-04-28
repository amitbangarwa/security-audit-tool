import { describe, expect, it } from 'vitest';
import { calculateScore } from '@/lib/scoreCalculator';
import type { HeaderAuditResult } from '@/types';

function makeResult(
  status: HeaderAuditResult['status'],
  weight: number,
  score: number
): HeaderAuditResult {
  return {
    headerName: 'test',
    displayName: 'Test',
    status,
    value: null,
    message: '',
    recommendation: '',
    weight,
    score,
  };
}

describe('score calculator', () => {
  it('returns 100 when all headers pass', () => {
    const results = [
      makeResult('pass', 20, 20),
      makeResult('pass', 15, 15),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 5, 5),
    ];
    const score = calculateScore(results, true);
    expect(score.total).toBe(100);
    expect(score.band).toBe('secure');
  });

  it('caps score at 40 for HTTP sites', () => {
    const results = Array(5).fill(makeResult('pass', 20, 20));
    const score = calculateScore(results, false);
    expect(score.total).toBeLessThanOrEqual(40);
    expect(score.httpsCapApplied).toBe(true);
  });

  it('returns risk band for low scores', () => {
    const results = Array(5).fill(makeResult('missing', 20, 0));
    const score = calculateScore(results, true);
    expect(score.band).toBe('risk');
  });

  it('returns attention band for mid scores', () => {
    const results = [
      makeResult('pass', 20, 20),
      makeResult('pass', 15, 15),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('missing', 10, 0),
      makeResult('missing', 10, 0),
      makeResult('missing', 10, 0),
      makeResult('missing', 10, 0),
      makeResult('missing', 5, 0),
    ];
    // Total = 55, which falls in [50, 80) → attention band
    const score = calculateScore(results, true);
    expect(score.band).toBe('attention');
  });

  it('applies additional -10 penalty when CSP has both unsafe-inline and unsafe-eval', () => {
    const cspResult: HeaderAuditResult = {
      headerName: 'content-security-policy',
      displayName: 'Content-Security-Policy',
      status: 'fail',
      value: "script-src 'unsafe-inline' 'unsafe-eval'",
      message: '',
      recommendation: '',
      weight: 20,
      score: 0,
    };
    const otherResults = [
      makeResult('pass', 15, 15),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 10, 10),
      makeResult('pass', 5, 5),
    ];
    const score = calculateScore([cspResult, ...otherResults], true);
    expect(score.total).toBe(70);
    expect(score.band).toBe('attention');
  });
});
