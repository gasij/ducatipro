'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {BarChart3, Heart} from 'lucide-react';
import {getProductHref, type Product} from '../model/products';
import styles from './ProductCard.module.css';

const CART_STORAGE_KEY = 'ducati-cart';

export default function ProductCard({
  id,
  image,
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
  | 'image'
  | 'title'
  | 'desc'
  | 'priceFormatted'
  | 'oldPrice'
  | 'discountBadge'
>) {
  const router = useRouter();
  const href = getProductHref({id, sku, title});
  const preorderLabel = discountBadge || 'Предзаказ';

  function addToCart() {
    let cart: Array<{product_id: string; quantity: number}> = [];

    try {
      const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
      cart = rawCart ? (JSON.parse(rawCart) as Array<{product_id: string; quantity: number}>) : [];
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
    router.push('/cart');
  }

  return (
    <article className={styles.card}>
      <span className={styles.preorderBadge}>{preorderLabel}</span>

      <Link href={href} className={styles.mainLink} aria-label={title}>
        <div className={styles.imageBox}>
          <Image
            src={image}
            alt={title}
            fill
            className={styles.image}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          {desc ? (
            <p className={styles.description}>{desc}</p>
          ) : (
            <p className={styles.description}>Предзаказ. Цена указана до двери 📦 после всех расходов и...</p>
          )}

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
