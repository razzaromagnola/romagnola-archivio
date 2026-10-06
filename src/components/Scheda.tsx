'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLang } from './LangProvider';
import type { Line } from '@/lib/types';
const firstWord = (n: string) => (n || '').replace(/^(VU|V\.U\.|CHR|LV|LF|I\.|L\.|W\.|R\.|F\.|A\.|Y\.)\s+/i, '').split(' ')[0];

export default function Scheda({ line, id }: { line: Line; id: string }) {
  const { lang } = useLang(); const L = (it: string, en: string) => (lang === 'en' ? en : it);
  const by = useMemo(() => Object.fromEntries(line.bulls.map((b) => [b.id, b])), [line]);
  const kids = useMemo(() => { const k: Record<string, string[]> = {}; line.bulls.forEach((b) => { const p = b.parent ?? '__root__'; (k[p] = k[p] || []).push(b.id); }); return k; }, [line]);
  const b = by[id]; const [zoom, setZoom] = useState(false);
  const code = line.code.toLowerCase();
  if (!b) return <div className="empty"><b>—</b></div>;
  const father = b.parent && by[b.parent] ? by[b.parent] : null;
  const children = (kids[id] || []).map((c) => by[c]);
  const anc: string[] = []; { let c = by[id]; while (c && c.parent && by[c.parent]) { c = by[c.parent]; anc.unshift(c.id); } }
  const sib = kids[b.parent ?? '__root__'] || []; const pos = sib.indexOf(id);
  const prev = pos > 0 ? sib[pos - 1] : null; const next = pos >= 0 && pos < sib.length - 1 ? sib[pos + 1] : null;
  const narr = lang === 'en' ? line.narr.en : line.narr.it; const key = firstWord(b.name).toLowerCase();
  let ex: string | null = null;
  if (key.length >= 3) outer: for (const s of narr) for (const p of [s.h, ...s.ps]) if (p && p.toLowerCase().includes(key)) { ex = p; break outer; }
  return (
    <>
      <div className="crumb"><Link href="/">{L('Archivio', 'Archive')}</Link><i>/</i><Link href={`/linea/${code}/`}>{line.name}</Link><i>/</i><span>{b.name}</span></div>
      <div className="scheda" style={{ maxWidth: 'none', boxShadow: 'none', marginBottom: 30 }}>
        <div className="sx">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--slate)' }}>{L('SCHEDA', 'RECORD')} · {line.code}</div>
          <div className="nav">
            {prev ? <Link className="btnlink" href={`/toro/${prev}/`}>‹</Link> : <button className="btnlink" disabled>‹</button>}
            {next ? <Link className="btnlink" href={`/toro/${next}/`}>›</Link> : <button className="btnlink" disabled>›</button>}
            <Link className="btnlink" href={`/linea/${code}/`}>✕</Link>
          </div>
        </div>
        <div className="grid">
          <div className="plate-lg">{b.img ? <img src={b.img} alt={b.name} onClick={() => setZoom(true)} /> : <span className="none">{L('Bozzetto non disponibile', 'Sketch unavailable')}<br />{L('(file mancante in archivio)', '(file missing in archive)')}</span>}</div>
          <div className="data">
            <h2>{b.name}</h2>
            <div className="country">{b.flag} {b.country}{b.estero && b.country !== 'Italia' ? ` · ${L('linea estero', 'abroad')}` : ''}</div>
            {anc.length > 0 && <div className="chain">{anc.map((a) => <span key={a}><Link href={`/toro/${a}/`}>{by[a].name}</Link><i>›</i></span>)}<b>{b.name}</b></div>}
            <dl className="dl">
              <div className="r"><dt>{L('Matricola', 'Reg. no.')}</dt><dd className="code">{b.matricola || '—'}</dd></div>
              <div className="r"><dt>{L('Nato', 'Born')}</dt><dd>{b.born || '—'}</dd></div>
              <div className="r"><dt>{L('Padre', 'Sire')}</dt><dd>{father ? <Link className="up" href={`/toro/${father.id}/`}>{father.name} ↑</Link> : (b.sire || '—')}</dd></div>
              <div className="r"><dt>{L('Provenienza', 'Provenance')}</dt><dd>{b.prov || '—'}</dd></div>
              <div className="r"><dt>{L('Ramo', 'Branch')}</dt><dd>{b.branch || '—'}</dd></div>
            </dl>
            {line.kind !== 'category' && <div className="schactions"><Link className="btnlink" href={`/linea/${code}/?focus=${b.id}`}>↳ {L('Mostra nell’albero', 'Show in tree')}</Link></div>}
            {children.length > 0 && <div className="rel"><div className="lab">{L('Figli in archivio', 'Sons on file')} ({children.length})</div>{children.map((c) => <Link key={c.id} href={`/toro/${c.id}/`}>{c.name} {c.country !== 'Italia' && <span className="fl">{c.flag}</span>}</Link>)}</div>}
            {ex && <div className="exc"><div className="lab">{L('Dal testo della linea', 'From the line’s text')}</div><p>{ex}</p></div>}
          </div>
        </div>
      </div>
      {zoom && b.img && <div className="zoomer on" onClick={() => setZoom(false)}><img src={b.img} alt={b.name} /></div>}
    </>
  );
}
