import Link from 'next/link';
import styles from '../info-page.module.css';

export default function LoyaltyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link href="/">
          Главная
        </Link>
        <span>/</span>
        <span className={styles.current}>Программа лояльности</span>
      </div>
      <h1 className={styles.title}>
        Программа лояльности
      </h1>
      <div className={styles.content}>
        <p>
          За каждый оплаченный заказ начисляются бонусные баллы — 3% от суммы покупки. Баллы
          можно использовать при следующем заказе.
        </p>
        <p>
          Постоянным клиентам — персональные скидки и приоритетная обработка предзаказов из
          Италии.
        </p>
        <p>
          Участие в программе автоматическое — напишите нам в{' '}
          <a href="https://t.me/ducatiparts">
            Telegram
          </a>
          .
        </p>
      </div>
    </div>
  );
}
