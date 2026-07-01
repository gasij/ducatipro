'use client';

import {useEffect, useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ChevronRight, Heart, ShieldCheck, Star, Truck} from 'lucide-react';
import type {Product} from '@/src/fsd/entities/product';
import {gsap, registerGsap} from '@/src/fsd/shared/lib';
import styles from './ProductView.module.css';

const CATEGORY_LABELS: Record<Product['category'], string> = {
  new: 'Новинка',
  discounted: 'Скидка в России',
  outlet: 'Аутлет в Милане',
  unsorted: 'Без сортировки',
};

export default function ProductView({product}: {product: Product}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.gallery}`, {
        x: -24,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
      });

      gsap.from(`.${styles.info} > *`, {
        y: 18,
        opacity: 0,
        duration: 0.45,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.12,
      });

      gsap.from(`.${styles.contentBlock}, .${styles.reviewsBlock}`, {
        y: 22,
        opacity: 0,
        duration: 0.5,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: `.${styles.details}`,
          start: 'top 85%',
          once: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [product.id]);

  const article = product.title.split(' ')[0];

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
          <div className={styles.kickerRow}>
            <span className={styles.categoryPill}>{CATEGORY_LABELS[product.category]}</span>
            <span className={styles.article}>Артикул: {article}</span>
          </div>

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

          <div className={styles.purchasePanel}>
            <div className={styles.purchaseHeader}>
              <div className={styles.priceGroup}>
                {product.oldPrice && <span className={styles.oldPrice}>{product.oldPrice}</span>}
                <div className={styles.price}>{product.priceFormatted}</div>
                <span className={styles.priceNote}>Итоговая цена для заказа</span>
              </div>
              {product.discountBadge && (
                <span className={styles.saleBadge}>{product.discountBadge}</span>
              )}
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

            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIconWrap}>
                <Truck className={styles.deliveryIcon} />
              </div>
              <div>
                <h2 className={styles.deliveryTitle}>Доставка до двери</h2>
                <p className={styles.deliveryText}>
                  Менеджер уточнит сроки и финальные условия после оформления заказа.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.quickFacts}>
            <div className={styles.fact}>
              <Truck className={styles.factIcon} />
              <div>
                <span className={styles.factLabel}>Доставка</span>
                <strong>До двери</strong>
              </div>
            </div>
            <div className={styles.fact}>
              <ShieldCheck className={styles.factIcon} />
              <div>
                <span className={styles.factLabel}>Проверка</span>
                <strong>Менеджером</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detailsInner}>
          <div className={`${styles.contentBlock} ${styles.descriptionBlock}`}>
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
            <div className={`${styles.contentBlock} ${styles.specsBlock}`}>
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
