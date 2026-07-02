import {getProducts} from '@/src/fsd/entities/product';
import CheckoutForm from './CheckoutForm';
import styles from './checkout-page.module.css';

export default async function CheckoutPage() {
  const products = await getProducts();
  const cartItem = products.find((product) => product.id === '1') ?? products[0];

  if (!cartItem) {
    return null;
  }

  const items = [
    {
      product_id: cartItem.id,
      title: cartItem.title,
      quantity: 1,
      price: cartItem.price,
      price_formatted: cartItem.priceFormatted,
    },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Оформление заказа</h1>
      <p className={styles.subtitle}>
        Заполните данные для доставки. Заказ попадёт к администраторам на проверку. После
        подтверждения вам на email придёт письмо с составом заказа.
      </p>

      <div className={styles.layout}>
        <CheckoutForm items={items} totalFormatted={cartItem.priceFormatted} />

        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Ваш заказ</h2>
          {items.map((item) => (
            <div key={item.product_id} className={styles.item}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.itemMeta}>
                {item.quantity} × {item.price_formatted}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
