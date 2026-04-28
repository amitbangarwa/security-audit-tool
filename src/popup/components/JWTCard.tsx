import { useState } from 'react';
import type { JWTAnalysis } from '@/types';
import { JWTDecoder } from './JWTDecoder';

const SOURCE_STYLES: Record<string, string> = {
  localStorage: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sessionStorage: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  cookie: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'cookie-httponly': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface Props {
  analysis: JWTAnalysis;
}

export function JWTCard({ analysis }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { raw } = analysis;

  const isExpired = analysis.expiryStatus === 'expired';
  const tokenPrefix = raw.token ? `${raw.token.slice(0, 20)}...` : '';

  return (
    <div
      className={`rounded-md border mb-2 overflow-hidden ${isExpired ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
    >
      <button
        type="button"
        onClick={() => !raw.httpOnly && setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${SOURCE_STYLES[raw.source] ?? SOURCE_STYLES.cookie}`}
        >
          {raw.source}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate block">
            {raw.key}
          </span>
          {tokenPrefix && (
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate block">
              {tokenPrefix}
            </span>
          )}
        </div>
        {isExpired && (
          <span className="text-xs text-red-600 dark:text-red-400 shrink-0">Expired</span>
        )}
        {!raw.httpOnly && (
          <svg
            className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            role="img"
            aria-label="Toggle details"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {expanded && <JWTDecoder analysis={analysis} />}
    </div>
  );
}
