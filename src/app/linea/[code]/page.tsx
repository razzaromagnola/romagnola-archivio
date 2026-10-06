import { Suspense } from 'react';
import LineView from '@/components/LineView';
import { allLineCodes, readLine } from '@/lib/server';
export const dynamicParams = false;
export function generateStaticParams() { return allLineCodes().map((code) => ({ code })); }
export default function Page({ params }: { params: { code: string } }) {
  const line = readLine(params.code);
  return <Suspense fallback={<div style={{ padding: 40 }} />}><LineView line={line} /></Suspense>;
}
