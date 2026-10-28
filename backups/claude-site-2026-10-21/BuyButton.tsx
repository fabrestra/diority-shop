"use client";

import { buyLink } from "@/lib/config";
import { openBuy } from "@/lib/telegram";
import { Send, ShoppingCart } from "lucide-react";

type Props = {
  productName: string;
  price: number;
  variant?: "primary" | "secondary";
  className?: string;
  fullWidth?: boolean;
};

export function BuyButton({ productName, price, variant = "primary", className = "", fullWidth }: Props) {
  const onClick = () => openBuy(buyLink(productName, price));

  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.98] " +
    (fullWidth ? "w-full " : "") +
    (variant === "primary"
      ? "bg-[var(--color-mint)] text-black hover:bg-[var(--color-mint-hover)] glow-mint "
      : "border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-white hover:bg-[var(--color-bg-soft)] ");

  return (
    <button onClick={onClick} className={`${base} px-5 py-3 text-sm ${className}`}>
      {variant === "primary" ? <Send size={16} /> : <ShoppingCart size={16} />}
      Купить за {price.toLocaleString("ru-RU")} ₽
    </button>
  );
}
