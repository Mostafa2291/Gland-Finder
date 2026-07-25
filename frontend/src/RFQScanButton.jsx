import React, { useState, useRef } from 'react';
import { Loader2, ScanLine, CheckCircle2, XCircle, FileText, X } from 'lucide-react';
import { useCart } from './CartContext';

export default function RFQScanButton() {
  const { addItem } = useCart();
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [addedCount, setAddedCount] = useState(0);

  const reset = () => {
    setFile(null);
    setResults(null);
    setError(null);
    setAddedCount(0);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResults(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/api/rfq/analyze', { method: 'POST', body: formData });
      const data = await resp.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setResults(data);

      let added = 0;
      (data.products || []).forEach((p) => {
        if (p.matched && p.item) {
          if (p.type === 'gland') {
            addItem({
              id: `gland-${p.item.ordering_reference}`,
              type: 'gland',
              reference: p.item.ordering_reference,
              description: `${p.item.manufacturer} ${p.item.gland_model} — ${p.item.entry_thread} (${p.item.gland_size}), ${p.item.material}`,
              price: p.item.price ?? null,
              raw: p.item,
            });
            added += 1;
          } else if (p.type === 'fixture') {
            addItem({
              id: `fixture-${p.item.model}`,
              type: 'fixture',
              reference: p.item.model,
              description: `${p.item.family || ''}${p.item.tagline ? ' · ' + p.item.tagline : ''}`,
              price: p.item.price ?? null,
              raw: p.item,
            });
            added += 1;
          }
        }
      });
      setAddedCount(added);
    } catch (e) {
      console.error('RFQ analyze failed:', e);
      setError('Something went wrong analyzing the file. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Scan RFQ"
        className="flex items-center gap-1.5 text-ink hover:text-red transition-colors cursor-pointer"
      >
        <ScanLine className="h-6 w-6" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-panel border border-ink rounded-sm shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <span className="text-sm font-semibold text-ink display flex items-center gap-1.5">
                <ScanLine className="h-4 w-4 text-red" /> Scan RFQ
              </span>
              <button onClick={() => { setOpen(false); }} className="text-ink-faint hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {!results && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-line rounded-sm p-4 text-center bg-panel-2 hover:border-red transition-colors cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    {file ? (
                      <>
                        <FileText className="h-6 w-6 text-red" />
                        <span className="text-xs font-medium text-ink truncate max-w-full">{file.name}</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-6 w-6 text-ink-faint" />
                        <span className="text-xs font-medium text-ink">Select RFQ file</span>
                        <span className="text-[10px] text-ink-faint mono">PDF, Word, image, or text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleAnalyze}
                    disabled={!file || isAnalyzing}
                    className="mt-3 w-full px-3 py-2 bg-ink text-white font-semibold rounded-sm hover:bg-red transition-colors mono text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {isAnalyzing ? 'Analyzing…' : 'Analyze & add to cart'}
                  </button>

                  {error && (
                    <div className="mt-3 border border-red/30 bg-red/5 rounded-sm p-2.5 text-xs text-red">{error}</div>
                  )}
                </>
              )}

              {results && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-ink-soft">
                      {results.products.length} item{results.products.length !== 1 ? 's' : ''} found
                    </span>
                    {addedCount > 0 && (
                      <span className="text-[10px] mono bg-red/10 text-red px-2 py-1 rounded-sm font-semibold">
                        {addedCount} added to cart
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {results.products.map((p, i) => (
                      <div key={i} className="border border-line rounded-sm p-2.5 bg-panel-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase mono bg-panel border border-line px-1 py-0.5 rounded-sm text-ink-faint">
                            {p.requested.product_category}
                          </span>
                          {p.matched ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-ink-faint" />
                          )}
                          {p.confidence && (
                            <span className={`text-[9px] mono ml-auto uppercase ${
                              p.confidence === 'high' ? 'text-green-700' : p.confidence === 'medium' ? 'text-amber-600' : 'text-ink-faint'
                            }`}>
                              {p.confidence} confidence
                            </span>
                          )}
                        </div>
                        {p.matched ? (
                          <>
                            <div className="font-bold text-ink text-xs mt-1">
                              {p.type === 'gland' ? p.item.ordering_reference : p.item.model}
                            </div>
                            <div className="text-[10px] text-ink-soft mt-0.5 truncate">
                              {p.type === 'gland'
                                ? `${p.item.manufacturer} ${p.item.gland_model} — ${p.item.entry_thread}`
                                : `${p.item.family || ''} — ${p.item.watt}W, ${Math.round(p.item.lumens || 0).toLocaleString()} lm`}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-ink-faint mt-1 italic">{p.reason}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={reset}
                    className="mt-3 w-full px-3 py-2 border border-line rounded-sm text-ink-soft hover:border-ink text-xs mono"
                  >
                    Scan another RFQ
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
