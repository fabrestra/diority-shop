/**
 * Позиция каталога в том виде, в каком её пишет человек:
 * только долларовая цена. Рубли считаются в catalog.ts.
 */
export type ProductInput = {
  /**
   * Артикул — внутренний код позиции: APL-25, BS-PASS, TG-STARS500.
   * Один и тот же в рабочей книге, на витрине площадок, в имени файла обложки
   * и здесь. Покупателю не показывается: это ключ учёта, а не название.
   */
  art: string;
  slug: string;
  category: string;
  categorySlug: string;
  platform: string;
  name: string;
  /** Официальная цена в USD — единственная цена, которую вводим руками */
  priceUsd: number;
  /** Индивидуальная наценка (0.08 = +8%). Если не задана — берётся ступень по себестоимости */
  markup?: number;
  status: string;
  note: string;
};

/**
 * Позиция для витрины. Себестоимости и наценки здесь НЕТ намеренно:
 * каталог импортируется клиентскими компонентами, а значит всё, что
 * лежит в этом типе, уезжает в JS-бандл и читается через F12.
 * Конкуренту не нужно знать, почём мы закупаем.
 */
export type Product = Omit<ProductInput, "markup"> & {
  id: number;
  /** Розница в рублях: себестоимость + наценка, округлённая до магазинного вида */
  priceRub: number;
};

/**
 * Позиция с внутренними цифрами — для учёта и журнала закупок.
 * Живёт в margins.ts, который не импортирует ни один компонент.
 */
export type ProductInternal = Product & {
  markup?: number;
  /** Себестоимость в рублях: priceUsd × USD_COST_RATE */
  costRub: number;
  /** priceRub − costRub */
  marginRub: number;
};

export type Category = {
  name: string;
  slug: string;
  description: string;
};

/** Что покупатель должен прислать, чтобы мы оформили заказ */
export type Requirement = {
  /** Короткий заголовок блока */
  title: string;
  /** Что именно нужно прислать, человеческим языком */
  text: string;
};

/** Условия гарантии по типу товара */
export type Warranty = {
  /** Короткая метка для карточки: «24 часа», «до активации» */
  label: string;
  /** Что именно покрывается */
  covers: string;
  /** Что не покрывается — это и есть защита продавца */
  excludes: string;
};
