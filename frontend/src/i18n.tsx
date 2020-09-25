import React, { useState, ReactNode } from "react";
import { setupI18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import catalogIt from "./locales/it/messages";
import catalogEn from "./locales/en/messages";
require("moment/locale/it");

const catalogs = {
  it: catalogIt,
  en: catalogEn,
};

export const supportedLanguages = [
  { lang: "en", name: "English" },
  { lang: "it", name: "Italiano" },
];

export const defaultLanguage = (navigator.languages ? navigator.languages[0] : navigator.language).substr(0, 2);

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

  const changeLanguage = (lang: string) => {
    console.log("Change language to", lang);
    setLanguage(lang);
    i18n.activate(lang);
    // when the language changes set the attribute so that bootstrap components can be translated via css
    document.getElementsByTagName("html")[0].setAttribute("lang", lang);
  };

  return (
    <I18nProvider language={lang} i18n={i18n}>
      <LanguageContext.Provider value={{ lang, changeLanguage }}>{children}</LanguageContext.Provider>
    </I18nProvider>
  );
}
