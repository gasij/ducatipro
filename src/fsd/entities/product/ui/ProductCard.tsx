'use client';

import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {BarChart3, Heart} from 'lucide-react';
import {CART_STORAGE_KEY, notifyCartUpdated, type StoredCartItem} from '@/src/fsd/shared/lib';
import {getProductHref, type Product} from '../model/products';
import styles from './ProductCard.module.css';

const FALLBACK_PRODUCT_IMAGE = '/ducati-logo.png';

export default function ProductCard({
  id,
  title,
  desc,
  priceFormatted,
  priceRubFormatted,
  oldPrice,
  discountBadge,
  image,
  sku,
}: Pick<
  Product,
  | 'id'
  | 'sku'
  | 'image'
  | 'title'
  | 'desc'
  | 'priceFormatted'
  | 'priceRubFormatted'
  | 'oldPrice'
  | 'discountBadge'
>) {
  const router = useRouter();
  const href = getProductHref({id, sku, title});
  const [imageSrc, setImageSrc] = useState(image);
  const titleWithArticle =
    sku && !title.toUpperCase().startsWith(sku.toUpperCase()) ? `${sku} ${title}` : title;

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
          <Image
            src={imageSrc}
            fill
            alt={title}
            className={styles.image}
            sizes="(max-width: 767px) 100vw, 280px"
            referrerPolicy="no-referrer"
            onError={() => setImageSrc(FALLBACK_PRODUCT_IMAGE)}
          />
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{titleWithArticle}</h3>
          <p className={styles.description}>{desc || 'Цена указана до двери после всех расходов.'}</p>

          <div className={styles.priceBlock}>
            {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
            <span className={styles.price}>{priceFormatted}</span>
            {priceRubFormatted && <span className={styles.priceRub}>{priceRubFormatted}</span>}
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
