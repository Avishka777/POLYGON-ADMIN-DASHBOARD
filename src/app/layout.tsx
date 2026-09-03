import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DataFlow - Database Table Excel Exporter',
  description:
    'Fullstack Next.js tool to inspect PostgreSQL & MySQL databases, preview tables, and export live data to Excel (.xlsx) and CSV files.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-slate-950 text-slate-100">
      <body className="min-h-full flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
