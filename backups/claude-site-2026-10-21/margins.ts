/**
 * СЛУЖЕБНЫЙ ФАЙЛ. Себестоимость, наценка и маржа по каждой позиции.
 *
 * Лежит отдельно от витрины намеренно и по той же причине, что sources.ts:
 * catalog.ts импортируется клиентскими компонентами, поэтому всё, что
 * попадает в exported-товар, уезжает в JS-бандл и читается через F12.
 * Конкуренту не нужно знать нашу закупку.
 *
 * Этот файл не импортирует ни один компонент — только скрипты учёта.
 * Он в .gitignore: на GitHub его нет.
 */

import { catalogInput, topupInternal, priceOf, USD_COST_RATE } from "./catalog";
import type { ProductInternal } from "@/types/product";

/** Каталог с внутренними цифрами: закупка, наценка, маржа. */
export const productsInternal: ProductInternal[] = catalogInput.map((p, i) => {
  const { costRub, priceRub, marginRub } = priceOf(
    p.priceUsd,
    p.markup,
    p.categorySlug,
  );
  return { ...p, id: i + 1, costRub, priceRub, marginRub };
});

/** Пополнения с внутренними цифрами. */
export const topupMargins = topupInternal.map((s) => ({
  key: s.key,
  title: s.title,
  costPerUnit: s.costPerUnit,
  markup: s.markup,
  pricePerUnit: s.costPerUnit * (1 + s.markup),
  marginPerUnit: s.costPerUnit * s.markup,
}));

/** Сводка по каталогу — сколько зарабатываем и где. */
export const marginReport = () => {
  const active = productsInternal.filter((p) => p.status === "Активна");
  const pct = active.map((p) => (p.marginRub / p.priceRub) * 100);
  const avg = pct.reduce((a, b) => a + b, 0) / (pct.length || 1);

  return {
    rate: USD_COST_RATE,
    activeCount: active.length,
    avgMarginPct: Number(avg.toFixed(1)),
    thinnest: [...active]
      .sort((a, b) => a.marginRub - b.marginRub)
      .slice(0, 10)
      .map((p) => ({ name: p.name, price: p.priceRub, margin: p.marginRub })),
    fattest: [...active]
      .sort((a, b) => b.marginRub - a.marginRub)
      .slice(0, 10)
      .map((p) => ({ name: p.name, price: p.priceRub, margin: p.marginRub })),
  };
};
