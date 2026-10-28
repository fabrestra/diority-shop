import type { Product, ProductInput, Category, Warranty, Requirement } from "@/types/product";

/**
 * ЦЕНООБРАЗОВАНИЕ — вся математика в трёх константах ниже.
 * Рублёвые цены НЕ хранятся в данных: они считаются из priceUsd при сборке.
 * Меняется курс — правишь одно число, весь каталог пересчитывается сам.
 */

/** Сколько рублей реально стоит добыть $1 (закупка, со всеми комиссиями). */
export const USD_COST_RATE = 86.10;

/**
 * Наценка по ступеням себестоимости.
 * На дешёвых позициях процент выше: возня с заказом одинаковая,
 * а 9% от 90 ₽ — это 8 ₽, ради которых нет смысла работать.
 * Работают только там, где нет наценки по категории (CATEGORY_MARKUP).
 * Потолок держим на 18%: выше — цена перестаёт быть аргументом.
 */
export const MARKUP_TIERS: ReadonlyArray<readonly [number, number]> = [
  [300, 0.16],      // до 300 ₽ себестоимости  → +16%
  [1000, 0.135],    // 300–1000 ₽              → +13,5%
  [3000, 0.115],    // 1000–3000 ₽             → +11,5%
  [10000, 0.10],    // 3000–10000 ₽            → +10%
  [Infinity, 0.09], // дороже 10000 ₽          → +9%
];

const markupFor = (cost: number) =>
  MARKUP_TIERS.find(([limit]) => cost < limit)![1];

/**
 * Округление до круглого вида — цена заканчивается на 0 или 5.
 * Округляем к ближайшему, а не всегда вверх: иначе наценка ползёт
 * вверх на мелких позициях и средние 12% превращаются в 14%.
 * 537 → 540, 1918 → 1900, 18748 → 18700.
 */
const toRetail = (n: number) => {
  const step = n < 1000 ? 10 : n < 10000 ? 50 : 100;
  return Math.round(n / step) * step;
};

/**
 * Наценка по категориям. Перекрывает ступени, но уступает
 * индивидуальной наценке позиции.
 * AI и Supercell держим на 15%: спрос стабильный, сравнивают редко.
 */
export const CATEGORY_MARKUP: Record<string, number> = {
  manus: 0.15,
  opencode: 0.15,
  "character-ai": 0.15,
  higgsfield: 0.15,
  tripo: 0.15,
  meshy: 0.15,
  picsart: 0.15,
  coursera: 0.15,
  busuu: 0.15,
  quizlet: 0.15,
  zoom: 0.15,
  chatgpt: 0.15,
  claude: 0.15,
  perplexity: 0.15,
  grok: 0.15,
  cursor: 0.15,
  google: 0.15,
  "brawl-stars": 0.15,
  "clash-royale": 0.15,
  "clash-of-clans": 0.15,
};

/**
 * Себестоимость и розница по долларовой цене.
 * Приоритет наценки: своя у позиции, затем по категории, затем ступень.
 * `override` нужен там, где рынок диктует свой потолок — например
 * пополнение Steam держит 3–12% над номиналом, больше не берут.
 */
export const priceOf = (priceUsd: number, override?: number, categorySlug?: string) => {
  const costRub = Math.round(priceUsd * USD_COST_RATE);
  const markup =
    override ?? CATEGORY_MARKUP[categorySlug ?? ""] ?? markupFor(costRub);
  const priceRub = toRetail(costRub * (1 + markup));
  return { costRub, priceRub, marginRub: priceRub - costRub };
};


/**
 * ЧТО НУЖНО ОТ ПОКУПАТЕЛЯ.
 * Вместо служебных пометок вроде «США / Codashop» человек должен видеть
 * понятное: что именно у него попросят и почему.
 */
export const REQUIREMENTS: Record<string, Requirement> = {
  account: {
    title: "Что нужно для оформления",
    text: "Сначала напишите название тарифа и страну аккаунта — проверим совместимость и срок до оплаты. Для ручного оформления может понадобиться согласованный вход в аккаунт. Не отправляйте пароль или коды входа в первом сообщении. После выполнения смените пароль.",
  },
  appleUs: {
    title: "Что нужно для оформления",
    text: "Apple Account с регионом США. Код другой страны не подойдёт. До оплаты проверьте регион аккаунта; доступ к аккаунту и пароль продавцу не нужны.",
  },
  steam: {
    title: "Что нужно для оформления",
    text: "Ссылка на ваш профиль Steam или логин аккаунта. Пароль не нужен, пополнение приходит на счёт кошелька.",
  },
  gameTag: {
    title: "Что нужно для оформления",
    text: "Игровой тег вашего аккаунта. Он показан в профиле внутри игры и выглядит как #ABC123. Пароль не нужен.",
  },
  robloxNick: {
    title: "Что нужно для оформления",
    text: "Ваш никнейм в Roblox. Пароль не нужен, робуксы приходят на аккаунт.",
  },
  msAccount: {
    title: "Что нужно для оформления",
    text: "Логин учётной записи Microsoft, на которую оформляем покупку.",
  },
  rockstar: {
    title: "Что нужно для оформления",
    text: "Логин аккаунта Rockstar Games Social Club.",
  },
  telegramUser: {
    title: "Что нужно для оформления",
    text: "Ваш ник в Telegram, начинается с собачки. Подписка приходит на этот аккаунт.",
  },
  pubgId: {
    title: "Что нужно для оформления",
    text: "ID игрока PUBG Mobile — число в профиле игры. Пополнение приходит по ID, вход в аккаунт и пароль не нужны.",
  },
  genshinUid: {
    title: "Что нужно для оформления",
    text: "UID и сервер Genshin Impact (глобальная версия: Америка, Европа, Азия или TW/HK/MO). UID показан в углу экрана в игре. Пароль не нужен.",
  },
  freefireId: {
    title: "Что нужно для оформления",
    text: "ID игрока Free Fire из профиля. Аккаунт должен быть региона СНГ. Пароль не нужен.",
  },
  mlbbId: {
    title: "Что нужно для оформления",
    text: "ID игрока и Server ID Mobile Legends из профиля, например 12345678 (1234). Аккаунт должен быть региона RU. Пароль не нужен.",
  },
  student: {
    title: "Что нужно для оформления",
    text: "Студенческая почта учебного заведения. Сервис проверяет её самостоятельно, без подтверждения тариф оформить нельзя.",
  },
};

/** Какие требования у категории */
export const CATEGORY_REQUIREMENT: Record<string, keyof typeof REQUIREMENTS> = {
  manus: "account",
  opencode: "account",
  "character-ai": "account",
  higgsfield: "account",
  tripo: "account",
  meshy: "account",
  picsart: "account",
  coursera: "account",
  busuu: "account",
  quizlet: "account",
  zoom: "account",
  chatgpt: "account",
  claude: "account",
  perplexity: "account",
  grok: "account",
  cursor: "account",
  google: "account",
  netflix: "account",
  spotify: "account",
  discord: "account",
  telegram: "telegramUser",
  apple: "appleUs",
  steam: "steam",
  "brawl-stars": "gameTag",
  "clash-royale": "gameTag",
  "clash-of-clans": "gameTag",
  roblox: "robloxNick",
  "pubg-mobile": "pubgId",
  "genshin-impact": "genshinUid",
  "free-fire": "freefireId",
  "mobile-legends": "mlbbId",
  "microsoft-store": "msAccount",
  rockstar: "rockstar",
};

/** Требования для конкретной позиции */
export const requirementFor = (p: { categorySlug: string; slug: string }) =>
  p.slug.includes("education") || p.slug.includes("student")
    ? REQUIREMENTS.student
    : REQUIREMENTS[CATEGORY_REQUIREMENT[p.categorySlug] ?? "account"];

/**
 * ГАРАНТИИ ПО ТИПУ ТОВАРА.
 * Разные товары ломаются по-разному, поэтому единой гарантии быть не может.
 * Формулировки намеренно узкие: обещаем только то, что реально можем сделать,
 * и прямо называем случаи, которые не покрываем.
 */
export const WARRANTY: Record<string, Warranty> = {
  /** Подписки, которые оформляются на аккаунт покупателя */
  subscription: {
    label: "24 часа",
    covers:
      "Если в течение суток после выдачи подписка не активировалась или доступ пропал не по вине покупателя, восстанавливаем её или оформляем заново.",
    excludes:
      "Не покрываем блокировку аккаунта покупателя, смену пароля, вход с других устройств и отмену подписки самим покупателем.",
  },
  /** Подарочные карты и коды пополнения */
  code: {
    label: "до активации",
    covers:
      "Код проверяется перед выдачей. Если он оказался использован или недействителен при первом вводе, заменяем на рабочий.",
    excludes:
      "После успешного ввода кода в аккаунт возврат и замена невозможны. Несовпадение региона аккаунта с регионом карты остаётся на стороне покупателя: условия по региону мы сообщаем до оплаты.",
  },
  /** Игровая валюта и пассы */
  ingame: {
    label: "до зачисления",
    covers:
      "Гарантия действует до момента зачисления. Если валюта или пасс не пришли на указанный аккаунт, доводим заказ до зачисления либо возвращаем деньги.",
    excludes:
      "Не покрываем неверно указанный игровой тег или ID, блокировку игрового аккаунта и претензии после подтверждения зачисления.",
  },
  /** Позиции под заказ */
  none: {
    label: "по договорённости",
    covers:
      "Условия по таким позициям обсуждаются индивидуально до оплаты и фиксируются в переписке.",
    excludes: "Без предварительной договорённости заказ не оформляется.",
  },
};

/** Какая гарантия действует для категории */
export const CATEGORY_WARRANTY: Record<string, keyof typeof WARRANTY> = {
  suno: "subscription",
  midjourney: "subscription",
  manus: "subscription",
  opencode: "subscription",
  "character-ai": "subscription",
  higgsfield: "subscription",
  tripo: "subscription",
  meshy: "subscription",
  picsart: "subscription",
  coursera: "subscription",
  busuu: "subscription",
  quizlet: "subscription",
  zoom: "subscription",
  chatgpt: "subscription",
  claude: "subscription",
  perplexity: "subscription",
  grok: "subscription",
  cursor: "subscription",
  google: "subscription",
  netflix: "subscription",
  spotify: "subscription",
  discord: "subscription",
  telegram: "subscription",
  "microsoft-store": "code",
  apple: "code",
  steam: "code",
  rockstar: "code",
  "brawl-stars": "ingame",
  "clash-royale": "ingame",
  "clash-of-clans": "ingame",
  roblox: "ingame",
  "pubg-mobile": "ingame",
  "genshin-impact": "ingame",
  "free-fire": "ingame",
  "mobile-legends": "ingame",
};

/** Гарантия для конкретной позиции. Под заказ — всегда индивидуально. */
export const warrantyFor = (p: { categorySlug: string; status: string }) =>
  p.status !== "Активна"
    ? WARRANTY.none
    : WARRANTY[CATEGORY_WARRANTY[p.categorySlug] ?? "code"];

export const categories: Category[] = [
  { name: "Suno", slug: "suno", description: "Музыка с AI — подписка Pro" },
  { name: "Midjourney", slug: "midjourney", description: "Создание изображений — подписка Basic" },
  { name: "ChatGPT", slug: "chatgpt", description: "AI ассистент от OpenAI" },
  { name: "Claude", slug: "claude", description: "AI ассистент от Anthropic" },
  { name: "Perplexity", slug: "perplexity", description: "AI поиск нового поколения" },
  { name: "Manus", slug: "manus", description: "AI-агент, который сам выполняет задачи" },
  { name: "OpenCode", slug: "opencode", description: "AI-агент для программирования" },
  { name: "Character.AI", slug: "character-ai", description: "Чаты с AI-персонажами, подписка c.ai+" },
  { name: "Higgsfield", slug: "higgsfield", description: "AI-генерация видео и изображений" },
  { name: "Tripo AI", slug: "tripo", description: "AI-генерация 3D-моделей" },
  { name: "Meshy", slug: "meshy", description: "AI-генерация 3D-моделей и текстур" },
  { name: "Picsart", slug: "picsart", description: "Фото- и видеоредактор с AI" },
  { name: "Coursera", slug: "coursera", description: "Онлайн-курсы и сертификаты" },
  { name: "Busuu", slug: "busuu", description: "Изучение иностранных языков" },
  { name: "Quizlet", slug: "quizlet", description: "Карточки и подготовка к экзаменам" },
  { name: "Zoom", slug: "zoom", description: "Видеовстречи Zoom Workplace" },
  { name: "Grok / X", slug: "grok", description: "AI от xAI (Илон Маск)" },
  { name: "Cursor", slug: "cursor", description: "AI редактор кода" },
  { name: "Google", slug: "google", description: "Gemini AI, Google One, YouTube Premium" },
  { name: "Brawl Stars", slug: "brawl-stars", description: "Гемы и пассы Brawl Stars" },
  { name: "Clash Royale", slug: "clash-royale", description: "Гемы и пассы Clash Royale" },
  { name: "Clash of Clans", slug: "clash-of-clans", description: "Гемы и пассы Clash of Clans" },
  { name: "PUBG Mobile", slug: "pubg-mobile", description: "UC по ID игрока" },
  { name: "Genshin Impact", slug: "genshin-impact", description: "Кристаллы сотворения по UID" },
  { name: "Free Fire", slug: "free-fire", description: "Алмазы по ID, регион СНГ" },
  { name: "Mobile Legends", slug: "mobile-legends", description: "Алмазы по ID, регион RU" },
  { name: "Roblox", slug: "roblox", description: "Робуксы и Roblox Plus" },
  { name: "Steam", slug: "steam", description: "Пополнение и игры Steam" },
  { name: "Microsoft Store", slug: "microsoft-store", description: "Игры и подписки MS" },
  { name: "Discord", slug: "discord", description: "Discord Nitro" },
  { name: "Netflix", slug: "netflix", description: "Стриминг Netflix" },
  { name: "Telegram", slug: "telegram", description: "Premium и Stars" },
  { name: "Rockstar", slug: "rockstar", description: "GTA+ и игры Rockstar" },
  { name: "Apple", slug: "apple", description: "Подарочные карты App Store и Apple Music" },
];

/**
 * РАЗДЕЛЫ — крупные группы над брендами. Каталог растёт, и ряд из 30 брендов
 * уже не листают: сначала человек выбирает «Нейросети» или «Игры», потом бренд.
 */
export const SECTIONS: { slug: string; name: string; cats: string[] }[] = [
  { slug: "ai", name: "Нейросети", cats: ["suno", "midjourney", "chatgpt", "claude", "perplexity", "grok", "cursor", "google", "manus", "opencode", "character-ai", "higgsfield", "tripo", "meshy"] },
  { slug: "games", name: "Игры и донат", cats: ["pubg-mobile", "genshin-impact", "free-fire", "mobile-legends", "brawl-stars", "clash-royale", "clash-of-clans", "roblox"] },
  { slug: "platforms", name: "Steam и платформы", cats: ["steam", "microsoft-store", "rockstar"] },
  { slug: "media", name: "Музыка и видео", cats: ["netflix", "discord"] },
  { slug: "study", name: "Учёба и работа", cats: ["coursera", "busuu", "quizlet", "zoom", "picsart"] },
  { slug: "tg-apple", name: "Telegram и Apple", cats: ["telegram", "apple"] },
];

const catalog: ProductInput[] = [
  { art: "SUN-PRO", slug: "suno-pro-mesyats", category: "Suno", categorySlug: "suno", platform: "Suno", name: "Suno Pro — месяц", priceUsd: 10, priceRubFixed: 1199, inquiryOnly: true, status: "Активна", note: "2500 кредитов в месяц. Оформление вручную на ваш аккаунт после согласования страны, текущего тарифа и срока. Оплата способом продавца ещё не проверена; сначала напишите в поддержку." },
  { art: "MJ-BASIC", slug: "midjourney-basic-mesyats", category: "Midjourney", categorySlug: "midjourney", platform: "Midjourney", name: "Midjourney Basic — месяц", priceUsd: 10, priceRubFixed: 1199, inquiryOnly: true, status: "Активна", note: "200 минут Fast GPU. Не безлимитный тариф. Оформление вручную на ваш аккаунт после согласования. Оплата способом продавца ещё не проверена; сначала напишите в поддержку." },
  { art: "GPT-GO", slug: "chatgpt-chatgpt-go-mesyats", category: "ChatGPT", categorySlug: "chatgpt", platform: "", name: "ChatGPT Go — месяц", priceUsd: 8, status: "Активна", note: "Дешёвый AI для базового использования" },
  { art: "GPT-PLUS", slug: "chatgpt-chatgpt-plus-mesyats", category: "ChatGPT", categorySlug: "chatgpt", platform: "", name: "ChatGPT Plus — месяц", priceUsd: 20, status: "Активна", note: "Самая популярная позиция" },
  { art: "GPT-PRO100", slug: "chatgpt-chatgpt-pro-usd100-mesyats", category: "ChatGPT", categorySlug: "chatgpt", platform: "", name: "ChatGPT Pro $100 — месяц", priceUsd: 100, status: "Активна", note: "Расширенные лимиты и доступ к продвинутым моделям" },
  { art: "GPT-PRO200", slug: "chatgpt-chatgpt-pro-usd200-mesyats", category: "ChatGPT", categorySlug: "chatgpt", platform: "", name: "ChatGPT Pro $200 — месяц", priceUsd: 200, status: "Активна", note: "Максимальные лимиты, для больших задач" },
  { art: "CLD-PRO", slug: "claude-claude-pro-mesyats", category: "Claude", categorySlug: "claude", platform: "", name: "Claude Pro — месяц", priceUsd: 20, status: "Активна", note: "Стандарт" },
  { art: "CLD-PRO-G", slug: "claude-claude-pro-god", category: "Claude", categorySlug: "claude", platform: "", name: "Claude Pro — год", priceUsd: 200, status: "Активна", note: "Выгоднее помесячной оплаты примерно на 17 процентов" },
  { art: "CLD-MAXX5", slug: "claude-claude-max-5x-mesyats", category: "Claude", categorySlug: "claude", platform: "", name: "Claude Max 5x — месяц", priceUsd: 100, status: "Активна", note: "В пять раз больше лимитов, чем в Pro. Только помесячно" },
  { art: "CLD-MAXX20", slug: "claude-claude-max-20x-mesyats", category: "Claude", categorySlug: "claude", platform: "", name: "Claude Max 20x — месяц", priceUsd: 200, status: "Активна", note: "В двадцать раз больше лимитов, чем в Pro" },
  { art: "PLX-PRO", slug: "perplexity-perplexity-pro-mesyats", category: "Perplexity", categorySlug: "perplexity", platform: "", name: "Perplexity Pro — месяц", priceUsd: 20, status: "Активна", note: "" },
  { art: "PLX-PRO-G", slug: "perplexity-perplexity-pro-god", category: "Perplexity", categorySlug: "perplexity", platform: "", name: "Perplexity Pro — год", priceUsd: 200, status: "Активна", note: "Выгоднее помесячной оплаты примерно на 17 процентов" },
  { art: "PLX-MAX", slug: "perplexity-perplexity-max-mesyats", category: "Perplexity", categorySlug: "perplexity", platform: "", name: "Perplexity Max — месяц", priceUsd: 200, status: "Активна", note: "Доступ сразу к нескольким топовым моделям в одном тарифе" },
  { art: "PLX-EDUCAPRO", slug: "perplexity-perplexity-education-pro-mesyats", category: "Perplexity", categorySlug: "perplexity", platform: "", name: "Perplexity Education Pro — месяц", priceUsd: 10, status: "Активна", note: "Студенческий тариф. Понадобится почта учебного заведения" },
  { art: "MNS-STD", slug: "manus-standard-mesyats", category: "Manus", categorySlug: "manus", platform: "", name: "Manus Standard — месяц", priceUsd: 20, status: "Активна", note: "AI-агент: исследования, сайты, презентации и задачи «под ключ». Оформляем на ваш аккаунт." },
  { art: "MNS-STD-G", slug: "manus-standard-god", category: "Manus", categorySlug: "manus", platform: "", name: "Manus Standard — год", priceUsd: 200, status: "Активна", note: "Выгоднее помесячной оплаты примерно на 17%." },
  { art: "OPC-GO", slug: "opencode-go-mesyats", category: "OpenCode", categorySlug: "opencode", platform: "", name: "OpenCode Go — месяц", priceUsd: 10, status: "Активна", note: "Подписка на модели для AI-агента OpenCode в терминале и редакторе." },
  { art: "CAI-PLUS", slug: "character-ai-c-ai-plus-mesyats", category: "Character.AI", categorySlug: "character-ai", platform: "", name: "c.ai+ — месяц", priceUsd: 9.99, status: "Активна", note: "Ответы без очередей, улучшенная память персонажей. Оформляем на ваш аккаунт." },
  { art: "CAI-PLUS-G", slug: "character-ai-c-ai-plus-god", category: "Character.AI", categorySlug: "character-ai", platform: "", name: "c.ai+ — год", priceUsd: 94.99, status: "Активна", note: "Выгоднее помесячной оплаты примерно на 20%." },
  { art: "HGF-START", slug: "higgsfield-starter-mesyats", category: "Higgsfield", categorySlug: "higgsfield", platform: "", name: "Higgsfield Starter — месяц", priceUsd: 15, status: "Активна", note: "Стартовый тариф: ежемесячные кредиты на генерацию видео и изображений." },
  { art: "HGF-PLUS", slug: "higgsfield-plus-mesyats", category: "Higgsfield", categorySlug: "higgsfield", platform: "", name: "Higgsfield Plus — месяц", priceUsd: 34, status: "Активна", note: "Больше кредитов и доступ к топовым видеомоделям." },
  { art: "TRP-PRO", slug: "tripo-ai-pro-mesyats", category: "Tripo AI", categorySlug: "tripo", platform: "", name: "Tripo AI Pro — месяц", priceUsd: 20, status: "Активна", note: "3000 кредитов в месяц на генерацию 3D-моделей." },
  { art: "MSH-PRO", slug: "meshy-pro-mesyats", category: "Meshy", categorySlug: "meshy", platform: "", name: "Meshy Pro — месяц", priceUsd: 20, status: "Активна", note: "1000 кредитов в месяц на 3D-модели и текстуры." },
  { art: "PCS-PRO", slug: "picsart-pro-mesyats", category: "Picsart", categorySlug: "picsart", platform: "", name: "Picsart Pro — месяц", priceUsd: 15, status: "Активна", note: "Премиум-шаблоны, шрифты и AI-инструменты без водяных знаков." },
  { art: "PCS-PRO-G", slug: "picsart-pro-god", category: "Picsart", categorySlug: "picsart", platform: "", name: "Picsart Pro — год", priceUsd: 126, status: "Активна", note: "Выгоднее помесячной оплаты примерно на 30%." },
  { art: "CRS-PLUS", slug: "coursera-plus-mesyats", category: "Coursera", categorySlug: "coursera", platform: "", name: "Coursera Plus — месяц", priceUsd: 59, status: "Активна", note: "Безлимитный доступ к тысячам курсов и сертификатов." },
  { art: "BSU-PREM", slug: "busuu-premium-mesyats", category: "Busuu", categorySlug: "busuu", platform: "", name: "Busuu Premium — месяц", priceUsd: 13.99, status: "Активна", note: "Все языки и уроки, офлайн-режим." },
  { art: "QZL-PLUS", slug: "quizlet-plus-mesyats", category: "Quizlet", categorySlug: "quizlet", platform: "", name: "Quizlet Plus — месяц", priceUsd: 7.99, status: "Активна", note: "Без рекламы, режим «Заучивание» и тесты без ограничений." },
  { art: "QZL-PLUS-G", slug: "quizlet-plus-god", category: "Quizlet", categorySlug: "quizlet", platform: "", name: "Quizlet Plus — год", priceUsd: 35.99, status: "Активна", note: "Выгоднее помесячной оплаты более чем в 2,5 раза." },
  { art: "ZOM-PRO", slug: "zoom-pro-mesyats", category: "Zoom", categorySlug: "zoom", platform: "", name: "Zoom Pro — месяц", priceUsd: 16.99, status: "Активна", note: "Длинные встречи до 100 участников, облачная запись." },
  { art: "GRK-X", slug: "grok-x-premium-grok-bundled", category: "Grok / X", categorySlug: "grok", platform: "", name: "X Premium (Grok bundled)", priceUsd: 8, status: "Активна", note: "Самый дешёвый доступ к Grok" },
  { art: "GRK-SUPERLITE", slug: "grok-supergrok-lite-mesyats", category: "Grok / X", categorySlug: "grok", platform: "", name: "SuperGrok Lite — месяц", priceUsd: 10, status: "Активна", note: "Базовый Grok без X-перков" },
  { art: "GRK-SUPER", slug: "grok-supergrok-mesyats", category: "Grok / X", categorySlug: "grok", platform: "", name: "SuperGrok — месяц", priceUsd: 30, status: "Активна", note: "" },
  { art: "GRK-SUPER-G", slug: "grok-supergrok-god", category: "Grok / X", categorySlug: "grok", platform: "", name: "SuperGrok — год", priceUsd: 300, status: "Активна", note: "Выгоднее помесячной оплаты примерно на 16 процентов" },
  { art: "GRK-X2", slug: "grok-x-premium-plus-mesyats", category: "Grok / X", categorySlug: "grok", platform: "", name: "X Premium+ — месяц", priceUsd: 40, status: "Активна", note: "X + Grok с большими лимитами" },
  { art: "GRK-SUPERHEAVY", slug: "grok-supergrok-heavy-mesyats", category: "Grok / X", categorySlug: "grok", platform: "", name: "SuperGrok Heavy — месяц", priceUsd: 300, status: "Активна", note: "Топовый тариф" },
  { art: "CUR-PRO", slug: "cursor-cursor-pro-mesyats", category: "Cursor", categorySlug: "cursor", platform: "", name: "Cursor Pro — месяц", priceUsd: 20, status: "Активна", note: "Включает 20 долларов на запросы к моделям" },
  { art: "CUR-PRO-G", slug: "cursor-cursor-pro-god", category: "Cursor", categorySlug: "cursor", platform: "", name: "Cursor Pro — год", priceUsd: 192, status: "Активна", note: "Выгоднее помесячной оплаты на 20 процентов" },
  { art: "CUR-PRO2", slug: "cursor-cursor-pro-plus-mesyats", category: "Cursor", categorySlug: "cursor", platform: "", name: "Cursor Pro+ — месяц", priceUsd: 60, status: "Активна", note: "Втрое больше лимитов, чем в Pro" },
  { art: "CUR-PRO-G2", slug: "cursor-cursor-pro-plus-god", category: "Cursor", categorySlug: "cursor", platform: "", name: "Cursor Pro+ — год", priceUsd: 576, status: "Активна", note: "Годовая оплата, выходит дешевле помесячной" },
  { art: "CUR-ULTRA", slug: "cursor-cursor-ultra-mesyats", category: "Cursor", categorySlug: "cursor", platform: "", name: "Cursor Ultra — месяц", priceUsd: 200, status: "Активна", note: "В двадцать раз больше лимитов, чем в Pro" },
  { art: "GGL-AIPLUS", slug: "google-ai-google-ai-plus-mesyats", category: "Google", categorySlug: "google", platform: "", name: "Google AI Plus — месяц", priceUsd: 7.99, status: "Активна", note: "Дешёвый тариф с Gemini" },
  { art: "GGL-AIPRO", slug: "google-ai-google-ai-pro-mesyats-2-tb", category: "Google", categorySlug: "google", platform: "", name: "Google AI Pro — месяц (2 ТБ)", priceUsd: 19.99, status: "Активна", note: "Gemini 3.1 Pro, 2 ТБ storage" },
  { art: "GGL-AIULTRA", slug: "google-ai-google-ai-ultra-mesyats", category: "Google", categorySlug: "google", platform: "", name: "Google AI Ultra — месяц", priceUsd: 200, status: "Активна", note: "Максимальный тариф Google с доступом ко всем моделям" },
  { art: "BS-PASS", slug: "brawl-stars-brawl-pass", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "Brawl Pass", priceUsd: 8.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-PASS-SK", markup: 0.333, slug: "brawl-stars-brawl-pass-osobaya-skidka", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "Brawl Pass — сниженная цена", priceUsd: 3.49, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-PASSPLUS", slug: "brawl-stars-brawl-pass-plus", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "Brawl Pass Plus", priceUsd: 12.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-PASSUPGRA", slug: "brawl-stars-brawl-pass-upgrade-pass-plus", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "Brawl Pass Upgrade (Pass → Plus)", priceUsd: 4.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-PROPASS", slug: "brawl-stars-pro-pass", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "Pro Pass", priceUsd: 24.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-PROPASS-SK", slug: "brawl-stars-pro-pass-osobaya-skidka", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "Pro Pass — сниженная цена", priceUsd: 12.49, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-GEMS30", slug: "brawl-stars-30-gems", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "30 Gems", priceUsd: 1.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-GEMS80", slug: "brawl-stars-80-gems", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "80 Gems", priceUsd: 4.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-GEMS170", slug: "brawl-stars-170-gems", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "170 Gems", priceUsd: 9.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-GEMS360", slug: "brawl-stars-360-gems", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "360 Gems", priceUsd: 19.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-GEMS950", slug: "brawl-stars-950-gems", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "950 Gems", priceUsd: 49.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "BS-GEMS2000", slug: "brawl-stars-2000-gems", category: "Brawl Stars", categorySlug: "brawl-stars", platform: "iOS/Android", name: "2000 Gems", priceUsd: 99.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-PASS", slug: "clash-royale-pass-royale", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "Pass Royale", priceUsd: 4.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-PASS-SK", slug: "clash-royale-pass-royale-osobaya-skidka", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "Pass Royale — сниженная цена", priceUsd: 1.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-DIAMOPASS", slug: "clash-royale-diamond-pass", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "Diamond Pass", priceUsd: 9.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-GEMS80", slug: "clash-royale-80-gems", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "80 Gems", priceUsd: 0.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-GEMS500", slug: "clash-royale-500-gems", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "500 Gems", priceUsd: 4.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-GEMS1200", slug: "clash-royale-1200-gems", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "1200 Gems", priceUsd: 9.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-GEMS2500", slug: "clash-royale-2500-gems", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "2500 Gems", priceUsd: 19.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-GEMS6500", slug: "clash-royale-6500-gems", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "6500 Gems", priceUsd: 49.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-GEMS10000", slug: "clash-royale-10000-gems", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "10000 Gems", priceUsd: 69.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-GEMS14000", slug: "clash-royale-14000-gems", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "14000 Gems", priceUsd: 99.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-EVO3", slug: "clash-royale-evolyutsiya-3-oskolka", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "Эволюция: 3 осколка", priceUsd: 9.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "CR-EVO6", slug: "clash-royale-evolyutsiya-6-oskolkov-polnaya", category: "Clash Royale", categorySlug: "clash-royale", platform: "iOS/Android", name: "Эволюция: 6 осколков (полная)", priceUsd: 19.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-GOLDPASS", slug: "clash-of-clans-gold-pass", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "Gold Pass", priceUsd: 6.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-GOLDPASS-SK", slug: "clash-of-clans-gold-pass-osobaya-skidka", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "Gold Pass — сниженная цена", priceUsd: 2.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-STARTPASS", slug: "clash-of-clans-starter-pass-nachalnyy", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "Starter Pass (начальный)", priceUsd: 4.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-GEMS80", slug: "clash-of-clans-80-gems", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "80 Gems", priceUsd: 0.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-GEMS500", slug: "clash-of-clans-500-gems", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "500 Gems", priceUsd: 4.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-GEMS1200", slug: "clash-of-clans-1200-gems", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "1200 Gems", priceUsd: 9.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-GEMS2500", slug: "clash-of-clans-2500-gems", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "2500 Gems", priceUsd: 19.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-GEMS6500", slug: "clash-of-clans-6500-gems", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "6500 Gems", priceUsd: 49.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-GEMS10000", slug: "clash-of-clans-10000-gems", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "10000 Gems", priceUsd: 69.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-GEMS14000", slug: "clash-of-clans-14000-gems", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "14000 Gems", priceUsd: 99.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-SET", slug: "clash-of-clans-nabor-stroitelya", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "Набор Строителя", priceUsd: 9.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  { art: "COC-RESOUBUNDL", slug: "clash-of-clans-resource-bundle-standart", category: "Clash of Clans", categorySlug: "clash-of-clans", platform: "iOS/Android", name: "Resource Bundle (стандарт)", priceUsd: 4.99, status: "Активна", note: "Покупка совершается во внутриигровом магазине на вашем аккаунте: нужен временный вход по одноразовому коду Supercell ID, пароль не передаётся" },
  // ── Пополнения по ID игрока (21.10). Цена = сумма товара в Tribute (priceRubFixed).
  // priceUsd: 0 — намеренно: этот файл целиком попадает в JS-бандл сайта, а закупку
  // конкурентам видеть незачем. Себестоимость — в diority-automation (реестр Tribute).
  { art: "PUBG-UC325", slug: "pubg-mobile-325-uc", category: "PUBG Mobile", categorySlug: "pubg-mobile", platform: "iOS/Android", name: "325 UC", priceUsd: 0, priceRubFixed: 407, paySku: "pubg-325", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "PUBG-UC660", slug: "pubg-mobile-660-uc", category: "PUBG Mobile", categorySlug: "pubg-mobile", platform: "iOS/Android", name: "660 UC", priceUsd: 0, priceRubFixed: 814, paySku: "pubg-660", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "PUBG-UC1800", slug: "pubg-mobile-1800-uc", category: "PUBG Mobile", categorySlug: "pubg-mobile", platform: "iOS/Android", name: "1800 UC", priceUsd: 0, priceRubFixed: 2042, paySku: "pubg-1800", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "PUBG-UC3850", slug: "pubg-mobile-3850-uc", category: "PUBG Mobile", categorySlug: "pubg-mobile", platform: "iOS/Android", name: "3850 UC", priceUsd: 0, priceRubFixed: 4079, paySku: "pubg-3850", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "GI-60", slug: "genshin-impact-60", category: "Genshin Impact", categorySlug: "genshin-impact", platform: "iOS/Android", name: "60 кристаллов сотворения", priceUsd: 0, priceRubFixed: 100, paySku: "genshin-60", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "GI-330", slug: "genshin-impact-300-30", category: "Genshin Impact", categorySlug: "genshin-impact", platform: "iOS/Android", name: "300 + 30 кристаллов сотворения", priceUsd: 0, priceRubFixed: 466, paySku: "genshin-300-30", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "GI-1090", slug: "genshin-impact-980-110", category: "Genshin Impact", categorySlug: "genshin-impact", platform: "iOS/Android", name: "980 + 110 кристаллов сотворения", priceUsd: 0, priceRubFixed: 1396, paySku: "genshin-980-110", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "GI-2240", slug: "genshin-impact-1980-260", category: "Genshin Impact", categorySlug: "genshin-impact", platform: "iOS/Android", name: "1980 + 260 кристаллов сотворения", priceUsd: 0, priceRubFixed: 2791, paySku: "genshin-1980-260", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "FF-341", slug: "free-fire-341-almazov", category: "Free Fire", categorySlug: "free-fire", platform: "iOS/Android", name: "341 алмаз (регион СНГ)", priceUsd: 0, priceRubFixed: 220, paySku: "freefire-341", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "FF-572", slug: "free-fire-572-almazov", category: "Free Fire", categorySlug: "free-fire", platform: "iOS/Android", name: "572 алмаза (регион СНГ)", priceUsd: 0, priceRubFixed: 357, paySku: "freefire-572", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "FF-1166", slug: "free-fire-1166-almazov", category: "Free Fire", categorySlug: "free-fire", platform: "iOS/Android", name: "1166 алмазов (регион СНГ)", priceUsd: 0, priceRubFixed: 715, paySku: "freefire-1166", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "FF-2398", slug: "free-fire-2398-almazov", category: "Free Fire", categorySlug: "free-fire", platform: "iOS/Android", name: "2398 алмазов (регион СНГ)", priceUsd: 0, priceRubFixed: 1429, paySku: "freefire-2398", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "FF-6160", slug: "free-fire-6160-almazov", category: "Free Fire", categorySlug: "free-fire", platform: "iOS/Android", name: "6160 алмазов (регион СНГ)", priceUsd: 0, priceRubFixed: 3620, paySku: "freefire-6160", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "ML-165", slug: "mobile-legends-165-almazov", category: "Mobile Legends", categorySlug: "mobile-legends", platform: "iOS/Android", name: "165 алмазов (регион RU)", priceUsd: 0, priceRubFixed: 263, paySku: "mlbb-165", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "ML-275", slug: "mobile-legends-275-almazov", category: "Mobile Legends", categorySlug: "mobile-legends", platform: "iOS/Android", name: "275 алмазов (регион RU)", priceUsd: 0, priceRubFixed: 438, paySku: "mlbb-275", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "ML-565", slug: "mobile-legends-565-almazov", category: "Mobile Legends", categorySlug: "mobile-legends", platform: "iOS/Android", name: "565 алмазов (регион RU)", priceUsd: 0, priceRubFixed: 881, paySku: "mlbb-565", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "ML-1155", slug: "mobile-legends-1155-almazov", category: "Mobile Legends", categorySlug: "mobile-legends", platform: "iOS/Android", name: "1155 алмазов (регион RU)", priceUsd: 0, priceRubFixed: 1766, paySku: "mlbb-1155", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "ML-1765", slug: "mobile-legends-1765-almazov", category: "Mobile Legends", categorySlug: "mobile-legends", platform: "iOS/Android", name: "1765 алмазов (регион RU)", priceUsd: 0, priceRubFixed: 2641, paySku: "mlbb-1765", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "ML-2975", slug: "mobile-legends-2975-almazov", category: "Mobile Legends", categorySlug: "mobile-legends", platform: "iOS/Android", name: "2975 алмазов (регион RU)", priceUsd: 0, priceRubFixed: 4407, paySku: "mlbb-2975", status: "Активна", note: "Пополнение по ID игрока, вход в аккаунт и пароль не нужны. Выполняем вручную, до 24 часов." },
  { art: "RBX-ROBUX400", slug: "roblox-400-robux", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "400 Robux", priceUsd: 4.99, status: "Активна", note: "Через сайт дешевле, чем через приложение" },
  { art: "RBX-ROBUX1000", slug: "roblox-1000-robux", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "1000 Robux", priceUsd: 9.99, status: "Активна", note: "" },
  { art: "RBX-ROBUX2200", slug: "roblox-2200-robux", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "2200 Robux", priceUsd: 19.99, status: "Активна", note: "" },
  { art: "RBX-ROBUX4500", slug: "roblox-4500-robux", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "4500 Robux", priceUsd: 39.99, status: "Активна", note: "" },
  { art: "RBX-ROBUX10000", slug: "roblox-10000-robux", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "10000 Robux", priceUsd: 99.99, status: "Активна", note: "" },
  { art: "RBX-ROBUX22500", slug: "roblox-22500-robux", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "22500 Robux", priceUsd: 199.99, status: "Активна", note: "Самый крупный пакет" },
  { art: "RBX-PLUS", slug: "roblox-roblox-plus-mesyats", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "Roblox Plus — месяц", priceUsd: 4.99, status: "Активна", note: "Даёт скидки в магазине Roblox" },
  { art: "RBX-PLUS500", slug: "roblox-roblox-plus-500-mesyats", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "Roblox Plus 500 — месяц", priceUsd: 9.99, status: "Активна", note: "Plus + 500 Robux ежемесячно" },
  { art: "RBX-PLUS1000", slug: "roblox-roblox-plus-1000-mesyats", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "Roblox Plus 1000 — месяц", priceUsd: 14.99, status: "Активна", note: "Plus + 1000 Robux ежемесячно" },
  { art: "RBX-PLUS2000", slug: "roblox-roblox-plus-2000-mesyats", category: "Roblox", categorySlug: "roblox", platform: "PC/Web", name: "Roblox Plus 2000 — месяц", priceUsd: 24.99, status: "Активна", note: "Plus + 2000 Robux ежемесячно" },
  { art: "STM-RUB100", slug: "steam-popolnenie-100-rub", category: "Steam", categorySlug: "steam", platform: "PC", name: "Пополнение кошелька 100 ₽", priceUsd: 0, priceRubFixed: 103, paySku: "steam-100", status: "Активна", note: "100 ₽ на кошелёк Steam (аккаунт с рублёвым кошельком), комиссия 3% уже в цене. После оплаты пришлите логин Steam. Пароль не нужен. Выполняем вручную, до 24 часов." },
  { art: "STM-5", slug: "steam-steam-wallet-usd5", category: "Steam", categorySlug: "steam", platform: "PC", name: "Steam Wallet $5", priceUsd: 5.5, markup: 0.08, status: "Активна", note: "Пополнение кошелька Steam. Приходит на ваш аккаунт" },
  { art: "STM-10", slug: "steam-steam-wallet-usd10", category: "Steam", categorySlug: "steam", platform: "PC", name: "Steam Wallet $10", priceUsd: 11, markup: 0.08, status: "Активна", note: "" },
  { art: "STM-20", slug: "steam-steam-wallet-usd20", category: "Steam", categorySlug: "steam", platform: "PC", name: "Steam Wallet $20", priceUsd: 21.5, markup: 0.08, status: "Активна", note: "" },
  { art: "STM-50", slug: "steam-steam-wallet-usd50", category: "Steam", categorySlug: "steam", platform: "PC", name: "Steam Wallet $50", priceUsd: 53, markup: 0.08, status: "Активна", note: "" },
  { art: "STM-100", slug: "steam-steam-wallet-usd100", category: "Steam", categorySlug: "steam", platform: "PC", name: "Steam Wallet $100", priceUsd: 105, markup: 0.08, status: "Активна", note: "" },
  { art: "STM-CYBER2077", slug: "steam-cyberpunk-2077", category: "Steam", categorySlug: "steam", platform: "PC", name: "Cyberpunk 2077", priceUsd: 59.99, status: "Активна", note: "" },
  { art: "STM-HOGWALEGAC", slug: "steam-hogwarts-legacy", category: "Steam", categorySlug: "steam", platform: "PC", name: "Hogwarts Legacy", priceUsd: 59.99, status: "Активна", note: "" },
  { art: "MS-MINECBEDRO", slug: "microsoft-store-minecraft-bedrock-plus-java-edition", category: "Microsoft Store", categorySlug: "microsoft-store", platform: "PC/Xbox", name: "Minecraft Bedrock + Java Edition", priceUsd: 29.99, status: "Активна", note: "Универсальная версия" },
  { art: "MS-FLIGHSIMUL", slug: "microsoft-store-microsoft-flight-simulator-2024", category: "Microsoft Store", categorySlug: "microsoft-store", platform: "PC/Xbox", name: "Microsoft Flight Simulator 2024", priceUsd: 69.99, status: "Активна", note: "Базовая версия" },
  { art: "MS-FORZAHORIZ", slug: "microsoft-store-forza-horizon-5", category: "Microsoft Store", categorySlug: "microsoft-store", platform: "PC/Xbox", name: "Forza Horizon 5", priceUsd: 59.99, status: "Активна", note: "Часто на скидке" },
  { art: "MS-SEAOF2025", slug: "microsoft-store-sea-of-thieves-2025-edition", category: "Microsoft Store", categorySlug: "microsoft-store", platform: "PC/Xbox", name: "Sea of Thieves 2025 Edition", priceUsd: 39.99, status: "Активна", note: "" },
  { art: "MS-WARHAK402", slug: "microsoft-store-warhammer-40k-space-marine-2", category: "Microsoft Store", categorySlug: "microsoft-store", platform: "PC/Xbox", name: "Warhammer 40K: Space Marine 2", priceUsd: 59.99, status: "Активна", note: "" },
  { art: "MS-GAMEPASS", slug: "microsoft-store-xbox-game-pass-pc-mesyats", category: "Microsoft Store", categorySlug: "microsoft-store", platform: "PC/Xbox", name: "Xbox Game Pass PC — месяц", priceUsd: 13.99, status: "Активна", note: "Библиотека игр для компьютера" },
  { art: "MS-GAMEPASS2", slug: "microsoft-store-xbox-game-pass-ultimate-mesyats", category: "Microsoft Store", categorySlug: "microsoft-store", platform: "PC/Xbox", name: "Xbox Game Pass Ultimate — месяц", priceUsd: 22.99, status: "Активна", note: "Игры на PC и Xbox, облачный доступ и EA Play в одной подписке" },
  { art: "MS-GAMEPASS3", slug: "microsoft-store-xbox-game-pass-core-3-mes", category: "Microsoft Store", categorySlug: "microsoft-store", platform: "PC/Xbox", name: "Xbox Game Pass Essential — месяц", priceUsd: 9.99, status: "Активна", note: "Более полусотни игр и онлайн-режим" },
  { art: "DIS-NITROBASIC", slug: "discord-nitro-basic-mesyats", category: "Discord", categorySlug: "discord", platform: "Cross-platform", name: "Nitro Basic — месяц", priceUsd: 2.99, status: "Активна", note: "" },
  { art: "DIS-NITROBASIC-G", slug: "discord-nitro-basic-god", category: "Discord", categorySlug: "discord", platform: "Cross-platform", name: "Nitro Basic — год", priceUsd: 29.99, status: "Активна", note: "Экономия ~16%" },
  { art: "DIS-NITRO", slug: "discord-nitro-mesyats", category: "Discord", categorySlug: "discord", platform: "Cross-platform", name: "Nitro — месяц", priceUsd: 9.99, status: "Под заказ", note: "Закупка 859 ₽ против рынка РФ 700–850 ₽ — продавать в убыток нельзя. Ищем другой канал закупки" },
  { art: "DIS-NITRO-G", slug: "discord-nitro-god", category: "Discord", categorySlug: "discord", platform: "Cross-platform", name: "Nitro — год", priceUsd: 99.99, status: "Активна", note: "Экономия ~17%" },
  { art: "DIS-SERVEBOOST", slug: "discord-server-boost-1-sht", category: "Discord", categorySlug: "discord", platform: "Cross-platform", name: "Server Boost (1 шт)", priceUsd: 4.99, status: "Активна", note: "Скидка 30% для Nitro" },
  { art: "DIS-SERVEBOOST2", slug: "discord-server-boost-nitro-discount", category: "Discord", categorySlug: "discord", platform: "Cross-platform", name: "Server Boost (Nitro Discount)", priceUsd: 3.49, status: "Активна", note: "Для Nitro юзеров" },
  { art: "GGL-INDIV", slug: "youtube-premium-individual-mesyats", category: "Google", categorySlug: "google", platform: "", name: "Individual — месяц", priceUsd: 15.99, status: "Активна", note: "Без рекламы, фоновое воспроизведение и загрузка" },
  { art: "GGL-INDIV-G", slug: "youtube-premium-individual-god", category: "Google", categorySlug: "google", platform: "", name: "Individual — год", priceUsd: 159.99, status: "Активна", note: "Годовая подписка. Цену уточняем при оформлении, тариф недавно менялся" },
  { art: "GGL-FAMIL", slug: "youtube-premium-family-mesyats", category: "Google", categorySlug: "google", platform: "", name: "Family — месяц", priceUsd: 26.99, status: "Активна", note: "До шести аккаунтов в одной подписке" },
  { art: "GGL-STUDE", slug: "youtube-premium-student-mesyats", category: "Google", categorySlug: "google", platform: "", name: "Student — месяц", priceUsd: 8.99, status: "Активна", note: "Нужна верификация" },
  { art: "GGL-LITE", slug: "youtube-premium-premium-lite-mesyats", category: "Google", categorySlug: "google", platform: "", name: "Premium Lite — месяц", priceUsd: 8.99, status: "Активна", note: "Без рекламы в роликах, но без фонового режима" },
  { art: "NFX-STANDWITH", slug: "netflix-standard-with-ads-mesyats", category: "Netflix", categorySlug: "netflix", platform: "", name: "Standard with Ads — месяц", priceUsd: 8.99, status: "Активна", note: "" },
  { art: "NFX-STAND", slug: "netflix-standard-bez-reklamy-mesyats", category: "Netflix", categorySlug: "netflix", platform: "", name: "Standard (без рекламы) — месяц", priceUsd: 19.99, status: "Активна", note: "" },
  { art: "NFX-K4", slug: "netflix-premium-4k-mesyats", category: "Netflix", categorySlug: "netflix", platform: "", name: "Premium 4K — месяц", priceUsd: 26.99, status: "Активна", note: "До 6 стримов, 4K" },
  { art: "NFX-EXTRAMEMBE", slug: "netflix-extra-member-s-reklamoy", category: "Netflix", categorySlug: "netflix", platform: "", name: "Extra Member (с рекламой)", priceUsd: 6.99, status: "Активна", note: "Дополнительный член" },
  { art: "NFX-EXTRAMEMBE2", slug: "netflix-extra-member-bez-reklamy", category: "Netflix", categorySlug: "netflix", platform: "", name: "Extra Member (без рекламы)", priceUsd: 9.99, status: "Активна", note: "" },
  { art: "SPT-IND-IN", slug: "spotify-premium-india-mesyats", category: "Spotify", categorySlug: "spotify", platform: "", name: "Premium Individual — Индия, месяц", priceUsd: 1.4667, status: "Архив", note: "Продажи приостановлены: регион платёжного средства не подтверждён." },
  { art: "SPT-IND-NG", slug: "spotify-premium-nigeria-mesyats", category: "Spotify", categorySlug: "spotify", platform: "", name: "Premium Individual — Нигерия, месяц", priceUsd: 1.1997, status: "Архив", note: "Продажи приостановлены: регион платёжного средства не подтверждён." },
  { art: "SPT-IND-EG", slug: "spotify-premium-egypt-mesyats", category: "Spotify", categorySlug: "spotify", platform: "", name: "Premium Individual — Египет, месяц", priceUsd: 1.4491, status: "Архив", note: "Продажи приостановлены: регион платёжного средства не подтверждён." },
  { art: "SPT-IND-TR", slug: "spotify-premium-turkey-mesyats", category: "Spotify", categorySlug: "spotify", platform: "", name: "Premium Individual — Турция, месяц", priceUsd: 2.3229, status: "Архив", note: "Продажи приостановлены: регион платёжного средства не подтверждён." },
  { art: "SPT-IND-KZ", slug: "spotify-premium-kazakhstan-mesyats", category: "Spotify", categorySlug: "spotify", platform: "", name: "Premium Individual — Казахстан, месяц", priceUsd: 4.99, status: "Архив", note: "Продажи приостановлены: регион платёжного средства не подтверждён." },
  { art: "SPT-IND-PL", slug: "spotify-premium-poland-mesyats", category: "Spotify", categorySlug: "spotify", platform: "", name: "Premium Individual — Польша, месяц", priceUsd: 6.9278, status: "Архив", note: "Продажи приостановлены: регион платёжного средства не подтверждён." },
  { art: "SPT-IND-US", slug: "spotify-premium-usa-mesyats", category: "Spotify", categorySlug: "spotify", platform: "", name: "Premium Individual — США, месяц", priceUsd: 12.99, status: "Архив", note: "Продажи приостановлены: регион платёжного средства не подтверждён." },
  { art: "TG-PREMI", slug: "telegram-premium-mesyats", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "Premium — месяц", priceUsd: 4.99, status: "Под заказ", note: "В РФ официально 299 ₽/мес через @PremiumBot — дешевле нашей закупки. Держим только как подарок другому аккаунту" },
  { art: "TG-PREMI-6M", slug: "telegram-premium-6-mes", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "Premium — 6 мес", priceUsd: 19.99, status: "Активна", note: "" },
  { art: "TG-PREMI-G", slug: "telegram-premium-god", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "Premium — год", priceUsd: 35.99, status: "Под заказ", note: "В РФ официально 1999 ₽/год через @PremiumBot — дешевле нашей закупки. Смысла в витрине нет" },
  { art: "TG-PREMI-G2", slug: "telegram-premium-god-fragment-ton", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "Premium — год (Fragment TON)", priceUsd: 29, status: "Активна", note: "Годовая подписка со скидкой. В России Premium дешевле оформить напрямую, подскажем как" },
  { art: "TG-STARS100", slug: "telegram-100-stars", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "100 Stars", priceUsd: 0, priceRubFixed: 142, paySku: "stars-100", status: "Активна", note: "Зачисление по @username, вход в аккаунт не нужен" },
  { art: "TG-STARS250", slug: "telegram-250-stars", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "250 Stars", priceUsd: 0, priceRubFixed: 355, paySku: "stars-250", status: "Активна", note: "Зачисление по @username, вход в аккаунт не нужен" },
  { art: "TG-STARS500", slug: "telegram-500-stars", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "500 Stars", priceUsd: 7, priceRubFixed: 709, paySku: "stars-500", status: "Активна", note: "" },
  { art: "TG-STARS1000", slug: "telegram-1000-stars", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "1000 Stars", priceUsd: 14, priceRubFixed: 1417, paySku: "stars-1000", status: "Активна", note: "" },
  { art: "TG-STARS2500", slug: "telegram-2500-stars", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "2500 Stars", priceUsd: 35, priceRubFixed: 3542, status: "Активна", note: "" },
  { art: "TG-STARS5000", slug: "telegram-5000-stars", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "5000 Stars", priceUsd: 70, priceRubFixed: 7083, status: "Активна", note: "" },
  { art: "TG-STARS10000", slug: "telegram-10000-stars", category: "Telegram", categorySlug: "telegram", platform: "Cross-platform", name: "10000 Stars", priceUsd: 140, priceRubFixed: 14165, status: "Активна", note: "Самый крупный пакет" },
  { art: "RST-GTAMEMBE", slug: "rockstar-gta-plus-membership-mesyats", category: "Rockstar", categorySlug: "rockstar", platform: "PC/Console", name: "GTA+ Membership — месяц", priceUsd: 7.99, status: "Активна", note: "GTA Online премиум" },
  { art: "RST-GTAV", slug: "rockstar-gta-v-enhanced-pc", category: "Rockstar", categorySlug: "rockstar", platform: "PC/Console", name: "GTA V Enhanced (PC)", priceUsd: 39.99, status: "Активна", note: "" },
  { art: "RST-GTAV2", slug: "rockstar-gta-v-legacy-pc", category: "Rockstar", categorySlug: "rockstar", platform: "PC/Console", name: "GTA V Legacy (PC)", priceUsd: 29.99, status: "Активна", note: "" },
  { art: "RST-REDDEAD2", slug: "rockstar-red-dead-redemption-2-pc", category: "Rockstar", categorySlug: "rockstar", platform: "PC/Console", name: "Red Dead Redemption 2 (PC)", priceUsd: 59.99, status: "Активна", note: "" },
  { art: "RST-RDRULTIM2", slug: "rockstar-rdr-2-ultimate-edition", category: "Rockstar", categorySlug: "rockstar", platform: "PC/Console", name: "RDR 2 Ultimate Edition", priceUsd: 79.99, status: "Активна", note: "Со всем DLC" },
  { art: "RST-REDDEAD", slug: "rockstar-red-dead-redemption-port", category: "Rockstar", categorySlug: "rockstar", platform: "PC/Console", name: "Red Dead Redemption (порт)", priceUsd: 49.99, status: "Активна", note: "Порт классической части" },
  { art: "STM-RUST", slug: "steam-rust", category: "Steam", categorySlug: "steam", platform: "PC", name: "Rust", priceUsd: 39.99, status: "Активна", note: "Топ survival multiplayer" },
  { art: "STM-SUBNA", slug: "steam-subnautica", category: "Steam", categorySlug: "steam", platform: "PC", name: "Subnautica", priceUsd: 29.99, status: "Активна", note: "Подводный выживач (оригинал)" },
  { art: "STM-VALHE", slug: "steam-valheim", category: "Steam", categorySlug: "steam", platform: "PC", name: "Valheim", priceUsd: 19.99, status: "Активна", note: "Викингский survival" },
  { art: "STM-PROJEZOMBO", slug: "steam-project-zomboid", category: "Steam", categorySlug: "steam", platform: "PC", name: "Project Zomboid", priceUsd: 19.99, status: "Активна", note: "Зомби survival" },
  { art: "STM-HELLD2", slug: "steam-helldivers-2", category: "Steam", categorySlug: "steam", platform: "PC", name: "Helldivers 2", priceUsd: 39.99, status: "Активна", note: "Хит 2024-2026" },
  { art: "STM-PALWO", slug: "steam-palworld", category: "Steam", categorySlug: "steam", platform: "PC", name: "Palworld", priceUsd: 29.99, status: "Активна", note: "Покемоны со стволами" },
  { art: "STM-ELDENRING", slug: "steam-elden-ring", category: "Steam", categorySlug: "steam", platform: "PC", name: "Elden Ring", priceUsd: 59.99, status: "Активна", note: "Игра десятилетия" },
  { art: "STM-BALDUS3", slug: "steam-baldurs-gate-3", category: "Steam", categorySlug: "steam", platform: "PC", name: "Baldur's Gate 3", priceUsd: 59.99, status: "Активна", note: "Игра 2023, всё ещё топ" },
  { art: "STM-LETHACOMPA", slug: "steam-lethal-company", category: "Steam", categorySlug: "steam", platform: "PC", name: "Lethal Company", priceUsd: 9.99, status: "Активна", note: "Кооп хоррор, дешёвый" },
  { art: "STM-STARDVALLE", slug: "steam-stardew-valley", category: "Steam", categorySlug: "steam", platform: "PC", name: "Stardew Valley", priceUsd: 14.99, status: "Активна", note: "Эвергрин" },
  { art: "STM-TERRA", slug: "steam-terraria", category: "Steam", categorySlug: "steam", platform: "PC", name: "Terraria", priceUsd: 9.99, status: "Активна", note: "Эвергрин 2D" },
  { art: "RST-GTAVI", slug: "rockstar-gta-vi-standard-edition-predzakaz", category: "Rockstar", categorySlug: "rockstar", platform: "PS5/Xbox Series", name: "GTA VI Standard Edition (предзаказ)", priceUsd: 79.99, status: "Активна", note: "Предзаказ. Выход 19 ноября 2026 года на PS5 и Xbox" },
  { art: "RST-GTAVI2", slug: "rockstar-gta-vi-ultimate-edition-predzakaz", category: "Rockstar", categorySlug: "rockstar", platform: "PS5/Xbox Series", name: "GTA VI Ultimate Edition (предзаказ)", priceUsd: 99.99, status: "Активна", note: "Расширенное издание с бонусами за предзаказ" },
  { art: "MS-GAMEPASS4", slug: "microsoft-store-xbox-game-pass-premium-mesyats", category: "Microsoft Store", categorySlug: "microsoft-store", platform: "PC/Xbox", name: "Xbox Game Pass Premium — месяц", priceUsd: 14.99, status: "Активна", note: "Более двухсот игр и облачный запуск" },
  { art: "GGL-ONE2", slug: "google-google-one-2-tb-mesyats", category: "Google", categorySlug: "google", platform: "", name: "Google One 2 ТБ — месяц", priceUsd: 9.99, status: "Активна", note: "Только облачное хранилище, без нейросетей" },
  { art: "GGL-YOUTUMUSIC", slug: "google-youtube-music-premium-mesyats", category: "Google", categorySlug: "google", platform: "", name: "YouTube Music Premium — месяц", priceUsd: 11.99, status: "Активна", note: "Музыка без рекламы и с загрузкой" },
  { art: "APL-20", slug: "apple-gift-card-20-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $20", priceUsd: 20, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-30", slug: "apple-gift-card-30-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $30", priceUsd: 30, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-35", slug: "apple-gift-card-35-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $35", priceUsd: 35, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-40", slug: "apple-gift-card-40-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $40", priceUsd: 40, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-45", slug: "apple-gift-card-45-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $45", priceUsd: 45, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-60", slug: "apple-gift-card-60-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $60", priceUsd: 60, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-70", slug: "apple-gift-card-70-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $70", priceUsd: 70, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-75", slug: "apple-gift-card-75-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $75", priceUsd: 75, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-80", slug: "apple-gift-card-80-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $80", priceUsd: 80, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-90", slug: "apple-gift-card-90-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $90", priceUsd: 90, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-150", slug: "apple-gift-card-150-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $150", priceUsd: 150, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-200", slug: "apple-gift-card-200-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $200", priceUsd: 200, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-250", slug: "apple-gift-card-250-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $250", priceUsd: 250, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-300", slug: "apple-gift-card-300-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $300", priceUsd: 300, status: "Архив", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-400", slug: "apple-gift-card-400-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $400", priceUsd: 400, status: "Архив", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-500", slug: "apple-gift-card-500-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $500", priceUsd: 500, status: "Архив", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-TR-100", slug: "apple-gift-card-tr-100", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₺100 (Турция)", priceUsd: 2.08, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Турция" },
  { art: "APL-TR-250", slug: "apple-gift-card-tr-250", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₺250 (Турция)", priceUsd: 5.2, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Турция" },
  { art: "APL-TR-500", slug: "apple-gift-card-tr-500", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₺500 (Турция)", priceUsd: 10.4, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Турция" },
  { art: "APL-TR-1000", slug: "apple-gift-card-tr-1000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₺1000 (Турция)", priceUsd: 20.8, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Турция" },
  { art: "APL-TR-2000", slug: "apple-gift-card-tr-2000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₺2000 (Турция)", priceUsd: 41.6, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Турция" },
  { art: "APL-IN-500", slug: "apple-gift-card-in-500", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₹500 (Индия)", priceUsd: 5.75, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Индия" },
  { art: "APL-IN-1000", slug: "apple-gift-card-in-1000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₹1000 (Индия)", priceUsd: 11.49, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Индия" },
  { art: "APL-IN-2000", slug: "apple-gift-card-in-2000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₹2000 (Индия)", priceUsd: 22.99, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Индия" },
  { art: "APL-IN-5000", slug: "apple-gift-card-in-5000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₹5000 (Индия)", priceUsd: 57.47, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Индия" },
  { art: "APL-IN-10000", slug: "apple-gift-card-in-10000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₹10000 (Индия)", priceUsd: 114.94, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Индия" },
  { art: "APL-KZ-2000", slug: "apple-gift-card-kz-2000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₸2000 (Казахстан)", priceUsd: 3.81, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Казахстан" },
  { art: "APL-KZ-5000", slug: "apple-gift-card-kz-5000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₸5000 (Казахстан)", priceUsd: 9.52, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Казахстан" },
  { art: "APL-KZ-10000", slug: "apple-gift-card-kz-10000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₸10000 (Казахстан)", priceUsd: 19.05, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Казахстан" },
  { art: "APL-KZ-20000", slug: "apple-gift-card-kz-20000", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card ₸20000 (Казахстан)", priceUsd: 38.1, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Казахстан" },
  { art: "APL-BR-30", slug: "apple-gift-card-br-30", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card R$30 (Бразилия)", priceUsd: 5.56, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Бразилия" },
  { art: "APL-BR-50", slug: "apple-gift-card-br-50", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card R$50 (Бразилия)", priceUsd: 9.26, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Бразилия" },
  { art: "APL-BR-100", slug: "apple-gift-card-br-100", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card R$100 (Бразилия)", priceUsd: 18.52, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Бразилия" },
  { art: "APL-BR-200", slug: "apple-gift-card-br-200", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card R$200 (Бразилия)", priceUsd: 37.04, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Бразилия" },
  { art: "APL-BR-500", slug: "apple-gift-card-br-500", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card R$500 (Бразилия)", priceUsd: 92.59, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Бразилия" },
  { art: "APL-PL-50", slug: "apple-gift-card-pl-50", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card zł50 (Польша)", priceUsd: 13.89, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Польша" },
  { art: "APL-PL-100", slug: "apple-gift-card-pl-100", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card zł100 (Польша)", priceUsd: 27.78, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Польша" },
  { art: "APL-PL-200", slug: "apple-gift-card-pl-200", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card zł200 (Польша)", priceUsd: 55.56, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Польша" },
  { art: "APL-PL-500", slug: "apple-gift-card-pl-500", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card zł500 (Польша)", priceUsd: 138.89, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Польша" },
  { art: "APL-UK-10", slug: "apple-gift-card-uk-10", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card £10 (Великобритания)", priceUsd: 13.51, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Великобритания" },
  { art: "APL-UK-15", slug: "apple-gift-card-uk-15", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card £15 (Великобритания)", priceUsd: 20.27, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Великобритания" },
  { art: "APL-UK-25", slug: "apple-gift-card-uk-25", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card £25 (Великобритания)", priceUsd: 33.78, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Великобритания" },
  { art: "APL-UK-50", slug: "apple-gift-card-uk-50", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card £50 (Великобритания)", priceUsd: 67.57, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Великобритания" },
  { art: "APL-UK-100", slug: "apple-gift-card-uk-100", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card £100 (Великобритания)", priceUsd: 135.14, status: "Черновик", note: "Аккаунт должен быть зарегистрирован в стране: Великобритания" },
  { art: "APL-2", slug: "apple-gift-card-2-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $2", priceUsd: 2, priceRubFixed: 190, paySku: "apple-2-usd", status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-3", slug: "apple-gift-card-3-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $3", priceUsd: 3, priceRubFixed: 285, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-4", slug: "apple-gift-card-4-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $4", priceUsd: 4, priceRubFixed: 379, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-5", slug: "apple-gift-card-5-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $5", priceUsd: 5, priceRubFixed: 458, paySku: "apple-5-usd", status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-8", slug: "apple-gift-card-8-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $8", priceUsd: 8, priceRubFixed: 758, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-9", slug: "apple-gift-card-9-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $9", priceUsd: 9, priceRubFixed: 853, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-10", slug: "apple-gift-card-10-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $10", priceUsd: 10, priceRubFixed: 947, paySku: "apple-10-usd", status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-15", slug: "apple-gift-card-15-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $15", priceUsd: 15, priceRubFixed: 1375, paySku: "apple-15-usd", status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-25", slug: "apple-gift-card-25-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $25", priceUsd: 25, priceRubFixed: 2292, paySku: "apple-25-usd", status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-50", slug: "apple-gift-card-50-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $50", priceUsd: 50, priceRubFixed: 4734, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
  { art: "APL-100", slug: "apple-gift-card-100-usd", category: "Apple", categorySlug: "apple", platform: "App Store / iTunes", name: "Apple Gift Card $100", priceUsd: 100, priceRubFixed: 9468, status: "Активна", note: "Аккаунт должен быть ЗАРЕГИСТРИРОВАН в США: смена региона код не активирует" },
];

/**
 * Витрина. Из позиции намеренно вырезаны markup, costRub и marginRub:
 * этот массив уезжает в браузер целиком, и всё, что в нём лежит,
 * читается через F12. Внутренние цифры — в margins.ts.
 */
export const products: Product[] = catalog.filter((p) => p.categorySlug !== "spotify").map((p, i) => {
  const { markup, priceRubFixed, ...shown } = p;
  return {
    ...shown,
    id: i + 1,
    // Фиксированная цена совпадает с суммой в платёжной форме — её не пересчитываем.
    priceRub: priceRubFixed ?? priceOf(p.priceUsd, markup, p.categorySlug).priceRub,
  };
});

/** Сырой вход каталога — только для margins.ts, компонентами не импортируется. */
export const catalogInput = catalog;

/**
 * SKU позиции в журнале заказов магазина (бот, мини-приложение, сайт).
 * У позиций из реестра Tribute — его sku; у остальных — slug страницы.
 * Список всех таких позиций сервер получает из /catalog.json при выкладке бота.
 */
export const shopSkuOf = (p: { paySku?: string; slug: string }) => p.paySku ?? p.slug;

export const getProductBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);

export const getProductsByCategory = (categorySlug: string) =>
  products.filter((p) => p.categorySlug === categorySlug && p.status === "Активна");

export const getActiveProducts = () =>
  products.filter((p) => p.status === "Активна");

export const getCategoryBySlug = (slug: string) =>
  categories.find((c) => c.slug === slug);

/* ───────────────────────────────────────────────────────────────────────
   ПОПОЛНЕНИЕ ЛЮБОЙ СУММОЙ

   Номиналы закрывают не всё: человеку часто нужно ровно 1 730 ₽ на Steam
   или 340 звёзд, а не «ближайший пакет побольше». Здесь задаётся коридор
   и себестоимость единицы, цена считается на лету.

   costPerUnit — во что обходится ОДНА единица (рубль баланса, звезда,
   робукс). markup — наценка сверх неё.
   ─────────────────────────────────────────────────────────────────────── */
export type TopupService = {
  key: string;
  title: string;
  /** Что вводит покупатель: «₽ на баланс», «звёзд» */
  unit: string;
  /** Что нужно от покупателя для зачисления */
  need: string;
  placeholder: string;
  /** Подпись и подсказка для поля с логином/ником покупателя */
  idLabel: string;
  idPlaceholder: string;
  min: number;
  max: number;
  step: number;
  /** Готовая розничная цена за одну единицу, в рублях */
  pricePerUnit: number;
  /** Быстрые кнопки под полем ввода */
  presets: number[];
  note?: string;
};

/**
 * Внутренний вид услуги — с себестоимостью и наценкой.
 * Наружу не экспортируется: калькулятор получает только готовую
 * цену за единицу, без наших закупочных цифр.
 */
type TopupServiceInternal = Omit<TopupService, "pricePerUnit"> & {
  /** Себестоимость одной единицы в рублях */
  costPerUnit: number;
  markup: number;
};

const topupSource: TopupServiceInternal[] = [
  {
    key: "steam",
    title: "Steam",
    unit: "₽ на баланс",
    need: "логин Steam — тот, которым вы входите в аккаунт (не ник и не ссылка)",
    placeholder: "например 1500",
    idLabel: "Логин Steam",
    idPlaceholder: "логин для входа в Steam",
    // Минимум 40 ₽. Мелкие суммы держим сознательно: человек, который
    // пришёл докинуть 50 ₽ до игры, потом возвращается за крупным.
    // Округление до рубля (см. topupPrice) не даёт комиссии схлопнуться
    // в ноль даже здесь.
    min: 50,
    max: 15000,
    step: 10,
    // Себестоимость НИЖЕ номинала: у поставщика на пополнение Steam
    // действует скидка по уровню подписки — Bronze 2,5%, Silver 3%,
    // Gold 3,55%. То есть за 1000 ₽ на кошелёк клиента с нашего баланса
    // списывается ~975 ₽. Здесь заложен Bronze как самый осторожный.
    // Поднялся уровень — поставь 0.97 или 0.9645.
    costPerUnit: 0.975,
    // 3% — ровно столько платит клиент сверх номинала. Для рублёвых
    // пополнений markup считается ОТ НОМИНАЛА (см. topupPrice), поэтому
    // цифра на витрине и цифра в коде — одно и то же число.
    // Вместе со скидкой поставщика 2,5% реальная маржа ≈ 5,6%.
    markup: 0.03,
    presets: [100, 500, 1000, 5000],
    note: "Зачисляется на кошелёк Steam по логину — вход в аккаунт и пароль не нужны. В цену включена комиссия сервиса: она уже посчитана выше, скрытых доплат при оформлении нет.",
  },
  {
    key: "stars",
    title: "Telegram Stars",
    unit: "звёзд",
    need: "ваш @username в Telegram",
    placeholder: "например 340",
    idLabel: "Ваш @username",
    idPlaceholder: "@username",
    min: 50,
    max: 100000,
    step: 1,
    // Пересчитано под курс 87 (было 1.204 при курсе 86)
    costPerUnit: 1.218,
    markup: 0.49,
    presets: [100, 500, 1000, 2500],
    note: "Зачисление по нику. Вход в аккаунт и пароль не требуются.",
  },
  {
    key: "robux",
    title: "Roblox",
    unit: "Robux",
    need: "никнейм Roblox и включённый приём подарков",
    placeholder: "например 1200",
    idLabel: "Никнейм Roblox",
    idPlaceholder: "ваш ник в игре",
    min: 100,
    max: 20000,
    step: 10,
    // Пересчитано под курс 87 (было 0.859 при курсе 86)
    costPerUnit: 0.869,
    markup: 0.5,
    presets: [400, 1000, 2200, 4500],
  },
];

/**
 * Публичный список услуг. Себестоимость и наценка схлопнуты в одну
 * готовую цену за единицу — по ней нельзя восстановить, почём закупка.
 */
export const topupServices: TopupService[] = topupSource.map(
  ({ costPerUnit, markup, ...shown }) => ({
    ...shown,
    // Для рублёвых пополнений цена считается ОТ НОМИНАЛА: клиент платит
    // ровно «сумма + комиссия». Для звёзд и робуксов номинала в рублях
    // нет, поэтому там наценка идёт от себестоимости, как обычно.
    pricePerUnit: shown.unit.includes("₽")
      ? 1 + markup
      : costPerUnit * (1 + markup),
  }),
);

/** Внутренний список с закупкой — только для margins.ts. */
export const topupInternal = topupSource;

/** Цена за произвольное количество. Считается из готовой цены за единицу. */
export const topupPrice = (svc: TopupService, qty: number) => {
  const q = Math.min(Math.max(qty || 0, 0), svc.max);
  const inRubles = svc.unit.includes("₽");
  const raw = q * svc.pricePerUnit;

  // Рублёвые пополнения округляем до РУБЛЯ, а не до десятки.
  // Округление к десятке на мелких суммах съедало комиссию в ноль
  // (40 ₽ → 40 ₽), и приходилось городить страховку, которая задирала
  // её до 25%. С округлением до рубля заявленные 3% выдерживаются
  // на любой сумме от 40 ₽ и не требуют оговорок.
  const step = raw < 10000 ? 10 : 50;
  const priceRub = inRubles
    ? Math.round(raw)
    : Math.round(raw / step) * step;

  return {
    qty: q,
    priceRub,
    /** Переплата к номиналу. Есть только у рублёвых пополнений. */
    feeRub: svc.unit.includes("₽") ? priceRub - q : 0,
    feePct: svc.unit.includes("₽") && q ? ((priceRub - q) / q) * 100 : 0,
  };
};

/**
 * Разброс комиссии по популярным суммам — для текста на главной.
 * Считается тем же кодом, что и калькулятор, поэтому цифра в заголовке
 * не может разойтись с цифрой в поле «К оплате».
 */
export const topupFeeRange = (svc: TopupService) => {
  const pcts = svc.presets.map((p) => topupPrice(svc, p).feePct);
  return { min: Math.min(...pcts), max: Math.max(...pcts) };
};

export const getTopup = (key: string) => topupServices.find((s) => s.key === key);
