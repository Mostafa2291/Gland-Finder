import React from 'react';

const CARDS = [
  {
    key: 'glands',
    label: 'Cable Glands',
    sub: 'CMP database',
    tag: '00',
    img: '/fixtures/gland.jpg',
    icon: 'CG',
  },
  {
    key: 'linear',
    label: 'Linear',
    sub: 'LifEx-M series',
    tag: '01',
    img: '/fixtures/linear.png',
    icon: 'LN',
  },
  {
    key: 'baylight',
    label: 'High Bay & Low Bay',
    sub: 'FlowEx / EVML series',
    tag: '02',
    img: '/fixtures/baylight.png',
    icon: 'HB',
  },
  {
    key: 'floodlight',
    label: 'Floodlights',
    sub: 'EVL / EVNL / SLED / STREETEX series',
    tag: '03',
    img: '/fixtures/floodlight.png',
    icon: 'FL',
  },
  {
    key: 'rfq',
    label: 'Upload RFQ',
    sub: 'AI-powered part finder',
    tag: '04',
    img: null,
    icon: 'RFQ',
  },
];

export default function Home({ onSelect }) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="eyebrow mono mb-3">Ex-rated equipment specifier</div>
      <h1 className="text-3xl sm:text-4xl font-semibold text-ink display mb-4 max-w-xl">
        Find the right cable gland or Cortem light fixture in a few clicks
      </h1>
      <p className="text-ink-soft text-base leading-relaxed max-w-lg mb-12">
        Pick a product line below, enter your specs, and get a matched result straight
        from the live database.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CARDS.map((c) => (
          <button
            key={c.key}
            onClick={() => onSelect(c.key)}
            className="bg-panel border border-ink rounded-sm text-left overflow-hidden hover:border-red hover:-translate-y-0.5 hover:shadow-lg transition-all relative flex flex-col"
          >
            <div className="hazard-tag" />
            <div className="h-40 flex items-center justify-center bg-panel-2 border-b border-line">
              {c.img ? (
                <img src={c.img} alt={c.label} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-ink-faint display">{c.icon}</span>
              )}
            </div>
            <div className="px-4 py-4 border-t-2 border-red flex items-center justify-between">
              <div>
                <span className="text-[15px] font-medium text-ink block">{c.label}</span>
                <span className="text-[11px] text-ink-faint mono block mt-0.5">{c.sub}</span>
              </div>
              <span className="text-red mono text-sm">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
