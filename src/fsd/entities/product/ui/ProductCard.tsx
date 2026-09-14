'use client';

import {useEffect, useState, type MouseEvent} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Minus, Plus} from 'lucide-react';
import {
  addToStoredCart,
  CART_UPDATED_EVENT,
  getStoredCartItemQuantity,
  setStoredCartQuantity,
} from '@/src/fsd/shared/lib';
import {getProductHref, type Product} from '../model/products';
import styles from './ProductCard.module.css';

const FALLBACK_PRODUCT_IMAGE = '/ducati-logo.png';

type Props = Pick<
  Product,
  | 'id'
  | 'sku'
  | 'oldSku'
  | 'image'
  | 'title'
  | 'desc'
  | 'priceFormatted'
  | 'priceRubFormatted'
  | 'oldPrice'
  | 'discountBadge'
> & {
  showAddToCart?: boolean;
};

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
  oldSku,
  showAddToCart = false,
}: Props) {
  const href = getProductHref({id, sku, title});
  const [imageSrc, setImageSrc] = useState(image);
  const [cartQuantity, setCartQuantity] = useState(0);
  const titleWithArticle =
    sku && !title.toUpperCase().includes(sku.toUpperCase()) ? `${sku} ${title}` : title;

  useEffect(() => {
    if (!showAddToCart) {
      return;
    }

    function syncQuantity() {
      setCartQuantity(getStoredCartItemQuantity(id));
    }

    syncQuantity();
    window.addEventListener(CART_UPDATED_EVENT, syncQuantity);
    return () => window.removeEventListener(CART_UPDATED_EVENT, syncQuantity);
  }, [id, showAddToCart]);

  function handleAddToCart(event: MouseEvent) {
    event.preventDefault();
    addToStoredCart(id, 1);
  }

  function handleIncrease(event: MouseEvent) {
    event.preventDefault();
    setStoredCartQuantity(id, cartQuantity + 1);
  }

  function handleDecrease(event: MouseEvent) {
    event.preventDefault();
    setStoredCartQuantity(id, cartQuantity - 1);
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
            className={
              imageSrc === FALLBACK_PRODUCT_IMAGE
                ? `${styles.image} ${styles.fallbackImage}`
                : styles.image
            }
            sizes="(max-width: 767px) 100vw, 280px"
            referrerPolicy="no-referrer"
            onError={() => setImageSrc(FALLBACK_PRODUCT_IMAGE)}
          />
        </div>

        <div className={styles.content}>
          <h3 className={oldSku ? `${styles.title} ${styles.titleWithOldSku}` : styles.title}>
            {titleWithArticle}
            {oldSku && (
              <>
                <br />
                <span className={styles.oldSku}>{oldSku}</span>
              </>
            )}
          </h3>
          <p className={styles.description}>{desc}</p>

          <div className={styles.priceBlock}>
            {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
            <div className={styles.priceRow}>
              <span className={styles.price}>{priceFormatted}</span>
              {priceRubFormatted && <span className={styles.priceRub}>{priceRubFormatted}</span>}
            </div>
          </div>
        </div>
      </Link>

      {showAddToCart &&
        (cartQuantity > 0 ? (
          <div className={styles.addToCartStepper}>
            <button
              type="button"
              onClick={handleDecrease}
              className={styles.addToCartStepperButton}
              aria-label="Уменьшить количество"
            >
              <Minus className={styles.addToCartIcon} />
            </button>
            <span className={styles.addToCartStepperValue}>{cartQuantity} шт</span>
            <button
              type="button"
              onClick={handleIncrease}
              className={styles.addToCartStepperButton}
              aria-label="Увеличить количество"
            >
              <Plus className={styles.addToCartIcon} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={handleAddToCart} className={styles.addToCartButton}>
            <Plus className={styles.addToCartIcon} />В корзину
          </button>
        ))}
    </article>
  );
}
