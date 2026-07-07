'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {Loader2} from 'lucide-react';
import type {CreateOrderInputItem} from '@/lib/orders/types';
import type {Product} from '@/src/fsd/entities/product';
import styles from './checkout-page.module.css';

const CART_STORAGE_KEY = 'ducati-cart';
const DELIVERY_PRICE = 990;
const COUNTRY = 'Российская Федерация';
const DELIVERY_METHOD = 'Почта России';
const EXPECTED_DELIVERY_DATE = '29 июня - 13 июля';
const SUMMARY_TOP_OFFSET = 168;

type Props = {
  items: CreateOrderInputItem[];
  checkoutItems: Array<{product: Product; quantity: number}>;
  subtotal: number;
};

function formatPrice(amount: number) {
  return `${amount.toLocaleString('ru-RU')} €`;
}

export default function CheckoutForm({items, checkoutItems, subtotal}: Props) {
  const summarySlotRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const [summaryMode, setSummaryMode] = useState<'static' | 'fixed' | 'bottom'>('static');
  const [summaryFixedStyle, setSummaryFixedStyle] = useState<React.CSSProperties>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Универсальный платеж');
  const [agreed, setAgreed] = useState(false);
  const [registerAccount, setRegisterAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{orderId: string} | null>(null);
  const total = subtotal + DELIVERY_PRICE;

  useEffect(() => {
    function updateSummaryMode() {
      const slot = summarySlotRef.current;
      const summary = summaryRef.current;

      if (!slot || !summary || window.innerWidth <= 1100) {
        setSummaryMode('static');
        return;
      }

      const slotRect = slot.getBoundingClientRect();
      const summaryHeight = summary.offsetHeight;
      const fixedStyle = {
        left: `${slotRect.left}px`,
        width: `${slotRect.width}px`,
      };

      if (slotRect.top > SUMMARY_TOP_OFFSET) {
        setSummaryMode('static');
        setSummaryFixedStyle({});
        return;
      }

      if (slotRect.bottom - SUMMARY_TOP_OFFSET <= summaryHeight) {
        setSummaryMode('bottom');
        setSummaryFixedStyle({});
        return;
      }

      setSummaryMode('fixed');
      setSummaryFixedStyle(fixedStyle);
    }

    updateSummaryMode();
    window.addEventListener('scroll', updateSummaryMode, {passive: true});
    window.addEventListener('resize', updateSummaryMode);

    return () => {
      window.removeEventListener('scroll', updateSummaryMode);
      window.removeEventListener('resize', updateSummaryMode);
    };
  }, [checkoutItems.length]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!agreed) {
      setError('Подтвердите согласие с офертой');
      return;
    }

    const extraComment = [
      `Страна: ${COUNTRY}`,
      `Ожидаемая дата доставки: ${EXPECTED_DELIVERY_DATE}`,
    ]
      .filter(Boolean)
      .join('\n');

    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          customer_name: name,
          email,
          phone,
          city,
          postal_address: postalAddress,
          comment: [comment, extraComment].filter(Boolean).join('\n\n'),
          payment_method: paymentMethod,
          delivery_method: DELIVERY_METHOD,
          agreed_to_terms: agreed,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось оформить заказ');
      }

      window.localStorage.removeItem(CART_STORAGE_KEY);
      setSuccess({orderId: data.id});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось оформить заказ');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>Заказ принят</h2>
        <p className={styles.successText}>
          ID заказа: <strong>{success.orderId}</strong>
        </p>
        <p className={styles.successHint}>
          Мы проверим наличие и свяжемся с вами. После подтверждения администратором на{' '}
          <strong>{email}</strong> придёт письмо с составом заказа.
        </p>
        <Link href="/catalog" className={styles.successLink}>
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.checkout} onSubmit={handleSubmit}>
      <div className={styles.formColumn}>
        <h1 className={styles.title}>Оформление заказа</h1>

        <Link href="/cart" className={styles.returningLink}>
          Уже покупали у нас?
        </Link>

        <section className={styles.formBlock}>
          <h2 className={styles.sectionTitle}>Контактные данные</h2>
          <label className={styles.field}>
            <span>Ваше имя и фамилия<span className={styles.required}>*</span></span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>Контактный телефон<span className={styles.required}>*</span></span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
            />
          </label>

          <p className={styles.contactHint}>
            Укажите пожалуйста в комментарии к заказу, в каком мессенджере мы можем с вами
            связаться для оперативного общения. Если используете ТГ, напишите по возможности имя
            пользователя!?
          </p>

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </label>
        </section>

        <section className={styles.formBlock}>
          <h2 className={styles.sectionTitle}>Доставка</h2>
          <label className={styles.field}>
            <span>Населенный пункт<span className={styles.required}>*</span></span>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={styles.input}
            />
          </label>

          <div className={styles.deliveryChoice}>
            <div className={styles.radioDot} />
            <div className={styles.deliveryText}>
              <strong>Почта России</strong>
              <span>Доставка в отделение Почты России</span>
            </div>
            <strong className={styles.deliveryPrice}>+ {formatPrice(DELIVERY_PRICE)}</strong>
          </div>

          <label className={styles.field}>
            <span>
              Индекс и адрес отделения Почты России<span className={styles.required}>*</span>
            </span>
            <textarea
              rows={4}
              required
              value={postalAddress}
              onChange={(e) => setPostalAddress(e.target.value)}
              className={styles.textarea}
            />
          </label>

          <label className={styles.field}>
            <span>Комментарии к заказу</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={styles.textarea}
          />
        </label>
      </section>

      <section className={styles.formBlock}>
        <h2 className={styles.sectionTitle}>Покупатель</h2>
        <label className={styles.checkLine}>
          <input
            type="checkbox"
            checked={registerAccount}
            onChange={(e) => setRegisterAccount(e.target.checked)}
            className={styles.nativeCheckbox}
          />
          <span>
            <strong>Зарегистрироваться</strong>
            <small>Вы получите доступ к личному кабинету со всеми вытекающими</small>
          </span>
        </label>
      </section>

      <section className={styles.formBlock}>
        <h2 className={styles.sectionTitle}>
          Способ оплаты<span className={styles.required}>*</span>
        </h2>
        <div className={styles.paymentChoice}>
          <div className={styles.radioDot} />
          <div>
            <strong>Наличными/Переводом/Картой</strong>
            <span>Оплата наличными, переводом или банковской картой</span>
          </div>
        </div>
        <input type="hidden" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
      </section>

        <label className={styles.checkLine}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className={styles.nativeCheckbox}
          />
          <span>
            <strong>Согласие на обработку персональных данных<span className={styles.required}>*</span></strong>
            <small>
              Я ознакомлен и согласен с условиями{' '}
              <Link href="/offer" className={styles.offerLink}>оферты и политики конфиденциальности.</Link>
            </small>
        </span>
      </label>

      {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? (
            <>
              <Loader2 className={styles.spinner} />
              Отправляем...
            </>
          ) : (
            'Подтвердить заказ'
          )}
        </button>
      </div>

      <div ref={summarySlotRef} className={styles.summarySlot}>
        <aside
          ref={summaryRef}
          className={`${styles.summary} ${
            summaryMode === 'fixed'
              ? styles.summaryFixed
              : summaryMode === 'bottom'
                ? styles.summaryBottom
                : styles.summaryStatic
          }`}
          style={summaryMode === 'fixed' ? summaryFixedStyle : undefined}
        >
          <div className={styles.summaryItems}>
            {checkoutItems.map(({product, quantity}) => (
              <div key={product.id} className={styles.summaryProduct}>
                <div className={styles.summaryImageBox}>
                  <div className={styles.productPlaceholder}>DUCATI</div>
                </div>
                <div className={styles.summaryProductTitle}>{product.title}</div>
                <div className={styles.summaryProductPrice}>
                  {quantity} x <strong>{formatPrice(product.price * quantity)}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summaryDivider} />

          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>Сумма по товарам</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Стоимость доставки</span>
              <strong>{formatPrice(DELIVERY_PRICE)}</strong>
            </div>
          </div>

          <div className={styles.summaryDivider} />

          <div className={styles.summaryTotal}>
            <span>Итого:</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </aside>
      </div>
    </form>
  );
}
