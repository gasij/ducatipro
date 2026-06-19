import Link from 'next/link';
import styles from '../info-page.module.css';

type Props = {
  title: string;
  children: React.ReactNode;
};

function InfoPage({title, children}: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link href="/">
          Главная
        </Link>
        <span>/</span>
        <span className={styles.current}>{title}</span>
      </div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}

export default function OfferPage() {
  return (
    <InfoPage title="Оферта и политика конфиденциальности">
      <p>
        Настоящая публичная оферта регулирует порядок продажи запчастей и аксессуаров для
        мотоциклов Ducati через интернет-магазин.
      </p>
      <p>
        Оформляя заказ, покупатель подтверждает согласие с условиями оферты и политикой
        обработки персональных данных. Мы обрабатываем только данные, необходимые для
        исполнения заказа и доставки.
      </p>
      <p>
        По вопросам:{' '}
        <a href="https://t.me/ducatiparts">
          @ducatiparts
        </a>
      </p>
    </InfoPage>
  );
}
