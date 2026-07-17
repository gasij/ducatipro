const productAliases = {
  sku: ['sku', 'article', 'vendor_code', 'part_number', 'part number', 'part no', 'part no.', 'oem', 'артикул', 'код', 'номер'],
  title: ['title', 'name', 'product_name', 'part name', 'description', 'название', 'наименование', 'деталь', 'товар'],
  desc: ['desc', 'short_description', 'short description', 'краткое описание', 'подзаголовок'],
  description: ['description', 'full_description', 'full description', 'описание', 'полное описание'],
  price: ['price', 'amount', 'price rub', 'price eur', 'цена', 'стоимость'],
  old_price: ['old_price', 'old price', 'oldPrice', 'старая цена', 'цена до скидки'],
  category: ['category', 'type', 'раздел', 'категория'],
  image: ['image', 'main_image', 'photo', 'image_url', 'image url', 'фото', 'картинка', 'ссылка на фото'],
  discount_badge: ['discount_badge', 'discount', 'badge', 'скидка', 'бейдж'],
  stock_location: ['stock_location', 'warehouse', 'location', 'склад', 'локация'],
  models: ['models', 'model_names', 'ducati_models', 'motorcycles', 'model', 'family', 'year', 'модели', 'мотоциклы', 'модель', 'семейство', 'год', 'подходит к'],
};

const compatArticleAliases = [
  'sku',
  'oem',
  'article',
  'vendor_code',
  'part_number',
  'part number',
  'артикул',
  'артикул детали',
  'код детали',
  'номер детали',
];

const compatModelAliases = [
  'model',
  'models',
  'motorcycle',
  'motorcycles',
  'bike',
  'модель',
  'мотоцикл',
  'мотоциклы',
  'подходит',
  'подходит к',
];

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s._-]+/g, ' ')
    .replace(/[№#]/g, '')
    .trim();
}

function getCell(row, aliases) {
  const normalizedAliases = aliases.map(normalizeHeader);

  for (const [key, value] of Object.entries(row)) {
    if (normalizedAliases.includes(normalizeHeader(key)) && String(value || '').trim()) {
      return String(value).trim();
    }
  }

  return '';
}

function parseNumber(value) {
  if (!value) {
    return undefined;
  }

  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const number = Number(normalized);

  return Number.isFinite(number) ? number : undefined;
}

function splitList(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(/[,\n;|]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getRowModels(row) {
  const explicitModels = splitList(getCell(row, productAliases.models));
  const model = getCell(row, ['model', 'модель']);
  const family = getCell(row, ['family', 'семейство']);
  const year = getCell(row, ['year', 'год']);
  const composed = [family, model, year].filter(Boolean).join(' ');

  return [...new Set([...explicitModels, composed].filter(Boolean))];
}

function normalizeCategory(value) {
  const category = normalizeHeader(value);

  if (!category) {
    return '';
  }
  if (['new', 'новинка', 'новинки'].includes(category)) {
    return 'new';
  }
  if (['discounted', 'discount', 'sale', 'скидка', 'скидки'].includes(category)) {
    return 'discounted';
  }
  if (['outlet', 'аутлет', 'милан'].includes(category)) {
    return 'outlet';
  }
  if (['unsorted', 'без сортировки'].includes(category)) {
    return 'unsorted';
  }

  return value;
}

function normalizeLocation(value) {
  const location = normalizeHeader(value);

  if (['москва', 'россия', 'russia', 'moscow', 'msk'].includes(location)) {
    return 'moscow';
  }
  if (['милан', 'milan', 'milano', 'italy', 'италия'].includes(location)) {
    return 'milan';
  }

  return value || '';
}

function buildCompatibilityMap(rows) {
  const compatibility = new Map();

  for (const row of rows) {
    const sku = getCell(row, compatArticleAliases);
    if (!sku) {
      continue;
    }

    const modelCell = getCell(row, compatModelAliases);
    const model = getCell(row, ['model', 'модель']);
    const family = getCell(row, ['family', 'семейство']);
    const year = getCell(row, ['year', 'год']);
    const composed = [family, model, year].filter(Boolean).join(' ');
    let models = [...new Set([...splitList(modelCell), composed].filter(Boolean))];

    if (models.length === 0) {
      models = Object.entries(row)
        .filter(([key, value]) => {
          const normalizedKey = normalizeHeader(key);
          const isArticleColumn = compatArticleAliases.map(normalizeHeader).includes(normalizedKey);
          return !isArticleColumn && String(value || '').trim();
        })
        .flatMap(([, value]) => splitList(value));
    }

    if (!compatibility.has(sku)) {
      compatibility.set(sku, new Set());
    }

    for (const item of models) {
      compatibility.get(sku).add(item);
    }
  }

  return compatibility;
}

function buildProductPayload(row, compatibilityMap, options) {
  const sku = getCell(row, productAliases.sku);
  const title = getCell(row, productAliases.title) || `Ducati OEM ${sku}`;
  const price = parseNumber(getCell(row, productAliases.price));
  const oldPrice = parseNumber(getCell(row, productAliases.old_price));
  const category = normalizeCategory(getCell(row, productAliases.category));
  const stockLocation = normalizeLocation(getCell(row, productAliases.stock_location));
  const productModels = getRowModels(row);
  const compatibilityModels = sku ? [...(compatibilityMap.get(sku) || [])] : [];
  const models = [...new Set([...productModels, ...compatibilityModels])];

  if (!sku) {
    throw new Error(`Строка товара без артикула: ${JSON.stringify(row)}`);
  }

  const payload = {
    sku,
    title,
  };

  const desc = getCell(row, productAliases.desc);
  const description = getCell(row, productAliases.description);
  const image = getCell(row, productAliases.image);
  const discountBadge = getCell(row, productAliases.discount_badge);

  if (price !== undefined) payload.price = price;
  if (oldPrice !== undefined) payload.old_price = oldPrice;
  if (desc) payload.desc = desc;
  if (description) payload.description = description;
  if (category) payload.category = category;
  if (image) payload.image = image;
  if (discountBadge) payload.discount_badge = discountBadge;
  if (stockLocation) payload.stock_location = stockLocation;
  if (models.length > 0) {
    payload[options.modelsField] = options.modelsFormat === 'array' ? models : models.join(', ');
  }

  return payload;
}

function mergeProductPayloads(payloads, options) {
  const merged = new Map();

  for (const payload of payloads) {
    const identity = payload[options.identityField];

    if (!identity || !merged.has(identity)) {
      merged.set(identity || payload.sku, payload);
      continue;
    }

    const current = merged.get(identity);
    const currentModels = splitList(current[options.modelsField]);
    const nextModels = Array.isArray(payload[options.modelsField])
      ? payload[options.modelsField]
      : splitList(payload[options.modelsField]);
    const models = [...new Set([...currentModels, ...nextModels])];

    merged.set(identity, {
      ...current,
      ...Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== '')),
      [options.modelsField]: options.modelsFormat === 'array' ? models : models.join(', '),
    });
  }

  return [...merged.values()];
}

function parseProducts(productRows, compatibilityRows, inputOptions = {}) {
  const options = {
    identityField: inputOptions.identityField || 'sku',
    modelsField: inputOptions.modelsField || 'models',
    modelsFormat: inputOptions.modelsFormat === 'array' ? 'array' : 'string',
    limit: Math.max(0, Number(inputOptions.limit) || 0),
  };
  const compatibilityMap = buildCompatibilityMap(compatibilityRows);
  const allPayloads = mergeProductPayloads(
    productRows.map((row) => buildProductPayload(row, compatibilityMap, options)),
    options,
  );
  const payloads = options.limit > 0 ? allPayloads.slice(0, options.limit) : allPayloads;
  const payloadsWithModels = payloads.filter((payload) => {
    const models = payload[options.modelsField];
    return Array.isArray(models) ? models.length > 0 : typeof models === 'string' && models.trim();
  });

  return {
    options,
    productRows: productRows.length,
    compatibilityRows: compatibilityRows.length,
    totalPayloads: allPayloads.length,
    payloads,
    payloadsWithModels: payloadsWithModels.length,
  };
}

module.exports = {
  parseProducts,
};
