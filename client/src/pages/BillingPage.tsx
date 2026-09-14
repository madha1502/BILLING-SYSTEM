import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useCart } from '../hooks/useCart';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { fetchProducts, completeSale } from '../services/api';
import {
  Mic,
  Camera,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  Banknote,
  Smartphone,
  CreditCard,
  Volume2,
} from 'lucide-react';

interface BillingPageProps {
  initialMode?: 'manual' | 'barcode' | 'voice';
  onClose: () => void;
  onBillSuccess: () => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  initialMode = 'manual',
  onClose,
  onBillSuccess,
}) => {
  const { t, language } = useLanguage();
  const cart = useCart();

  const [inputMode, setInputMode] = useState<'manual' | 'barcode' | 'voice'>(initialMode);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<any | null>(null);

  // Load catalog products
  useEffect(() => {
    fetchProducts(searchQuery).then(setCatalog).catch(console.error);
  }, [searchQuery]);

  // Voice Assistant Hook
  const voice = useVoiceRecognition((text) => {
    console.log('Voice listened:', text);
    // Perform instant search match
    fetchProducts(text).then((matches) => {
      if (matches.length > 0) {
        cart.addItem(matches[0], 1);
      }
    });
  });

  const handleCompleteSale = async () => {
    if (cart.items.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        idempotencyKey: `sync-${Date.now()}`,
        items: cart.items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        discount: cart.discount,
        paymentMethod: cart.paymentMethod,
        customerPhone: cart.customerPhone || undefined,
        totalAmount: cart.totalAmount,
      };

      const res = await completeSale(payload);
      setSuccessModal(res);
      cart.clearCart();
      onBillSuccess();
    } catch (err: any) {
      alert(err.message || 'Could not complete bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col h-full overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-kirana-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <h2 className="font-extrabold text-lg tracking-wide">{t('newBill')}</h2>
          <span className="bg-kirana-800 text-yellow-300 text-xs font-bold px-2 py-0.5 rounded-full">
            {cart.items.length} {t('bills') === 'பில்கள்' ? 'பொருட்கள்' : 'Items'}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded-full bg-kirana-800 text-white active:scale-95">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Input Mode Selector Bar */}
      <div className="bg-white px-4 py-2 border-b border-gray-200 grid grid-cols-3 gap-2">
        <button
          onClick={() => setInputMode('voice')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
            inputMode === 'voice'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>{t('voiceBill')}</span>
        </button>

        <button
          onClick={() => setInputMode('barcode')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
            inputMode === 'barcode'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{t('scanBarcode')}</span>
        </button>

        <button
          onClick={() => setInputMode('manual')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
            inputMode === 'manual'
              ? 'bg-kirana-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>{t('manualEntry')}</span>
        </button>
      </div>

      {/* Mode 1: Voice Billing Assistant Banner */}
      {inputMode === 'voice' && (
        <div className="bg-amber-50 p-4 border-b border-amber-200 flex flex-col items-center justify-center text-center space-y-2">
          <div
            onClick={voice.startListening}
            className={`p-4 rounded-full ${
              voice.isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-amber-500 text-white'
            } shadow-lg cursor-pointer active:scale-95 transition-transform`}
          >
            <Mic className="w-8 h-8" />
          </div>
          <div>
            <p className="font-bold text-sm text-amber-900">
              {voice.isListening ? t('voiceListening') : '🎤 Tap microphone & speak item'}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">{t('voiceExample')}</p>
            {voice.transcript && (
              <p className="text-xs font-black text-kirana-800 mt-1 bg-amber-200/60 px-3 py-1 rounded-lg">
                Voice understood: "{voice.transcript}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Camera Barcode Scanning Overlay */}
      {inputMode === 'barcode' && (
        <div className="bg-blue-900 text-white p-4 flex flex-col items-center justify-center space-y-2 border-b border-blue-800">
          <div className="w-48 h-28 border-2 border-dashed border-yellow-300 rounded-xl flex items-center justify-center bg-black/40">
            <Camera className="w-8 h-8 text-yellow-300 animate-bounce" />
          </div>
          <p className="text-xs font-bold text-blue-200">Align barcode inside the camera box</p>
        </div>
      )}

      {/* Mode 3: Manual Product Search Bar */}
      <div className="p-3 bg-white border-b border-gray-200 flex items-center space-x-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full bg-transparent text-sm font-semibold outline-none placeholder-gray-400"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Content Area: Split View between Catalog Selector & Unified Cart */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Quick Add Product Catalog Cards */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Store Products (Tap to Add)</h4>
          <div className="grid grid-cols-2 gap-2">
            {catalog.map((prod) => (
              <div
                key={prod.id}
                onClick={() => cart.addItem(prod, 1)}
                className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm active:scale-95 transition-transform flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <p className="font-bold text-sm text-gray-900 leading-tight">{prod.name}</p>
                  {prod.localName && (
                    <p className="text-xs text-gray-500 font-medium">{prod.localName}</p>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-kirana-700">₹{prod.sellingPrice}</span>
                  <span className="bg-kirana-50 text-kirana-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-kirana-200">
                    + Add
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unified Cart Items List */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase border-b pb-2">
            Cart Items ({cart.items.length})
          </h4>

          {cart.items.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 italic">
              Your cart is empty. Speak, scan, or tap items above to add.
            </p>
          ) : (
            <div className="space-y-3 divide-y divide-gray-100">
              {cart.items.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      ₹{item.sellingPrice} × {item.quantity} {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 bg-gray-100 rounded-lg active:scale-95"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 bg-kirana-100 text-kirana-800 rounded-lg active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => cart.removeItem(item.id)} className="p-1 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method Selector & Phone Entry */}
        {cart.items.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase">{t('paymentMethod')}</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => cart.setPaymentMethod('CASH')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border transition-all ${
                  cart.paymentMethod === 'CASH'
                    ? 'bg-kirana-600 text-white border-kirana-600 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>{t('cash')}</span>
              </button>

              <button
                onClick={() => cart.setPaymentMethod('UPI')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border transition-all ${
                  cart.paymentMethod === 'UPI'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{t('upi')}</span>
              </button>

              <button
                onClick={() => cart.setPaymentMethod('CARD')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border transition-all ${
                  cart.paymentMethod === 'CARD'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{t('card')}</span>
              </button>
            </div>

            {/* Customer Phone Number for SMS */}
            <div className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <Phone className="w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={cart.customerPhone}
                onChange={(e) => cart.setCustomerPhone(e.target.value)}
                placeholder={t('customerPhone')}
                className="bg-transparent text-xs font-semibold outline-none w-full placeholder-gray-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Billing Summary & Action Button */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Subtotal: ₹{cart.subtotal}</span>
          <span>Tax: ₹{cart.taxAmount}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-black text-gray-900 border-t pt-2">
          <span>{t('total')}</span>
          <span className="text-kirana-700 text-2xl">₹{cart.totalAmount}</span>
        </div>

        <button
          onClick={handleCompleteSale}
          disabled={cart.items.length === 0 || isSubmitting}
          className="w-full btn-touch bg-kirana-600 hover:bg-kirana-700 text-white text-base tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing Bill...' : t('completeBill')}
        </button>
      </div>

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-kirana-100 text-kirana-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">{t('billSuccess')}</h3>
              <p className="text-sm font-bold text-kirana-700 mt-1">Bill Number: {successModal.billNumber}</p>
              <p className="text-2xl font-black text-gray-800 mt-2">₹{successModal.totalAmount}</p>
              {successModal.isOffline && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2 font-medium">
                  ⚡ Saved offline. Will sync automatically when connection returns.
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setSuccessModal(null);
                onClose();
              }}
              className="w-full btn-touch bg-kirana-600 text-white font-bold"
            >
              Done / அடுத்த பில் போட
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
