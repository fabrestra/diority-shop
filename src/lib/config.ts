/**
 * Главная точка конфигурации магазина.
 * Меняй здесь — пробрасывается во все компоненты.
 */
export const config = {
  brand: {
    name: "Diority",
    tagline: "Цифровые товары и подписки",
    description:
      "Каталог цифровых товаров: подписки на AI-сервисы, игровые валюты, пополнение Steam, подарочные карты Apple, подписки стриминговых сервисов.",
  },
  telegram: {
    // Username канала (без @)
    channelUsername: "diority_shop",
    // Username для прямой связи / поддержки (личный аккаунт)
    adminUsername: "diority_admin",
    // URL Mini App. Получишь после регистрации Mini App в @BotFather
    miniAppUrl: "https://t.me/DiorityBot",
    // Магазинный бот: после оплаты пишет покупателю, команда /orders — история заказов
    botUsername: "DiorityBot",
  },
  // Адрес сервера истории заказов (GET /miniapp/orders). Пусто — история открывается в боте.
  ordersApi: process.env.NEXT_PUBLIC_ORDERS_API ?? process.env.NEXT_PUBLIC_SHOP_API ?? "",
  // API магазина для оплаты криптовалютой на сайте (POST /api/crypto/invoice). Пусто — кнопки крипты нет.
  shopApi: process.env.NEXT_PUBLIC_SHOP_API ?? "",
  /**
   * Карта (Tribute) и криптовалюта внутри Telegram (мини-приложение).
   * Решение владельца 22.10.2026, осознанный риск: п. 6.2 условий Telegram требует Stars для
   * цифровых товаров. Если придёт предупреждение от Telegram — поставить false и пересобрать:
   * внутри Telegram останутся только звёзды, на сайте всё как было.
   */
  miniAppExternalPay: true,
  // 24.10: USDT BEP20 через Plisio — только на самостоятельном сайте (в мини-приложении скрыто, п. 7.4 правил Telegram).
  cryptoPaymentsEnabled: true,
  contact: {
    email: "diorityshop@gmail.com",
  },
  /**
   * Реквизиты продавца для подвала и документов. Пусто — на сайте честная пометка,
   * что реквизиты появятся после регистрации. После ИП: «ИП Фамилия Имя Отчество, ОГРНИП …, ИНН …».
   */
  legal: {
    seller: "",
    updated: "22.10.2026",
  },
} as const;

export type AppConfig = typeof config;

/**
 * Сгенерировать TG deep-link для покупки конкретного товара.
 * Открывается у клиента в TG с заранее заполненным сообщением.
 */
export const buyLink = (productName: string, price: number) => {
  const text = `Здравствуйте! Хочу купить: ${productName} за ${price.toLocaleString("ru-RU")} ₽`;
  return `https://t.me/${config.telegram.adminUsername}?text=${encodeURIComponent(text)}`;
};

export const formatRub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

/**
 * Курс, по которому считается каталог. Внутренняя величина —
 * на витрине не показываем, чтобы не переводить разговор
 * с товара на размер наценки.
 */
export const USD_RATE = 86;
