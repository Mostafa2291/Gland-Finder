import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import Home from './Home';
import GlandFinder from './GlandFinder';
import FixtureFinder from './FixtureFinder';
import Footer from './Footer';
import { CartProvider, useCart } from './CartContext';
import CartDrawer from './CartDrawer';

function CartButton({ onClick }) {
  const { count } = useCart();
  return (
    <button onClick={onClick} className="relative flex items-center gap-2 text-ink hover:text-red transition-colors cursor-pointer">
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center mono">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

function AppShell() {
  const [view, setView] = useState('home'); // 'home' | 'glands' | 'linear' | 'baylight' | 'floodlight'
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-ink selection:text-paper flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-12 py-3.5 border-b border-ink bg-panel">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img src="/fixtures/logo-elsewedy.png" alt="Logo" className="h-10 w-auto" />
        </button>
        <CartButton onClick={() => setCartOpen(true)} />
      </header>
      <div className="hazard-bar" />

      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12 flex-1 w-full">
        {view === 'home' && <Home onSelect={setView} />}
        {view === 'glands' && <GlandFinder />}
        {['linear', 'baylight', 'floodlight'].includes(view) && (
          <FixtureFinder category={view} onBack={() => setView('home')} />
        )}
      </main>

      <Footer />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppShell />
    </CartProvider>
  );
}
