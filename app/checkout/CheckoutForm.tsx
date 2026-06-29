'use client';

import {useState} from 'react';
import Link from 'next/link';
import {Check, Loader2} from 'lucide-react';
import type {OrderItem} from '@/lib/orders/types';
import styles from './checkout-page.module.css';

type Props = {
  items: OrderItem[];
  totalFormatted: string;
};

export default function CheckoutForm({items, totalFormatted}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{orderNumber: string} | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!agreed) {
      setError('Подтвердите согласие с офертой');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          delivery_address: address,
          comment,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось оформить заказ');
      }

      setSuccess({orderNumber: data.order_number});
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
          Номер заказа: <strong>{success.orderNumber}</strong>
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
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Имя *</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="Иван Иванов"
          />
        </label>

        <label className={styles.field}>
          <span>Email *</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="email@example.com"
          />
        </label>

        <label className={styles.field}>
          <span>Телефон *</span>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={styles.input}
            placeholder="+7 (999) 000-00-00"
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Адрес доставки *</span>
          <textarea
            required
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={styles.textarea}
            placeholder="Город, улица, дом, индекс"
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Комментарий к заказу</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={styles.textarea}
            placeholder="Уточнения по доставке или заказу"
          />
        </label>
      </div>

      <label className={styles.agreement}>
        <div className={styles.checkboxWrap}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className={styles.checkbox}
          />
          <Check className={styles.checkboxIcon} />
        </div>
        <span>
          Согласен с{' '}
          <Link href="/offer" className={styles.offerLink}>
            офертой и политикой конфиденциальности
          </Link>{' '}
          *
        </span>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <div className={styles.total}>
          <span>Итого к оплате:</span>
          <strong>{totalFormatted}</strong>
        </div>
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
    </form>
  );
}
