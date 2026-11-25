import { ACTIVITY_IDS, GEAR_RENTAL, MEMBER_DISCOUNT, OPTIONS, PLANS, STAYS, calculatePricing, stayTotal } from './pricing.mjs';
import { TRIP, EXPERIENCES, LODGING } from './content.mjs';
import { CLUB_EMAIL, REGISTRATION_CLOSES_AT, REGISTRATION_POLICY, TRANSFER_REFERENCE, WAIVER_PATH } from './registration-policy.mjs';
import { GOOGLE_FORM_OPEN, GOOGLE_FORM_PREFILL } from './form-links.mjs';
import { prefilledRegistrationUrl } from './registration-handoff.mjs';
import { EVENT_URL, escapeHtml, language, local as t, money, range, renderChrome } from './view.mjs';

const planLabels = {
  a: [['Plan A · Québec City', 'A 段 · 魁北克城'], ['Dec 30 – Jan 2 · 3 nights', '12 月 30 日–1 月 2 日 · 3 晚']],
  b: [['Plan B · Le Massif & chalet', 'B 段 · Le Massif 与木屋'], ['Jan 2–6 · 4 nights', '1 月 2–6 日 · 4 晚']],
  both: [['Plan A + B · Full trip', 'A + B · 全程'], ['Dec 30 – Jan 6 · 7 nights', '12 月 30 日–1 月 6 日 · 7 晚']],
};
const travelDates = {
  a: ['Dec 30 outbound · Jan 2 return. The club will confirm the fare for your dates.', '12 月 30 日去程，1 月 2 日返程。俱乐部将按日期确认票价。'],
  b: ['Jan 2 outbound · Jan 6 return. The club will confirm the fare for your dates.', '1 月 2 日去程，1 月 6 日返程。俱乐部将按日期确认票价。'],
  both: ['Dec 30 afternoon outbound · Jan 6 return. The target fare includes one 23 kg checked bag, subject to the final fare.', '12 月 30 日下午出发，1 月 6 日返程。目标票价含一件 23 公斤托运行李，以最终票种为准。'],
};

const bedLabels = {
  own: ['Own queen bed', '单人单床'],
  shared: ['Shared queen bed', '双人同床'],
};
const fee = (id) => range(OPTIONS[id].min, OPTIONS[id].max);
const estimate = (id) => [`${fee(id)} estimated`, `${fee(id)} 参考价`];

function choice(name, id, label, hint, checked = false) {
  return `<label class="choice-card">
    <input type="radio" name="${name}" value="${id}"${checked ? ' checked' : ''}>
    <span>${t(label)}${hint ? `<small>${t(hint)}</small>` : ''}</span>
  </label>`;
}

function group(name, label, options, { selected, id, hint } = {}) {
  return `<fieldset class="choice-field"${id ? ` id="${id}"` : ''}>
    <legend>${t(label)}</legend>${hint ?? ''}
    <div class="choice-options">${options.map(([key, text, more]) => choice(name, key, text, more, key === selected)).join('')}</div>
  </fieldset>`;
}

function stay(segment, label) {
  const config = STAYS[segment];
  const lodging = LODGING[segment];
  const beds = Object.entries(lodging.beds ?? bedLabels).map(([bed, label]) => {
    const nightly = money(config.nightly[bed]);
    const total = money(stayTotal(segment, bed));
    return [bed, label, [`${nightly}/person/night × ${config.nights} = ${total}`, `每人每晚 ${nightly} × ${config.nights} 晚 = ${total}`]];
  });
  beds.push(['self', ['I’m arranging my own stay', '自行安排住宿'], ['Outside this estimate', '费用不计入本预估']]);
  const hint = segment === 'chalet' ? `<p class="field-hint">${t(lodging.inventory)}</p>` : '';
  return group(segment, label, beds, { id: segment + '-stay', hint });
}

const policy = REGISTRATION_POLICY;
const eventOptions = ACTIVITY_IDS.filter(id => OPTIONS[id].max > 0).map(id => {
  const { segment } = OPTIONS[id];
  return `<label class="check-card" data-activity-segment="${segment ?? ''}">
    <input type="checkbox" name="activities" value="${id}">
    <span>${t(EXPERIENCES[id].title)} <small>${fee(id)}</small></span>
  </label>`;
}).join('');

const main = document.querySelector('#main');
main.innerHTML = `
  <div class="wrap form-wrap">
    <a class="back-link" href="${EVENT_URL}">← ${t(['Trip details', '返回活动介绍'])}</a>
    <header class="form-heading">
      <p class="overline">${t(TRIP.title)}</p>
      <h1>${t(['Plan your trip', '规划你的行程'])}</h1>
      <p>${t(['Estimate the cost of the plans you want to join.', '先估算你想参加的行程费用。'])}
        <span id="planner-form-intro" hidden>${t(['Your selections carry over to Google Forms.', '你的选择会自动带入 Google 表单。'])}</span></p>
    </header>
    <form id="trip-plan" class="form-layout">
      <div class="form-card">
        ${group('plan', ['Which part are you joining?', '想参加哪一段？'],
          Object.entries(planLabels).map(([id, [label, hint]]) => [id, label, hint]), { id: 'plan-choice' })}
        <section id="trip-options" hidden>
          <div class="planner-section">
            <h2>${t(['Accommodation', '住宿'])}</h2>
            <div class="field-grid planner-fields">
              ${stay('city', ['Plan A · Hotel, breakfast included', 'A 段 · 酒店含早餐'])}
              ${stay('chalet', ['Plan B · Chalet near Le Massif', 'B 段 · Le Massif 雪场附近民宿'])}
            </div>
            <p id="sharing-note" class="fine" hidden>${t(['Sharing a queen bed requires a same-gender match and mutual consent.', '双人同床须同性别配对并经双方同意。'])}</p>
          </div>
          <div class="planner-section">
            <h2>${t(['Travel & gear', '交通与装备'])}</h2>
            <div class="field-grid planner-fields">
              ${group('flight', ['Flights', '机票'], [
                ['self', ['I’ll arrange my own travel', '自行安排']],
                ['assist', ['Help me book', '希望协助购票']],
              ], { selected: 'self', hint: '<p id="flight-dates" class="field-hint"></p>' })}
              ${group('car', ['Shared rental car', '合租车辆'], [
                ['self', ['I’ll arrange my own ride', '自行安排交通']],
                ['share', ['Help me join a shared car', '希望合租车辆'], estimate('car')],
              ], { selected: 'self', id: 'car-choice', hint: `<p class="field-hint">${t(['Jan 2 pickup · Jan 6 return', '1 月 2 日取车 · 1 月 6 日还车'])}</p>` })}
              ${group('driver', ['Can you help drive?', '是否能帮忙开车？'], [
                ['yes', ['Yes', '可以']],
                ['prefer-not', ['I’d rather not', '倾向不开']],
                ['no', ['No', '不能']],
              ], { selected: 'no', id: 'driver-choice' })}
              ${group('lift', ['Le Massif lift tickets', 'Le Massif 雪票'], [
                ['none', ['I’m not skiing', '不滑雪']],
                ['assist', ['Help me buy a four-day pass', '协助购买四天雪票'], estimate('ski')],
                ['ikon', ['I have an Ikon Pass', '已有 Ikon Pass'], ['Coverage to be checked', '适用范围待核实']],
                ['self', ['I’ll buy my own', '自行购票']],
              ], { selected: 'none', id: 'lift-choice' })}
              ${group('equipment', ['Ski or snowboard gear', '滑雪装备'], [
                ['none', ['No rental needed', '无需租借']],
                ['own', ['I have my own gear', '自带装备']],
                ['rent', ['Help me rent gear', '协助租借装备'], [
                  `Weekly, tax included: skis ≈ ${money(GEAR_RENTAL.ski)} · snowboard ≈ ${money(GEAR_RENTAL.snowboard)}`,
                  `每周含税：双板约 ${money(GEAR_RENTAL.ski)} · 单板约 ${money(GEAR_RENTAL.snowboard)}`,
                ]],
                ['self', ['I’ll rent on my own', '自行租借']],
              ], { selected: 'none', id: 'gear-choice' })}
            </div>
            <details class="planner-disclosure" id="activity-estimates">
              <summary>${t(['Budget for optional activities', '加入可选活动预算'])}</summary>
              <p class="fine">${t(['For your estimate only. Arrange these activities separately once dates and availability are confirmed.', '仅用于预算。日期和场次确定后，请另行安排这些活动。'])}</p>
              <div class="check-grid">${eventOptions}</div>
            </details>
          </div>
          <div class="planner-section">
            <label class="check-card member-choice">
              <input type="checkbox" name="membership" value="yes">
              <span>${t(['I’m a UTETC member', '我是 UTETC 会员'])}
              <small>${t([`${money(MEMBER_DISCOUNT)} off after verification`, `核实后减 ${money(MEMBER_DISCOUNT)}`])}</small></span>
            </label>
          </div>
        </section>
      </div>
      <aside class="summary-card" aria-labelledby="summary-heading">
        <h2 id="summary-heading">${t(['Your estimate', '费用预估'])}</h2>
        <div id="cost-summary" aria-live="polite" aria-atomic="true"></div>
        <button class="button dark planner-submit" type="submit" disabled>${t(['Continue to registration', '继续报名'])} →</button>
        <p id="handoff-message" class="fine" role="status"></p>
        <p class="fine planner-note">${t(['Prices are in CAD. Weekly gear rental includes estimated tax. Other taxes, self-arranged costs, meals and insurance are outside this estimate.', '金额为加元。雪具周租预算含税。其他税费、自行安排的费用、餐饮和保险不计入本预估。'])}</p>
      </aside>
    </form>
    <details class="planner-disclosure payment-details" id="payment-details">
      <summary>${t(['Deposit, refund & waiver', '定金、退款与免责声明'])}</summary>
      <div class="payment-grid">
        <section>
          <h2>${t(['Interac e-Transfer', 'Interac 电子转账'])}</h2>
          <p>${t(policy.deposit)}</p>
          <div class="copy-reference"><code>${escapeHtml(TRANSFER_REFERENCE)}</code>
            <button class="button secondary" id="copy-transfer" type="button">${t(['Copy message', '复制备注'])}</button>
          </div>
          <p id="copy-message" class="fine" role="status"></p>
          <p>${t(policy.transferMessage)}</p><p>${t(policy.paymentVerification)}</p>
        </section>
        <section>
          <h2>${t(['Before you register', '报名前须知'])}</h2>
          <p>${t(policy.deadline)}</p><p>${t(policy.refund)}</p><p>${t(policy.flights)}</p><p>${t(policy.followUp)}</p>
          <p>${t(['The official form asks you to read and sign the adult waiver and trip risk acknowledgement.', '正式表单会要求阅读和签署成人免责声明及本次行程风险确认。'])}</p>
          <a href="${WAIVER_PATH}" target="_blank" rel="noopener">${t(['Club participation waiver (PDF)', '俱乐部活动免责声明（PDF）'])} ↗</a>
        </section>
      </div>
    </details>
  </div>`;

const form = document.querySelector('#trip-plan');
const cost = document.querySelector('#cost-summary');
const button = form.querySelector('button[type=submit]');
const handoff = document.querySelector('#handoff-message');

function formSelection() {
  const data = new FormData(form);
  return { ...Object.fromEntries(data), activities: data.getAll('activities') };
}

function show(id, visible) {
  const container = document.getElementById(id);
  container.hidden = !visible;
  if (container instanceof HTMLFieldSetElement) container.disabled = !visible;
}

function render() {
  const plan = form.elements.plan.value;
  const segments = PLANS[plan] ?? [];
  const city = segments.includes('city');
  const mountain = segments.includes('chalet');
  show('trip-options', Boolean(plan));
  show('city-stay', city);
  show('chalet-stay', mountain);
  for (const id of ['car-choice', 'driver-choice', 'lift-choice']) show(id, mountain);
  show('gear-choice', mountain && form.elements.lift.value !== 'none');
  for (const label of form.querySelectorAll('[data-activity-segment]')) {
    const segment = label.dataset.activitySegment;
    label.hidden = Boolean(segment && !segments.includes(segment));
    label.querySelector('input').disabled = label.hidden;
  }

  const selection = formSelection();
  const quote = calculatePricing(selection);
  const beforeCutoff = Date.now() < Date.parse(REGISTRATION_CLOSES_AT);
  const configured = Boolean(GOOGLE_FORM_PREFILL) && GOOGLE_FORM_OPEN && beforeCutoff;
  const ready = Boolean(plan) && (!city || Boolean(selection.city)) && (!mountain || Boolean(selection.chalet));
  button.disabled = !ready || !configured;
  show('planner-form-intro', configured);
  const available = configured
    ? ['Your selected plan and travel choices will be filled in for you.', '所选路线和交通选项会自动带入报名表。']
    : beforeCutoff
      ? ['Registration is awaiting approval. You can still estimate costs here.', '报名待开放，目前可以在这里预估费用。']
      : ['Registration has closed. You can still estimate costs here.', '报名已截止，目前仍可预估费用。'];
  handoff.innerHTML = t(available);

  const dates = document.querySelector('#flight-dates');
  dates.innerHTML = plan ? t(travelDates[plan]) + (plan === 'both' ? ` <strong>${t(estimate('flight'))}</strong>` : '') : '';
  show('sharing-note', selection.city === 'shared' || selection.chalet === 'shared');
  renderCosts(quote, ready, configured);
}

function renderCosts(quote, ready, registrationOpen) {
  const line = (label, value, className = '') => `<div class="${className}"><dt>${t(label)}</dt><dd>${value}</dd></div>`;
  const names = {
    flight: ['Flights', '机票'], car: ['Shared car', '合租车辆'],
    ski: ['Lift tickets', '雪票'], gear: ['Gear rental', '雪具租借'], ikon: ['Ikon Pass', 'Ikon Pass'],
  };
  const optional = quote.optional.lines.map(({ id, min, max }) => line(names[id] ?? EXPERIENCES[id].title, range(min, max)));
  for (const id of quote.optional.pending) {
    const message = id === 'flight' ? ['Fare pending', '票价待确认'] : ['Coverage pending', '适用范围待核实'];
    optional.push(line(names[id], `<small>${t(message)}</small>`));
  }
  const arranged = t(['Self-arranged', '自行安排']);
  const depositNote = quote.lodging.total
    ? t([
      'Submit the form first, then send this amount by Interac e-Transfer to ' + CLUB_EMAIL + '.',
      '请先提交报名表，再通过 Interac 电子转账将以上金额转至 ' + CLUB_EMAIL + '。',
    ])
    : t(['No transfer is needed for self-arranged lodging.', '自行安排住宿无需转账。']);
  const stayA = quote.selected.city !== 'none'
    ? line(['Plan A lodging', 'A 段住宿'], quote.lodging.city ? money(quote.lodging.city) : ready ? arranged : '—') : '';
  const stayB = quote.selected.chalet !== 'none'
    ? line(['Plan B lodging', 'B 段住宿'], quote.lodging.chalet ? money(quote.lodging.chalet) : ready ? arranged : '—') : '';
  cost.innerHTML = quote.selected.plan ? `
    <dl class="cost-lines">
      ${stayA}${stayB}
      ${line(['Club fee', '社团活动费'], money(quote.activityFee))}
      ${line(['Lodging + club fee', '住宿与社团活动费'], ready ? money(quote.requiredTotal) : '—', 'cost-total')}
    </dl>
    ${quote.membershipPending ? `<p class="fine">${t([`Verified members take ${money(MEMBER_DISCOUNT)} off the club fee.`, `会员核实后减免 ${money(MEMBER_DISCOUNT)} 活动费。`])}</p>` : ''}
    ${optional.length ? `<dl class="cost-lines optional-lines">${optional.join('')}</dl>` : ''}
    <dl class="cost-lines">
      ${line(['Estimated trip cost', '预估行程费用'], ready ? range(quote.estimatedTotal.min, quote.estimatedTotal.max) : '—', 'cost-estimate')}
      ${line(['Lodging deposit after submitting', '提交报名后应付住宿定金'], ready ? money(quote.lodging.total) : '—', 'cost-due')}
    </dl>
    ${ready && registrationOpen ? '<p class="fine planner-note">' + depositNote + '</p>' : ''}` : `<p class="fine">${t(['Start by choosing Plan A, Plan B, or both.', '先选 A 段、B 段，或全程。'])}</p>`;
}

form.addEventListener('change', render);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!button.disabled) {
    const url = prefilledRegistrationUrl(GOOGLE_FORM_PREFILL, language(), formSelection());
    if (url) location.assign(url);
  }
});
document.addEventListener('quebec-language', render);
document.querySelector('#copy-transfer').addEventListener('click', async () => {
  const status = document.querySelector('#copy-message');
  try {
    await navigator.clipboard.writeText(TRANSFER_REFERENCE);
    status.innerHTML = t(['Copied.', '已复制。']);
  } catch {
    status.innerHTML = t(['Select the message above to copy it.', '可手动选择上方备注并复制。']);
  }
});
renderChrome({ registration: true });
render();
