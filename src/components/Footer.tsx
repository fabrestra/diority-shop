import Link from "next/link";
import { LogoMark } from "./Logo";
import { config } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <LogoMark size={32} />
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              {config.brand.tagline}
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Магазин</h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li><Link className="hover:text-white" href="/catalog">Каталог</Link></li>
              <li><Link className="hover:text-white" href="/faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">О сервисе</h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li><Link className="hover:text-white" href="/about">О нас</Link></li>
              <li><Link className="hover:text-white" href="/contacts">Контакты</Link></li>
              <li><Link className="hover:text-white" href="/payment">Оплата и возврат</Link></li>
              <li><Link className="hover:text-white" href="/terms">Пользовательское соглашение</Link></li>
              <li><Link className="hover:text-white" href="/privacy">Конфиденциальность</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Связь</h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>
                <a className="hover:text-white" href={`https://t.me/${config.telegram.channelUsername}`} target="_blank" rel="noopener noreferrer">
                  Telegram канал
                </a>
              </li>
              <li>
                <a className="hover:text-white" href={`https://t.me/${config.telegram.adminUsername}`} target="_blank" rel="noopener noreferrer">
                  Поддержка
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-text-muted)]">
          <p>© {new Date().getFullYear()} {config.brand.name}. {config.legal.seller || "Реквизиты продавца будут указаны после регистрации."}</p>
          <p className="mt-1">Доступные способы оплаты показаны на странице товара. Перед оплатой согласуйте условия и срок. Diority не связан с правообладателями игр и сервисов.</p>
        </div>
      </div>
    </footer>
  );
}
