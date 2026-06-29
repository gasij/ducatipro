import {NextResponse} from 'next/server';
import {createOrderInDirectus, isDirectusConfigured} from '@/lib/directus';
import type {CreateOrderPayload, OrderItem} from '@/lib/orders/types';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseItems(items: unknown): OrderItem[] | null {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const parsed: OrderItem[] = [];

  for (const item of items) {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as OrderItem).product_id !== 'string' ||
      typeof (item as OrderItem).title !== 'string' ||
      typeof (item as OrderItem).quantity !== 'number' ||
      typeof (item as OrderItem).price !== 'number' ||
      typeof (item as OrderItem).price_formatted !== 'string'
    ) {
      return null;
    }

    const row = item as OrderItem;
    if (row.quantity < 1) {
      return null;
    }

    parsed.push(row);
  }

  return parsed;
}

export async function POST(request: Request) {
  if (!isDirectusConfigured()) {
    return NextResponse.json(
      {error: 'Сервис заказов временно недоступен. Напишите нам в Telegram: @ducatiparts'},
      {status: 503},
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: 'Некорректный запрос'}, {status: 400});
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({error: 'Некорректный запрос'}, {status: 400});
  }

  const data = body as Partial<CreateOrderPayload>;
  const items = parseItems(data.items);

  if (
    !data.customer_name?.trim() ||
    !data.customer_email?.trim() ||
    !data.customer_phone?.trim() ||
    !data.delivery_address?.trim() ||
    !items
  ) {
    return NextResponse.json({error: 'Заполните все обязательные поля'}, {status: 400});
  }

  if (!isValidEmail(data.customer_email.trim())) {
    return NextResponse.json({error: 'Укажите корректный email'}, {status: 400});
  }

  try {
    const order = await createOrderInDirectus({
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email.trim(),
      customer_phone: data.customer_phone.trim(),
      delivery_address: data.delivery_address.trim(),
      comment: data.comment?.trim() || undefined,
      items,
    });

    return NextResponse.json({
      ok: true,
      order_number: order.order_number,
      id: order.id,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      {error: 'Не удалось оформить заказ. Попробуйте позже или напишите в Telegram.'},
      {status: 500},
    );
  }
}
