'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from '@/lib/types';

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'it', setLang: () => {},
});
export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('it');
  useEffect(() => {
    try { const s = localStorage.getItem('lang'); if (s === 'en' || s === 'it') setLangState(s); } catch {}
  }, []);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem('lang', l); } catch {} };
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);
/** pick Italian or English */
export function useT() {
  const { lang } = useLang();
  return (it: string, en: string) => (lang === 'en' ? en : it);
}
