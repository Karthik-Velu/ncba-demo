// Integration Schemas - Document type definitions, field maps,
// validations, mock feed history, errors, and test results.

export type FieldType = 'number' | 'string' | 'boolean' | 'date' | 'percent';

export interface FieldDef {
  key: string;
  label: string;
  section?: string;
  type: FieldType;
  required: boolean;
  sampleValue: string;
}

export interface DocTypeSchema {
  id: 'loan_book' | 'loan_performance_history' | 'financial_statements' | 'monthly_mis';
  name: string;
  shortName: string;
  description: string;
  note?: string;
  fields: FieldDef[];
  sections?: { name: string; fieldKeys: string[] }[];
  autoMapping: Record<string, string>;
  sftpConfig: { host: string; port: string; path: string; schedule: string; format: string };
}

// ============================================================
// Loan Book — Daily Snapshot (ongoing feed)
// ============================================================
const LOAN_BOOK_FIELDS: FieldDef[] = [
  { key: 'loanId', label: 'Loan ID', type: 'string', required: true, sampleValue: 'LN1001' },
  { key: 'applicationId', label: 'Application ID', type: 'string', required: true, sampleValue: 'APP2001' },
  { key: 'dpdAsOfReportingDate', label: 'DPD as of Reporting Date', type: 'number', required: true, sampleValue: '0' },
  { key: 'currentBalance', label: 'Current Balance', type: 'number', required: true, sampleValue: '83413.02' },
  { key: 'loanDisbursedAmount', label: 'Loan Disbursed Amount', type: 'number', required: true, sampleValue: '110555.29' },
  { key: 'totalOverdueAmount', label: 'Total Overdue Amount', type: 'number', required: true, sampleValue: '0' },
  { key: 'loanDisbursedDate', label: 'Loan Disbursed Date', type: 'date', required: true, sampleValue: '2025-01-15' },
  { key: 'interestRate', label: 'Interest Rate', type: 'percent', required: true, sampleValue: '16.49' },
  { key: 'loanWrittenOff', label: 'Loan Written Off', type: 'boolean', required: true, sampleValue: 'FALSE' },
  { key: 'repossession', label: 'Repossession', type: 'boolean', required: true, sampleValue: 'FALSE' },
  { key: 'recoveryAfterWriteoff', label: 'Recovery after Writeoff', type: 'number', required: true, sampleValue: '0' },
  { key: 'geography', label: 'Geography', type: 'string', required: false, sampleValue: 'Nairobi' },
  { key: 'product', label: 'Product', type: 'string', required: false, sampleValue: 'MSME Loan' },
  { key: 'segment', label: 'Segment', type: 'string', required: false, sampleValue: 'Individual' },
  { key: 'borrowerName', label: 'Borrower Name', type: 'string', required: false, sampleValue: 'Chebet Wambui' },
  { key: 'residualTenureMonths', label: 'Residual Tenure (Months)', type: 'number', required: false, sampleValue: '27' },
];

const LOAN_BOOK_AUTO_MAP: Record<string, string> = {
  'loan_id': 'loanId',
  'application_id': 'applicationId',
  'dpd_as_of_reporting_date': 'dpdAsOfReportingDate',
  'dpd': 'dpdAsOfReportingDate',
  'days_past_due': 'dpdAsOfReportingDate',
  'current_balance': 'currentBalance',
  'outstanding_balance': 'currentBalance',
  'loan_disbursed_amount': 'loanDisbursedAmount',
  'principal_amount': 'loanDisbursedAmount',
  'disbursed_amount': 'loanDisbursedAmount',
  'total_overdue_amount': 'totalOverdueAmount',
  'overdue_amount': 'totalOverdueAmount',
  'loan_disbursed_date': 'loanDisbursedDate',
  'disbursement_date': 'loanDisbursedDate',
  'interest_rate': 'interestRate',
  'rate': 'interestRate',
  'loan_written_off': 'loanWrittenOff',
  'written_off': 'loanWrittenOff',
  'repossession': 'repossession',
  'recovery_after_writeoff': 'recoveryAfterWriteoff',
  'recovery_amount': 'recoveryAfterWriteoff',
  'geography': 'geography',
  'county': 'geography',
  'region': 'geography',
  'product': 'product',
  'loan_product': 'product',
  'segment': 'segment',
  'customer_segment': 'segment',
  'borrower_name': 'borrowerName',
  'customer_name': 'borrowerName',
  'residual_tenure_months': 'residualTenureMonths',
  'remaining_tenure': 'residualTenureMonths',
};

// ============================================================
// Loan Performance History — Initial Upload (12–36 months)
// Long format: one row per loan per reporting period
// Wide format (auto-detected): one row per loan, dpd_YYYY_MM / bal_YYYY_MM columns
// ============================================================
const HISTORY_LONG_FIELDS: FieldDef[] = [
  { key: 'loanId', label: 'Loan ID', section: 'Loan Identifier', type: 'string', required: true, sampleValue: 'LN1001' },
  { key: 'reportingDate', label: 'Reporting Date', section: 'Loan Identifier', type: 'date', required: true, sampleValue: '2023-01-31' },
  { key: 'dpd', label: 'Days Past Due (DPD)', section: 'Performance', type: 'number', required: true, sampleValue: '0' },
  { key: 'currentBalance', label: 'Current Balance', section: 'Performance', type: 'number', required: true, sampleValue: '83413.02' },
  { key: 'overdueAmount', label: 'Overdue Amount', section: 'Performance', type: 'number', required: true, sampleValue: '0' },
  { key: 'writtenOff', label: 'Written Off Flag', section: 'Performance', type: 'boolean', required: true, sampleValue: 'FALSE' },
  { key: 'repossession', label: 'Repossession Flag', section: 'Performance', type: 'boolean', required: true, sampleValue: 'FALSE' },
  { key: 'recoveryAmount', label: 'Recovery Amount', section: 'Performance', type: 'number', required: true, sampleValue: '0' },
  { key: 'disbursedAmount', label: 'Loan Disbursed Amount', section: 'Static Attributes', type: 'number', required: true, sampleValue: '110555.29' },
  { key: 'disbursedDate', label: 'Loan Disbursed Date', section: 'Static Attributes', type: 'date', required: true, sampleValue: '2022-06-15' },
  { key: 'interestRate', label: 'Interest Rate', section: 'Static Attributes', type: 'percent', required: true, sampleValue: '16.49' },
  { key: 'residualTenureMonths', label: 'Residual Tenure (Months)', section: 'Static Attributes', type: 'number', required: false, sampleValue: '27' },
  { key: 'geography', label: 'Geography', section: 'Segmentation', type: 'string', required: false, sampleValue: 'Nairobi' },
  { key: 'product', label: 'Product', section: 'Segmentation', type: 'string', required: false, sampleValue: 'MSME Loan' },
  { key: 'segment', label: 'Segment', section: 'Segmentation', type: 'string', required: false, sampleValue: 'Individual' },
  { key: 'borrowerName', label: 'Borrower Name', section: 'Segmentation', type: 'string', required: false, sampleValue: 'Chebet Wambui' },
];

const HISTORY_WIDE_FIELDS: FieldDef[] = [
  { key: 'loanId', label: 'Loan ID', section: 'Loan Identifier', type: 'string', required: true, sampleValue: 'LN1001' },
  { key: 'disbursedDate', label: 'Loan Disbursed Date', section: 'Static Attributes', type: 'date', required: true, sampleValue: '2022-06-15' },
  { key: 'disbursedAmount', label: 'Loan Disbursed Amount', section: 'Static Attributes', type: 'number', required: true, sampleValue: '110555.29' },
  { key: 'interestRate', label: 'Interest Rate', section: 'Static Attributes', type: 'percent', required: false, sampleValue: '16.49' },
  { key: 'geography', label: 'Geography', section: 'Segmentation', type: 'string', required: false, sampleValue: 'Nairobi' },
  { key: 'product', label: 'Product', section: 'Segmentation', type: 'string', required: false, sampleValue: 'MSME Loan' },
  { key: 'segment', label: 'Segment', section: 'Segmentation', type: 'string', required: false, sampleValue: 'Individual' },
  { key: 'dpd_2023_01', label: 'DPD — Jan 2023', section: 'Period DPD Columns', type: 'number', required: false, sampleValue: '0' },
  { key: 'bal_2023_01', label: 'Balance — Jan 2023', section: 'Period DPD Columns', type: 'number', required: false, sampleValue: '105000.00' },
  { key: 'dpd_2023_02', label: 'DPD — Feb 2023', section: 'Period DPD Columns', type: 'number', required: false, sampleValue: '0' },
  { key: 'bal_2023_02', label: 'Balance — Feb 2023', section: 'Period DPD Columns', type: 'number', required: false, sampleValue: '101200.00' },
  { key: 'dpd_YYYY_MM', label: 'DPD — [period] (repeat pattern)', section: 'Period DPD Columns', type: 'number', required: false, sampleValue: '31' },
  { key: 'bal_YYYY_MM', label: 'Balance — [period] (repeat pattern)', section: 'Period DPD Columns', type: 'number', required: false, sampleValue: '94000.00' },
];

const HISTORY_SECTIONS_LONG = [
  { name: 'Loan Identifier', fieldKeys: ['loanId', 'reportingDate'] },
  { name: 'Performance (per period)', fieldKeys: ['dpd', 'currentBalance', 'overdueAmount', 'writtenOff', 'repossession', 'recoveryAmount'] },
  { name: 'Static Attributes', fieldKeys: ['disbursedAmount', 'disbursedDate', 'interestRate', 'residualTenureMonths'] },
  { name: 'Segmentation', fieldKeys: ['geography', 'product', 'segment', 'borrowerName'] },
];

const HISTORY_AUTO_MAP_LONG: Record<string, string> = {
  'loan_id': 'loanId',
  'reporting_date': 'reportingDate',
  'report_date': 'reportingDate',
  'as_of_date': 'reportingDate',
  'period_date': 'reportingDate',
  'dpd': 'dpd',
  'days_past_due': 'dpd',
  'current_balance': 'currentBalance',
  'outstanding_balance': 'currentBalance',
  'overdue_amount': 'overdueAmount',
  'total_overdue': 'overdueAmount',
  'written_off': 'writtenOff',
  'write_off_flag': 'writtenOff',
  'repossession': 'repossession',
  'recovery_amount': 'recoveryAmount',
  'disbursed_amount': 'disbursedAmount',
  'loan_disbursed_amount': 'disbursedAmount',
  'disbursed_date': 'disbursedDate',
  'loan_disbursed_date': 'disbursedDate',
  'interest_rate': 'interestRate',
  'residual_tenure_months': 'residualTenureMonths',
  'remaining_tenure': 'residualTenureMonths',
  'geography': 'geography',
  'county': 'geography',
  'product': 'product',
  'segment': 'segment',
  'borrower_name': 'borrowerName',
};

// Financial Statements — Balance Sheet
const BS_FIELDS: FieldDef[] = [
  { key: 'share_capital_a', label: 'Share capital / Partners Funds', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '20.00' },
  { key: 'reserves_surplus_a', label: 'Reserves and surplus', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '28243.38' },
  { key: 'share_warrants_a', label: 'Money received against share warrants', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'share_app_money', label: 'Share application money pending allotment', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'lt_borrowings_a', label: 'Long-term borrowings', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '0' },
  { key: 'deferred_tax_liab_a', label: 'Deferred tax liabilities (net)', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'other_lt_liab_a', label: 'Other long term liabilities', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'lt_provisions_a', label: 'Long term provisions', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'st_borrowings_a', label: 'Short-term borrowings', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '104496.81' },
  { key: 'trade_payables_a', label: 'Trade payables', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '1046.05' },
  { key: 'other_current_liab_a', label: 'Other current liabilities', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '1542.24' },
  { key: 'st_provisions_a', label: 'Short-term provisions', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'total_eq_liab', label: 'Total Equity and Liabilities', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '135348.48' },
  { key: 'tangible_assets_a', label: 'Tangible assets', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '802.54' },
  { key: 'intangible_assets_a', label: 'Intangible assets', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '124.70' },
  { key: 'cwip_a', label: 'Capital work-in-progress', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'intangible_dev_a', label: 'Intangible assets under development', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'non_current_inv_a', label: 'Non-current investments', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'deferred_tax_asset_a', label: 'Deferred tax assets (net)', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '2142.10' },
  { key: 'lt_loans_a', label: 'Long-term loans and advances', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'other_non_current_a', label: 'Other non-current assets', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'current_inv_a', label: 'Current investments', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '40528.70' },
  { key: 'inventories_a', label: 'Inventories', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '0' },
  { key: 'trade_recv_a', label: 'Trade receivables / Sundry Debtors', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '3764.22' },
  { key: 'cash_equiv_a', label: 'Cash and cash equivalents', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '3605.17' },
  { key: 'st_loans_a', label: 'Short-term loans and advances', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '81381.05' },
  { key: 'other_current_assets_a', label: 'Other current assets', section: 'Balance Sheet', type: 'number', required: false, sampleValue: '3000.00' },
  { key: 'total_assets', label: 'Total Assets', section: 'Balance Sheet', type: 'number', required: true, sampleValue: '135348.48' },
];

const PL_FIELDS: FieldDef[] = [
  { key: 'revenue_ops', label: 'Revenue from operations', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '48450.25' },
  { key: 'other_income_pl', label: 'Other Income', section: 'Profit and Loss', type: 'number', required: false, sampleValue: '934.75' },
  { key: 'total_revenue_pl', label: 'Total Revenue', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '49385.00' },
  { key: 'employee_exp', label: 'Employee benefit expenses', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '8450.20' },
  { key: 'finance_cost_pl', label: 'Finance cost', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '11905.25' },
  { key: 'depreciation_pl', label: 'Depreciation and amortization', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '354.52' },
  { key: 'impairment_pl', label: 'Impairment losses', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '3480.95' },
  { key: 'other_exp_pl', label: 'Other expenses', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '16020.10' },
  { key: 'total_exp_pl', label: 'Total expenses', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '40211.02' },
  { key: 'pbt_pl', label: 'Profit before tax', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '9173.98' },
  { key: 'current_tax', label: 'Current tax', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '2523.18' },
  { key: 'deferred_tax_pl', label: 'Deferred tax', section: 'Profit and Loss', type: 'number', required: false, sampleValue: '0' },
  { key: 'pat_pl', label: 'Profit After Tax', section: 'Profit and Loss', type: 'number', required: true, sampleValue: '6650.80' },
];

const CF_FIELDS: FieldDef[] = [
  { key: 'cf_pbt', label: 'Net Profit/(Loss) before tax', section: 'Cash Flow', type: 'number', required: true, sampleValue: '8144.61' },
  { key: 'cf_dep', label: 'Depreciation', section: 'Cash Flow', type: 'number', required: true, sampleValue: '343.22' },
  { key: 'cf_amort', label: 'Amortization', section: 'Cash Flow', type: 'number', required: false, sampleValue: '11.30' },
  { key: 'cf_fx_loss', label: 'Net loss on foreign currency transactions', section: 'Cash Flow', type: 'number', required: false, sampleValue: '1383.89' },
  { key: 'cf_prov', label: 'Provision for doubtful receivables', section: 'Cash Flow', type: 'number', required: true, sampleValue: '3480.95' },
  { key: 'cf_int_exp', label: 'Interest expense on Borrowings', section: 'Cash Flow', type: 'number', required: true, sampleValue: '10688.42' },
  { key: 'cf_other_fin', label: 'Other Finance Cost (operating)', section: 'Cash Flow', type: 'number', required: false, sampleValue: '1216.83' },
  { key: 'cf_op_profit_adj', label: 'Operating Profit before WC Changes (adj)', section: 'Cash Flow', type: 'number', required: false, sampleValue: '25269.22' },
  { key: 'cf_int_inc', label: 'Interest income', section: 'Cash Flow', type: 'number', required: false, sampleValue: '521.90' },
  { key: 'cf_ppe_profit', label: 'Profit on sale of Fixed assets', section: 'Cash Flow', type: 'number', required: false, sampleValue: '26.69' },
  { key: 'cf_op_profit_wc', label: 'Operating profit before WC changes', section: 'Cash Flow', type: 'number', required: false, sampleValue: '24720.63' },
  { key: 'cf_trade_recv', label: 'Change in Trade receivables', section: 'Cash Flow', type: 'number', required: true, sampleValue: '139.23' },
  { key: 'cf_st_loans', label: 'Change in Short-term loans', section: 'Cash Flow', type: 'number', required: true, sampleValue: '-12554.88' },
  { key: 'cf_other_ca', label: 'Change in Other Current assets', section: 'Cash Flow', type: 'number', required: false, sampleValue: '-947.32' },
  { key: 'cf_trade_pay', label: 'Change in Trade payables', section: 'Cash Flow', type: 'number', required: true, sampleValue: '-1577.67' },
  { key: 'cf_other_cl', label: 'Change in Other Current liabilities', section: 'Cash Flow', type: 'number', required: false, sampleValue: '-397.31' },
  { key: 'cf_tax_paid', label: 'Net income tax (paid)/refunds', section: 'Cash Flow', type: 'number', required: true, sampleValue: '-2872.17' },
  { key: 'cf_net_ops', label: 'Net cash flow from operating activities', section: 'Cash Flow', type: 'number', required: true, sampleValue: '6510.51' },
  { key: 'cf_tangible_sale', label: 'Proceeds from sale of Tangible assets', section: 'Cash Flow', type: 'number', required: false, sampleValue: '-362.91' },
  { key: 'cf_intangible_sale', label: 'Proceeds from sale of Intangible assets', section: 'Cash Flow', type: 'number', required: false, sampleValue: '-136.00' },
  { key: 'cf_other_fa', label: 'Purchase/sale of other Fixed Assets', section: 'Cash Flow', type: 'number', required: false, sampleValue: '534.40' },
  { key: 'cf_fa_pl', label: 'Profit/(Loss) on sale of Fixed Assets', section: 'Cash Flow', type: 'number', required: false, sampleValue: '26.69' },
  { key: 'cf_current_inv', label: 'Sale/(Purchase) of Current investments', section: 'Cash Flow', type: 'number', required: false, sampleValue: '-25671.88' },
  { key: 'cf_inv_interest', label: 'Interest received from Investments', section: 'Cash Flow', type: 'number', required: false, sampleValue: '521.90' },
  { key: 'cf_inv_fx', label: 'Net forex loss (investing)', section: 'Cash Flow', type: 'number', required: false, sampleValue: '-1383.89' },
  { key: 'cf_net_inv', label: 'Net cash flow from investing activities', section: 'Cash Flow', type: 'number', required: true, sampleValue: '-26471.69' },
  { key: 'cf_equity_issue', label: 'Proceeds from issue of equity shares', section: 'Cash Flow', type: 'number', required: false, sampleValue: '0' },
  { key: 'cf_sec_premium', label: 'Proceeds from Security Premium', section: 'Cash Flow', type: 'number', required: false, sampleValue: '0' },
  { key: 'cf_st_borrow', label: 'Proceeds/(Repayment) of ST borrowings', section: 'Cash Flow', type: 'number', required: true, sampleValue: '33835.53' },
  { key: 'cf_fin_int', label: 'Interest expense (financing)', section: 'Cash Flow', type: 'number', required: true, sampleValue: '-10688.42' },
  { key: 'cf_fin_other', label: 'Other Finance Cost (financing)', section: 'Cash Flow', type: 'number', required: false, sampleValue: '-1216.83' },
  { key: 'cf_net_fin', label: 'Net cash flow from financing activities', section: 'Cash Flow', type: 'number', required: true, sampleValue: '21930.28' },
  { key: 'cf_net_change', label: 'Net change in Cash and equivalents', section: 'Cash Flow', type: 'number', required: true, sampleValue: '1969.10' },
  { key: 'cf_opening', label: 'Opening Cash and equivalents', section: 'Cash Flow', type: 'number', required: true, sampleValue: '8043.45' },
  { key: 'cf_closing', label: 'Closing Cash and equivalents', section: 'Cash Flow', type: 'number', required: true, sampleValue: '10012.55' },
];

const FS_META_FIELDS: FieldDef[] = [
  { key: 'fs_period_date', label: 'Period End Date', section: 'Metadata', type: 'date', required: true, sampleValue: '2023-12-31' },
  { key: 'fs_period_type', label: 'Period Type', section: 'Metadata', type: 'string', required: true, sampleValue: 'Audited' },
  { key: 'fs_months', label: 'Months in Period', section: 'Metadata', type: 'number', required: true, sampleValue: '12' },
  { key: 'fs_org_name', label: 'Organisation Name', section: 'Metadata', type: 'string', required: true, sampleValue: 'Sample NBFI Ltd' },
  { key: 'fs_audit_firm', label: 'Audit Firm', section: 'Metadata', type: 'string', required: false, sampleValue: 'Deloitte Kenya' },
  { key: 'fs_audit_opinion', label: 'Audit Opinion', section: 'Metadata', type: 'string', required: false, sampleValue: 'Unqualified' },
];

const ALL_FS_FIELDS = [...FS_META_FIELDS, ...BS_FIELDS, ...PL_FIELDS, ...CF_FIELDS];

const FS_AUTO_MAP: Record<string, string> = {};
ALL_FS_FIELDS.forEach(f => { FS_AUTO_MAP[f.label] = f.key; });

const FS_SECTIONS = [
  { name: 'Metadata', fieldKeys: FS_META_FIELDS.map(f => f.key) },
  { name: 'Balance Sheet', fieldKeys: BS_FIELDS.map(f => f.key) },
  { name: 'Profit and Loss', fieldKeys: PL_FIELDS.map(f => f.key) },
  { name: 'Cash Flow', fieldKeys: CF_FIELDS.map(f => f.key) },
];

// Monthly MIS fields
const MIS_FIELDS: FieldDef[] = [
  { key: 'mis_reporting_month', label: 'Reporting Month', type: 'date', required: true, sampleValue: '2025-01' },
  { key: 'mis_management_revenue', label: 'Management Revenue', type: 'number', required: true, sampleValue: '4250.00' },
  { key: 'mis_interest_income', label: 'Interest Income', type: 'number', required: true, sampleValue: '3400.00' },
  { key: 'mis_fee_income', label: 'Fee and Commission Income', type: 'number', required: false, sampleValue: '850.00' },
  { key: 'mis_management_expenses', label: 'Management Expenses', type: 'number', required: true, sampleValue: '2800.00' },
  { key: 'mis_staff_costs', label: 'Staff Costs', type: 'number', required: true, sampleValue: '750.00' },
  { key: 'mis_operating_expenses', label: 'Operating Expenses', type: 'number', required: true, sampleValue: '1200.00' },
  { key: 'mis_finance_cost', label: 'Finance Cost', type: 'number', required: true, sampleValue: '650.00' },
  { key: 'mis_impairment_charge', label: 'Impairment Charge', type: 'number', required: true, sampleValue: '200.00' },
  { key: 'mis_management_pbt', label: 'Management PBT', type: 'number', required: true, sampleValue: '1450.00' },
  { key: 'mis_management_pat', label: 'Management PAT', type: 'number', required: true, sampleValue: '1015.00' },
  { key: 'mis_cash_and_bank', label: 'Cash and Bank Balances', type: 'number', required: true, sampleValue: '3800.00' },
  { key: 'mis_total_assets', label: 'Total Assets (Summary)', type: 'number', required: true, sampleValue: '142000.00' },
  { key: 'mis_total_liabilities', label: 'Total Liabilities (Summary)', type: 'number', required: true, sampleValue: '112000.00' },
  { key: 'mis_total_equity', label: 'Total Equity (Summary)', type: 'number', required: true, sampleValue: '30000.00' },
  { key: 'mis_gross_loan_book', label: 'Gross Loan Book (Summary)', type: 'number', required: true, sampleValue: '95000.00' },
  { key: 'mis_total_provisions', label: 'Total Provisions', type: 'number', required: true, sampleValue: '4200.00' },
  { key: 'mis_headcount', label: 'Headcount', type: 'number', required: false, sampleValue: '245' },
  { key: 'mis_branch_count', label: 'Branch Count', type: 'number', required: false, sampleValue: '12' },
  { key: 'mis_cost_to_income', label: 'Cost-to-Income Ratio', type: 'percent', required: false, sampleValue: '65.8' },
];

const MIS_AUTO_MAP: Record<string, string> = {};
MIS_FIELDS.forEach(f => { MIS_AUTO_MAP[f.label] = f.key; });

// ============================================================
// Document Type Schemas
// ============================================================
export const DOC_TYPE_SCHEMAS: DocTypeSchema[] = [
  {
    id: 'loan_book',
    name: 'Daily Loan Tape',
    shortName: 'Loan Tape',
    description: 'Full dump of every active loan as of the reporting date. One row per loan. Powers real-time PAR tracking, covenant monitoring, and portfolio dashboards. Must be delivered daily via SFTP or portal upload. File naming convention: loanbook_YYYYMMDD.csv.',
    note: 'This is the ONGOING daily feed. For the initial 12–36 month history required for EDA, vintage analysis, and ECL calibration, use the “Loan Performance History” document type.',
    fields: LOAN_BOOK_FIELDS,
    autoMapping: LOAN_BOOK_AUTO_MAP,
    sftpConfig: { host: 'sftp.wholesalelender.co.ke', port: '22', path: '/exports/loanbook/', schedule: 'Daily at 06:00 EAT', format: 'CSV (loanbook_YYYYMMDD.csv)' },
  },
  {
    id: 'loan_performance_history',
    name: 'Loan Performance History',
    shortName: 'Loan History',
    description: 'Historical loan-level performance data covering 12–36 months of monthly end-of-period snapshots. Required before the first EDA run. Powers vintage analysis, DPD migration (roll-rate) matrices, ECL calibration, and CDR/CNL calculations. Accepted in Long format (one row per loan per period) or Wide format (one row per loan, period DPD/balance as column pairs dpd_YYYY_MM / bal_YYYY_MM). Platform auto-detects format.',
    note: 'One-time upload at onboarding. Refreshed quarterly or on lender request. Minimum 12 reporting periods required; 24–36 recommended for mature cohort coverage.',
    fields: HISTORY_LONG_FIELDS,
    sections: HISTORY_SECTIONS_LONG,
    autoMapping: HISTORY_AUTO_MAP_LONG,
    sftpConfig: { host: 'sftp.wholesalelender.co.ke', port: '22', path: '/exports/loanhistory/', schedule: 'One-time / Quarterly refresh', format: 'CSV or XLSX (long or wide)' },
  },
  {
    id: 'financial_statements',
    name: 'Financial Statements (Audited)',
    shortName: 'Financials',
    description: 'Audited annual financial statements: balance sheet, income statement, and cash flow. Period date must be fiscal year-end. Upload at least 2–3 consecutive years for trend analysis. 80+ line items aligned to the platform spreading model. Format: XLSX using the provided template.',
    note: 'Unaudited interim accounts (management accounts) should be submitted via the Monthly MIS document type, not here.',
    fields: ALL_FS_FIELDS,
    sections: FS_SECTIONS,
    autoMapping: FS_AUTO_MAP,
    sftpConfig: { host: 'sftp.wholesalelender.co.ke', port: '22', path: '/exports/financials/', schedule: 'Annually (within 90 days of fiscal year-end)', format: 'XLSX' },
  },
  {
    id: 'monthly_mis',
    name: 'Monthly MIS (Management Accounts)',
    shortName: 'Monthly MIS',
    description: 'Unaudited monthly management accounts: aggregate P&L, balance sheet summary, and operational KPIs. Submitted by the 5th business day of the following month. Provides inter-period visibility between audited annual filings. Does NOT include loan-level metrics — those are derived from the Daily Loan Tape.',
    note: 'The MIS gross loan book figure should reconcile within ±2% of the total balance from the most recent daily loan tape.',
    fields: MIS_FIELDS,
    autoMapping: MIS_AUTO_MAP,
    sftpConfig: { host: 'sftp.wholesalelender.co.ke', port: '22', path: '/exports/mis/', schedule: 'Monthly (5th business day)', format: 'XLSX' },
  },
];

export function getSchema(id: string): DocTypeSchema {
  return DOC_TYPE_SCHEMAS.find(s => s.id === id) || DOC_TYPE_SCHEMAS[0];
}

export function getHistoryWideFields(): FieldDef[] {
  return HISTORY_WIDE_FIELDS;
}

// ============================================================
// Validation Tests
// ============================================================
export interface ValidationTest {
  name: string;
  pass: boolean;
  detail?: string;
  severity: 'error' | 'warning';
}

export function getValidationTests(docTypeId: string): ValidationTest[] {
  if (docTypeId === 'loan_book') return [
    { name: 'All 11 required columns present', pass: true, severity: 'error' },
    { name: 'Loan ID is unique across all rows', pass: true, severity: 'error' },
    { name: 'DPD is numeric and non-negative', pass: true, severity: 'error' },
    { name: 'Balance fields are numeric (Current Balance, Disbursed, Overdue, Recovery)', pass: true, severity: 'error' },
    { name: 'Disbursement date format valid (YYYY-MM-DD)', pass: true, severity: 'error' },
    { name: 'Interest rate in range 0–100%', pass: true, severity: 'warning' },
    { name: 'Written Off and Repossession are valid boolean values', pass: true, severity: 'error' },
    { name: 'No null values in required columns', pass: false, detail: '2 rows with null Current Balance — auto-filled with 0 for preview', severity: 'warning' },
    { name: 'Current Balance ≤ Disbursed Amount', pass: true, severity: 'warning' },
    { name: 'No negative Current Balance', pass: false, detail: '1 row with negative Current Balance at row 142 — requires correction', severity: 'error' },
    { name: 'Geography values in known list (10 counties)', pass: true, severity: 'warning' },
    { name: 'No duplicate Application IDs', pass: true, severity: 'warning' },
  ];

  if (docTypeId === 'loan_performance_history') return [
    { name: 'All required columns present (loanId, reportingDate, dpd, currentBalance, disbursedAmount, overdueAmount, writtenOff, repossession, recoveryAmount, disbursedDate)', pass: true, severity: 'error' },
    { name: 'Reporting Date is a valid date (YYYY-MM-DD or end-of-month)', pass: true, severity: 'error' },
    { name: 'Minimum 6 distinct reporting periods present', pass: true, severity: 'error' },
    { name: 'At least 12 reporting periods detected (recommended for vintage coverage)', pass: false, detail: 'Only 8 periods found — recommend extending to 12–36 months for reliable ECL calibration', severity: 'warning' },
    { name: 'Reporting periods form a contiguous monthly sequence (no gaps)', pass: false, detail: 'Gap detected between 2022-09 and 2022-11 — one period missing', severity: 'warning' },
    { name: 'No future reporting dates', pass: true, severity: 'error' },
    { name: 'Loan IDs are consistent across all periods', pass: true, severity: 'warning' },
    { name: 'DPD is numeric and non-negative for all periods', pass: true, severity: 'error' },
    { name: 'Written-off flag is monotonic (once TRUE, remains TRUE)', pass: true, severity: 'warning' },
    { name: 'Recovery Amount ≤ Disbursed Amount for written-off loans', pass: true, severity: 'warning' },
    { name: 'DPD migration is plausible (no single-period improvement >90 days without cure evidence)', pass: true, severity: 'warning' },
    { name: 'Balance fields are numeric and non-negative', pass: true, severity: 'error' },
    { name: 'At least 30% of loans present in earliest period also appear in most recent period', pass: true, severity: 'warning' },
    { name: 'No duplicate (loanId, reportingDate) composite keys', pass: false, detail: '3 duplicate rows detected — likely double-entry for period 2023-06-30', severity: 'error' },
  ];

  if (docTypeId === 'financial_statements') return [
    { name: 'All required line items present', pass: true, severity: 'error' },
    { name: 'Period end date is valid (fiscal year-end)', pass: true, severity: 'error' },
    { name: 'All values are numeric', pass: true, severity: 'error' },
    { name: 'Balance Sheet balances: Total Assets = Total Equity + Total Liabilities', pass: true, severity: 'error' },
    { name: 'P&L totals reconcile (Total Revenue – Total Expenses = PBT)', pass: true, severity: 'error' },
    { name: 'Cash flow summary matches Operating + Investing + Financing', pass: false, detail: 'Rounding difference of KES 0.03 — acceptable tolerance', severity: 'warning' },
    { name: 'No negative equity', pass: true, severity: 'warning' },
    { name: 'Revenue > 0', pass: true, severity: 'warning' },
    { name: 'Audit opinion field present', pass: false, detail: 'Audit opinion column not found in source — required for Stage 1 ECL assessment', severity: 'warning' },
    { name: 'Period type recognised (Audited / Unaudited / Management)', pass: true, severity: 'error' },
  ];

  return [
    { name: 'All required fields present', pass: true, severity: 'error' },
    { name: 'Reporting month is a valid YYYY-MM date', pass: true, severity: 'error' },
    { name: 'All monetary values are numeric', pass: true, severity: 'error' },
    { name: 'Management Revenue > 0', pass: true, severity: 'warning' },
    { name: 'Total Assets ≥ Total Liabilities', pass: true, severity: 'warning' },
    { name: 'Management PBT ≈ Revenue – Expenses (within 2%)', pass: false, detail: 'Variance of KES 12.50 — may be due to rounding or unallocated adjustments', severity: 'warning' },
    { name: 'Cost-to-income ratio in range 0–200%', pass: true, severity: 'warning' },
    { name: 'Headcount is a positive integer', pass: true, severity: 'warning' },
    { name: 'Gross Loan Book (MIS) within ±2% of latest daily loan tape balance', pass: false, detail: 'MIS loan book KES 95.0M vs loan tape KES 97.2M — 2.3% variance, minor reconciliation needed', severity: 'warning' },
  ];
}

// ============================================================
// Mock Feed History
// ============================================================
export interface FeedRecord {
  id: string;
  date: string;
  time: string;
  source: 'sftp' | 'manual' | 'portal';
  uploadedBy: string;
  fileName: string;
  rows: number;
  periods?: number;
  status: 'success' | 'partial' | 'failed';
  errorCount: number;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

export function generateFeedHistory(docTypeId: string, days = 45): FeedRecord[] {
  const rand = seededRand(docTypeId.length * 1000 + 42);
  const records: FeedRecord[] = [];
  const now = new Date('2025-02-18');
  const uploaders = ['System (SFTP)', 'Sarah Kimani', 'Alice Wanjiku', 'James Ochieng'];
  const sources: ('sftp' | 'manual' | 'portal')[] = ['sftp', 'sftp', 'sftp', 'manual', 'portal'];

  const interval = docTypeId === 'loan_book' ? 1 : docTypeId === 'loan_performance_history' ? 90 : docTypeId === 'monthly_mis' ? 30 : 90;
  const baseRows = docTypeId === 'loan_book' ? 520 : docTypeId === 'loan_performance_history' ? 12480 : docTypeId === 'financial_statements' ? 82 : 20;
  const ext = (docTypeId === 'loan_book' || docTypeId === 'loan_performance_history') ? 'csv' : 'xlsx';
  const prefix = docTypeId === 'loan_book' ? 'loanbook' : docTypeId === 'loan_performance_history' ? 'loan_history' : docTypeId === 'financial_statements' ? 'financials' : 'mis_report';

  for (let d = 0; d < days; d++) {
    if (interval > 1 && d % interval !== 0 && d > 0) continue;
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    const r = rand();
    const failed = r < 0.08;
    const partial = !failed && r < 0.15;
    const src = sources[Math.floor(rand() * sources.length)];
    const rows = failed ? 0 : baseRows + Math.floor((rand() - 0.5) * 100);
    const errCount = failed ? 1 : partial ? Math.floor(rand() * 4) + 1 : 0;
    const periods = docTypeId === 'loan_performance_history' ? 24 : undefined;

    records.push({
      id: `feed-${docTypeId}-${dateStr}`,
      date: dateStr,
      time: interval === 1 ? '06:00' : '09:30',
      source: src,
      uploadedBy: src === 'sftp' ? 'System (SFTP)' : uploaders[Math.floor(rand() * uploaders.length)],
      fileName: docTypeId === 'loan_book' ? `loanbook_${dateStr.replace(/-/g, '')}.csv` : `${prefix}_${dateStr.replace(/-/g, '')}.${ext}`,
      rows,
      periods,
      status: failed ? 'failed' : partial ? 'partial' : 'success',
      errorCount: errCount,
    });
  }
  return records;
}

// ============================================================
// Mock Error Records
// ============================================================
export interface FeedError {
  id: string;
  uploadId: string;
  date: string;
  errorType: 'missing_field' | 'invalid_format' | 'out_of_range' | 'duplicate_key' | 'schema_mismatch' | 'sequence_gap' | 'monotonicity_violation';
  field: string;
  rowCount: number;
  message: string;
  severity: 'error' | 'warning';
  sampleRows: number[];
}

const ERROR_TYPES: { type: FeedError['errorType']; label: string }[] = [
  { type: 'missing_field', label: 'Missing Required Field' },
  { type: 'invalid_format', label: 'Invalid Format' },
  { type: 'out_of_range', label: 'Out of Range' },
  { type: 'duplicate_key', label: 'Duplicate Key' },
  { type: 'schema_mismatch', label: 'Schema Mismatch' },
  { type: 'sequence_gap', label: 'Sequence Gap' },
  { type: 'monotonicity_violation', label: 'Data Consistency Issue' },
];

export function getErrorTypeLabel(t: string): string {
  return ERROR_TYPES.find(e => e.type === t)?.label ?? t;
}

export function generateErrors(docTypeId: string): FeedError[] {
  const rand = seededRand(docTypeId.length * 7 + 99);
  const errors: FeedError[] = [];
  const now = new Date('2025-02-18');
  const schema = getSchema(docTypeId);
  const fieldKeys = schema.fields.filter(f => f.required).map(f => f.key);
  const baseErrTypes: FeedError['errorType'][] = ['missing_field', 'invalid_format', 'out_of_range', 'duplicate_key', 'schema_mismatch'];
  const historyErrTypes: FeedError['errorType'][] = [...baseErrTypes, 'sequence_gap', 'monotonicity_violation'];
  const errTypes = docTypeId === 'loan_performance_history' ? historyErrTypes : baseErrTypes;
  const messages: Record<string, string[]> = {
    missing_field: ['Column not found in source file', 'Null value in required field', 'Empty column after row 200'],
    invalid_format: ['Expected number, got text', 'Date format not recognised — expected YYYY-MM-DD', 'Boolean field contains numeric value (use TRUE/FALSE)'],
    out_of_range: ['Negative balance detected', 'Interest rate exceeds 100%', 'DPD value is negative'],
    duplicate_key: ['Duplicate Loan ID found', 'Duplicate (loanId, reportingDate) composite key', 'Application ID already exists in this period'],
    schema_mismatch: ['Extra columns in source file', 'Column count mismatch', 'Unmapped source column: "Misc"'],
    sequence_gap: ['Reporting period gap: 2022-09 and 2022-11 found but 2022-10 missing', 'Non-contiguous periods detected — ensure all month-end dates are present'],
    monotonicity_violation: ['Written-off flag reverted to FALSE after being TRUE (loan LN2045, period 2023-08)', 'DPD decreased by 120 days in one period without matching recovery (loan LN1892)'],
  };

  for (let i = 0; i < 18; i++) {
    const daysAgo = Math.floor(rand() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const errType = errTypes[Math.floor(rand() * errTypes.length)];
    const field = fieldKeys[Math.floor(rand() * fieldKeys.length)];
    const msgs = messages[errType];
    const rowCount = Math.floor(rand() * 8) + 1;
    errors.push({
      id: `err-${docTypeId}-${i}`,
      uploadId: `feed-${docTypeId}-${date.toISOString().split('T')[0]}`,
      date: date.toISOString().split('T')[0],
      errorType: errType,
      field,
      rowCount,
      message: msgs[Math.floor(rand() * msgs.length)],
      severity: (errType === 'duplicate_key' || errType === 'schema_mismatch' || errType === 'sequence_gap') ? 'warning' : 'error',
      sampleRows: Array.from({ length: Math.min(rowCount, 5) }, () => Math.floor(rand() * 500) + 1),
    });
  }
  return errors.sort((a, b) => b.date.localeCompare(a.date));
}
