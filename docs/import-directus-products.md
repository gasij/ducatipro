# Импорт деталей и совместимости в Directus

Импорт состоит из двух таблиц:

1. `details.csv` или `details.xlsx` - детали/товары.
2. `compatibility.csv` или `compatibility.xlsx` - совместимость: артикул детали и мотоциклы, к которым она подходит.

Скрипт по умолчанию работает в безопасном режиме `dry-run`: покажет, что будет отправлено в Directus, но ничего не запишет.

Поддерживаются форматы `.csv`, `.tsv`, `.json`, `.xlsx`.

## Формат таблицы деталей

Минимальные колонки:

```csv
Артикул;Название;Цена;Категория;Описание;Фото
ABC123;Ducati test part;15200;new;Краткое описание;https://example.com/image.jpg
```

Поддерживаются русские и английские заголовки:

- `Артикул`, `sku`, `article`, `vendor_code`
- `OEM`, `Part No`, `part_number`
- `Название`, `title`, `name`
- `Цена`, `price`
- `Старая цена`, `old_price`
- `Категория`, `category`: `new`, `discounted`, `outlet`, `unsorted`
- `Описание`, `description`
- `Краткое описание`, `desc`, `short_description`
- `Фото`, `image`, `photo`, `image_url`
- `Склад`, `stock_location`: `Москва`, `Россия`, `Милан`, `Италия`
- `Мотоциклы`, `models`

Если в таблице есть только `OEM`, `MODEL`, `FAMILY`, `YEAR`, скрипт создаст название автоматически: `Ducati OEM <артикул>`, а совместимость соберет из модели/семейства/года.

## Формат таблицы совместимости

Вариант 1: одна строка на одну модель:

```csv
Артикул;Мотоцикл
ABC123;Monster 937
ABC123;Panigale V4
```

Вариант 2: несколько моделей в ячейке:

```csv
Артикул;Мотоциклы
ABC123;Monster 937, Panigale V4, Streetfighter V4
```

Вариант 3: широкая таблица:

```csv
Артикул;Модель 1;Модель 2;Модель 3
ABC123;Monster 937;Panigale V4;Streetfighter V4
```

## Проверить без записи

```bash
npm run import:products -- --products ./data/details.csv --compat ./data/compatibility.csv
```

Для Excel:

```bash
npm run import:products -- --products ./exc/D1-1-1.xlsx
```

## Залить в Directus

```bash
npm run import:products -- --products ./data/details.csv --compat ./data/compatibility.csv --commit
```

## Залить только первые 100 товаров

```bash
npm run import:products -- --products ./exc/D1-1-1.xlsx --limit 100 --commit
```

`--limit` применяется после объединения строк по артикулу. Например, если в Excel 7099 строк, но 2214 уникальных OEM, `--limit 100` загрузит первые 100 уникальных товаров.

## Если поле моделей в Directus JSON, а не строка

По умолчанию модели пишутся строкой: `Monster 937, Panigale V4`.

Если поле `models` в Directus имеет тип JSON, запускай так:

```bash
npm run import:products -- --products ./data/details.csv --compat ./data/compatibility.csv --models-format array --commit
```

## Если артикул хранится не в поле `sku`

```bash
npm run import:products -- --products ./data/details.csv --identity-field article --commit
```
