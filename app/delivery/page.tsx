import Link from 'next/link';
import styles from '../info-page.module.css';

export default function DeliveryPage() {
  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link href="/">
          Главная
        </Link>
        <span>/</span>
        <span className={styles.current}>Оплата и доставка</span>
      </div>
      <h1 className={styles.title}>Оплата и доставка</h1>
      <div className={styles.content}>
        <p>
          <strong>Оплата:</strong> банковская карта (Visa, Mastercard, МИР), перевод по
          реквизитам, оплата при получении — для товаров со склада в Москве.
        </p>
        <p>
          <strong>Доставка по России:</strong> СДЭК, Почта России, курьер по Москве. Сроки
          зависят от наличия: товары со склада в Москве — 1–3 дня, предзаказ из Италии — 4–6
          недель.
        </p>
        <p>
          <strong>Цена «до двери»</strong> для товаров из Милана включает доставку, таможенные
          расходы и пошлины.
        </p>
      </div>
    </div>
  );
}
