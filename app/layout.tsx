import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lernplattform für Digitale Grundbildung',
  description:
    'Interaktive Lernplattform und Materialbibliothek für die österreichische Digitale Grundbildung (Sek I).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de-AT" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
