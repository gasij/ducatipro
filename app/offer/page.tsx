import Link from 'next/link';
import {getSiteTexts, pickSiteText, pickSiteTextUrl} from '@/src/fsd/shared/lib';
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

export default async function OfferPage() {
  const siteTexts = await getSiteTexts();

  const intro = pickSiteText(
    siteTexts,
    'offer.intro',
    'Настоящая публичная оферта регулирует порядок продажи запчастей и аксессуаров для мотоциклов Ducati через интернет-магазин.',
  );
  const consent = pickSiteText(
    siteTexts,
    'offer.consent',
    'Оформляя заказ, покупатель подтверждает согласие с условиями оферты и политикой обработки персональных данных. Мы обрабатываем только данные, необходимые для исполнения заказа и доставки.',
  );
  const contactLine = pickSiteText(siteTexts, 'offer.contact_line', 'По вопросам:');
  const contactTelegram = pickSiteText(siteTexts, 'offer.contact_telegram', '@ducatiparts');
  const contactTelegramUrl = pickSiteTextUrl(
    siteTexts,
    'offer.contact_telegram',
    'https://t.me/ducatiparts',
  );

  return (
    <InfoPage title="Оферта и политика конфиденциальности">
      <p>{intro}</p>
      <p>{consent}</p>
      <p>
        {contactLine}{' '}
        <a href={contactTelegramUrl}>
          {contactTelegram}
        </a>
      </p>
    </InfoPage>
  );
}
