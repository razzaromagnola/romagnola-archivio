'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useLang } from './LangProvider';
import { SEARCH } from '@/lib/data';
const deacc = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function TopBar() {
  const { lang, setLang } = useLang();
  const L = (it: string, en: string) => (lang === 'en' ? en : it);
  const router = useRouter();
  const [q, setQ] = useState(''); const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const dq = deacc(q); if (dq.length < 2) return [];
    return SEARCH.filter((b) => deacc(`${b.name} ${b.matricola} ${b.sire} ${b.country} ${b.line}`).includes(dq)).slice(0, 7);
  }, [q]);
  const goSearch = () => { if (q.trim()) { router.push(`/cerca/?q=${encodeURIComponent(q.trim())}`); setOpen(false); } };
  return (
    <header className="top">
      <div className="wrap row">
        <Link href="/" className="brand"><b>Archivio Romagnola</b><span>{L('Storia e linee genealogiche', 'History & sire lines')}</span></Link>
        <div className="sp" />
        <div className="searchwrap">
          <label className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input type="search" placeholder={L('Cerca toro, matricola, padre…', 'Search bull, reg. no., sire…')} value={q} autoComplete="off"
              onChange={(e) => { setQ(e.target.value); setOpen(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter') goSearch(); if (e.key === 'Escape') setOpen(false); }}
              onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 180)} />
          </label>
          <div className={`ac ${open && results.length ? 'on' : ''}`}>
            {results.map((b) => (
              <Link key={b.id} href={`/toro/${b.id}/`} className="acrow" onClick={() => setOpen(false)}>
                <span className={`th ${b.img ? '' : 'none'}`}>{b.img ? <img src={b.img} alt="" /> : '—'}</span>
                <span><span className="nm">{b.name}</span><br /><span className="sub">{b.line}{b.matricola ? ` · ${b.matricola}` : ''}</span></span>
                <span className="meta">{b.flag}</span>
              </Link>
            ))}
            <a className="acrow all" onMouseDown={(e) => { e.preventDefault(); goSearch(); }}>{L('Vedi tutti i risultati', 'See all results')} “{q}” →</a>
          </div>
        </div>
        <div className="lang"><button className={lang === 'it' ? 'on' : ''} onClick={() => setLang('it')}>IT</button><button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button></div>
      </div>
    </header>
  );
}
