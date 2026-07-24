import React, { useState } from 'react';
import Home from './Home';
import GlandFinder from './GlandFinder';
import FixtureFinder from './FixtureFinder';

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'glands' | 'linear' | 'baylight' | 'floodlight'

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-ink selection:text-paper">
      <header className="flex items-center justify-between px-6 sm:px-12 py-3.5 border-b border-ink bg-panel">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img src="/fixtures/logo-elsewedy.png" alt="Logo" className="h-10 w-auto" />
          <div className="text-left leading-tight hidden sm:block">
            <div className="text-sm font-bold text-ink display tracking-tight">Equipment Specifier</div>
            <div className="text-[10px] text-ink-faint mono uppercase tracking-wide">Glands &amp; Ex-Rated Fixtures</div>
          </div>
        </button>
        <nav className="flex gap-6 text-sm text-ink-soft mono">
          <span className="hidden sm:inline">Live database</span>
        </nav>
      </header>
      <div className="hazard-bar" />

      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        {view === 'home' && <Home onSelect={setView} />}
        {view === 'glands' && <GlandFinder />}
        {['linear', 'baylight', 'floodlight'].includes(view) && (
          <FixtureFinder category={view} onBack={() => setView('home')} />
        )}
      </main>
    </div>
  );
}
