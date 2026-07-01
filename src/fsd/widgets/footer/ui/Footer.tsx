'use client';

import {ArrowUp} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.columns}>
          <div>
            <h4 className={styles.columnTitle}>Содержание</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/catalog" className={styles.footerLink}>
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/outlet" className={styles.footerLink}>
                  Аутлет в Милане
                </Link>
              </li>
              <li>
                <Link href="/unsorted" className={styles.footerLink}>
                  Товары без сортировки
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={styles.columnTitle}>Для покупателя</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/offer" className={styles.footerLink}>
                  Оферта и политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/returns" className={styles.footerLink}>
                  Условия обмена и возврата
                </Link>
              </li>
              <li>
                <Link href="/delivery" className={styles.footerLink}>
                  Оплата и доставка
                </Link>
              </li>
              <li>
                <Link href="/loyalty" className={styles.footerLink}>
                  Программа лояльности
                </Link>
              </li>
            </ul>
          </div>
          <div className={styles.contacts}>
            <div className={styles.contactGroup}>
              <a href="tel:+79025565242" className={styles.contactLink}>
                +79025565242
              </a>
              <div className={styles.contactNote}>только Max (не для звонков)</div>
            </div>
            <div className={styles.contactGroup}>
              <a href="https://t.me/ducatiparts" className={styles.contactLink}>
                @ducatiparts
              </a>
              <div className={styles.contactNote}>наш Telegram для связи</div>
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
