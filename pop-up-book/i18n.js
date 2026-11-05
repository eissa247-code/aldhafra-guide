// i18n.js — اللغة من ?lang=en|ar (الافتراضي ar) وتُحفظ في المتصفح
let l = 'ar';
try { l = new URLSearchParams(location.search).get('lang') || localStorage.getItem('popup-book-lang') || 'ar'; } catch { /* افتراضي */ }
export const lang = l === 'en' ? 'en' : 'ar';
try { localStorage.setItem('popup-book-lang', lang); } catch { /* تجاهل */ }
document.documentElement.lang = lang;
document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
export const t = (ar, en) => (lang === 'en' ? en : ar);
