export const PRICING_VERSION = '2026-11-24.1';
export const CURRENCY = 'CAD';
export const ACTIVITY_FEE = 80;
export const MEMBER_DISCOUNT = 30;
export const PAYMENT_POLICY = Object.freeze({
  enabled: false, mode: 'full', depositAmount: null, depositRate: null, lodgingTaxIncluded: null,
});

export const PLANS = Object.freeze({ a: ['city'], b: ['chalet'], both: ['city', 'chalet'] });

export const STAYS = {
  city: { nights: 3, nightly: { own: 120, shared: 60 }, dates: ['2026-12-30', '2027-01-02'] },
  chalet: { nights: 4, nightly: { own: 130, shared: 65 }, dates: ['2027-01-02', '2027-01-06'] },
};

export const GEAR_RENTAL = {
  ski: 130, snowboard: 175, url: 'https://sportsauxpucesquebec.com/pages/location-dequipement',
};

export const OPTIONS = {
  flight: { min: 450, max: 550, source: 'organizer estimate' },
  car: { min: 250, max: 350, source: 'organizer estimate' },
  ski: { min: 450, max: 650, source: 'planning range', segment: 'chalet' },
  gear: { min: GEAR_RENTAL.ski, max: GEAR_RENTAL.snowboard, source: 'Sports aux Puces Québec adult weekly estimate, tax included', segment: 'chalet' },
  citywalk: { min: 0, max: 0, source: 'free walk', segment: 'city' },
  nye: { min: 0, max: 0, source: 'official public event', segment: 'city' },
  ice: { min: 35.99, max: 42.99, source: 'operator rates online/on site', segment: 'city' },
  tubing: { min: 49.99, max: 54.99, source: 'operator rates online/on site', segment: 'city' },
  luge: {
    min: 69, max: 69, helmet: 6, source: 'operator day admission', segment: 'chalet',
    url: 'https://www.lemassif.com/en/activities-events/charlevoix-attractions/sledding',
  },
  dog: {
    min: 181, max: 181, onlineFee: 3, holidayTotal: 201, source: 'operator adult DUO regular-season rate with online fee',
    segment: 'chalet', url: 'https://secretsnordiques.com/?lang=en',
  },
  snowshoe: { min: 0, max: 0, source: 'self-guided with equipment and access', segment: 'chalet' },
  baie: { min: 0, max: 0, source: 'free walk', segment: 'chalet' },
  spa: { min: 75, max: 120, source: 'planning range' },
};

export const ACTIVITY_IDS = Object.keys(OPTIONS).filter(
  (id) => !['flight', 'car', 'ski', 'gear'].includes(id),
);

const roundMoney = (amount) => Math.round(amount * 100) / 100;

export function stayTotal(segment, bed) {
  return (STAYS[segment].nightly[bed] ?? 0) * STAYS[segment].nights;
}

export function normalizeSelection(selection = {}) {
  // Older interest records expressed attendance through the two paid bed choices.
  const legacyCity = ['own', 'shared'].includes(selection.city);
  const legacyChalet = ['own', 'shared'].includes(selection.chalet);
  const legacyPlan = legacyCity && legacyChalet ? 'both' : legacyCity ? 'a' : legacyChalet ? 'b' : '';
  const plan = Object.hasOwn(PLANS, selection.plan) ? selection.plan : legacyPlan;
  const segments = PLANS[plan] ?? [];
  const hasCity = segments.includes('city');
  const hasMountain = segments.includes('chalet');
  const city = hasCity ? (legacyCity ? selection.city : 'self') : 'none';
  const chalet = hasMountain ? (legacyChalet ? selection.chalet : 'self') : 'none';
  const lift = hasMountain ? (selection.lift ?? 'none') : 'none';
  const activities = Array.isArray(selection.activities) ? selection.activities : [];
  return {
    ...selection,
    plan,
    city,
    chalet,
    flight: selection.flight ?? 'self',
    car: hasMountain ? (selection.car ?? 'self') : 'self',
    driver: hasMountain ? (selection.driver ?? 'no') : 'no',
    lift,
    equipment: lift !== 'none' ? (selection.equipment ?? 'none') : 'none',
    activities: [...new Set(activities)].filter((id) =>
      ACTIVITY_IDS.includes(id) && (
        OPTIONS[id].segment ? segments.includes(OPTIONS[id].segment) : Boolean(plan)
      )),
  };
}

function lodgingPayment(policy, lodgingTotal) {
  if (policy.mode === 'full') return lodgingTotal;
  if (policy.mode === 'fixed' && Number.isFinite(policy.depositAmount) && policy.depositAmount >= 0) {
    return roundMoney(Math.min(policy.depositAmount, lodgingTotal));
  }
  if (policy.mode === 'percentage' && Number.isFinite(policy.depositRate) &&
      policy.depositRate >= 0 && policy.depositRate <= 1) {
    return roundMoney(lodgingTotal * policy.depositRate);
  }
  return null;
}

export function calculatePricing(selection, {
  membershipVerified = false, paymentPolicy = PAYMENT_POLICY, quoteApproved = false,
} = {}) {
  const selected = normalizeSelection(selection);
  const city = stayTotal('city', selected.city);
  const chalet = stayTotal('chalet', selected.chalet);
  const total = city + chalet;
  const activityFee = selected.plan ? ACTIVITY_FEE : 0;
  const memberDiscount = selected.plan && membershipVerified ? MEMBER_DISCOUNT : 0;
  const membershipPending = Boolean(selected.plan && selected.membership === 'yes' && !membershipVerified);
  const requiredTotal = total + activityFee - memberDiscount;

  const lineIds = [];
  const pending = [];
  if (selected.plan) {
    if (selected.flight === 'assist') {
      if (selected.plan === 'both') lineIds.push('flight');
      else pending.push('flight');
    }
    if (selected.car === 'share') lineIds.push('car');
    if (selected.lift === 'assist') lineIds.push('ski');
    if (selected.lift === 'ikon') pending.push('ikon');
    if (selected.equipment === 'rent') lineIds.push('gear');
    lineIds.push(...selected.activities);
  }
  const lines = lineIds.map((id) => ({ id, min: OPTIONS[id].min, max: OPTIONS[id].max }));
  const min = roundMoney(lines.reduce((sum, line) => sum + line.min, 0));
  const max = roundMoney(lines.reduce((sum, line) => sum + line.max, 0));
  const approvedLodging = total && paymentPolicy.enabled && quoteApproved
    ? lodgingPayment(paymentPolicy, total) : null;

  return {
    selected,
    lodging: { city, chalet, total },
    activityFee, memberDiscount, membershipPending, requiredTotal,
    amountDueNow: approvedLodging ?? 0,
    optional: { lines, pending, min, max },
    estimatedTotal: { min: roundMoney(requiredTotal + min), max: roundMoney(requiredTotal + max) },
  };
}
