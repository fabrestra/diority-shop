/** Внешние ссылки оплаты Tribute — ТОЛЬКО для самостоятельного сайта.
 * Mini App и бот @DiorityBot продают цифровые товары только за Telegram Stars,
 * поэтому кнопка с этой ссылкой не показывается внутри Telegram Mini App (см. BuyButton).
 * Ключ — paySku позиции = sku в assets/tribute-products.json.
 *
 * 22.10.2026: 28 ссылок собраны в кабинете Tribute; сумма и валюта RUB сверены с карточкой.
 * EUR-дубль 5 USD (€509) сюда не входит.
 */
export const payLinks: Record<string, string> = {
  "apple-2-usd": "https://t.me/tribute/app?startapp=pHJw",
  "apple-5-usd": "https://t.me/tribute/app?startapp=pHJz",
  "apple-10-usd": "https://t.me/tribute/app?startapp=pHJv",
  "apple-15-usd": "https://t.me/tribute/app?startapp=pHJA",
  "apple-25-usd": "https://t.me/tribute/app?startapp=pHJB",
  "steam-100": "https://t.me/tribute/app?startapp=pI4y",
  "stars-100": "https://t.me/tribute/app?startapp=pHJD",
  "stars-250": "https://t.me/tribute/app?startapp=pHJE",
  "stars-500": "https://t.me/tribute/app?startapp=pHJF",
  "stars-1000": "https://t.me/tribute/app?startapp=pHJG",
  "pubg-325": "https://t.me/tribute/app?startapp=pHJI",
  "pubg-660": "https://t.me/tribute/app?startapp=pHJJ",
  "pubg-1800": "https://t.me/tribute/app?startapp=pHJK",
  "pubg-3850": "https://t.me/tribute/app?startapp=pHJL",
  "genshin-60": "https://t.me/tribute/app?startapp=pHJM",
  "genshin-300-30": "https://t.me/tribute/app?startapp=pHJN",
  "genshin-980-110": "https://t.me/tribute/app?startapp=pHJP",
  "genshin-1980-260": "https://t.me/tribute/app?startapp=pHJQ",
  "freefire-341": "https://t.me/tribute/app?startapp=pHJR",
  "freefire-572": "https://t.me/tribute/app?startapp=pHJS",
  "freefire-1166": "https://t.me/tribute/app?startapp=pHJU",
  "freefire-2398": "https://t.me/tribute/app?startapp=pHJW",
  "freefire-6160": "https://t.me/tribute/app?startapp=pHKK",
  "mlbb-165": "https://t.me/tribute/app?startapp=pHKN",
  "mlbb-275": "https://t.me/tribute/app?startapp=pHKO",
  "mlbb-565": "https://t.me/tribute/app?startapp=pHKQ",
  "mlbb-1155": "https://t.me/tribute/app?startapp=pHKR",
  "mlbb-1765": "https://t.me/tribute/app?startapp=pHKT",
  "mlbb-2975": "https://t.me/tribute/app?startapp=pHKU",
};

/** Проверенная ссылка оплаты для позиции или undefined. */
export const payLinkFor = (paySku?: string): string | undefined => {
  if (!paySku) return undefined;
  const url = payLinks[paySku];
  return url && url.startsWith("https://") ? url : undefined;
};
