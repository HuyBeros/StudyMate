import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ── Locales ────────────────────────────────────────────────────────────────
import commonVi    from './locales/vi/common.json';
import authVi      from './locales/vi/auth.json';
import dashboardVi from './locales/vi/dashboard.json';
import scheduleVi  from './locales/vi/schedule.json';
import subjectsVi  from './locales/vi/subjects.json';
import aiVi        from './locales/vi/ai.json';
import statisticsVi from './locales/vi/statistics.json';

import commonEn    from './locales/en/common.json';
import authEn      from './locales/en/auth.json';
import dashboardEn from './locales/en/dashboard.json';
import scheduleEn  from './locales/en/schedule.json';
import subjectsEn  from './locales/en/subjects.json';
import aiEn        from './locales/en/ai.json';
import statisticsEn from './locales/en/statistics.json';

// ── Supported languages ────────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
];

// ── Init ───────────────────────────────────────────────────────────────────
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        common:    commonVi,
        auth:      authVi,
        dashboard: dashboardVi,
        schedule:  scheduleVi,
        subjects:  subjectsVi,
        ai:        aiVi,
        statistics: statisticsVi,
      },
      en: {
        common:    commonEn,
        auth:      authEn,
        dashboard: dashboardEn,
        schedule:  scheduleEn,
        subjects:  subjectsEn,
        ai:        aiEn,
        statistics: statisticsEn,
      },
    },

    ns: ['common', 'auth', 'dashboard', 'schedule', 'subjects', 'ai', 'statistics'],
    defaultNS: 'common',
    lng: 'vi',
    supportedLngs: ['vi'],
    fallbackLng: 'vi',

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
