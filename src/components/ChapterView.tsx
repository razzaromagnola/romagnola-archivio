'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useLang } from './LangProvider';
import type { Chapter } from '@/lib/types';
type Sec = { t: string; lead: string; subs: { t: string; body: string }[] };
function parse(html: string): { lead: string; secs: Sec[] } {
  const re = /<h2>([\s\S]*?)<\/h2>|<h3>([\s\S]*?)<\/h3>|(<(?:p|ul|ol)>[\s\S]*?<\/(?:p|ul|ol)>)/g;
  const hasH2 = html.includes('<h2>'); let m: RegExpExecArray | null; let lead = '';
  if (hasH2) {
    const secs: Sec[] = []; let sec: Sec | null = null; let sub: { t: string; body: string } | null = null;
    while ((m = re.exec(html))) {
      if (m[1] !== undefined) { sec = { t: m[1], lead: '', subs: [] }; secs.push(sec); sub = null; }
      else if (m[2] !== undefined) { sub = { t: m[2], body: '' }; if (!sec) { sec = { t: '', lead: '', subs: [] }; secs.push(sec); } sec.subs.push(sub); }
      else { const c = m[3]; if (sub) sub.body += c; else if (sec) sec.lead += c; else lead += c; }
    }
    return { lead, secs };
  }
  const items: { t: string; body: string }[] = []; let cur: { t: string; body: string } | null = null;
  while ((m = re.exec(html))) { if (m[2] !== undefined) { cur = { t: m[2], body: '' }; items.push(cur); } else if (m[3] !== undefined) { if (cur) cur.body += m[3]; else lead += m[3]; } }
  return { lead, secs: items.map((it) => ({ t: it.t, lead: it.body, subs: [] })) };
}
function AccItem({ title, html, sub, children }: { title: string; html?: string; sub?: boolean; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`acc ${sub ? 'acc-sub' : ''} ${open ? 'open' : ''}`}>
      <button className="acc-h" onClick={() => setOpen((v) => !v)} dangerouslySetInnerHTML={{ __html: `${title}<span class="chev">▾</span>` }} />
      <div className="acc-b">{html && <div dangerouslySetInnerHTML={{ __html: html }} />}{children}</div>
    </div>
  );
}
export default function ChapterView({ chapter: c }: { chapter: Chapter }) {
  const { lang } = useLang(); const L = (it: string, en: string) => (lang === 'en' ? en : it);
  const html = (lang === 'en' && c.en_html) ? c.en_html : (c.it_html || '');
  const enPending = lang === 'en' && !c.en_html;
  const useAcc = html.includes('<h2>') || (html.match(/<h3>/g) || []).length >= 2;
  const parsed = useAcc ? parse(html) : null;
  const [zoom, setZoom] = useState<string | null>(null);
  return (
    <>
      <div className="crumb"><Link href="/">{L('Archivio', 'Archive')}</Link><i>/</i><span>{L('La razza', 'The breed')}</span><i>/</i><span>{c.title}</span></div>
      <div className="article">
        <section className="chaphead"><div className="code">{c.code} · {c.kind.toUpperCase()}</div><h1>{c.title}</h1></section>
        {enPending && <div className="note">English text in preparation — showing the Italian version.</div>}
        <div className="prose">
          {parsed ? (<>
            {parsed.lead && <div dangerouslySetInnerHTML={{ __html: parsed.lead }} />}
            {parsed.secs.map((s, i) => (<AccItem key={i} title={s.t || '—'} html={s.lead}>{s.subs.map((su, j) => <AccItem key={j} title={su.t} html={su.body} sub />)}</AccItem>))}
          </>) : <div dangerouslySetInnerHTML={{ __html: html }} />}
        </div>
      </div>
      {c.images && c.images.length > 0 && (<>
        <div className="sec-h"><h2>{L('Fotografie', 'Photographs')}</h2><span className="c">{c.images.length} {L('immagini', 'images')}</span></div>
        <div className="cgal">{c.images.map((im, i) => (<figure className="cfig" key={i} onClick={() => setZoom(im.img)}><div className="cframe"><img src={im.img} alt={im.cap} loading="lazy" /></div>{im.cap && <figcaption>{im.cap}</figcaption>}</figure>))}</div>
      </>)}
      {zoom && <div className="zoomer on" onClick={() => setZoom(null)}><img src={zoom} alt="" /></div>}
    </>
  );
}
