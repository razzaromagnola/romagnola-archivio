import { Suspense } from 'react';
import SearchView from '@/components/SearchView';
export default function Page() {
  return <Suspense fallback={<div style={{ padding: 40 }} />}><SearchView /></Suspense>;
}
