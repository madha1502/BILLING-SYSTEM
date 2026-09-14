import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { apiRequest } from '../services/api';
import { BarChart3, TrendingUp, DollarSign, Wallet, ArrowDownRight, RefreshCw } from 'lucide-react';

export const ReportsPage = () => {
  const { t } = useLanguage();
  const [profitData, setProfitData] = useState<any>(null);
  const [dayCloseData, setDayCloseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const profit = await apiRequest('/reports/profit');
      const dayClose = await apiRequest('/reports/day-close?openingCash=500');
      setProfitData(profit.financials);
      setDayCloseData(dayClose);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>{t('todayReport')} & Financials</span>
        </h2>
        <button
          onClick={loadReports}
          className="p-2 bg-gray-100 rounded-xl text-gray-600 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Net Profit Summary Card */}
      {profitData && (
        <div className="bg-gradient-to-br from-kirana-700 to-kirana-900 text-white rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-kirana-600/60 pb-3">
            <div>
              <span className="text-xs text-kirana-200 font-bold uppercase tracking-wider">{t('netProfit')}</span>
              <p className="text-3xl font-black tracking-tight text-yellow-300 mt-1">
                ₹{profitData.netProfit.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-yellow-400/20 text-yellow-300 p-3 rounded-2xl">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/10 p-2.5 rounded-xl">
              <span className="text-kirana-200 block">Gross Sales</span>
              <span className="font-extrabold text-sm text-white">₹{profitData.grossSales}</span>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl">
              <span className="text-kirana-200 block">COGS (Stock Cost)</span>
              <span className="font-extrabold text-sm text-white">₹{profitData.costOfGoodsSold}</span>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl">
              <span className="text-kirana-200 block">Gross Profit</span>
              <span className="font-extrabold text-sm text-yellow-200">₹{profitData.grossProfit}</span>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl">
              <span className="text-kirana-200 block">Operating Expenses</span>
              <span className="font-extrabold text-sm text-amber-200">₹{profitData.operatingExpenses}</span>
            </div>
          </div>
        </div>
      )}

      {/* Day Close Cash Reconciliation Card */}
      {dayCloseData && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-kirana-600" />
            <span>Day Close Cash Reconciliation</span>
          </h3>

          <div className="space-y-2 text-xs divide-y divide-gray-100">
            <div className="flex justify-between pt-1">
              <span className="text-gray-500">Opening Cash</span>
              <span className="font-bold text-gray-800">₹{dayCloseData.openingCash}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-500">+ Today's Cash Sales</span>
              <span className="font-bold text-kirana-700">+ ₹{dayCloseData.cashSales}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-500">- Cash Expenses</span>
              <span className="font-bold text-red-600">- ₹{dayCloseData.cashExpenses}</span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-black text-gray-900">
              <span>Expected Cash in Till</span>
              <span className="text-kirana-700">₹{dayCloseData.expectedClosingCash}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
