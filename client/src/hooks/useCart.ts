import { useState, useCallback } from 'react';

export interface CartItem {
  id: string; // Product ID
  name: string;
  localName?: string;
  unit: string;
  sellingPrice: number;
  purchasePrice: number;
  taxRate: number;
  quantity: number;
  subtotal: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');

  const addItem = useCallback((product: any, qtyToAdd: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + qtyToAdd;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: Math.round(product.sellingPrice * newQty * 100) / 100,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          localName: product.localName,
          unit: product.unit || 'PIECE',
          sellingPrice: product.sellingPrice,
          purchasePrice: product.purchasePrice || 0,
          taxRate: product.taxRate || 0,
          quantity: qtyToAdd,
          subtotal: Math.round(product.sellingPrice * qtyToAdd * 100) / 100,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== productId));
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          return {
            ...item,
            quantity,
            subtotal: Math.round(item.sellingPrice * quantity * 100) / 100,
          };
        }
        return item;
      })
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setCustomerPhone('');
    setPaymentMethod('CASH');
  }, []);

  // Compute Cart Totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const netSubtotal = Math.max(0, subtotal - discount);
  const taxAmount = items.reduce((sum, item) => {
    const itemSub = Math.round(item.sellingPrice * item.quantity * 100) / 100;
    return sum + Math.round(((itemSub * item.taxRate) / 100) * 100) / 100;
  }, 0);
  const totalAmount = netSubtotal + taxAmount;

  return {
    items,
    discount,
    customerPhone,
    paymentMethod,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setDiscount,
    setCustomerPhone,
    setPaymentMethod,
  };
}
