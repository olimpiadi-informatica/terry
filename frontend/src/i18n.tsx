import React, { useState, ReactNode } from "react";
import { setupI18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import catalogIt from "./locales/it/messages";
import catalogEn from "./locales/en/messages";

import "src/i18n.css";

require("moment/locale/it");

const catalogs = {
  it: catalogIt,
  en: catalogEn,
};

export const supportedLanguages = [
  { lang: "en", name: "English" },
  { lang: "it", name: "Italiano" },
];

const selectedLanguageKey = "selectedLanguage";

const getDefaultLanguage = () => {
  const storedLanguage = window.localStorage.getItem(selectedLanguageKey);
  if (storedLanguage) return storedLanguage;
  return (navigator.languages ? navigator.languages[0] : navigator.language).substr(0, 2);
};

const storeDefaultLanguage = (newLang: string) => {
  window.localStorage.setItem(selectedLanguageKey, newLang);
};

export const defaultLanguage = getDefaultLanguage();

export const i18n = setupI18n({ catalogs, language: defaultLanguage });

export type LanguageContextType = {
  lang: string;
  changeLanguage: (lang: string) => void;
};

export const LanguageContext = React.createContext({
  lang: defaultLanguage,
  changeLanguage: () => {},
} as LanguageContextType);

export function TransProvider({ children }: { children: ReactNode }) {
  const [lang, setLanguage] = useState(defaultLanguage);

  const changeLanguage = (newLang: string) => {
    storeDefaultLanguage(newLang);
    setLanguage(newLang);
    i18n.activate(newLang);
    // when the language changes set the attribute so that bootstrap components can be translated via css
    document.getElementsByTagName("html")[0].setAttribute("lang", newLang);
  };

  return (
    <I18nProvider language={lang} i18n={i18n}>
      <LanguageContext.Provider value={{ lang, changeLanguage }}>{children}</LanguageContext.Provider>
    </I18nProvider>
  );
}
