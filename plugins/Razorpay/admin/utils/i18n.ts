/**
 * Internationalization (i18n) setup for Razorpay Plugin
 *
 * This module configures i18next for the Razorpay plugin following
 * the same patterns as talawa-admin.
 *
 * @module i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

/**
 * Supported languages for the Razorpay plugin
 */
export const supportedLanguages = ['en', 'hi', 'es', 'fr', 'de'];

/**
 * Initialize i18next with React bindings and language detection
 */
i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(HttpApi)
  .init({
    ns: ['razorpay', 'common'],
    defaultNS: 'razorpay',
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    detection: {
      order: ['cookie', 'htmlTag', 'localStorage', 'path', 'subdomain'],
      caches: ['cookie'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
