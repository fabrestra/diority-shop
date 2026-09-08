import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { categories, getCategoryBySlug, getProductsByCategory } from "@/data/catalog";
import { BrandBadge } from "@/components/BrandIcon";
import { TopupCalculator } from "@/components/TopupCalculator";

/**
 * Категории, где пополнение произвольной суммой — это отдельный товар.
 *
 * Steam и Telegram: номиналы закрывают не всё, человеку часто нужно
 * ровно 1 730 ₽ или 340 звёзд. Ставим калькулятор первым блоком —
 * до карточек, а не после.
 *
 * Roblox сюда не входит намеренно: там сетка пакетов (400/1000/2200/4500)
 * совпадает с тем, что продаёт сам Roblox, и произвольное число только
 * запутает. Калькулятор для робуксов остаётся на главной.
 */
const TOPUP_BY_CATEGORY: Record<string, string> = {
  steam: "steam",
  telegram: "stars",
};

export async function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = getCategoryBySlug(category);
  if (!c) return {};
  return { title: c.name, description: c.description };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = getCategoryBySlug(category);
  if (!c) notFound();

  const items = getProductsByCategory(category);
  const topupKey = TOPUP_BY_CATEGORY[category];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <Link href="/catalog" className="text-sm text-[var(--color-text-muted)] hover:text-white">
          ← К каталогу
        </Link>
        <div className="mt-3 flex items-center gap-4">
          <BrandBadge slug={c.slug} size={64} title={c.name} />
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{c.name}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{c.description}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {items.length} {items.length === 1 ? "позиция" : items.length < 5 ? "позиции" : "позиций"} в категории
        </p>
      </div>

      {topupKey && (
        <div className="mb-8 max-w-2xl">
          <TopupCalculator initialKey={topupKey} lockService />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.slug} p={p} />
        ))}
      </div>
    </div>
  );
}
