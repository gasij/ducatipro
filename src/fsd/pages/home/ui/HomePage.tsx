'use client';

import {useEffect, useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {ProductCard, type Product} from '@/src/fsd/entities/product';
import {gsap, pickSiteText, registerGsap, type SiteTextsMap} from '@/src/fsd/shared/lib';
import {FeedbackForm} from '@/src/fsd/widgets/feedback-form';
import styles from './HomePage.module.css';

type Props = {
  newArrivals: Product[];
  sectionTitle?: string;
  siteTexts?: SiteTextsMap;
};

export default function HomePage({newArrivals, sectionTitle = 'Новинки в продаже', siteTexts = {}}: Props) {
  const italyCoffeePromo = pickSiteText(
    siteTexts,
    'home.italy_coffee_promo',
    'Итальянский #кофевкофр в посылку при заказе из Италии гарантирован',
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.banner} img`, {
        scale: 1.035,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
      });

      gsap.utils.toArray<HTMLElement>(`.${styles.productSection}`).forEach((section) => {
        const title = section.querySelector(`.${styles.sectionTitle}`);
        const grid = section.querySelector(`.${styles.productGrid}`);
        const line = section.querySelector(`.${styles.sectionLine}`);

        if (line) {
          gsap.from(line, {
            scaleX: 0,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {trigger: section, start: 'top 86%', once: true},
          });
        }

        if (title) {
          gsap.from(title, {
            y: 18,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {trigger: section, start: 'top 86%', once: true},
          });
        }

        if (grid) {
          gsap.from(grid.children, {
            y: 24,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {trigger: grid, start: 'top 90%', once: true},
          });
        }
      });

      gsap.from(`.${styles.promoText}`, {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {trigger: `.${styles.promoBlock}`, start: 'top 85%', once: true},
      });

      gsap.from(`.${styles.instagramItem}`, {
        scale: 0.96,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {trigger: `.${styles.instagramGrid}`, start: 'top 88%', once: true},
      });

    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className={styles.page}>
      <section className={styles.banner}>
        <Image
          src="/banner.jpg"
          alt="FC Moto, Louis, Motostorm — экипировка и запчасти"
          width={1920}
          height={577}
          className={styles.bannerImage}
          priority
          sizes="100vw"
        />
      </section>

      <ProductSection title={sectionTitle} items={newArrivals} />

      <section className={`${styles.container} ${styles.promoBlock}`}>
        <div className={styles.promoHeader}>
          <div className={`${styles.sectionLine} ${styles.leftLine}`} />
          <h3 className={styles.promoText}>
            {italyCoffeePromo}
          </h3>
          <div className={`${styles.sectionLine} ${styles.rightLine}`} />
        </div>

        <div className={styles.instagramGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.instagramItem}>
              <Image
                src={`https://picsum.photos/seed/motopart${i}/400/400`}
                alt="Instagram photo"
                fill
                className={styles.instagramImage}
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </section>

      <FeedbackForm siteTexts={siteTexts} />
    </div>
  );
}

function ProductSection({
  title,
  items,
  linkHref,
}: {
  title: string;
  items: Product[];
  linkHref?: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  function scrollProducts(direction: -1 | 1) {
    gridRef.current?.scrollBy({
      left: direction * 320,
      behavior: 'smooth',
    });
  }

  return (
    <section className={styles.productSection}>
      <div className={styles.sectionHeader}>
        {linkHref ? (
          <Link href={linkHref} className={styles.sectionTitle}>
            {title}
          </Link>
        ) : (
          <h2 className={styles.sectionTitle}>{title}</h2>
        )}
        <div className={styles.sectionControls}>
          <button
            type="button"
            onClick={() => scrollProducts(-1)}
            className={styles.sectionControl}
            aria-label="Предыдущие товары"
          >
            <ChevronLeft className={styles.sectionControlIcon} />
          </button>
          <button
            type="button"
            onClick={() => scrollProducts(1)}
            className={styles.sectionControl}
            aria-label="Следующие товары"
          >
            <ChevronRight className={styles.sectionControlIcon} />
          </button>
        </div>
      </div>

      <div ref={gridRef} className={styles.productGrid}>
        {items.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </section>
  );
}
