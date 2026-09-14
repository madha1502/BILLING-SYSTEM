import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe, Store, Wifi, WifiOff } from 'lucide-react';

export const Header: React.FC<{ isOnline?: boolean }> = ({ isOnline = true }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-kirana-700 text-white px-4 py-3 sticky top-0 z-40 shadow-md flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Store className="w-6 h-6 text-yellow-300" />
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide">Vinisha Nellai Stores</h1>
          <p className="text-xs text-kirana-100 font-medium">காங்கேயம் — Kangeyam</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Network Status Badge */}
        <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-semibold ${isOnline ? 'bg-kirana-800 text-green-200' : 'bg-amber-800 text-yellow-200'}`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Language Switcher Button */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
          className="flex items-center space-x-1 bg-kirana-800 hover:bg-kirana-900 active:scale-95 px-3 py-1.5 rounded-xl text-xs font-bold border border-kirana-500 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-yellow-300" />
          <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
        </button>
      </div>
    </header>
  );
};
