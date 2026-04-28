import { useAuditStore } from '@/popup/store/useAuditStore';

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b last:border-0 border-gray-100 dark:border-gray-800">
      <div>
        <p className="text-sm text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
    </div>
  );
}

export function SettingsTab() {
  const { settings, updateSettings } = useAuditStore();

  return (
    <div className="px-4 py-2">
      <Toggle
        label="Show passing headers"
        desc="Display headers that passed the audit"
        checked={settings.showPassingHeaders}
        onChange={(v) => updateSettings({ showPassingHeaders: v })}
      />
      <Toggle
        label="Expand raw values"
        desc="Show raw header values expanded by default"
        checked={settings.expandRawValuesByDefault}
        onChange={(v) => updateSettings({ expandRawValuesByDefault: v })}
      />
      <Toggle
        label="Highlight sensitive JWT claims"
        desc="Highlight claims like sub, email, roles in decoded tokens"
        checked={settings.highlightSensitiveClaims}
        onChange={(v) => updateSettings({ highlightSensitiveClaims: v })}
      />
    </div>
  );
}
