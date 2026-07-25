import React, { useState } from 'react';
import { X, Trash2, Loader2, ShoppingCart } from 'lucide-react';
import { useCart } from './CartContext';
import { exportCartSheet } from './cartExport';

export default function CartDrawer({ open, onClose }) {
  const { items, removeItem, updateQty, clearCart } = useCart();
  const [srNo, setSrNo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  if (!open) return null;

  const total = items.reduce((sum, i) => sum + (i.price != null ? i.price * i.qty : 0), 0);
  const hasUnpriced = items.some((i) => i.price == null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCartSheet(items, { srNo });
    } catch (e) {
      console.error('Cart export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] bg-panel border-l border-ink h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-red" />
            <h3 className="text-lg font-semibold text-ink display">Cart</h3>
            <span className="text-xs bg-panel-2 border border-line px-2 py-0.5 rounded-sm mono text-ink-soft">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-ink-faint text-sm mt-16">
              <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-30" />
              Your cart is empty. Add glands or fixtures from their finder pages.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="border border-line rounded-sm p-3 bg-panel-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase mono bg-panel border border-line px-1.5 py-0.5 rounded-sm text-ink-faint">
                        {item.type}
                      </span>
                    </div>
                    <div className="font-bold text-ink text-sm mt-1 truncate">{item.reference}</div>
                    <div className="text-xs text-ink-soft mt-0.5 truncate">{item.description}</div>
                    <div className="text-xs mono text-ink-faint mt-1">
                      {item.price != null ? `$${item.price.toLocaleString()} / ea` : 'no price set'}
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-ink-faint hover:text-red flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-ink-faint mono">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateQty(item.id, e.target.value)}
                    className="w-16 px-2 py-1 text-sm rounded-sm border border-line bg-panel focus:ring-2 focus:ring-red focus:border-red outline-none"
                  />
                  {item.price != null && (
                    <span className="ml-auto text-xs font-semibold text-ink mono">
                      ${(item.price * item.qty).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-5 py-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-faint">Estimated total</span>
              <span className="font-bold text-ink text-lg">${total.toLocaleString()}</span>
            </div>
            {hasUnpriced && (
              <p className="text-[11px] text-ink-faint italic">Some items have no price set — total excludes those.</p>
            )}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">SR No. (optional)</label>
              <input
                type="text"
                placeholder="e.g. 533-2026-AM-23023"
                value={srNo}
                onChange={(e) => setSrNo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-sm border border-line bg-panel-2 focus:ring-2 focus:ring-red focus:border-red outline-none focus:bg-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="px-4 py-2.5 border border-line rounded-sm text-ink-soft hover:border-ink text-xs mono"
              >
                Clear cart
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 px-4 py-2.5 bg-ink text-white font-semibold rounded-sm hover:bg-red transition-colors mono text-sm flex items-center justify-center gap-2"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Export cart (.xlsx)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
