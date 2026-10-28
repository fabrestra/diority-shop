"use client";

import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { topupServices, topupPrice } from "@/data/catalog";
import { BrandIcon } from "./BrandIcon";
import { payLinkFor } from "@/data/payLinks";
import { Bitcoin, CreditCard, Send, Star } from "lucide-react";

type Tg = {
  initData?: string;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  openInvoice?: (url: string, cb?: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
  HapticFeedback?: { notificationOccurred?: (s: string) => void };
};
const tg = (): Tg | undefined => (globalThis as unknown as { Telegram?: { WebApp?: Tg } }).Telegram?.WebApp;
const STEAM_LOGIN = /^[A-Za-z0-9_]{3,32}$/;
type Avail = { stars: boolean; crypto: boolean; card: boolean };

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
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const checkoutGuard = useRef(false);
  const [notice, setNotice] = useState("");
  const [inTelegram, setInTelegram] = useState(false);
  // Какие способы оплаты Steam сейчас включены на сервере. До ответа — ни один.
  const [avail, setAvail] = useState<Avail>({ stars: false, crypto: false, card: false });
  const [starsPrice, setStarsPrice] = useState<number | null>(null);
  useEffect(() => setInTelegram(Boolean(tg()?.initData)), []);

  const qty = Number(raw.replace(/\s/g, "")) || 0;
  const minQty = key === "steam" ? Math.max(svc.min, 50) : svc.min;
  const low = qty > 0 && qty < minQty;
  const high = qty > svc.max;
  const ok = qty >= minQty && qty <= svc.max;
  const { priceRub, feeRub, feePct } = topupPrice(svc, qty);
  useEffect(() => {
    if (key !== "steam" || !config.shopApi) return;
    let alive = true;
    const credit = qty >= 50 && qty <= 15000 ? qty : 500;
    const timer = setTimeout(() => fetch(config.shopApi + "/api/steam/quote", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credit_rub: credit }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((q) => {
        if (alive && q) {
          setAvail({ stars: q.stars_available === true, crypto: q.crypto_available === true, card: q.tribute_available === true });
          setStarsPrice(credit === qty && typeof q.stars_price === "number" ? q.stars_price : null);
        }
      })
      .catch(() => undefined), 350);
    return () => { alive = false; clearTimeout(timer); };
  }, [key, qty]);

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

  const post = async (path: string, body: object, initData?: string) => {
    const response = await fetch(config.shopApi + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(initData ? { "X-Telegram-Init-Data": initData } : {}) },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Не удалось создать счёт. Попробуйте позже или напишите в поддержку.");
    return data;
  };

  const steamLogin = login.trim();
  const loginOk = key !== "steam" || STEAM_LOGIN.test(steamLogin);

  /** Общая обёртка: один счёт за раз, понятная ошибка вместо молчания. */
  const run = async (fn: () => Promise<void>) => {
    if (checkoutGuard.current) return;
    checkoutGuard.current = true;
    setBusy(true);
    setCheckoutError("");
    setNotice("");
    try {
      await fn();
    } catch (error) {
      setCheckoutError(error instanceof TypeError ? "Не удалось связаться с магазином. Попробуйте позже или напишите в поддержку." : error instanceof Error ? error.message : "Счёт не подтверждён. Обратитесь в поддержку.");
    } finally {
      checkoutGuard.current = false;
      setBusy(false);
    }
  };
  const steamBody = () => ({ credit_rub: qty, expected_price_minor: priceRub * 100, login: steamLogin });

  /** Steam звёздами — счёт открывается прямо в мини-приложении. */
  const payStars = () => run(async () => {
    const app = tg();
    if (!app?.initData || !app.openInvoice) throw new Error("Обновите Telegram: эта версия не умеет открывать счета.");
    const { invoice_link } = await post("/api/miniapp/steam-stars-invoice", steamBody(), app.initData);
    app.openInvoice(invoice_link, (status) => {
      if (status === "paid") {
        app.HapticFeedback?.notificationOccurred?.("success");
        setNotice(`Оплата получена. Пополним Steam «${steamLogin}» вручную, обычно в течение часа, максимум 24 часа. Статус — в @${config.telegram.botUsername}.`);
      } else if (status === "failed") setCheckoutError("Оплата не прошла. Попробуйте ещё раз.");
    });
  });

  /** Steam в USDT — только на сайте: правила Telegram не разрешают внешнюю крипту в мини-приложении. */
  const payCrypto = () => run(async () => {
    const invoice = await post("/api/steam/crypto-invoice", steamBody());
    if (typeof invoice.pay_url !== "string" || !invoice.pay_url.startsWith("https://plisio.net/invoice/"))
      throw new Error("Ссылка оплаты требует проверки. Обратитесь в поддержку; повторно не оплачивайте.");
    window.location.assign(invoice.pay_url);
  });

  /** Steam картой — когда Tribute подключит оплату произвольной суммы. */
  const payCard = () => run(async () => {
    const invoice = await post("/api/steam/tribute-invoice", steamBody());
    if (typeof invoice.pay_url !== "string" || !/^https:\/\/web\.tribute\.tg\/shop\/pay\/[a-f0-9-]{36}$/.test(invoice.pay_url))
      throw new Error("Ссылка оплаты требует проверки. Обратитесь в поддержку; повторную оплату не делайте.");
    window.location.assign(invoice.pay_url);
  });

  /** Остальные сервисы калькулятора и запасной путь — заказ через поддержку. */
  const order = () => {
    const who = login.trim() ? ` ${svc.idLabel}: ${login.trim()}.` : "";
    const text = `Здравствуйте! ${svc.title}: ${qty} ${svc.unit}. К оплате ${priceRub} ₽.${who}`;
    const url = `https://t.me/${config.telegram.adminUsername}?text=${encodeURIComponent(text)}`;
    const app = tg();
    if (app?.openTelegramLink) app.openTelegramLink(url);
    else window.location.assign(url);
  };

  const steamStarsHere = key === "steam" && inTelegram && avail.stars;
  const steamCryptoHere = key === "steam" && !inTelegram && avail.crypto;
  const steamCardHere = key === "steam" && !inTelegram && avail.card;
  const steamStarsInBot = key === "steam" && !inTelegram && avail.stars;
  // Фиксированные карточки Tribute (оплата картой/СБП) для отдельных сумм: steam-100 и т.д.
  const steamFixedCard = key === "steam" && config.miniAppExternalPay ? payLinkFor(`steam-${qty}`) : undefined;
  const anySteamPay = steamStarsHere || steamCryptoHere || steamCardHere || Boolean(steamFixedCard);
  const ready = ok && loginOk && !busy;
  const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ";
  const btnMain = btnBase + "bg-mint text-[#04121f] enabled:hover:brightness-110";
  const btnAlt = btnBase + "border border-white/15 text-white enabled:hover:border-mint";

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
            disabled={busy}
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
          disabled={busy}
          value={raw}
          onChange={(e) => setRaw(e.target.value.replace(/[^\d\s]/g, ""))}
          placeholder={svc.placeholder}
          className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-slate-600"
        />
        <span className="shrink-0 text-sm text-slate-400">{svc.unit}</span>
      </div>

      {/* быстрые кнопки */}
      <div className="mt-2 flex flex-wrap gap-2">
        {(key === "steam" ? [100, 250, 500, 1000, 2000, 5000] : svc.presets).map((p) => (
          <button
            key={p}
            onClick={() => setRaw(String(p))}
            disabled={busy}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-mint hover:text-mint"
          >
            {p.toLocaleString("ru-RU")}
          </button>
        ))}
      </div>

      {key === "steam" && <label className="mt-4 block text-xs text-slate-400">
        Сумма пополнения Steam
        <input type="range" min={Math.max(svc.min, 50)} max={svc.max} step={svc.step}
          value={Math.min(Math.max(qty, Math.max(svc.min, 50)), svc.max)}
          onChange={(event) => setRaw(event.target.value)} disabled={busy}
          className="mt-2 w-full accent-emerald-400" />
      </label>}

      {/* логин / ник — чтобы человек сразу видел, что от него нужно */}
      <label className="mt-4 block text-xs uppercase tracking-wide text-slate-400">
        {svc.idLabel}
      </label>
      <input
        value={login}
        disabled={busy}
        onChange={(e) => setLogin(e.target.value)}
        placeholder={svc.idPlaceholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0F1729] px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-mint"
      />

      {/* подсказки по границам */}
      {low && (
        <p className="mt-3 text-sm text-amber-400">
          Минимум — {minQty.toLocaleString("ru-RU")} {svc.unit}.
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
        {anySteamPay ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            {steamFixedCard && !steamCardHere && (
              <button
                onClick={() => {
                  const app = tg();
                  if (app?.openTelegramLink) app.openTelegramLink(steamFixedCard);
                  else window.open(steamFixedCard, "_blank", "noopener");
                }}
                disabled={busy}
                className={btnMain}
              >
                <CreditCard size={16} /> Оплатить картой {priceRub.toLocaleString("ru-RU")} ₽
              </button>
            )}
            {steamStarsHere && (
              <button onClick={payStars} disabled={!ready} className={steamFixedCard ? btnAlt : btnMain}>
                <Star size={16} /> {busy ? "Создаём счёт…" : starsPrice ? `Оплатить ${starsPrice.toLocaleString("ru-RU")} ⭐` : "Оплатить звёздами"}
              </button>
            )}
            {steamCardHere && (
              <button onClick={payCard} disabled={!ready} className={btnMain}>
                <CreditCard size={16} /> {busy ? "Создаём счёт…" : "Оплатить картой"}
              </button>
            )}
            {steamCryptoHere && (
              <button onClick={payCrypto} disabled={!ready} className={steamCardHere ? btnAlt : btnMain}>
                <Bitcoin size={16} /> {busy ? "Создаём счёт…" : "Оплатить USDT (BEP20)"}
              </button>
            )}
            {steamStarsInBot && (
              <a href={config.telegram.miniAppUrl} target="_blank" rel="noopener noreferrer" className={btnAlt}>
                <Star size={16} /> Звёздами в Telegram
              </a>
            )}
          </div>
        ) : (
          <button onClick={order} disabled={!ok || busy} className={btnMain}>
            <Send size={16} /> {busy ? "Проверяем оформление…" : "Оформить через поддержку"}
          </button>
        )}
      </div>

      {key === "steam" && !loginOk && login.trim() !== "" && (
        <p className="mt-3 text-sm text-amber-400">Нужен именно логин Steam — латиница, цифры и «_». Не ник и не ссылка на профиль.</p>
      )}
      {anySteamPay && !login.trim() && ok && (
        <p className="mt-3 text-xs text-slate-400">Впишите логин Steam — без него счёт не создаётся.</p>
      )}
      {checkoutError && <p role="alert" className="mt-3 text-sm text-amber-300">{checkoutError}</p>}
      {notice && <p className="mt-3 text-sm text-mint">{notice}</p>}
      {steamFixedCard && (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">Оплата картой — через Tribute. Логин Steam бот @{config.telegram.botUsername} спросит сразу после оплаты.</p>
      )}
      {key === "steam" && anySteamPay && !avail.card && !steamFixedCard && (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs leading-relaxed text-amber-200">
          {inTelegram
            ? "Пополнение Steam на любую сумму сейчас оплачивается звёздами Telegram. Оплата картой скоро; криптовалютой — на сайте diority.com."
            : "Пополнение Steam на любую сумму сейчас оплачивается в USDT или звёздами Telegram. Оплата картой подключается — скоро появится."}
        </p>
      )}
      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Для оформления понадобится: {svc.need}.
        {svc.note ? ` ${svc.note}` : ""}
      </p>
    </section>
  );
}
