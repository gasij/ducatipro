'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {Minus, Plus, Share2, ShoppingCart, X} from 'lucide-react';
import {getProductHref, type Product} from '@/src/fsd/entities/product';
import emptyStyles from '@/app/empty-state.module.css';
import styles from './cart-page.module.css';

type CartLine = {
  product: Product;
  quantity: number;
};

type Props = {
  initialItem: Product;
  products: Product[];
};

const CART_STORAGE_KEY = 'ducati-cart';

const PROMO_CODES: Record<string, number> = {
  DUCATI10: 10,
  COFFEE: 5,
};

function formatPrice(amount: number) {
  return `${amount.toLocaleString('ru-RU')} €`;
}

function getOldPrice(product: Product) {
  if (product.oldPrice) {
    return product.oldPrice;
  }

  return formatPrice(Math.round(product.price * 1.28));
}

export default function CartClient({initialItem, products}: Props) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string; discount: number} | null>(null);
  const [promoMessage, setPromoMessage] = useState('');

  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discountAmount = appliedPromo ? Math.round((subtotal * appliedPromo.discount) / 100) : 0;
  const total = Math.max(subtotal - discountAmount, 0);
  const lineProductIds = useMemo(() => new Set(lines.map((line) => line.product.id)), [lines]);
  const recentItems = useMemo(
    () => products.filter((product) => !lineProductIds.has(product.id)).slice(0, 2),
    [products, lineProductIds],
  );
  const outletItems = useMemo(
    () => products.filter((product) => !lineProductIds.has(product.id)).slice(0, 5),
    [products, lineProductIds],
  );

  const checkoutHref = lines.length > 0
    ? `/checkout?items=${encodeURIComponent(
        JSON.stringify(
          lines.map((line) => ({
            product_id: line.product.id,
            quantity: line.quantity,
          })),
        ),
      )}`
    : '/checkout';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!rawCart) {
        return;
      }

      try {
        const cart = JSON.parse(rawCart) as Array<{product_id: string; quantity: number}>;
        const nextLines = cart
          .map((item) => {
            const product = products.find((candidate) => candidate.id === item.product_id);

            if (!product || item.quantity < 1) {
              return null;
            }

            return {
              product,
              quantity: Math.min(Math.max(Math.floor(item.quantity), 1), 99),
            };
          })
          .filter((item): item is CartLine => Boolean(item));

        setLines(nextLines);
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [products]);

  function persistLines(nextLines: CartLine[]) {
    if (nextLines.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(
        nextLines.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
        })),
      ),
    );
  }

  function increase(productId: string) {
    setLines((current) => {
      const next = current.map((line) =>
        line.product.id === productId ? {...line, quantity: Math.min(line.quantity + 1, 99)} : line,
      );
      persistLines(next);
      return next;
    });
  }

  function decrease(productId: string) {
    setLines((current) => {
      const next = current.map((line) =>
        line.product.id === productId ? {...line, quantity: Math.max(line.quantity - 1, 1)} : line,
      );
      persistLines(next);
      return next;
    });
  }

  function removeItem(productId: string) {
    setLines((current) => {
      const next = current.filter((line) => line.product.id !== productId);
      persistLines(next);

      if (next.length === 0) {
        setAppliedPromo(null);
        setPromoMessage('');
      }

      return next;
    });
  }

  function restoreItem() {
    const next = [{product: initialItem, quantity: 1}];
    setLines(next);
    persistLines(next);
  }

  function applyPromo() {
    const code = promo.trim().toUpperCase();
    const discount = PROMO_CODES[code];

    if (lines.length === 0) {
      setPromoMessage('Добавьте товар, чтобы применить промокод');
      setAppliedPromo(null);
      return;
    }

    if (!code) {
      setPromoMessage('Введите промокод');
      setAppliedPromo(null);
      return;
    }

    if (!discount) {
      setPromoMessage('Промокод не найден');
      setAppliedPromo(null);
      return;
    }

    setAppliedPromo({code, discount});
    setPromoMessage(`Промокод ${code} применен`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.outlet}>
          <h2 className={styles.outletTitle}>Аутлет в России</h2>
          <div className={styles.outletList}>
            {outletItems.map((product) => (
              <Link key={product.id} href={getProductHref(product)} className={styles.outletCard}>
                <div className={styles.outletImageBox}>
                  <div className={styles.productPlaceholder}>DUCATI</div>
                </div>
                <div className={styles.outletInfo}>
                  <div className={styles.outletName}>{product.title}</div>
                  <div className={styles.outletPrice}>{product.priceFormatted}</div>
                  <div className={styles.outletOldPrice}>{getOldPrice(product)}</div>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        <main className={styles.mainColumn}>
          <h1 className={styles.title}>Корзина</h1>

          {lines.length > 0 ? (
            <>
              <div className={styles.cartList}>
                {lines.map((line) => (
                  <div key={line.product.id} className={styles.cartItem}>
                    <Link href={getProductHref(line.product)} className={styles.itemImageLink}>
                      <div className={styles.productPlaceholder}>DUCATI</div>
                    </Link>

                    <Link href={getProductHref(line.product)} className={styles.itemTitle}>
                      {line.product.title}
                    </Link>

                    <div className={styles.unitPrice}>{line.product.priceFormatted}/шт</div>

                    <div className={styles.quantity}>
                      <button
                        type="button"
                        onClick={() => decrease(line.product.id)}
                        className={styles.quantityButton}
                        aria-label="Уменьшить количество"
                      >
                        <Minus className={styles.quantityIcon} />
                      </button>
                      <input
                        type="text"
                        value={line.quantity}
                        readOnly
                        className={styles.quantityInput}
                        aria-label="Количество"
                      />
                      <button
                        type="button"
                        onClick={() => increase(line.product.id)}
                        className={styles.quantityButton}
                        aria-label="Увеличить количество"
                      >
                        <Plus className={styles.quantityIcon} />
                      </button>
                    </div>

                    <div className={styles.lineTotal}>
                      {formatPrice(line.product.price * line.quantity)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(line.product.id)}
                      className={styles.removeButton}
                      aria-label="Удалить"
                    >
                      <X className={styles.removeIcon} />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.promoRow}>
                <input
                  type="text"
                  value={promo}
                  onChange={(event) => setPromo(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      applyPromo();
                    }
                  }}
                  placeholder="Промокод"
                  className={styles.promoInput}
                />
                <button type="button" onClick={applyPromo} className={styles.promoButton}>
                  Применить
                </button>
              </div>
              {promoMessage && (
                <p className={appliedPromo ? styles.promoSuccess : styles.promoError}>
                  {promoMessage}
                </p>
              )}
            </>
          ) : (
            <div className={emptyStyles.page}>
              <ShoppingCart className={emptyStyles.icon} />
              <h2 className={emptyStyles.title}>Корзина пуста</h2>
              <p className={emptyStyles.description}>Товар удален из корзины.</p>
              <button type="button" onClick={restoreItem} className={emptyStyles.action}>
                Вернуть товар
              </button>
            </div>
          )}

          <div className={styles.recent}>
            <h2 className={styles.sectionTitle}>Ранее просмотренные</h2>
            <div className={styles.recentGrid}>
              {recentItems.map((product) => (
                <Link key={product.id} href={getProductHref(product)} className={styles.recentCard}>
                  <div className={styles.recentImageBox}>
                    <div className={styles.productPlaceholder}>DUCATI</div>
                  </div>
                  <div className={styles.recentInfo}>
                    <div className={styles.recentTitle}>{product.title}</div>
                    <div className={styles.recentPrice}>{product.priceFormatted}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>

        <aside className={styles.summary}>
          <div className={styles.summaryPanel}>
            <div className={styles.summaryRow}>
              <span>{quantity === 1 ? 'Товар (1)' : `Товары (${quantity})`}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {appliedPromo && (
              <div className={styles.summaryRow}>
                <span>Скидка {appliedPromo.discount}%</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className={styles.summaryTotal}>
              <span>Итого:</span>
              <strong>{formatPrice(total)}</strong>
            </div>

            {lines.length > 0 ? (
              <Link href={checkoutHref} className={styles.checkoutLink}>
                Оформить заказ
              </Link>
            ) : (
              <button type="button" disabled className={styles.checkoutButtonDisabled}>
                Оформить заказ
              </button>
            )}

            <button type="button" className={styles.shareButton}>
              Поделиться <Share2 className={styles.shareIcon} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
