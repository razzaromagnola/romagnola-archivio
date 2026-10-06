export interface Bull {
  id: string; name: string; matricola?: string; sire?: string; prov?: string;
  born?: string; branch?: string; estero?: boolean; country: string; flag: string;
  img: string | null; parent: string | null; order?: string;
}
export interface NarrSection { h: string; ps: string[]; }
export interface ChapterImage { img: string; cap: string; }
export interface Chapter {
  id: string; code: string; title: string; kind: string; desc?: string;
  it_html: string; en_html: string; images: ChapterImage[];
}
export interface ChapterMeta { id: string; code: string; title: string; kind: string; desc?: string; }
export interface Line {
  code: string; name: string; founder: string; root: string | null;
  kind: 'line' | 'category'; bulls: Bull[]; narr: { it: NarrSection[]; en: NarrSection[] };
}
export interface LineMeta { code: string; name: string; founder: string; kind: string; count: number; founderImg: string | null; }
export interface IndexData { lines: LineMeta[]; lines_all: string[]; editorial: ChapterMeta[]; hero: string; }
export interface SearchRow { id: string; name: string; matricola: string; sire: string; country: string; flag: string; img: string | null; line: string; lineName: string; }
export type Lang = 'it' | 'en';
