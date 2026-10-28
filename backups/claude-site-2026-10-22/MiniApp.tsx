"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { BrandIcon } from "@/components/BrandIcon";
import { config, formatRub } from "@/lib/config";
import { TopupCalculator } from "./TopupCalculator";

export type MiniItem = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  priceRub: number;
  note: string;
  warranty: string;
  need: string;
  /** SKU в реестре оплаты: открывает карточку товара в боте и счёт в Stars */
  paySku?: string;
};

export type MiniCat = { slug: string; name: string; count: number };

/** Минимальный кусок Telegram WebApp API, который нам нужен */
type TgWebApp = {
  initData?: string;
  ready: () => void;
  expand: () => void;
  openTelegramLink: (url: string) => void;
  HapticFeedback?: { impactOccurred: (s: string) => void };
};

const tg = (): TgWebApp | undefined =>
  (globalThis as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;

export function MiniApp({ items, cats }: { items: MiniItem[]; cats: MiniCat[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [open, setOpen] = useState<MiniItem | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // История заказов: с сервера (подпись Telegram проверяет сервер), иначе — в боте
  const showOrders = async () => {
    const app = tg();
    const botLink = `https://t.me/${config.telegram.botUsername}?start=orders`;
    if (!config.ordersApi || !app?.initData) {
      if (app) app.openTelegramLink(botLink);
      else window.open(botLink, "_blank", "noopener");
      return;
    }
    try {
      const r = await fetch(`${config.ordersApi}/miniapp/orders`, {
        headers: { "X-Telegram-Init-Data": app.initData },
      });
      if (!r.ok) throw new Error(String(r.status));
      const data = (await r.json()) as { orders: OrderRow[] };
      setOrdersError(null);
      setOrders(data.orders);
    } catch {
      setOrders([]);
      setOrdersError("История сейчас недоступна — откройте /orders в боте.");
    }
  };

  // Telegram разворачивает окно на всю высоту только по явной команде
  useEffect(() => {
    const app = tg();
    app?.ready();
    app?.expand();
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!cat || i.categorySlug === cat) &&
        (!q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)),
    );
  }, [items, query, cat]);

  const order = (item: MiniItem) => {
    const app = tg();
    // Внутри Telegram цифровые товары оплачиваются только Stars: ведём в карточку товара в боте.
    const start = item.paySku ? `item_${item.paySku}` : "catalog";
    const url = `https://t.me/${config.telegram.botUsername}?start=${start}`;
    app?.HapticFeedback?.impactOccurred("medium");
    if (app) app.openTelegramLink(url);
    else window.open(url, "_blank", "noopener");
  };

  return (
    <div className="mx-auto max-w-lg px-3 pb-24 pt-3">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />

      {/* Поиск и фильтры прилипают к верху: на телефоне это половина удобства */}
      <div className="sticky top-0 z-10 -mx-3 bg-[var(--color-bg)]/95 px-3 pb-3 pt-1 backdrop-blur">
        <div className="mb-2 flex justify-end">
          <button
            onClick={showOrders}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] active:bg-[var(--color-bg-soft)]"
          >
            Мои заказы
          </button>
        </div>
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по каталогу"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-base text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-mint)]/40 focus:outline-none"
        />

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          <Chip active={cat === null} onClick={() => setCat(null)}>
            Все {items.length}
          </Chip>
          {cats.map((c) => (
            <Chip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
              <BrandIcon
                slug={c.slug}
                size={14}
                className={cat === c.slug ? "brightness-0" : ""}
              />
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* Пополнение произвольной суммой показываем до каталога: чаще всего
          человеку нужно конкретное число, а не ближайший пакет побольше */}
      {query === "" && cat === null && (
        <div className="mt-3">
          <TopupCalculator compact />
        </div>
      )}

      {list.length === 0 ? (
        <p className="mt-10 text-center text-sm text-[var(--color-text-muted)]">
          Ничего не нашлось. Попробуйте другое слово или напишите нам, поищем под заказ.
        </p>
      ) : (
        <ul className="mt-1 space-y-2">
          {list.map((i) => (
            <li key={i.slug}>
              <button
                onClick={() => setOpen(i)}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 text-left active:bg-[var(--color-bg-soft)]"
              >
                <BrandIcon slug={i.categorySlug} size={22} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{i.name}</span>
                  <span className="block truncate text-xs text-[var(--color-text-muted)]">
                    {i.category}
                  </span>
                </span>
                <span className="flex-shrink-0 text-sm font-semibold text-[var(--color-mint)]">
                  {formatRub(i.priceRub)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Sheet item={open} onClose={() => setOpen(null)} onOrder={() => order(open)} />
      )}
      {orders && <OrdersSheet orders={orders} error={ordersError} onClose={() => setOrders(null)} />}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition ${
        active
          ? "border-[var(--color-mint)] bg-[var(--color-mint)] text-black"
          : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

/** Карточка позиции снизу — привычный для телефона паттерн */
function Sheet({
  item,
  onClose,
  onOrder,
}: {
  item: MiniItem;
  onClose: () => void;
  onOrder: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-border-strong)]" />

        <div className="flex items-start gap-3">
          <BrandIcon slug={item.categorySlug} size={28} />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">{item.name}</h2>
            <p className="text-xs text-[var(--color-text-muted)]">{item.category}</p>
          </div>
        </div>

        {item.note && (
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{item.note}</p>
        )}

        <div className="mt-4 rounded-xl bg-[var(--color-bg)] px-4 py-3">
          <div className="text-xs font-medium text-white">Что нужно для оформления</div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{item.need}</p>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl bg-[var(--color-bg)] px-4 py-3">
          <span className="text-xs text-[var(--color-text-muted)]">Гарантия</span>
          <span className="text-xs font-medium text-[var(--color-mint)]">{item.warranty}</span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">Цена</div>
            <div className="text-2xl font-bold text-[var(--color-mint)]">
              {formatRub(item.priceRub)}
            </div>
          </div>
          <button
            onClick={onOrder}
            className="rounded-xl bg-[var(--color-mint)] px-6 py-3 text-sm font-semibold text-black active:bg-[var(--color-mint-hover)]"
          >
            {item.paySku ? "Оплатить в боте" : "В каталог бота"}
          </button>
        </div>

        <p className="mt-3 text-center text-xs leading-relaxed text-[var(--color-text-muted)]">
          Итоговую стоимость в Stars и доступность покажет бот перед оплатой. Выдача вручную, до 24 часов.
        </p>
      </div>
    </div>
  );
}

type OrderRow = { id: string | number; product: string; amount: string | number; currency: string; status: string };

/** Мои заказы — только чтение; данные покупателя и коды сюда не приходят */
function OrdersSheet({ orders, error, onClose }: { orders: OrderRow[]; error: string | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-border-strong)]" />
        <h2 className="text-base font-semibold text-white">Мои заказы</h2>
        {error && <p className="mt-3 text-sm text-[var(--color-text-muted)]">{error}</p>}
        {!error && orders.length === 0 && (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">Заказов пока нет.</p>
        )}
        <ul className="mt-3 space-y-2">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl bg-[var(--color-bg)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm text-white">{o.product}</span>
                <span className="flex-shrink-0 text-sm font-semibold text-[var(--color-mint)]">
                  {o.amount.toLocaleString("ru-RU")} {o.currency === "RUB" ? "₽" : o.currency}
                </span>
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                №{o.id} · {o.status}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
