import { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { BillingPage } from './pages/BillingPage';
import { StockPage } from './pages/StockPage';
import { ReportsPage } from './pages/ReportsPage';
import { apiRequest, syncOfflineSales } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'bill' | 'stock' | 'reports'>('home');
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [billingMode, setBillingMode] = useState<'manual' | 'barcode' | 'voice'>('manual');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dashboardSummary, setDashboardSummary] = useState({
    todaySalesVolume: 12450,
    billsCount: 47,
    lowStockCount: 8,
  });

  const loadSummary = async () => {
    try {
      const summary = await apiRequest('/reports/today');
      setDashboardSummary(summary);
    } catch (err) {
      console.warn('Using local summary cache offline');
    }
  };

  useEffect(() => {
    loadSummary();

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineSales();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const openBilling = (mode: 'manual' | 'barcode' | 'voice' = 'manual') => {
    setBillingMode(mode);
    setIsBillingOpen(true);
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-100 max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
        <Header isOnline={isOnline} />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && (
            <DashboardPage
              onOpenBilling={openBilling}
              onNavigateTab={setActiveTab}
              summary={dashboardSummary}
            />
          )}

          {activeTab === 'stock' && <StockPage />}

          {activeTab === 'reports' && <ReportsPage />}

          {activeTab === 'bill' && (
            <div className="p-4 text-center">
              <button
                onClick={() => openBilling('manual')}
                className="w-full btn-touch bg-kirana-600 text-white font-extrabold text-lg"
              >
                🧾 Open Billing Screen
              </button>
            </div>
          )}
        </main>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openBilling={() => openBilling('manual')}
        />

        {/* Fullscreen Mobile Billing Modal */}
        {isBillingOpen && (
          <BillingPage
            initialMode={billingMode}
            onClose={() => setIsBillingOpen(false)}
            onBillSuccess={loadSummary}
          />
        )}
      </div>
    </LanguageProvider>
  );
}

export default App;
