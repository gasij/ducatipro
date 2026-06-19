'use client';

import {useEffect, useRef} from 'react';
import {ProductCard, type Product} from '@/src/fsd/entities/product';
import {gsap, registerGsap} from '@/src/fsd/shared/lib';

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
      gsap.from('.catalog-title', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
      });

      gsap.from('.catalog-desc', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.1,
        ease: 'power3.out',
      });

      gsap.from('.catalog-grid > *', {
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
    <div ref={ref} className="container mx-auto safe-px max-w-7xl pt-6 sm:pt-8 pb-16 sm:pb-24">
      <h1 className="catalog-title text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2">
        {title}
      </h1>
      {description && (
        <p className="catalog-desc text-[14px] text-gray-500 mb-8">{description}</p>
      )}
      {!description && <div className="mb-8" />}
      {items.length > 0 ? (
        <div className="catalog-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {items.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Товары не найдены.</p>
      )}
    </div>
  );
}
