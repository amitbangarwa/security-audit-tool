import { useAuditStore } from '@/popup/store/useAuditStore';
import type { HeaderAuditResult } from '@/types';
import { HeaderRow } from './HeaderRow';

const ORDER: HeaderAuditResult['status'][] = ['missing', 'fail', 'warn', 'pass', 'na'];

export function HeadersTab() {
  const { headerResults, settings, isHttps, injectionFailed } = useAuditStore();

  const sorted = [...headerResults].sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)
  );
  const filtered = settings.showPassingHeaders ? sorted : sorted.filter((r) => r.status !== 'pass');

  return (
    <div className="px-3 py-3 space-y-1 overflow-y-auto" style={{ maxHeight: 400 }}>
      {!isHttps && (
        <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-xs text-red-700 dark:text-red-300">
          Warning: Site is served over HTTP — score capped at 40. HSTS has no effect.
        </div>
      )}
      {injectionFailed && (
        <div className="mb-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-xs text-amber-700 dark:text-amber-300">
          Warning: Storage scan unavailable — page CSP blocked script injection. Header audit is
          complete but JWTs could not be scanned.
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">All headers passing.</p>
      ) : (
        filtered.map((r) => (
          <HeaderRow
            key={r.headerName}
            result={r}
            expandByDefault={settings.expandRawValuesByDefault}
          />
        ))
      )}
    </div>
  );
}
