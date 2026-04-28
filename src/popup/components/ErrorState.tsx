import { useAuditStore } from '@/popup/store/useAuditStore';
import type { ErrorType } from '@/types';

const ERROR_COPY: Record<ErrorType, { title: string; body: string; action?: string }> = {
  'internal-page': {
    title: 'Cannot audit this page',
    body: 'Browser internal pages (chrome://) cannot be audited.',
  },
  'local-file': {
    title: 'Cannot audit local files',
    body: 'Open the file via a local development server (e.g. npx serve) to audit it.',
  },
  'no-headers': {
    title: 'No headers captured',
    body: 'Reload the page to capture its response headers, then rerun the audit.',
    action: 'Reload & Rerun',
  },
  'injection-failed': {
    title: 'Storage scan unavailable',
    body: "The page's CSP blocked the content script. Headers were audited; JWTs could not be scanned.",
  },
  offline: {
    title: 'Page is offline',
    body: 'No response headers are available for this page.',
  },
};

export function ErrorState() {
  const { errorType, runAudit, reloadAndRerun } = useAuditStore();
  if (!errorType) return null;
  const copy = ERROR_COPY[errorType];
  const handleAction = errorType === 'no-headers' ? reloadAndRerun : runAudit;

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
        <svg
          className="w-5 h-5 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          role="img"
          aria-label="Error"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{copy.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{copy.body}</p>
      </div>
      {copy.action && (
        <button
          type="button"
          onClick={handleAction}
          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {copy.action}
        </button>
      )}
    </div>
  );
}
