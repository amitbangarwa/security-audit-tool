import type { AuditState } from '@/types';

export function buildReport(state: AuditState): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [
    '# Security Audit Report',
    `**URL:** ${state.url ?? 'Unknown'}`,
    `**Timestamp:** ${timestamp}`,
    `**Score:** ${state.score?.total ?? 'N/A'} / 100 (${state.score?.band ?? '-'})`,
    `**HTTPS:** ${state.isHttps ? 'Yes' : 'No'}`,
    '',
    '## Headers',
  ];

  for (const r of state.headerResults) {
    const icon = r.status === 'pass' ? '✅' : r.status === 'warn' ? '⚠️' : '❌';
    lines.push(`${icon} **${r.displayName}:** ${r.status.toUpperCase()} — ${r.message}`);
  }

  lines.push('', '## JWTs Found');
  if (state.jwtAnalyses.length === 0) {
    lines.push('No JWTs detected.');
  } else {
    for (const j of state.jwtAnalyses) {
      lines.push(`- **${j.raw.key}** (${j.raw.source}) — ${j.expiryLabel}`);
    }
  }

  return lines.join('\n');
}

export async function copyReportToClipboard(state: AuditState): Promise<void> {
  const text = buildReport(state);
  await navigator.clipboard.writeText(text);
}
