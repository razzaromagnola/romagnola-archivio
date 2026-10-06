import ChapterView from '@/components/ChapterView';
import { readChapter } from '@/lib/server';
import { INDEX } from '@/lib/data';
export const dynamicParams = false;
export function generateStaticParams() { return INDEX.editorial.map((e) => ({ id: e.id })); }
export default function Page({ params }: { params: { id: string } }) {
  return <ChapterView chapter={readChapter(params.id)} />;
}
