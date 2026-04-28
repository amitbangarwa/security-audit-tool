import { applyCspReportOnlyOverride, HEADER_RULES } from '@/constants/headers';
import type { HeaderAuditResult } from '@/types';

export function auditHeaders(rawHeaders: Record<string, string>): HeaderAuditResult[] {
  let results = HEADER_RULES.map((rule) => {
    const value = rawHeaders[rule.name] ?? null;
    return rule.evaluate(value, rawHeaders);
  });

  // Apply special rule: CSP-Report-Only without enforced CSP
  results = applyCspReportOnlyOverride(results, rawHeaders);

  return results;
}
