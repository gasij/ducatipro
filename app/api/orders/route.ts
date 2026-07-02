import {NextResponse} from 'next/server';
import {createOrderInDirectus, isDirectusConfigured} from '@/lib/directus';
import type {CreateOrderInputItem, CreateOrderPayload} from '@/lib/orders/types';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseItems(items: unknown): CreateOrderInputItem[] | null {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const parsed: CreateOrderInputItem[] = [];

  for (const item of items) {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as CreateOrderInputItem).product_id !== 'string' ||
      typeof (item as CreateOrderInputItem).quantity !== 'number'
    ) {
      return null;
    }

    const row = item as CreateOrderInputItem;
    if (!row.product_id.trim() || row.quantity < 1) {
      return null;
    }

    parsed.push({
      product_id: row.product_id.trim(),
      quantity: Math.floor(row.quantity),
    });
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
    !data.email?.trim() ||
    !data.phone?.trim() ||
    !data.city?.trim() ||
    !data.postal_address?.trim() ||
    !data.payment_method?.trim() ||
    !data.delivery_method?.trim() ||
    data.agreed_to_terms !== true ||
    !items
  ) {
    return NextResponse.json({error: 'Заполните все обязательные поля'}, {status: 400});
  }

  if (!isValidEmail(data.email.trim())) {
    return NextResponse.json({error: 'Укажите корректный email'}, {status: 400});
  }

  try {
    const order = await createOrderInDirectus({
      customer_name: data.customer_name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      city: data.city.trim(),
      postal_address: data.postal_address.trim(),
      cdek_address: data.cdek_address?.trim() || undefined,
      comment: data.comment?.trim() || undefined,
      payment_method: data.payment_method.trim(),
      delivery_method: data.delivery_method.trim(),
      agreed_to_terms: true,
      items,
    });

    return NextResponse.json({
      ok: true,
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
