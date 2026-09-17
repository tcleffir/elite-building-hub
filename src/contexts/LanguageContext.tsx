import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { translations, Locale, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const defaultLocale: Locale = "pt";

const defaultLanguageContext: LanguageContextType = {
  locale: defaultLocale,
  setLocale: () => undefined,
  t: (key) => translations[defaultLocale]?.[key] || key,
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export const useLanguage = () => {
  return useContext(LanguageContext);
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("luxcondo_locale") as Locale;
    return saved && ["pt", "es", "en"].includes(saved) ? saved : "pt";
  });

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("luxcondo_locale", newLocale);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale]?.[key] || translations.pt[key] || key;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
