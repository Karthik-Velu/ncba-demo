import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const workbook = new ExcelJS.Workbook();

    // ---- Tab 1: NBFI ----
    const nbfiSheet = workbook.addWorksheet('NBFI');
    const nbfiOutput = data.nbfiOutput;

    // Header
    nbfiSheet.columns = [
      { header: '', key: 'label', width: 45 },
      { header: '', key: 'val1', width: 18 },
      { header: '', key: 'pct1', width: 12 },
      { header: '', key: 'val2', width: 18 },
      { header: '', key: 'pct2', width: 12 },
    ];

    // Metadata rows
    const periods = nbfiOutput.periods || [];
    nbfiSheet.addRow(['Statement Type', periods[0]?.type || 'Audited', '%Ann.', periods[1]?.type || 'Audited', '%Ann.']);
    nbfiSheet.addRow(['Auditors', '', 'Chg', '', 'Chg']);
    nbfiSheet.addRow(['Opinion', '', '', '', '']);
    nbfiSheet.addRow(['Statement Date (dd/mm/yyyy)', periods[0]?.date || '', '', periods[1]?.date || '', '']);
    nbfiSheet.addRow(['Period (Months)', periods[0]?.months || 12, '', periods[1]?.months || 12, '']);
    nbfiSheet.addRow(["Amounts in KES '000"]);
    nbfiSheet.addRow([]);

    // Balance Sheet, Income Statement, CF Summary
    const sections = [nbfiOutput.balanceSheet, nbfiOutput.incomeStatement, nbfiOutput.cashflowSummary].filter(Boolean);
    for (const section of sections) {
      nbfiSheet.addRow([section.title]).font = { bold: true, size: 11 };
      if (section.title === 'INCOME STATEMENT') nbfiSheet.addRow([]);
      for (const row of section.rows || []) {
        const r = nbfiSheet.addRow([
          row.label,
          row.values?.[0] ?? '',
          row.pctChanges?.[0] ?? '',
          row.values?.[1] ?? '',
          row.pctChanges?.[1] ?? '',
        ]);
        if (row.isHeader) r.font = { bold: true };
        if (row.isTotal) { r.font = { bold: true }; }
      }
      nbfiSheet.addRow([]);
    }

    // BCC Summary
    nbfiSheet.addRow([]).height = 10;
    nbfiSheet.addRow(['BCC SUMMARY']).font = { bold: true, size: 11 };
    nbfiSheet.addRow(["Indicator (KES '000')", periods[0]?.date || '', '%Ann. Chg', periods[1]?.date || '', '%Ann. Chg']).font = { bold: true };
    for (const row of nbfiOutput.bccSummary || []) {
      nbfiSheet.addRow([row.label, row.values?.[0] ?? '', row.pctChanges?.[0] ?? '', row.values?.[1] ?? '', row.pctChanges?.[1] ?? '']);
    }

    // Style the NBFI sheet
    nbfiSheet.getColumn(1).alignment = { wrapText: true };
    nbfiSheet.getColumn(2).numFmt = '#,##0.00';
    nbfiSheet.getColumn(4).numFmt = '#,##0.00';

    // ---- Tab 2: Input Template ----
    const inputSheet = workbook.addWorksheet('Input Template');
    const inputData = data.inputTemplate;

    inputSheet.columns = [
      { header: 'Sl. No.', key: 'sl', width: 8 },
      { header: 'Particulars', key: 'label', width: 50 },
      { header: 'Current Period', key: 'val1', width: 18 },
      { header: 'Previous Period', key: 'val2', width: 18 },
    ];

    inputSheet.addRow(['', `Name of the Organisation: ${inputData.orgName || 'Sample NBFI Ltd'}`]);
    inputSheet.addRow([]);

    // Part A
    for (const section of [inputData.partA?.balanceSheet, inputData.partA?.profitAndLoss].filter(Boolean)) {
      inputSheet.addRow(['', section.title]).font = { bold: true };
      inputSheet.addRow([]);
      for (const row of section.rows || []) {
        const r = inputSheet.addRow(['', row.label, row.values?.[0] ?? '', row.values?.[1] ?? '']);
        if (row.isHeader) r.font = { bold: true };
        if (row.isTotal) r.font = { bold: true };
        if (row.indent > 0) {
          const cell = r.getCell(2);
          cell.alignment = { indent: row.indent * 2 };
        }
      }
      inputSheet.addRow([]);
    }

    inputSheet.getColumn(3).numFmt = '#,##0.00';
    inputSheet.getColumn(4).numFmt = '#,##0.00';

    // ---- Tab 3: Cash Flow Statement ----
    const cfSheet = workbook.addWorksheet('Cash Flow Statement');
    const cfData = data.cashFlow;

    cfSheet.columns = [
      { header: '', key: 'sl', width: 5 },
      { header: 'Particulars', key: 'label', width: 55 },
      { header: cfData.periods?.[0]?.date || 'Period 1', key: 'val1', width: 18 },
      { header: cfData.periods?.[1]?.date || 'Period 2', key: 'val2', width: 18 },
    ];

    for (const section of cfData.sections || []) {
      cfSheet.addRow(['', section.title]).font = { bold: true };
      for (const row of section.rows || []) {
        const r = cfSheet.addRow(['', row.label, row.values?.[0] ?? '', row.values?.[1] ?? '']);
        if (row.isHeader) r.font = { bold: true };
        if (row.isTotal) r.font = { bold: true };
        if (row.indent > 0) {
          const cell = r.getCell(2);
          cell.alignment = { indent: row.indent * 2 };
        }
      }
      cfSheet.addRow([]);
    }

    cfSheet.getColumn(3).numFmt = '#,##0.00';
    cfSheet.getColumn(4).numFmt = '#,##0.00';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="MFI_Financial_Spreads_Output.xlsx"',
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
