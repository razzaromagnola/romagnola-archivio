import fs from 'node:fs';
import path from 'node:path';
import type { Line, Chapter } from './types';
const dir = path.join(process.cwd(), 'content');
export function allLineCodes(): string[] {
  return fs.readdirSync(path.join(dir, 'lines')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
}
export function readLine(code: string): Line {
  return JSON.parse(fs.readFileSync(path.join(dir, 'lines', `${code.toLowerCase()}.json`), 'utf8'));
}
export function readChapter(id: string): Chapter {
  return JSON.parse(fs.readFileSync(path.join(dir, 'chapters', `${id}.json`), 'utf8'));
}
export function allBullsFlat(): { id: string; line: string }[] {
  const out: { id: string; line: string }[] = [];
  for (const c of allLineCodes()) { const L = readLine(c); for (const b of L.bulls) out.push({ id: b.id, line: L.code }); }
  return out;
}
