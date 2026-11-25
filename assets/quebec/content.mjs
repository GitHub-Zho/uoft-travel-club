export const TRIP = {
  title: ['Québec New Year Escape 2027', '魁北克跨年之旅 2027'],
  theme: ['Count down to 2027 in Old Québec, then spend a few winter days in Charlevoix with the club.', '和社团一起在魁北克老城迎接 2027 年，再去 Charlevoix 滑雪、住木屋。'],
  hero: 'castle-icy',
  heroLocation: ['Château Frontenac · Old Québec', '芳堤娜城堡 · 魁北克老城'],
  dates: ['December 30, 2026 – January 6, 2027', '2026年12月30日 – 2027年1月6日'],
  duration: ['8 days · 7 nights', '8 天 · 7 晚'],
  parts: {
    city: {
      letter: 'A', title: ['Québec City & New Year’s Eve', '魁北克城与跨年夜'],
      dates: ['Dec 30 – Jan 2', '12月30日 – 1月2日'], photo: 'old-quebec',
      blurb: ['Wander through Petit-Champlain, see Château Frontenac light up and head to Grande Allée together for the outdoor countdown.', '在小香普兰街随意走走，看芳堤娜城堡亮灯，再一起去 Grande Allée 户外倒数跨年。'],
    },
    chalet: {
      letter: 'B', title: ['Le Massif Ski & Chalet Getaway', 'Le Massif 滑雪与木屋之旅'],
      dates: ['Jan 2 – Jan 6', '1月2日 – 1月6日'], photo: 'ski-massif-runners',
      blurb: ['Ski above the St. Lawrence, take a snowshoe walk or explore Baie-Saint-Paul. After a day outdoors, get together for dinner near Le Massif.', '可以俯瞰圣劳伦斯河滑雪、穿雪鞋散步，或去 Baie-Saint-Paul 逛逛。白天玩雪，晚上在 Le Massif 附近一起吃饭。'],
    },
  },
};

export const GOBLIN_STOPS = [
  {
    photo: 'goblin-red-door',
    title: ['The red door', '《鬼怪》红门'],
    copy: ['The portal to Québec in the series is beside Théâtre Petit Champlain at 68 Rue du Petit-Champlain.', '剧中通往魁北克的入口就在小香普兰剧院旁，地址是 Rue du Petit-Champlain 68 号。'],
    source: 'https://www.theatrepetitchamplain.com/pages/english',
    sourceLabel: ['Find the original door', '查看原版红门位置'],
  },
  {
    photo: 'goblin-breakneck-blue-hour',
    title: ['Breakneck Stairs', '断颈阶梯'],
    copy: ['Look down over Petit-Champlain’s glowing shopfronts from the stairs between the upper and lower town.', '从连接上下城区的阶梯俯瞰小香普兰街亮灯的店铺。'],
  },
  {
    photo: 'castle-blue-hour',
    title: ['Château Frontenac', '芳堤娜城堡'],
    copy: ['Goblin filmed inside the château. At dusk, see its lights from Dufferin Terrace overlooking the St. Lawrence.', '《鬼怪》曾在城堡内取景。傍晚可在达弗林平台看城堡亮灯和圣劳伦斯河。'],
  },
];

export const DAYS = {
  city: [
    [['Dec 30', '12月30日'], ['Arrive in Québec City', '抵达魁北克城'], ['Plan for an afternoon departure from Toronto, then check in and find dinner.', '计划下午从多伦多出发，抵达后入住、吃晚饭。']],
    [['Dec 31', '12月31日'], ['Old Québec & the countdown', '逛老城、倒数跨年'], ['Walk the old town during the day and join the Grande Allée celebrations that evening.', '白天步行游览老城，晚上到 Grande Allée 一带参加跨年活动。']],
    [['Jan 1', '1月1日'], ['A day at your own pace', '自由安排新年第一天'], ['Choose the Ice Hotel, snow tubing, a museum, a spa or a slow day in town.', '可以选冰雪酒店、雪圈、博物馆、温泉，或留在城里休息。']],
    [['Jan 2', '1月2日'], ['Check out', '退房'], ['Head home or continue to Charlevoix for Plan B.', '按各自行程返程，或继续参加 B 段前往 Charlevoix。']],
  ],
  chalet: [
    [['Jan 2–5', '1月2–5日'], ['Ski, explore or stay in', '滑雪、出游或在木屋休息'], ['Pick up cars and transfer on January 2, with time for a first ski run if logistics allow. Choose your own ski days or winter outings through January 5.', '1月2日取车转场，时间允许可以先滑一会儿。到1月5日可自由安排滑雪或其他冬日活动。']],
    [['Jan 6', '1月6日'], ['Check out and return', '退房返程'], ['Return shared cars if applicable. Allow extra time for winter roads before your flight.', '如有租车，请安排还车。飞行前请为冬季路况预留时间。']],
  ],
};

export const EXPERIENCES = {
  citywalk: {
    title: ['Old Québec & the Goblin walk', '魁北克老城与《鬼怪》取景地'],
    photo: 'goblin',
    copy: ['Explore Petit-Champlain, the Breakneck Stairs and Dufferin Terrace. The red door is by Théâtre Petit Champlain at 68 Rue du Petit-Champlain.', '步行游览小香普兰街、断颈阶梯和达弗林平台。经典红门在小香普兰剧院旁，地址为 Rue du Petit-Champlain 68 号。'],
    note: ['Self-guided walk. Food and local transport are extra.', '自由步行，餐饮和当地交通另计。'],
  },
  nye: {
    title: ['New Year’s Eve countdown', '跨年夜倒数'],
    photo: 'nye',
    copy: ['Join the December 31 outdoor celebrations around Grande Allée and Parliament Hill. The countdown is part of the year-end Kaléidoscopes programme.', '12月31日晚到 Grande Allée 与议会山一带参加户外跨年活动。倒数活动属于 Kaléidoscopes 年末庆典。'],
    note: ['Outdoor programme is subject to final scheduling and weather. Arrange your return to the hotel.', '户外节目以最终日程和天气为准。请提前安排返回酒店的交通。'],
  },
  ski: {
    title: ['Le Massif skiing & snowboarding', 'Le Massif 双板与单板滑雪'],
    photo: 'ski-massif-river',
    copy: ['Ski or ride above the St. Lawrence River. January 2–5 are potential ski days, with a shorter January 2 depending on travel.', '在俯瞰圣劳伦斯河的雪道滑双板或单板。1月2–5日可自由选择滑雪，首日可能因转场而缩短。'],
    note: ['Four-day lift-ticket budget. Check date-specific tickets, remaining Ikon access and gear separately. Beginners can arrange lessons with the resort.', '价格为四天雪票预算。请分别确认指定日期雪票、Ikon 剩余可用天数和雪具。初学者可自行向雪场预约课程。'],
  },
  ice: {
    title: ['Hôtel de Glace', '冰雪酒店'],
    photo: 'ice-hotel',
    copy: ['See the ice rooms and sculptures at Valcartier. Opening depends on weather.', '在 Valcartier 看冰雕与冰雪客房，开放时间视天气而定。'],
    note: ['Online / on-site day admission, guests 52 in. and taller. Tax extra.', '适用于身高 52 英寸及以上游客的线上／现场日票，税费另计。'],
  },
  tubing: {
    title: ['Valcartier Winter Playground', 'Valcartier 冬季乐园'],
    copy: ['Try the snow tubes and winter slides. Check holiday hours and combo tickets.', '试试雪圈和冬季滑道，出发前查看节日营业时间和联票。'],
    note: ['Online / on-site day admission, guests 52 in. and taller. Tax extra.', '适用于身高 52 英寸及以上游客的线上／现场日票，税费另计。'],
  },
  luge: {
    title: ['Le Massif wooden sledding', 'Le Massif 山地木制雪橇'],
    copy: ['Ride a wooden sled down a 7.5 km trail. Ages 10+, with a ski or snowboard helmet.', '乘木制雪橇滑下 7.5 公里雪道。限 10 岁及以上，须佩戴滑雪头盔。'],
    note: ['Age 10+. Ski or snowboard helmet required. Reserve ahead. Trail opening depends on snow conditions.', '限 10 岁及以上，须佩戴双板或单板滑雪头盔。请提前预约，雪道开放视积雪情况而定。'],
  },
  dog: {
    title: ['Les Secrets Nordiques dog sledding', 'Les Secrets Nordiques 狗拉雪橇'],
    plannedDate: ['January 4', '1月4日'],
    photo: 'dogsled',
    copy: ['Take turns driving a dog team on a guided two-hour DUO outing near Beaupré.', '在 Beaupré 附近参加约两小时的 DUO 体验，两人轮流驾驶狗拉雪橇。'],
    note: ['The outing is subject to operator availability and weather.', '活动场次以运营方可订情况和天气为准。'],
  },
  snowshoe: {
    title: ['Snowshoeing & winter walks', '雪鞋徒步与冬日散步'],
    copy: ['Choose a scenic route that suits snow and trail conditions. Bring your own snowshoes or check local rentals.', '按积雪和步道状况选择路线。请自备雪鞋，或查询当地租借选项。'],
    note: ['Free self-guided where access and equipment are available. Rentals or guides require a quote.', '在步道开放并自备装备的情况下可免费自行游玩。租装备或向导需另询价。'],
  },
  baie: {
    title: ['Baie-Saint-Paul', 'Baie-Saint-Paul 小镇'],
    photo: 'baie',
    copy: ['Take a relaxed outing to the galleries, cafés and streets of Baie-Saint-Paul.', '去 Baie-Saint-Paul 小镇逛画廊、咖啡馆和街道，轻松度过半天。'],
    note: ['Free walk. Food and paid admissions are extra.', '自由步行，餐饮和收费场馆另计。'],
  },
  spa: {
    title: ['Thermal spa', '温泉水疗'],
    copy: ['Take a slower winter day with a thermal spa visit in the city or Beaupré.', '可以在魁北克城或 Beaupré 安排温泉水疗，放松半天。'],
    note: ['Planning range. Venue, opening hours and reservations depend on your itinerary.', '价格为预算区间。地点、开放时间和预约按各自行程确认。'],
  },
};

export const LODGING = {
  city: {
    title: ['Hôtel & Suites Le Dauphin Québec', 'Hôtel & Suites Le Dauphin Québec'],
    photos: ['hotel-room', 'hotel-breakfast', 'hotel-pool'],
    area: ['Québec City · 400 rue du Marais', '魁北克城 · 400 rue du Marais'],
    highlights: [['Buffet breakfast included', '含自助早餐'], ['Indoor pool', '室内泳池'], ['In-room Wi-Fi', '客房 Wi-Fi']],
    copy: ['Start the day with a hot-and-cold breakfast buffet. The hotel is outside Old Québec, so plan your ride back after the midnight countdown.', '早上吃一顿冷热自助早餐再出门。酒店位于老城外，跨年倒数结束后请提前安排返程交通。'],
    inventory: ['A two-queen room type is listed for up to four guests. Group inventory and exact room types will be confirmed by the club.', '酒店有最多可住四人的双 Queen 床房型。实际团体房量和房型由俱乐部确认。'],
  },
  chalet: {
    title: ['Chalet near Le Massif', 'Le Massif 雪场附近民宿'],
    photos: ['refuge-living', 'refuge-kitchen', 'refuge-bedroom', 'refuge-terrace'],
    area: ['Charlevoix · Property pending', 'Charlevoix · 房源待定'],
    highlights: [['Chalet style', '木屋风格'], ['Shared gathering space', '公共活动空间'], ['Kitchen & BBQ preferred', '优先考虑厨房和 BBQ']],
    photoNote: ['Reference photos show the chalet style we’re looking for.', '图片仅供参考，展示我们在寻找的木屋风格。'],
    copy: ['We’re looking for a wood-style chalet with a common area for the group. We’re aiming for a kitchen and BBQ, subject to the selected property and its winter rules.', '我们计划选一间带公共活动空间的木屋风格民宿，方便大家一起吃饭聊天。预计会考虑带厨房和 BBQ 的房源，具体以选定房源及冬季使用规定为准。'],
    inventory: ['The property, amenities and bed layout are pending confirmation.', '实际房源、设施和床位安排待确认。'],
  },
};
