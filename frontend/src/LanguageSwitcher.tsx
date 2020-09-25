import React, { useContext } from "react";
import { LanguageContext, supportedLanguages } from "./i18n";

export default function LanguageSwitcher() {
  const languageContext = useContext(LanguageContext);

  const changeLanguage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let lang = event.target.value;
    languageContext.changeLanguage(lang);
  };

  return (
    <select
      className="ml-2 form-control form-control-sm language-selector"
      onChange={changeLanguage}
      value={languageContext.lang}
    >
      {supportedLanguages.map(({ lang, name }) => (
        <option key={lang} value={lang}>
          {name}
        </option>
      ))}
    </select>
  );
}
