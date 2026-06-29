'use client';

import {useMemo, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Check, ShoppingCart, Trash2} from 'lucide-react';
import type {Product} from '@/src/fsd/entities/product';
import emptyStyles from '@/app/empty-state.module.css';
import styles from './cart-page.module.css';

type CartLine = {
  product: Product;
  quantity: number;
};

type Props = {
  initialItem: Product;
};

const PROMO_CODES: Record<string, number> = {
  DUCATI10: 10,
  COFFEE: 5,
};

function formatPrice(amount: number) {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

export default function CartClient({initialItem}: Props) {
  const [line, setLine] = useState<CartLine | null>({product: initialItem, quantity: 1});
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string; discount: number} | null>(null);
  const [promoMessage, setPromoMessage] = useState('');

  const quantity = line?.quantity ?? 0;
  const subtotal = line ? line.product.price * line.quantity : 0;
  const discountAmount = appliedPromo ? Math.round((subtotal * appliedPromo.discount) / 100) : 0;
  const total = Math.max(subtotal - discountAmount, 0);

  const recentItem = initialItem;
  const itemCountLabel = useMemo(() => {
    if (quantity === 1) return 'Товар (1)';
    return `Товары (${quantity})`;
  }, [quantity]);

  function increase() {
    setLine((current) =>
      current ? {...current, quantity: Math.min(current.quantity + 1, 99)} : current,
    );
  }

  function decrease() {
    setLine((current) => {
      if (!current) return current;
      return {...current, quantity: Math.max(current.quantity - 1, 1)};
    });
  }

  function removeItem() {
    setLine(null);
    setAppliedPromo(null);
    setPromoMessage('');
  }

  function restoreItem() {
    setLine({product: initialItem, quantity: 1});
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
                <Link href={`/product/${line.product.id}`} className={styles.itemImageLink}>
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
                    <Link href={`/product/${line.product.id}`} className={styles.itemTitle}>
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
              <Link href={`/product/${recentItem.id}`} className={styles.recentCard}>
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
            {line ? (
              <Link href="/checkout" className={styles.checkoutLink}>
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
