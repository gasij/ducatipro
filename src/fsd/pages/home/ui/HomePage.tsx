'use client';

import {useEffect, useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ChevronLeft, ChevronRight, Check} from 'lucide-react';
import {ProductCard, type Product} from '@/src/fsd/entities/product';
import {gsap, registerGsap} from '@/src/fsd/shared/lib';

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
      gsap.from('.home-banner img', {
        scale: 1.08,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
      });

      gsap.utils.toArray<HTMLElement>('.home-section').forEach((section) => {
        const title = section.querySelector('.section-title');
        const grid = section.querySelector('.product-grid');
        const line = section.querySelector('.section-line');

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

      gsap.from('.promo-text', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        scrollTrigger: {trigger: '.promo-block', start: 'top 85%'},
      });

      gsap.from('.insta-item', {
        scale: 0.85,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: 'back.out(1.4)',
        scrollTrigger: {trigger: '.insta-grid', start: 'top 88%'},
      });

      gsap.from('.contact-form > *', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {trigger: '.contact-form', start: 'top 85%'},
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col gap-10 sm:gap-14 md:gap-16 pb-10 sm:pb-16">
      <section className="home-banner w-full relative overflow-hidden">
        <Image
          src="/banner.jpg"
          alt="FC Moto, Louis, Motostorm — экипировка и запчасти"
          width={1920}
          height={577}
          className="w-full h-auto min-h-[140px] sm:min-h-[200px] object-cover object-center"
          priority
          sizes="100vw"
        />
      </section>

      <ProductSection title="Новинки в продаже" items={newArrivals} />
      <ProductSection title="Товары со скидкой в наличии в России" items={discounted} />
      <ProductSection title="Наш аутлет в Милане" items={milanOutlet} linkHref="/outlet" />

      <section className="promo-block container mx-auto safe-px max-w-7xl mt-6 sm:mt-12">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="section-line hidden sm:block flex-1 h-[2px] bg-red-600 rounded origin-left" />
          <h3 className="promo-text uppercase text-gray-800 tracking-wide text-xs sm:text-sm text-center md:text-lg font-medium max-w-xl">
            Итальянский #кофевкофр в посылку при заказе из Италии гарантирован
          </h3>
          <div className="section-line hidden sm:block flex-1 h-[2px] bg-red-600 rounded origin-right" />
        </div>

        <div className="insta-grid grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="insta-item aspect-square bg-gray-100 rounded-lg overflow-hidden relative group shadow-sm border border-gray-100"
            >
              <Image
                src={`https://picsum.photos/seed/motopart${i}/400/400`}
                alt="Instagram photo"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto safe-px max-w-2xl mt-10 sm:mt-16 text-center">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-6 sm:mb-8">
          Обратная связь
        </h2>
        <form className="contact-form flex flex-col gap-4 text-left">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Имя*"
              className="flex-1 bg-[#f9f9f9] border border-gray-100 rounded-sm px-5 py-4 text-[13px] focus:outline-none focus:border-red-500 transition-colors"
            />
            <input
              type="email"
              placeholder="Ваша почта*"
              className="flex-1 bg-[#f9f9f9] border border-gray-100 rounded-sm px-5 py-4 text-[13px] focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <textarea
            placeholder="Ваш вопрос, отзыв или пожелание*"
            rows={4}
            className="bg-[#f9f9f9] border border-gray-100 rounded-sm px-5 py-4 text-[13px] focus:outline-none focus:border-red-500 transition-colors resize-none"
          />
          <label className="flex items-start gap-4 mt-4 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                className="peer w-5 h-5 appearance-none border border-gray-300 rounded-sm checked:bg-gray-800 checked:border-gray-800 transition-colors cursor-pointer"
              />
              <Check className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </div>
            <span className="text-[13px] text-gray-600 leading-snug pt-0.5 group-hover:text-gray-900 transition-colors">
              Настоящим подтверждаю, что я ознакомлен и согласен с условиями{' '}
              <Link href="/offer" className="text-red-600 hover:underline">
                оферты и политики конфиденциальности
              </Link>{' '}
              *
            </span>
          </label>
          <button
            type="button"
            className="bg-[#333] hover:bg-[#222] text-white px-12 py-4 mx-auto font-bold tracking-wide rounded-sm transition-colors mt-8 w-full md:w-auto text-[15px]"
          >
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
    <section className="home-section container mx-auto safe-px max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8 border-b border-gray-100 pb-4">
        {linkHref ? (
          <Link
            href={linkHref}
            className="section-title text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight hover:text-red-600 transition-colors pr-2 leading-tight"
          >
            {title}
          </Link>
        ) : (
          <h2 className="section-title text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight pr-2 leading-tight">
            {title}
          </h2>
        )}
        <div className="flex gap-2 shrink-0 self-end sm:self-auto">
          <button className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="product-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {items.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </section>
  );
}
