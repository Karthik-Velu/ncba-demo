import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kaleidofin — POC Proposal for NCBA',
  description: 'Credit Intelligence for NBFI Wholesale Lending',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
