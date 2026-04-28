import { useAuditStore } from '@/popup/store/useAuditStore';
import { JWTCard } from './JWTCard';

export function JWTTab() {
  const { jwtAnalyses } = useAuditStore();

  if (jwtAnalyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <svg
          className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          role="img"
          aria-label="No JWTs"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">No JWTs detected</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Tokens in HttpOnly cookies are listed but cannot be decoded.
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 overflow-y-auto" style={{ maxHeight: 400 }}>
      {jwtAnalyses.map((a) => (
        <JWTCard key={`${a.raw.source}-${a.raw.key}`} analysis={a} />
      ))}
    </div>
  );
}
