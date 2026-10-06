'use client';
import Link from 'next/link';
import { useLang } from './LangProvider';
import { SEARCH } from '@/lib/data';
const deacc = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function IndexView() {
  const { lang } = useLang(); const L = (it: string, en: string) => (lang === 'en' ? en : it);
  const list = SEARCH.slice().sort((a, b) => deacc(a.name).localeCompare(deacc(b.name)));
  const groups: Record<string, typeof list> = {};
  list.forEach((b) => { let g = deacc(b.name)[0] || '#'; g = /[a-z]/.test(g) ? g.toUpperCase() : '#'; (groups[g] = groups[g] || []).push(b); });
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return (
    <>
      <div className="crumb"><Link href="/">{L('Archivio', 'Archive')}</Link><i>/</i><span>{L('Indice A–Z', 'A–Z index')}</span></div>
      <div className="azbar">{letters.map((x) => groups[x] ? <a key={x} onClick={() => document.getElementById(`az-${x}`)?.scrollIntoView()}>{x}</a> : <a key={x} className="off">{x}</a>)}</div>
      <div className="az">
        {Object.keys(groups).sort().map((x) => (
          <div className="azrow" id={`az-${x}`} key={x}><div className="let">{x}</div>
            <div className="items">{groups[x].map((b) => <Link key={b.id} href={`/toro/${b.id}/`}>{b.name}{b.country !== 'Italia' && <span className="fl"> {b.flag}</span>}</Link>)}</div>
          </div>
        ))}
      </div><div style={{ height: 40 }} />
    </>
  );
}
