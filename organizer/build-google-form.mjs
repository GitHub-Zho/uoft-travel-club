import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { ACTIVITY_FEE, MEMBER_DISCOUNT, OPTIONS, PLANS, PRICING_VERSION, STAYS, stayTotal } from '../assets/quebec/pricing.mjs';
import { CLUB_EMAIL, REGISTRATION_CLOSES_AT, REGISTRATION_POLICY, WAIVER_URL } from '../assets/quebec/registration-policy.mjs';

const policy = REGISTRATION_POLICY;
const cash = (value) => 'C$' + value.toLocaleString('en-CA');
const estimate = ({ min, max }) => cash(min) + '–' + max.toLocaleString('en-CA');
const languageOptions = { en: 'English', zh: '简体中文' };

function text(key, title, { help, validation, required = true } = {}) {
  return { type: 'text', key, title, help, validation, required };
}

function radio(key, title, options, { help, branches } = {}) {
  return { type: 'radio', key, title, options, required: true, help, branches };
}

const note = (title, help) => ({ type: 'note', title, help });
const section = (key, title, questions, next, help) => ({ key, title, questions, next, help });

function localizedForm(language) {
  const en = language === 'en';
  const words = (english, chinese) => en ? english : chinese;
  const translate = (pair) => pair[en ? 0 : 1];
  const lines = (...pairs) => pairs.map(translate).join('\n');
  const oneTimeFee = cash(ACTIVITY_FEE);
  const discount = cash(MEMBER_DISCOUNT);
  const fees = words(
    'The club fee is ' + oneTimeFee + ' per person, once per trip. Verified UTETC members save ' + discount + '.',
    '活动费每人 ' + oneTimeFee + '，全程只收一次。经核实的 UTETC 会员减免 ' + discount + '。',
  );
  const pending = words(
    'Nothing is due when you submit this form. If you arrange your own lodging, no lodging deposit is due.',
    '提交本表时无需付款。自行安排住宿的部分无需支付住宿定金。',
  );
  const terms = [
    pending, fees,
    lines(policy.deposit, policy.transferMessage, policy.refund, policy.paymentVerification, policy.followUp),
  ].join('\n\n');

  function lodging(segment, key) {
    const stay = STAYS[segment];
    const stayLabel = segment === 'city' ? 'A' : 'B';
    const roomText = (bed) => {
      const nightly = cash(stay.nightly[bed]);
      const total = cash(stayTotal(segment, bed));
      return words(nightly + '/person/night × ' + stay.nights + ' = ' + total + '/person',
        nightly + '/人/晚 × ' + stay.nights + '晚 = ' + total + '/人');
    };
    return radio(key, words('Plan ' + stayLabel + ' lodging', 'Plan ' + stayLabel + ' 住宿'), {
      own: words('Own queen bed', '独享 Queen 床') + ' · ' + roomText('own'),
      shared: words('Shared queen bed', '两人合用 Queen 床') + ' · ' + roomText('shared'),
      self: words('No accommodation needed', '不需要住宿'),
    }, {
      help: words('An own bed may be in a shared room. Shared beds require a same-gender match and mutual consent.',
        '独享床位仍可能与他人同房。合用床位须同性配对且双方同意。'),
    });
  }

  const planTitles = {
    a: words('Plan A only · Québec City', '只参加 Plan A · 魁北克城'),
    b: words('Plan B only · Le Massif & chalet', '只参加 Plan B · Le Massif 与木屋'),
    both: words('Plan A + Plan B', '参加 Plan A + Plan B'),
  };
  const planOptions = Object.fromEntries(Object.keys(PLANS).map((plan) => [plan, planTitles[plan]]));
  const sharedRide = estimate(OPTIONS.car);
  const skiBudget = estimate(OPTIONS.ski);
  const gearBudget = estimate(OPTIONS.gear);
  const flightBudget = estimate(OPTIONS.flight);
  const receipt = {
    intro: words(
      'We received your answers. Membership and any accommodation or payment still need to be verified. For corrections, email ' + CLUB_EMAIL + '.',
      '我们已收到你的答复。会员资格，以及适用的住宿与付款资料，仍待核实。如需更正，请联系 ' + CLUB_EMAIL + '。',
    ),
    subject: words('UTETC Québec 2027 · Your registration answers', 'UTETC 魁北克跨年之旅 · 你的报名答复'),
    submitted: words('Submitted', '提交时间'),
    answers: words('Your answers', '你的答复'),
    terms: words('Registration and payment terms', '报名及付款条款'),
  };

  return {
    terms, receipt,
    sections: [
      section('contact', words('Your plan and contact details', '行程与联系方式'), [
        radio('plan', words('Which plan are you joining?', '你参加哪个行程？'), planOptions, {
          branches: { a: 'cityA', b: 'chalet', both: 'cityBoth' },
          help: words('Plan A: Dec 30–Jan 2. Plan B: Jan 2–6. You can arrange your own lodging.',
            'Plan A：12月30日–1月2日。Plan B：1月2–6日。可自行安排住宿。'),
        }),
        text('name', words('Full name', '姓名')),
        text('email', words('Email for your answer copy', '接收答复副本的邮箱'), { validation: 'email' }),
        text('phone', words('Phone number', '手机号码')),
        text('social', words('Social platform and handle', '社交平台与账号'), { required: false }),
        radio('membership', words('Current UTETC member?', '你是现任 UTETC 会员吗？'), {
          yes: words('Yes, subject to verification', '是，待核实'), no: words('No', '否'),
        }),
        text('companions', words('Preferred roommate or companions', '希望同住或同行的人'), { required: false }),
        radio('flight', words('Flight arrangements', '机票安排'), {
          assist: words('Help booking flights', '希望协助购票'), self: words('I’ll arrange my own travel', '自行安排交通'),
        }, {
          help: words('Assisted round trip ≈ ' + flightBudget + '/person, target fare with a 23 kg checked bag. We’ll confirm dates and fares for your plan.',
            '协助订购往返机票约 ' + flightBudget + '/人，目标票价含23公斤托运行李。航班日期和价格按所选行程确认。'),
        }),
      ], undefined, lines(policy.deadline, policy.flights)),
      section('cityA', words('Plan A · Québec City', 'Plan A · 魁北克城'),
        [lodging('city', 'cityA')], 'sign', words('Dec 30–Jan 2 · 3 nights · breakfast included', '12月30日–1月2日 · 3晚 · 含早餐')),
      section('cityBoth', words('Plan A lodging · Both plans', 'Plan A 住宿 · 两段行程'),
        [lodging('city', 'cityBoth')], 'chalet', words('Dec 30–Jan 2 · 3 nights · breakfast included', '12月30日–1月2日 · 3晚 · 含早餐')),
      section('chalet', words('Plan B · Charlevoix', 'Plan B · Charlevoix 木屋'), [
        lodging('chalet', 'chalet'),
        radio('car', words('Shared rental car', '租车安排'), {
          share: words('Interested in sharing', '有兴趣合租'), self: words('I’ll arrange my own transport', '自行安排交通'),
        }, {
          help: words('Jan 2–6 · estimated ' + sharedRide + '/person.', '1月2–6日 · 预估 ' + sharedRide + '/人。'),
        }),
        radio('driver', words('Could you drive if needed?', '有需要时你能开车吗？'), {
          yes: words('Yes, willing to drive', '可以并愿意开车'),
          'prefer-not': words('Can drive but prefer not to', '会开车，但希望不开'),
          no: words('Cannot drive', '不能开车'),
        }),
        radio('lift', words('Le Massif lift tickets', 'Le Massif 雪票'), {
          assist: words('Help buying four days of lift tickets', '希望协助购买四天雪票'),
          ikon: words('I have an Ikon Pass', '已有 Ikon Pass'),
          self: words('I’ll buy my own lift tickets', '自行购票'),
          none: words('Not skiing', '不滑雪'),
        }, {
          branches: { assist: 'equipment', ikon: 'equipment', self: 'equipment', none: 'sign' },
          help: words('Four-day ticket budget: ' + skiBudget + '/person. Ikon access is subject to pass terms.',
            '四天雪票参考预算 ' + skiBudget + '/人。Ikon 能否使用以通行证条款为准。'),
        }),
      ], undefined, words('Jan 2–6 · 4 nights', '1月2–6日 · 4晚')),
      section('equipment', words('Ski or snowboard equipment', '滑雪装备'), [
        radio('equipment', words('What equipment help do you need?', '你需要协助安排雪具吗？'), {
          own: words('I have my own equipment', '自带雪具'),
          rent: words('Help renting equipment', '希望协助租借装备'),
          self: words('I’ll arrange equipment myself', '自行安排雪具'),
          none: words('I’ll decide later', '稍后决定'),
        }, { help: words('Estimated four-day rental: ' + gearBudget + '/person.', '四天雪具租赁参考预算 ' + gearBudget + '/人。') }),
      ], 'sign'),
      section('sign', words('Payment and electronic signature', '付款与电子签署'), [
        text('transferAmount', words('Amount already sent by e-Transfer (CAD)', '已转账金额（CAD）'), { required: false, validation: 'positive' }),
        text('transferPayer', words('Sender’s name as shown on the e-Transfer', '转账显示的付款人姓名'), { required: false }),
        note(words(policy.waiverVersion, 'UTETC 一般活动免责声明 v1.0'),
          WAIVER_URL + '\n' + words('Read the entire waiver. Section 5 includes a release for ordinary negligence within the limits of applicable law.',
            '请阅读免责声明全文。第 5 节包含在适用法律允许范围内对普通过失的责任免除。')),
        note(words(policy.riskVersion, '魁北克跨年之旅行程风险确认 v1.0'), translate(policy.risk)),
        { type: 'checkbox', key: 'consent', title: words('Adult consent', '成人确认'), options: [translate(policy.adultConsent)], required: true },
        text('signature', words('Electronic signature · full legal name', '电子签名 · 完整法定姓名'), {
          validation: 'signature', help: words('Type your own legal name to sign both documents.', '请填写本人的完整法定姓名，签署上述两份文件。'),
        }),
      ], 'submit', terms),
    ],
  };
}

export function createGoogleFormSpec() {
  const localized = { en: localizedForm('en'), zh: localizedForm('zh') };
  return {
    title: 'UTETC · Québec New Year Escape 2027',
    description: 'Dec 30, 2026 – Jan 6, 2027',
    language: radio('language', 'Language / 语言', languageOptions, { branches: { en: 'contact', zh: 'contact' } }),
    confirmation: 'Answer copy sent to your submitted email after processing. / 处理后会将答复副本发至你填写的邮箱。',
    closesAt: REGISTRATION_CLOSES_AT,
    localized,
    metadata: [
      ['General waiver / 一般活动免责声明', policy.waiverVersion + ' · ' + WAIVER_URL],
      ['Trip risk acknowledgement / 行程风险确认', policy.riskVersion + '\n' + policy.risk.join('\n')],
      ['Signing statement / 签署声明', policy.adultConsent.join('\n')],
      ['Registration cutoff / 报名截止', REGISTRATION_CLOSES_AT],
      ['Pricing version / 价格版本', PRICING_VERSION],
      ['Payment terms / 费用及退款政策', localized.en.terms + '\n\n' + localized.zh.terms],
    ],
  };
}

export async function buildGoogleFormSource() {
  const template = await readFile(new URL('google-form-source.gs', import.meta.url), 'utf8');
  const data = JSON.stringify(createGoogleFormSpec());
  const packed = gzipSync(data).toString('base64');
  const revision = createHash('sha256').update(data).update(template).digest('hex').slice(0, 16);
  return 'const QUEBEC_FORM_REVISION = ' + JSON.stringify(revision) + ';\nconst QUEBEC_FORM_DATA = ' +
    JSON.stringify(packed) + ';\n\n' + template;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.stdout.write(await buildGoogleFormSource());
}
