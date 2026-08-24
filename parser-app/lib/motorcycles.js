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

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function buildMotorcyclePayload(row) {
  const family = getCell(row, ['family', 'семейство']);
  const model = getCell(row, ['model', 'модель']);
  const year = getCell(row, ['year', 'год']);
  const name = model || family;
  const key = [family, model, year].filter(Boolean).join(' ');
  const sku = slugify(key);

  if (!sku || !name) {
    return null;
  }

  return {
    sku,
    name,
    slug: sku,
    brand: 'Ducati',
    year,
  };
}

function prepareMotorcycleImport(compatibilityRows, existingProductSkus, options = {}) {
  const limit = Math.max(0, Number(options.limit) || 0);
  const motorcyclePayloads = new Map();
  const relationRows = [];
  let matchedProductRows = 0;

  for (const row of compatibilityRows) {
    const productSku = getCell(row, compatArticleAliases);
    if (!productSku || !existingProductSkus.has(productSku)) {
      continue;
    }
    matchedProductRows += 1;

    const motorcycle = buildMotorcyclePayload(row);
    if (!motorcycle) {
      continue;
    }

    motorcyclePayloads.set(motorcycle.sku, motorcycle);
    relationRows.push({productSku, motorcycleSku: motorcycle.sku});
  }

  const limitedRelations = limit > 0 ? relationRows.slice(0, limit) : relationRows;
  const usedMotorcycleSkus = new Set(limitedRelations.map((relation) => relation.motorcycleSku));
  const limitedMotorcycles = [...motorcyclePayloads.values()].filter((payload) =>
    usedMotorcycleSkus.has(payload.sku),
  );

  return {
    motorcycles: limitedMotorcycles,
    relations: limitedRelations,
    totalMotorcycles: motorcyclePayloads.size,
    totalRelations: relationRows.length,
    matchedProductRows,
  };
}

module.exports = {
  buildMotorcyclePayload,
  prepareMotorcycleImport,
};
