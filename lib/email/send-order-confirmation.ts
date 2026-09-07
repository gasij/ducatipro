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

function formatRubles(amount: number | string | undefined) {
  return `${Number(amount || 0).toLocaleString('ru-RU')} ₽`;
}

function formatEur(amount: number | string | undefined) {
  return `€${Number(amount || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`;
}

function getTitleWithArticle(item: {product_title: string; product_sku: string}): string {
  const sku = item.product_sku;
  return sku && !item.product_title.toUpperCase().includes(sku.toUpperCase())
    ? `${sku} ${item.product_title}`
    : item.product_title;
}

function buildItemsHtml(order: DirectusOrder) {
  const items = order.items || [];
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;">
          ${getTitleWithArticle(item)}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;white-space:nowrap;">
          ${formatEur(item.price_eur)}
          <div style="font-size:12px;color:#777;margin-top:2px;">${formatRubles(item.price)}</div>
        </td>
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

function buildTotalsHtml(order: DirectusOrder) {
  const subtotalEur = (order.items || []).reduce(
    (sum, item) => sum + Number(item.price_eur || 0) * item.quantity,
    0,
  );
  const subtotalRub = (order.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0,
  );

  const rows = [
    {label: 'Сумма товаров', eur: subtotalEur, rub: subtotalRub},
    {label: 'Сбор за обработку', eur: order.processing_fee_eur, rub: undefined},
    {label: 'Доставка EMS', eur: order.delivery_price_eur, rub: undefined},
  ];

  const rowsHtml = rows
    .map(
      (row) => `
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#555;">${row.label}</td>
        <td style="padding:4px 0;font-size:14px;text-align:right;white-space:nowrap;">
          ${formatEur(row.eur)}
        </td>
      </tr>
    `,
    )
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid #eee;font-size:18px;font-weight:700;">Итого</td>
          <td style="padding:12px 0 0;border-top:1px solid #eee;font-size:18px;font-weight:700;text-align:right;white-space:nowrap;">
            ${formatEur(order.total_eur)}
            <div style="font-size:13px;color:#777;font-weight:400;margin-top:2px;">${formatRubles(order.total)}</div>
          </td>
        </tr>
      </tfoot>
    </table>
  `;
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
      ${buildTotalsHtml(order)}

      <div style="background:#f9f9f9;border:1px solid #eee;border-radius:4px;padding:16px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Телефон:</strong> ${order.phone}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Город:</strong> ${order.city}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Почтовый адрес:</strong> ${order.postal_address}</p>
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
