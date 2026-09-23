import {NextResponse} from 'next/server';
import {validatePromoCode} from '@/lib/directus';

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({valid: false, message: 'Некорректный запрос'});
  }

  const data = body as {code?: unknown; subtotal_eur?: unknown};
  const code = typeof data.code === 'string' ? data.code : '';
  const subtotalEur = typeof data.subtotal_eur === 'number' && Number.isFinite(data.subtotal_eur) ? data.subtotal_eur : 0;

  const result = await validatePromoCode(code, subtotalEur);
  return NextResponse.json(result);
}
