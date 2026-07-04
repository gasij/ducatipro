import {createDirectus, createItem, readItem, rest, staticToken, updateItem} from '@directus/sdk';
import type {CreateOrderPayload, DirectusOrder, OrderItem} from './orders/types';
import {getProduct, getProductArticle} from '@/src/fsd/entities/product';

type Schema = {
  order: DirectusOrder[];
  orders: DirectusOrder[];
  order_items: OrderItem[];
};

type OrdersCollection = 'order' | 'orders';

const DEFAULT_ORDERS_COLLECTION: OrdersCollection = 'orders';

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

function getOrdersCollection(): OrdersCollection {
  return (process.env.DIRECTUS_ORDERS_COLLECTION || DEFAULT_ORDERS_COLLECTION) as OrdersCollection;
}

function getClient() {
  const config = getConfig();
  if (!config) {
    throw new Error('Directus is not configured');
  }

  return createDirectus<Schema>(config.url).with(staticToken(config.token)).with(rest());
}

function calcTotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
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
        price: product.price,
        quantity: item.quantity,
      };
    }),
  );

  return snapshots;
}

export async function createOrderInDirectus(payload: CreateOrderPayload) {
  const client = getClient();
  const ordersCollection = getOrdersCollection();
  const items = await buildOrderItems(payload.items);
  const total = calcTotal(items);

  const order = await client.request(
    createItem(ordersCollection, {
      status: 'pending',
      customer_name: payload.customer_name,
      phone: payload.phone,
      email: payload.email,
      city: payload.city,
      postal_address: payload.postal_address,
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
  const ordersCollection = getOrdersCollection();
  return client.request(
    readItem(ordersCollection, id, {
      fields: ['*', {items: ['*']}],
    }),
  );
}

export async function markOrderEmailSent(id: string) {
  const client = getClient();
  const ordersCollection = getOrdersCollection();
  return client.request(
    updateItem(ordersCollection, id, {
      email_sent_at: new Date().toISOString(),
    }),
  );
}
