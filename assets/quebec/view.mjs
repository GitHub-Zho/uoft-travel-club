import { PHOTOS } from './photos.mjs';

export const EVENT_URL = '/quebec-new-year';
export const CALCULATOR_URL = '/quebec-registration';
export const REGISTER_URL = CALCULATOR_URL;
export const PHOTO_PATH = '/assets/quebec/';
export const bilingual = (en, zh) => [en, zh];

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

export function local([en, zh]) {
  return `<span class="t-en" lang="en">${escapeHtml(en)}</span><span class="t-zh" lang="zh-Hans">${escapeHtml(zh)}</span>`;
}

export function language() {
  return document.documentElement.lang === 'zh-Hans' ? 'zh' : 'en';
}

export function money(amount) {
  const decimals = Number.isInteger(amount) ? 0 : 2;
  return '$' + amount.toLocaleString('en-CA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function range(min, max) {
  return min === max ? money(min) : `${money(min)}–${money(max)}`;
}

export function photo(id, { eager = false, caption = true, className = '' } = {}) {
  const item = PHOTOS[id];
  return `<figure class="photo ${className}">
    <img src="${PHOTO_PATH}${item.file}" alt="${escapeHtml(item.alt.en)}"
      data-alt-en="${escapeHtml(item.alt.en)}" data-alt-zh="${escapeHtml(item.alt.zh)}"
      loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : 'decoding="async"'}>
    ${caption && item.caption ? `<figcaption>${local([item.caption.en, item.caption.zh])}</figcaption>` : ''}
  </figure>`;
}

function setLanguage(lang, registration) {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
  document.title = lang === 'zh'
    ? `魁北克跨年之旅 2027${registration ? ' · 报名' : ''} · UTETC`
    : `Québec New Year Escape 2027${registration ? ' · Registration' : ''} · UTETC`;
  for (const button of document.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === lang));
  }
  for (const image of document.querySelectorAll('[data-alt-en]')) {
    image.alt = lang === 'zh' ? image.dataset.altZh : image.dataset.altEn;
  }
  for (const option of document.querySelectorAll('option[data-zh]')) {
    option.textContent = lang === 'zh' ? option.dataset.zh : option.dataset.en;
  }
  try { localStorage.setItem('utetc-quebec-lang', lang); } catch {}
  document.dispatchEvent(new Event('quebec-language'));
}

export function renderChrome({ registration = false } = {}) {
  document.querySelector('#site-header').innerHTML = `
    <a class="skip-link" href="#main">${local(['Skip to content', '跳至内容'])}</a>
    <div class="wrap header-inner">
      <a href="/" class="brand"><span aria-hidden="true" class="brand-mark">↗</span>
        <span>UTETC<small>${local(['UofT Exploration & Travel Club', '多伦多大学探索与旅行社'])}</small></span>
      </a>
      <nav class="header-nav">
        ${registration ? `<a href="${EVENT_URL}">${local(['Trip details', '行程详情'])}</a>`
          : `<a href="#itinerary">${local(['Itinerary', '行程'])}</a>
             <a href="${REGISTER_URL}" class="header-register">${local(['Registration', '报名'])}</a>`}
      </nav>
      <div class="language-switch">
        <button type="button" data-language="en" aria-label="English" aria-pressed="true">EN</button>
        <button type="button" data-language="zh" lang="zh-Hans" aria-label="简体中文" aria-pressed="false">中文</button>
      </div>
    </div>`;
  document.querySelector('#site-footer').innerHTML = `
    <div class="wrap footer-inner"><p>UTETC · ${local(['UofT Exploration & Travel Club', '多伦多大学探索与旅行社'])}</p>
      <a href="mailto:uoft.travelclub@gmail.com">uoft.travelclub@gmail.com</a>
      <a href="/">${local(['Club website', '俱乐部主页'])}</a></div>`;
  const main = document.querySelector('#main');
  main.tabIndex = -1;
  for (const button of document.querySelectorAll('[data-language]')) {
    button.addEventListener('click', () => setLanguage(button.dataset.language, registration));
  }
  let saved = 'en';
  try { saved = localStorage.getItem('utetc-quebec-lang') === 'zh' ? 'zh' : 'en'; } catch {}
  setLanguage(saved, registration);
}
