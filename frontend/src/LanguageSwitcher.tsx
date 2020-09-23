import React from "react";
import { LanguageContext, supportedLanguages } from "./i18n";

export default class LanguageSwitcher extends React.Component {
  static contextType = LanguageContext;

  changeLanguage(event: React.ChangeEvent<HTMLSelectElement>) {
    let lang = event.target.value;
    this.context.changeLanguage(lang);
  }

  render() {
    return (
      <LanguageContext.Consumer>
        {({ lang }) => (
          <select
            className="ml-2 form-control form-control-sm language-selector"
            onChange={this.changeLanguage.bind(this)}
            value={lang}
          >
            {supportedLanguages.map(({ lang, name }) => (
              <option key={lang} value={lang}>
                {name}
              </option>
            ))}
          </select>
        )}
      </LanguageContext.Consumer>
    );
  }
}
