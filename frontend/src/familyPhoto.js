export function familyPhoto(p) {
  const fam = `${p.family || ''} ${p.model || ''}`;
  if (/LifEx-M/i.test(fam)) return '/fixtures/products/lifex-m.png';
  if (/LifEx-P/i.test(fam)) return '/fixtures/products/lifex-p.png';
  if (/FLFE?-L/i.test(fam)) return '/fixtures/products/flf-l.png';
  if (/FlowEx/i.test(fam)) return '/fixtures/products/flowex.png';
  if (/EVML/i.test(fam)) return '/fixtures/products/evml.png';
  if (/STREETEX/i.test(fam)) return '/fixtures/products/streetex.png';
  if (/SLED-MN/i.test(fam)) return '/fixtures/products/sled-mn.png';
  if (/SLED-ME/i.test(fam)) return '/fixtures/products/sled-me.png';
  if (/EVNL/i.test(fam)) return '/fixtures/products/evnl.png';
  if (/EVL/i.test(fam)) return '/fixtures/products/evl.png';
  return null;
}
