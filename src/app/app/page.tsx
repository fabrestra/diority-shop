import type { Metadata } from "next";
import { SECTIONS, categories, getActiveProducts, warrantyFor, requirementFor, shopSkuOf } from "@/data/catalog";
import { MiniApp } from "@/components/MiniApp";
import { payLinkFor } from "@/data/payLinks";

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
    paySku: p.inquiryOnly ? undefined : shopSkuOf(p),
    payUrl: payLinkFor(p.paySku),
  }));

  const cats = categories
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: items.filter((i) => i.categorySlug === c.slug).length,
    }))
    .filter((c) => c.count > 0);

  const sections = SECTIONS.map((x) => ({ ...x, cats: x.cats.filter((c) => cats.some((k) => k.slug === c)) })).filter(
    (x) => x.cats.length > 0,
  );

  return <MiniApp items={items} cats={cats} sections={sections} />;
}
