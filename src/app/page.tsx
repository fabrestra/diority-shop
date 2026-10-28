import Link from "next/link";
import { Hero } from "@/components/Hero";
import { BrandStrip } from "@/components/BrandStrip";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { categories, getActiveProducts } from "@/data/catalog";
import { config } from "@/lib/config";
import { Zap, ShieldCheck, BadgeRussianRuble, MessageCircle } from "lucide-react";

export default function HomePage() {
  const top = getActiveProducts().slice(0, 8);

  return (
    <>
      <Hero />
      <BrandStrip />

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Категории</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Каталог разделён по сервисам
            </p>
          </div>
          <Link href="/catalog" className="text-sm font-medium text-[var(--color-mint)] hover:underline">
            Весь каталог →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryCard key={c.slug} c={c} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Подписки и пополнения</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Выберите товар и уточните условия оформления
            </p>
          </div>
          <Link href="/catalog" className="text-sm font-medium text-[var(--color-mint)] hover:underline">
            Все товары →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {top.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      </section>

      <Features />
      <FinalCTA />
    </>
  );
}

function Features() {
  const items = [
    {
      Icon: BadgeRussianRuble,
      title: "Цена окончательная",
      text: "Комиссия сервиса уже включена в стоимость и видна в калькуляторе до заказа. При оформлении к этой сумме ничего не добавляется.",
    },
    {
      Icon: Zap,
      title: "Понятный срок выдачи",
      text: "Заказы выполняем вручную. Наличие, совместимость аккаунта и срок согласуем до оплаты.",
    },
    {
      Icon: ShieldCheck,
      title: "Гарантия по каждой позиции",
      text: "Срок и условия зависят от типа товара и указаны на его странице. Обещаем только то, что можем выполнить.",
    },
    {
      Icon: MessageCircle,
      title: "Сопровождение заказа",
      text: "Проверка наличия, помощь с активацией и подбором региона аккаунта.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h2 className="text-2xl font-semibold md:text-3xl">Условия работы</h2>
      <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-2">
        {items.map((i) => (
          <div key={i.title} className="flex gap-4 bg-[var(--color-bg)] p-6">
            <i.Icon
              size={20}
              strokeWidth={1.75}
              className="mt-0.5 flex-shrink-0 text-[var(--color-mint)]"
            />
            <div>
              <h3 className="font-semibold">{i.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">{i.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-2">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 md:flex md:items-center md:justify-between md:gap-8 md:p-10">
        <div>
          <h2 className="text-xl font-semibold md:text-2xl">Нужной позиции нет в каталоге?</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
            Напишите — уточним возможность и сроки. Каталог регулярно
            пополняется по запросам покупателей.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:flex-shrink-0">
          <a
            href={`https://t.me/${config.telegram.adminUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[var(--color-mint)] px-6 py-3 font-semibold text-black transition hover:bg-[var(--color-mint-hover)]"
          >
            Написать в Telegram
          </a>
          <Link
            href="/catalog"
            className="rounded-lg border border-[var(--color-border-strong)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-bg-soft)]"
          >
            Весь каталог
          </Link>
        </div>
      </div>
    </section>
  );
}
