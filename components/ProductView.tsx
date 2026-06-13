'use client';

import {useEffect, useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ChevronRight, Heart, Star} from 'lucide-react';
import {gsap, registerGsap} from '../lib/gsap';
import type {Product} from '../lib/products';

export default function ProductView({product}: {product: Product}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from('.product-gallery', {
        x: -60,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });

      gsap.from('.product-info > *', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.15,
      });

      gsap.from('.product-block', {
        y: 50,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.product-details',
          start: 'top 85%',
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [product.id]);

  return (
    <div ref={ref} className="container mx-auto safe-px max-w-7xl pt-6 sm:pt-8 pb-16 sm:pb-24">
      <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] text-gray-500 mb-6 sm:mb-8 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-red-600">
          Главная
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/catalog" className="hover:text-red-600">
          Каталог
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-400 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{product.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-20">
        <div className="product-gallery flex flex-col-reverse md:flex-row gap-3 sm:gap-4 md:gap-6 lg:w-1/2 w-full">
          <div className="flex flex-row md:flex-col gap-2 md:gap-3 shrink-0 overflow-x-auto md:overflow-visible no-scrollbar pb-1 md:pb-0">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                className={`w-16 h-16 sm:w-20 sm:h-20 border rounded-sm relative bg-white shrink-0 ${i === 0 ? 'border-gray-800' : 'border-gray-200'}`}
              >
                <Image
                  src={`https://picsum.photos/seed/${product.id}thumb${i}/100/100`}
                  fill
                  alt="thumb"
                  className="object-contain p-2 mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
          <div className="flex-1 bg-white relative aspect-square border border-gray-100 rounded-sm min-h-[280px] sm:min-h-0">
            {product.badgeText && (
              <div className="absolute top-4 left-4 z-10 flex gap-1">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-sm tracking-wide ${
                    product.badgeColor === 'gray'
                      ? 'bg-gray-200 text-gray-600'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {product.badgeText}
                </span>
              </div>
            )}
            <Image
              src={product.image}
              fill
              alt={product.title}
              className="object-contain p-8 mix-blend-multiply"
              priority
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="product-info lg:w-1/2 flex flex-col w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-4 uppercase tracking-tighter">
            {product.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 stroke-[1.5]" />
                ))}
              </div>
              <span>(0)</span>
            </div>
            <Link
              href="/favorites"
              className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-red-600 transition-colors"
            >
              <Heart className="w-4 h-4 stroke-[1.5]" />
              В избранное
            </Link>
          </div>

          <div className="bg-[#f9f9f9] p-4 sm:p-6 rounded-sm mb-6 flex flex-col gap-5 sm:gap-6">
            <div className="flex flex-col">
              {product.oldPrice && (
                <span className="text-[14px] sm:text-[16px] text-gray-400 line-through font-medium">
                  {product.oldPrice}
                </span>
              )}
              <div className="text-[26px] sm:text-[32px] font-black text-gray-900 tracking-tight leading-none">
                {product.priceFormatted}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center border border-gray-300 rounded-sm bg-white h-12 w-fit">
                <button type="button" className="px-4 text-gray-500 hover:text-black">-</button>
                <input type="text" value="1" readOnly className="w-10 text-center font-bold outline-none" />
                <button type="button" className="px-4 text-gray-500 hover:text-black">+</button>
              </div>
              <Link
                href="/cart"
                className="bg-black hover:bg-gray-900 text-white px-6 sm:px-8 h-12 rounded-sm font-bold tracking-wide transition-colors flex flex-col items-center justify-center leading-none flex-1 sm:flex-none text-center"
              >
                В корзину 1 шт
                <span className="text-[10px] font-normal mt-1 opacity-70">Перейти</span>
              </Link>
            </div>
          </div>

          <div className="text-[13px] text-gray-600 leading-relaxed max-w-md">
            {product.isAvailableInMoscow && (
              <p className="text-green-600 font-medium mb-2">В наличии на складе в Москве</p>
            )}
            {product.isLastInMilan && (
              <p className="mb-2">
                Last items in stock 🔥 Цена указана &quot;до двери&quot; после всех расходов и
                пошлин.
              </p>
            )}
            {!product.isAvailableInMoscow && !product.isLastInMilan && (
              <p>
                Предзаказ.{' '}
                <span className="text-green-600 font-medium">Цена указана до двери</span> 📦 после
                всех расходов и пошлин. Общий срок поставки в Россию 4-6 недель
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="product-details mt-12 sm:mt-20">
        <div className="flex flex-col gap-8 sm:gap-12 max-w-4xl">
          <div className="product-block bg-[#fcfcfc] p-5 sm:p-8 md:p-12 rounded-sm border border-gray-100">
            <h3 className="text-xl font-black mb-6 tracking-tight text-gray-900">Описание</h3>
            <div className="text-[14px] text-gray-700 leading-relaxed space-y-6">
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
            <div className="product-block bg-[#fcfcfc] p-5 sm:p-8 md:p-12 rounded-sm border border-gray-100">
              <h3 className="text-xl font-black mb-8 tracking-tight text-gray-900">
                Характеристики
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-end justify-between border-b border-gray-200 border-dotted pb-1"
                  >
                    <span className="text-[14px] text-gray-500 bg-[#fcfcfc] pr-2 -mb-1 relative z-10">
                      {spec.label}
                    </span>
                    <span className="text-[14px] text-gray-900 font-medium bg-[#fcfcfc] pl-2 -mb-1 relative z-10 text-right">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="product-block pt-4">
            <h3 className="text-2xl font-black mb-6 tracking-tight text-gray-900">Отзывы</h3>
            <p className="text-[14px] text-gray-500 mb-6">Отзывов еще никто не оставлял</p>
            <button className="bg-black hover:bg-gray-900 text-white px-8 py-3 rounded-sm font-medium transition-colors text-[13px]">
              Написать отзыв
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
