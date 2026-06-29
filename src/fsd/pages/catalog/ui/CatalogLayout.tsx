'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
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
  const [selectedModel, setSelectedModel] = useState('all');
  const modelOptions = useMemo(() => {
    const counts = new Map<string, number>();

    items.forEach((item) => {
      item.models?.forEach((model) => {
        counts.set(model, (counts.get(model) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([model, count]) => ({model, count}))
      .sort((a, b) => a.model.localeCompare(b.model, 'ru'));
  }, [items]);
  const filteredItems = useMemo(() => {
    if (selectedModel === 'all') {
      return items;
    }

    return items.filter((item) => item.models?.includes(selectedModel));
  }, [items, selectedModel]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.title}`, {
        y: 16,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
      });

      gsap.from(`.${styles.description}`, {
        y: 12,
        opacity: 0,
        duration: 0.4,
        delay: 0.08,
        ease: 'power2.out',
      });

      gsap.from(`.${styles.grid} > *`, {
        y: 22,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.14,
      });
    }, ref);

    return () => ctx.revert();
  }, [items, filteredItems.length]);

  return (
    <div ref={ref} className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      {!description && <div className={styles.descriptionSpacer} />}

      {modelOptions.length > 0 && (
        <div className={styles.filters} aria-label="Фильтр по модели Ducati">
          <div className={styles.filtersHeader}>
            <span className={styles.filtersTitle}>Модель Ducati</span>
            {selectedModel !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedModel('all')}
                className={styles.resetButton}
              >
                Сбросить
              </button>
            )}
          </div>
          <div className={styles.modelList}>
            <button
              type="button"
              onClick={() => setSelectedModel('all')}
              className={`${styles.modelButton} ${
                selectedModel === 'all' ? styles.modelButtonActive : ''
              }`}
            >
              Все модели
              <span>{items.length}</span>
            </button>
            {modelOptions.map(({model, count}) => (
              <button
                key={model}
                type="button"
                onClick={() => setSelectedModel(model)}
                className={`${styles.modelButton} ${
                  selectedModel === model ? styles.modelButtonActive : ''
                }`}
              >
                {model}
                <span>{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredItems.length > 0 ? (
        <div className={styles.grid}>
          {filteredItems.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyBlock}>
          <p className={styles.empty}>Для выбранной модели товары не найдены.</p>
          <button type="button" onClick={() => setSelectedModel('all')} className={styles.resetButton}>
            Показать все товары
          </button>
        </div>
      )}
    </div>
  );
}
