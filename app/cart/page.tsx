import Image from 'next/image';
import Link from 'next/link';
import {Trash2} from 'lucide-react';
import {getProduct} from '@/src/fsd/entities/product';
import styles from './cart-page.module.css';

export default function CartPage() {
  const cartItem = getProduct('1');

  if (!cartItem) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <h1 className={styles.title}>Корзина</h1>

          <div className={styles.items}>
            <div className={styles.cartItem}>
              <Link href={`/product/${cartItem.id}`} className={styles.itemImageLink}>
                <Image
                  src={cartItem.image}
                  fill
                  alt={cartItem.title}
                  className={styles.itemImage}
                  referrerPolicy="no-referrer"
                />
              </Link>

              <div className={styles.itemInfo}>
                <div className={styles.itemHeader}>
                  <Link href={`/product/${cartItem.id}`} className={styles.itemTitle}>
                    {cartItem.title}
                  </Link>
                  <button type="button" className={styles.removeButton} aria-label="Удалить">
                    <Trash2 className={styles.removeIcon} />
                  </button>
                </div>

                <div className={styles.unitPrice}>{cartItem.priceFormatted}/шт</div>

                <div className={styles.itemFooter}>
                  <div className={styles.quantity}>
                    <button type="button" className={styles.quantityButton}>
                      -
                    </button>
                    <input type="text" value="1" readOnly className={styles.quantityInput} />
                    <button type="button" className={styles.quantityButton}>
                      +
                    </button>
                  </div>
                  <div className={styles.lineTotal}>{cartItem.priceFormatted}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.recent}>
            <h2 className={styles.sectionTitle}>Ранее просмотренные</h2>
            <div className={styles.recentGrid}>
              <Link href={`/product/${cartItem.id}`} className={styles.recentCard}>
                <div className={styles.recentImageBox}>
                  <Image
                    src={cartItem.image}
                    fill
                    alt={cartItem.title}
                    className={styles.recentImage}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className={styles.recentInfo}>
                  <div className={styles.recentTitle}>{cartItem.title}</div>
                  <div className={styles.recentPrice}>{cartItem.priceFormatted}</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Введите промокод</h3>
            <div className={styles.promoForm}>
              <input type="text" placeholder="Промокод" className={styles.promoInput} />
              <button type="button" className={styles.promoButton} aria-label="Применить промокод">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.summaryRow}>
              <span>Товары (1)</span>
              <span>{cartItem.priceFormatted}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span className={styles.summaryLabel}>Итого:</span>
              <span className={styles.summaryPrice}>{cartItem.priceFormatted}</span>
            </div>
            <a
              href="https://t.me/ducatiparts"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.checkoutLink}
            >
              Оформить заказ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
