import {getProducts} from '@/src/fsd/entities/product';
import CheckoutForm from './CheckoutForm';
import styles from './checkout-page.module.css';

type CartItemParam = {
  product_id: string;
  quantity: number;
};

function formatPrice(amount: number) {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

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
  const products = await getProducts();
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
  const total = checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Оформление заказа</h1>
      <p className={styles.subtitle}>
        Заполните данные для доставки. Заказ попадёт к администраторам на проверку. После
        подтверждения вам на email придёт письмо с составом заказа.
      </p>

      <div className={styles.layout}>
        <CheckoutForm items={items} totalFormatted={formatPrice(total)} />

        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Ваш заказ</h2>
          {checkoutItems.map((item) => (
            <div key={item.product.id} className={styles.item}>
              <div className={styles.itemTitle}>{item.product.title}</div>
              <div className={styles.itemMeta}>
                {item.quantity} × {item.product.priceFormatted}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
