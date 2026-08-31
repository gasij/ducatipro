'use client';

import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Truck} from 'lucide-react';
import {getExpectedDeliveryDateRange} from '@/src/fsd/shared/lib';
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
  const href = getProductHref({id, sku, title});
  const [imageSrc, setImageSrc] = useState(image);
  const expectedDeliveryDate = getExpectedDeliveryDateRange();
  const titleWithArticle =
    sku && !title.toUpperCase().includes(sku.toUpperCase()) ? `${sku} ${title}` : title;

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

          <div className={styles.deliveryNotice}>
            <Truck className={styles.deliveryIcon} />
            <span>Доставка: {expectedDeliveryDate}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
