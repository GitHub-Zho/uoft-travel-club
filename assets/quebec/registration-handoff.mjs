import { normalizeSelection } from './pricing.mjs';

export function prefilledRegistrationUrl(config, language, selection) {
  const chosen = normalizeSelection(selection);
  const locale = config?.[language];
  if (!chosen.plan || !config?.meta || !locale) return null;

  const url = new URL(config.meta.url);
  if (url.origin !== 'https://docs.google.com' || !url.pathname.startsWith('/forms/')) return null;
  url.searchParams.set('usp', 'pp_url');

  function set(field, code) {
    const value = field?.values[code];
    if (/^entry\.\d+$/.test(field?.entry ?? '') && value) url.searchParams.set(field.entry, value);
  }
  set(config.meta.language, language);
  for (const key of ['plan', 'membership', 'flight']) set(locale[key], chosen[key]);
  if (chosen.plan === 'a') set(locale.cityA, chosen.city);
  if (chosen.plan === 'both') set(locale.cityBoth, chosen.city);
  if (chosen.plan !== 'a') {
    for (const key of ['chalet', 'car', 'driver', 'lift']) set(locale[key], chosen[key]);
    if (chosen.lift !== 'none') set(locale.equipment, chosen.equipment);
  }
  return url.href;
}
