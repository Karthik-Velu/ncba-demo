/**
 * Generates a sample Loan Book Excel file for upload template purposes.
 * Output: data/sample-loan-book-template.xlsx
 *
 * Usage: npx tsx scripts/generate-sample-loan-book.ts
 */

import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NAVY   = '003366';
const ORANGE = 'E67300';
const LIGHT_BLUE = 'D6E4F0';
const LIGHT_GRAY = 'F5F5F5';
const WHITE  = 'FFFFFF';

// 16 columns matching LoanLevelRow interface exactly
const COLUMNS = [
  { key: 'loanId',                 header: 'loan_id',                    width: 14 },
  { key: 'applicationId',          header: 'application_id',             width: 14 },
  { key: 'dpdAsOfReportingDate',   header: 'dpd_as_of_reporting_date',   width: 22 },
  { key: 'currentBalance',         header: 'current_balance',            width: 18 },
  { key: 'loanDisbursedAmount',    header: 'loan_disbursed_amount',      width: 22 },
  { key: 'totalOverdueAmount',     header: 'total_overdue_amount',       width: 20 },
  { key: 'loanDisbursedDate',      header: 'loan_disbursed_date',        width: 20 },
  { key: 'interestRate',           header: 'interest_rate',              width: 15 },
  { key: 'loanWrittenOff',         header: 'loan_written_off',           width: 16 },
  { key: 'repossession',           header: 'repossession',               width: 14 },
  { key: 'recoveryAfterWriteoff',  header: 'recovery_after_writeoff',    width: 22 },
  { key: 'geography',              header: 'geography',                  width: 16 },
  { key: 'product',                header: 'product',                    width: 18 },
  { key: 'segment',                header: 'segment',                    width: 16 },
  { key: 'borrowerName',           header: 'borrower_name',              width: 22 },
  { key: 'residualTenureMonths',   header: 'residual_tenure_months',     width: 22 },
];

const DATA_DICTIONARY = [
  { column: 'loan_id',                  type: 'Text',    required: 'Yes', description: 'Unique loan identifier (e.g. LN1001)', example: 'LN1001' },
  { column: 'application_id',           type: 'Text',    required: 'Yes', description: 'Origination application reference (e.g. APP2001)', example: 'APP2001' },
  { column: 'dpd_as_of_reporting_date', type: 'Integer', required: 'Yes', description: 'Days past due as of the reporting cut-off date. 0 = current', example: '0 / 35 / 92' },
  { column: 'current_balance',          type: 'Decimal', required: 'Yes', description: 'Outstanding principal balance in KES as of reporting date', example: '83413.02' },
  { column: 'loan_disbursed_amount',    type: 'Decimal', required: 'Yes', description: 'Original loan principal disbursed in KES', example: '110555.29' },
  { column: 'total_overdue_amount',     type: 'Decimal', required: 'Yes', description: 'Total overdue principal + interest in KES. 0 if current', example: '0 / 12450.00' },
  { column: 'loan_disbursed_date',      type: 'Date',    required: 'Yes', description: 'Disbursement date in YYYY-MM-DD format', example: '2024-06-15' },
  { column: 'interest_rate',            type: 'Decimal', required: 'Yes', description: 'Annual interest rate as a percentage (not decimal)', example: '16.5' },
  { column: 'loan_written_off',         type: 'Boolean', required: 'Yes', description: 'TRUE if loan has been written off, FALSE otherwise', example: 'TRUE / FALSE' },
  { column: 'repossession',             type: 'Boolean', required: 'Yes', description: 'TRUE if asset has been repossessed, FALSE otherwise', example: 'TRUE / FALSE' },
  { column: 'recovery_after_writeoff',  type: 'Decimal', required: 'Yes', description: 'Amount recovered post write-off in KES. 0 if not written off', example: '0 / 5000.00' },
  { column: 'geography',                type: 'Text',    required: 'No',  description: 'Region/county of borrower (e.g. Nairobi, Mombasa, Kisumu)', example: 'Nairobi' },
  { column: 'product',                  type: 'Text',    required: 'No',  description: 'Loan product type (e.g. MSME, Agri-Finance, SACCO)', example: 'MSME' },
  { column: 'segment',                  type: 'Text',    required: 'No',  description: 'Borrower segment (e.g. Individual, Enterprise, Group)', example: 'Individual' },
  { column: 'borrower_name',            type: 'Text',    required: 'No',  description: 'Full name of primary borrower', example: 'Jane Mwangi' },
  { column: 'residual_tenure_months',   type: 'Integer', required: 'No',  description: 'Remaining loan tenure in months as of reporting date', example: '18' },
];

// 20 representative sample rows covering all DPD buckets and product types
const SAMPLE_ROWS = [
  { loanId:'LN1001', applicationId:'APP2001', dpdAsOfReportingDate:0,   currentBalance:83413.02,  loanDisbursedAmount:110555.29, totalOverdueAmount:0,      loanDisbursedDate:'2025-10-11', interestRate:16.49, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nairobi',  product:'MSME',         segment:'Individual', borrowerName:'Chebet Wambui',    residualTenureMonths:27 },
  { loanId:'LN1002', applicationId:'APP2002', dpdAsOfReportingDate:0,   currentBalance:447188.81, loanDisbursedAmount:596407.39, totalOverdueAmount:0,      loanDisbursedDate:'2024-08-28', interestRate:15.11, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nakuru',   product:'SACCO',        segment:'Individual', borrowerName:'Patrick Otieno',   residualTenureMonths:19 },
  { loanId:'LN1003', applicationId:'APP2003', dpdAsOfReportingDate:0,   currentBalance:112879.71, loanDisbursedAmount:136420.87, totalOverdueAmount:0,      loanDisbursedDate:'2024-04-04', interestRate:14.54, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nairobi',  product:'Agri-Finance', segment:'Enterprise', borrowerName:'Stephen Wekesa',   residualTenureMonths:16 },
  { loanId:'LN1004', applicationId:'APP2004', dpdAsOfReportingDate:15,  currentBalance:103114.57, loanDisbursedAmount:145000.00, totalOverdueAmount:2300.50, loanDisbursedDate:'2024-06-01', interestRate:17.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Mombasa',  product:'MSME',         segment:'Individual', borrowerName:'Amina Ochieng',    residualTenureMonths:22 },
  { loanId:'LN1005', applicationId:'APP2005', dpdAsOfReportingDate:28,  currentBalance:75200.00,  loanDisbursedAmount:90000.00,  totalOverdueAmount:8400.00, loanDisbursedDate:'2024-03-15', interestRate:18.50, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Kisumu',   product:'Agri-Finance', segment:'Group',      borrowerName:'John Mwangi',      residualTenureMonths:10 },
  { loanId:'LN1006', applicationId:'APP2006', dpdAsOfReportingDate:45,  currentBalance:62000.00,  loanDisbursedAmount:80000.00,  totalOverdueAmount:9300.00, loanDisbursedDate:'2024-01-20', interestRate:16.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nakuru',   product:'MSME',         segment:'Enterprise', borrowerName:'Grace Njoroge',    residualTenureMonths:8  },
  { loanId:'LN1007', applicationId:'APP2007', dpdAsOfReportingDate:60,  currentBalance:50000.00,  loanDisbursedAmount:75000.00,  totalOverdueAmount:15000.00,loanDisbursedDate:'2023-11-10', interestRate:19.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nairobi',  product:'SACCO',        segment:'Individual', borrowerName:'Samuel Kipchoge',  residualTenureMonths:5  },
  { loanId:'LN1008', applicationId:'APP2008', dpdAsOfReportingDate:75,  currentBalance:38000.00,  loanDisbursedAmount:60000.00,  totalOverdueAmount:19500.00,loanDisbursedDate:'2023-09-05', interestRate:20.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Mombasa',  product:'Agri-Finance', segment:'Individual', borrowerName:'Faith Adhiambo',   residualTenureMonths:3  },
  { loanId:'LN1009', applicationId:'APP2009', dpdAsOfReportingDate:95,  currentBalance:25000.00,  loanDisbursedAmount:50000.00,  totalOverdueAmount:23750.00,loanDisbursedDate:'2023-07-01', interestRate:21.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Kisumu',   product:'MSME',         segment:'Enterprise', borrowerName:'David Kamau',      residualTenureMonths:2  },
  { loanId:'LN1010', applicationId:'APP2010', dpdAsOfReportingDate:120, currentBalance:18000.00,  loanDisbursedAmount:40000.00,  totalOverdueAmount:21600.00,loanDisbursedDate:'2023-05-15', interestRate:22.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nakuru',   product:'SACCO',        segment:'Group',      borrowerName:'Mary Wanjiku',     residualTenureMonths:1  },
  { loanId:'LN1011', applicationId:'APP2011', dpdAsOfReportingDate:180, currentBalance:10000.00,  loanDisbursedAmount:30000.00,  totalOverdueAmount:18000.00,loanDisbursedDate:'2023-01-10', interestRate:24.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nairobi',  product:'Agri-Finance', segment:'Individual', borrowerName:'Peter Mutua',      residualTenureMonths:0  },
  { loanId:'LN1012', applicationId:'APP2012', dpdAsOfReportingDate:210, currentBalance:5000.00,   loanDisbursedAmount:25000.00,  totalOverdueAmount:5000.00, loanDisbursedDate:'2022-09-01', interestRate:24.00, loanWrittenOff:true,  repossession:false, recoveryAfterWriteoff:2000.00, geography:'Mombasa',  product:'MSME',         segment:'Enterprise', borrowerName:'Rose Akinyi',      residualTenureMonths:0  },
  { loanId:'LN1013', applicationId:'APP2013', dpdAsOfReportingDate:0,   currentBalance:285000.00, loanDisbursedAmount:350000.00, totalOverdueAmount:0,      loanDisbursedDate:'2025-07-20', interestRate:14.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nairobi',  product:'MSME',         segment:'Enterprise', borrowerName:'James Kariuki',    residualTenureMonths:36 },
  { loanId:'LN1014', applicationId:'APP2014', dpdAsOfReportingDate:0,   currentBalance:155000.00, loanDisbursedAmount:200000.00, totalOverdueAmount:0,      loanDisbursedDate:'2025-05-12', interestRate:15.50, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Kisumu',   product:'Agri-Finance', segment:'Group',      borrowerName:'Alice Atieno',     residualTenureMonths:24 },
  { loanId:'LN1015', applicationId:'APP2015', dpdAsOfReportingDate:35,  currentBalance:92000.00,  loanDisbursedAmount:120000.00, totalOverdueAmount:10120.00,loanDisbursedDate:'2024-11-01', interestRate:17.50, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nakuru',   product:'SACCO',        segment:'Individual', borrowerName:'Brian Njeru',      residualTenureMonths:14 },
  { loanId:'LN1016', applicationId:'APP2016', dpdAsOfReportingDate:0,   currentBalance:40500.00,  loanDisbursedAmount:45000.00,  totalOverdueAmount:0,      loanDisbursedDate:'2025-08-30', interestRate:16.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nairobi',  product:'Agri-Finance', segment:'Individual', borrowerName:'Lydia Cheruiyot',  residualTenureMonths:11 },
  { loanId:'LN1017', applicationId:'APP2017', dpdAsOfReportingDate:55,  currentBalance:28000.00,  loanDisbursedAmount:45000.00,  totalOverdueAmount:7700.00, loanDisbursedDate:'2024-02-14', interestRate:20.50, loanWrittenOff:false, repossession:true,  recoveryAfterWriteoff:0,      geography:'Mombasa',  product:'MSME',         segment:'Enterprise', borrowerName:'Victor Omondi',    residualTenureMonths:4  },
  { loanId:'LN1018', applicationId:'APP2018', dpdAsOfReportingDate:0,   currentBalance:520000.00, loanDisbursedAmount:650000.00, totalOverdueAmount:0,      loanDisbursedDate:'2025-09-10', interestRate:13.75, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Nairobi',  product:'SACCO',        segment:'Enterprise', borrowerName:'Naomi Waweru',     residualTenureMonths:42 },
  { loanId:'LN1019', applicationId:'APP2019', dpdAsOfReportingDate:100, currentBalance:15000.00,  loanDisbursedAmount:35000.00,  totalOverdueAmount:10500.00,loanDisbursedDate:'2023-06-30', interestRate:23.00, loanWrittenOff:false, repossession:false, recoveryAfterWriteoff:0,      geography:'Kisumu',   product:'Agri-Finance', segment:'Group',      borrowerName:'Isaac Barasa',     residualTenureMonths:1  },
  { loanId:'LN1020', applicationId:'APP2020', dpdAsOfReportingDate:240, currentBalance:3000.00,   loanDisbursedAmount:20000.00,  totalOverdueAmount:3000.00, loanDisbursedDate:'2022-05-01', interestRate:24.00, loanWrittenOff:true,  repossession:false, recoveryAfterWriteoff:800.00,  geography:'Nakuru',   product:'MSME',         segment:'Individual', borrowerName:'Carol Muthoni',    residualTenureMonths:0  },
];

const DPD_BUCKET_NOTE = `DPD Bucket Reference:
  0              → Current
  1 – 30 days    → 1-30 (Early delinquency)
  31 – 60 days   → 31-60 (Sub-standard)
  61 – 90 days   → 61-90 (Doubtful)
  91 – 180 days  → 91-180 (Loss — provisioned)
  > 180 days     → 180+  (Write-off eligible)`;

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Kaleidofin / NCBA';
  wb.created = new Date();

  /* ── Sheet 1: Loan Book Template ─────────────────────────── */
  const ws = wb.addWorksheet('Loan Book', { views: [{ state: 'frozen', ySplit: 3 }] });

  // Title row
  ws.mergeCells('A1:P1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'LOAN BOOK UPLOAD TEMPLATE  —  Kaleidofin Portfolio Analytics';
  titleCell.font = { bold: true, size: 13, color: { argb: WHITE } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  // Sub-title row
  ws.mergeCells('A2:P2');
  const subtitleCell = ws.getCell('A2');
  subtitleCell.value = 'All amounts in KES  |  Dates in YYYY-MM-DD  |  Booleans: TRUE / FALSE  |  Required columns: columns A–K  |  Optional: L–P';
  subtitleCell.font = { italic: true, size: 9, color: { argb: NAVY } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 18;

  // Header row (row 3)
  ws.columns = COLUMNS.map(c => ({ key: c.key, width: c.width }));
  const headerRow = ws.getRow(3);
  COLUMNS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: ORANGE } },
      right:  { style: 'thin',   color: { argb: WHITE }  },
    };
  });
  // Mark optional columns (L–P) with a different header background
  for (let i = 12; i <= 16; i++) {
    const cell = headerRow.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A5276' } };
  }
  headerRow.height = 32;

  // Data rows (starting at row 4)
  SAMPLE_ROWS.forEach((row, idx) => {
    const r = ws.addRow([
      row.loanId, row.applicationId, row.dpdAsOfReportingDate,
      row.currentBalance, row.loanDisbursedAmount, row.totalOverdueAmount,
      row.loanDisbursedDate, row.interestRate,
      row.loanWrittenOff, row.repossession, row.recoveryAfterWriteoff,
      row.geography, row.product, row.segment, row.borrowerName, row.residualTenureMonths,
    ]);
    const shade = idx % 2 === 0 ? LIGHT_GRAY : WHITE;
    r.eachCell({ includeEmpty: true }, cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: shade } };
      cell.alignment = { vertical: 'middle' };
      cell.border = { bottom: { style: 'hair', color: { argb: 'DDDDDD' } } };
    });
    // Number format for currency columns
    [4, 5, 6, 11].forEach(col => {
      r.getCell(col).numFmt = '#,##0.00';
      r.getCell(col).alignment = { horizontal: 'right', vertical: 'middle' };
    });
    // Number format for rate
    r.getCell(8).numFmt = '0.00"%"';
    r.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
    // Integer cols
    [3, 16].forEach(col => r.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' });
    r.height = 18;
  });

  // Conditional fill for DPD column — highlight delinquent rows orange
  // (Done manually since ExcelJS conditional formatting is limited)

  /* ── Sheet 2: Data Dictionary ─────────────────────────────── */
  const dd = wb.addWorksheet('Data Dictionary');

  dd.columns = [
    { key: 'column',      width: 26 },
    { key: 'type',        width: 10 },
    { key: 'required',    width: 11 },
    { key: 'description', width: 60 },
    { key: 'example',     width: 22 },
  ];

  // Title
  dd.mergeCells('A1:E1');
  const ddTitle = dd.getCell('A1');
  ddTitle.value = 'DATA DICTIONARY — Loan Book Upload Format';
  ddTitle.font = { bold: true, size: 12, color: { argb: WHITE } };
  ddTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ddTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  dd.getRow(1).height = 26;

  // Header
  const ddHeader = dd.getRow(2);
  ['Column Name', 'Data Type', 'Required', 'Description', 'Example Value'].forEach((h, i) => {
    const cell = ddHeader.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'medium', color: { argb: NAVY } } };
  });
  ddHeader.height = 22;

  DATA_DICTIONARY.forEach((entry, idx) => {
    const r = dd.addRow([entry.column, entry.type, entry.required, entry.description, entry.example]);
    const shade = idx % 2 === 0 ? LIGHT_GRAY : WHITE;
    r.eachCell({ includeEmpty: true }, cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: shade } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = { bottom: { style: 'hair', color: { argb: 'DDDDDD' } } };
    });
    // Highlight required column
    const reqCell = r.getCell(3);
    if (entry.required === 'Yes') {
      reqCell.font = { bold: true, color: { argb: '8B0000' } };
    } else {
      reqCell.font = { color: { argb: '555555' } };
    }
    reqCell.alignment = { horizontal: 'center', vertical: 'middle' };
    r.height = 20;
  });

  // DPD bucket note
  dd.addRow([]);
  const noteRow = dd.addRow(['DPD Bucket Reference']);
  noteRow.getCell(1).font = { bold: true, size: 10 };
  noteRow.height = 18;

  DPD_BUCKET_NOTE.split('\n').forEach(line => {
    const r = dd.addRow(['', line.trim()]);
    r.getCell(2).font = { size: 9, color: { argb: '444444' } };
  });

  /* ── Sheet 3: Validation ──────────────────────────────────── */
  const val = wb.addWorksheet('Validation Rules');

  val.columns = [
    { key: 'rule',       width: 30 },
    { key: 'column',     width: 26 },
    { key: 'detail',     width: 65 },
  ];

  val.mergeCells('A1:C1');
  const valTitle = val.getCell('A1');
  valTitle.value = 'VALIDATION RULES — applied during upload';
  valTitle.font = { bold: true, size: 12, color: { argb: WHITE } };
  valTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  valTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  val.getRow(1).height = 26;

  const valHeader = val.getRow(2);
  ['Validation Rule', 'Applies To Column', 'Detail'].forEach((h, i) => {
    const cell = valHeader.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  valHeader.height = 22;

  const VALIDATIONS = [
    { rule: 'Not null / not empty',      column: 'All required columns (A–K)', detail: 'Columns A through K must have a value for every row. Blank rows are skipped.' },
    { rule: 'Unique identifier',         column: 'loan_id',                    detail: 'Each loan_id must be unique within the file.' },
    { rule: 'Non-negative integer',      column: 'dpd_as_of_reporting_date',   detail: 'Must be 0 or a positive whole number. Max accepted: 1825 (5 years).' },
    { rule: 'Positive number',           column: 'current_balance',            detail: 'Must be > 0. Loans with zero balance should be excluded from the tape.' },
    { rule: 'Positive number',           column: 'loan_disbursed_amount',      detail: 'Must be ≥ current_balance (balance cannot exceed original disbursement).' },
    { rule: 'Non-negative number',       column: 'total_overdue_amount',       detail: 'Must be 0 when dpd_as_of_reporting_date = 0.' },
    { rule: 'Valid date (YYYY-MM-DD)',   column: 'loan_disbursed_date',        detail: 'Must be a valid past date not later than the reporting cut-off date.' },
    { rule: 'Positive percentage',       column: 'interest_rate',              detail: 'Annual rate as a percentage (e.g. 16.5, not 0.165). Range: 0 < rate ≤ 100.' },
    { rule: 'Boolean value',             column: 'loan_written_off',           detail: 'Accepted values: TRUE, FALSE, 1, 0, Yes, No (case-insensitive).' },
    { rule: 'Boolean value',             column: 'repossession',               detail: 'Accepted values: TRUE, FALSE, 1, 0, Yes, No (case-insensitive).' },
    { rule: 'Non-negative number',       column: 'recovery_after_writeoff',    detail: 'Must be 0 when loan_written_off = FALSE.' },
    { rule: 'Min 11 columns',            column: 'File structure',             detail: 'The first row must be a header row with exact column names as specified.' },
    { rule: 'Max file size: 50 MB',      column: 'File',                       detail: 'Files larger than 50 MB should be split into multiple uploads.' },
    { rule: 'Accepted formats',          column: 'File',                       detail: '.xlsx (Excel) or .csv (comma-separated, UTF-8 encoded).' },
  ];

  VALIDATIONS.forEach((v, idx) => {
    const r = val.addRow([v.rule, v.column, v.detail]);
    const shade = idx % 2 === 0 ? LIGHT_GRAY : WHITE;
    r.eachCell({ includeEmpty: true }, cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: shade } };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    r.height = 22;
  });

  /* ── Write file ───────────────────────────────────────────── */
  const outPath = path.join(__dirname, '..', 'data', 'sample-loan-book-template.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log(`✓ Generated: ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
