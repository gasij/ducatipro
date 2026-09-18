import {NextResponse} from 'next/server';
import {createFeedbackMessage, isDirectusConfigured} from '@/lib/directus';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  if (!isDirectusConfigured()) {
    return NextResponse.json(
      {error: 'Сервис временно недоступен. Напишите нам в Telegram: @ducatiparts'},
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

  const data = body as {name?: string; email?: string; message?: string};

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
