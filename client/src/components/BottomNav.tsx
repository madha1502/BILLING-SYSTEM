import React from 'react';
import { Home, Receipt, Package, BarChart3, PlusCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface BottomNavProps {
  activeTab: 'home' | 'bill' | 'stock' | 'reports';
  setActiveTab: (tab: 'home' | 'bill' | 'stock' | 'reports') => void;
  openBilling: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, openBilling }) => {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-40 flex items-center justify-around shadow-lg">
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
          activeTab === 'home' ? 'text-kirana-700 font-bold' : 'text-gray-500 font-medium'
        }`}
      >
        <Home className="w-6 h-6" />
        <span className="text-xs mt-0.5">{t('stock') === 'இருப்பு' ? 'முகப்பு' : 'Home'}</span>
      </button>

      <button
        onClick={() => setActiveTab('stock')}
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
          activeTab === 'stock' ? 'text-kirana-700 font-bold' : 'text-gray-500 font-medium'
        }`}
      >
        <Package className="w-6 h-6" />
        <span className="text-xs mt-0.5">{t('stock')}</span>
      </button>

      {/* Prominent Central Floating New Bill Button */}
      <button
        onClick={openBilling}
        className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-kirana-600 to-kirana-500 text-white rounded-full p-3.5 shadow-lg active:scale-95 transition-transform border-4 border-white"
        aria-label="New Bill"
      >
        <PlusCircle className="w-8 h-8 text-yellow-300" />
      </button>

      <button
        onClick={() => setActiveTab('bill')}
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
          activeTab === 'bill' ? 'text-kirana-700 font-bold' : 'text-gray-500 font-medium'
        }`}
      >
        <Receipt className="w-6 h-6" />
        <span className="text-xs mt-0.5">{t('bills')}</span>
      </button>

      <button
        onClick={() => setActiveTab('reports')}
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
          activeTab === 'reports' ? 'text-kirana-700 font-bold' : 'text-gray-500 font-medium'
        }`}
      >
        <BarChart3 className="w-6 h-6" />
        <span className="text-xs mt-0.5">{t('todayReport')}</span>
      </button>
    </nav>
  );
};
