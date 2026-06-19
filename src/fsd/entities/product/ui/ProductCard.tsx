'use client';

import {useEffect, useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Check} from 'lucide-react';
import {gsap} from '@/src/fsd/shared/lib';
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
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onEnter = () => {
      gsap.to(card, {
        y: -6,
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        duration: 0.35,
        ease: 'power2.out',
      });
    };
    const onLeave = () => {
      gsap.to(card, {
        y: 0,
        boxShadow: '0 0 0 rgba(0,0,0,0)',
        duration: 0.35,
        ease: 'power2.out',
      });
    };

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);
    return () => {
      card.removeEventListener('mouseenter', onEnter);
      card.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const statusBadgeClass =
    badgeColor === 'gray' ? `${styles.badge} ${styles.grayBadge}` : `${styles.badge} ${styles.greenBadge}`;

  return (
    <Link ref={cardRef} href={`/product/${id}`} className={styles.card}>
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
