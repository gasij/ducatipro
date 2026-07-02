import {Resend} from 'resend';
import type {DirectusOrder} from '../orders/types';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return null;
  }

  return {client: new Resend(apiKey), from};
}

export function isEmailConfigured() {
  return getResend() !== null;
}

function buildItemsHtml(order: DirectusOrder) {
  const items = order.items || [];
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;">
          ${item.product_title}
          <div style="font-size:12px;color:#777;margin-top:4px;">${item.product_sku}</div>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;white-space:nowrap;">${formatKopecks(item.price)}</td>
      </tr>
    `,
    )
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr>
          <th align="left" style="padding:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;">Товар</th>
          <th align="center" style="padding:0 8px 8px;font-size:12px;color:#666;text-transform:uppercase;">Кол-во</th>
          <th align="right" style="padding:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;">Цена</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatKopecks(amount: number) {
  return `${(amount / 100).toLocaleString('ru-RU')} ₽`;
}

export async function sendOrderConfirmationEmail(order: DirectusOrder) {
  const resend = getResend();
  if (!resend) {
    throw new Error('Email is not configured');
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;margin:0 0 16px;">Ваш заказ подтверждён</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
        Здравствуйте, ${order.customer_name}! Мы подтвердили ваш заказ.
        Ниже — состав заказа и данные доставки.
      </p>

      ${buildItemsHtml(order)}

      <p style="font-size:20px;font-weight:700;margin:24px 0 24px;text-align:right;">
        Итого: ${formatKopecks(order.total)}
      </p>

      <div style="background:#f9f9f9;border:1px solid #eee;border-radius:4px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Телефон:</strong> ${order.phone}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Город:</strong> ${order.city}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Почтовый адрес:</strong> ${order.postal_address}</p>
        ${
          order.cdek_address
            ? `<p style="margin:0 0 8px;font-size:14px;"><strong>СДЭК:</strong> ${order.cdek_address}</p>`
            : ''
        }
        ${
          order.comment
            ? `<p style="margin:0;font-size:14px;"><strong>Комментарий:</strong> ${order.comment}</p>`
            : ''
        }
      </div>

      <p style="font-size:14px;line-height:1.6;color:#555;margin:0;">
        По вопросам пишите в Telegram:
        <a href="https://t.me/ducatiparts" style="color:#e30613;">@ducatiparts</a>
      </p>
    </div>
  `;

  const {error} = await resend.client.emails.send({
    from: resend.from,
    to: order.email,
    subject: `Заказ подтверждён — Ducati Parts`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}
