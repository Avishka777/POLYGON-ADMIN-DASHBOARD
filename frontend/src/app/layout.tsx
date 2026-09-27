import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'Mobile App Manager | Polygon Ecosystem',
  description:
    'Mobile Application Operations, Database Table Excel Exporter & Scale Simulator for Developer & QA Teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased selection:bg-purple-500 selection:text-white relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider>
          {/* Glassmorphic Ambient Gradient Blurs */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-500/15 dark:bg-purple-600/15 blur-3xl animate-pulse" />
            <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-indigo-500/15 dark:bg-indigo-600/15 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-amber-500/10 dark:bg-amber-600/10 blur-3xl" />
          </div>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
