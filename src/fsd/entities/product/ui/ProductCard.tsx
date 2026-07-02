'use client';

import Image from 'next/image';
import Link from 'next/link';
import {getProductHref, type Product} from '../model/products';
import styles from './ProductCard.module.css';

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
  return (
    <Link href={getProductHref({id, sku, title})} className={styles.card}>
      <div className={styles.discountGroup}>
        {discountBadge && <span className={styles.discountBadge}>{discountBadge}</span>}
      </div>

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
        {desc ? <p className={styles.description}>{desc}</p> : <div className={styles.spacer} />}

        <div className={styles.priceBlock}>
          {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
          <span className={styles.price}>{priceFormatted}</span>
        </div>
      </div>
    </Link>
  );
}
