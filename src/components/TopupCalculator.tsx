"use client";

import { useState } from "react";
import { topupServices, topupPrice } from "@/data/catalog";
import { BrandIcon } from "./BrandIcon";

/**
 * Калькулятор пополнения на произвольную сумму.
 *
 * Номиналы закрывают не всё: человеку нужно ровно 1 730 ₽ на Steam или
 * 340 звёзд, а не «ближайший пакет побольше». Здесь он вводит своё число
 * и сразу видит цену — без переписки и уточнений.
 */

const SLUG: Record<string, string> = {
  steam: "steam",
  stars: "telegram",
  robux: "roblox",
};

/**
 * @param compact    — узкий вариант для мини-приложения
 * @param initialKey — какой сервис открыть сразу (для страниц категорий)
 * @param lockService — спрятать переключатель: на странице Steam незачем
 *                      предлагать Roblox, это лишний выбор перед действием
 */
export function TopupCalculator({
  compact = false,
  initialKey,
  lockService = false,
}: {
  compact?: boolean;
  initialKey?: string;
  lockService?: boolean;
}) {
  const [key, setKey] = useState(
    initialKey && topupServices.some((s) => s.key === initialKey)
      ? initialKey
      : topupServices[0].key,
  );
  const svc = topupServices.find((s) => s.key === key)!;
  const [raw, setRaw] = useState<string>(String(svc.presets[1]));
  const [login, setLogin] = useState("");

  const qty = Number(raw.replace(/\s/g, "")) || 0;
  const low = qty > 0 && qty < svc.min;
  const high = qty > svc.max;
  const ok = qty >= svc.min && qty <= svc.max;
  const { priceRub, feeRub, feePct } = topupPrice(svc, qty);

  /**
   * Для Steam единица — рубль на кошельке, поэтому комиссия считается
   * от номинала: сколько сверху к той сумме, что клиент получит.
   * Показываем её честно и заранее — человек видит размер до оформления,
   * а не узнаёт о доплате в переписке. Скрытая комиссия убивает доверие
   * дороже, чем сама комиссия.
   * Для звёзд и робуксов такого сравнения нет — там цена за штуку.
   */
  // Переплату не пересчитываем — берём ту же, что вернул topupPrice.
  // Один источник числа = невозможно разойтись с текстом на главной.
  const inRubles = svc.unit.includes("₽");
  const perUnit = qty ? priceRub / qty : 0;

  const pick = (k: string) => {
    const next = topupServices.find((s) => s.key === k)!;
    setKey(k);
    setRaw(String(next.presets[1]));
    setLogin("");
  };

  const order = () => {
    const who = login.trim() ? ` ${svc.idLabel}: ${login.trim()}.` : "";
    const text =
      `Здравствуйте! ${svc.title}: ${qty} ${svc.unit}. К оплате ${priceRub} ₽.${who}`;
    const url = `https://t.me/diority_admin?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[#121C31] ${
        compact ? "p-4" : "p-6 sm:p-8"
      }`}
    >
      {!compact && (
        <>
          <h2 className="text-xl font-bold text-white">Пополнение любой суммой</h2>
          <p className="mt-1 text-sm text-slate-400">
            Не нашли нужный номинал? Введите своё число — цена посчитается сразу.
          </p>
        </>
      )}

      {/* выбор сервиса */}
      {!lockService && (
      <div className="mt-4 flex flex-wrap gap-2">
        {topupServices.map((s) => (
          <button
            key={s.key}
            onClick={() => pick(s.key)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              s.key === key
                ? "border-mint bg-mint/10 text-mint"
                : "border-white/10 text-slate-300 hover:border-white/25"
            }`}
          >
            <BrandIcon slug={SLUG[s.key]} size={16} />
            {s.title}
          </button>
        ))}
      </div>
      )}

      {/* ввод количества */}
      <label className="mt-5 block text-xs uppercase tracking-wide text-slate-400">
        Сколько нужно
      </label>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0F1729] px-4 py-3 focus-within:border-mint">
        <input
          inputMode="numeric"
          value={raw}
          onChange={(e) => setRaw(e.target.value.replace(/[^\d\s]/g, ""))}
          placeholder={svc.placeholder}
          className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-slate-600"
        />
        <span className="shrink-0 text-sm text-slate-400">{svc.unit}</span>
      </div>

      {/* быстрые кнопки */}
      <div className="mt-2 flex flex-wrap gap-2">
        {svc.presets.map((p) => (
          <button
            key={p}
            onClick={() => setRaw(String(p))}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-mint hover:text-mint"
          >
            {p.toLocaleString("ru-RU")}
          </button>
        ))}
      </div>

      {/* логин / ник — чтобы человек сразу видел, что от него нужно */}
      <label className="mt-4 block text-xs uppercase tracking-wide text-slate-400">
        {svc.idLabel}
      </label>
      <input
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        placeholder={svc.idPlaceholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0F1729] px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-mint"
      />

      {/* подсказки по границам */}
      {low && (
        <p className="mt-3 text-sm text-amber-400">
          Минимум — {svc.min.toLocaleString("ru-RU")} {svc.unit}.
        </p>
      )}
      {high && (
        <p className="mt-3 text-sm text-amber-400">
          Максимум за один заказ — {svc.max.toLocaleString("ru-RU")} {svc.unit}. Больше
          оформим в несколько заказов, напишите.
        </p>
      )}

      {/* итог */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            К оплате
            {/* Ветки «без комиссии» здесь нет намеренно: topupPrice
                округляет вверх, поэтому заявленный процент выдерживается
                на любой сумме. Показывать «без комиссии» рядом с обещанием
                комиссии на главной — ровно то расхождение, из-за которого
                перестают верить остальным цифрам. */}
            {ok && inRubles && (
              <span className="ml-2 rounded bg-mint/15 px-1.5 py-0.5 text-[10px] font-bold text-mint">
                комиссия {feePct.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-3xl font-extrabold text-mint">
            {ok ? `${priceRub.toLocaleString("ru-RU")} ₽` : "—"}
          </div>
          {ok && (
            <div className="mt-1 text-xs text-slate-400">
              {inRubles ? (
                <>
                  на баланс придёт {qty.toLocaleString("ru-RU")} ₽
                  {feeRub > 0 && (
                    <> · комиссия {feeRub.toLocaleString("ru-RU")} ₽</>
                  )}
                </>
              ) : (
                `${perUnit.toFixed(2)} ₽ за штуку`
              )}
            </div>
          )}
        </div>
        <button
          onClick={order}
          disabled={!ok}
          className="rounded-xl bg-mint px-6 py-3 text-sm font-bold text-[#04121f] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Оформить
        </button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Для оформления понадобится: {svc.need}.
        {svc.note ? ` ${svc.note}` : ""}
      </p>
    </section>
  );
}
