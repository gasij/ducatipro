'use client';

import {useEffect, useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ChevronLeft, ChevronRight, Check} from 'lucide-react';
import {ProductCard, type Product} from '@/src/fsd/entities/product';
import {gsap, registerGsap} from '@/src/fsd/shared/lib';
import styles from './HomePage.module.css';

type Props = {
  newArrivals: Product[];
  discounted: Product[];
  milanOutlet: Product[];
};

export default function HomePage({newArrivals, discounted, milanOutlet}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.banner} img`, {
        scale: 1.08,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
      });

      gsap.utils.toArray<HTMLElement>(`.${styles.productSection}`).forEach((section) => {
        const title = section.querySelector(`.${styles.sectionTitle}`);
        const grid = section.querySelector(`.${styles.productGrid}`);
        const line = section.querySelector(`.${styles.sectionLine}`);

        if (line) {
          gsap.from(line, {
            scaleX: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {trigger: section, start: 'top 85%'},
          });
        }

        if (title) {
          gsap.from(title, {
            x: -40,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {trigger: section, start: 'top 85%'},
          });
        }

        if (grid) {
          gsap.from(grid.children, {
            y: 60,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {trigger: grid, start: 'top 90%'},
          });
        }
      });

      gsap.from(`.${styles.promoText}`, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        scrollTrigger: {trigger: `.${styles.promoBlock}`, start: 'top 85%'},
      });

      gsap.from(`.${styles.instagramItem}`, {
        scale: 0.85,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: 'back.out(1.4)',
        scrollTrigger: {trigger: `.${styles.instagramGrid}`, start: 'top 88%'},
      });

      gsap.from(`.${styles.contactForm} > *`, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {trigger: `.${styles.contactForm}`, start: 'top 85%'},
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

      <ProductSection title="Новинки в продаже" items={newArrivals} />
      <ProductSection title="Товары со скидкой в наличии в России" items={discounted} />
      <ProductSection title="Наш аутлет в Милане" items={milanOutlet} linkHref="/outlet" />

      <section className={`${styles.container} ${styles.promoBlock}`}>
        <div className={styles.promoHeader}>
          <div className={`${styles.sectionLine} ${styles.leftLine}`} />
          <h3 className={styles.promoText}>
            Итальянский #кофевкофр в посылку при заказе из Италии гарантирован
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

      <section className={styles.feedback}>
        <h2 className={styles.feedbackTitle}>Обратная связь</h2>
        <form className={styles.contactForm}>
          <div className={styles.formRow}>
            <input type="text" placeholder="Имя*" className={styles.field} />
            <input type="email" placeholder="Ваша почта*" className={styles.field} />
          </div>
          <textarea
            placeholder="Ваш вопрос, отзыв или пожелание*"
            rows={4}
            className={styles.message}
          />
          <label className={styles.agreement}>
            <div className={styles.checkboxBox}>
              <input type="checkbox" className={styles.checkbox} />
              <Check className={styles.checkboxIcon} />
            </div>
            <span className={styles.agreementText}>
              Настоящим подтверждаю, что я ознакомлен и согласен с условиями{' '}
              <Link href="/offer" className={styles.agreementLink}>
                оферты и политики конфиденциальности
              </Link>{' '}
              *
            </span>
          </label>
          <button type="button" className={styles.submitButton}>
            Отправить
          </button>
        </form>
      </section>
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
          <button type="button" className={styles.sectionControl} aria-label="Предыдущие товары">
            <ChevronLeft className={styles.sectionControlIcon} />
          </button>
          <button type="button" className={styles.sectionControl} aria-label="Следующие товары">
            <ChevronRight className={styles.sectionControlIcon} />
          </button>
        </div>
      </div>

      <div className={styles.productGrid}>
        {items.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </section>
  );
}
