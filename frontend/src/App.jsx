import React, { useState } from 'react';
import Home from './Home';
import GlandFinder from './GlandFinder';
import FixtureFinder from './FixtureFinder';
import Footer from './Footer';

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'glands' | 'linear' | 'baylight' | 'floodlight'

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-ink selection:text-paper flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-12 py-3.5 border-b border-ink bg-panel">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img src="/fixtures/logo-elsewedy.png" alt="Logo" className="h-10 w-auto" />
        </button>
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
    </div>
  );
}
