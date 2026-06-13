'use client';

import {useEffect, useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Check} from 'lucide-react';
import {gsap} from '../lib/gsap';
import type {Product} from '../lib/products';

export default function ProductCard({
  id,
  image,
  title,
  desc,
  priceFormatted,
  oldPrice,
  badgeText,
  badgeColor = 'green',
  discountBadge,
  isAvailableInMoscow,
  isLastInMilan,
}: Pick<
  Product,
  | 'id'
  | 'image'
  | 'title'
  | 'desc'
  | 'priceFormatted'
  | 'oldPrice'
  | 'badgeText'
  | 'badgeColor'
  | 'discountBadge'
  | 'isAvailableInMoscow'
  | 'isLastInMilan'
>) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onEnter = () => {
      gsap.to(card, {y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', duration: 0.35, ease: 'power2.out'});
    };
    const onLeave = () => {
      gsap.to(card, {y: 0, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.35, ease: 'power2.out'});
    };

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);
    return () => {
      card.removeEventListener('mouseenter', onEnter);
      card.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <Link
      ref={cardRef}
      href={`/product/${id}`}
      className="group rounded-sm border border-gray-100 bg-white p-4 sm:p-5 flex flex-col relative min-w-0"
    >
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex gap-1 max-w-[70%]">
        {badgeText && (
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-sm tracking-wide ${
              badgeColor === 'gray'
                ? 'bg-gray-200 text-gray-600'
                : 'bg-green-500 text-white'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>
      <div className="absolute top-4 right-4 z-10 flex gap-1">
        {discountBadge && (
          <span className="bg-[#e30613] text-white text-[11px] font-bold px-2.5 py-1 rounded-sm tracking-wide">
            {discountBadge}
          </span>
        )}
      </div>

      <div className="relative aspect-square w-full mb-6 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex-1 flex flex-col pt-2 border-t border-gray-50">
        <h3 className="text-[12px] font-medium text-gray-900 uppercase leading-snug mb-2 group-hover:text-red-600 transition-colors">
          {title}
        </h3>
        {desc ? (
          <p className="text-[12px] text-gray-500 leading-tight mb-4 flex-1">{desc}</p>
        ) : (
          <div className="flex-1" />
        )}

        {isAvailableInMoscow && (
          <div className="flex gap-1.5 items-start mt-auto mb-4 bg-gray-50 p-2 rounded-sm">
            <Check className="w-4 h-4 stroke-[3] text-green-600 shrink-0 mt-0.5" />
            <span className="text-[11px] text-gray-500 leading-tight font-medium">
              В наличии на складе в Москве
            </span>
          </div>
        )}
        {isLastInMilan && (
          <div className="flex flex-col mt-auto mb-4">
            <div className="flex gap-1 text-[11px] text-gray-800 font-bold items-center mb-1">
              Last items in stock{' '}
              <span className="text-sm border border-red-100 bg-red-50 rounded px-1">🔥</span>
            </div>
            <span className="text-[10px] text-gray-400 leading-tight">
              Цена указана &quot;до двери&quot; после...
            </span>
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-col items-start gap-1">
          {oldPrice && (
            <span className="text-[13px] text-gray-400 line-through -mb-1 font-medium">
              {oldPrice}
            </span>
          )}
          <span className="text-[18px] sm:text-[22px] font-black text-gray-900 tracking-tight">
            {priceFormatted}
          </span>
        </div>
      </div>
    </Link>
  );
}
