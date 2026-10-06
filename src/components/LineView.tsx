'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLang } from './LangProvider';
import type { Line, Bull } from '@/lib/types';
const deacc = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function LineView({ line }: { line: Line }) {
  const { lang } = useLang();
  const L = (it: string, en: string) => (lang === 'en' ? en : it);
  const focus = useSearchParams().get('focus') || undefined;
  const isCat = line.kind === 'category';
  const by = useMemo(() => Object.fromEntries(line.bulls.map((b) => [b.id, b])), [line]);
  const kids = useMemo(() => {
    const k: Record<string, string[]> = {};
    line.bulls.forEach((b) => { const p = b.parent ?? '__root__'; (k[p] = k[p] || []).push(b.id); });
    const ord = (i: string) => by[i].order || 'ZZ';
    Object.values(k).forEach((a) => a.sort((x, y) => ord(x).localeCompare(ord(y), undefined, { numeric: true })));
    return k;
  }, [line, by]);
  const desc = useMemo(() => {
    const d: Record<string, number> = {}; const walk = (i: string): number => { let n = 0; for (const c of kids[i] || []) n += 1 + walk(c); return (d[i] = n); };
    if (line.root) walk(line.root); return d;
  }, [kids, line.root]);

  const [view, setView] = useState<'albero' | 'galleria'>(isCat ? 'galleria' : 'albero');
  const [storyOpen, setStoryOpen] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set(line.root ? [line.root] : []));
  const ancestors = (id: string) => { const p: string[] = []; let c = by[id]; while (c && c.parent && by[c.parent]) { c = by[c.parent]; p.unshift(c.id); } return p; };
  useEffect(() => {
    if (focus && by[focus]) {
      setView('albero');
      setOpen((s) => { const n = new Set(s); [...ancestors(focus), focus].forEach((x) => n.add(x)); return n; });
      const t = setTimeout(() => { const el = document.getElementById(`ps-${focus}`); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 2200); } }, 60);
      return () => clearTimeout(t);
    }
  }, [focus]); // eslint-disable-line
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const expandAll = () => setOpen(new Set(line.bulls.map((b) => b.id)));
  const collapseAll = () => setOpen(new Set(line.root ? [line.root] : []));
  const narr = lang === 'en' ? line.narr.en : line.narr.it;
  const hasStory = narr && narr.some((s) => s.ps.length || s.h);

  const TreeNode = ({ id, isRoot }: { id: string; isRoot?: boolean }) => {
    const b = by[id]; const ch = kids[id] || []; const hasK = ch.length > 0; const isOpen = open.has(id);
    return (
      <div className={`tw ${isRoot ? 'root' : ''}`}>
        <div className={`node ${isOpen ? 'open' : ''}`} id={`n-${id}`}>
          <div className="self">
            <button className={`disc ${hasK ? '' : 'leaf'}`} onClick={() => hasK && toggle(id)}>{hasK ? (isOpen ? '−' : <>+&nbsp;{desc[id]}</>) : ''}</button>
            <Link className="plate-sm" id={`ps-${id}`} href={`/toro/${b.id}/`}>
              <span className={`thumb ${b.img ? '' : 'none'}`}>{b.img ? <img src={b.img} alt={b.name} loading="lazy" /> : <span className="none">img<br />—</span>}</span>
              <span><span className="nm">{b.name} {b.country !== 'Italia' && <span className="fl">{b.flag}</span>}</span>{b.matricola && <span className="mm">{b.matricola}</span>}</span>
            </Link>
          </div>
          {hasK && isOpen && <div className="kids" style={{ display: 'block' }}>{ch.map((c) => <TreeNode key={c} id={c} />)}</div>}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="crumb"><Link href="/">{L('Archivio', 'Archive')}</Link><i>/</i><Link href="/">{L('Linee', 'Lines')}</Link><i>/</i><span>{line.name}</span></div>
      <section className="linehead">
        <div className="code">{line.code}{isCat ? '' : ' · SIRE LINE'}</div>
        <h1>{line.name}</h1>
        <div className="sub">{isCat ? `${line.bulls.length} ${L('soggetti', 'subjects')}` : <>{L('Capostipite', 'Founder')} <b>{line.founder}</b> · {line.bulls.length} {L('soggetti in archivio', 'subjects on file')}</>}</div>
      </section>

      {hasStory && (
        <section className="info">
          <div className="ih"><h3>{isCat ? L('Nota', 'Note') : L('La storia della linea', 'The line’s history')}</h3></div>
          <div className={`narrwrap ${storyOpen ? 'open' : ''}`}>
            <div>{narr.map((s, i) => (<div key={i}>{s.h && <h4>{s.h}</h4>}{s.ps.map((p, j) => <p key={j}>{p}</p>)}</div>))}</div>
          </div>
          <button className="readmore" onClick={() => setStoryOpen((v) => !v)}>{storyOpen ? L('Riduci ↑', 'Show less ↑') : L('Leggi tutto ↓', 'Read all ↓')}</button>
        </section>
      )}

      <div className="controls">
        {!isCat && (
          <div className="seg">
            <button className={view === 'albero' ? 'on' : ''} onClick={() => setView('albero')}>{L('Albero', 'Tree')}</button>
            <button className={view === 'galleria' ? 'on' : ''} onClick={() => setView('galleria')}>{L('Galleria', 'Gallery')}</button>
          </div>
        )}
        <div className="sp" /><div className="cnt">{line.bulls.length} {L('soggetti', 'subjects')}</div>
      </div>

      {view === 'albero' && !isCat ? (
        <>
          <div className="toolbar">
            <button className="btnlink" onClick={expandAll}>{L('Espandi tutto', 'Expand all')}</button>
            <button className="btnlink" onClick={collapseAll}>{L('Comprimi tutto', 'Collapse all')}</button>
          </div>
          <div id="tree">{line.root && <TreeNode id={line.root} isRoot />}</div>
        </>
      ) : <Gallery line={line} />}
    </>
  );
}

function Gallery({ line }: { line: Line }) {
  const { lang } = useLang(); const L = (it: string, en: string) => (lang === 'en' ? en : it);
  const [geo, setGeo] = useState<'tutti' | 'Italia' | 'estero'>('tutti');
  const [ramo, setRamo] = useState('tutti'); const [sort, setSort] = useState('alfabetico'); const [onlyImg, setOnlyImg] = useState(false);
  const rami = useMemo(() => [...new Set(line.bulls.map((b) => b.branch || ''))].filter((x) => x && x !== 'Testo' && !/^Figli/i.test(x) && x !== 'ROOT').sort(), [line]);
  let list: Bull[] = line.bulls.slice();
  if (geo === 'Italia') list = list.filter((b) => b.country === 'Italia'); else if (geo === 'estero') list = list.filter((b) => b.country !== 'Italia');
  if (ramo !== 'tutti') list = list.filter((b) => b.branch === ramo);
  if (onlyImg) list = list.filter((b) => b.img);
  const el = (v?: string) => (v ? 0 : 1);
  if (sort === 'matricola') list.sort((a, b) => el(a.matricola) - el(b.matricola) || (a.matricola || '').localeCompare(b.matricola || ''));
  else if (sort === 'anno') list.sort((a, b) => el(a.born) - el(b.born) || (a.born || '').localeCompare(b.born || ''));
  else list.sort((a, b) => deacc(a.name).localeCompare(deacc(b.name)));
  return (
    <>
      <div className="filters">
        {([['tutti', L('Tutti', 'All')], ['Italia', 'Italia 🇮🇹'], ['estero', L('Estero', 'Abroad')]] as const).map(([k, lab]) => (
          <button key={k} className={`chip ${geo === k ? 'on' : ''}`} onClick={() => setGeo(k as any)}>{lab}</button>))}
        <span style={{ width: 8 }} />
        <button className={`chip ${ramo === 'tutti' ? 'on' : ''}`} onClick={() => setRamo('tutti')}>{line.kind === 'category' ? L('Tutti i paesi', 'All countries') : L('Tutti i rami', 'All branches')}</button>
        {rami.map((r) => <button key={r} className={`chip ${ramo === r ? 'on' : ''}`} onClick={() => setRamo(r)}>{r}</button>)}
      </div>
      <div className="toolbar">
        <span className="lbl">{L('Ordina', 'Sort')}</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="alfabetico">{L('Alfabetico', 'Alphabetical')}</option><option value="matricola">Matricola</option><option value="anno">{L('Anno', 'Year')}</option>
        </select>
        <label className="ck"><input type="checkbox" checked={onlyImg} onChange={(e) => setOnlyImg(e.target.checked)} /> {L('Solo con bozzetto', 'Only with sketch')}</label>
        <div className="sp" /><span className="cnt">{list.length} {L('soggetti', 'subjects')}</span>
      </div>
      <div id="gallery" style={{ display: 'grid' }}>
        {list.map((b) => (
          <Link key={b.id} className="gcard" href={`/toro/${b.id}/`}>
            <div className="frame">{b.img ? <img src={b.img} alt={b.name} loading="lazy" /> : <span className="none">{L('immagine', 'image')}<br />{L('mancante', 'missing')}</span>}</div>
            <div className="cap"><div className="nm">{b.name}</div><div className="mm">{b.matricola && <span className="code">{b.matricola}</span>} {b.flag} {b.country}</div></div>
          </Link>
        ))}
      </div>
    </>
  );
}
