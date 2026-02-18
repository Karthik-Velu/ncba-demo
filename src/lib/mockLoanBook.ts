import type { LoanLevelRow } from '@/lib/types';
import mockData from '../../data/mock-loan-book.json';

const allLoans: LoanLevelRow[] = mockData as LoanLevelRow[];

export function generateMockLoanBook(count?: number): LoanLevelRow[] {
  if (!count || count >= allLoans.length) return allLoans;
  return allLoans.slice(0, count);
}

export const MOCK_LOAN_BOOK: LoanLevelRow[] = allLoans;
