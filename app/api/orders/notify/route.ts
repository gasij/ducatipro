import {NextResponse} from 'next/server';
import {getOrderFromDirectus, isDirectusConfigured, markOrderEmailSent} from '@/lib/directus';
import {isEmailConfigured, sendOrderConfirmationEmail} from '@/lib/email/send-order-confirmation';

type WebhookBody = {
  event?: string;
  key?: string;
  payload?: {
    id?: string;
    status?: string;
    email_sent_at?: string | null;
  };
};

function isAuthorized(request: Request) {
  const secret = process.env.DIRECTUS_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const header = request.headers.get('x-directus-webhook-secret');
  return header === secret;
}

export async function POST(request: Request) {
  if (!isDirectusConfigured() || !isEmailConfigured()) {
    return NextResponse.json({error: 'Service not configured'}, {status: 503});
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }

  let body: WebhookBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: 'Invalid body'}, {status: 400});
  }

  const orderId = body.payload?.id || body.key;
  if (!orderId) {
    return NextResponse.json({error: 'Order id is required'}, {status: 400});
  }

  try {
    const order = await getOrderFromDirectus(orderId);

    if (order.status !== 'confirmed') {
      return NextResponse.json({skipped: true, reason: 'Order is not confirmed'});
    }

    if (order.email_sent_at) {
      return NextResponse.json({skipped: true, reason: 'Email already sent'});
    }

    await sendOrderConfirmationEmail(order);
    await markOrderEmailSent(order.id);

    return NextResponse.json({ok: true, order_number: order.order_number});
  } catch (error) {
    console.error('Order notify error:', error);
    return NextResponse.json({error: 'Failed to send confirmation email'}, {status: 500});
  }
}
