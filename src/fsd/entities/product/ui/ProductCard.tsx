'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {BarChart3, Heart} from 'lucide-react';
import {CART_STORAGE_KEY, notifyCartUpdated, type StoredCartItem} from '@/src/fsd/shared/lib';
import {getProductHref, type Product} from '../model/products';
import styles from './ProductCard.module.css';

export default function ProductCard({
  id,
  title,
  desc,
  priceFormatted,
  oldPrice,
  discountBadge,
  sku,
}: Pick<
  Product,
  | 'id'
  | 'sku'
  | 'title'
  | 'desc'
  | 'priceFormatted'
  | 'oldPrice'
  | 'discountBadge'
>) {
  const router = useRouter();
  const href = getProductHref({id, sku, title});

  function addToCart() {
    let cart: StoredCartItem[] = [];

    try {
      const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
      cart = rawCart ? (JSON.parse(rawCart) as StoredCartItem[]) : [];
    } catch {
      cart = [];
    }

    const existing = cart.find((item) => item.product_id === id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + 1, 99);
    } else {
      cart.push({product_id: id, quantity: 1});
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    notifyCartUpdated();
    router.push('/cart');
  }

  return (
    <article className={styles.card}>
      {discountBadge && <span className={styles.preorderBadge}>{discountBadge}</span>}

      <Link href={href} className={styles.mainLink} aria-label={title}>
        <div className={styles.imageBox}>
          <div className={styles.placeholder} aria-hidden="true">
            <span>DUCATI</span>
          </div>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{desc || 'Цена указана до двери после всех расходов.'}</p>

          <div className={styles.priceBlock}>
            {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
            <span className={styles.price}>{priceFormatted}</span>
          </div>
        </div>
      </Link>

      <div className={styles.actions}>
        <button type="button" onClick={addToCart} className={styles.cartButton}>
          В корзину
        </button>
        <button type="button" className={styles.iconButton} aria-label="В избранное">
          <Heart className={styles.actionIcon} />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Сравнить">
          <BarChart3 className={styles.actionIcon} />
        </button>
      </div>
    </article>
  );
}
