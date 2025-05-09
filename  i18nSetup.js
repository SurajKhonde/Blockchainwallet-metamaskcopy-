const i18n = require('i18n');
const path = require('path');
i18n.configure({
    locales: ['en', 'kr'],
    directory: path.join(__dirname, '/locales'),
    defaultLocale: 'en',
    queryParameter: 'lang',
    objectNotation: true,
    autoReload: true,
    updateFiles: false,
});
const i18nMiddleware = function(req, res, next) {
    i18n.setLocale(req.headers['accept-language'] || 'en');
    next();
};
module.exports = { i18n, i18nMiddleware };
