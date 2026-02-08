/**
 * Excel Ingestion Script
 * 
 * Reads a populated "MFI Financial Spreads Output.xlsx" from data/source/
 * and produces JSON files in data/ that the app reads at runtime.
 * 
 * Usage: npm run ingest
 * 
 * If no Excel file is found, it prints a message and exits gracefully.
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const SOURCE_DIR = path.join(__dirname, '..', 'data', 'source');
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const EXCEL_NAME = 'MFI Financial Spreads Output.xlsx';

function main() {
  const excelPath = path.join(SOURCE_DIR, EXCEL_NAME);

  if (!fs.existsSync(excelPath)) {
    console.log(`No Excel file found at ${excelPath}`);
    console.log('Place a populated "MFI Financial Spreads Output.xlsx" in data/source/ and run again.');
    console.log('Using existing JSON placeholder data.');
    process.exit(0);
  }

  console.log(`Reading ${excelPath}...`);
  const workbook = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer', cellDates: true });
  console.log(`Sheets found: ${workbook.SheetNames.join(', ')}`);

  // Process each sheet
  const nbfiSheet = workbook.Sheets['NBFI'];
  const inputSheet = workbook.Sheets['Input Template'];
  const cashflowSheet = workbook.Sheets['Cash Flow Statement'];

  if (nbfiSheet) {
    const nbfiData = processNBFISheet(nbfiSheet);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'nbfi-output.json'), JSON.stringify(nbfiData, null, 2));
    console.log('Generated nbfi-output.json');
  }

  if (inputSheet) {
    const inputData = processInputTemplate(inputSheet);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'input-template.json'), JSON.stringify(inputData, null, 2));
    console.log('Generated input-template.json');
  }

  if (cashflowSheet) {
    const cfData = processCashFlow(cashflowSheet);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'cashflow.json'), JSON.stringify(cfData, null, 2));
    console.log('Generated cashflow.json');
  }

  console.log('Ingestion complete!');
}

function sheetToRows(sheet: XLSX.WorkSheet): (string | number | null)[][] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rows: (string | number | null)[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: (string | number | null)[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row.push(cell ? (cell.v !== undefined ? cell.v : null) : null);
    }
    rows.push(row);
  }
  return rows;
}

function processNBFISheet(sheet: XLSX.WorkSheet) {
  const rows = sheetToRows(sheet);
  // Dynamic extraction: read all non-empty rows with their values
  const result: Record<string, unknown>[] = [];
  for (const row of rows) {
    const label = row[0];
    if (label && typeof label === 'string' && label.trim()) {
      result.push({
        label: label.trim(),
        values: row.slice(1).filter((_, i) => i % 2 === 0), // columns B, D, F (even indices after A)
        pctChanges: row.slice(1).filter((_, i) => i % 2 === 1), // columns C, E (odd indices)
      });
    }
  }
  return { raw: result, _note: 'Auto-generated from Excel. Re-run npm run ingest to update.' };
}

function processInputTemplate(sheet: XLSX.WorkSheet) {
  const rows = sheetToRows(sheet);
  const result: Record<string, unknown>[] = [];
  for (const row of rows) {
    const label = row[1] || row[0]; // Column B primarily, fallback to A
    if (label && typeof label === 'string' && label.trim()) {
      result.push({
        label: label.trim(),
        slNo: row[0],
        values: row.slice(2),
      });
    }
  }
  return { raw: result, _note: 'Auto-generated from Excel. Re-run npm run ingest to update.' };
}

function processCashFlow(sheet: XLSX.WorkSheet) {
  const rows = sheetToRows(sheet);
  const result: Record<string, unknown>[] = [];
  for (const row of rows) {
    const label = row[1] || row[0]; // Column B primarily
    if (label && typeof label === 'string' && label.trim()) {
      result.push({
        label: label.trim(),
        values: row.slice(2),
      });
    }
  }
  return { raw: result, _note: 'Auto-generated from Excel. Re-run npm run ingest to update.' };
}

main();
