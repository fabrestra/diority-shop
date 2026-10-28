import type { Metadata } from "next";
import { categories, getActiveProducts, warrantyFor, requirementFor } from "@/data/catalog";
import { MiniApp } from "@/components/MiniApp";

export const metadata: Metadata = {
  title: "Каталог Diority",
  description: "Витрина Diority внутри Telegram",
  // мини-апп открывается в Telegram, поисковикам он не нужен
  robots: { index: false, follow: false },
};

/**
 * Telegram Mini App — витрина каталога внутри мессенджера.
 *
 * Каталог берётся из того же catalog.ts, что и сайт: отдельного json нет,
 * править цены нужно в одном месте. Данные встраиваются в HTML при сборке,
 * поэтому страница открывается без единого запроса к сети.
 */
export default function MiniAppPage() {
  const items = getActiveProducts().map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    categorySlug: p.categorySlug,
    priceRub: p.priceRub,
    note: p.note,
    warranty: warrantyFor(p).label,
    need: requirementFor(p).text,
  }));

  const cats = categories
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: items.filter((i) => i.categorySlug === c.slug).length,
    }))
    .filter((c) => c.count > 0);

  return <MiniApp items={items} cats={cats} />;
}
