import Link from "next/link";
import { config } from "@/lib/config";
import { BrandIcon } from "@/components/BrandIcon";
import { getActiveProducts } from "@/data/catalog";

export const metadata = {
  title: "О нас",
  description: `${config.brand.name} — магазин цифровых товаров и подписок`,
};

const groups = [
  {
    title: "AI-подписки",
    slugs: ["chatgpt", "claude", "perplexity", "grok", "cursor", "google", "character-ai", "higgsfield", "tripo", "meshy"],
    text: "ChatGPT, Claude, Perplexity, Grok, Cursor, Google AI",
  },
  {
    title: "Игровой донат",
    slugs: ["brawl-stars", "clash-royale", "clash-of-clans", "roblox"],
    text: "Brawl Stars, Clash Royale, Clash of Clans, Roblox",
  },
  {
    title: "Игры и платформы",
    slugs: ["steam", "microsoft-store", "rockstar"],
    text: "Пополнение Steam, Xbox Game Pass, игры Rockstar",
  },
  {
    title: "Подписки и сервисы",
    slugs: ["netflix", "discord", "telegram", "apple", "picsart", "zoom", "coursera", "busuu", "quizlet"],
    text: "Netflix, Discord, Telegram, подарочные карты Apple",
  },
];

export default function AboutPage() {
  const count = getActiveProducts().length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold md:text-4xl">О Diority</h1>
      <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-muted)]">
        Каталог цифровых товаров, подписок и игровых валют — {count} позиций.
        Оформляем подписки и пополнения в зарубежных сервисах, принимаем оплату
        в рублях.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold md:text-2xl">Что есть в каталоге</h2>
        <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.title} className="bg-[var(--color-bg)] p-5">
              <div className="mb-3 flex gap-2">
                {g.slugs.map((s) => (
                  <BrandIcon key={s} slug={s} size={18} />
                ))}
              </div>
              <h3 className="font-semibold">{g.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{g.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-semibold md:text-2xl">Как это работает</h2>
        <p className="leading-relaxed text-[var(--color-text-muted)]">
          Выберите позицию в каталоге и напишите в Telegram. Мы уточняем наличие и способ
          выдачи, подтверждаем стоимость и оформляем оплату. Стандартный срок от оплаты
          до выдачи согласуем до оплаты. Заказы выполняются вручную.
        </p>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-semibold md:text-2xl">Принципы</h2>
        <ul className="space-y-2.5 text-[var(--color-text-muted)]">
          <li>
            <strong className="text-white">Цена на сайте = цена при оплате.</strong>{" "}
            Комиссия сервиса уже заложена в стоимость и показана до заказа —
            на пополнении Steam это около 4,5% к номиналу. При оформлении
            к названной сумме ничего не добавляется.
          </li>
          <li>
            <strong className="text-white">Гарантия зависит от типа товара.</strong>{" "}
            У подписок это 24 часа с момента выдачи, у кодов — проверка до активации,
            у игровой валюты — до момента зачисления. Точные условия указаны на
            странице каждой позиции.
          </li>
          <li>
            <strong className="text-white">Предупреждаем о рисках заранее.</strong>{" "}
            Условия по позиции — например, требования к региону аккаунта —
            сообщаются до оплаты.
          </li>
        </ul>
      </section>

      <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
        <h3 className="font-semibold">Контакты</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Telegram-канал:{" "}
          <Link
            className="text-[var(--color-mint)] hover:underline"
            href={`https://t.me/${config.telegram.channelUsername}`}
          >
            @{config.telegram.channelUsername}
          </Link>
          <br />
          Оформление заказа:{" "}
          <Link
            className="text-[var(--color-mint)] hover:underline"
            href={`https://t.me/${config.telegram.adminUsername}`}
          >
            @{config.telegram.adminUsername}
          </Link>
        </p>
      </div>
    </div>
  );
}
