'use client';

import {useEffect, useMemo, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {BadgeDollarSign, Check, CreditCard, Landmark, ShoppingCart, Trash2, Wallet} from 'lucide-react';
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

const PAYMENT_METHODS = [
  {Icon: CreditCard, label: 'Карта'},
  {Icon: Landmark, label: 'Банковский перевод'},
  {Icon: Wallet, label: 'Электронный кошелек'},
  {Icon: BadgeDollarSign, label: 'SWIFT / PayPal'},
];

function formatPrice(amount: number) {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

export default function CartClient({initialItem, products}: Props) {
  const [line, setLine] = useState<CartLine | null>(null);
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string; discount: number} | null>(null);
  const [promoMessage, setPromoMessage] = useState('');

  const quantity = line?.quantity ?? 0;
  const subtotal = line ? line.product.price * line.quantity : 0;
  const discountAmount = appliedPromo ? Math.round((subtotal * appliedPromo.discount) / 100) : 0;
  const total = Math.max(subtotal - discountAmount, 0);

  const recentItem = initialItem;
  const checkoutHref = line
    ? `/checkout?items=${encodeURIComponent(
        JSON.stringify([{product_id: line.product.id, quantity: line.quantity}]),
      )}`
    : '/checkout';
  const itemCountLabel = useMemo(() => {
    if (quantity === 1) return 'Товар (1)';
    return `Товары (${quantity})`;
  }, [quantity]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!rawCart) {
        return;
      }

      try {
        const cart = JSON.parse(rawCart) as Array<{product_id: string; quantity: number}>;
        const firstItem = cart.find((item) => item.product_id && item.quantity > 0);
        const product = products.find((item) => item.id === firstItem?.product_id);

        if (firstItem && product) {
          setLine({
            product,
            quantity: Math.min(Math.max(Math.floor(firstItem.quantity), 1), 99),
          });
        }
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [products]);

  function persistLine(nextLine: CartLine | null) {
    if (!nextLine) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{product_id: nextLine.product.id, quantity: nextLine.quantity}]),
    );
  }

  function increase() {
    setLine((current) => {
      const next = current ? {...current, quantity: Math.min(current.quantity + 1, 99)} : current;
      persistLine(next);
      return next;
    });
  }

  function decrease() {
    setLine((current) => {
      if (!current) return current;
      const next = {...current, quantity: Math.max(current.quantity - 1, 1)};
      persistLine(next);
      return next;
    });
  }

  function removeItem() {
    setLine(null);
    persistLine(null);
    setAppliedPromo(null);
    setPromoMessage('');
  }

  function restoreItem() {
    const next = {product: initialItem, quantity: 1};
    setLine(next);
    persistLine(next);
  }

  function applyPromo() {
    const code = promo.trim().toUpperCase();
    const discount = PROMO_CODES[code];

    if (!line) {
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
        <div className={styles.mainColumn}>
          <h1 className={styles.title}>Корзина</h1>

          {line ? (
            <div className={styles.items}>
              <div className={styles.cartItem}>
                <Link href={getProductHref(line.product)} className={styles.itemImageLink}>
                  <Image
                    src={line.product.image}
                    fill
                    alt={line.product.title}
                    className={styles.itemImage}
                    referrerPolicy="no-referrer"
                  />
                </Link>

                <div className={styles.itemInfo}>
                  <div className={styles.itemHeader}>
                    <Link href={getProductHref(line.product)} className={styles.itemTitle}>
                      {line.product.title}
                    </Link>
                    <button
                      type="button"
                      onClick={removeItem}
                      className={styles.removeButton}
                      aria-label="Удалить"
                    >
                      <Trash2 className={styles.removeIcon} />
                    </button>
                  </div>

                  <div className={styles.unitPrice}>{line.product.priceFormatted}/шт</div>

                  <div className={styles.itemFooter}>
                    <div className={styles.quantity}>
                      <button
                        type="button"
                        onClick={decrease}
                        className={styles.quantityButton}
                        aria-label="Уменьшить количество"
                      >
                        -
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
                        onClick={increase}
                        className={styles.quantityButton}
                        aria-label="Увеличить количество"
                      >
                        +
                      </button>
                    </div>
                    <div className={styles.lineTotal}>{formatPrice(subtotal)}</div>
                  </div>
                </div>
              </div>
            </div>
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
              <Link href={getProductHref(recentItem)} className={styles.recentCard}>
                <div className={styles.recentImageBox}>
                  <Image
                    src={recentItem.image}
                    fill
                    alt={recentItem.title}
                    className={styles.recentImage}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className={styles.recentInfo}>
                  <div className={styles.recentTitle}>{recentItem.title}</div>
                  <div className={styles.recentPrice}>{recentItem.priceFormatted}</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Введите промокод</h3>
            <div className={styles.promoForm}>
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
              <button
                type="button"
                onClick={applyPromo}
                className={styles.promoButton}
                aria-label="Применить промокод"
              >
                <Check className={styles.promoIcon} />
              </button>
            </div>
            {promoMessage && (
              <p className={appliedPromo ? styles.promoSuccess : styles.promoError}>
                {promoMessage}
              </p>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.summaryRow}>
              <span>{itemCountLabel}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {appliedPromo && (
              <div className={styles.summaryRow}>
                <span>Скидка {appliedPromo.discount}%</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className={styles.summaryTotal}>
              <span className={styles.summaryLabel}>Итого:</span>
              <span className={styles.summaryPrice}>{formatPrice(total)}</span>
            </div>

            <div className={styles.paymentBlock}>
              <div className={styles.paymentTitle}>Оплата</div>
              <div className={styles.paymentIcons}>
                {PAYMENT_METHODS.map(({Icon, label}) => (
                  <div key={label} className={styles.paymentBadge} title={label}>
                    <Icon className={styles.paymentIcon} />
                  </div>
                ))}
              </div>
            </div>

            {line ? (
              <Link href={checkoutHref} className={styles.checkoutLink}>
                Оформить заказ
              </Link>
            ) : (
              <button type="button" disabled className={styles.checkoutButtonDisabled}>
                Оформить заказ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
