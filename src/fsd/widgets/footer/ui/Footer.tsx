'use client';

import {ArrowUp} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {pickSiteText, pickSiteTextUrl, type SiteTextsMap} from '@/src/fsd/shared/lib';
import styles from './Footer.module.css';

const OUTLET_URL = 'https://ducatiparts.pro/collection/outlet';
const CATALOG_URL = 'https://ducatiparts.pro/collection/all';

export default function Footer({siteTexts = {}}: {siteTexts?: SiteTextsMap}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.columns}>
          <div>
            <h4 className={styles.columnTitle}>Содержание</h4>
            <ul className={styles.linkList}>
              <li>
                <Link
                  href={pickSiteTextUrl(siteTexts, 'footer.link_catalog', CATALOG_URL)}
                  className={styles.footerLink}
                >
                  {pickSiteText(siteTexts, 'footer.link_catalog', 'Каталог')}
                </Link>
              </li>
              <li>
                <Link
                  href={pickSiteTextUrl(siteTexts, 'footer.link_outlet', OUTLET_URL)}
                  className={styles.footerLink}
                >
                  {pickSiteText(siteTexts, 'footer.link_outlet', 'Аутлет в Милане')}
                </Link>
              </li>
              <li>
                <Link
                  href={pickSiteTextUrl(siteTexts, 'footer.link_unsorted', '/catalog-oem')}
                  className={styles.footerLink}
                >
                  {pickSiteText(siteTexts, 'footer.link_unsorted', 'Каталог OEM')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={styles.columnTitle}>Для покупателя</h4>
            <ul className={styles.linkList}>
              <li>
                <Link
                  href={pickSiteTextUrl(siteTexts, 'footer.link_offer', '/offer')}
                  className={styles.footerLink}
                >
                  {pickSiteText(siteTexts, 'footer.link_offer', 'Оферта и политика конфиденциальности')}
                </Link>
              </li>
              <li>
                <Link
                  href={pickSiteTextUrl(siteTexts, 'footer.link_returns', '/returns')}
                  className={styles.footerLink}
                >
                  {pickSiteText(siteTexts, 'footer.link_returns', 'Условия обмена и возврата')}
                </Link>
              </li>
              <li>
                <Link
                  href={pickSiteTextUrl(siteTexts, 'footer.link_delivery', '/delivery')}
                  className={styles.footerLink}
                >
                  {pickSiteText(siteTexts, 'footer.link_delivery', 'Оплата и доставка')}
                </Link>
              </li>
              <li>
                <Link
                  href={pickSiteTextUrl(siteTexts, 'footer.link_loyalty', '/loyalty')}
                  className={styles.footerLink}
                >
                  {pickSiteText(siteTexts, 'footer.link_loyalty', 'Программа лояльности')}
                </Link>
              </li>
            </ul>
          </div>
          <div className={styles.contacts}>
            <div className={styles.contactGroup}>
              <a
                href={pickSiteTextUrl(siteTexts, 'footer.contact_phone', 'tel:+79025565242')}
                className={styles.contactLink}
              >
                {pickSiteText(siteTexts, 'footer.contact_phone', '+79025565242')}
              </a>
              <div className={styles.contactNote}>
                {pickSiteText(siteTexts, 'footer.contact_phone_note', 'только Max (не для звонков)')}
              </div>
            </div>
            <div className={styles.contactGroup}>
              <a
                href={pickSiteTextUrl(siteTexts, 'footer.contact_telegram', 'https://t.me/ducatiparts')}
                className={styles.contactLink}
              >
                {pickSiteText(siteTexts, 'footer.contact_telegram', '@ducatiparts')}
              </a>
              <div className={styles.contactNote}>
                {pickSiteText(siteTexts, 'footer.contact_telegram_note', 'наш Telegram для связи')}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <Link href="/" className={styles.brand}>
            <Image
              src="/logo.svg"
              alt="Оригинальные запчасти Дукати"
              width={220}
              height={42}
              className={styles.logo}
            />
          </Link>

          <div className={styles.payments}>
            <div className={styles.mastercard}>
              <div className={`${styles.cardCircle} ${styles.cardRed}`} />
              <div className={`${styles.cardCircle} ${styles.cardYellow}`} />
            </div>
            <div className={styles.visa}>VISA</div>
            <div className={styles.mir}>МИР</div>
          </div>
        </div>

      </div>
    </footer>
  );
}
