import Scheda from '@/components/Scheda';
import { allBullsFlat, readLine } from '@/lib/server';
export const dynamicParams = false;
export function generateStaticParams() { return allBullsFlat().map(({ id }) => ({ id })); }
export default function Page({ params }: { params: { id: string } }) {
  const rec = allBullsFlat().find((x) => x.id === params.id)!;
  const line = readLine(rec.line);
  return <Scheda line={line} id={params.id} />;
}
