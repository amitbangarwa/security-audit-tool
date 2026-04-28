import { useState } from 'react';
import { copyReportToClipboard } from '@/lib/reportExporter';
import { useAuditStore } from '@/popup/store/useAuditStore';

export function Footer() {
  const state = useAuditStore();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyReportToClipboard(state);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <button
        type="button"
        onClick={handleCopy}
        disabled={state.status !== 'complete'}
        className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
      >
        {copied ? 'Copied' : 'Copy Report'}
      </button>
      <a
        href="https://owasp.org/www-project-secure-headers/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        OWASP Docs
      </a>
    </div>
  );
}
