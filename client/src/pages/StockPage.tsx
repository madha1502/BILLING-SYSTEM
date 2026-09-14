import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { fetchProducts, createProduct } from '../services/api';
import { Package, AlertTriangle, Plus, Search, X, CheckCircle2 } from 'lucide-react';

export const StockPage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    localName: '',
    sellingPrice: '',
    purchasePrice: '',
    unit: 'KG',
    currentStock: '',
    minimumStock: '5',
    barcode: '',
  });

  const loadProducts = () => {
    fetchProducts(query).then(setProducts).catch(console.error);
  };

  useEffect(() => {
    loadProducts();
  }, [query]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sellingPrice) {
      alert('Please enter product name and selling price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        localName: formData.localName || undefined,
        sellingPrice: parseFloat(formData.sellingPrice),
        purchasePrice: parseFloat(formData.purchasePrice || formData.sellingPrice),
        unit: formData.unit,
        currentStock: parseFloat(formData.currentStock || '0'),
        minimumStock: parseFloat(formData.minimumStock || '5'),
        barcode: formData.barcode || undefined,
        aliases: [formData.name.toLowerCase(), formData.localName.toLowerCase()].filter(Boolean),
      };

      await createProduct(payload);
      setIsModalOpen(false);
      setFormData({
        name: '',
        localName: '',
        sellingPrice: '',
        purchasePrice: '',
        unit: 'KG',
        currentStock: '',
        minimumStock: '5',
        barcode: '',
      });
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Could not add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = lowStockFilter
    ? products.filter((p) => p.currentStock <= p.minimumStock)
    : products;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 flex items-center space-x-2">
          <Package className="w-6 h-6 text-kirana-600" />
          <span>{t('stock')} Management</span>
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-kirana-600 hover:bg-kirana-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 text-yellow-300" />
          <span>+ Add Item</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search inventory stock..."
          className="w-full bg-transparent text-xs font-semibold outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setLowStockFilter(false)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            !lowStockFilter ? 'bg-kirana-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          All Items ({products.length})
        </button>

        <button
          onClick={() => setLowStockFilter(true)}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
            lowStockFilter
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock ({products.filter((p) => p.currentStock <= p.minimumStock).length})</span>
        </button>
      </div>

      {/* Product List Cards */}
      <div className="space-y-2">
        {filtered.map((prod) => {
          const isLow = prod.currentStock <= prod.minimumStock;
          return (
            <div
              key={prod.id}
              className={`p-3.5 rounded-2xl border shadow-sm flex items-center justify-between bg-white ${
                isLow ? 'border-amber-300 bg-amber-50/40' : 'border-gray-100'
              }`}
            >
              <div>
                <p className="font-bold text-sm text-gray-900">{prod.name}</p>
                {prod.localName && <p className="text-xs text-gray-500">{prod.localName}</p>}
                <p className="text-xs text-kirana-700 font-semibold mt-1">₹{prod.sellingPrice} / {prod.unit}</p>
              </div>

              <div className="text-right">
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                    isLow ? 'bg-amber-500 text-white' : 'bg-kirana-100 text-kirana-800'
                  }`}
                >
                  {prod.currentStock} {prod.unit}
                </span>
                {isLow && (
                  <p className="text-[10px] text-amber-700 font-bold mt-1">⚠️ Minimum: {prod.minimumStock}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-lg text-gray-900">📦 Add New Product</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sugar 1kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold outline-none focus:border-kirana-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tamil Local Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. சர்க்கரை"
                  value={formData.localName}
                  onChange={(e) => setFormData({ ...formData, localName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold outline-none focus:border-kirana-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="45.00"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold outline-none focus:border-kirana-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="40.00"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold outline-none focus:border-kirana-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Unit Type</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold outline-none focus:border-kirana-600"
                  >
                    <option value="KG">KG (கிலோ)</option>
                    <option value="GRAM">GRAM (கிராம்)</option>
                    <option value="PACKET">PACKET (பாக்கெட்)</option>
                    <option value="PIECE">PIECE (பீஸ்)</option>
                    <option value="LITRE">LITRE (லிட்டர்)</option>
                    <option value="BOX">BOX (பாக்ஸ்)</option>
                    <option value="DOZEN">DOZEN (டஜன்)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="50"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold outline-none focus:border-kirana-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Min. Stock Warning</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="5"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold outline-none focus:border-kirana-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Barcode (Optional)</label>
                  <input
                    type="text"
                    placeholder="890..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold outline-none focus:border-kirana-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-touch bg-kirana-600 text-white font-bold text-sm tracking-wide mt-2"
              >
                {isSubmitting ? 'Saving Product...' : 'Save Product / பொருளைச் சேர்'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
