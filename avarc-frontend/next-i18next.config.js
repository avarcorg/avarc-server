const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    // Invalid literal value, expected false at "i18n.localeDetection"
    localeDetection: false,
  },
  defaultNS: 'common',
  ns: ['common', 'auth', 'api', 'home', 'dashboard', 'user'],
  localePath: path.resolve('./public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  serializeConfig: false,
  use: [],
  initImmediate: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
};
