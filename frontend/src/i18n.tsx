import React, { useState, ReactNode, useCallback } from "react";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { messages as messagesIt } from "./locales/it/messages";
import { messages as messagesEn } from "./locales/en/messages";

import "src/i18n.css";

require("moment/locale/it");

export const supportedLanguages = [
  { lang: "en", name: "English" },
  { lang: "it", name: "Italiano" },
];

i18n.load("it", messagesIt);
i18n.load("en", messagesEn);

const selectedLanguageKey = "selectedLanguage";

const getDefaultLanguage = () => {
  const storedLanguage = window.localStorage.getItem(selectedLanguageKey);
  if (storedLanguage) return storedLanguage;
  return (
    navigator.languages ? navigator.languages[0] : navigator.language
  ).substring(0, 2);
};

const storeDefaultLanguage = (newLang: string) => {
  window.localStorage.setItem(selectedLanguageKey, newLang);
};

export const defaultLanguage = getDefaultLanguage();
i18n.activate(defaultLanguage);

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

  const changeLanguage = useCallback((newLang: string) => {
    storeDefaultLanguage(newLang);
    setLanguage(newLang);
    i18n.activate(newLang);
    // when the language changes set the attribute so that bootstrap components can be translated via css
    document.getElementsByTagName("html")[0].setAttribute("lang", newLang);
  }, []);

  return (
    <I18nProvider i18n={i18n}>
      <LanguageContext.Provider value={{ lang, changeLanguage }}>
        {children}
      </LanguageContext.Provider>
    </I18nProvider>
  );
}
