import { config } from "@/lib/config";

export type LegalSection = { h: string; p: string[] };

/** Общая разметка юридических страниц: заголовок, дата редакции, разделы, блок продавца. */
export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">Редакция от {config.legal.updated}</p>
      <p className="mt-5 leading-relaxed text-[var(--color-text-muted)]">{intro}</p>
      <div className="mt-8 space-y-7">
        {sections.map((s, i) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold">
              {i + 1}. {s.h}
            </h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {s.p.map((x) => (
                <p key={x}>{x}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <SellerBlock />
    </div>
  );
}

export function SellerBlock() {
  return (
    <div className="mt-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 text-sm text-[var(--color-text-muted)]">
      <div className="font-semibold text-white">Продавец и контакты</div>
      <p className="mt-2">
        {config.legal.seller || "Магазин Diority. Реквизиты продавца будут опубликованы здесь после государственной регистрации."}
      </p>
      <p className="mt-1">
        Поддержка: Telegram @{config.telegram.botUsername} (команда /paysupport) и @{config.telegram.adminUsername}, почта{" "}
        {config.contact.email}.
      </p>
    </div>
  );
}
