import React, { useState, useEffect } from 'react';
import { Search, Info, Shield, Layers, Factory, Box, Ruler, CheckCircle2, XCircle, Settings2, Loader2 } from 'lucide-react';

export default function App() {
  // --- STATE ---
  const [armourType, setArmourType] = useState('All');
  const [sealingType, setSealingType] = useState('All');
  const [environment, setEnvironment] = useState('All');
  const [material, setMaterial] = useState('All');
  const [thread, setThread] = useState('All');
  const [cableOD, setCableOD] = useState('');
  const [selectedGland, setSelectedGland] = useState(null);

  const [filteredGlands, setFilteredGlands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- FETCHING LOGIC FROM VERCEL API ---
  useEffect(() => {
    const fetchGlands = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();

        if (armourType !== 'All') params.append('armour', armourType);
        if (sealingType !== 'All') params.append('sealing', sealingType);
        if (environment !== 'All') params.append('environment', environment);
        if (material !== 'All') params.append('material', material);
        if (thread !== 'All') params.append('thread', thread);
        if (cableOD && !isNaN(parseFloat(cableOD))) params.append('cable_od', cableOD);

        const response = await fetch(`/api/search?${params.toString()}`);

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        const glands = Array.isArray(data) ? data : (data.recommended_glands || []);
        setFilteredGlands(glands);

        // Deselect gland if it's no longer in the filtered list
        if (selectedGland && !glands.find(g => g.ordering_reference === selectedGland.ordering_reference)) {
            setSelectedGland(null);
        }
      } catch (error) {
        console.error("Failed to fetch glands:", error);
        setFilteredGlands([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a 300ms debounce so it doesn't spam Supabase on every single keystroke in the OD box
    const delayDebounceFn = setTimeout(() => {
      fetchGlands();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [armourType, sealingType, environment, material, thread, cableOD]);

  // Dropdown Options
  const armourOptions = ['All', 'Unarmoured', 'SWA', 'STA'];
  const sealingOptions = ['All', 'Single Seal', 'Double Seal'];
  const envOptions = ['All', 'Industrial / Safe', 'Explosion Proof'];
  const materialOptions = ['All', 'Brass', 'Nickel Plated Brass', 'Stainless Steel', 'Aluminium'];
  const threadOptions = ['All', 'M16', 'M20', 'M25', 'M32', 'M40', 'M50', 'M63', 'M75', 'M90', 'M100', 'M115', 'M130'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Settings2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CMP Gland Selector</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Engineering Database Engine</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300 bg-slate-800 py-1.5 px-3 rounded-full border border-slate-700">
             <Layers className="h-4 w-4 text-blue-400" />
             <span>Live Supabase Connection</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start">

        {/* --- LEFT SIDEBAR: FILTERS --- */}
        <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 pointer-events-none"></div>

            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Filter Specifications
            </h2>

            <div className="space-y-5 relative z-10">
              {/* Cable OD Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                  <Ruler className="h-4 w-4 mr-1.5 text-slate-400" />
                  Cable Outer Dia. (mm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={cableOD}
                    onChange={(e) => setCableOD(e.target.value)}
                    placeholder="e.g. 14.5"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">mm</span>
                </div>
              </div>

              {/* Armour Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                  <Shield className="h-4 w-4 mr-1.5 text-slate-400" />
                  Armour Type
                </label>
                <select
                  value={armourType}
                  onChange={(e) => setArmourType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                >
                  {armourOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Entry Thread */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                  <Settings2 className="h-4 w-4 mr-1.5 text-slate-400" />
                  Entry Thread
                </label>
                <select
                  value={thread}
                  onChange={(e) => setThread(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                >
                  {threadOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Sealing Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                  <Layers className="h-4 w-4 mr-1.5 text-slate-400" />
                  Sealing Type
                </label>
                <select
                  value={sealingType}
                  onChange={(e) => setSealingType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                >
                  {sealingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Environment */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                  <Factory className="h-4 w-4 mr-1.5 text-slate-400" />
                  Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                >
                  {envOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                  <Box className="h-4 w-4 mr-1.5 text-slate-400" />
                  Material
                </label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                >
                  {materialOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setArmourType('All'); setSealingType('All'); setEnvironment('All'); setMaterial('All'); setThread('All'); setCableOD(''); setSelectedGland(null);
                  }}
                  className="w-full py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN CENTER: RESULTS TABLE --- */}
        <div className="flex-1 w-full space-y-6">

          {/* Results Summary Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${isLoading ? 'bg-blue-100 text-blue-600' : filteredGlands.length > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : filteredGlands.length > 0 ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
              <span className="font-medium text-slate-700">
                {isLoading ? 'Searching database...' : <>Found <strong className="text-slate-900 text-lg">{filteredGlands.length}</strong> matching glands</>}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
               {cableOD && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md font-medium">OD: {cableOD}mm</span>}
               {armourType !== 'All' && <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-md">{armourType}</span>}
               {environment !== 'All' && <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-md">{environment}</span>}
            </div>
          </div>

          {/* Detailed Gland Card */}
          {selectedGland && (
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Selected Specification
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    {selectedGland.ordering_reference}
                  </h3>
                  <p className="text-slate-500 font-medium">{selectedGland.manufacturer} {selectedGland.gland_model} Series</p>
                  <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md font-semibold">
                    {selectedGland.sealing_type}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedGland(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Thread</p>
                  <p className="text-lg font-bold text-slate-800">{selectedGland.entry_thread}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Size Ref</p>
                  <p className="text-lg font-bold text-slate-800">{selectedGland.gland_size}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 col-span-2 flex flex-col justify-center">
                  <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Cable OD Range</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">{selectedGland.min_cable_dia_mm}</span>
                    <span className="text-slate-400 font-medium">to</span>
                    <span className="text-lg font-bold text-blue-600">{selectedGland.max_cable_dia_mm}</span>
                    <span className="text-sm text-slate-500 font-medium ml-1">mm</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Sealing Type</span>
                  <span className="font-semibold text-slate-800 text-right">{selectedGland.sealing_type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Material</span>
                  <span className="font-semibold text-slate-800 text-right">{selectedGland.material}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Armour Compatibility</span>
                  <span className="font-semibold text-slate-800 text-right">{selectedGland.armour_compatibility}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Environment</span>
                  <span className="font-semibold text-slate-800 text-right">{selectedGland.environment}</span>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Thread</th>
                    <th className="px-4 py-3">Range (mm)</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Armour</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Seal</th>
                    <th className="px-4 py-3 hidden md:table-cell">Material</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Loader2 className="h-10 w-10 mb-3 animate-spin text-blue-500" />
                          <p className="text-lg font-medium text-slate-600">Querying Supabase...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredGlands.length > 0 ? (
                    filteredGlands.map((gland, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${selectedGland?.ordering_reference === gland.ordering_reference ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedGland(gland)}
                      >
                        <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                          {gland.ordering_reference}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200">{gland.gland_model}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {gland.entry_thread} ({gland.gland_size})
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {gland.min_cable_dia_mm} - {gland.max_cable_dia_mm}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                          {gland.armour_compatibility}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                          {gland.sealing_type}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                          {gland.material}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs uppercase tracking-wide bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGland(gland);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Search className="h-10 w-10 mb-3 opacity-20" />
                          <p className="text-lg font-medium text-slate-600">No glands found</p>
                          <p className="text-sm">Try adjusting your filters or cable outer diameter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}