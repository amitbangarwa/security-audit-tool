import { useState } from 'react';
import type { HeaderAuditResult } from '@/types';

const STATUS_STYLES = {
  pass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  fail: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  missing: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  na: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const LEFT_BORDER = {
  pass: 'border-l-2 border-green-400',
  warn: 'border-l-2 border-amber-400',
  fail: 'border-l-2 border-red-500',
  missing: 'border-l-2 border-red-500',
  na: 'border-l-2 border-gray-300',
};

interface Props {
  result: HeaderAuditResult;
  expandByDefault?: boolean;
}

export function HeaderRow({ result, expandByDefault = false }: Props) {
  const [expanded, setExpanded] = useState(expandByDefault);

  return (
    <div className={`${LEFT_BORDER[result.status]} bg-white dark:bg-gray-900 rounded-r-md mb-1`}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[result.status]}`}
        >
          {result.status.toUpperCase()}
        </span>
        <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate flex-1">
          {result.displayName}
        </span>
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
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">{result.message}</p>
          {result.value && (
            <code className="block text-xs bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 font-mono text-gray-700 dark:text-gray-300 break-all">
              {result.value}
            </code>
          )}
          {result.recommendation && (
            <div className="flex gap-1.5">
              <span className="text-amber-500 text-xs shrink-0 mt-0.5">→</span>
              <p className="text-xs text-amber-700 dark:text-amber-400">{result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
