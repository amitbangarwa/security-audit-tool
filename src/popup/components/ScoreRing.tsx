import { useState } from 'react';
import type { HeaderAuditResult, SecurityScore } from '@/types';

interface Props {
  score: SecurityScore | null;
  headerResults?: HeaderAuditResult[];
  size?: number;
}

const BAND_COLORS = {
  secure: { stroke: '#059669', text: '#065F46', bg: '#D1FAE5' },
  attention: { stroke: '#D97706', text: '#92400E', bg: '#FEF3C7' },
  risk: { stroke: '#DC2626', text: '#991B1B', bg: '#FEE2E2' },
};

export function ScoreRing({ score, headerResults = [], size = 56 }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!score) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
      >
        <span className="text-xs text-gray-400">&mdash;</span>
      </div>
    );
  }

  const colors = BAND_COLORS[score.band];
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score.total / 100) * circ;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: tooltip container uses hover/focus for disclosure
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <div
        className="relative flex items-center justify-center cursor-help"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          role="img"
          aria-label={`Score: ${score.total}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colors.bg}
            strokeWidth="5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <span className="absolute text-xs font-semibold" style={{ color: colors.text }}>
          {score.total}
        </span>
      </div>

      {showTooltip && headerResults.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 border-b border-gray-100 dark:border-gray-700 pb-1">
            Score Breakdown
          </p>
          {headerResults.map((r) => (
            <div key={r.headerName} className="flex justify-between text-xs py-0.5">
              <span className="text-gray-600 dark:text-gray-400 truncate mr-2">
                {r.displayName}
              </span>
              <span
                className={`shrink-0 font-mono ${
                  r.score === r.weight
                    ? 'text-green-600 dark:text-green-400'
                    : r.score > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                }`}
              >
                {r.score}/{r.weight}
              </span>
            </div>
          ))}
          {score.httpsCapApplied && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
              HTTP penalty: capped at 40
            </p>
          )}
        </div>
      )}
    </div>
  );
}
