#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const DEFAULT_PRODUCTS_COLLECTION = 'products';

const productAliases = {
  sku: ['sku', 'article', 'vendor_code', 'part_number', 'part number', 'part no', 'part no.', 'oem', 'артикул', 'код', 'номер'],
  title: ['title', 'name', 'product_name', 'part name', 'description', 'название', 'наименование', 'деталь', 'товар'],
  desc: ['desc', 'short_description', 'short description', 'краткое описание', 'подзаголовок'],
  description: ['description', 'full_description', 'full description', 'описание', 'полное описание'],
  price: ['price', 'amount', 'price rub', 'price eur', 'цена', 'стоимость'],
  old_price: ['old_price', 'old price', 'oldPrice', 'старая цена', 'цена до скидки'],
  weight: ['weight', 'wht', 'gross_weight', 'gross weight', 'net_weight', 'net weight', 'вес', 'масса'],
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

function parseArgs(argv) {
  const args = {
    products: '',
    compatibility: '',
    collection: process.env.DIRECTUS_PRODUCTS_COLLECTION || DEFAULT_PRODUCTS_COLLECTION,
    identityField: 'sku',
    modelsField: 'models',
    modelsFormat: 'string',
    limit: 0,
    existingOnly: false,
    createOnly: false,
    quiet: false,
    commit: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--products') {
      args.products = next || '';
      index += 1;
    } else if (arg === '--compat' || arg === '--compatibility') {
      args.compatibility = next || '';
      index += 1;
    } else if (arg === '--collection') {
      args.collection = next || args.collection;
      index += 1;
    } else if (arg === '--identity-field') {
      args.identityField = next || args.identityField;
      index += 1;
    } else if (arg === '--models-field') {
      args.modelsField = next || args.modelsField;
      index += 1;
    } else if (arg === '--models-format') {
      args.modelsFormat = next === 'array' ? 'array' : 'string';
      index += 1;
    } else if (arg === '--limit') {
      args.limit = Math.max(0, Number(next) || 0);
      index += 1;
    } else if (arg === '--existing-only') {
      args.existingOnly = true;
    } else if (arg === '--create-only') {
      args.createOnly = true;
    } else if (arg === '--quiet') {
      args.quiet = true;
    } else if (arg === '--commit') {
      args.commit = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run import:products -- --products ./data/details.csv --compat ./data/compatibility.csv
  npm run import:products -- --products ./data/details.csv --compat ./data/compatibility.csv --commit

Options:
  --products <file>        CSV/TSV/JSON table with part details.
  --compat <file>          Optional CSV/TSV/JSON table with article -> motorcycle compatibility.
  --collection <name>      Directus collection. Default: DIRECTUS_PRODUCTS_COLLECTION or products.
  --identity-field <name>  Field used to find existing items. Default: sku.
  --models-field <name>    Field where motorcycle models are written. Default: models.
  --models-format <type>   string or array. Default: string.
  --limit <number>         Import only first N prepared products. Useful for test batches.
  --existing-only          Update only products that already exist in Directus. Never create new ones.
  --create-only            Create products without checking for existing records. Use only for an empty collection.
  --quiet                  Print only summary logs during commit.
  --commit                Actually write to Directus. Without this flag the script is dry-run.
`);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

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

function parseDelimited(content, delimiter) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows.filter((entry) => entry.some((value) => String(value).trim()));
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function getXmlAttr(tag, attr) {
  const match = tag.match(new RegExp(`${attr}="([^"]*)"`));
  return match ? decodeXml(match[1]) : '';
}

function stripXmlTags(value) {
  return decodeXml(String(value || '').replace(/<[^>]+>/g, ''));
}

function unzipText(filePath, entryPath) {
  try {
    return execFileSync('unzip', ['-p', filePath, entryPath], {
      encoding: 'utf8',
      maxBuffer: 200 * 1024 * 1024,
    });
  } catch {
    return '';
  }
}

function columnIndexFromCellRef(cellRef) {
  const letters = String(cellRef || '').match(/^[A-Z]+/i)?.[0] || 'A';
  let index = 0;

  for (const letter of letters.toUpperCase()) {
    index = index * 26 + (letter.charCodeAt(0) - 64);
  }

  return index - 1;
}

function readSharedStrings(filePath) {
  const xml = unzipText(filePath, 'xl/sharedStrings.xml');
  if (!xml) {
    return [];
  }

  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => {
    const textParts = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((textMatch) =>
      decodeXml(textMatch[1]),
    );
    return textParts.length > 0 ? textParts.join('') : stripXmlTags(match[1]);
  });
}

function readFirstWorksheetPath(filePath) {
  const workbookXml = unzipText(filePath, 'xl/workbook.xml');
  const relsXml = unzipText(filePath, 'xl/_rels/workbook.xml.rels');
  const firstSheetTag = workbookXml.match(/<sheet\b[^>]*>/)?.[0];
  const relationId = firstSheetTag ? getXmlAttr(firstSheetTag, 'r:id') : '';

  if (relationId && relsXml) {
    const relMatch = [...relsXml.matchAll(/<Relationship\b[^>]*>/g)]
      .map((match) => match[0])
      .find((tag) => getXmlAttr(tag, 'Id') === relationId);
    const target = relMatch ? getXmlAttr(relMatch, 'Target') : '';

    if (target) {
      return target.startsWith('xl/') ? target : `xl/${target.replace(/^\//, '')}`;
    }
  }

  return 'xl/worksheets/sheet1.xml';
}

function readXlsxTable(filePath) {
  const sharedStrings = readSharedStrings(filePath);
  const sheetPath = readFirstWorksheetPath(filePath);
  const sheetXml = unzipText(filePath, sheetPath);

  if (!sheetXml) {
    throw new Error(`${filePath}: unable to read first worksheet`);
  }

  const rows = [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)]
    .map((rowMatch) => {
      const cells = [];

      for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = cellMatch[1];
        const body = cellMatch[2];
        const ref = getXmlAttr(attrs, 'r');
        const type = getXmlAttr(attrs, 't');
        const colIndex = columnIndexFromCellRef(ref);
        const valueMatch = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
        const inlineMatch = body.match(/<is\b[^>]*>([\s\S]*?)<\/is>/);
        const rawValue = valueMatch ? decodeXml(valueMatch[1]) : '';

        let value = rawValue;
        if (type === 's') {
          value = sharedStrings[Number(rawValue)] || '';
        } else if (type === 'inlineStr' && inlineMatch) {
          value = stripXmlTags(inlineMatch[1]);
        } else if (type === 'b') {
          value = rawValue === '1' ? 'true' : 'false';
        }

        cells[colIndex] = String(value || '').trim();
      }

      return cells;
    })
    .filter((row) => row.some((value) => String(value || '').trim()));

  const headers = rows.shift()?.map((header) => String(header || '').trim()) || [];

  return rows.map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = String(row[index] || '').trim();
    });
    return record;
  });
}

function detectDelimiter(content, filePath) {
  if (filePath.endsWith('.tsv')) {
    return '\t';
  }

  const firstLine = content.split(/\r?\n/, 1)[0] || '';
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (tabs > semicolons && tabs > commas) {
    return '\t';
  }
  return semicolons > commas ? ';' : ',';
}

function readTable(filePath) {
  if (!filePath) {
    return [];
  }

  const absolutePath = path.resolve(filePath);

  if (absolutePath.endsWith('.xlsx')) {
    return readXlsxTable(absolutePath);
  }

  const raw = fs.readFileSync(absolutePath, 'utf8').replace(/^\uFEFF/, '');

  if (absolutePath.endsWith('.json')) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`${filePath}: JSON must be an array of objects`);
    }
    return parsed;
  }

  const delimiter = detectDelimiter(raw, absolutePath);
  const rows = parseDelimited(raw, delimiter);
  const headers = rows.shift()?.map((header) => String(header || '').trim()) || [];

  return rows.map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = String(row[index] || '').trim();
    });
    return record;
  });
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

    for (const model of models) {
      compatibility.get(sku).add(model);
    }
  }

  return compatibility;
}

function buildProductPayload(row, compatibilityMap, args) {
  const sku = getCell(row, productAliases.sku);
  const title = getCell(row, productAliases.title) || `Ducati OEM ${sku}`;
  const price = parseNumber(getCell(row, productAliases.price));
  const oldPrice = parseNumber(getCell(row, productAliases.old_price));
  const weight = parseNumber(getCell(row, productAliases.weight));
  const category = normalizeCategory(getCell(row, productAliases.category));
  const stockLocation = normalizeLocation(getCell(row, productAliases.stock_location));
  const productModels = getRowModels(row);
  const compatibilityModels = sku ? [...(compatibilityMap.get(sku) || [])] : [];
  const models = [...new Set([...productModels, ...compatibilityModels])];

  if (!sku) {
    throw new Error(`Product row is missing article/sku: ${JSON.stringify(row)}`);
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
  if (weight !== undefined) payload.weight = weight;
  if (desc) payload.desc = desc;
  if (description) payload.description = description;
  if (category) payload.category = category;
  if (image) payload.image = image;
  if (discountBadge) payload.discount_badge = discountBadge;
  if (stockLocation) payload.stock_location = stockLocation;
  if (models.length > 0) {
    payload[args.modelsField] = args.modelsFormat === 'array' ? models : models.join(', ');
  }

  return payload;
}

function mergeProductPayloads(payloads, args) {
  const merged = new Map();

  for (const payload of payloads) {
    const identity = payload[args.identityField];

    if (!identity || !merged.has(identity)) {
      merged.set(identity || payload.sku, payload);
      continue;
    }

    const current = merged.get(identity);
    const currentModels = splitList(current[args.modelsField]);
    const nextModels = Array.isArray(payload[args.modelsField])
      ? payload[args.modelsField]
      : splitList(payload[args.modelsField]);
    const models = [...new Set([...currentModels, ...nextModels])];

    merged.set(identity, {
      ...current,
      ...Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== '')),
      [args.modelsField]: args.modelsFormat === 'array' ? models : models.join(', '),
    });
  }

  return [...merged.values()];
}

function requireDirectusConfig() {
  const url = process.env.DIRECTUS_URL;
  const token = process.env.DIRECTUS_TOKEN;

  if (!url || !token) {
    throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN are required in .env.local');
  }

  return {url: url.replace(/\/$/, ''), token};
}

async function directusRequest(config, pathName, init = {}) {
  const response = await fetch(`${config.url}${pathName}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${pathName} failed: ${response.status} ${text}`);
  }

  return body;
}

async function findExistingProduct(config, collection, identityField, identityValue) {
  const params = new URLSearchParams();
  params.set(`filter[${identityField}][_eq]`, identityValue);
  params.set('limit', '1');
  params.set('fields', `id,${identityField}`);

  const payload = await directusRequest(config, `/items/${collection}?${params.toString()}`);
  return Array.isArray(payload?.data) ? payload.data[0] : null;
}

async function fetchExistingProducts(config, collection, identityField) {
  const existing = new Map();
  const pageSize = 500;
  let page = 1;

  while (true) {
    const params = new URLSearchParams();
    params.set('fields', `id,${identityField}`);
    params.set('limit', String(pageSize));
    params.set('page', String(page));

    const payload = await directusRequest(config, `/items/${collection}?${params.toString()}`);
    const items = Array.isArray(payload?.data) ? payload.data : [];

    for (const item of items) {
      const identityValue = item?.[identityField];
      if (identityValue) {
        existing.set(String(identityValue), item);
      }
    }

    if (items.length < pageSize) {
      break;
    }

    page += 1;
  }

  return existing;
}

async function upsertProduct(config, args, payload, existingProducts = null) {
  const identityValue = payload[args.identityField];

  if (!identityValue) {
    throw new Error(`Payload has no identity field ${args.identityField}: ${JSON.stringify(payload)}`);
  }

  if (args.createOnly) {
    const created = await directusRequest(config, `/items/${args.collection}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {action: 'created', id: created?.data?.id};
  }

  const existing =
    existingProducts?.get(String(identityValue)) ||
    (existingProducts ? null : await findExistingProduct(config, args.collection, args.identityField, identityValue));

  if (existing?.id) {
    const updated = await directusRequest(config, `/items/${args.collection}/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return {action: 'updated', id: updated?.data?.id || existing.id};
  }

  if (args.existingOnly) {
    return {action: 'skipped', id: null};
  }

  const created = await directusRequest(config, `/items/${args.collection}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {action: 'created', id: created?.data?.id};
}

async function main() {
  loadEnvFile(path.resolve('.env.local'));
  loadEnvFile(path.resolve('.env'));

  const args = parseArgs(process.argv.slice(2));

  if (!args.products) {
    printHelp();
    throw new Error('--products is required');
  }

  const productRows = readTable(args.products);
  const compatibilityRows = readTable(args.compatibility);
  const compatibilityMap = buildCompatibilityMap(compatibilityRows);
  const allPayloads = mergeProductPayloads(
    productRows.map((row) => buildProductPayload(row, compatibilityMap, args)),
    args,
  );
  const payloads = args.limit > 0 ? allPayloads.slice(0, args.limit) : allPayloads;
  const hasModels = (payload) => {
    const models = payload[args.modelsField];
    return Array.isArray(models) ? models.length > 0 : typeof models === 'string' && models.trim();
  };
  const payloadsWithModels = payloads.filter(hasModels);

  if (args.existingOnly && args.createOnly) {
    throw new Error('--existing-only and --create-only cannot be used together');
  }

  console.log(`Products table: ${productRows.length} rows`);
  console.log(`Compatibility table: ${compatibilityRows.length} rows`);
  console.log(`Prepared payloads: ${payloads.length}${args.limit > 0 ? ` of ${allPayloads.length}` : ''}`);
  console.log(`Payloads with models: ${payloadsWithModels.length}`);
  console.log(`Existing only: ${args.existingOnly ? 'yes' : 'no'}`);
  console.log(`Create only: ${args.createOnly ? 'yes' : 'no'}`);
  console.log(`Mode: ${args.commit ? 'commit' : 'dry-run'}`);

  if (!args.commit) {
    console.log('\nPreview:');
    console.log(JSON.stringify(payloads.slice(0, 5), null, 2));
    if (payloadsWithModels.length > 0) {
      console.log('\nPreview with models:');
      console.log(JSON.stringify(payloadsWithModels.slice(0, 3), null, 2));
    }
    console.log('\nNo data was written. Add --commit to import into Directus.');
    return;
  }

  const config = requireDirectusConfig();
  const stats = {created: 0, updated: 0, skipped: 0};
  const existingProducts = args.existingOnly
    ? await fetchExistingProducts(config, args.collection, args.identityField)
    : null;

  if (existingProducts) {
    console.log(`Existing products loaded: ${existingProducts.size}`);
  }

  for (const payload of payloads) {
    const result = await upsertProduct(config, args, payload, existingProducts);
    stats[result.action] += 1;
    if (!args.quiet) {
      console.log(`${result.action}: ${payload.sku}${result.id ? ` -> ${result.id}` : ''}`);
    }
  }

  console.log(`\nDone. Created: ${stats.created}. Updated: ${stats.updated}. Skipped: ${stats.skipped}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
