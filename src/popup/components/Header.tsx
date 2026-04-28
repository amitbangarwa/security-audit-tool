import { useAuditStore } from '@/popup/store/useAuditStore';
import { ScoreRing } from './ScoreRing';

export function Header() {
  const { url, score, status, headerResults, runAudit } = useAuditStore();

  const domain = url ? new URL(url).hostname : '\u2014';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Security Audit
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{domain}</p>
      </div>
      <ScoreRing score={score} headerResults={headerResults} />
      <button
        type="button"
        onClick={runAudit}
        disabled={status === 'loading'}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
        title="Rerun audit"
      >
        <svg
          className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          role="img"
          aria-label="Rerun audit"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
