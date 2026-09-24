import {NextResponse} from 'next/server';
import {createFeedbackMessage, isDirectusConfigured} from '@/lib/directus';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Minimum time (ms) between the form rendering and being submitted — real
// visitors need at least this long to type into three fields, bots that
// fill and submit forms programmatically usually do it near-instantly.
const MIN_SUBMIT_DELAY_MS = 2500;

// Simple in-memory per-IP rate limit. Resets on server restart, which is
// fine here — it only needs to blunt automated bursts, not survive deploys.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const submissionsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionsByIp.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    submissionsByIp.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  submissionsByIp.set(ip, timestamps);
  return false;
}

export async function POST(request: Request) {
  if (!isDirectusConfigured()) {
    return NextResponse.json(
      {error: 'Сервис временно недоступен. Напишите нам в Telegram: @ducatiparts'},
      {status: 503},
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {error: 'Слишком много сообщений. Попробуйте позже или напишите в Telegram.'},
      {status: 429},
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

  const data = body as {
    name?: string;
    email?: string;
    message?: string;
    website?: string;
    rendered_at?: number;
  };

  // Honeypot filled in, or submitted faster than a human could type —
  // pretend success so the bot doesn't adjust its behavior, but drop it.
  const submittedTooFast =
    typeof data.rendered_at === 'number' && Date.now() - data.rendered_at < MIN_SUBMIT_DELAY_MS;

  if (data.website?.trim() || submittedTooFast) {
    return NextResponse.json({ok: true});
  }

  if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
    return NextResponse.json({error: 'Заполните все поля'}, {status: 400});
  }

  if (!isValidEmail(data.email.trim())) {
    return NextResponse.json({error: 'Укажите корректный email'}, {status: 400});
  }

  try {
    await createFeedbackMessage({
      name: data.name.trim(),
      email: data.email.trim(),
      message: data.message.trim(),
    });

    return NextResponse.json({ok: true});
  } catch (error) {
    console.error('Create feedback message error:', error);
    return NextResponse.json(
      {error: 'Не удалось отправить сообщение. Попробуйте позже или напишите в Telegram.'},
      {status: 500},
    );
  }
}
