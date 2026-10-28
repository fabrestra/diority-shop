"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { Bitcoin, CreditCard, Star } from "lucide-react";

type Tg = {
  initData?: string;
  openTelegramLink: (url: string) => void;
  openLink?: (url: string) => void;
  openInvoice?: (url: string, cb?: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
  HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred?: (s: string) => void };
};
const tg = (): Tg | undefined => (globalThis as unknown as { Telegram?: { WebApp?: Tg } }).Telegram?.WebApp;

const btn =
  "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 ";
const primary = "bg-[var(--color-mint)] text-black active:bg-[var(--color-mint-hover)] ";
const secondary = "border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-white active:bg-[var(--color-bg-soft)] ";

/** Открыть ссылку: t.me — внутри Telegram, остальное — во внешнем браузере. */
const go = (url: string) => {
  const app = tg();
  if (app && url.startsWith("https://t.me/")) app.openTelegramLink(url);
  else if (app?.openLink) app.openLink(url);
  else window.open(url, "_blank", "noopener");
};

/**
 * Оплата в мини-приложении.
 * Stars — счёт открывается прямо здесь (openInvoice), если поднят API магазина; иначе — карточка в боте.
 * Карта (Tribute) и криптовалюта — внешние ссылки, только при config.miniAppExternalPay.
 */
export function MiniPay({ sku, payUrl }: { sku?: string; payUrl?: string }) {
  const [state, setState] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const botItem = sku
    ? `https://t.me/${config.telegram.botUsername}?start=item_${sku}`
    : `https://t.me/${config.telegram.botUsername}?start=catalog`;

  const post = async (path: string, init?: string) => {
    const r = await fetch(`${config.shopApi}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(init ? { "X-Telegram-Init-Data": init } : {}) },
      body: JSON.stringify({ sku }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Оплата временно недоступна. Попробуйте позже или напишите в поддержку.");
    return data;
  };

  const payStars = async () => {
    const app = tg();
    app?.HapticFeedback?.impactOccurred("medium");
    // Вне Telegram (открыли сайт в браузере) — карточка товара в боте. Внутри — только здесь.
    if (!app?.initData) return go(botItem);
    if (!sku || !config.shopApi || !app.openInvoice)
      return setState("Оплата звёздами в этой версии Telegram недоступна. Обновите Telegram или выберите другой способ.");
    setBusy(true);
    setState(null);
    try {
      const { invoice_link } = await post("/api/miniapp/stars-invoice", app.initData);
      app.openInvoice(invoice_link, (status) => {
        if (status === "paid") {
          app.HapticFeedback?.notificationOccurred?.("success");
          setState(`Оплата подтверждена. Выполняем заказ вручную, до 24 часов. @${config.telegram.botUsername} попросит данные для зачисления. Пожалуйста, ожидайте.`);
        } else if (status === "failed") setState("Оплата не прошла. Попробуйте ещё раз или откройте товар в боте.");
      });
    } catch (e) {
      setState(e instanceof TypeError ? "Оплата временно недоступна. Попробуйте позже или напишите в поддержку." : e instanceof Error ? e.message : "Счёт не создан");
    } finally {
      setBusy(false);
    }
  };

  const payCrypto = async () => {
    if (!config.cryptoPaymentsEnabled) return;
    setBusy(true);
    setState(null);
    try {
      const { pay_url } = await post("/api/crypto/invoice");
      go(pay_url);
    } catch (e) {
      setState(e instanceof TypeError ? "Оплата временно недоступна. Попробуйте позже или напишите в поддержку." : e instanceof Error ? e.message : "Счёт не создан");
    } finally {
      setBusy(false);
    }
  };

  const external = config.miniAppExternalPay;
  return (
    <div className="mt-4 flex flex-col gap-2">
      <button onClick={payStars} disabled={busy} className={btn + primary}>
        <Star size={16} /> {busy ? "Создаём счёт…" : "Оплатить звёздами"}
      </button>
      {external && payUrl && (
        <button onClick={() => go(payUrl)} className={btn + secondary}>
          <CreditCard size={16} /> Картой в рублях (Tribute)
        </button>
      )}
      {/* Крипта внутри Telegram не показывается (п. 7.4 правил); на сайте — в BuyButton. */}
      {external && config.cryptoPaymentsEnabled && config.shopApi && sku && !tg()?.initData && (
        <button onClick={payCrypto} disabled={busy} className={btn + secondary}>
          <Bitcoin size={16} /> Криптовалютой (USDT)
        </button>
      )}
      {state && <p className="text-center text-xs leading-relaxed text-[var(--color-mint)]">{state}</p>}
    </div>
  );
}
