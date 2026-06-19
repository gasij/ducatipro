'use client';

import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Heart, Menu, ShoppingCart, X} from 'lucide-react';
import {gsap, registerGsap} from '@/src/fsd/shared/lib';

const TICKER_TEXT =
  'Весь экип (шлема, куртки, штаны, перчи, боты, защиты и все что угодно), а также повседневка в полном ассортименте в любом европейском магазине за нашу символическую комиссию 10%';

const NAV_LINKS = [
  {href: '/catalog', label: 'Каталог'},
  {href: '/outlet', label: 'Аутлет в Милане'},
  {href: '/unsorted', label: 'Товары без сортировки'},
  {href: '/cart', label: 'Корзина'},
  {href: '/favorites', label: 'Избранное'},
];

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from('.header-top', {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      });

      gsap.from('.header-main > *', {
        y: 24,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        delay: 0.15,
        ease: 'power3.out',
      });

      gsap.from('.header-ticker', {
        opacity: 0,
        duration: 0.5,
        delay: 0.4,
      });

      const ticker = tickerRef.current;
      if (ticker) {
        const track = ticker.querySelector('.ticker-track');
        const content = ticker.querySelector('.ticker-content');
        if (track && content) {
          const width = (content as HTMLElement).offsetWidth;
          gsap.to(track, {
            x: -width,
            duration: 30,
            ease: 'none',
            repeat: -1,
          });
        }
      }
    }, headerRef);

    return () => ctx.revert();
  }, []);

  return (
    <header ref={headerRef} className="w-full bg-black text-white z-50 sticky top-0">
      {/* Top bar */}
      <div className="header-top bg-[#111] border-b border-white/10 text-[12px] md:text-[13px] text-gray-400 py-2">
        <div className="container mx-auto safe-px max-w-7xl">
          <div className="hidden lg:flex justify-between items-center">
            <nav className="flex gap-6">
              {NAV_LINKS.slice(0, 3).map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex gap-6 items-center">
              <span>10.00 - 20.00 (МСК)</span>
              <a href="tel:+74996776257" className="font-medium text-white hover:text-red-400 transition-colors">
                +7 (499) 677 62 57
              </a>
            </div>
          </div>

          <div className="flex lg:hidden justify-between items-center gap-3">
            <a href="tel:+74996776257" className="font-medium text-white hover:text-red-400 transition-colors truncate">
              +7 (499) 677 62 57
            </a>
            <span className="text-gray-500 shrink-0">10–20 МСК</span>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="header-main container mx-auto safe-px py-3 md:py-5 max-w-7xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6 lg:gap-8">
        <div className="flex items-center justify-between gap-3 w-full md:w-auto md:shrink-0">
          <Link href="/" className="flex items-center shrink-0 group min-w-0">
            <Image
              src="/logo.svg"
              alt="Оригинальные запчасти Дукати"
              width={220}
              height={42}
              className="h-7 sm:h-8 md:h-10 w-auto max-w-[160px] sm:max-w-none group-hover:opacity-90 transition-opacity"
              priority
            />
          </Link>

          <div className="flex items-center gap-3 sm:gap-5 md:gap-7 text-gray-300 shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-1.5 hover:text-white transition-colors"
              aria-label="Открыть меню"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/favorites" className="hover:text-white transition-colors relative p-1">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
              <span className="absolute -top-1 -right-1 bg-[#e30613] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold border border-black">
                0
              </span>
            </Link>

            <Link
              href="/cart"
              className="hover:text-white transition-colors relative flex items-center gap-1.5 sm:gap-2 group p-1"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
                <span className="absolute -top-1 -right-1 bg-[#e30613] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold border border-black">
                  1
                </span>
              </div>
              <span className="hidden sm:inline font-bold text-[#e30613] text-sm md:text-base group-hover:text-red-400 whitespace-nowrap">
                220 477 ₽
              </span>
            </Link>
          </div>
        </div>

        <div className="w-full md:flex-1 relative min-w-0">
          <input
            type="search"
            placeholder="Поиск"
            className="w-full border border-white/20 bg-white/10 rounded-sm py-2.5 sm:py-3 pl-4 pr-12 sm:pr-14 outline-none focus:border-white/40 placeholder-gray-500 text-sm text-white"
          />
          <button
            type="button"
            className="absolute right-0 top-0 bottom-0 w-11 sm:w-14 flex items-center justify-center rounded-r-sm overflow-hidden hover:opacity-90 transition-opacity"
            aria-label="Поиск"
          >
            <Image
              src="/search-button.png"
              alt=""
              width={56}
              height={48}
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div className="header-ticker border-t border-b border-white/10 py-2 sm:py-3 overflow-hidden text-[#e30613] text-xs sm:text-sm bg-[#0a0a0a]">
        <div ref={tickerRef} className="overflow-hidden">
          <div className="ticker-track flex whitespace-nowrap w-max">
            <div className="ticker-content flex gap-6 sm:gap-8 px-4 shrink-0 items-center">
              <Link href="/catalog" className="hover:underline">
                {TICKER_TEXT}
              </Link>
              <span className="text-gray-600">-</span>
            </div>
            <div className="ticker-content flex gap-6 sm:gap-8 px-4 shrink-0 items-center" aria-hidden>
              <span>{TICKER_TEXT}</span>
              <span className="text-gray-600">-</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть меню"
          />
          <nav className="absolute top-0 right-0 h-full w-[min(100%,320px)] bg-[#111] border-l border-white/10 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <span className="font-bold text-sm uppercase tracking-wide">Меню</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-2 hover:text-red-400 transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <ul className="flex flex-col py-2 overflow-y-auto flex-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-5 py-4 text-[15px] border-b border-white/5 hover:bg-white/5 hover:text-red-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="p-5 border-t border-white/10 text-sm text-gray-400 space-y-2">
              <a href="tel:+74996776257" className="block text-white font-medium">
                +7 (499) 677 62 57
              </a>
              <span>10.00 - 20.00 (МСК)</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
