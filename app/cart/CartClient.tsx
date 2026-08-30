'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Copy, Minus, Plus, Share2, ShoppingCart, X} from 'lucide-react';
import {getProductArticle, getProductHref, type Product} from '@/src/fsd/entities/product';
import {
  calculateDeliveryPriceEur,
  CART_STORAGE_KEY,
  formatEurPrice,
  formatRubHint,
  notifyCartUpdated,
  ORDER_PROCESSING_FEE_EUR,
} from '@/src/fsd/shared/lib';
import emptyStyles from '@/app/empty-state.module.css';
import styles from './cart-page.module.css';

const FALLBACK_PRODUCT_IMAGE = '/ducati-logo.png';

function CartProductImage({
  product,
  imageClassName,
  fallbackClassName,
  sizes,
}: {
  product: Product;
  imageClassName: string;
  fallbackClassName: string;
  sizes: string;
}) {
  const [imageSrc, setImageSrc] = useState(product.image);

  useEffect(() => {
    setImageSrc(product.image);
  }, [product.image]);

  return (
    <Image
      src={imageSrc}
      fill
      alt={product.title}
      className={imageSrc === FALLBACK_PRODUCT_IMAGE ? `${imageClassName} ${fallbackClassName}` : imageClassName}
      sizes={sizes}
      referrerPolicy="no-referrer"
      onError={() => setImageSrc(FALLBACK_PRODUCT_IMAGE)}
    />
  );
}

type CartLine = {
  product: Product;
  quantity: number;
};

type Props = {
  initialItem: Product;
  products: Product[];
  sharedItems: Array<{product_id: string; quantity: number}>;
  eurToRubRate: number;
};

const PROMO_CODES: Record<string, number> = {
  DUCATI10: 10,
  COFFEE: 5,
};

export default function CartClient({initialItem, products, sharedItems, eurToRubRate}: Props) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string; discount: number} | null>(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copyTooltipVisible, setCopyTooltipVisible] = useState(false);
  const copyTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTooltipTimeoutRef.current) {
        clearTimeout(copyTooltipTimeoutRef.current);
      }
    };
  }, []);

  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discountAmount = appliedPromo ? Math.round((subtotal * appliedPromo.discount) / 100) : 0;
  const totalWeightKg = lines.reduce((sum, line) => sum + (line.product.weight || 0) * line.quantity, 0);
  const deliveryPriceEur = lines.length > 0 ? calculateDeliveryPriceEur(totalWeightKg) : 0;
  const processingFeeEur = lines.length > 0 ? ORDER_PROCESSING_FEE_EUR : 0;
  const total = Math.max(subtotal - discountAmount, 0) + processingFeeEur + deliveryPriceEur;
  const lineProductIds = useMemo(() => new Set(lines.map((line) => line.product.id)), [lines]);
  const recentItems = useMemo(
    () => products.filter((product) => !lineProductIds.has(product.id)).slice(0, 2),
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

  const resolveCartLines = useCallback(
    (items: Array<{product_id: string; quantity: number}>) =>
      items
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
        .filter((item): item is CartLine => Boolean(item)),
    [products],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (sharedItems.length > 0) {
        const nextLines = resolveCartLines(sharedItems);
        setLines(nextLines);
        persistLines(nextLines);
        return;
      }

      const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!rawCart) {
        return;
      }

      try {
        const cart = JSON.parse(rawCart) as Array<{product_id: string; quantity: number}>;
        const nextLines = resolveCartLines(cart);

        setLines(nextLines);
        notifyCartUpdated();
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
        notifyCartUpdated();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [products, resolveCartLines, sharedItems]);

  function persistLines(nextLines: CartLine[]) {
    if (nextLines.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      notifyCartUpdated();
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
    notifyCartUpdated();
  }

  function increase(productId: string) {
    const next = lines.map((line) =>
      line.product.id === productId ? {...line, quantity: Math.min(line.quantity + 1, 99)} : line,
    );
    setLines(next);
    persistLines(next);
  }

  function decrease(productId: string) {
    const next = lines.map((line) =>
      line.product.id === productId ? {...line, quantity: Math.max(line.quantity - 1, 1)} : line,
    );
    setLines(next);
    persistLines(next);
  }

  function removeItem(productId: string) {
    const next = lines.filter((line) => line.product.id !== productId);
    setLines(next);
    persistLines(next);

    if (next.length === 0) {
      setAppliedPromo(null);
      setPromoMessage('');
    }
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

  async function copyTextToClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  }

  async function copyShareLink(url: string) {
    const copied = await copyTextToClipboard(url);

    if (copyTooltipTimeoutRef.current) {
      clearTimeout(copyTooltipTimeoutRef.current);
    }

    if (!copied) {
      setCopyTooltipVisible(false);
      setShareMessage('Не удалось скопировать ссылку, скопируйте её вручную');
      return;
    }

    setShareMessage('');
    setCopyTooltipVisible(true);
    copyTooltipTimeoutRef.current = setTimeout(() => {
      setCopyTooltipVisible(false);
    }, 3000);
  }

  async function shareCart() {
    if (lines.length === 0) {
      setShareMessage('Добавьте товар, чтобы поделиться корзиной');
      return;
    }

    setShareMessage('');

    const url = new URL('/cart', window.location.origin);
    url.searchParams.set(
      'items',
      JSON.stringify(
        lines.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
        })),
      ),
    );
    const urlString = url.toString();

    setShareUrl(urlString);
    await copyShareLink(urlString);
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <main className={styles.mainColumn}>
          <h1 className={styles.title}>Корзина</h1>

          {lines.length > 0 ? (
            <>
              <div className={styles.cartList}>
                {lines.map((line) => (
                  <div key={line.product.id} className={styles.cartItem}>
                    <Link href={getProductHref(line.product)} className={styles.itemImageLink}>
                      <CartProductImage
                        product={line.product}
                        imageClassName={styles.itemImage}
                        fallbackClassName={styles.itemImageFallback}
                        sizes="48px"
                      />
                    </Link>

                    <Link href={getProductHref(line.product)} className={styles.itemTitle}>
                      <span className={styles.itemSku}>{getProductArticle(line.product)}</span>{' '}
                      {line.product.title}
                    </Link>

                    <div className={styles.unitPrice}>
                      <span>{line.product.priceFormatted}/шт</span>
                      {line.product.priceRubFormatted && (
                        <span className={styles.priceRubHint}>{line.product.priceRubFormatted}</span>
                      )}
                    </div>

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
                      <span>{formatEurPrice(line.product.price * line.quantity)}</span>
                      <span className={styles.priceRubHint}>
                        {formatRubHint(line.product.price * line.quantity, eurToRubRate)}
                      </span>
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
                    <CartProductImage
                      product={product}
                      imageClassName={styles.recentImage}
                      fallbackClassName={styles.recentImageFallback}
                      sizes="96px"
                    />
                  </div>
                  <div className={styles.recentInfo}>
                    <div className={styles.recentTitle}>{product.title}</div>
                    <div className={styles.recentPrice}>{product.priceFormatted}</div>
                    {product.priceRubFormatted && (
                      <div className={styles.priceRubHint}>{product.priceRubFormatted}</div>
                    )}
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
              <div className={styles.summaryValue}>
                <span>{formatEurPrice(subtotal)}</span>
                <div className={styles.priceRubHint}>{formatRubHint(subtotal, eurToRubRate)}</div>
              </div>
            </div>
            {appliedPromo && (
              <div className={styles.summaryRow}>
                <span>Скидка {appliedPromo.discount}%</span>
                <div className={styles.summaryValue}>
                  <span>-{formatEurPrice(discountAmount)}</span>
                  <div className={styles.priceRubHint}>-{formatRubHint(discountAmount, eurToRubRate)}</div>
                </div>
              </div>
            )}
            {lines.length > 0 && (
              <>
                <div className={styles.summaryRow}>
                  <span>Фикс. сбор за обработку заказа</span>
                  <div className={styles.summaryValue}>
                    <span>{formatEurPrice(processingFeeEur)}</span>
                    <div className={styles.priceRubHint}>{formatRubHint(processingFeeEur, eurToRubRate)}</div>
                  </div>
                </div>
                <div className={styles.summaryRow}>
                  <span>Доставка EMS</span>
                  <div className={styles.summaryValue}>
                    <span>{formatEurPrice(deliveryPriceEur)}</span>
                    <div className={styles.priceRubHint}>{formatRubHint(deliveryPriceEur, eurToRubRate)}</div>
                  </div>
                </div>
              </>
            )}
            <div className={styles.summaryTotal}>
              <span>Итого:</span>
              <div className={styles.summaryValue}>
                <strong>{formatEurPrice(total)}</strong>
                <div className={styles.priceRubHint}>{formatRubHint(total, eurToRubRate)}</div>
              </div>
            </div>

            <div className={styles.deliveryDisclaimer}>
              <p>
                Прямая доставка EMS в почтовое отделение.
                <br />
                Общий срок доставки около 4 недель с момента оплаты.
              </p>
              <p className={styles.deliveryDisclaimerNote}>
                * Некоторые товары (их уже не менее половины) могут быть запрещены санкциями к
                отправке в РФ. В этом случае мы используем доставку через «третьи страны» в п.в.
                СДЭК в вашем городе. Возможные дополнительные расходы и сроки обсудим отдельно при
                согласовании доставки и оплаты.
              </p>
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

            <button type="button" onClick={shareCart} className={styles.shareButton}>
              Поделиться <Share2 className={styles.shareIcon} />
            </button>

            {shareUrl && (
              <div className={styles.shareLinkRow}>
                <span className={styles.shareLinkText} title={shareUrl}>
                  {shareUrl}
                </span>
                <div className={styles.copyButtonWrap}>
                  <button
                    type="button"
                    onClick={() => copyShareLink(shareUrl)}
                    className={styles.copyButton}
                    aria-label="Скопировать ссылку"
                  >
                    <Copy className={styles.copyIcon} />
                  </button>
                  <span
                    className={`${styles.copyTooltip} ${copyTooltipVisible ? styles.copyTooltipVisible : ''}`}
                    role="status"
                  >
                    Ссылка скопирована
                  </span>
                </div>
              </div>
            )}

            {shareMessage && <p className={styles.shareMessage}>{shareMessage}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
