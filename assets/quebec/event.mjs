import { ACTIVITY_FEE, MEMBER_DISCOUNT, OPTIONS, STAYS, stayTotal } from './pricing.mjs';
import { TRIP, DAYS, EXPERIENCES, GOBLIN_STOPS, LODGING } from './content.mjs';
import { PHOTOS } from './photos.mjs';
import { REGISTRATION_POLICY } from './registration-policy.mjs';
import { local as t, money, range, photo, renderChrome, CALCULATOR_URL, PHOTO_PATH, escapeHtml } from './view.mjs';

const calculatorLink = () =>
  `<a class="button primary" href="${CALCULATOR_URL}">${t(['Estimate my trip cost', '估算我的旅行费用'])}<span aria-hidden="true">↗</span></a>`;

function planLabel(key) {
  const { letter } = TRIP.parts[key];
  return t([`Plan ${letter}`, `${letter} 段`]);
}

function planJump([key, part]) {
  const nights = STAYS[key].nights;
  return `<a class="plan-jump" href="#${key}">
    <span class="plan-jump-letter">${planLabel(key)}</span>
    <span><strong>${t(part.title)}</strong><small>${t(part.dates)} · ${t([`${nights} nights`, `${nights} 晚`])}</small></span>
    <span class="plan-jump-arrow" aria-hidden="true">↓</span>
  </a>`;
}

function accordion(id, title, body, { subtitle } = {}) {
  return `<details id="${id}" class="trip-panel">
    <summary><span class="panel-heading"><span class="panel-title">${t(title)}</span>
      ${subtitle ? `<span class="panel-subtitle">${t(subtitle)}</span>` : ''}</span><span class="plus" aria-hidden="true"></span></summary>
    <div class="panel-body">${body}</div>
  </details>`;
}

function experienceCard(id) {
  const activity = EXPERIENCES[id];
  const price = OPTIONS[id];
  const amount = price.min
    ? `${range(price.min, price.max)} <small>${t(['CAD / person', '加元 / 人'])}</small>`
    : t(['Free self-guided', '可免费自行游玩']);
  const detail = {
    luge: () => [
      `Both daytime routes are ${money(price.min)}. Allow 2 hours by snowcat or 3 hours with snowshoes. Helmet rental ${money(price.helmet)} extra. Advance reservation required.`,
      `两条日间路线均为 ${money(price.min)}。乘雪地车约 2 小时，选择雪鞋路线约 3 小时。头盔可另租 ${money(price.helmet)}，须提前预约。`,
    ],
    dog: () => [
      `The adult DUO rate for the January 4 suggestion includes the ${money(price.onlineFee)} online fee. Jan 2–3 costs ${money(price.holidayTotal)} per adult before tax. Check weather and availability.`,
      `1月4日建议场次的成人 DUO 价已含 ${money(price.onlineFee)} 线上手续费。1月2–3日为节日价，每人税前 ${money(price.holidayTotal)}。请留意天气和可订场次。`,
    ],
  }[id]?.() ?? activity.note;
  return `<article class="winter-experience">
    ${activity.photo ? photo(activity.photo) : ''}
    <div class="winter-experience-copy">
      <div class="winter-experience-title"><h4>${t(activity.title)}</h4><span class="price-tag">${amount}</span></div>
      <p>${t(activity.copy)}</p>
      <details class="winter-experience-detail"><summary>${t(['Details', '详情'])}</summary>
        <p>${t(detail)}</p>
        ${price.url ? `<a href="${price.url}">${t(['Operator rates and reservations', '运营方票价与预约'])} <span aria-hidden="true">↗</span></a>` : ''}
      </details>
    </div>
  </article>`;
}

function itinerary(key) {
  return accordion(`${key}-itinerary`, ['Itinerary', '简要行程'], `
    <ol class="day-list">${DAYS[key].map(([date, title, copy]) => `
      <li><span class="day-date">${t(date)}</span><div><h3>${t(title)}</h3><p>${t(copy)}</p></div></li>`).join('')}</ol>`,
  { subtitle: TRIP.parts[key].dates });
}

function filmingLocations() {
  return `<section class="locations-section" id="filming-locations" aria-labelledby="filming-heading">
    <div class="plan-subheading"><h3 id="filming-heading">${t(['Follow the Goblin trail', '跟着《鬼怪》走进老城'])}</h3>
      <p>${t(['Three stops from the Korean drama, all within a walk of each other.', '韩剧《鬼怪》的三处取景地，步行就能串起来。'])}</p></div>
    <div class="location-grid">${GOBLIN_STOPS.map(stop => `<article class="location">
      ${photo(stop.photo)}
      <div class="location-copy"><h4>${t(stop.title)}</h4><p>${t(stop.copy)}</p>
        ${stop.source ? `<a href="${stop.source}">${t(stop.sourceLabel)} <span aria-hidden="true">↗</span></a>` : ''}
      </div>
    </article>`).join('')}</div>
  </section>`;
}

function cityPlan() {
  const part = TRIP.parts.city;
  return `<section class="wrap section plan-section" id="city" aria-labelledby="city-title">
    <p class="overline">${planLabel('city')} · ${t(part.dates)} · ${t([`${STAYS.city.nights} nights`, `${STAYS.city.nights} 晚`])}</p>
    <h2 id="city-title">${t(part.title)}</h2>
    <div class="plan-gallery city-gallery">
      ${photo(part.photo, { className: 'plan-photo-main' })}
      ${photo('nye', { className: 'plan-photo-side' })}
    </div>
    <div class="plan-description">
      <p>${t(part.blurb)}</p>
      <p>${t(['Kaléidoscopes brings outdoor music and a free countdown to Parliament Hill on December 31, weather permitting.', '如天气允许，12月31日晚 Kaléidoscopes 将在议会山一带举行户外演出和免费跨年倒数。'])}
        <a href="https://animee.ville.quebec.qc.ca/activites/grandes-celebrations-de-fin-dannee-festival-kaleidoscopes/">${t(['City programme', '市政府活动安排'])} <span aria-hidden="true">↗</span></a>
      </p>
    </div>
    ${filmingLocations()}
    ${itinerary('city')}
  </section>`;
}

function chaletPlan() {
  const part = TRIP.parts.chalet;
  return `<section class="wrap section plan-section" id="chalet" aria-labelledby="chalet-title">
    <p class="overline">${planLabel('chalet')} · ${t(part.dates)} · ${t([`${STAYS.chalet.nights} nights`, `${STAYS.chalet.nights} 晚`])}</p>
    <h2 id="chalet-title">${t(part.title)}</h2>
    <div class="plan-gallery chalet-gallery">
      ${photo(part.photo, { className: 'plan-photo-main' })}
      ${photo('refuge-hot-tub', { className: 'plan-photo-side' })}
    </div>
    <div class="plan-description">
      <p>${t(part.blurb)}</p>
      <p>${t(['Skiing and snowboarding are optional. The chalet lists a kitchen, BBQ and outdoor hot tub, subject to winter availability.', '滑双板或单板都自愿。木屋配有厨房、烤炉和户外热水浴池，部分设施以冬季开放状况为准。'])}
        <a href="https://www.lemassif.com/en/the-mountain/winter/image-gallery">${t(['Le Massif winter gallery', 'Le Massif 官方冬季相册'])} <span aria-hidden="true">↗</span></a>
      </p>
    </div>
    ${itinerary('chalet')}
  </section>`;
}

function optionalExperiences() {
  return `<section class="wrap section winter-section" id="experiences" aria-labelledby="winter-heading">
    <div class="section-heading">
      <h2 id="winter-heading">${t(['Other ways to spend a winter day', '还可以这样玩'])}</h2>
      <p>${t(['Pick what interests you. Per-person CAD prices are for planning. Check availability, weather and taxes before booking.', '按兴趣自由选择。价格为每人加元参考价，预约前请核实可订场次、天气和税费。'])}</p>
    </div>
    <div class="winter-groups">
      <div><h3>${planLabel('city')} · ${t(['Around Québec City', '魁北克城周边'])}</h3>
        <div class="winter-list">${['ice', 'tubing', 'spa'].map(experienceCard).join('')}</div></div>
      <div><h3>${planLabel('chalet')} · ${t(['Around Charlevoix', 'Charlevoix 周边'])}</h3>
        <div class="winter-list">${['dog', 'luge', 'baie', 'snowshoe'].map(experienceCard).join('')}</div></div>
    </div>
  </section>`;
}

function stayCard([key, stay]) {
  const info = LODGING[key];
  const labels = { own: ['Own Queen Bed', '独享 Queen 床'], shared: ['Shared Queen Bed', '共享 Queen 床'] };
  return `<article class="stay-card">
    <header class="stay-header">
      <p class="part-dates">${t(info.area)} · ${t(TRIP.parts[key].dates)}</p>
      <h3>${escapeHtml(info.title)}</h3>
      <ul class="stay-highlights">${info.highlights.map(label => `<li>${t(label)}</li>`).join('')}</ul>
    </header>
    <div class="stay-gallery" style="--thumbnail-count: ${info.photos.length - 1}">
      ${info.photos.map(id => `<a href="${PHOTO_PATH}${PHOTOS[id].file}" target="_blank" rel="noopener">${photo(id, { caption: false })}</a>`).join('')}
    </div>
    <div class="stay-content">
      <p>${t(info.copy)}</p><p class="fine">${t(info.inventory)}</p>
      <dl class="stay-prices">${Object.keys(labels).map((bed) => {
      const nightly = money(stay.nightly[bed]);
      const total = money(stayTotal(key, bed));
      return `<div><dt>${t(labels[bed])}<small>${t([
        `${nightly} / person / night × ${stay.nights} nights`,
        `每人每晚 ${nightly} × ${stay.nights} 晚`,
      ])}</small></dt><dd><strong>${total}</strong><small>${t(['CAD / person', '加元 / 人'])}</small></dd></div>`;
    }).join('')}</dl>
    </div>
  </article>`;
}

function transportation() {
  const flight = range(OPTIONS.flight.min, OPTIONS.flight.max);
  const car = range(OPTIONS.car.min, OPTIONS.car.max);
  return `<div class="info-grid">
    <article class="info-card"><h3>${t(['Round-trip flight', '往返机票'])}</h3>
      <p class="price-tag">${flight} ${t(['CAD / person estimated', '加元 / 人，预估'])}</p>
      <p>${t(['Toronto ↔ Québec City. The target fare includes one 23 kg checked bag, subject to the final fare. Confirm ski bag rules separately. Request booking assistance or travel independently.', '多伦多 ↔ 魁北克城。目标价包含一件 23 公斤托运行李，以最终票价为准。雪具行李规则需另行核实。可申请协助订票，也可自行安排。'])}</p>
      <ul><li>${t(['Both segments · depart Dec 30 in the afternoon, return Jan 6', '全程 · 12月30日下午出发，1月6日返程'])}</li>
        <li>${t(['City only · Dec 30 to Jan 2', '仅魁北克城 · 12月30日至1月2日'])}</li>
        <li>${t(['Chalet only · Jan 2 to Jan 6', '仅木屋 · 1月2日至1月6日'])}</li></ul></article>
    <article class="info-card"><h3>${t(['Shared rental car', '合租车辆'])}</h3>
      <p class="price-tag">${car} ${t(['CAD / person estimated', '加元 / 人，预估'])}</p>
      <p>${t(['Recommended for the chalet. Aim for Jan 2 pickup and Jan 6 return, with about 3–4 people per car depending on gear. Independent transport is welcome.', '木屋段建议合租车。计划 1月2日取车、1月6日还车，每车约 3–4 人，视雪具和行李空间而定。也可自行安排交通。'])}</p>
      <p class="fine">${t(['Check holiday branch hours, winter tires, driver eligibility, insurance, additional driver fees and equipment space. Québec-registered rentals require compliant winter tires. Allow a winter-road buffer before your flight.', '请确认节假日门店营业、冬季轮胎、驾驶资格、保险、额外驾驶员费用和雪具空间。魁北克注册的租车须按规定配备冬季胎。返程请为冬季路况预留时间。'])}</p></article>
  </div>`;
}

const fees = t([
  `A ${money(ACTIVITY_FEE)} CAD activity fee applies once per participant. Verified UTETC members save ${money(MEMBER_DISCOUNT)}.`,
  `每人收取一次 ${money(ACTIVITY_FEE)} 加元活动费，核实为 UTETC 会员后减免 ${money(MEMBER_DISCOUNT)} 加元。`,
]);
const ski = range(OPTIONS.ski.min, OPTIONS.ski.max);
const gear = range(OPTIONS.gear.min, OPTIONS.gear.max);
const eventMain = document.querySelector('#main');
eventMain.innerHTML = `
  <section class="hero" aria-labelledby="trip-title">
    ${photo(TRIP.hero, { eager: true, caption: false, className: 'hero-image' })}
    <div class="wrap hero-content">
      <p class="hero-date">${t(TRIP.dates)}<span aria-hidden="true"> / </span>${t(TRIP.duration)}</p>
      <h1 id="trip-title">${t(['Québec New Year', '魁北克跨年'])}<br><em>${t(['Escape 2027', '之旅 2027'])}</em></h1>
      <p class="hero-theme">${t(TRIP.theme)}</p>
      <div class="hero-actions">${calculatorLink()}<a href="#segments" class="hero-secondary">${t(['Explore both plans', '看看两段行程'])}<span aria-hidden="true">↓</span></a></div>
    </div>
    <p class="hero-location">${t(TRIP.heroLocation)}</p>
  </section>
  <section class="wrap section plan-overview" id="segments" aria-labelledby="segments-heading">
    <div class="section-heading">
      <h2 id="segments-heading">${t(['Join one plan or both', '选一段，也可以两段都参加'])}</h2>
      <p>${t(['Come with friends or meet other students on the trip. Join either plan with club lodging or arrange your own stay.', '可以约朋友一起，也可以在路上认识新同学。每段都可选社团住宿，或自行安排。'])}</p>
    </div>
    <div class="plan-jumps">${Object.entries(TRIP.parts).map(planJump).join('')}</div>
  </section>
  <div id="itinerary">
    ${cityPlan()}
    ${chaletPlan()}
  </div>
  ${optionalExperiences()}
  <section class="wrap section itinerary-section practical-section" aria-labelledby="practical-heading">
    <div class="section-heading">
      <h2 id="practical-heading">${t(['Stays, travel & costs', '住宿、交通与费用'])}</h2>
      <p>${t(['Lodging and optional activities are subject to availability. All amounts are in CAD.', '住宿和自选项目以实际可订情况为准。金额均为加元。'])}</p>
    </div>
    <div class="accordion">
      ${accordion('lodging', ['Where we’re staying', '住宿安排'], `
        <div class="info-grid">${Object.entries(STAYS).map(stayCard).join('')}</div>
        <p class="panel-note">${t(['Club lodging is optional for both plans. Prices are provisional and per person. Shared beds require mutual consent and same-gender matching. A queen bed to yourself does not guarantee a private bedroom. The club will contact you if there is no compatible match.', '两段都可自行安排住宿。以上为每人暂定价格。两人同床需双方同意并同性别配对。单人单床不保证独立卧室。如无法配对，俱乐部会联系你确认其他选项。'])}</p>`, { subtitle: ['Hotel & chalet photos, beds and rates', '酒店与木屋照片、床位和价格'] })}
      ${accordion('transport', ['Flights & local transportation', '航班与当地交通'], transportation())}
      ${accordion('pricing', ['Pricing & registration', '费用与报名'], `
        <p class="panel-intro">${fees}</p>
        <p>${t([`Plan B only: budget about ${ski} per person for four days of lift tickets and ${gear} for four days of rental gear, before tax. Confirm Ikon access, tickets and equipment separately.`, `仅 B 段：四天雪票预计每人 ${ski}，四天雪具预计每人 ${gear}，均未含税。请分别核实 Ikon 权益、雪票和雪具价格。`])}</p>
        <p class="fine">${t(['Your trip estimate helps you plan. The club will confirm any payment instructions and amount separately.', '旅行预算供你提前规划。实际应付金额和付款方式由俱乐部另行确认。'])}</p>
        <ul class="event-registration-terms">${['deadline', 'deposit', 'refund', 'flights', 'followUp'].map(key =>
          `<li>${t(REGISTRATION_POLICY[key])}</li>`).join('')}</ul>
        ${calculatorLink()}`)}
    </div>
  </section>
  <section class="closing">
    <div class="wrap closing-inner"><div><h2>${t(['Which part will you join?', '你想参加哪一段？'])}</h2>
      <p>${t(['Choose Plan A, Plan B or both. See your estimate before continuing to registration.', '选择 A 段、B 段或两段都参加。先看预计费用，再继续报名。'])}</p></div>${calculatorLink()}</div>
  </section>
  <div class="wrap credits"><details><summary>${t(['Photo credits', '照片来源'])}</summary><ul>${Object.values(PHOTOS).map(item => `
    <li>${item.source ? `<a href="${item.source}">${escapeHtml(item.title)}</a>` : escapeHtml(item.title)}
    · ${escapeHtml(item.credit)}${item.licenseUrl ? ` · <a href="${item.licenseUrl}">${escapeHtml(item.license)}</a>` : ''}
    · ${t(['Resized and converted to WebP', '已调整尺寸并转换为 WebP'])}</li>`).join('')}</ul></details></div>
  <div class="mobile-cta">${calculatorLink()}</div>`;

for (const link of eventMain.querySelectorAll('a[href^="#"]')) {
  link.addEventListener('click', () => {
    const target = document.getElementById(link.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  });
}
const fromHash = document.getElementById(location.hash.slice(1));
if (fromHash instanceof HTMLDetailsElement) fromHash.open = true;
renderChrome();
