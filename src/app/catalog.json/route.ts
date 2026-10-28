import { getActiveProducts, requirementFor, shopSkuOf } from "@/data/catalog";

/**
 * Каталог для сервера магазина (бот, мини-приложение, оплата звёздами и криптой).
 * Собирается вместе с сайтом в out/catalog.json; deploy_shop.py кладёт его на сервер.
 * Позиции из реестра Tribute сюда не входят — у сервера свой реестр с их суммами.
 * Цены — те же, что на витрине; себестоимости здесь нет.
 */
export const dynamic = "force-static";

export function GET() {
  const products = getActiveProducts()
    .filter((p) => !p.paySku && !p.inquiryOnly)
    .map((p) => ({
      sku: shopSkuOf(p),
      title: `${p.category} — ${p.name}`,
      group: p.categorySlug,
      currency: "RUB",
      amount_minor: p.priceRub * 100,
      input_prompt: requirementFor(p).text,
      fulfilment: "owner_manual",
      catalog_enabled: true,
      source: "site",
    }));
  return Response.json({ updated: new Date().toISOString().slice(0, 10), products });
}
