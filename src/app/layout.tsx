import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { LangProvider } from '@/components/LangProvider';
import TopBar from '@/components/TopBar';

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-serif',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Archivio Romagnola — Storia e linee genealogiche',
  description: 'Archivio della razza bovina Romagnola: storia, standard, e linee genealogiche dei tori con bozzetti, schede e pedigree.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <LangProvider>
          <TopBar />
          <main id="app" className="wrap">{children}</main>
          <footer><div className="wrap">
            <span>Archivio della razza bovina Romagnola — bozzetti, schede, pedigree</span>
            <span>Prototipo · linea K2 + capitoli</span>
          </div></footer>
        </LangProvider>
      </body>
    </html>
  );
}
