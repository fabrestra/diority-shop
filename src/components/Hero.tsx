import Link from "next/link";
import { config, formatRub } from "@/lib/config";
import { Send, ArrowRight } from "lucide-react";
import {
  getActiveProducts,
  categories,
  getTopup,
  topupPrice,
  topupFeeRange,
} from "@/data/catalog";
import { TopupCalculator } from "./TopupCalculator";

/**
 * Первый экран.
 *
 * Калькулятор стоит здесь, а не ниже по странице, намеренно: до второго
 * экрана долистывает меньшинство, а «сколько будет стоить пополнить» —
 * это первый вопрос, с которым человек приходит. Пусть отвечает сразу,
 * без прокрутки и без переписки.
 */
export function Hero() {
  const active = getActiveProducts();
  const cheapest = Math.min(...active.map((p) => p.priceRub));

  /**
   * Цифру про Steam НЕ пишем руками.
   *
   * Раньше в заголовке стояло «комиссия 3%», а калькулятор рядом показывал
   * «без переплаты» — читатель видел два разных числа в одном экране.
   * Теперь пример считается тем же кодом, что и калькулятор: разойтись
   * они физически не могут.
   */
  const steam = getTopup("steam");
  const demo = steam ? topupPrice(steam, 1000) : null;
  const range = steam ? topupFeeRange(steam) : null;

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      {/* тонкая сетка вместо размытых пятен — с ними лендинг выглядит как шаблон */}
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-mint)]/40 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_420px] lg:gap-12">
          {/* Левая колонка: кто мы и почему нам верить */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]/70 px-3 py-1 text-xs text-[var(--color-text-muted)] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-mint)]" />
              {active.length} позиций в наличии
            </div>

            <h1 className="text-[2.4rem] font-semibold leading-[1.05] md:text-[3.4rem]">
              Пополнение и подписки
              <br />
              <span className="text-[var(--color-mint)]">без скрытых доплат</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--color-text-muted)]">
              Steam, Telegram, Roblox, ChatGPT, Apple — {active.length} позиций в
              каталоге.
              {demo && (
                <>
                  {" "}
                  Комиссия на пополнение Steam —{" "}
                  <strong className="text-white">
                    {range
                      ? `${range.min.toFixed(1).replace(".", ",")}–${range.max
                          .toFixed(1)
                          .replace(".", ",")}%`
                      : `${demo.feePct.toFixed(1)}%`}
                  </strong>{" "}
                  к номиналу: {demo.qty.toLocaleString("ru-RU")} ₽ на кошелёк —{" "}
                  {demo.priceRub.toLocaleString("ru-RU")} ₽ к оплате. Точная сумма
                  видна в калькуляторе до заказа, при оформлении ничего не
                  добавляется.
                </>
              )}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="group inline-flex items-center gap-2 rounded-lg bg-[var(--color-mint)] px-6 py-3 font-semibold text-black transition hover:bg-[var(--color-mint-hover)]"
              >
                Весь каталог
                <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href={`https://t.me/${config.telegram.channelUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-strong)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-bg-elevated)]"
              >
                <Send size={17} /> Канал в Telegram
              </a>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3">
              <Fact value={`${categories.length}`} label="сервисов в каталоге" />
              <Fact value="15–30 мин" label="обычное время выдачи" />
              <Fact value={`от ${formatRub(cheapest)}`} label="самая дешёвая позиция" />
            </dl>
          </div>

          {/* Правая колонка: считалка. На телефоне уезжает под заголовок */}
          <div className="lg:sticky lg:top-6">
            <TopupCalculator />
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[var(--color-bg)] px-4 py-3.5">
      <dt className="text-lg font-semibold text-white">{value}</dt>
      <dd className="mt-0.5 text-xs text-[var(--color-text-muted)]">{label}</dd>
    </div>
  );
}
