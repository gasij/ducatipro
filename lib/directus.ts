import {createDirectus, createItem, readItem, rest, staticToken, updateItem} from '@directus/sdk';
import type {CreateOrderPayload, DirectusOrder, OrderItem} from './orders/types';
import {getProduct, getProductArticle} from '@/src/fsd/entities/product';

type Schema = {
  orders: DirectusOrder[];
  order_items: OrderItem[];
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

function calcTotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function toKopecks(price: number) {
  return Math.round(price * 100);
}

async function buildOrderItems(items: CreateOrderPayload['items']): Promise<OrderItem[]> {
  const snapshots = await Promise.all(
    items.map(async (item) => {
      const product = await getProduct(item.product_id);

      if (!product) {
        throw new Error(`Product ${item.product_id} was not found`);
      }

      return {
        product_id: product.id,
        product_title: product.title,
        product_sku: getProductArticle(product),
        price: toKopecks(product.price),
        quantity: item.quantity,
      };
    }),
  );

  return snapshots;
}

export async function createOrderInDirectus(payload: CreateOrderPayload) {
  const client = getClient();
  const items = await buildOrderItems(payload.items);
  const total = calcTotal(items);

  const order = await client.request(
    createItem('orders', {
      status: 'pending',
      customer_name: payload.customer_name,
      phone: payload.phone,
      email: payload.email,
      city: payload.city,
      postal_address: payload.postal_address,
      cdek_address: payload.cdek_address || null,
      comment: payload.comment || null,
      payment_method: payload.payment_method,
      delivery_method: payload.delivery_method,
      agreed_to_terms: payload.agreed_to_terms,
      total,
      items,
    }),
  );

  return order;
}

export async function getOrderFromDirectus(id: string) {
  const client = getClient();
  return client.request(
    readItem('orders', id, {
      fields: ['*', {items: ['*']}],
    }),
  );
}

export async function markOrderEmailSent(id: string) {
  const client = getClient();
  return client.request(
    updateItem('orders', id, {
      email_sent_at: new Date().toISOString(),
    }),
  );
}
