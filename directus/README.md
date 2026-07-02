# Настройка Directus

## 1. Коллекция `products`

Сайт читает товары из коллекции `products`. Если коллекция называется иначе, задайте
`DIRECTUS_PRODUCTS_COLLECTION`.

Минимальные поля:

| Поле | Тип | Примечание |
|------|-----|------------|
| `id` | UUID/String/Integer | используется в URL `/product/<id>` |
| `title` | String | название товара |
| `price` | Integer/Decimal/String | цена в рублях |
| `image` | File или URL | главное изображение |
| `category` | Dropdown | `new`, `discounted`, `outlet`, `unsorted` |

Дополнительные поддерживаемые поля:

| Поле | Тип |
|------|-----|
| `desc` или `short_description` | Text |
| `description` или `full_description` | Text |
| `price_formatted` | String |
| `old_price` или `old_price_formatted` | String |
| `sku` | String |
| `badge_text` | String |
| `badge_color` | String: `green` или `gray` |
| `discount_badge` | String |
| `is_available_in_moscow` | Boolean |
| `is_last_in_milan` | Boolean |
| `models` | JSON/CSV/M2M |
| `specs` | JSON-массив `{ "label": "...", "value": "..." }` |

Для приватной коллекции создайте Static Token с правом `read` на `products` и добавьте его в
`DIRECTUS_TOKEN`. Если Directus недоступен или коллекция пуста, сайт покажет локальные демо-товары.

## 2. Коллекция `orders`

Создайте коллекцию **orders** со следующими полями:

| Поле | Тип | Настройки |
|------|-----|-----------|
| `id` | UUID | Primary Key |
| `status` | Dropdown | `pending`, `confirmed`, `paid`, `shipped`, `delivered`, `cancelled`, default: `pending` |
| `customer_name` | String | |
| `phone` | String | |
| `email` | String | |
| `city` | String | |
| `postal_address` | Text | |
| `cdek_address` | Text | nullable |
| `comment` | Text | nullable |
| `total` | Integer | сумма заказа в копейках |
| `payment_method` | String | |
| `delivery_method` | String | |
| `agreed_to_terms` | Boolean | согласие с офертой |
| `items` | O2M | связь на `order_items.order_id` |

## 3. Коллекция `order_items`

| Поле | Тип | Настройки |
|------|-----|-----------|
| `id` | UUID | Primary Key |
| `order_id` | M2O | связь на `orders` |
| `product_id` | M2O | связь на `products` |
| `product_title` | String | снапшот названия товара |
| `product_sku` | String | снапшот артикула |
| `price` | Integer | снапшот цены в копейках |
| `quantity` | Integer | количество |

`product_title`, `product_sku` и `price` заполняются кодом сайта при создании заказа. Это
защищает заказ от изменений цены/названия товара после оформления.

### Права доступа

- Сервисный токен: `create/read/update` на `orders`, `create/read` на `order_items`, `read` на `products`
- Роль **Administrator**: полный доступ на чтение/редактирование

Создайте Static Token в Directus и добавьте его в `DIRECTUS_TOKEN`.

## 4. Переменные окружения сайта

```env
DIRECTUS_URL=https://your-directus.example.com
DIRECTUS_TOKEN=your-static-token
DIRECTUS_PRODUCTS_COLLECTION=products
DIRECTUS_WEBHOOK_SECRET=random-secret-string

RESEND_API_KEY=re_...
EMAIL_FROM="Ducati Parts <orders@yourdomain.com>"
```

## 5. Flow: письмо клиенту после подтверждения

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

## 6. Рабочий процесс

1. Клиент оформляет заказ на `/checkout` → заказ создаётся в Directus со статусом `pending`
2. Администратор проверяет заказ в Directus
3. Администратор меняет статус на `confirmed`
4. Flow вызывает `/api/orders/notify` → клиенту уходит email с составом заказа
5. Если в `orders` есть поле `email_sent_at`, сайт может использовать его для защиты от повторной отправки

## 7. Отклонение заказа

При статусе `cancelled` письмо не отправляется. При необходимости можно добавить отдельный flow.
