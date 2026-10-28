"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { config } from "@/lib/config";

const faqItems = [
  {
    q: "Сколько занимает выдача?",
    a: "Выдача вручную — до 24 часов после оплаты и получения данных для зачисления, обычно быстрее.",
  },
  {
    q: "Как оформить заказ?",
    a: "Выберите товар и способ оплаты на его странице. После оплаты @DiorityBot попросит данные для зачисления (ID игрока или @username) и пришлёт результат.",
  },
  {
    q: "Какие способы оплаты?",
    a: "Картой в рублях через Tribute, Telegram Stars и криптовалютой (USDT) через @CryptoBot. Подробно — на странице «Оплата и возврат».",
  },
  {
    q: "Есть ли комиссия?",
    a: "Да, комиссия сервиса заложена в цену. На пополнении Steam это 3% к номиналу: вводите 5 000 ₽ — платите 5 150 ₽, на баланс приходит ровно 5 000 ₽. Размер комиссии виден в калькуляторе до оформления, и при оплате к названной сумме ничего не добавляется. Для сравнения: на рынке за ту же услугу обычно берут 8–15%.",
  },
  {
    q: "Почему цена выше номинала?",
    a: "Комиссия на пополнение Steam — 3% к номиналу: 1 000 ₽ на кошелёк стоят 1 030 ₽. Это оплата работы: закупка валюты, комиссии платёжных систем, обработка заказа. Размер видно в калькуляторе до оформления, при оплате к нему ничего не добавляется. Если где-то видите цену ровно по номиналу — почти всегда доплата всплывает в переписке.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold">FAQ</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">Часто задаваемые вопросы</p>

      <div className="mt-8 space-y-2">
        {faqItems.map((item, i) => (
          <FaqItem key={i} {...item} />
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-[var(--color-mint)]/20 bg-[var(--color-bg-elevated)] p-6 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">Не нашли ответ?</p>
        <a
          href={`https://t.me/${config.telegram.adminUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-lg bg-[var(--color-mint)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--color-mint-hover)]"
        >
          Написать в Telegram
        </a>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-[var(--color-bg-soft)]"
      >
        <span className="font-semibold">{q}</span>
        <ChevronDown
          size={20}
          className={`flex-shrink-0 text-[var(--color-text-muted)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--color-border)] p-5 text-sm text-[var(--color-text-muted)]">
          {a}
        </div>
      )}
    </div>
  );
}
