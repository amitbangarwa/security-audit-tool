import { useAuditStore } from '@/popup/store/useAuditStore';

const TABS = [
  { id: 'headers' as const, label: 'Headers' },
  { id: 'jwts' as const, label: 'JWTs' },
  { id: 'settings' as const, label: 'Settings' },
];

export function TabBar() {
  const { activeTab, setActiveTab, headerResults, jwtAnalyses } = useAuditStore();

  const badges: Record<string, number | undefined> = {
    headers:
      headerResults.filter((r) => r.status === 'fail' || r.status === 'missing').length ||
      undefined,
    jwts: jwtAnalyses.filter((j) => !j.raw.httpOnly).length || undefined,
  };

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {TABS.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-2 text-xs font-medium relative transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {tab.label}
          {badges[tab.id] ? (
            <span className="ml-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs px-1.5 rounded-full font-semibold">
              {badges[tab.id]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
