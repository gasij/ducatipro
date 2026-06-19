'use client';

import {useEffect, useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ChevronRight, Heart, Star} from 'lucide-react';
import type {Product} from '@/src/fsd/entities/product';
import {gsap, registerGsap} from '@/src/fsd/shared/lib';
import styles from './ProductView.module.css';

export default function ProductView({product}: {product: Product}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.gallery}`, {
        x: -60,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });

      gsap.from(`.${styles.info} > *`, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.15,
      });

      gsap.from(`.${styles.contentBlock}, .${styles.reviewsBlock}`, {
        y: 50,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: `.${styles.details}`,
          start: 'top 85%',
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [product.id]);

  const statusBadgeClass =
    product.badgeColor === 'gray'
      ? `${styles.badge} ${styles.grayBadge}`
      : `${styles.badge} ${styles.greenBadge}`;

  return (
    <div ref={ref} className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link href="/">Главная</Link>
        <ChevronRight className={styles.breadcrumbIcon} />
        <Link href="/catalog">Каталог</Link>
        <ChevronRight className={styles.breadcrumbIcon} />
        <span className={styles.breadcrumbCurrent}>{product.title}</span>
      </div>

      <div className={styles.summary}>
        <div className={styles.gallery}>
          <div className={styles.thumbnails}>
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                className={`${styles.thumbnail} ${i === 0 ? styles.thumbnailActive : ''}`}
              >
                <Image
                  src={`https://picsum.photos/seed/${product.id}thumb${i}/100/100`}
                  fill
                  alt="thumb"
                  className={styles.thumbnailImage}
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
          <div className={styles.mainImageBox}>
            {product.badgeText && (
              <div className={styles.badgeGroup}>
                <span className={statusBadgeClass}>{product.badgeText}</span>
              </div>
            )}
            <Image
              src={product.image}
              fill
              alt={product.title}
              className={styles.mainImage}
              priority
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{product.title}</h1>

          <div className={styles.ratingRow}>
            <div className={styles.rating}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={styles.starIcon} />
                ))}
              </div>
              <span>(0)</span>
            </div>
            <Link href="/favorites" className={styles.favoriteLink}>
              <Heart className={styles.favoriteIcon} />
              В избранное
            </Link>
          </div>

          <div className={styles.purchaseBox}>
            <div className={styles.priceGroup}>
              {product.oldPrice && <span className={styles.oldPrice}>{product.oldPrice}</span>}
              <div className={styles.price}>{product.priceFormatted}</div>
            </div>
            <div className={styles.purchaseActions}>
              <div className={styles.quantity}>
                <button type="button" className={styles.quantityButton}>
                  -
                </button>
                <input type="text" value="1" readOnly className={styles.quantityInput} />
                <button type="button" className={styles.quantityButton}>
                  +
                </button>
              </div>
              <Link href="/cart" className={styles.cartButton}>
                В корзину 1 шт
                <span className={styles.cartHint}>Перейти</span>
              </Link>
            </div>
          </div>

          <div className={styles.deliveryNote}>
            {product.isAvailableInMoscow && (
              <p className={styles.greenText}>В наличии на складе в Москве</p>
            )}
            {product.isLastInMilan && (
              <p>
                Last items in stock 🔥 Цена указана &quot;до двери&quot; после всех расходов и
                пошлин.
              </p>
            )}
            {!product.isAvailableInMoscow && !product.isLastInMilan && (
              <p>
                Предзаказ. <span className={styles.greenText}>Цена указана до двери</span> 📦 после
                всех расходов и пошлин. Общий срок поставки в Россию 4-6 недель
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detailsInner}>
          <div className={styles.contentBlock}>
            <h3 className={styles.blockTitle}>Описание</h3>
            <div className={styles.textContent}>
              {product.desc && <p>{product.desc}</p>}
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p>
                  Оригинальная запчасть для мотоциклов Ducati. Подробности уточняйте у менеджера в
                  Telegram: @ducatiparts
                </p>
              )}
            </div>
          </div>

          {product.specs && product.specs.length > 0 && (
            <div className={styles.contentBlock}>
              <h3 className={styles.blockTitle}>Характеристики</h3>
              <div className={styles.specGrid}>
                {product.specs.map((spec) => (
                  <div key={spec.label} className={styles.specRow}>
                    <span className={styles.specLabel}>{spec.label}</span>
                    <span className={styles.specValue}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.reviewsBlock}>
            <h3 className={`${styles.blockTitle} ${styles.reviewTitle}`}>Отзывы</h3>
            <p className={styles.reviewText}>Отзывов еще никто не оставлял</p>
            <button type="button" className={styles.reviewButton}>
              Написать отзыв
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
