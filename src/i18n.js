import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import zhTranslation from './locales/zh/translation.json';
import huTranslation from './locales/hu/translation.json';

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        resources: {
            en: {
                translation: enTranslation
            },
            zh: {
                translation: zhTranslation
            },
            hu: {
                translation: huTranslation
            }
        },
        supportedLngs: ['zh', 'en', 'hu'],
        nonExplicitSupportedLngs: true, // map zh-CN / en-US / hu-HU to zh / en / hu
        fallbackLng: 'zh', // Default to Chinese as per context (brand seems Chinese based)
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        }
    });

// Keep <html lang> in sync for accessibility / SEO
const htmlLangMap = { zh: 'zh-CN', en: 'en', hu: 'hu' };
const syncHtmlLang = (lng) => {
    const base = (lng || 'zh').split('-')[0];
    document.documentElement.lang = htmlLangMap[base] || base;
};
i18n.on('languageChanged', syncHtmlLang);
syncHtmlLang(i18n.resolvedLanguage || i18n.language);

export default i18n;
