import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'cart_items_v1';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitial);
  const [toasts, setToasts] = useState([]);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — cart just won't persist across reloads
    }
  }, [items]);

  const pushToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  };

  const addItem = (item) => {
    // item: { id, type: 'gland' | 'fixture', reference, description, price, raw }
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + (item.qty || 1) } : i));
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
    pushToast(`Added ${item.reference} to cart`);
    setBump((b) => b + 1);
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id, qty) => {
    const n = Math.max(1, parseInt(qty, 10) || 1);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: n } : i)));
  };

  const clearCart = () => setItems([]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, count, toasts, bump }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
