'use client';

import {useState, type MouseEvent} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Check, Plus} from 'lucide-react';
import {addToStoredCart} from '@/src/fsd/shared/lib';
import {getProductHref, type Product} from '../model/products';
import styles from './ProductCard.module.css';

const FALLBACK_PRODUCT_IMAGE = '/ducati-logo.png';

type Props = Pick<
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
  showAddToCart = false,
}: Props) {
  const href = getProductHref({id, sku, title});
  const [imageSrc, setImageSrc] = useState(image);
  const [added, setAdded] = useState(false);
  const titleWithArticle =
    sku && !title.toUpperCase().includes(sku.toUpperCase()) ? `${sku} ${title}` : title;

  function handleAddToCart(event: MouseEvent) {
    event.preventDefault();
    addToStoredCart(id);
    setAdded(true);
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
          <h3 className={styles.title}>{titleWithArticle}</h3>
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

      {showAddToCart && (
        <button type="button" onClick={handleAddToCart} className={styles.addToCartButton}>
          {added ? (
            <>
              <Check className={styles.addToCartIcon} />В корзине
            </>
          ) : (
            <>
              <Plus className={styles.addToCartIcon} />В корзину
            </>
          )}
        </button>
      )}
    </article>
  );
}
