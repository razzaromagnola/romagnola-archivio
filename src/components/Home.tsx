'use client';
import Link from 'next/link';
import { useT } from './LangProvider';
import { INDEX, CEPPI, LINE_NAMES, lineMeta, activeCodes } from '@/lib/data';

export default function Home() {
  const T = useT();
  const nLines = INDEX.lines_all.length;
  return (
    <>
      <section className="hero photo" style={{ backgroundImage: `url('${INDEX.hero}')` }}>
        <div className="heroin">
          <h1>{T('Storia e linee genealogiche della razza Romagnola', 'History and sire lines of the Romagnola breed')}</h1>
          <p>{T('Un archivio in due parti: i capitoli sulla storia e i caratteri della razza, e le linee genealogiche dei tori — con i bozzetti originali, le schede e le pedigree, navigabili ramo per ramo.', 'An archive in two parts: chapters on the breed’s history and traits, and the bulls’ sire lines — with the original sketches, record cards and pedigrees, navigable branch by branch.')}</p>
          <div className="meta"><span>{INDEX.editorial.length} {T('capitoli', 'chapters')} · {nLines} {T('linee', 'lines')}</span>
            <Link href="/indice/">{T('Indice A–Z di tutti i tori', 'A–Z index of all bulls')} →</Link></div>
        </div>
        <div className="credit">{T('Casale Pasolini Dall’Onda · Gambellara (RA), anni ’20', 'Pasolini Dall’Onda farmstead · Gambellara (RA), 1920s')}</div>
      </section>

      <div className="sec-h"><h2>{T('La razza', 'The breed')}</h2><span className="c">{T('capitoli', 'chapters')}</span></div>
      <div className="sec-sub">{T('Le sezioni editoriali e storiche dell’archivio.', 'The archive’s editorial and historical sections.')}</div>
      <div className="chapters">
        {INDEX.editorial.map((c) => (
          <Link key={c.id} href={`/capitolo/${c.id}/`} className="chap">
            <div className="k">{c.code}</div><h3>{c.title}</h3>
            <p>{(c.desc || '').slice(0, 120)}…</p><span className="kind">{c.kind}</span>
          </Link>
        ))}
      </div>

      <div className="sec-h"><h2>{T('Le linee genealogiche', 'The sire lines')}</h2><span className="c">{activeCodes.size}/{nLines}</span></div>
      <div className="sec-sub">{T('Raggruppate per ceppo di discendenza. Le linee popolate sono cliccabili.', 'Grouped by descent. Populated lines are clickable.')}</div>
      {CEPPI.map(([title, codes]) => (
        <div className="ceppo" key={title}>
          <h3>{title}<span>{codes.filter((c) => activeCodes.has(c)).length}/{codes.length}</span></h3>
          <div className="lines">
            {codes.map((code) => {
              const m = lineMeta(code);
              return m ? (
                <Link key={code} href={`/linea/${code.toLowerCase()}/`} className="plate live">
                  <div className="frame">{m.founderImg ? <img src={m.founderImg} alt={m.founder} /> : <span className="ph">{code}</span>}</div>
                  <div className="cap"><div className="code">{code}</div><h4>{m.name}</h4>
                    <small>{T('Capostipite', 'Founder')} {m.founder} · {m.count} {T('soggetti', 'subj.')}</small></div>
                </Link>
              ) : (
                <div key={code} className="plate soon">
                  <div className="frame"><span className="ph">{code}</span></div>
                  <div className="cap"><div className="code">{code}</div><h4>{LINE_NAMES[code] || '—'}</h4>
                    <small>{T('In preparazione', 'In preparation')}</small></div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ height: 50 }} />
    </>
  );
}
