import { useEffect } from 'react';
import { ErrorState } from './components/ErrorState';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeadersTab } from './components/HeadersTab';
import { JWTTab } from './components/JWTTab';
import { SettingsTab } from './components/SettingsTab';
import { TabBar } from './components/TabBar';
import { useAuditStore } from './store/useAuditStore';

export default function App() {
  const { runAudit, status, activeTab } = useAuditStore();

  useEffect(() => {
    runAudit();
  }, [runAudit]);

  return (
    <div
      className="w-popup bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans antialiased flex flex-col"
      style={{ minHeight: 200, maxHeight: 580 }}
    >
      <Header />
      {status === 'error' ? (
        <ErrorState />
      ) : (
        <>
          <TabBar />
          <div className="flex-1 overflow-hidden">
            {activeTab === 'headers' && <HeadersTab />}
            {activeTab === 'jwts' && <JWTTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </>
      )}
      <Footer />
    </div>
  );
}
