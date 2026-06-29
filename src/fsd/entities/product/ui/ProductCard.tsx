'use client';

import Image from 'next/image';
import Link from 'next/link';
import {Check} from 'lucide-react';
import type {Product} from '../model/products';
import styles from './ProductCard.module.css';

export default function ProductCard({
  id,
  image,
  title,
  desc,
  priceFormatted,
  oldPrice,
  badgeText,
  badgeColor = 'green',
  discountBadge,
  isAvailableInMoscow,
  isLastInMilan,
}: Pick<
  Product,
  | 'id'
  | 'image'
  | 'title'
  | 'desc'
  | 'priceFormatted'
  | 'oldPrice'
  | 'badgeText'
  | 'badgeColor'
  | 'discountBadge'
  | 'isAvailableInMoscow'
  | 'isLastInMilan'
>) {
  const statusBadgeClass =
    badgeColor === 'gray' ? `${styles.badge} ${styles.grayBadge}` : `${styles.badge} ${styles.greenBadge}`;

  return (
    <Link href={`/product/${id}`} className={styles.card}>
      <div className={styles.badgeGroup}>
        {badgeText && <span className={statusBadgeClass}>{badgeText}</span>}
      </div>
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

        {isAvailableInMoscow && (
          <div className={styles.availability}>
            <Check className={styles.availabilityIcon} />
            <span className={styles.availabilityText}>В наличии на складе в Москве</span>
          </div>
        )}
        {isLastInMilan && (
          <div className={styles.milanStock}>
            <div className={styles.milanTitle}>
              Last items in stock <span className={styles.fireBadge}>🔥</span>
            </div>
            <span className={styles.milanNote}>Цена указана &quot;до двери&quot; после...</span>
          </div>
        )}

        <div className={styles.priceBlock}>
          {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
          <span className={styles.price}>{priceFormatted}</span>
        </div>
      </div>
    </Link>
  );
}
