'use client';

import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Bike, ChevronRight, Heart, Star, Truck} from 'lucide-react';
import {getProductArticle, type Product} from '@/src/fsd/entities/product';
import {
  CART_STORAGE_KEY,
  getExpectedDeliveryDateRange,
  gsap,
  notifyCartUpdated,
  pickSiteText,
  registerGsap,
  type SiteTextsMap,
  type StoredCartItem,
} from '@/src/fsd/shared/lib';
import styles from './ProductView.module.css';

const FALLBACK_PRODUCT_IMAGE = '/ducati-logo.png';

const CATEGORY_LABELS: Record<Product['category'], string> = {
  new: 'Новинка',
  discounted: 'Скидка в России',
  outlet: 'Аутлет в Милане',
  unsorted: 'Без сортировки',
};

type Props = {
  product: Product;
  siteTexts?: SiteTextsMap;
};

export default function ProductView({product, siteTexts = {}}: Props) {
  const expectedDeliveryDate = getExpectedDeliveryDateRange();
  const compatibilityTitle = pickSiteText(siteTexts, 'product.compatibility_title', 'Совместимость');
  const compatibilityEmptyText = pickSiteText(
    siteTexts,
    'product.compatibility_empty_text',
    'Совместимость с моделями не указана',
  );
  const descriptionTitle = pickSiteText(siteTexts, 'product.description_title', 'Описание');
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageSrc, setImageSrc] = useState(product.image);
  const compatibleModels = product.models || [];
  const galleryImages = [product.image, ...(product.gallery || [])].filter(
    (url, index, all) => all.indexOf(url) === index,
  );

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

  useEffect(() => {
    setImageSrc(product.image);
  }, [product.image]);

  const titleWithArticle =
    product.sku && !product.title.toUpperCase().includes(product.sku.toUpperCase())
      ? `${product.sku} ${product.title}`
      : product.title;

  function addToCart() {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
    let cart: StoredCartItem[] = [];

    try {
      cart = rawCart ? (JSON.parse(rawCart) as StoredCartItem[]) : [];
    } catch {
      cart = [];
    }
    const existing = cart.find((item) => item.product_id === product.id);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, 99);
    } else {
      cart.push({product_id: product.id, quantity});
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    notifyCartUpdated();
    router.push('/cart');
  }

  return (
    <div ref={ref} className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link href="/">Главная</Link>
        <ChevronRight className={styles.breadcrumbIcon} />
        <Link href="/catalog-oem">Каталог OEM</Link>
        <ChevronRight className={styles.breadcrumbIcon} />
        <span className={styles.breadcrumbCurrent}>{product.title}</span>
      </div>

      <div className={styles.summary}>
        <div className={styles.gallery}>
          {galleryImages.length > 1 && (
            <div className={styles.thumbnailRow}>
              {galleryImages.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setImageSrc(url)}
                  className={`${styles.thumbnailButton} ${
                    imageSrc === url ? styles.thumbnailButtonActive : ''
                  }`}
                  aria-label={`Фото ${index + 1}`}
                >
                  <Image
                    src={url}
                    fill
                    alt=""
                    className={styles.thumbnailImage}
                    sizes="72px"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}

          <div className={styles.mainImageBox}>
            <Image
              src={imageSrc}
              fill
              alt={product.title}
              className={
                imageSrc === FALLBACK_PRODUCT_IMAGE
                  ? `${styles.mainImage} ${styles.fallbackMainImage}`
                  : styles.mainImage
              }
              priority
              referrerPolicy="no-referrer"
              onError={() => setImageSrc(FALLBACK_PRODUCT_IMAGE)}
            />
          </div>
        </div>

        <div className={styles.info}>
          {product.category !== 'unsorted' && (
            <div className={styles.kickerRow}>
              <span className={styles.categoryPill}>{CATEGORY_LABELS[product.category]}</span>
            </div>
          )}

          <h1 className={styles.title}>{titleWithArticle}</h1>

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
                <div className={styles.priceRow}>
                  <div className={styles.price}>{product.priceFormatted}</div>
                  {product.priceRubFormatted && (
                    <span className={styles.priceRub}>{product.priceRubFormatted}</span>
                  )}
                </div>
                <span className={styles.priceNote}>Цена без учета доставки</span>
              </div>
              {product.discountBadge && (
                <span className={styles.saleBadge}>{product.discountBadge}</span>
              )}
            </div>

            <div className={styles.purchaseActions}>
              <div className={styles.quantity}>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(current - 1, 1))}
                  className={styles.quantityButton}
                >
                  -
                </button>
                <input type="text" value={quantity} readOnly className={styles.quantityInput} />
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(current + 1, 99))}
                  className={styles.quantityButton}
                >
                  +
                </button>
              </div>
              <button type="button" onClick={addToCart} className={styles.cartButton}>
                В корзину {quantity} шт
                <span className={styles.cartHint}>Перейти</span>
              </button>
            </div>

            <div className={styles.deliveryNotice}>
              <Truck className={styles.deliveryIcon} />
              <span>Ожидаемая дата доставки: {expectedDeliveryDate}</span>
            </div>

            <div className={styles.summaryDescriptionCard}>
              <h2 className={styles.summaryDescriptionTitle}>{descriptionTitle}</h2>
              <dl className={styles.summaryDescriptionMeta}>
                <div className={styles.summaryDescriptionMetaRow}>
                  <dt>Название</dt>
                  <dd>{product.title}</dd>
                </div>
                <div className={styles.summaryDescriptionMetaRow}>
                  <dt>Артикул</dt>
                  <dd>{getProductArticle(product)}</dd>
                </div>
                {product.brand && (
                  <div className={styles.summaryDescriptionMetaRow}>
                    <dt>Брэнд</dt>
                    <dd>{product.brand}</dd>
                  </div>
                )}
              </dl>
              {(product.desc || product.description) && (
                <p className={styles.summaryDescriptionText}>
                  {product.desc || product.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detailsInner}>
          <div className={`${styles.contentBlock} ${styles.descriptionBlock}`}>
            <h3 className={styles.blockTitle}>{compatibilityTitle}</h3>
            <div className={styles.compatibilityBox}>
              <div className={styles.compatibilityHeader}>
                <span className={styles.compatibilityIconWrap}>
                  <Bike className={styles.compatibilityIcon} />
                </span>
                <div>
                  <p className={styles.compatibilitySubtitle}>
                    {compatibleModels.length > 0
                      ? `Подходит для ${compatibleModels.length} ${compatibleModels.length === 1 ? 'модели' : 'моделей'} Ducati`
                      : compatibilityEmptyText}
                  </p>
                </div>
              </div>

              {compatibleModels.length > 0 && (
                <div className={styles.compatibilityList}>
                  {compatibleModels.map((model) => (
                    <span key={model} className={styles.compatibilityChip}>
                      {model}
                    </span>
                  ))}
                </div>
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

          {/* Блок отзывов временно скрыт
          <div className={styles.reviewsBlock}>
            <h3 className={`${styles.blockTitle} ${styles.reviewTitle}`}>Отзывы</h3>
            <p className={styles.reviewText}>Отзывов еще никто не оставлял</p>
            <button type="button" className={styles.reviewButton}>
              Написать отзыв
            </button>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
