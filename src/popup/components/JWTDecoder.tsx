import { useAuditStore } from '@/popup/store/useAuditStore';
import type { JWTAnalysis } from '@/types';

const EXPIRY_STYLES = {
  valid: 'text-green-700 dark:text-green-400',
  expired: 'text-red-700 dark:text-red-400',
  'not-yet-valid': 'text-amber-700 dark:text-amber-400',
  'no-expiry': 'text-amber-700 dark:text-amber-400',
};

interface Props {
  analysis: JWTAnalysis;
}

function ClaimsTable({
  claims,
  sensitive,
  highlight,
}: {
  claims: Record<string, unknown>;
  sensitive: string[];
  highlight: boolean;
}) {
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
      {Object.entries(claims).map(([key, value]) => {
        const isSensitive = highlight && sensitive.includes(key);
        return (
          <div
            key={key}
            className={`flex gap-2 px-2 py-1 border-b last:border-0 border-gray-100 dark:border-gray-800 ${isSensitive ? 'bg-amber-50 dark:bg-amber-950' : ''}`}
          >
            <span
              className={`font-mono w-28 shrink-0 ${isSensitive ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {key}
            </span>
            <span className="font-mono text-gray-800 dark:text-gray-200 break-all">
              {JSON.stringify(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function JWTDecoder({ analysis }: Props) {
  const { settings } = useAuditStore();

  if (analysis.decodeError) {
    return (
      <div className="px-3 pb-3">
        <p className="text-xs text-red-600 dark:text-red-400">{analysis.decodeError}</p>
      </div>
    );
  }

  if (analysis.raw.httpOnly) {
    return (
      <div className="px-3 pb-3 text-xs text-gray-500 dark:text-gray-400">
        This cookie is HttpOnly — its value is not accessible to JavaScript by design.
      </div>
    );
  }

  return (
    <div className="px-3 pb-3 space-y-2">
      <p className="text-xs text-gray-400 italic">Signature not verified</p>

      <div className="flex gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          {analysis.header && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Header
              </p>
              <ClaimsTable
                claims={analysis.header as Record<string, unknown>}
                sensitive={[]}
                highlight={false}
              />
            </div>
          )}

          {analysis.payload && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Payload
              </p>
              <ClaimsTable
                claims={analysis.payload as Record<string, unknown>}
                sensitive={analysis.sensitiveClaims}
                highlight={settings.highlightSensitiveClaims}
              />
            </div>
          )}
        </div>

        <div className="w-32 shrink-0 space-y-2">
          <div className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Expiry
            </p>
            <p className={`text-xs font-medium ${EXPIRY_STYLES[analysis.expiryStatus]}`}>
              {analysis.expiryLabel}
            </p>
          </div>

          {analysis.sensitiveClaims.length > 0 && settings.highlightSensitiveClaims && (
            <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase mb-1">
                Sensitive
              </p>
              {analysis.sensitiveClaims.map((claim) => (
                <span
                  key={claim}
                  className="inline-block text-xs font-mono bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded px-1 py-0.5 mr-1 mb-1"
                >
                  {claim}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
