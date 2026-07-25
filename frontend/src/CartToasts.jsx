import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from './CartContext';

export default function CartToasts() {
  const { toasts } = useCart();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="cart-toast flex items-center gap-2 bg-ink text-white px-4 py-2.5 rounded-sm shadow-lg text-sm mono"
        >
          <CheckCircle2 className="h-4 w-4 text-red flex-shrink-0" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
