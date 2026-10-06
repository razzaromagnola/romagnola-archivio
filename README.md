# Archivio Romagnola — sito

Sito statico (Next.js SSG) dell'archivio della razza bovina Romagnola: storia, standard e linee genealogiche dei tori (bozzetti, schede, pedigree). Pensato per **GitHub Pages + dominio proprio**.

## Avvio rapido
```bash
npm install
npm run dev          # http://localhost:3000  (parte già con K2 + capitoli, dati reali di esempio)
```
Il repo include un **seed** già generato (**5 linee**: K2, D, C, I e R + i 7 capitoli) in `content/` e `public/img/`, quindi il sito funziona subito.

## Rigenerare i dati dall'archivio (ingest)
I gigabyte dei sorgenti restano sul tuo disco: l'ingest gira **in locale** e produce `content/site.json` + immagini ottimizzate in `public/img/`.
```bash
npm run ingest -- "/percorso/della/cartella/Archivio"
```
Cosa fa (vedi `scripts/ingest.mjs`):
- percorre ogni **linea** e ne parsa i nomi file (nome, matricola, padre via "da/by", provenienza, paese, anno);
- costruisce l'**albero** genealogico e **deduplica** i tori che compaiono in più rami (e le varianti "Testa");
- ottimizza le immagini in **WebP** (salta e segnala i file vuoti/corrotti);
- legge i documenti delle **sezioni editoriali** e delle **storie di linea**, recuperando titoli/grassetti/elenchi;
- **separa IT/EN** quando il testo è bilingue nello stesso file (regola preferibile: file IT/EN separati all'origine);
- per la sezione *Introduzione e storia* usa solo la cartella **"Romagnola sito web"**.

> Nota: per i vecchi file `.doc` l'ingest usa LibreOffice se presente (`soffice`), altrimenti un estrattore di solo testo. Installa LibreOffice per la resa migliore.

## Pubblicazione (GitHub Pages + dominio)
1. Metti il tuo dominio in `public/CNAME`.
2. In `next.config.mjs`: con dominio proprio va bene così (nessun `basePath`).
3. Push su `main`: la GitHub Action (`.github/workflows/deploy.yml`) fa il build ed esporta su Pages. L'ingest **non** gira in CI.
4. Imposta i record DNS del dominio verso GitHub Pages.

## Struttura dati (modulare, per reggere 28 linee)
- `content/index.json` — indice leggero: linee (meta), capitoli (meta), hero
- `content/lines/<code>.json` — una linea: tori, albero, storia IT/EN (caricata solo nella sua pagina)
- `content/chapters/<id>.json` — un capitolo: testo IT/EN + foto
- `content/search.json` — indice di ricerca snello (per header, /cerca, /indice)
- `public/img/lines` e `public/img/chapters` — immagini ottimizzate
- `scripts/ingest.mjs` — generatore locale (loop su tutte le linee + categoria R)
- `src/app` — pagine (home, `/linea/[code]`, `/toro/[id]`, `/capitolo/[id]`, `/indice`, `/cerca`)
- `src/components` — UI (albero, galleria, scheda, accordion, ricerca, toggle IT/EN)

## Note sul seed e sul primo run completo
- Nel seed, **K2** usa l'albero già rifinito; **D/C/I** usano il parser automatico (parentele da affinare); **R** è la categoria "tori senza linea" raggruppata per paese.
- Al primo `ingest` sull'archivio completo è normale rifinire qualche parentela/nome: puoi correggere a mano nei file `content/lines/<code>.json` (o segnalarmeli).
- L'hero (`public/img/hero.jpg`) va impostato con la tua foto di copertina (ora c'è quella del casale Pasolini Dall'Onda).
