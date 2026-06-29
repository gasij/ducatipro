import {createDirectus, createItem, readItem, rest, staticToken, updateItem} from '@directus/sdk';
import type {CreateOrderPayload, DirectusOrder, OrderItem} from './orders/types';

type Schema = {
  orders: DirectusOrder[];
};

function getConfig() {
  const url = process.env.DIRECTUS_URL;
  const token = process.env.DIRECTUS_TOKEN;

  if (!url || !token) {
    return null;
  }

  return {url, token};
}

export function isDirectusConfigured() {
  return getConfig() !== null;
}

function getClient() {
  const config = getConfig();
  if (!config) {
    throw new Error('Directus is not configured');
  }

  return createDirectus<Schema>(config.url).with(staticToken(config.token)).with(rest());
}

function formatPrice(amount: number) {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

function buildOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `DP-${date}-${random}`;
}

function calcTotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function createOrderInDirectus(payload: CreateOrderPayload) {
  const client = getClient();
  const total = calcTotal(payload.items);

  const order = await client.request(
    createItem('orders', {
      status: 'pending',
      order_number: buildOrderNumber(),
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: payload.customer_phone,
      delivery_address: payload.delivery_address,
      comment: payload.comment || null,
      total,
      total_formatted: formatPrice(total),
      items: payload.items,
      date_confirmed: null,
      email_sent_at: null,
    }),
  );

  return order;
}

export async function getOrderFromDirectus(id: string) {
  const client = getClient();
  return client.request(readItem('orders', id));
}

export async function markOrderEmailSent(id: string) {
  const client = getClient();
  return client.request(
    updateItem('orders', id, {
      email_sent_at: new Date().toISOString(),
    }),
  );
}
