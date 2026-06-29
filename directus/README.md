# Настройка Directus для заказов

## 1. Коллекция `orders`

Создайте коллекцию **orders** со следующими полями:

| Поле | Тип | Настройки |
|------|-----|-----------|
| `id` | UUID | Primary Key |
| `status` | Dropdown | значения: `pending`, `confirmed`, `rejected`, `cancelled`, default: `pending` |
| `order_number` | String | уникальный номер заказа |
| `customer_name` | String | |
| `customer_email` | String | |
| `customer_phone` | String | |
| `delivery_address` | Text | |
| `comment` | Text | nullable |
| `total` | Integer | сумма в рублях |
| `total_formatted` | String | например `220 477 ₽` |
| `items` | JSON | массив позиций заказа |
| `date_confirmed` | DateTime | nullable |
| `email_sent_at` | DateTime | nullable |

### Права доступа

- Роль **Public** или сервисный токен: **create** на `orders` (только через API сайта)
- Роль **Administrator**: полный доступ на чтение/редактирование

Создайте Static Token в Directus с правами на создание и чтение `orders`.

## 2. Переменные окружения сайта

```env
DIRECTUS_URL=https://your-directus.example.com
DIRECTUS_TOKEN=your-static-token
DIRECTUS_WEBHOOK_SECRET=random-secret-string

RESEND_API_KEY=re_...
EMAIL_FROM="Ducati Parts <orders@yourdomain.com>"
```

## 3. Flow: письмо клиенту после подтверждения

В Directus → **Settings → Flows** создайте flow:

1. **Trigger**: Event Hook → `items.update` → Collection: `orders`
2. **Condition**: `{{$trigger.payload.status}}` equals `confirmed`
3. **Operation**: Webhook / Request URL
   - Method: `POST`
   - URL: `https://your-site.com/api/orders/notify`
   - Headers:
     - `Content-Type: application/json`
     - `x-directus-webhook-secret: <DIRECTUS_WEBHOOK_SECRET>`
   - Body (JSON):
     ```json
     {
       "event": "orders.update",
       "key": "{{$trigger.key}}",
       "payload": {
         "id": "{{$trigger.key}}",
         "status": "{{$trigger.payload.status}}"
       }
     }
     ```

## 4. Рабочий процесс

1. Клиент оформляет заказ на `/checkout` → заказ создаётся в Directus со статусом `pending`
2. Администратор проверяет заказ в Directus
3. Администратор меняет статус на `confirmed` и при необходимости заполняет `date_confirmed`
4. Flow вызывает `/api/orders/notify` → клиенту уходит email с составом заказа
5. Поле `email_sent_at` обновляется, повторная отправка не произойдёт

## 5. Отклонение заказа

При статусе `rejected` или `cancelled` письмо не отправляется. При необходимости можно добавить отдельный flow.
