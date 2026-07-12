import React, { useState } from 'react';
import { Search, ShieldCheck, Factory, Ruler, ChevronRight, Activity, AlertCircle, RotateCcw } from 'lucide-react';

export default function App() {
  const [armour, setArmour] = useState('');
  const [environment, setEnvironment] = useState('');
  const [overallDia, setOverallDia] = useState('');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (armour) params.append('armour', armour);
      if (environment) params.append('environment', environment);
      if (overallDia) params.append('overall_dia', overallDia);

      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to connect to the backend database.');
      }

      const data = await response.json();
      setResults(data.recommended_glands || []);
    } catch (err) {
      setError("Couldn't reach the gland database right now. Please try again in a moment.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setArmour('');
    setEnvironment('');
    setOverallDia('');
    setResults([]);
    setError(null);
    setHasSearched(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const hasActiveFilters = armour || environment || overallDia;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-inner shadow-blue-800/50">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Gland Selector Pro</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Technical Office Hub</p>
            </div>
          </div>
          <div className="flex space-x-2 text-sm text-slate-500 items-center font-medium">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span>API Online</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">

        {/* LEFT COLUMN: FILTERS */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-600" />
                Cable Specifications
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-5" onKeyDown={handleKeyDown}>

              {/* Overall Diameter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                  <Ruler className="h-4 w-4 mr-1.5 text-slate-400" />
                  Overall Cable Diameter (mm)
                </label>
                <input
                  type="number"
                  value={overallDia}
                  onChange={(e) => setOverallDia(e.target.value)}
                  placeholder="e.g. 14.5"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 hover:bg-white"
                />
                <p className="text-xs text-slate-400 mt-1">Measure the cable's outer sheath diameter.</p>
              </div>

              {/* Armour Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1.5 text-slate-400" />
                  Armour Type
                </label>
                <select
                  value={armour}
                  onChange={(e) => setArmour(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                >
                  <option value="">Any Armour</option>
                  <option value="SWA">Steel Wire Armour (SWA)</option>
                  <option value="Unarmoured">Unarmoured</option>
                </select>
              </div>

              {/* Environment */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                  <Factory className="h-4 w-4 mr-1.5 text-slate-400" />
                  Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                >
                  <option value="">Any Environment</option>
                  <option value="Industrial">Industrial / Safe</option>
                  <option value="Hazardous">Hazardous / Ex</option>
                </select>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center mt-4"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </span>
                ) : (
                  'Find Matching Glands'
                )}
              </button>

              <p className="text-xs text-slate-400 text-center -mt-2">Press Enter to search</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="w-full lg:w-2/3">

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl mb-6 flex shadow-sm">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 shrink-0" />
              <p className="text-sm text-red-700 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {!hasSearched && !error ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 border-dashed rounded-2xl px-6">
              <Search className="h-16 w-16 mb-4 text-slate-200" />
              <p className="text-lg font-medium text-slate-500">Enter specifications to find glands</p>
              <p className="text-sm mt-1 text-slate-400 max-w-sm text-center">
                Fill in the cable diameter and armour requirements on the left, then search the catalog.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-800">
                  Recommended Glands
                  {!loading && (
                    <span className="ml-2 bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-sm font-bold">
                      {results.length}
                    </span>
                  )}
                </h3>
              </div>

              {loading && (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400">
                  Searching the catalog...
                </div>
              )}

              {!loading && results.length === 0 && !error && (
                <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <p className="text-amber-800 font-semibold">No glands found matching these specifications.</p>
                  <p className="text-amber-600 text-sm mt-1">Try widening the diameter or checking a different armour type.</p>
                </div>
              )}

              {!loading && (
                <div className="grid grid-cols-1 gap-4">
                  {results.map((gland, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group flex flex-col md:flex-row md:items-center justify-between">

                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-mono text-xl font-bold text-slate-800">{gland.ordering_reference}</span>
                          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">{gland.manufacturer}</span>
                        </div>
                        <div className="text-sm text-slate-500 flex flex-wrap gap-y-1 gap-x-4">
                          <span className="flex items-center"><ChevronRight className="h-3 w-3 mr-1"/> Size: <strong className="ml-1 text-slate-700">{gland.gland_size}</strong></span>
                          <span className="flex items-center"><ChevronRight className="h-3 w-3 mr-1"/> Thread: <strong className="ml-1 text-slate-700">{gland.entry_thread}</strong></span>
                          <span className="flex items-center"><ChevronRight className="h-3 w-3 mr-1"/> Type: <strong className="ml-1 text-slate-700">{gland.armour_compatibility}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center md:justify-end gap-3 w-full md:w-auto">
                        <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-center min-w-[120px]">
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">Overall Range</p>
                          <p className="text-sm font-mono text-slate-800 font-bold">
                            {gland.min_cable_dia_mm} - {gland.max_cable_dia_mm} <span className="text-xs text-slate-500 font-sans">mm</span>
                          </p>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}