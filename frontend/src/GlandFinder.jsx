import React, { useState, useEffect } from 'react';
import { Search, Shield, Layers, Factory, Box, Ruler, CheckCircle2, XCircle, Settings2, Loader2, ShoppingCart } from 'lucide-react';
import { useCart } from './CartContext';

export default function GlandFinder() {
  const { addItem } = useCart();
  const [armourType, setArmourType] = useState('All');
  const [sealingType, setSealingType] = useState('All');
  const [environment, setEnvironment] = useState('All');
  const [material, setMaterial] = useState('All');
  const [thread, setThread] = useState('All');
  const [cableOD, setCableOD] = useState('');
  const [selectedGland, setSelectedGland] = useState(null);

  const handleCableODChange = (value) => {
    setCableOD(value);
    if (value && thread !== 'All') setThread('All');
  };

  const handleThreadChange = (value) => {
    setThread(value);
    if (value !== 'All' && cableOD) setCableOD('');
  };

  const [filteredGlands, setFilteredGlands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
        let glands = Array.isArray(data) ? data : (data.recommended_glands || []);

        if (cableOD && !isNaN(parseFloat(cableOD)) && glands.length > 0) {
          const target = parseFloat(cableOD);
          let bestIdx = 0;
          let bestDiff = Infinity;
          glands.forEach((g, idx) => {
            const midpoint = (g.min_cable_dia_mm + g.max_cable_dia_mm) / 2;
            const diff = Math.abs(midpoint - target);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestIdx = idx;
            }
          });
          const best = glands[bestIdx];
          glands = [
            { ...best, __recommended: true },
            ...glands.filter((_, idx) => idx !== bestIdx).map(g => ({ ...g, __recommended: false })),
          ];
        } else {
          glands = glands.map(g => ({ ...g, __recommended: false }));
        }

        setFilteredGlands(glands);

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

    const delayDebounceFn = setTimeout(() => {
      fetchGlands();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [armourType, sealingType, environment, material, thread, cableOD]);

  const armourOptions = ['All', 'Unarmoured', 'SWA', 'STA'];
  const sealingOptions = ['All', 'Single Seal', 'Double Seal'];
  const envOptions = ['All', 'Industrial / Safe', 'Explosion Proof'];
  const materialOptions = ['All', 'Brass', 'Nickel Plated Brass', 'Stainless Steel', 'Aluminium'];
  const threadOptions = ['All', 'M16', 'M20', 'M25', 'M32', 'M40', 'M50', 'M63', 'M75', 'M90', 'M100', 'M115', 'M130'];

  const addGlandToCart = (gland) => {
    addItem({
      id: `gland-${gland.ordering_reference}`,
      type: 'gland',
      reference: gland.ordering_reference,
      description: `${gland.manufacturer} ${gland.gland_model} — ${gland.entry_thread} (${gland.gland_size}), ${gland.material}`,
      price: gland.price ?? null,
      raw: gland,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">

      {/* --- LEFT SIDEBAR: FILTERS --- */}
      <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div className="bg-panel rounded-sm shadow-sm border border-line p-6 relative">
          <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2 display">
            <Search className="h-5 w-5 text-red" />
            Filter Specifications
          </h2>

          <div className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center">
                <Ruler className="h-4 w-4 mr-1.5 text-ink-faint" />
                Cable Outer Dia. (mm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={cableOD}
                  onChange={(e) => handleCableODChange(e.target.value)}
                  disabled={thread !== 'All'}
                  placeholder={thread !== 'All' ? 'Disabled (thread set)' : 'e.g. 14.5'}
                  className="w-full pl-4 pr-10 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red transition-all outline-none bg-panel-2 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-panel-2"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm font-medium">mm</span>
              </div>
              {thread !== 'All' && (
                <p className="text-xs text-ink-faint mt-1">Clear Entry Thread to filter by OD instead.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center">
                <Shield className="h-4 w-4 mr-1.5 text-ink-faint" />
                Armour Type
              </label>
              <select
                value={armourType}
                onChange={(e) => setArmourType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red transition-all outline-none bg-panel-2 hover:bg-white cursor-pointer"
              >
                {armourOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center">
                <Settings2 className="h-4 w-4 mr-1.5 text-ink-faint" />
                Entry Thread
              </label>
              <select
                value={thread}
                onChange={(e) => handleThreadChange(e.target.value)}
                disabled={!!cableOD}
                className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red transition-all outline-none bg-panel-2 hover:bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-panel-2"
              >
                {threadOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {!!cableOD && (
                <p className="text-xs text-ink-faint mt-1">Clear Cable OD to filter by thread instead.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center">
                <Layers className="h-4 w-4 mr-1.5 text-ink-faint" />
                Sealing Type
              </label>
              <select
                value={sealingType}
                onChange={(e) => setSealingType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red transition-all outline-none bg-panel-2 hover:bg-white cursor-pointer"
              >
                {sealingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center">
                <Factory className="h-4 w-4 mr-1.5 text-ink-faint" />
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red transition-all outline-none bg-panel-2 hover:bg-white cursor-pointer"
              >
                {envOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center">
                <Box className="h-4 w-4 mr-1.5 text-ink-faint" />
                Material
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red transition-all outline-none bg-panel-2 hover:bg-white cursor-pointer"
              >
                {materialOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="pt-4 border-t border-line-soft">
              <button
                onClick={() => {
                  setArmourType('All'); setSealingType('All'); setEnvironment('All'); setMaterial('All'); setThread('All'); setCableOD(''); setSelectedGland(null);
                }}
                className="w-full py-2.5 text-sm font-semibold text-ink-soft bg-panel-2 hover:bg-line rounded-sm transition-colors mono"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN: RESULTS --- */}
      <div className="flex-1 w-full space-y-6">

        <div className="bg-panel rounded-sm shadow-sm border border-line p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full ${isLoading ? 'bg-panel-2 text-ink-soft' : filteredGlands.length > 0 ? 'bg-panel-2 text-ink' : 'bg-red/10 text-red'}`}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : filteredGlands.length > 0 ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </div>
            <span className="font-medium text-ink-soft">
              {isLoading ? 'Searching database...' : <>Found <strong className="text-ink text-lg">{filteredGlands.length}</strong> matching glands</>}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mono">
            {cableOD && <span className="text-xs bg-panel-2 text-ink-soft border border-line px-2 py-1 rounded-sm font-medium">OD: {cableOD}mm</span>}
            {armourType !== 'All' && <span className="text-xs bg-panel-2 text-ink-soft border border-line px-2 py-1 rounded-sm">{armourType}</span>}
            {environment !== 'All' && <span className="text-xs bg-panel-2 text-ink-soft border border-line px-2 py-1 rounded-sm">{environment}</span>}
          </div>
        </div>

        {selectedGland && (
          <div className="bg-panel border-2 border-red rounded-sm p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red text-white text-xs font-bold px-3 py-1 uppercase tracking-wider mono">
              {selectedGland.__recommended ? 'Best Fit for Your Diameter' : 'Selected Specification'}
            </div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-ink flex items-center gap-3 display">
                  {selectedGland.ordering_reference}
                </h3>
                <p className="text-ink-soft font-medium">{selectedGland.manufacturer} {selectedGland.gland_model} Series</p>
                <span className="inline-block mt-1 text-xs bg-panel-2 text-ink-soft border border-line px-2 py-0.5 rounded-sm font-semibold mono">
                  {selectedGland.sealing_type}
                </span>
              </div>
              <button onClick={() => setSelectedGland(null)} className="text-ink-faint hover:text-ink transition-colors">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <button
              onClick={() => addGlandToCart(selectedGland)}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-ink text-white font-semibold rounded-sm hover:bg-red transition-colors mono text-xs uppercase tracking-wide"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
            </button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-panel-2 rounded-sm p-3 border border-line">
                <p className="text-xs text-ink-faint font-semibold mb-1 uppercase mono">Thread</p>
                <p className="text-lg font-bold text-ink">{selectedGland.entry_thread}</p>
              </div>
              <div className="bg-panel-2 rounded-sm p-3 border border-line">
                <p className="text-xs text-ink-faint font-semibold mb-1 uppercase mono">Size Ref</p>
                <p className="text-lg font-bold text-ink">{selectedGland.gland_size}</p>
              </div>
              <div className="bg-panel-2 rounded-sm p-3 border border-line col-span-2 flex flex-col justify-center">
                <p className="text-xs text-ink-faint font-semibold mb-1 uppercase mono">Cable OD Range</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red">{selectedGland.min_cable_dia_mm}</span>
                  <span className="text-ink-faint font-medium">to</span>
                  <span className="text-lg font-bold text-red">{selectedGland.max_cable_dia_mm}</span>
                  <span className="text-sm text-ink-faint font-medium ml-1">mm</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-ink-faint font-medium">Sealing Type</span>
                <span className="font-semibold text-ink text-right">{selectedGland.sealing_type}</span>
              </div>
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-ink-faint font-medium">Material</span>
                <span className="font-semibold text-ink text-right">{selectedGland.material}</span>
              </div>
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-ink-faint font-medium">Armour Compatibility</span>
                <span className="font-semibold text-ink text-right">{selectedGland.armour_compatibility}</span>
              </div>
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-ink-faint font-medium">Environment</span>
                <span className="font-semibold text-ink text-right">{selectedGland.environment}</span>
              </div>
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-ink-faint font-medium">Price</span>
                <span className="font-semibold text-red text-right">
                  {selectedGland.price != null ? `$${selectedGland.price.toLocaleString()}` : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-panel rounded-sm shadow-sm border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-panel-2 border-b border-line text-ink-faint text-xs uppercase tracking-wider font-semibold mono">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Thread</th>
                  <th className="px-4 py-3">Range (mm)</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Armour</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Seal</th>
                  <th className="px-4 py-3 hidden md:table-cell">Material</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-ink-faint">
                        <Loader2 className="h-10 w-10 mb-3 animate-spin text-red" />
                        <p className="text-lg font-medium text-ink-soft">Querying Supabase...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredGlands.length > 0 ? (
                  filteredGlands.map((gland, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-panel-2 transition-colors cursor-pointer ${selectedGland?.ordering_reference === gland.ordering_reference ? 'bg-panel-2' : ''} ${gland.__recommended ? 'bg-red/5' : ''}`}
                      onClick={() => setSelectedGland(gland)}
                    >
                      <td className="px-4 py-3 font-bold text-ink whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {gland.ordering_reference}
                          {gland.__recommended && (
                            <span className="text-[10px] bg-red text-white font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide mono">
                              Best Fit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <span className="bg-panel-2 px-2 py-0.5 rounded-sm font-medium border border-line mono">{gland.gland_model}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-soft">
                        {gland.entry_thread} ({gland.gland_size})
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {gland.min_cable_dia_mm} - {gland.max_cable_dia_mm}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-ink-soft">{gland.armour_compatibility}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-ink-soft">{gland.sealing_type}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-ink-soft">{gland.material}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink whitespace-nowrap">
                        {gland.price != null ? `$${gland.price.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Add to Cart"
                            className="text-ink hover:text-red bg-panel-2 hover:bg-red/10 p-1.5 rounded-sm transition-colors border border-line"
                            onClick={(e) => { e.stopPropagation(); addGlandToCart(gland); }}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="text-red hover:text-red-dim font-semibold text-xs uppercase tracking-wide bg-red/5 hover:bg-red/10 px-3 py-1.5 rounded-sm transition-colors mono"
                            onClick={(e) => { e.stopPropagation(); setSelectedGland(gland); }}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-ink-faint">
                        <Search className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-lg font-medium text-ink-soft">No glands found</p>
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
    </div>
  );
}
