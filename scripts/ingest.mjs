#!/usr/bin/env node
/**
 * Ingest dell'Archivio Romagnola (multi-linea, output modulare).
 * Uso:  npm run ingest -- "/percorso/della/cartella/Archivio"
 *
 * Genera:
 *   content/index.json          — indice leggero (linee + capitoli + hero)
 *   content/lines/<code>.json    — una linea (tori, albero, storia IT/EN)
 *   content/chapters/<id>.json   — un capitolo editoriale (testo IT/EN + foto)
 *   content/search.json          — indice di ricerca snello
 *   public/img/lines|chapters    — immagini ottimizzate (WebP)
 *
 * I gigabyte dei sorgenti restano sul tuo disco. Dipendenze: sharp, mammoth, word-extractor.
 * Per i .doc vecchi usa LibreOffice (`soffice`) se presente, altrimenti estrae solo testo.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(REPO, 'content');
const IMG = path.join(REPO, 'public', 'img');
const ARCHIVE = process.argv[2];
if (!ARCHIVE) { console.error('Uso: npm run ingest -- "/percorso/Archivio"'); process.exit(1); }

const EDITORIAL = new Set(['A', 'A1', 'A2', 'B', 'G5', 'P', 'Q']);
const COUNTRIES = ['AUSTRALIA', 'SUD AFRICA', 'USA', 'ARGENTINA BRASILE COLOMBIA', 'NUOVA ZELANDA', 'MESSICO', 'NAMIBIA'];
const LINE_NAMES = { C:'Medoro 1', D:'Glorioso – Ciclopico', D1:'Glorioso – Dominatore', D2:'Glorioso – Trionfo', E:'Glorioso – Glauco', F:'Medoro – Glauco – Ergum', G:'Ergum – Verdun – Bolero', G1:'Bolero – Canaro – Fiasco', G2:'Fiasco – Tino – Monaco', G3:'Fiasco – Tino – Lamone', G4:'Bolero – Eletto – Taccone', H:'Montello – Cloridano', H1:'Cloridano – Astro', H2:'Astro – Fiume – Dritto', H3:'Cloridano – Calore', H4:'Cloridano – Niccolò', H5:'Niccolò – Belvedere', I:'Orlando – Severo – Trento', J:'Medoro – Eolo – Tiberio', K:'Colosso – Molosso', K1:'Molosso – Telamone', K2:'Colosso – Telamone – Ramses', L:'Otello – Baleno', L1:'Otello – Sultano', M:'Senio – Ticino', N:'Masino – Lanz – Caronte', O:'Tiziano – Tripoli – Cortese', R:'Tori senza linea' };
const LINES_ALL = Object.keys(LINE_NAMES);

const norm = (s) => (s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const keyns = (s) => norm(s).replace(/[^A-Z0-9]/g, '');
const slug = (s) => (s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const REG = /\b([A-Z]{2,3}\s?\d{4,6}|A\d{2,3})\b/;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const codeOf = (name) => (name.match(/^([A-Z]\d?)\b/) || [])[1] || '';

function country(t) { const s = ' ' + (t || '').toUpperCase() + ' ';
  if (/RSA|AFRIC/.test(s)) return ['Sud Africa', '🇿🇦']; if (/EIRE|IRLAND/.test(s)) return ['Irlanda', '🇮🇪'];
  if (/ QLD| QID| NSW|AUSL|AUST/.test(s)) return ['Australia', '🇦🇺']; if (/ USA| KY| TN/.test(s)) return ['USA', '🇺🇸'];
  if (/ MX |MESSIC|MEXIC/.test(s)) return ['Messico', '🇲🇽']; if (/NAMIB/.test(s)) return ['Namibia', '🇳🇦'];
  if (/BRASIL|BRAZIL|ARGENT|COLOMB/.test(s)) return ['Sud America', '🌎']; if (/ZELAND|ZEALAND/.test(s)) return ['Nuova Zelanda', '🇳🇿'];
  return ['Italia', '🇮🇹']; }

const STOPW = new Set(['SV','TR','FO','RA','BO','FC','RN','MX','N','DI','DA','DEL','DELLA','DELLE','E','TESTO','SCHEMA','ESTERO','LINEA','FIGLI','UL8','TR374','SV49']);
function firstName(s){ const toks = norm(s).split(' ').filter(t=>t && !/^\d/.test(t) && !STOPW.has(t) && !/^[A-Z]{2}\d/.test(t)); return toks[0] || ''; }
function folderHead(folderName){
  let n = folderName.replace(/^[A-Z]\d*\s+/,'').trim(); let m;
  if (/TESTO|SCHEMA/i.test(n)) return { head:'', parent:'' };
  if ((m = n.match(/FIGLI\s+(?:DI\s+|D['’]\s*)?(.+)/i))) { const h=firstName(m[1]); return { head:h, parent:h }; }
  if ((m = n.match(/LINEA\s+(.+?)\s+da\s+(.+)/i))) return { head:firstName(m[1]), parent:firstName(m[2]) };
  if ((m = n.match(/LINEA\s+(\S+)\s*[-–]\s*(.+)/i))) return { head:firstName(m[2]), parent:firstName(m[1]) };
  if ((m = n.match(/LINEA\s+(\S+)\s+(.+)/i))) return { head:firstName(m[2]), parent:firstName(m[1]) };
  if ((m = n.match(/LINEA\s+(\S+)/i))) return { head:firstName(m[1]), parent:'' };
  return { head:'', parent:'' };
}

const cleanSire = (s) => { let x = (s || '').split(/\s+(?:da|by|Da|BY)\s+/)[0]; x = x.split(/\b(All\.?|Prop\.?|Az\.?|CT|n\.?\s?\d|Romulus|Dragoni|Giunchedi|Dal Pozzo|Flli|APA|FAB|AGIP|Amm)\b/)[0]; return x.replace(/\b[A-Z]{1,3}\s?\d{3,7}\b/, '').trim().replace(/[-.,]+$/, ''); };

function walk(dir, acc = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { if (e.name.startsWith('.') || e.name.startsWith('~') || e.name === '__MACOSX') continue; const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, acc); else acc.push(p); } return acc; }
const isImg = (f) => /\.(jpe?g|png|bmp|tiff?)$/i.test(f);
const cleanCap = (f) => f.replace(/\.(jpe?g|png|bmp|tiff?|webp)$/i, '').replace(/^[A-Z]\d?\s+/, '').trim();


let _Jimp;
async function loadJimp() {
  if (_Jimp !== undefined) return _Jimp;
  try { const m = await import('jimp'); _Jimp = m.Jimp || m.default || m; } catch { _Jimp = null; }
  return _Jimp;
}

async function optimize(src, rel, { width = 900, quality = 62, gray = false } = {}, warnings) {
  const dest = path.join(IMG, rel); fs.mkdirSync(path.dirname(dest), { recursive: true });
  try { if (fs.statSync(src).size === 0) { warnings.push(`vuota/corrotta: ${src}`); return null; } } catch { warnings.push(`illeggibile: ${src}`); return null; }
  const run = async (input) => { let im = sharp(input, { failOn: 'none' }).rotate().resize({ width, withoutEnlargement: true }); if (gray) im = im.grayscale(); await im.webp({ quality }).toFile(dest); };
  try { await run(src); return '/img/' + rel.replace(/\\/g, '/'); }
  catch (e1) {
    // formati che sharp non legge (es. BMP): ripiego su jimp
    try { const Jimp = await loadJimp(); if (!Jimp) throw new Error('jimp n/d'); const img = await Jimp.read(src); const buf = (typeof img.getBufferAsync === 'function') ? await img.getBufferAsync('image/png') : await img.getBuffer('image/png'); await run(buf); return '/img/' + rel.replace(/\\/g, '/'); }
    catch (e2) { warnings.push(`immagine non convertibile: ${src}`); return null; }
  }
}

// ---- documenti ----
function convertDoc(src) { try { const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ing-')); execFileSync('soffice', ['--headless', '--convert-to', 'docx', '--outdir', tmp, src], { stdio: 'ignore', timeout: 60000, env: { ...process.env, HOME: process.env.HOME || os.homedir() } }); const out = fs.readdirSync(tmp).find((f) => f.endsWith('.docx')); return out ? path.join(tmp, out) : null; } catch { return null; } }
async function docParagraphs(src) {
  let file = src;
  if (src.toLowerCase().endsWith('.doc')) { const c = convertDoc(src); if (c) file = c; else { const ex = new WordExtractor(); const d = await ex.extract(src); return d.getBody().split('\n').map((t) => ({ text: t.trim(), bold: false, list: false })).filter((p) => p.text); } }
  const { value: html } = await mammoth.convertToHtml({ path: file });  // mammoth: .docx -> html
  return [...html.matchAll(/<(p|h\d|li)[^>]*>([\s\S]*?)<\/\1>/g)].map((b) => ({ text: b[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ').trim(), bold: /<strong>|<b>/.test(b[2]), list: b[1] === 'li' })).filter((p) => p.text);
}
const EN = new Set('the of to was were with which that for from by this these those their has have had been are also while when where there after before between during over under about into and but not is its his on at as breed cattle history sire sires bull bulls cow cows son sons pages renaissance world phenotype herd type origins early beginning selection'.split(' '));
const IT = new Set("il lo la i gli le di del della dello dei degli delle che è ed non con per una un uno da si anche più nel nella alla come dopo tra sono era erano questa questo ha hanno razza toro tori bovina figlio figli nato".split(' '));
function signal(t) { const w = (t.toLowerCase().match(/[a-zàèéìòù']+/g) || []); const e = w.filter((x) => EN.has(x)).length, i = w.filter((x) => IT.has(x)).length; return e > i ? 'en' : (i > e ? 'it' : null); }
const isHeadTxt = (t, bold) => { const l = t.replace(/[^A-Za-zÀ-ÿ]/g, ''); return t.length <= 60 && t.split(' ').length <= 8 && (bold || (l && l === l.toUpperCase())) && !/[.!?]$/.test(t); };
function renderBlocks(ps) { const H = []; let buf = []; const fl = () => { if (buf.length) { H.push('<ul>' + buf.map((x) => `<li>${x}</li>`).join('') + '</ul>'); buf = []; } }; for (const p of ps) { if (p.list) { buf.push(esc(p.text)); continue; } fl(); H.push(isHeadTxt(p.text, p.bold) ? `<h3>${esc(p.text)}</h3>` : `<p>${esc(p.text)}</p>`); } fl(); return H.join('\n'); }
function splitLang(ps) { let lang = 'it'; const it = [], en = []; for (const p of ps) { const s = signal(p.text); if (s) lang = s; (lang === 'en' ? en : it).push(p); } return { it, en }; }

function findTesto(root) { const c = []; for (const f of walk(root)) { if (/~\$/.test(f)) continue; if (/testo.*\.docx?$/i.test(f) || (/\.docx?$/i.test(f) && /TESTO/i.test(path.dirname(f)))) c.push([f.split(path.sep).length, f]); } c.sort((a, b) => a[0] - b[0]); return c.length ? c[0][1] : null; }

async function ingestLine(abs, folder, code, kind, warnings) {
  const files = walk(abs).filter(isImg);
  const recs = [];
  for (const f of files) {
    const parts = path.relative(abs, f).split(path.sep); const stem = path.basename(f).replace(/\.[^.]+$/, '');
    const m = stem.match(/^([A-Z]{1,2}\d{0,2})\s+(.*)$/); const order = m ? m[1] : 'ZZ'; let rest = m ? m[2] : stem;
    rest = rest.replace(/(\d)\s*(da|by)\b/gi, '$1 $2 ');  // "BO7742da Arno" -> "BO7742 da Arno"
    const sp = rest.split(/\s+(?:da|by|BY|Da)\s+/); const head = sp[0]; const after = sp[1] || '';
    const reg = head.match(REG); const matricola = reg ? reg[1].replace(/\s/g, '') : '';
    let name = (reg ? head.slice(0, reg.index) : head);
    name = name.split(/\s+(?:[A-Z]{1,3}\s?\d{2,6}\b|n[.,]|\d{2,4}\b)/i)[0];
    name = name.replace(/\s*\(.*?\)/g, '').replace(/\b[Tt]esta?\b/, '').replace(/\s+(di|da|del|della)$/i, '').trim();
    const yr = rest.match(/\bn\.?\s?(19\d\d|20\d\d)\b/); const born = yr ? yr[1] : '';
    let [cn, flag] = country(after || parts.join(' '));
    let branch = parts.length > 1 ? parts[0] : 'ROOT';
    if (kind === 'category') { const cc = parts.find((p) => COUNTRIES.includes(p.toUpperCase())); if (cc) { branch = cc; [cn, flag] = country(cc); } else branch = 'Italia'; }
    recs.push({ order, name, matricola, sire: cleanSire(after), prov: after.trim(), born, branch, estero: /ESTERO/i.test(f) || cn !== 'Italia', country: cn, flag, src: f });
  }
  // dedup per nome
  const seen = new Set(); const uniq = [];
  for (const r of recs.sort((a, b) => keyns(a.name).localeCompare(keyns(b.name)) || ((a.sire ? 0 : 1) - (b.sire ? 0 : 1)))) { const k = keyns(r.name); if (!k || seen.has(k)) continue; seen.add(k); uniq.push(r); }
  // id globali + indici per nome
  const ids = new Set(); const firstIdx = {}; const twoIdx = {};
  for (const r of uniq) { let b = `${code.toLowerCase()}-${slug(r.name) || 'x'}`, s = b, i = 2; while (ids.has(s)) s = `${b}-${i++}`; r.id = s; ids.add(s);
    const toks = norm(r.name).split(' ').filter(Boolean); const fn = firstName(r.name);
    if (fn && !(fn in firstIdx)) firstIdx[fn] = r.id;
    if (toks.length >= 2) { const two = toks.slice(0,2).join(''); if (!(two in twoIdx)) twoIdx[two] = r.id; }
  }
  const matchName = (name, selfId) => { if (!name) return null; const two = norm(name).split(' ').slice(0,2).join(''); if (twoIdx[two] && twoIdx[two] !== selfId) return twoIdx[two]; const fn = firstName(name); if (fn && firstIdx[fn] && firstIdx[fn] !== selfId) return firstIdx[fn]; return null; };
  let root = null;
  if (kind !== 'category') {
    // radice: dalla cartella "A1 FIGLI DI <ROOT>" o "A LINEA <ROOT> ... TESTO", con depth minima
    let rootName = '';
    const allDirs = [...new Set(files.map((f) => path.relative(abs, f).split(path.sep).slice(0, -1)).flatMap((p) => p.map((_, i) => p.slice(0, i + 1).join('/'))))];
    const depthOf = (d) => d.split('/').length;
    const figliDirs = allDirs.filter((d) => /FIGLI/i.test(d.split('/').pop())).sort((a, b) => depthOf(a) - depthOf(b) || a.length - b.length);
    if (figliDirs.length) rootName = folderHead(figliDirs[0].split('/').pop()).head;
    if (!rootName) { const testoDirs = allDirs.filter((d) => /LINEA.*TESTO/i.test(d.split('/').pop())).sort((a, b) => depthOf(a) - depthOf(b)); if (testoDirs.length) { const m = testoDirs[0].split('/').pop().replace(/^[A-Z]\d*\s+/, '').match(/LINEA\s+(\S+)/i); if (m) rootName = firstName(m[1]); } }
    // parent di ogni toro: cartella (FIGLI DI X / LINEA X da Y) poi filename "da"
    for (const r of uniq) {
      const parts = path.relative(abs, r.src).split(path.sep).slice(0, -1);
      let parName = '';
      for (let i = parts.length - 1; i >= 0; i--) { const fh = folderHead(parts[i]); if (!fh.head) continue; if (firstName(r.name) === fh.head) { parName = fh.parent; } else { parName = fh.head; } break; }
      let par = matchName(parName, r.id);
      if (!par) par = matchName(r.sire, r.id);
      r.parent = par;
    }
    root = (rootName && uniq.find((r) => firstName(r.name) === rootName)) || null;
    if (!root && rootName) {
      const vid = `${code.toLowerCase()}-${slug(rootName)}`;
      root = { id: vid, name: rootName.charAt(0) + rootName.slice(1).toLowerCase(), matricola: '', sire: '', prov: '', born: '', branch: '', estero: false, country: 'Italia', flag: '🇮🇹', img: null, parent: null, order: 'A' };
      uniq.unshift(root);
    }
    if (!root) { const cnt = {}; for (const r of uniq) if (r.parent) cnt[r.parent] = (cnt[r.parent] || 0) + 1; const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; root = top ? uniq.find((r) => r.id === top[0]) : uniq[0]; }
    if (root) root.parent = null;
    // niente auto-parent, niente cicli: se parent == self o crea ciclo, stacca
    const byId = Object.fromEntries(uniq.map((r) => [r.id, r]));
    for (const r of uniq) { let seen = new Set([r.id]); let p = r.parent; while (p) { if (seen.has(p)) { r.parent = null; break; } seen.add(p); p = byId[p] ? byId[p].parent : null; } }
    // orfani (diversi dalla radice) -> agganciati alla radice per non perderli
    for (const r of uniq) if (!r.parent && r.id !== root.id) r.parent = root.id;
  } else { for (const r of uniq) r.parent = null; }
  // immagini
  for (const r of uniq) { r.img = await optimize(r.src, `lines/${r.id}.webp`, { gray: kind !== 'category' }, warnings); delete r.src; }
  // storia
  const testo = findTesto(abs); let narr = { it: [], en: [] };
  if (testo) { const { it, en } = splitLang(await docParagraphs(testo)); narr = { it: it.length ? [{ h: '', ps: it.map((p) => p.text) }] : [], en: en.length ? [{ h: '', ps: en.map((p) => p.text) }] : [] }; }
  return { code, name: LINE_NAMES[code] || folder, founder: root ? root.name : '', root: root ? root.id : null, kind, bulls: uniq, narr };
}

async function ingestChapter(abs, folder, code, warnings) {
  const files = walk(abs);
  const docs = files.filter((f) => /\.docx?$/i.test(f) && !/~\$/.test(f)).sort();
  let it_html = '', en_html = '', desc = '';
  for (const d of docs) { const { it, en } = splitLang(await docParagraphs(d)); it_html += renderBlocks(it.slice(1)) + '\n'; if (en.length > 1) en_html += renderBlocks(en.slice(1)) + '\n'; if (!desc) { const b = it.find((p) => p.text.length > 40); if (b) desc = b.text.slice(0, 150); } }
  const images = []; let i = 0;
  for (const f of files.filter(isImg).sort()) { const p = await optimize(f, `chapters/${code}-${i}.webp`, { width: 720, quality: 55 }, warnings); if (p) { images.push({ img: p, cap: cleanCap(path.basename(f)) }); i++; } }
  const id = slug(folder.replace(/^[A-Z]\d?\s+/, '')) || code.toLowerCase();
  return { id, code, title: folder.replace(/^[A-Z]\d?\s+/, ''), kind: 'documento', desc, it_html, en_html, images };
}

async function run() {
  console.log('Avvio ingest. Archivio:', ARCHIVE);
  const t0 = Date.now();
  fs.mkdirSync(path.join(CONTENT, 'lines'), { recursive: true });
  fs.mkdirSync(path.join(CONTENT, 'chapters'), { recursive: true });
  const warnings = [];
  const index = { lines: [], lines_all: LINES_ALL, editorial: [], hero: '/img/hero.jpg' };
  const search = [];

  for (const e of fs.readdirSync(ARCHIVE, { withFileTypes: true })) {
    if (e.name === '__MACOSX') continue;
    const abs = path.join(ARCHIVE, e.name);
    let isDir = false; try { isDir = fs.statSync(abs).isDirectory(); } catch {}
    if (!isDir) continue;
    const code = codeOf(e.name);
    if (EDITORIAL.has(code)) {
      console.log('Capitolo:', e.name); const ch = await ingestChapter(abs, e.name, code, warnings);
      fs.writeFileSync(path.join(CONTENT, 'chapters', `${ch.id}.json`), JSON.stringify(ch));
      index.editorial.push({ id: ch.id, code: ch.code, title: ch.title, kind: ch.kind, desc: ch.desc });
    } else if (code) {
      const kind = code === 'R' ? 'category' : 'line';
      console.log('Linea:', e.name); const L = await ingestLine(abs, e.name, code, kind, warnings);
      fs.writeFileSync(path.join(CONTENT, 'lines', `${code.toLowerCase()}.json`), JSON.stringify(L));
      const rootBull = L.bulls.find((b) => b.id === L.root);
      index.lines.push({ code: L.code, name: L.name, founder: L.founder, kind: L.kind, count: L.bulls.length, founderImg: rootBull ? rootBull.img : (L.bulls.find((b) => b.img)?.img || null) });
      for (const b of L.bulls) search.push({ id: b.id, name: b.name, matricola: b.matricola || '', sire: b.sire || '', country: b.country, flag: b.flag, img: b.img, line: L.code, lineName: L.name });
    }
  }
  index.lines.sort((a, b) => LINES_ALL.indexOf(a.code) - LINES_ALL.indexOf(b.code));
  fs.writeFileSync(path.join(CONTENT, 'index.json'), JSON.stringify(index));
  fs.writeFileSync(path.join(CONTENT, 'search.json'), JSON.stringify(search));
  console.log(`\nFatto in ${Math.round((Date.now()-t0)/1000)}s: ${index.lines.length} linee, ${index.editorial.length} capitoli, ${search.length} tori.`);
  if (warnings.length) { console.log(`\n⚠  ${warnings.length} avvisi (file vuoti/corrotti ecc.):`); warnings.slice(0, 50).forEach((w) => console.log('  -', w)); }
  console.log('\nNB: l\'hero (/img/hero.jpg) va messo a mano la prima volta, o adatta lo script alla tua foto di copertina.');
}
run().catch((e) => { console.error(e); process.exit(1); });
