import React, { useState, useEffect } from 'react';
import { ShoppingCart, BarChart3, Sun, Moon } from 'lucide-react';
import Home from './Home';
import GlandFinder from './GlandFinder';
import FixtureFinder from './FixtureFinder';
import RFQScanButton from './RFQScanButton';
import Footer from './Footer';
import { CartProvider, useCart } from './CartContext';
import CartDrawer from './CartDrawer';
import CartToasts from './CartToasts';
import AnalyticsDashboard from './AnalyticsDashboard';

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center justify-center h-9 w-9 rounded-sm border border-line text-ink-soft hover:text-red hover:border-red transition-colors cursor-pointer"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function CartButton({ onClick }) {
  const { count, bump } = useCart();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (bump === 0) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 400);
    return () => clearTimeout(t);
  }, [bump]);

  return (
    <button onClick={onClick} className="relative flex items-center gap-2 text-ink hover:text-red transition-colors cursor-pointer">
      <ShoppingCart className={`h-6 w-6 ${pulse ? 'cart-badge-pulse' : ''}`} />
      {count > 0 && (
        <span className={`absolute -top-2 -right-2 bg-red text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center mono ${pulse ? 'cart-badge-pulse' : ''}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

function AppShell() {
  const [view, setView] = useState('home'); // 'home' | 'glands' | 'linear' | 'baylight' | 'floodlight'
  const [cartOpen, setCartOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-ink selection:text-paper flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-12 py-3.5 border-b border-ink bg-panel">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img src="/fixtures/logo-elsewedy.png" alt="Logo" className="h-10 w-auto" />
        </button>
        <div className="flex items-center gap-5">
          <ThemeToggle />
          <RFQScanButton />
          <CartButton onClick={() => setCartOpen(true)} />
        </div>
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
      <CartToasts />

      <button
        onClick={() => setAnalyticsOpen(true)}
        title="Data Analytics"
        className="fixed bottom-5 right-5 z-40 flex items-center justify-center h-12 w-12 rounded-full bg-ink text-paper border border-ink shadow-lg hover:bg-red hover:border-red transition-colors cursor-pointer"
      >
        <BarChart3 className="h-5 w-5" />
      </button>
      <AnalyticsDashboard open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
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
