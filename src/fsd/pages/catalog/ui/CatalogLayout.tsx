'use client';

import {useEffect, useRef} from 'react';
import {ProductCard, type Product} from '@/src/fsd/entities/product';
import {gsap, registerGsap} from '@/src/fsd/shared/lib';
import styles from './CatalogLayout.module.css';

type Props = {
  title: string;
  description?: string;
  items: Product[];
};

export default function CatalogLayout({title, description, items}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.title}`, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
      });

      gsap.from(`.${styles.description}`, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.1,
        ease: 'power3.out',
      });

      gsap.from(`.${styles.grid} > *`, {
        y: 50,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.2,
      });
    }, ref);

    return () => ctx.revert();
  }, [items]);

  return (
    <div ref={ref} className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      {!description && <div className={styles.descriptionSpacer} />}
      {items.length > 0 ? (
        <div className={styles.grid}>
          {items.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Товары не найдены.</p>
      )}
    </div>
  );
}
