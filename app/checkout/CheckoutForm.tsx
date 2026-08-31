'use client';

import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Loader2} from 'lucide-react';
import type {CreateOrderInputItem} from '@/lib/orders/types';
import type {Product} from '@/src/fsd/entities/product';
import {
  CART_STORAGE_KEY,
  calculateDeliveryPriceEur,
  formatEurPrice,
  formatRubHint,
  notifyCartUpdated,
  ORDER_PROCESSING_FEE_EUR,
} from '@/src/fsd/shared/lib';
import styles from './checkout-page.module.css';

const COUNTRY = 'Российская Федерация';
const DELIVERY_METHOD = 'EMS / СДЭК';
const PAYMENT_METHOD = 'Универсальный платеж';
const ORDER_PROCESSING_FEE = `€${ORDER_PROCESSING_FEE_EUR}`;
const FALLBACK_PRODUCT_IMAGE = '/ducati-logo.png';
// Matches the "Доставка: 4-6 недель" note shown on the product page.
const DELIVERY_WINDOW_MIN_DAYS = 28;
const DELIVERY_WINDOW_MAX_DAYS = 42;

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getExpectedDeliveryDateRange() {
  const formatter = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long'});
  const now = new Date();
  const from = formatter.format(addDays(now, DELIVERY_WINDOW_MIN_DAYS));
  const to = formatter.format(addDays(now, DELIVERY_WINDOW_MAX_DAYS));

  return `${from} - ${to}`;
}
// The pixel offset `.summaryInner` tries to stick to, mimicking what
// `position: sticky; top: 11.5rem` would do — must clear the sticky header's
// height (~174px) so the sidebar's top never renders underneath it.
const SUMMARY_TOP_OFFSET_PX = 184;
const SUMMARY_BOTTOM_BUFFER_PX = 24;
// Below this browser width the layout switches to a single column (see the
// `max-width: 1100px` media query in checkout-page.module.css), where the
// sidebar is intentionally not sticky at all — skip the JS override there.
const DESKTOP_LAYOUT_MIN_WIDTH_PX = 1100;

type Props = {
  items: CreateOrderInputItem[];
  checkoutItems: Array<{product: Product; quantity: number}>;
  eurToRubRate: number;
  rateMarkupPercent: number;
};

export default function CheckoutForm({items, checkoutItems, eurToRubRate, rateMarkupPercent}: Props) {
  const expectedDeliveryDate = getExpectedDeliveryDateRange();
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
  const totalWithProcessingFee = subtotal + ORDER_PROCESSING_FEE_EUR;
  const grandTotal = totalWithProcessingFee + deliveryPriceEur;

  const checkoutRootRef = useRef<HTMLFormElement>(null);
  const summaryInnerRef = useRef<HTMLDivElement>(null);
  const rowTopDocRef = useRef(0);
  const footerTopDocRef = useRef(Infinity);
  const [summaryInnerTop, setSummaryInnerTop] = useState(0);

  useEffect(() => {
    const formEl = checkoutRootRef.current;
    if (!formEl) return;

    let ticking = false;

    // `.summaryInner`'s pixel `top` is recomputed by hand on every
    // scroll/resize to mimic `position: sticky; top: 11.5rem` — but clamped
    // between the row's own natural top (so it never renders above where it
    // starts) and a "resting" position that keeps its bottom edge clear of
    // the page's <footer>. Native CSS sticky can't do the footer part on its
    // own: it's confined to the grid row it shares with `.formColumn`, so
    // once that (usually much shorter) row ends, native sticky either lets
    // the box's top creep up under the header or — if height-clamped —
    // shrinks the box to a sliver long before the footer is anywhere close.
    function applyPosition() {
      ticking = false;

      if (window.innerWidth < DESKTOP_LAYOUT_MIN_WIDTH_PX) {
        return;
      }

      const naturalHeight = summaryInnerRef.current?.scrollHeight ?? 0;
      const idealTopDoc = window.scrollY + SUMMARY_TOP_OFFSET_PX;
      const restTopDoc = footerTopDocRef.current - SUMMARY_BOTTOM_BUFFER_PX - naturalHeight;
      const clampedTopDoc = Math.min(
        Math.max(idealTopDoc, rowTopDocRef.current),
        Math.max(restTopDoc, rowTopDocRef.current),
      );
      setSummaryInnerTop(clampedTopDoc - rowTopDocRef.current);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyPosition);
    }

    function remeasure() {
      if (!formEl) return;
      rowTopDocRef.current = formEl.getBoundingClientRect().top + window.scrollY;
      const footerEl = document.querySelector('footer');
      footerTopDocRef.current = footerEl
        ? footerEl.getBoundingClientRect().top + window.scrollY
        : Infinity;
      applyPosition();
    }

    remeasure();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', remeasure);
    const resizeObserver = new ResizeObserver(remeasure);
    resizeObserver.observe(formEl);
    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', remeasure);
      resizeObserver.disconnect();
    };
  }, []);

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
      `Итоговая цена без доставки EMS: ${formatEurPrice(totalWithProcessingFee)} (${formatRubHint(totalWithProcessingFee, eurToRubRate)})`,
      `Ожидаемая дата доставки: ${expectedDeliveryDate}`,
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
          payment_method: PAYMENT_METHOD,
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
    const orderDate = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return (
      <div className={styles.success}>
        <h1 className={styles.successTitle}>Спасибо за ваш заказ на ducatiparts.ru</h1>
        <h2 className={styles.successSubtitle}>Информация о заказе</h2>

        <div className={styles.successInfoGrid}>
          <div className={styles.successInfoColumn}>
            <p>Номер заказа: {success.orderId}</p>
            <p>Дата оформления: {orderDate}</p>
            <p>Способ оплаты: {PAYMENT_METHOD}</p>
            <p>Способ доставки: {DELIVERY_METHOD}</p>
            <p>Статус заказа: В обработке</p>
          </div>
          <div className={styles.successInfoColumn}>
            <p>Получатель:</p>
            <p>{name}</p>
            <p>{postalAddress}</p>
            <p>{city}</p>
            <p>{COUNTRY}</p>
            <p>{phone}</p>
          </div>
        </div>

        <p className={styles.successText}>Ваш заказ будет принят в обработку только после оплаты.</p>
        <p className={styles.successText}>
          В ближайшее время мы свяжемся с вами для обсуждения дальнейших действий.
        </p>

        <table className={styles.successTable}>
          <thead>
            <tr>
              <th>Детализация заказа</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Итого</th>
            </tr>
          </thead>
          <tbody>
            {checkoutItems.map(({product, quantity}) => (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td>{quantity}</td>
                <td>{formatEurPrice(product.price)}</td>
                <td>{formatEurPrice(product.price * quantity)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}>Express Mail Service (EMS):</td>
              <td>{formatEurPrice(deliveryPriceEur)}</td>
            </tr>
            <tr>
              <td colSpan={3}>Фикс. сбор за обработку заказа:</td>
              <td>{formatEurPrice(ORDER_PROCESSING_FEE_EUR)}</td>
            </tr>
            <tr className={styles.successTableTotalRow}>
              <td colSpan={3}>Итого:</td>
              <td>{formatEurPrice(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        <p className={styles.successFooter}>
          Благодарим вас за интерес к товарам в нашем интернет-магазине! Мы обязательно уведомим вас
          об изменении статуса вашего заказа.
          <br />
          Если у вас возникли вопросы, пишите нам в сообщении к заказу в кабинете или на{' '}
          orders@ducatiparts.ru
        </p>

        <Link href="/catalog-oem" className={styles.successLink}>
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.checkout} onSubmit={handleSubmit} ref={checkoutRootRef}>
      <div className={styles.formColumn}>
        <section className={styles.recipientBlock}>
          <h1 className={styles.sectionTitle}>Получатель и адрес доставки</h1>
          <p className={styles.requiredHint}>* — обязательные поля</p>
          <div className={styles.fieldGrid}>
            <input
              type="text"
              required
              placeholder="Имя и Фамилия *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${styles.input} ${styles.fullField}`}
            />
            <input
              type="tel"
              required
              placeholder="Телефон для связи *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
            />
            <input
              type="email"
              required
              placeholder="Email *"
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
              placeholder="Город *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              required
              placeholder="Индекс и адрес удобного отделения Почты России *"
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
            <span className={styles.paymentName}>{PAYMENT_METHOD}</span>
            <span className={styles.paymentIcons} aria-hidden="true">
              <Image
                src="/payment-icons/bankwire-payment.png"
                alt=""
                width={144}
                height={58}
                className={styles.paymentIconsImage}
              />
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
            <p>
              Также принимаем тезерами на кошелек или рублями по курсу ЦБ +
              {Number.isInteger(rateMarkupPercent) ? rateMarkupPercent : rateMarkupPercent.toFixed(2)}%
            </p>
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
        <div ref={summaryInnerRef} className={styles.summaryInner} style={{top: summaryInnerTop}}>
          <div className={styles.summaryItems}>
            {checkoutItems.map(({product, quantity}) => (
              <OrderProduct
                key={product.id}
                product={product}
                quantity={quantity}
                eurToRubRate={eurToRubRate}
              />
            ))}
          </div>

          <div className={styles.deliveryInfo}>
            <p>Метод доставки: {DELIVERY_METHOD}</p>
            <p>Ожидаемая дата доставки: {expectedDeliveryDate}</p>
            <div className={styles.totalRows}>
              <div className={styles.totalRow}>
                <span>Сумма товаров:</span>
                <div className={styles.totalValue}>
                  <strong>{formatEurPrice(subtotal)}</strong>
                  <span className={styles.totalValueRub}>{formatRubHint(subtotal, eurToRubRate)}</span>
                </div>
              </div>
              <div className={styles.totalRow}>
                <span>Сбор за обработку:</span>
                <div className={styles.totalValue}>
                  <strong>{formatEurPrice(ORDER_PROCESSING_FEE_EUR)}</strong>
                  <span className={styles.totalValueRub}>
                    {formatRubHint(ORDER_PROCESSING_FEE_EUR, eurToRubRate)}
                  </span>
                </div>
              </div>
              <div className={styles.totalRow}>
                <span>Доставка EMS:</span>
                <div className={styles.totalValue}>
                  <strong>{formatEurPrice(deliveryPriceEur)}</strong>
                  <span className={styles.totalValueRub}>
                    {formatRubHint(deliveryPriceEur, eurToRubRate)}
                  </span>
                </div>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Итого:</span>
                <div className={styles.totalValue}>
                  <strong>{formatEurPrice(grandTotal)}</strong>
                  <span className={styles.totalValueRub}>
                    {formatRubHint(grandTotal, eurToRubRate)}
                  </span>
                </div>
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
        </div>
      </aside>
    </form>
  );
}

function OrderProduct({
  product,
  quantity,
  eurToRubRate,
}: {
  product: Product;
  quantity: number;
  eurToRubRate: number;
}) {
  const [imageSrc, setImageSrc] = useState(product.image);

  return (
    <div className={styles.summaryProduct}>
      <div className={styles.summaryImageBox}>
        <Image
          src={imageSrc}
          fill
          alt={product.title}
          className={
            imageSrc === FALLBACK_PRODUCT_IMAGE
              ? `${styles.summaryImage} ${styles.summaryImageFallback}`
              : styles.summaryImage
          }
          sizes="64px"
          referrerPolicy="no-referrer"
          onError={() => setImageSrc(FALLBACK_PRODUCT_IMAGE)}
        />
      </div>
      <div className={styles.summaryProductTitle}>{product.title}</div>
      <div className={styles.summaryProductPrice}>
        <div>
          {quantity} x <strong>{formatEurPrice(product.price * quantity)}</strong>
        </div>
        <div className={styles.totalValueRub}>
          {formatRubHint(product.price * quantity, eurToRubRate)}
        </div>
      </div>
    </div>
  );
}
