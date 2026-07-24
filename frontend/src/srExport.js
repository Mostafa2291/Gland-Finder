import ExcelJS from 'exceljs';

const TCLASS_MAXTEMP = { T1: '450°C', T2: '300°C', T3: '200°C', T4: '135°C', T5: '100°C', T6: '85°C' };

function buildDescriptionRuns(p) {
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

export async function exportSrSheet(p, { srNo, qty }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('SR', {
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

  const qtyNum = parseInt(qty, 10) || 1;
  const dataRow = ws.getRow(4);
  dataRow.getCell(1).value = 1;
  dataRow.getCell(2).value = { richText: buildDescriptionRuns(p) };
  dataRow.getCell(3).value = 'EA';
  dataRow.getCell(4).value = qtyNum;
  dataRow.getCell(5).value = p.price || null;
  if (p.price) {
    dataRow.getCell(6).value = { formula: 'D4*E4' };
  }
  [1, 3, 4, 5, 6].forEach((c) => {
    dataRow.getCell(c).font = { name: 'Times New Roman', size: 10 };
    dataRow.getCell(c).alignment = { horizontal: 'center', vertical: 'top' };
  });
  dataRow.getCell(2).font = { name: 'Times New Roman', size: 10 };
  dataRow.getCell(2).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  dataRow.getCell(5).numFmt = '#,##0.00';
  dataRow.getCell(6).numFmt = '#,##0.00';
  dataRow.height = 260;

  for (let r = 3; r <= 4; r++) {
    for (let c = 1; c <= 6; c++) {
      const cell = ws.getRow(r).getCell(c);
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SR_${p.model}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
