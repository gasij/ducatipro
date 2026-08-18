'use client';

import {type FormEvent, useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Menu, Plus, Search, ShoppingCart, X} from 'lucide-react';
import {CART_UPDATED_EVENT, getStoredCartQuantity, gsap, registerGsap} from '@/src/fsd/shared/lib';
import styles from './Header.module.css';

const TICKER_TEXT =
  'Весь экип (шлема, куртки, штаны, перчи, боты, защиты и все что угодно), а также повседневка в полном ассортименте в любом европейском магазине за нашу символическую комиссию 10%';

const OUTLET_URL = 'https://ducatiparts.pro/collection/outlet';
const CATALOG_URL = 'https://ducatiparts.pro/collection/all';
const CONSUMABLES_URL = 'https://ducatiparts.pro/collection/consumables';

const NAV_LINKS = [
  {href: CATALOG_URL, label: 'Каталог'},
  {href: OUTLET_URL, label: 'Аутлет в Милане'},
  {href: CONSUMABLES_URL, label: 'Расходники в наличии'},
  {href: '/unsorted', label: 'Товары без сортировки'},
  {href: '/cart', label: 'Корзина'},
];

export default function Header() {
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchArticles, setSearchArticles] = useState(['']);
  const [cartQuantity, setCartQuantity] = useState(0);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const articles = searchArticles.map((article) => article.trim()).filter(Boolean);

    if (articles.length === 0) {
      return;
    }

    if (articles.length === 1) {
      router.push(`/product/${encodeURIComponent(articles[0])}`);
      setSearchOpen(false);
      return;
    }

    const params = new URLSearchParams();
    articles.forEach((article) => params.append('article', article));
    router.push(`/search?${params.toString()}`);
    setSearchOpen(false);
  };

  function updateSearchArticle(index: number, value: string) {
    setSearchArticles((current) =>
      current.map((article, articleIndex) => (articleIndex === index ? value : article)),
    );
  }

  function addSearchArticle() {
    setSearchArticles((current) => [...current, '']);
  }

  function removeSearchArticle(index: number) {
    setSearchArticles((current) => {
      const next = current.filter((_, articleIndex) => articleIndex !== index);
      return next.length > 0 ? next : [''];
    });
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    function syncCartQuantity() {
      setCartQuantity(getStoredCartQuantity());
    }

    syncCartQuantity();
    window.addEventListener(CART_UPDATED_EVENT, syncCartQuantity);
    window.addEventListener('storage', syncCartQuantity);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartQuantity);
      window.removeEventListener('storage', syncCartQuantity);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.topBar}`, {
        y: -12,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
      });

      gsap.from(`.${styles.mainBar} > *`, {
        y: 14,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        delay: 0.08,
        ease: 'power2.out',
      });

      gsap.from(`.${styles.ticker}`, {
        opacity: 0,
        duration: 0.35,
        delay: 0.25,
      });

      const ticker = tickerRef.current;
      if (ticker) {
        const track = ticker.querySelector(`.${styles.tickerTrack}`);
        const content = ticker.querySelector(`.${styles.tickerContent}`);
        if (track && content) {
          const width = (content as HTMLElement).offsetWidth;
          gsap.to(track, {
            x: -width,
            duration: 34,
            ease: 'none',
            repeat: -1,
          });
        }
      }
    }, headerRef);

    return () => ctx.revert();
  }, []);

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.desktopTop}>
            <nav className={styles.topNav}>
              {NAV_LINKS.slice(0, 4).map((link) => (
                <Link key={link.href} href={link.href} className={styles.topLink}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className={styles.topMeta}>
              <span>10.00 - 20.00 (МСК)</span>
              <a href="tel:+74996776257" className={styles.phoneLink}>
                +7 (499) 677 62 57
              </a>
            </div>
          </div>

          <div className={styles.mobileTop}>
            <a href="tel:+74996776257" className={styles.mobilePhone}>
              +7 (499) 677 62 57
            </a>
            <span className={styles.mobileHours}>10–20 МСК</span>
          </div>
        </div>
      </div>

      <div className={`${styles.container} ${styles.mainBar}`}>
        <div className={styles.brandRow}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/logo.svg"
              alt="Оригинальные запчасти Дукати"
              width={220}
              height={42}
              className={styles.logo}
              priority
            />
          </Link>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => setSearchOpen((current) => !current)}
              className={styles.mobileSearchButton}
              aria-label={searchOpen ? 'Закрыть поиск' : 'Открыть поиск'}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X className={styles.menuIcon} /> : <Search className={styles.menuIcon} />}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={styles.mobileMenuButton}
              aria-label="Открыть меню"
            >
              <Menu className={styles.menuIcon} />
            </button>

            <Link href="/cart" className={styles.cartLink}>
              <div className={styles.iconWithBadge}>
                <ShoppingCart className={styles.icon} />
                <span className={styles.badge}>{cartQuantity}</span>
              </div>
              <span className={styles.cartTotal}>
                {cartQuantity > 0 ? `${cartQuantity} шт.` : 'Пусто'}
              </span>
            </Link>
          </div>
        </div>

        <form className={`${styles.search} ${searchOpen ? styles.searchOpen : ''}`} onSubmit={handleSearch}>
          <div className={styles.searchFields}>
            <div className={styles.searchField}>
              <input
                type="search"
                placeholder="Поиск по артикулу"
                value={searchArticles[0]}
                onChange={(event) => updateSearchArticle(0, event.target.value)}
                className={styles.searchInput}
              />
            </div>
            {searchArticles.length > 1 && (
              <div className={styles.searchDropdown}>
                {searchArticles.slice(1).map((article, offset) => {
                  const index = offset + 1;

                  return (
                    <div key={index} className={styles.searchField}>
                      <input
                        type="search"
                        placeholder={`Артикул ${index + 1}`}
                        value={article}
                        onChange={(event) => updateSearchArticle(index, event.target.value)}
                        className={styles.searchInput}
                      />
                      <button
                        type="button"
                        onClick={() => removeSearchArticle(index)}
                        className={styles.removeSearchButton}
                        aria-label="Удалить артикул"
                      >
                        <X className={styles.searchActionIcon} />
                      </button>
                    </div>
                  );
                })}
                <div className={styles.dropdownFooter}>
                  <button
                    type="button"
                    onClick={addSearchArticle}
                    className={styles.dropdownAddButton}
                  >
                    <Plus className={styles.searchActionIcon} />
                    Еще товар
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={styles.searchActions}>
            <button type="button" onClick={addSearchArticle} className={styles.addSearchButton}>
              <Plus className={styles.searchActionIcon} />
              <span className={styles.searchActionLabel}>Еще товар</span>
            </button>
            <button type="submit" className={styles.searchButton} aria-label="Поиск">
              <Image
                src="/search-button.png"
                alt=""
                width={56}
                height={48}
                className={styles.searchImage}
              />
            </button>
          </div>
        </form>
      </div>

      <div className={styles.ticker}>
        <div ref={tickerRef} className={styles.tickerViewport}>
          <div className={styles.tickerTrack}>
            <div className={styles.tickerContent}>
              <Link href="/catalog" className={styles.tickerLink}>
                {TICKER_TEXT}
              </Link>
              <span className={styles.tickerSeparator}>-</span>
            </div>
            <div className={styles.tickerContent} aria-hidden>
              <span>{TICKER_TEXT}</span>
              <span className={styles.tickerSeparator}>-</span>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobileOverlay}>
          <button
            type="button"
            className={styles.mobileBackdrop}
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть меню"
          />
          <nav className={styles.mobilePanel}>
            <div className={styles.mobilePanelHeader}>
              <span className={styles.mobilePanelTitle}>Меню</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className={styles.closeButton}
                aria-label="Закрыть"
              >
                <X className={styles.closeIcon} />
              </button>
            </div>
            <ul className={styles.mobileNav}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={styles.mobileNavLink}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.mobilePanelFooter}>
              <a href="tel:+74996776257" className={styles.mobilePanelPhone}>
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
