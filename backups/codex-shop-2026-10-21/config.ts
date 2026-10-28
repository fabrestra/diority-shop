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
    miniAppUrl: "https://t.me/diority_shop_bot/shop",
    // Магазинный бот: после оплаты пишет покупателю, команда /orders — история заказов
    botUsername: "diority_shop_bot",
  },
  // Адрес сервера истории заказов (GET /miniapp/orders). Пусто — история открывается в боте.
  ordersApi: process.env.NEXT_PUBLIC_ORDERS_API ?? "",
  contact: {
    email: "diorityshop@gmail.com",
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
