import React, { useState } from 'react';
import { Loader2, ChevronDown, ChevronUp, ArrowLeft, AlertTriangle, X, ShoppingCart } from 'lucide-react';
import { familyPhoto } from './familyPhoto';
import { exportSrSheet } from './srExport';
import { useCart } from './CartContext';

const CATEGORY_LABEL = {
  linear: 'Linear',
  baylight: 'High Bay & Low Bay',
  floodlight: 'Floodlights',
};

const ZONE_OPTIONS = [
  { value: 1, label: 'Zone 1 — gas, likely in normal operation (zone 1 & 2)' },
  { value: 2, label: 'Zone 2 — gas, unlikely / short duration only' },
];

const TCLASS_MAXTEMP = { T1: '450°C', T2: '300°C', T3: '200°C', T4: '135°C', T5: '100°C', T6: '85°C' };

function buildWhy(best, meetsLumen, lumen, zone, opt) {
  const parts = [];
  parts.push(
    meetsLumen
      ? `Matched on lumen output first: delivers ${Math.round(best.lumens).toLocaleString()} lm, the closest catalogue fixture at or above your ${Number(lumen).toLocaleString()} lm request.`
      : `No fixture in this family reaches ${Number(lumen).toLocaleString()} lm once certified options are filtered by zone — ${Math.round(best.lumens).toLocaleString()} lm is the highest available, so it's recommended over lower-output alternatives.`
  );
  parts.push(`Certified for zone ${zone} (rated ${best.tclass}, max surface ${TCLASS_MAXTEMP[best.tclass] || ''}).`);
  if (opt.watt) {
    parts.push(
      best.watt <= opt.watt
        ? `Draws ${best.watt} W, within your ${opt.watt} W budget.`
        : `Runs over budget — draws ${best.watt} W against a ${opt.watt} W target; lumen output took priority over the wattage target in this recommendation.`
    );
  }
  return parts.join(' ');
}

function ExportModal({ product, onClose }) {
  const [srNo, setSrNo] = useState('');
  const [qty, setQty] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportSrSheet(product, { srNo, qty });
      onClose();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-panel border border-ink rounded-sm p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ink display">Export SR sheet</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-soft mb-1.5">SR No.</label>
            <input
              type="text" placeholder="e.g. 533-2026-AM-23023" value={srNo}
              onChange={(e) => setSrNo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-soft mb-1.5">Quantity</label>
            <input
              type="number" min="1" value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-4 py-2.5 rounded-sm border border-line focus:ring-2 focus:ring-red focus:border-red outline-none bg-panel-2 focus:bg-white"
            />
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="mt-6 w-full px-6 py-3 bg-ink text-white font-semibold rounded-sm hover:bg-red transition-colors mono flex items-center justify-center gap-2"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Download .xlsx
        </button>
      </div>
    </div>
  );
}

function SpecTable({ rows }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-line-soft last:border-b-0">
            <td className="py-2 pr-4 text-ink-faint mono text-xs uppercase align-top whitespace-nowrap">{label}</td>
            <td className={`py-2 text-right font-medium ${value ? 'text-ink' : 'text-ink-faint italic'}`}>
              {value || 'not specified in catalogue'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function FixtureFinder({ category, onBack }) {
  const { addItem } = useCart();
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
  const [result, setResult] = useState(null);
  const [exportProduct, setExportProduct] = useState(null);

  const runMatch = async (overrideModel) => {
    if (!lumen || zone === '') {
      setError('Enter a lumen output and select an installation zone.');
      return;
    }
    setError('');
    setIsLoading(true);
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

  const promoteAlternate = (alt) => {
    setResult((prev) => {
      const all = [prev.best, ...prev.alternates];
      const rest = all.filter((a) => a.model !== alt.model);
      return { ...prev, best: alt, alternates: rest.slice(0, 2), meets_lumen: alt.lumens >= Number(lumen) };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addFixtureToCart = (fixture) => {
    addItem({
      id: `fixture-${fixture.model}`,
      type: 'fixture',
      reference: fixture.model,
      description: `${fixture.family || ''}${fixture.tagline ? ' · ' + fixture.tagline : ''}`,
      price: fixture.price ?? null,
      raw: fixture,
    });
  };

  const opt = { watt: watt ? parseFloat(watt) : null };

  if (result && result.match) {
    const p = result.best;
    const photo = familyPhoto(p);

    const mandatoryRows = [
      ['Lumen output', p.lumens ? `${Math.round(p.lumens).toLocaleString()} lm` : null],
      ['Zone', (p.zones || []).map((z) => 'Zone ' + z).join(', ')],
      ['Marking', p.marking],
      ['Wattage', p.watt ? `${p.watt} W` : null],
    ];
    const optionalRows = [
      ['Frequency', p.freq],
      ['Lifetime', p.lifetime_hours ? `${p.lifetime_hours.toLocaleString()} hrs (L90)` : null],
      ['CCT', p.cct ? `${p.cct} K` : null],
      ['Dimensions', p.dims ? `${p.dims.l} × ${p.dims.w} × ${p.dims.h} mm` : null],
      ['CRI', p.cri ? `Ra ${p.cri}` : null],
      ['Power factor', p.pf ?? null],
      ['Efficiency', p.eff ? `${p.eff} lm/W` : null],
      ['RAL', p.ral],
      ['IK rating', p.ik],
      ['IP rating', p.ip],
    ];

    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setResult(null)} className="flex items-center gap-2 text-ink-soft hover:text-ink mono text-sm mb-6">
          <ArrowLeft className="h-4 w-4" /> Choose a different family
        </button>

        <div className="flex items-center gap-3 mb-2">
          <span className="mono text-xs border border-ink border-l-[3px] border-l-red px-2 py-1 rounded-sm">MATCH</span>
          <h2 className="text-2xl font-medium text-ink display">Recommended fixture</h2>
        </div>
        <p className="text-ink-soft text-sm mb-6">Based on the specs you entered, here's the closest certified fit in the catalogue.</p>

        <div className="grid sm:grid-cols-[220px_1fr] gap-6 mb-10">
          <div className="border border-line rounded-sm bg-panel-2 flex items-center justify-center p-4 h-fit">
            {photo ? (
              <img src={photo} alt={p.family || p.model} className="w-full max-h-[220px] object-contain" />
            ) : (
              <span className="text-ink-faint text-xs mono text-center">No image available</span>
            )}
          </div>

          <div className="border border-ink rounded-sm p-6">
            <div className="text-xl font-bold text-ink display">{p.model}</div>
            <div className="text-red text-sm mono mt-0.5">{p.family}{p.tagline ? ` · ${p.tagline}` : ''}</div>
            {p.price != null && (
              <div className="text-sm font-semibold text-ink mt-2">
                Unit price: {p.price.toLocaleString()} USD <span className="text-ink-faint italic font-normal">estimated</span>
              </div>
            )}
            {p.marking && <div className="text-xs text-ink-faint mono mt-2 leading-relaxed">{p.marking}</div>}

            <button
              onClick={() => addFixtureToCart(p)}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-ink text-white font-semibold rounded-sm hover:bg-red transition-colors mono text-xs uppercase tracking-wide"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
            </button>

            <div className="text-xs font-semibold text-ink-faint uppercase mono mt-5 mb-1">Mandatory specs</div>
            <SpecTable rows={mandatoryRows} />

            <div className="text-xs font-semibold text-ink-faint uppercase mono mt-5 mb-1">Optional specs</div>
            <SpecTable rows={optionalRows} />

            <div className="mt-5 pt-4 border-t border-line-soft text-sm text-ink-soft">
              <strong className="text-ink">Why this one: </strong>
              {buildWhy(p, result.meets_lumen, lumen, zone, opt)}
            </div>
          </div>
        </div>

        {result.alternates && result.alternates.length > 0 && (
          <>
            <div className="text-xs font-semibold text-ink-faint uppercase mono mb-3">Also worth a look</div>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {result.alternates.map((a) => (
                <div
                  key={a.model}
                  className="text-left border border-line rounded-sm p-4 bg-panel hover:border-red transition-colors"
                >
                  <div className="font-bold text-ink display">{a.model}</div>
                  <div className="text-xs text-ink-soft mt-1">{a.family}</div>
                  <div className="text-xs text-ink-soft mono mt-1">
                    {a.watt} W · {a.lumens ? Math.round(a.lumens).toLocaleString() : '—'} lm · {a.tclass}
                    {a.price != null && <><br />Unit price: {a.price.toLocaleString()} USD</>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => promoteAlternate(a)} className="text-red text-xs font-semibold mono cursor-pointer">
                      View details →
                    </button>
                    <button
                      title="Add to Cart"
                      onClick={() => addFixtureToCart(a)}
                      className="ml-auto text-ink hover:text-red bg-panel-2 hover:bg-red/10 p-1.5 rounded-sm transition-colors border border-line cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setResult(null)}
            className="px-6 py-2.5 border border-line rounded-sm text-ink-soft hover:border-ink mono text-sm"
          >
            Run another spec
          </button>
          <button
            onClick={() => setExportProduct(p)}
            className="px-6 py-2.5 border border-ink rounded-sm text-ink font-semibold hover:bg-ink hover:text-white transition-colors mono text-sm"
          >
            Export SR sheet (.xlsx)
          </button>
        </div>

        {exportProduct && <ExportModal product={exportProduct} onClose={() => setExportProduct(null)} />}
      </div>
    );
  }

  if (result && !result.match) {
    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={() => setResult(null)} className="flex items-center gap-2 text-ink-soft hover:text-ink mono text-sm mb-6">
          <ArrowLeft className="h-4 w-4" /> Choose a different family
        </button>
        <div className="bg-panel border border-red-dim rounded-sm p-6">
          <p className="text-ink font-semibold mb-2">No fixture in this family is certified for what you entered.</p>
          {result.closest && (
            <p className="text-ink-soft text-sm">
              Closest option: <strong className="text-ink">{result.closest.model}</strong> — {result.closest.fail_reasons.join('; ')}.
            </p>
          )}
          <p className="text-ink-faint text-xs mt-2">This may need a different Cortem series that isn't in this specifier's catalogue slice yet.</p>
        </div>
        <button onClick={() => setResult(null)} className="text-red mono text-sm font-semibold mt-4">
          ← Try different specs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-ink-soft hover:text-ink mono text-sm mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to categories
      </button>

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
              {ZONE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          onClick={() => runMatch()}
          disabled={isLoading}
          className="mt-6 w-full sm:w-auto px-8 py-3 bg-ink text-white font-semibold rounded-sm hover:bg-red transition-colors mono flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Find my fixture
        </button>
      </div>
    </div>
  );
}
