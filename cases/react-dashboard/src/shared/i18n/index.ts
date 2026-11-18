import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import zh from './zh';

// Bundled resources keep startup independent of network and system locale.
export const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
  resources: { en: { translation: en }, zh: { translation: zh } },
});
