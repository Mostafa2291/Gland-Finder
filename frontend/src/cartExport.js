import ExcelJS from 'exceljs';

const TCLASS_MAXTEMP = { T1: '450°C', T2: '300°C', T3: '200°C', T4: '135°C', T5: '100°C', T6: '85°C' };

function buildFixtureDescriptionRuns(p) {
  const bold = { bold: true };
  const boldUL = { bold: true, underline: true };
  const runs = [];
  const nl = () => runs.push({ text: '\n' });

  runs.push({ text: p.model, font: boldUL }); nl();
  runs.push({ text: `${p.family || ''}${p.variant ? ' (' + p.variant + ')' : ''} — ${p.tagline || ''}` }); nl();
  if (p.marking) { runs.push({ text: p.marking }); nl(); }
  if (p.tclass) {
    runs.push({ text: `Temperature class ${p.tclass}, max surface temperature ${TCLASS_MAXTEMP[p.tclass] || 'n/a'}.` });
    nl();
  }
  if (p.zones && p.zones.length) {
    const zoneStr = p.zones.map((z) => 'Zone ' + z).join(', ');
    runs.push({ text: `Certified for ${zoneStr}.${p.ip ? ' IP rating ' + p.ip + (p.ik ? ', ' + p.ik + '.' : '.') : ''}` });
    nl();
  }
  const elecLine = [];
  if (p.watt) elecLine.push(`${p.watt} W`);
  if (p.freq) elecLine.push(p.freq);
  if (p.cct) elecLine.push(`${p.cct} K CCT`);
  if (p.lumens) elecLine.push(`${Math.round(p.lumens).toLocaleString()} lm`);
  if (elecLine.length) { runs.push({ text: elecLine.join(', ') + '.' }); nl(); }
  if (p.dims) { runs.push({ text: `Dimensions ${p.dims.l} x ${p.dims.w} x ${p.dims.h} mm.` }); nl(); }
  if (p.ral) { runs.push({ text: `Housing colour ${p.ral}.` }); nl(); }
  nl();
  runs.push({ text: 'Other features as per attached TDS.' }); nl(); nl();
  runs.push({ text: '*Manufacturer: Cortem / Italy.', font: bold });

  return runs;
}

function buildGlandDescriptionRuns(g) {
  const boldUL = { bold: true, underline: true };
  const runs = [];
  const nl = () => runs.push({ text: '\n' });

  runs.push({ text: g.ordering_reference, font: boldUL }); nl();
  runs.push({ text: `${g.manufacturer || ''} ${g.gland_model || ''} — ${g.entry_thread || ''} (${g.gland_size || ''})` }); nl();
  runs.push({ text: `${g.sealing_type || ''}, ${g.material || ''}, ${g.armour_compatibility || ''}.` }); nl();
  if (g.environment) { runs.push({ text: `Environment: ${g.environment}.` }); nl(); }
  if (g.min_cable_dia_mm != null && g.max_cable_dia_mm != null) {
    runs.push({ text: `Cable OD range ${g.min_cable_dia_mm}–${g.max_cable_dia_mm} mm.` }); nl();
  }

  return runs;
}

function descriptionRunsFor(item) {
  return item.type === 'fixture'
    ? buildFixtureDescriptionRuns(item.raw)
    : buildGlandDescriptionRuns(item.raw);
}

export async function exportCartSheet(items, { srNo } = {}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Cart', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  ws.columns = [
    { key: 'item', width: 9 },
    { key: 'desc', width: 62 },
    { key: 'unit', width: 8 },
    { key: 'qty', width: 7 },
    { key: 'uprice', width: 11 },
    { key: 'tprice', width: 11 },
  ];

  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = srNo ? `SR NO. ${srNo}` : 'SR NO. ______________________';
  title.font = { name: 'Times New Roman', size: 14, bold: true, underline: true };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  ws.addRow([]);

  const headerRow = ws.getRow(3);
  headerRow.values = ['ITEM', 'DESCRIPTION', 'UNIT', 'QTY', 'U.\nPRICE', 'T.\nPRICE'];
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 10, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
  });

  let rowIdx = 4;
  let grandTotalCells = [];

  items.forEach((item, i) => {
    const row = ws.getRow(rowIdx);
    row.getCell(1).value = i + 1;
    row.getCell(2).value = { richText: descriptionRunsFor(item) };
    row.getCell(3).value = 'EA';
    row.getCell(4).value = item.qty;
    row.getCell(5).value = item.price != null ? item.price : null;
    if (item.price != null) {
      row.getCell(6).value = { formula: `D${rowIdx}*E${rowIdx}` };
      grandTotalCells.push(`F${rowIdx}`);
    }

    [1, 3, 4, 5, 6].forEach((c) => {
      row.getCell(c).font = { name: 'Times New Roman', size: 10 };
      row.getCell(c).alignment = { horizontal: 'center', vertical: 'top' };
    });
    row.getCell(2).font = { name: 'Times New Roman', size: 10 };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    row.getCell(5).numFmt = '#,##0.00';
    row.getCell(6).numFmt = '#,##0.00';
    row.height = 130;

    for (let c = 1; c <= 6; c++) {
      row.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    }

    rowIdx += 1;
  });

  // Grand total row
  const totalRow = ws.getRow(rowIdx);
  ws.mergeCells(`A${rowIdx}:E${rowIdx}`);
  totalRow.getCell(1).value = 'GRAND TOTAL';
  totalRow.getCell(1).font = { name: 'Times New Roman', size: 10, bold: true };
  totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  if (grandTotalCells.length) {
    totalRow.getCell(6).value = { formula: grandTotalCells.join('+') };
  }
  totalRow.getCell(6).font = { name: 'Times New Roman', size: 10, bold: true };
  totalRow.getCell(6).numFmt = '#,##0.00';
  totalRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
  for (let c = 1; c <= 6; c++) {
    totalRow.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Cart_${srNo || 'export'}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
