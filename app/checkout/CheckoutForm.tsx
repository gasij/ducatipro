'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import Script from 'next/script';
import {Check, Loader2, MapPin} from 'lucide-react';
import type {CreateOrderInputItem} from '@/lib/orders/types';
import styles from './checkout-page.module.css';

const CART_STORAGE_KEY = 'ducati-cart';
const CDEK_WIDGET_SCRIPT = 'https://cdn.jsdelivr.net/npm/@cdek-it/widget@3';
const CDEK_WIDGET_ROOT = 'cdek-map';
const CDEK_SERVICE_PATH = '/api/cdek/widget';
const CDEK_FROM_LOCATION = process.env.NEXT_PUBLIC_CDEK_FROM_LOCATION || 'Москва';
const CDEK_YANDEX_API_KEY = process.env.NEXT_PUBLIC_CDEK_YANDEX_API_KEY || '';

type CdekOfficeAddress = {
  city?: string;
  code: string;
  name: string;
  address: string;
  work_time?: string;
  postal_code?: string;
  type?: string;
};

type CdekTariff = {
  tariff_code?: number;
  tariff_name?: string;
  delivery_sum?: number;
  period_min?: number;
  period_max?: number;
};

type CdekDeliveryMode = 'office' | 'door';

type CdekWidgetConstructor = new (config: {
  from: string;
  root: string;
  apiKey: string;
  servicePath: string;
  canChoose: boolean;
  defaultLocation?: string;
  lang: 'rus';
  currency: 'RUB';
  goods: Array<{width: number; height: number; length: number; weight: number}>;
  hideDeliveryOptions: {door: boolean; office: boolean};
  forceFilters: {type: 'PVZ'};
  tariffs: {office: number[]};
  onReady?: () => void;
  onChoose?: (
    mode: CdekDeliveryMode,
    tariff: CdekTariff | null,
    address: CdekOfficeAddress,
  ) => void;
}) => unknown;

declare global {
  interface Window {
    CDEKWidget?: CdekWidgetConstructor;
  }
};

type Props = {
  items: CreateOrderInputItem[];
  totalFormatted: string;
};

export default function CheckoutForm({items, totalFormatted}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Российская Федерация');
  const [city, setCity] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [comment, setComment] = useState('');
  const [messengerContact, setMessengerContact] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('EMS / СДЭК');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('29 июня - 13 июля');
  const [paymentMethod, setPaymentMethod] = useState('Универсальный платеж');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{orderId: string} | null>(null);
  const [cdekScriptReady, setCdekScriptReady] = useState(false);
  const [cdekReady, setCdekReady] = useState(false);
  const [cdekError, setCdekError] = useState(
    CDEK_YANDEX_API_KEY ? '' : 'Добавьте NEXT_PUBLIC_CDEK_YANDEX_API_KEY для карты СДЭК',
  );
  const [selectedCdekCode, setSelectedCdekCode] = useState('');
  const cdekWidgetRef = useRef<unknown>(null);

  useEffect(() => {
    if (!cdekScriptReady || !CDEK_YANDEX_API_KEY || cdekWidgetRef.current || !window.CDEKWidget) {
      return;
    }

    try {
      cdekWidgetRef.current = new window.CDEKWidget({
        from: CDEK_FROM_LOCATION,
        root: CDEK_WIDGET_ROOT,
        apiKey: CDEK_YANDEX_API_KEY,
        servicePath: CDEK_SERVICE_PATH,
        canChoose: true,
        defaultLocation: city || 'Москва',
        lang: 'rus',
        currency: 'RUB',
        goods: [{width: 20, height: 10, length: 30, weight: 1000}],
        hideDeliveryOptions: {door: true, office: false},
        forceFilters: {type: 'PVZ'},
        tariffs: {office: [136, 234, 138]},
        onReady() {
          setCdekReady(true);
          setCdekError('');
        },
        onChoose(mode, tariff, address) {
          if (mode !== 'office') {
            return;
          }

          setSelectedCdekCode(address.code);
          setPickupAddress(
            [
              `СДЭК ${address.code}: ${address.city ? `${address.city}, ` : ''}${address.address}`,
              address.name,
              address.work_time ? `Время работы: ${address.work_time}` : '',
              address.postal_code ? `Индекс: ${address.postal_code}` : '',
              tariff?.tariff_name ? `Тариф: ${tariff.tariff_name}` : '',
              typeof tariff?.delivery_sum === 'number' ? `Стоимость доставки: ${tariff.delivery_sum} ₽` : '',
              tariff?.period_min && tariff?.period_max
                ? `Срок: ${tariff.period_min}-${tariff.period_max} дн.`
                : '',
            ]
              .filter(Boolean)
              .join('\n'),
          );
        },
      });
    } catch (err) {
      window.setTimeout(() => {
        setCdekError(err instanceof Error ? err.message : 'Не удалось загрузить виджет СДЭК');
      }, 0);
    }
  }, [cdekScriptReady, city]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!agreed) {
      setError('Подтвердите согласие с офертой');
      return;
    }

    const extraComment = [
      country ? `Страна: ${country}` : '',
      expectedDeliveryDate ? `Ожидаемая дата доставки: ${expectedDeliveryDate}` : '',
      messengerContact ? `Мессенджер: ${messengerContact}` : '',
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
          cdek_address: pickupAddress,
          comment: [comment, extraComment].filter(Boolean).join('\n\n'),
          payment_method: paymentMethod,
          delivery_method: deliveryMethod,
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
    <form className={styles.form} onSubmit={handleSubmit}>
      <Script
        src={CDEK_WIDGET_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setCdekScriptReady(true)}
        onError={() => setCdekError('Не удалось загрузить виджет СДЭК')}
      />
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Получатель и адрес доставки</h2>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Имя и Фамилия *</span>
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
            <span>Телефон для связи *</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
              placeholder="+7 (999) 000-00-00"
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
            <span>Страна *</span>
            <input
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>Город *</span>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={styles.input}
              placeholder="Москва"
            />
          </label>

          <label className={`${styles.field} ${styles.fieldFull}`}>
            <span>Индекс и адрес удобного отделения Почты России *</span>
            <textarea
              required
              rows={3}
              value={postalAddress}
              onChange={(e) => setPostalAddress(e.target.value)}
              className={styles.textarea}
              placeholder="Индекс, адрес отделения"
            />
          </label>

          <label className={`${styles.field} ${styles.fieldFull}`}>
            <span>Адрес ПВЗ СДЭК, где удобно получить товар</span>
            <div className={styles.cdekTools}>
              <span className={styles.cdekStatus}>
                {cdekReady ? 'Карта СДЭК готова' : 'Загружаем карту СДЭК...'}
              </span>
              {selectedCdekCode && (
                <span className={styles.cdekSelected}>Выбран: {selectedCdekCode}</span>
              )}
            </div>
            {cdekError && <span className={styles.cdekError}>{cdekError}</span>}
            <div className={styles.cdekWidgetWrap}>
              <div id={CDEK_WIDGET_ROOT} className={styles.cdekWidget} />
              {!CDEK_YANDEX_API_KEY && (
                <div className={styles.cdekWidgetFallback}>
                  <MapPin className={styles.cdekPointIcon} />
                  <span>
                    Карта появится после настройки ключа Яндекс.Карт. Адрес ПВЗ можно указать
                    вручную ниже.
                  </span>
                </div>
              )}
            </div>
            <textarea
              rows={4}
              value={pickupAddress}
              onChange={(e) => {
                setPickupAddress(e.target.value);
                if (!e.target.value.trim()) {
                  setSelectedCdekCode('');
                }
              }}
              className={styles.textarea}
              placeholder="Выберите ПВЗ на карте или укажите адрес вручную"
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Комментарий</h2>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Укажите, пожалуйста, в каком мессенджере мы можем связаться с вами для оперативного общения. Если используете Telegram, напишите по возможности имя пользователя.</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={styles.textarea}
            placeholder="Например: Telegram @nickname, WhatsApp +7..."
          />
        </label>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Мессенджер / контакт для связи</span>
          <input
            type="text"
            value={messengerContact}
            onChange={(e) => setMessengerContact(e.target.value)}
            className={styles.input}
            placeholder="Telegram / WhatsApp / VK"
          />
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Доставка и оплата</h2>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Метод доставки</span>
            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className={styles.input}
            >
              <option value="EMS / СДЭК">EMS / СДЭК</option>
              <option value="Почта России">Почта России</option>
              <option value="Самовывоз">Самовывоз</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Ожидаемая дата доставки</span>
            <input
              type="text"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className={styles.input}
            />
          </label>

          <label className={`${styles.field} ${styles.fieldFull}`}>
            <span>Вариант оплаты</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={styles.input}
            >
              <option value="Универсальный платеж">Универсальный платеж</option>
              <option value="SWIFT / PayPal">SWIFT / PayPal</option>
              <option value="Тезер / рубли по курсу ЦБ +6%">Тезер / рубли по курсу ЦБ +6%</option>
            </select>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Варианты оплаты</h2>
        <div className={styles.infoCard}>
          <p className={styles.infoItem}>• Универсальный платеж</p>
          <p className={styles.infoText}>
            Время на обработку, сбор и подготовку заказа к отправке 5–10 рабочих дней. В
            некоторых случаях этот срок может быть увеличен, например, если производитель или
            поставщик товара сообщит об отсутствии его на складе. В этом случае мы обязательно
            вас уведомим о возможной задержке и предоставим возможность отказаться от размещения
            заявки.
          </p>
          <p className={styles.infoText}>
            К сожалению банковские переводы из России в Европу временно заблокированы, но не
            беспокойтесь. Варианты оплаты есть. Мы принимаем оплаты в Евро на расчётный счёт
            SWIFT-переводом, по ссылке или PayPal (если у вас есть счёт за границей). Также
            принимаем тезерами на кошелёк или рублями по курсу ЦБ +6%.
          </p>
          <p className={styles.infoText}>
            Заверяйте оформление заявки в корзине, подтвердите заказ, после чего мы свяжемся с
            вами и обсудим дальнейшие действия.
          </p>
        </div>
      </section>

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
          Я ознакомлен и согласен с условиями оферты и политики конфиденциальности{' '}
          <Link href="/offer" className={styles.offerLink}>
            (оферта и политика конфиденциальности)
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
