import React, { useState } from 'react';
import { Loader2, ChevronDown, ChevronUp, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

const CATEGORY_LABEL = {
  linear: 'Linear',
  baylight: 'High Bay & Low Bay',
  floodlight: 'Floodlights',
};

const ZONE_OPTIONS = [
  { value: 1, label: 'Zone 1 — gas, likely in normal operation (zone 1 & 2)' },
  { value: 2, label: 'Zone 2 — gas, unlikely / short duration only' },
];

function buildWhy(best, meetsLumen, lumen, zone, tclassMaxTemp, opt) {
  const parts = [];
  parts.push(
    meetsLumen
      ? `Matched on lumen output first: delivers ${Math.round(best.lumens).toLocaleString()} lm, the closest catalogue fixture at or above your ${Number(lumen).toLocaleString()} lm request.`
      : `No fixture in this family reaches ${Number(lumen).toLocaleString()} lm once certified options are filtered by zone — ${Math.round(best.lumens).toLocaleString()} lm is the highest available, so it's recommended over lower-output alternatives.`
  );
  parts.push(`Certified for zone ${zone} (rated ${best.tclass}, max surface ${tclassMaxTemp || ''}).`);
  if (opt.watt) {
    parts.push(
      best.watt <= opt.watt
        ? `Draws ${best.watt} W, within your ${opt.watt} W budget.`
        : `Runs over budget — draws ${best.watt} W against a ${opt.watt} W target; lumen output took priority over the wattage target in this recommendation.`
    );
  }
  return parts;
}

function FixtureCard({ p, highlight }) {
  return (
    <div className={`bg-panel border rounded-sm p-5 ${highlight ? 'border-2 border-red' : 'border-line'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-xl font-bold text-ink display">{p.model}</h4>
        {highlight && (
          <span className="text-[10px] bg-red text-white font-bold px-2 py-1 rounded-sm uppercase tracking-wide mono shrink-0">
            Best Fit
          </span>
        )}
      </div>
      {p.tagline && <p className="text-ink-soft text-sm mb-4">{p.tagline}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mono text-xs">
        <div className="bg-panel-2 border border-line rounded-sm p-2.5">
          <p className="text-ink-faint uppercase mb-1">Lumens</p>
          <p className="text-ink font-bold text-sm">{p.lumens ? Math.round(p.lumens).toLocaleString() : '—'} lm</p>
        </div>
        <div className="bg-panel-2 border border-line rounded-sm p-2.5">
          <p className="text-ink-faint uppercase mb-1">Wattage</p>
          <p className="text-ink font-bold text-sm">{p.watt ?? '—'} W</p>
        </div>
        <div className="bg-panel-2 border border-line rounded-sm p-2.5">
          <p className="text-ink-faint uppercase mb-1">IP Rating</p>
          <p className="text-ink font-bold text-sm">{p.ip ?? '—'}</p>
        </div>
        <div className="bg-panel-2 border border-line rounded-sm p-2.5">
          <p className="text-ink-faint uppercase mb-1">Zones</p>
          <p className="text-ink font-bold text-sm">{(p.zones || []).join(', ') || '—'}</p>
        </div>
      </div>
      {p.price != null && (
        <p className="text-ink-soft text-xs mt-3 mono">Unit price: ${p.price.toLocaleString()}</p>
      )}
    </div>
  );
}

export default function FixtureFinder({ category, onBack }) {
  const [lumen, setLumen] = useState('');
  const [zone, setZone] = useState('');
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [watt, setWatt] = useState('');
  const [material, setMaterial] = useState('');
  const [diml, setDiml] = useState('');
  const [dimw, setDimw] = useState('');
  const [dimh, setDimh] = useState('');
  const [efficiency, setEfficiency] = useState('');
  const [ip, setIp] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { match, best, alternates, meets_lumen, tclass_max_temp } | { match:false, closest }

  const runMatch = async () => {
    if (!lumen || zone === '') {
      setError('Enter a lumen output and select an installation zone.');
      return;
    }
    setError('');
    setIsLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams({ category, lumen, zone });
      if (watt) params.append('watt', watt);
      if (material) params.append('material', material);
      if (diml) params.append('diml', diml);
      if (dimw) params.append('dimw', dimw);
      if (dimh) params.append('dimh', dimh);
      if (efficiency) params.append('efficiency', efficiency);
      if (ip) params.append('ip', ip);

      const resp = await fetch(`/api/fixtures/search?${params.toString()}`);
      if (!resp.ok) throw new Error('Network response was not ok');
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      console.error('Failed to search fixtures:', e);
      setError('Something went wrong searching the fixture database.');
    } finally {
      setIsLoading(false);
    }
  };

  const opt = { watt: watt ? parseFloat(watt) : null };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-ink-soft hover:text-ink mono text-sm mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to categories
      </button>

      {!result && (
        <div className="bg-panel border border-line rounded-sm p-6 sm:p-8">
          <div className="eyebrow mono mb-2">{CATEGORY_LABEL[category]}</div>
          <h2 className="text-2xl font-semibold text-ink display mb-6">Enter your specs</h2>

          <div className="grid sm:grid-cols-2 gap-5 mb-2">
            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1.5">Lumen output needed</label>
              <div className="relative">
                <input
                  type="number" min="1" step="100" placeholder="6000"
                  value={lumen} onChange={(e) => setLumen(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm mono">lm</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1.5">Installation zone</label>
              <select
                value={zone} onChange={(e) => setZone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 hover:bg-white cursor-pointer"
              >
                <option value="">Select one</option>
                {ZONE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={() => setOptionalOpen(!optionalOpen)}
            className="flex items-center gap-1.5 text-red text-sm font-semibold mono mt-4 mb-2"
          >
            {optionalOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {optionalOpen ? 'Hide optional specs' : `Add optional specs (wattage${category === 'linear' ? ', type' : ''}, dimensions, efficiency, IP)`}
          </button>

          {optionalOpen && (
            <div className="grid sm:grid-cols-2 gap-5 mt-4 pt-4 border-t border-line-soft">
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Wattage (target / budget)</label>
                <div className="relative">
                  <input
                    type="number" min="1" step="1" placeholder="60"
                    value={watt} onChange={(e) => setWatt(e.target.value)}
                    className="w-full pl-4 pr-12 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm mono">W</span>
                </div>
              </div>
              {category === 'linear' && (
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">Type</label>
                  <select
                    value={material} onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 hover:bg-white cursor-pointer"
                  >
                    <option value="">No preference</option>
                    <option value="aluminium">Aluminium</option>
                    <option value="plastic">Plastic</option>
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Max dimensions (L × W × H, mm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" placeholder="L" value={diml} onChange={(e) => setDiml(e.target.value)}
                    className="px-3 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 focus:bg-white" />
                  <input type="number" placeholder="W" value={dimw} onChange={(e) => setDimw(e.target.value)}
                    className="px-3 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 focus:bg-white" />
                  <input type="number" placeholder="H" value={dimh} onChange={(e) => setDimh(e.target.value)}
                    className="px-3 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Minimum efficiency</label>
                <div className="relative">
                  <input
                    type="number" min="0" step="1" placeholder="120"
                    value={efficiency} onChange={(e) => setEfficiency(e.target.value)}
                    className="w-full pl-4 pr-16 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm mono">lm/W</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Minimum IP rating</label>
                <select
                  value={ip} onChange={(e) => setIp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 hover:bg-white cursor-pointer"
                >
                  <option value="">No preference</option>
                  <option value="IP65">IP65</option>
                  <option value="IP66">IP66</option>
                  <option value="IP67">IP67</option>
                  <option value="IP68">IP68</option>
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red text-sm mono">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          <button
            onClick={runMatch}
            disabled={isLoading}
            className="mt-6 w-full sm:w-auto px-8 py-3 bg-ink text-white font-semibold rounded-sm hover:bg-red transition-colors mono flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Find my fixture
          </button>
        </div>
      )}

      {result && result.match && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-ink display text-xl font-semibold">
            <CheckCircle2 className="h-5 w-5 text-red" /> Recommended fixture
          </div>
          <FixtureCard p={result.best} highlight />
          <div className="bg-panel-2 border border-line rounded-sm p-4 text-sm text-ink-soft space-y-2">
            {buildWhy(result.best, result.meets_lumen, lumen, zone, result.tclass_max_temp, opt).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {result.alternates && result.alternates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink-faint uppercase mono mb-3">Alternates</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {result.alternates.map((a) => <FixtureCard key={a.model} p={a} />)}
              </div>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="text-red mono text-sm font-semibold"
          >
            ← Try different specs
          </button>
        </div>
      )}

      {result && !result.match && (
        <div className="space-y-6">
          <div className="bg-panel border border-red-dim rounded-sm p-6">
            <p className="text-ink font-semibold mb-2">No fixture in this family is certified for what you entered.</p>
            {result.closest && (
              <p className="text-ink-soft text-sm">
                Closest option: <strong className="text-ink">{result.closest.model}</strong> — {result.closest.fail_reasons.join('; ')}.
              </p>
            )}
            <p className="text-ink-faint text-xs mt-2">This may need a different Cortem series that isn't in this specifier's catalogue slice yet.</p>
          </div>
          <button onClick={() => setResult(null)} className="text-red mono text-sm font-semibold">
            ← Try different specs
          </button>
        </div>
      )}
    </div>
  );
}
