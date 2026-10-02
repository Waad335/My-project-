// Plural rules for the website's ICU messages (e.g. "{count, plural, …}").
// Each polyfill installs itself only when the JavaScript engine lacks the
// feature, so engines with full Intl support are left untouched. Only the
// two app languages' plural data is bundled.
import "@formatjs/intl-getcanonicallocales/polyfill.js";
import "@formatjs/intl-locale/polyfill.js";
import "@formatjs/intl-pluralrules/polyfill.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-pluralrules/locale-data/ar.js";
