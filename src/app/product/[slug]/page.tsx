import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getProductsByCategory, products, getCategoryBySlug, warrantyFor, requirementFor, shopSkuOf } from "@/data/catalog";
import { BuyButton } from "@/components/BuyButton";
import { payLinkFor } from "@/data/payLinks";
import { ProductCard } from "@/components/ProductCard";
import { BrandIcon } from "@/components/BrandIcon";
import { ProductVisual } from "@/components/ProductVisual";
import { formatRub } from "@/lib/config";

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${formatRub(p.priceRub)}`,
    description: `${p.name}. ${p.category}, ${p.platform}.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) notFound();

  const cat = getCategoryBySlug(p.categorySlug);
  const warranty = warrantyFor(p);
  const req = requirementFor(p);
  const related = getProductsByCategory(p.categorySlug).filter((x) => x.slug !== p.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/catalog/${p.categorySlug}`} className="text-sm text-[var(--color-text-muted)] hover:text-white">
        ← {p.category}
      </Link>

      <div className="mt-3 grid gap-6 md:grid-cols-[1fr_320px]">
        {/* Левая колонка — заголовок и шаги */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <BrandIcon slug={p.categorySlug} size={18} title={cat?.name} />
            <span>{p.category}</span>
            {p.platform && (
              <>
                <span>·</span>
                <span>{p.platform}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{p.name}</h1>

          <div className="mt-5">
            <ProductVisual categorySlug={p.categorySlug} categoryName={cat?.name} />
          </div>

          <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
            <h2 className="mb-2 text-base font-semibold">{req.title}</h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{req.text}</p>
            {p.note && <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{p.note}</p>}
          </div>

          <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-base font-semibold">Гарантия</h2>
              <span className="rounded-md bg-[var(--color-mint-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-mint)]">
                {warranty.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{warranty.covers}</p>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">{warranty.excludes}</p>
          </div>

          <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
            <h2 className="mb-3 text-base font-semibold">Как купить</h2>
            <ol className="space-y-2.5 text-sm text-[var(--color-text-muted)]">
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-mint-soft)] text-[10px] font-bold text-[var(--color-mint)]">1</span>
                {p.status === "Активна" && !p.inquiryOnly ? "Выбираете способ оплаты на этой странице" : "Нажимаете кнопку «Купить». Откроется Telegram с готовым сообщением"}
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-mint-soft)] text-[10px] font-bold text-[var(--color-mint)]">2</span>
                {p.status === "Активна" && !p.inquiryOnly ? "После оплаты бот попросит данные для зачисления: ID, @username или почту аккаунта" : "Проверяем наличие, называем точную сумму и способ оплаты"}
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-mint-soft)] text-[10px] font-bold text-[var(--color-mint)]">3</span>
                После оплаты оформляем заказ и присылаем результат
              </li>
            </ol>
          </div>
        </div>

        {/* Правая колонка — цена и кнопка */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-xl border border-[var(--color-mint)]/20 bg-[var(--color-bg-elevated)] p-5">
            <div className="text-xs text-[var(--color-text-muted)]">Цена</div>
            <div className="mt-1 text-3xl font-bold text-[var(--color-mint)]">{formatRub(p.priceRub)}</div>
            <div className="mt-4">
              <BuyButton productName={p.name} price={p.priceRub} inquiryOnly={p.inquiryOnly} fullWidth paySku={p.status === "Активна" && !p.inquiryOnly ? shopSkuOf(p) : undefined} payUrl={payLinkFor(p.paySku)} />
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">В этой же категории</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.slug} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
