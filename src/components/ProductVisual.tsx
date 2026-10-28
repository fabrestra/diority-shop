import { BrandIcon } from "@/components/BrandIcon";
import { brandIcons } from "@/data/brandIcons";

/**
 * Обложка товара на карточке товара: крупный логотип бренда на подложке,
 * окрашенной в фирменный цвет. Заменяет отсутствующие фотографии —
 * у цифровых товаров физической картинки нет, а пустое место
 * делает страницу похожей на заготовку.
 */
export function ProductVisual({
  categorySlug,
  categoryName,
}: {
  categorySlug: string;
  categoryName?: string;
}) {
  if (categorySlug === "suno" || categorySlug === "midjourney") {
    return <img src={`/images/products/${categorySlug}-1m.png`} alt={categoryName ?? categorySlug} width={1448} height={1086} loading="lazy" className="aspect-[4/3] w-full rounded-2xl border border-[var(--color-border)] object-cover" />;
  }
  const icon = brandIcons[categorySlug];
  const accent = icon?.multi ? "#FFFFFF" : (icon?.color ?? "#00E5A1");

  return (
    <div
      className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 22%, transparent)`,
        background: `radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, ${accent} 18%, transparent) 0%, var(--color-bg-elevated) 65%)`,
      }}
    >
      {/* мягкое свечение в цвет бренда */}
      <div
        aria-hidden
        className="absolute h-40 w-40 rounded-full blur-[70px] opacity-40"
        style={{ backgroundColor: accent }}
      />
      <BrandIcon
        slug={categorySlug}
        size={96}
        title={categoryName}
        className="relative drop-shadow-lg"
      />
    </div>
  );
}
