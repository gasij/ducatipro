'use client';

import {useState} from 'react';
import Link from 'next/link';
import {Loader2} from 'lucide-react';
import type {CreateOrderInputItem} from '@/lib/orders/types';
import type {Product} from '@/src/fsd/entities/product';
import {
  CART_STORAGE_KEY,
  calculateDeliveryPriceEur,
  convertPriceToRub,
  formatPriceInRub,
  notifyCartUpdated,
} from '@/src/fsd/shared/lib';
import styles from './checkout-page.module.css';

const COUNTRY = 'Российская Федерация';
const DELIVERY_METHOD = 'EMS / СДЭК';
const ORDER_PROCESSING_FEE_EUR = 15;
const ORDER_PROCESSING_FEE = `€${ORDER_PROCESSING_FEE_EUR}`;
const EXPECTED_DELIVERY_DATE = '29 июня - 13 июля';

type Props = {
  items: CreateOrderInputItem[];
  checkoutItems: Array<{product: Product; quantity: number}>;
};

export default function CheckoutForm({items, checkoutItems}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [city, setCity] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [pvzAddress, setPvzAddress] = useState('');
  const [comment, setComment] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{orderId: string} | null>(null);
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const totalWeightKg = checkoutItems.reduce(
    (sum, item) => sum + (item.product.weight || 0) * item.quantity,
    0,
  );
  const deliveryPriceEur = calculateDeliveryPriceEur(totalWeightKg);
  const processingFeeRub = convertPriceToRub(ORDER_PROCESSING_FEE_EUR, 'EUR');
  const totalWithProcessingFee = subtotal + processingFeeRub;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!agreed) {
      setError('Подтвердите согласие с офертой');
      return;
    }

    const extraComment = [
      `Страна: ${COUNTRY}`,
      telegramUsername ? `Telegram: ${telegramUsername}` : '',
      pvzAddress ? `Адрес ПВЗ СДЭК: ${pvzAddress}` : '',
      `Фикс. сбор за обработку заказа: ${ORDER_PROCESSING_FEE}`,
      `Доставка EMS: €${deliveryPriceEur} (вес: ${totalWeightKg} кг)`,
      `Итоговая цена без доставки EMS: ${formatPriceInRub(totalWithProcessingFee, 'RUB')}`,
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
          payment_method: 'Универсальный платеж',
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
      notifyCartUpdated();
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
        <section className={styles.recipientBlock}>
          <h1 className={styles.sectionTitle}>Получатель и адрес доставки</h1>
          <div className={styles.fieldGrid}>
            <input
              type="text"
              required
              placeholder="Имя и Фамилия"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${styles.input} ${styles.fullField}`}
            />
            <input
              type="tel"
              required
              placeholder="Телефон для связи"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Username Telegram"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              className={`${styles.input} ${styles.fullField}`}
            />
            <input
              type="text"
              value={COUNTRY}
              readOnly
              className={styles.input}
            />
            <input
              type="text"
              required
              placeholder="Город"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              required
              placeholder="Индекс и адрес удобного отделения Почты России"
              value={postalAddress}
              onChange={(e) => setPostalAddress(e.target.value)}
              className={`${styles.input} ${styles.fullField}`}
            />
            <input
              type="text"
              placeholder="Адрес ПВЗ СДЭК, где удобно получить товар"
              value={pvzAddress}
              onChange={(e) => setPvzAddress(e.target.value)}
              className={`${styles.input} ${styles.fullField}`}
            />
          </div>

          <p className={styles.contactHint}>
            Укажите пожалуйста в комментарии к заказу, в каком мессенджере мы можем с вами
            связаться для оперативного общения. Если используете ТГ, напишите по возможности имя
            пользователя!?
          </p>

          <textarea
            rows={4}
            placeholder="Комментарий"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={styles.textarea}
          />
        </section>

        <section className={styles.paymentBlock}>
          <h2 className={styles.sectionTitle}>Варианты оплаты</h2>
          <div className={styles.paymentChoice}>
            <span className={styles.radioCircle} />
            <span className={styles.paymentName}>Универсальный платеж</span>
            <span className={styles.paymentIcons} aria-hidden="true">
              <span className={styles.bankIcon}>$</span>
              <span className={styles.tIcon}>T</span>
              <span className={styles.tonIcon}>◈</span>
            </span>
          </div>
          <div className={styles.paymentText}>
            <p>
              К сожалению банковские переводы из России в Европу временно заблокированы, но не
              беспокойтесь. Варианты оплаты есть.
            </p>
            <p>
              Мы принимаем оплаты в Евро на расчетный счет свифт-переводом, по ссылке или PayPal
              (если у вас есть счет за границей).
            </p>
            <p>Также принимаем тезерами на кошелек или рублями по курсу ЦБ +6%</p>
            <p className={styles.greenText}>
              Завершите оформление заявки в корзине, подтвердите заказ, после чего мы свяжемся с
              вами и обсудим дальнейшие действия
            </p>
          </div>
        </section>

        <label className={styles.checkLine}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className={styles.nativeCheckbox}
          />
          <span>
            Я ознакомлен и согласен с условиями{' '}
            <Link href="/offer" className={styles.offerLink}>оферты и политики конфиденциальности</Link>
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

      <aside className={styles.summary}>
        <div className={styles.summaryItems}>
          {checkoutItems.map(({product, quantity}) => (
            <OrderProduct key={product.id} product={product} quantity={quantity} />
          ))}
        </div>

          <div className={styles.deliveryInfo}>
            <p>Метод доставки: {DELIVERY_METHOD}</p>
            <p>Фикс. сбор за обработку заказа: {ORDER_PROCESSING_FEE}</p>
            <p>Доставка EMS: €{deliveryPriceEur}</p>
            <p>Ожидаемая дата доставки: {EXPECTED_DELIVERY_DATE}</p>
            <div className={styles.totalRows}>
              <div className={styles.totalRow}>
                <span>Сумма товаров:</span>
                <strong>{formatPriceInRub(subtotal, 'RUB')}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>Сбор за обработку:</span>
                <strong>{formatPriceInRub(processingFeeRub, 'RUB')}</strong>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Итого без доставки EMS:</span>
                <strong>{formatPriceInRub(totalWithProcessingFee, 'RUB')}</strong>
              </div>
            </div>
          </div>

          <div className={styles.processingInfo}>
            <p>
              Время на обработку, сбор и подготовку заказа к отправке 5-10 рабочих дней.
              В некоторых случаях этот срок может быть увеличен, например, если производитель или
              поставщик товара сообщит об отсутствии его на складе. В этом случае мы обязательно
              вас уведомим о возможной задержке и предоставим возможность отказаться от размещения
              заявки
            </p>
          </div>
      </aside>
    </form>
  );
}

function OrderProduct({product, quantity}: {product: Product; quantity: number}) {
  return (
    <div className={styles.summaryProduct}>
      <div className={styles.summaryImageBox}>
        <div className={styles.productPlaceholder}>DUCATI</div>
      </div>
      <div className={styles.summaryProductTitle}>{product.title}</div>
      <div className={styles.summaryProductPrice}>
        {quantity} x <strong>{formatPriceInRub(product.price * quantity, 'RUB')}</strong>
      </div>
    </div>
  );
}
