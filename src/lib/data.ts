import index from '@content/index.json';
import search from '@content/search.json';
import type { IndexData, SearchRow } from './types';

export const INDEX = index as unknown as IndexData;
export const SEARCH = search as unknown as SearchRow[];
export const activeCodes = new Set(INDEX.lines.map((l) => l.code));
export const lineMeta = (code: string) => INDEX.lines.find((l) => l.code === code) || null;

export const CEPPI: [string, string[]][] = [
  ['Ceppo Medoro – Glorioso', ['C','D','D1','D2','E','F','J']],
  ['Ceppo Bolero – Fiasco', ['G','G1','G2','G3','G4']],
  ['Ceppo Cloridano', ['H','H1','H2','H3','H4','H5']],
  ['Ceppo Colosso – Molosso – Telamone', ['K','K1','K2']],
  ['Ceppo Otello', ['L','L1']],
  ['Altre linee', ['I','M','N','O']],
  ['Senza linea', ['R']],
];
export const LINE_NAMES: Record<string, string> = {
  C:'Medoro 1', D:'Glorioso – Ciclopico', D1:'Glorioso – Dominatore', D2:'Glorioso – Trionfo',
  E:'Glorioso – Glauco', F:'Medoro – Glauco – Ergum', G:'Ergum – Verdun – Bolero',
  G1:'Bolero – Canaro – Fiasco', G2:'Fiasco – Tino – Monaco', G3:'Fiasco – Tino – Lamone',
  G4:'Bolero – Eletto – Taccone', H:'Montello – Cloridano', H1:'Cloridano – Astro',
  H2:'Astro – Fiume – Dritto', H3:'Cloridano – Calore', H4:'Cloridano – Niccolò',
  H5:'Niccolò – Belvedere', I:'Orlando – Severo – Trento', J:'Medoro – Eolo – Tiberio',
  K:'Colosso – Molosso', K1:'Molosso – Telamone', K2:'Colosso – Telamone – Ramses',
  L:'Otello – Baleno', L1:'Otello – Sultano', M:'Senio – Ticino', N:'Masino – Lanz – Caronte',
  O:'Tiziano – Tripoli – Cortese', R:'Tori senza linea',
};
