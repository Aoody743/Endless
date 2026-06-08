"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type StudioLocale = "zh" | "en";

const STORAGE_KEY = "endless-studio-language";

interface StudioLocaleContextValue {
  locale: StudioLocale;
  setLocale: (next: StudioLocale) => void;
  t: (zh: string, en: string) => string;
}

const StudioLocaleContext = createContext<StudioLocaleContextValue | null>(null);

export function StudioLocaleProvider({
  initialLocale,
  children
}: {
  initialLocale: StudioLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<StudioLocale>(initialLocale);

  useEffect(() => {
    const readLocal = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "zh") {
        setLocaleState(stored);
      } else {
        setLocaleState(initialLocale);
        window.localStorage.setItem(STORAGE_KEY, initialLocale);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        readLocal();
      }
    };
    const onCustomSync = () => {
      readLocal();
    };

    readLocal();
    window.addEventListener("storage", onStorage);
    window.addEventListener("endless-studio-language-change", onCustomSync as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("endless-studio-language-change", onCustomSync as EventListener);
    };
  }, [initialLocale]);

  const value = useMemo<StudioLocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        setLocaleState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
        window.dispatchEvent(new Event("endless-studio-language-change"));
      },
      t: (zh, en) => (locale === "en" ? en : zh)
    }),
    [locale]
  );

  return <StudioLocaleContext.Provider value={value}>{children}</StudioLocaleContext.Provider>;
}

export function useStudioLocale() {
  const context = useContext(StudioLocaleContext);
  if (!context) {
    return {
      locale: "zh" as StudioLocale,
      setLocale: (_next: StudioLocale) => {},
      t: (zh: string, _en: string) => zh
    };
  }
  return context;
}
