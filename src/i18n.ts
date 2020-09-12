import { setupI18n } from "@lingui/core";
import catalogIt from "./locales/it/messages";
import catalogEn from "./locales/en/messages";
require("moment/locale/it");

const catalogs = {
  it: catalogIt,
  en: catalogEn,
};

export const defaultLanguage = "it";

export const i18n = setupI18n({ catalogs, language: defaultLanguage });
