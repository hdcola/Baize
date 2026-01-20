import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "../locales/en.json";
import zh from "../locales/zh.json";
import fr from "../locales/fr.json";
import zhTw from "../locales/zh-tw.json";

// Config storage for language detector
const languageDetectorOptions = {
  // order and from where user language should be detected
  order: ["localStorage", "navigator"],
  // keys or params to lookup language from
  lookupLocalStorage: "i18nextLng",
  // cache user language on
  caches: ["localStorage"],
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      fr: { translation: fr },
      zhTw: { translation: zhTw },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: languageDetectorOptions,
  });

export default i18n;
