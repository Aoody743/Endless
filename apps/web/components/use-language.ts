"use client";

import { useCallback, useEffect, useState } from "react";

export type UiLanguage = "ZH" | "EN";

const KEY = "endless-language";

function readLanguage(): UiLanguage {
  if (typeof window === "undefined") return "ZH";
  const stored = window.localStorage.getItem(KEY);
  return stored === "EN" ? "EN" : "ZH";
}

export function useLanguage() {
  const [language, setLanguage] = useState<UiLanguage>("ZH");

  useEffect(() => {
    const sync = () => setLanguage(readLanguage());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("endless-language-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("endless-language-change", sync as EventListener);
    };
  }, []);

  const changeLanguage = useCallback((next: UiLanguage) => {
    window.localStorage.setItem(KEY, next);
    document.documentElement.lang = next === "ZH" ? "zh-CN" : "en";
    window.dispatchEvent(new Event("endless-language-change"));
    setLanguage(next);
    return next;
  }, []);

  const toggle = useCallback(() => {
    const next: UiLanguage = language === "ZH" ? "EN" : "ZH";
    return changeLanguage(next);
  }, [changeLanguage, language]);

  return { language, setLanguage: changeLanguage, toggle };
}

export function t(language: UiLanguage, zh: string, en: string) {
  return language === "EN" ? en : zh;
}
