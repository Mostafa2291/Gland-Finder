import React, { useState, useRef } from 'react';
import { Loader2, ArrowLeft, UploadCloud, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { useCart } from './CartContext';

export default function RFQUpload({ onBack }) {
  const { addItem } = useCart();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null); // { products: [...] }
  const [addedCount, setAddedCount] = useState(0);

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

      const resp = await fetch('/api/rfq/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();

      if (data.error) {
        setError(data.error);
        setIsAnalyzing(false);
        return;
      }

      setResults(data);

      // Auto-add every matched item straight to cart
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
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-ink-faint hover:text-ink text-sm mb-6 cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="eyebrow mono mb-3">AI-powered part finder</div>
      <h1 className="text-3xl font-semibold text-ink display mb-4">Upload an RFQ</h1>
      <p className="text-ink-soft text-base leading-relaxed max-w-lg mb-8">
        Upload an RFQ document (PDF, Word, image, or text). It'll be read and matched against
        the gland and fixture database automatically — any confident matches go straight to your cart.
      </p>

      <div className="border-2 border-dashed border-line rounded-sm p-8 text-center bg-panel-2">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-2 mx-auto cursor-pointer"
        >
          {file ? (
            <>
              <FileText className="h-8 w-8 text-red" />
              <span className="text-sm font-medium text-ink">{file.name}</span>
              <span className="text-xs text-ink-faint mono">Click to choose a different file</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-ink-faint" />
              <span className="text-sm font-medium text-ink">Click to select an RFQ file</span>
              <span className="text-xs text-ink-faint mono">PDF, Word, image, or text</span>
            </>
          )}
        </button>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!file || isAnalyzing}
        className="mt-4 w-full px-4 py-3 bg-ink text-white font-semibold rounded-sm hover:bg-red transition-colors mono text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isAnalyzing ? 'Analyzing RFQ…' : 'Analyze RFQ'}
      </button>

      {error && (
        <div className="mt-4 border border-red/30 bg-red/5 rounded-sm p-4 text-sm text-red">{error}</div>
      )}

      {results && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink display">
              {results.products.length} item{results.products.length !== 1 ? 's' : ''} found in RFQ
            </h2>
            {addedCount > 0 && (
              <span className="text-xs mono bg-red/10 text-red px-3 py-1.5 rounded-sm font-semibold">
                {addedCount} added to cart
              </span>
            )}
          </div>

          <div className="space-y-3">
            {results.products.map((p, i) => (
              <div key={i} className="border border-line rounded-sm p-4 bg-panel">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase mono bg-panel-2 border border-line px-1.5 py-0.5 rounded-sm text-ink-faint">
                        {p.requested.product_category}
                      </span>
                      {p.matched ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-ink-faint" />
                      )}
                    </div>
                    {p.matched ? (
                      <>
                        <div className="font-bold text-ink mt-1.5">
                          {p.type === 'gland' ? p.item.ordering_reference : p.item.model}
                        </div>
                        <div className="text-xs text-ink-soft mt-0.5">
                          {p.type === 'gland'
                            ? `${p.item.manufacturer} ${p.item.gland_model} — ${p.item.entry_thread}, ${p.item.material}`
                            : `${p.item.family || ''} — ${p.item.watt}W, ${Math.round(p.item.lumens || 0).toLocaleString()} lm`}
                        </div>
                        {p.item.price != null && (
                          <div className="text-xs mono text-ink-faint mt-1">${p.item.price.toLocaleString()}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-ink-faint mt-1.5 italic">{p.reason}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
