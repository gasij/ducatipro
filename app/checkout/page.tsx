import {getProduct, getProducts, type Product} from '@/src/fsd/entities/product';
import {getCurrentEurToRubRate, getRateMarkupPercent, getSiteTexts} from '@/src/fsd/shared/lib';
import CheckoutForm from './CheckoutForm';
import styles from './checkout-page.module.css';

type CartItemParam = {
  product_id: string;
  quantity: number;
};

function parseCartItems(value?: string | string[]): CartItemParam[] {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (
          !item ||
          typeof item !== 'object' ||
          typeof (item as CartItemParam).product_id !== 'string' ||
          typeof (item as CartItemParam).quantity !== 'number'
        ) {
          return null;
        }

        return {
          product_id: (item as CartItemParam).product_id,
          quantity: Math.min(Math.max(Math.floor((item as CartItemParam).quantity), 1), 99),
        };
      })
      .filter((item): item is CartItemParam => Boolean(item));
  } catch {
    return [];
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [products, eurToRubRate, rateMarkupPercent, siteTexts] = await Promise.all([
    getProducts(),
    getCurrentEurToRubRate(),
    getRateMarkupPercent(),
    getSiteTexts(),
  ]);
  const cartItems = parseCartItems(params?.items);
  // Resolve each cart item directly by id — `products` below is capped to a
  // page of the catalog, so a product outside that page still resolves.
  const resolvedProducts = await Promise.all(
    cartItems.map((item) => getProduct(item.product_id).catch(() => undefined)),
  );
  const resolvedItems = cartItems
    .map((item, index) => {
      const product = resolvedProducts[index];
      return product ? {product, quantity: item.quantity} : null;
    })
    .filter((item): item is {product: Product; quantity: number} => Boolean(item));
  const fallbackItem = products.find((product) => product.id === '1') ?? products[0];
  const checkoutItems =
    resolvedItems.length > 0
      ? resolvedItems
      : fallbackItem
        ? [{product: fallbackItem, quantity: 1}]
        : [];

  if (checkoutItems.length === 0) {
    return null;
  }

  const items = checkoutItems.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
  }));
  return (
    <div className={styles.page}>
      <CheckoutForm
        items={items}
        checkoutItems={checkoutItems}
        eurToRubRate={eurToRubRate}
        rateMarkupPercent={rateMarkupPercent}
        siteTexts={siteTexts}
      />
    </div>
  );
}
