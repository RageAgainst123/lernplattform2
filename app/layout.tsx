import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { SiteShell } from '@/components/site/SiteShell';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.baseUrl),
  title: {
    default: BRAND.name,
    template: `%s — ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  authors: [{ name: 'Geo Schlegel' }],
  creator: 'Geo Schlegel',
  publisher: 'Geo Schlegel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de-AT" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
