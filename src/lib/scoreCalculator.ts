import type { HeaderAuditResult, SecurityScore } from '@/types';

export function calculateScore(results: HeaderAuditResult[], isHttps: boolean): SecurityScore {
  let total = results.reduce((sum, r) => sum + r.score, 0);

  // Special penalty: CSP with both unsafe-inline AND unsafe-eval → additional -10
  const cspResult = results.find((r) => r.headerName === 'content-security-policy');
  if (cspResult?.value) {
    const hasUnsafeInline = cspResult.value.includes("'unsafe-inline'");
    const hasUnsafeEval = cspResult.value.includes("'unsafe-eval'");
    if (hasUnsafeInline && hasUnsafeEval) {
      total -= 10;
    }
  }

  // HTTP (not HTTPS): cap total at 40
  const httpsCapApplied = !isHttps && total > 40;
  if (!isHttps) {
    total = Math.min(total, 40);
  }

  const clampedTotal = Math.max(0, Math.min(100, total));

  const band = clampedTotal >= 80 ? 'secure' : clampedTotal >= 50 ? 'attention' : 'risk';

  return { total: clampedTotal, band, httpsCapApplied };
}
