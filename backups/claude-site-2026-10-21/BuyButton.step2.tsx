"use client";

import { useEffect, useState } from "react";
import { buyLink } from "@/lib/config";
import { openBuy, isTelegramMiniApp } from "@/lib/telegram";
import { CreditCard, Send, ShoppingCart } from "lucide-react";

type Props = {
  productName: string;
  price: number;
  variant?: "primary" | "secondary";
  className?: string;
  fullWidth?: boolean;
  /**
   * Проверенная ссылка оплаты Tribute (payLinks.ts). Показывается только на
   * самостоятельном сайте: внутри Telegram Mini App цифровые товары — только за Stars.
   */
  payUrl?: string;
};

export function BuyButton({ productName, price, variant = "primary", className = "", fullWidth, payUrl }: Props) {
  const onClick = () => openBuy(buyLink(productName, price));
  // Решаем после монтирования: при статической сборке window ещё нет,
  // и ссылка не должна мелькнуть внутри Telegram даже на мгновение.
  const [showPay, setShowPay] = useState(false);
  useEffect(() => setShowPay(Boolean(payUrl) && !isTelegramMiniApp()), [payUrl]);

  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.98] " +
    (fullWidth ? "w-full " : "") +
    (variant === "primary"
      ? "bg-[var(--color-mint)] text-black hover:bg-[var(--color-mint-hover)] glow-mint "
      : "border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-white hover:bg-[var(--color-bg-soft)] ");

  const ask = (
    <button onClick={onClick} className={`${base} px-5 py-3 text-sm ${className}`}>
      {variant === "primary" ? <Send size={16} /> : <ShoppingCart size={16} />}
      Купить за {price.toLocaleString("ru-RU")} ₽
    </button>
  );
  if (!showPay || !payUrl) return ask;

  return (
    <div className="flex flex-col gap-2">
      <a
        href={payUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-[var(--color-mint)] text-black hover:bg-[var(--color-mint-hover)] glow-mint px-5 py-3 text-sm ${className}`}
      >
        <CreditCard size={16} />
        Оплатить картой {price.toLocaleString("ru-RU")} ₽
      </a>
      <p className="text-center text-[11px] text-[var(--color-text-muted)]">
        Оплата через Tribute. После оплаты @DiorityBot напишет и попросит данные для зачисления.
      </p>
    </div>
  );
}
