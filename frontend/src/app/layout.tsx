import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mobile App Manager | Polygon Ecosystem',
  description:
    'Mobile Application Operations & Database Table Excel Exporter for Developer & QA Teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
