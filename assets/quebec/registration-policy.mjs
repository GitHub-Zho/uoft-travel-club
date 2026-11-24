export const CLUB_EMAIL = 'uoft.travelclub@gmail.com';
export const REGISTRATION_CLOSES_AT = '2026-12-20T00:00:00-05:00';
export const WAIVER_PATH = '/output/pdf/general-club-participation-waiver.pdf';
export const WAIVER_URL = 'https://uoft-travel-club.vercel.app' + WAIVER_PATH;
export const TRANSFER_REFERENCE = 'UTETC QC27 - Full Legal Name';

export const REGISTRATION_POLICY = {
  deadline: [
    'Register by December 19, 2026 at 11:59 p.m. Toronto time.',
    '请于多伦多时间 2026 年 12 月 19 日晚上 11:59 前报名。',
  ],
  deposit: [
    'Once UTETC confirms your accommodation, send the full lodging amount by Interac e-Transfer to ' + CLUB_EMAIL + '. The deposit covers lodging only. The club fee, airfare and optional activities are separate.',
    'UTETC 确认住宿后，请通过 Interac e-Transfer 将全额住宿费转至 ' + CLUB_EMAIL + '。定金仅包含住宿，活动费、机票和自选项目另付。',
  ],
  refund: [
    'Request a full refund of your lodging deposit by emailing the club within 72 hours after sending your e-Transfer.',
    '如需退还全额住宿定金，请在转账后 72 小时内发邮件联系俱乐部。',
  ],
  transferMessage: [
    'Use this transfer message, replacing Full Legal Name with the name on your registration: ' + TRANSFER_REFERENCE + '.',
    '请在转账备注填写「UTETC QC27 - 法定姓名」，姓名与报名表一致。',
  ],
  paymentVerification: [
    'If you have already paid following the club’s instructions, you can report the amount and sender’s name in the form. If you pay later, reply to the club with the same details. The club verifies receipt separately.',
    '如已按俱乐部指引付款，可在报名表填写金额和付款人姓名。之后付款也可回复俱乐部，提供同样资料。俱乐部会另行核实到账。',
  ],
  flights: [
    'UTETC aims to book assisted flights by around December 20, 2026, subject to fares and availability. We’ll confirm the itinerary and fare with you before booking.',
    'UTETC 计划在 2026 年 12 月 20 日左右前完成协助购票，视航班和票价而定。购票前会与你确认行程和价格。',
  ],
  followUp: [
    'UTETC will contact you within seven days after confirming your registration and, if applicable, verifying your lodging deposit.',
    'UTETC 确认报名后（如需住宿，还会核实定金），会在七天内联系你。',
  ],
  waiverVersion: 'General Club Participation Waiver v1.0',
  riskVersion: 'Québec New Year Escape 2027 – Trip Risk Acknowledgement v1.0',
  risk: [
    'December 30, 2026 to January 6, 2027 in Québec City and Charlevoix. Winter roads, icy stairs and paths, crowds, cold and reduced visibility may cause falls, collisions, delays or delayed assistance. Optional skiing, snowboarding, sledding, dog sledding and snowshoeing may involve falls or collisions, changing terrain, cold exposure and equipment risks. Accommodation and transport involve shared spaces, winter travel and third-party services. Follow operator briefings and equipment requirements, choose activities suited to your skills, and consider your own travel and medical insurance. Independent drivers, carriers, lodging and activity operators manage their own services and may require separate agreements.',
    '行程为 2026 年 12 月 30 日至 2027 年 1 月 6 日，前往魁北克城和 Charlevoix。冬季道路、结冰阶梯及步道、人群、寒冷与能见度下降可能导致摔倒、碰撞、行程延误或救援延迟。可选滑雪、雪橇、狗拉雪橇及雪鞋徒步涉及摔倒、碰撞、地形变化、低温和装备风险。住宿及交通涉及共用空间、冬季出行和第三方服务。请遵守运营方的安全说明与装备要求，按个人能力选择项目，并考虑自行安排旅行和医疗保险。司机、承运方、住宿方和活动运营方独立提供各自服务，可能要求签署各自的协议。',
  ],
  adultConsent: [
    'I am 18 or older. I have read the full UTETC General Club Participation Waiver v1.0, including Section 5, and this trip risk acknowledgement. I understand the risks, had an opportunity to ask questions, and voluntarily agree. I consent to signing electronically.',
    '我已满 18 周岁，已阅读 UTETC《一般活动免责声明》v1.0 全文（包括第 5 节）和本行程风险确认。我了解相关风险，已获提问机会，自愿同意，并同意电子签署。',
  ],
};
