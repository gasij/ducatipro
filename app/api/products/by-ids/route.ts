import {NextResponse} from 'next/server';
import {getProduct} from '@/src/fsd/entities/product';

const MAX_IDS = 50;

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {ids?: unknown} | null;
  const ids = Array.isArray(payload?.ids) ? payload.ids.filter((id): id is string => typeof id === 'string') : [];

  if (ids.length === 0) {
    return NextResponse.json({items: []});
  }

  const products = await Promise.all(ids.slice(0, MAX_IDS).map((id) => getProduct(id).catch(() => undefined)));
  const items = products.filter((product) => Boolean(product));

  return NextResponse.json({items});
}
