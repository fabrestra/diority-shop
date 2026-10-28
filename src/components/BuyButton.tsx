"use client";

import { useEffect, useState } from "react";
import { buyLink, config } from "@/lib/config";
import { openBuy, isTelegramMiniApp } from "@/lib/telegram";
import { Bitcoin, CreditCard, Send, Star } from "lucide-react";

type Props = {
  productName: string;
  price: number;
  className?: string;
  fullWidth?: boolean;
  /** SKU реестра оплаты: карточка товара в @DiorityBot (Stars) и счёт в криптовалюте */
  paySku?: string;
  /** Проверенная ссылка Tribute (payLinks.ts) — оплата картой, только на сайте */
  payUrl?: string;
  inquiryOnly?: boolean;
};

const base =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition active:scale-[0.98] ";
const primary = "bg-[var(--color-mint)] text-black hover:bg-[var(--color-mint-hover)] glow-mint ";
const secondary =
  "border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-white hover:bg-[var(--color-bg-soft)] ";

/**
 * Способы оплаты.
 * Внутри Telegram (Mini App) — только Stars через бота: этого требуют правила Telegram
 * для цифровых товаров. На самостоятельном сайте — карта (Tribute), Stars в боте и криптовалюта.
 * Все заказы сходятся в один журнал @DiorityBot: там же история, поддержка и выдача.
 */
export function BuyButton({ productName, price, className = "", paySku, payUrl, inquiryOnly = false }: Props) {
  // Решаем после монтирования: при статической сборке window ещё нет.
  const [inTelegram, setInTelegram] = useState<boolean | null>(null);
  const [crypto, setCrypto] = useState<"idle" | "busy" | string>("idle");
  useEffect(() => setInTelegram(isTelegramMiniApp()), []);

  const starsUrl = paySku ? `https://t.me/${config.telegram.botUsername}?start=item_${paySku}` : null;
  const ask = () => openBuy(buyLink(productName, price));
  const rub = price.toLocaleString("ru-RU");

  const payCrypto = async () => {
    if (!config.cryptoPaymentsEnabled || !paySku || crypto === "busy") return;
    setCrypto("busy");
    try {
      const r = await fetch(`${config.shopApi}/api/crypto/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: paySku }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.pay_url) throw new Error(data.error || "Счёт не создан");
      if (inTelegram) openBuy(data.pay_url);
      else window.location.href = data.pay_url;
      setCrypto("idle");
    } catch (e) {
      setCrypto(e instanceof Error ? e.message : "Счёт не создан");
    }
  };

  if (inTelegram === null) {
    // До монтирования показываем нейтральную кнопку без внешних ссылок.
    return (
      <button onClick={ask} className={`${base}${primary}${className}`}>
        <Send size={16} /> {inquiryOnly ? "Согласовать заказ" : `Купить за ${rub} ₽`}
      </button>
    );
  }

  if (inTelegram && !config.miniAppExternalPay) {
    return starsUrl ? (
      <button onClick={() => openBuy(starsUrl)} className={`${base}${primary}${className}`}>
        <Star size={16} /> Оплатить звёздами в боте
      </button>
    ) : (
      <button onClick={ask} className={`${base}${primary}${className}`}>
        <Send size={16} /> Написать продавцу
      </button>
    );
  }

  // Крипта — только на самостоятельном сайте: правила Telegram (п. 7.4) запрещают внешнюю крипту в мини-приложении.
  const cryptoOn = Boolean(config.cryptoPaymentsEnabled && config.shopApi && paySku && !inTelegram);
  // Внутри Telegram ссылки t.me открываем нативно, а не во встроенном браузере.
  const viaTelegram = (url: string) => (e: React.MouseEvent) => {
    if (!inTelegram) return;
    e.preventDefault();
    openBuy(url);
  };
  return (
    <div className="flex flex-col gap-2">
      {payUrl && (
        <a href={payUrl} target="_blank" rel="noopener noreferrer" onClick={viaTelegram(payUrl)} className={`${base}${primary}${className}`}>
          <CreditCard size={16} /> Оплатить картой {rub} ₽
        </a>
      )}
      {starsUrl && (
        <a
          href={starsUrl}
          onClick={viaTelegram(starsUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base}${payUrl ? secondary : primary}${className}`}
        >
          <Star size={16} /> Оплатить звёздами в Telegram
        </a>
      )}
      {cryptoOn && (
        <button onClick={payCrypto} disabled={crypto === "busy"} className={`${base}${secondary}${className}`}>
          <Bitcoin size={16} /> {crypto === "busy" ? "Создаём счёт…" : "Оплатить криптовалютой (USDT)"}
        </button>
      )}
      {!payUrl && !starsUrl && !cryptoOn && (
        <button onClick={ask} className={`${base}${primary}${className}`}>
          <Send size={16} /> {inquiryOnly ? "Согласовать заказ" : `Купить за ${rub} ₽`}
        </button>
      )}
      {(payUrl || starsUrl || cryptoOn) && (
        <button onClick={ask} className={`${base}${secondary}${className}`}>
          <Send size={16} /> Уточнить условия до оплаты
        </button>
      )}
      {crypto !== "idle" && crypto !== "busy" && (
        <p className="text-center text-[11px] text-[var(--color-warning)]">{crypto}</p>
      )}
      <p className="text-center text-[11px] leading-relaxed text-[var(--color-text-muted)]">
        До оплаты уточните совместимость и срок. Заказы выполняем вручную. Для зачисления попросим данные товара: ID, @username или согласованный способ оформления. История и
        поддержка — в @{config.telegram.botUsername}.
      </p>
    </div>
  );
}
