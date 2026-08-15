import {getProducts} from '@/src/fsd/entities/product';
import {getCurrentEurToRubRate} from '@/src/fsd/shared/lib';
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
  const [products, eurToRubRate] = await Promise.all([getProducts(), getCurrentEurToRubRate()]);
  const cartItems = parseCartItems(params?.items);
  const resolvedItems = cartItems
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.product_id);
      return product ? {product, quantity: item.quantity} : null;
    })
    .filter((item): item is {product: (typeof products)[number]; quantity: number} => Boolean(item));
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
      <CheckoutForm items={items} checkoutItems={checkoutItems} eurToRubRate={eurToRubRate} />
    </div>
  );
}
