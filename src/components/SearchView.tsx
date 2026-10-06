'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLang } from './LangProvider';
import { SEARCH } from '@/lib/data';
const deacc = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function SearchView() {
  const { lang } = useLang(); const L = (it: string, en: string) => (lang === 'en' ? en : it);
  const q = (useSearchParams().get('q') || '').trim(); const dq = deacc(q);
  const res = dq ? SEARCH.filter((b) => deacc(`${b.name} ${b.matricola} ${b.sire} ${b.country} ${b.line}`).includes(dq)) : [];
  return (
    <>
      <div className="crumb"><Link href="/">{L('Archivio', 'Archive')}</Link><i>/</i><span>{L('Ricerca', 'Search')}: “{q}”</span></div>
      <div className="controls"><div className="cnt">{res.length} {L('risultati', 'results')}</div></div>
      {res.length ? (
        <div id="gallery" style={{ display: 'grid' }}>
          {res.map((b) => (
            <Link key={b.id} className="gcard" href={`/toro/${b.id}/`}>
              <div className="frame">{b.img ? <img src={b.img} alt={b.name} loading="lazy" /> : <span className="none">—</span>}</div>
              <div className="cap"><div className="nm">{b.name}</div><div className="mm"><span className="code">{b.line}</span> {b.matricola} {b.flag} {b.country}</div></div>
            </Link>
          ))}
        </div>
      ) : <div className="empty"><b>{L('Nessun soggetto trovato', 'No subjects found')}</b>{L('Prova con un altro nome, matricola o padre.', 'Try another name, reg. no. or sire.')}</div>}
    </>
  );
}
