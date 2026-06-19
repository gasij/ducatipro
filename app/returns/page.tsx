import Link from 'next/link';
import styles from '../info-page.module.css';

export default function ReturnsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link href="/">
          Главная
        </Link>
        <span>/</span>
        <span className={styles.current}>Условия обмена и возврата</span>
      </div>
      <h1 className={styles.title}>
        Условия обмена и возврата
      </h1>
      <div className={styles.content}>
        <p>
          Возврат товара надлежащего качества возможен в течение 14 дней с момента получения,
          если сохранён товарный вид и упаковка.
        </p>
        <p>
          Запчасти, изготовленные под заказ или поставленные из Италии, возврату не подлежат,
          если иное не согласовано с менеджером.
        </p>
        <p>
          Для оформления возврата свяжитесь с нами в Telegram:{' '}
          <a href="https://t.me/ducatiparts">
            @ducatiparts
          </a>
        </p>
      </div>
    </div>
  );
}
