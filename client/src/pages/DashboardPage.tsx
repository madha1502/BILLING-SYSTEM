import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Receipt, Camera, Mic, Package, BarChart2, AlertTriangle, TrendingUp, ShoppingBag } from 'lucide-react';

interface DashboardPageProps {
  onOpenBilling: (mode?: 'manual' | 'barcode' | 'voice') => void;
  onNavigateTab: (tab: 'home' | 'bill' | 'stock' | 'reports') => void;
  summary: {
    todaySalesVolume: number;
    billsCount: number;
    lowStockCount: number;
  };
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenBilling,
  onNavigateTab,
  summary,
}) => {
  const { t } = useLanguage();

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800">{t('goodMorning')}</h2>
          <p className="text-xs text-kirana-700 font-bold">வினிஷா நெல்லை ஸ்டோர்ஸ் — காங்கேயம்</p>
        </div>
        <div className="bg-kirana-50 text-kirana-700 px-3 py-1.5 rounded-full text-xs font-bold border border-kirana-200">
          🇮🇳 INR (₹)
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today Sales Volume */}
        <div className="bg-gradient-to-br from-kirana-600 to-kirana-700 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-kirana-100 uppercase tracking-wider">{t('todaySales')}</span>
            <div className="bg-white/20 p-1.5 rounded-lg">
              <TrendingUp className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight">₹{summary.todaySalesVolume.toLocaleString('en-IN')}</span>
            <p className="text-[11px] text-kirana-100 mt-0.5">14 Sep 2026</p>
          </div>
        </div>

        {/* Bills & Low Stock Summary */}
        <div className="space-y-2">
          {/* Bills Count Card */}
          <div
            onClick={() => onNavigateTab('bill')}
            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-95 transition-transform cursor-pointer"
          >
            <div>
              <span className="text-xs text-gray-500 font-bold uppercase">{t('bills')}</span>
              <p className="text-xl font-black text-gray-800">{summary.billsCount}</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          {/* Low Stock Warning Card */}
          <div
            onClick={() => onNavigateTab('stock')}
            className="bg-amber-50 border border-amber-200 p-3 rounded-2xl shadow-sm flex items-center justify-between active:scale-95 transition-transform cursor-pointer"
          >
            <div>
              <span className="text-xs text-amber-800 font-bold uppercase">{t('lowStock')}</span>
              <p className="text-xl font-black text-amber-900">{summary.lowStockCount}</p>
            </div>
            <div className="bg-amber-500 text-white p-2 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Touch Action Matrix */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          {t('stock') === 'இருப்பு' ? 'வேகமான நடவடிக்கைகள்' : 'Quick Actions'}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {/* 🧾 NEW BILL */}
          <button
            onClick={() => onOpenBilling('manual')}
            className="bg-kirana-600 hover:bg-kirana-700 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center space-y-2 min-h-[95px]"
          >
            <Receipt className="w-8 h-8 text-yellow-300" />
            <span className="font-extrabold text-sm tracking-wide">{t('newBill')}</span>
          </button>

          {/* 📷 SCAN */}
          <button
            onClick={() => onOpenBilling('barcode')}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center space-y-2 min-h-[95px]"
          >
            <Camera className="w-8 h-8 text-blue-200" />
            <span className="font-extrabold text-sm tracking-wide">{t('scanBarcode')}</span>
          </button>

          {/* 🎤 VOICE */}
          <button
            onClick={() => onOpenBilling('voice')}
            className="bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center space-y-2 min-h-[95px]"
          >
            <Mic className="w-8 h-8 text-yellow-200" />
            <span className="font-extrabold text-sm tracking-wide">{t('voiceBill')}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* 📦 STOCK */}
          <button
            onClick={() => onNavigateTab('stock')}
            className="bg-white border border-gray-200 text-gray-800 p-3.5 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-2 font-bold"
          >
            <Package className="w-5 h-5 text-kirana-600" />
            <span>{t('stock')}</span>
          </button>

          {/* 📊 TODAY */}
          <button
            onClick={() => onNavigateTab('reports')}
            className="bg-white border border-gray-200 text-gray-800 p-3.5 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-2 font-bold"
          >
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <span>{t('todayReport')}</span>
          </button>
        </div>
      </div>

      {/* Quick Favorite Items Banner */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('favorites')}</h4>
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onOpenBilling('manual')}
            className="flex-none bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-left active:scale-95 transition-all"
          >
            <p className="font-bold text-sm text-gray-800">🍚 அரிசி (Ponni)</p>
            <p className="text-xs text-kirana-700 font-semibold">₹50 / kg</p>
          </button>

          <button
            onClick={() => onOpenBilling('manual')}
            className="flex-none bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-left active:scale-95 transition-all"
          >
            <p className="font-bold text-sm text-gray-800">🛢 எண்ணெய் (GW 1L)</p>
            <p className="text-xs text-kirana-700 font-semibold">₹180 / pkt</p>
          </button>

          <button
            onClick={() => onOpenBilling('manual')}
            className="flex-none bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-left active:scale-95 transition-all"
          >
            <p className="font-bold text-sm text-gray-800">🧼 ஹமாம் சோப்</p>
            <p className="text-xs text-kirana-700 font-semibold">₹30 / pc</p>
          </button>
        </div>
      </div>
    </div>
  );
};
