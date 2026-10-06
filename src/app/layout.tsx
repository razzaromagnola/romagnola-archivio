import type { Metadata } from 'next';
import './globals.css';
import { LangProvider } from '@/components/LangProvider';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'Archivio Romagnola — Storia e linee genealogiche',
  description: 'Archivio della razza bovina Romagnola: storia, standard, e linee genealogiche dei tori con bozzetti, schede e pedigree.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
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
