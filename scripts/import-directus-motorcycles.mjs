#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

function parseArgs(argv) {
  const args = {
    compatibility: '',
    motorcyclesCollection: 'motorcycles',
    productsCollection: process.env.DIRECTUS_PRODUCTS_COLLECTION || 'products',
    junctionCollection: 'motorcycles_products',
    limit: 0,
    commit: false,
    quiet: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--compat' || arg === '--compatibility') {
      args.compatibility = next || '';
      index += 1;
    } else if (arg === '--motorcycles-collection') {
      args.motorcyclesCollection = next || args.motorcyclesCollection;
      index += 1;
    } else if (arg === '--products-collection') {
      args.productsCollection = next || args.productsCollection;
      index += 1;
    } else if (arg === '--junction-collection') {
      args.junctionCollection = next || args.junctionCollection;
      index += 1;
    } else if (arg === '--limit') {
      args.limit = Math.max(0, Number(next) || 0);
      index += 1;
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
  npm run import:motorcycles -- --compat ./exc/D1-1-1.xlsx
  npm run import:motorcycles -- --compat ./exc/D1-1-1.xlsx --commit

Options:
  --compat <file>                 XLSX/CSV/JSON table with OEM, FAMILY, MODEL, YEAR.
  --motorcycles-collection <name> Default: motorcycles.
  --products-collection <name>    Default: DIRECTUS_PRODUCTS_COLLECTION or products.
  --junction-collection <name>    Default: motorcycles_products.
  --limit <number>                Use first N matching product rows.
  --quiet                         Print only summary logs during commit.
  --commit                        Actually write to Directus. Without this flag the script is dry-run.
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

  const firstLine = raw.split(/\r?\n/, 1)[0] || '';
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
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
    key,
    payload: {
      sku,
      name,
      slug: sku,
      brand: 'Ducati',
      year,
    },
  };
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

async function fetchItemsByField(config, collection, field) {
  const items = new Map();
  const pageSize = 500;
  let page = 1;

  while (true) {
    const params = new URLSearchParams();
    params.set('fields', `id,${field}`);
    params.set('limit', String(pageSize));
    params.set('page', String(page));

    const payload = await directusRequest(config, `/items/${collection}?${params.toString()}`);
    const rows = Array.isArray(payload?.data) ? payload.data : [];

    for (const row of rows) {
      if (row?.[field]) {
        items.set(String(row[field]), row);
      }
    }

    if (rows.length < pageSize) {
      break;
    }

    page += 1;
  }

  return items;
}

async function main() {
  loadEnvFile(path.resolve('.env.local'));
  loadEnvFile(path.resolve('.env'));

  const args = parseArgs(process.argv.slice(2));
  if (!args.compatibility) {
    printHelp();
    throw new Error('--compat is required');
  }

  const rows = readTable(args.compatibility);
  const config = requireDirectusConfig();
  const existingProducts = await fetchItemsByField(config, args.productsCollection, 'sku');
  const existingMotorcycles = await fetchItemsByField(config, args.motorcyclesCollection, 'sku');
  const motorcyclePayloads = new Map();
  const relationKeys = new Set();
  const relationRows = [];

  for (const row of rows) {
    const productSku = getCell(row, ['oem', 'sku', 'article', 'артикул']);
    if (!existingProducts.has(productSku)) {
      continue;
    }

    const motorcycle = buildMotorcyclePayload(row);
    if (!motorcycle) {
      continue;
    }

    motorcyclePayloads.set(motorcycle.payload.sku, motorcycle.payload);
    relationRows.push({productSku, motorcycleSku: motorcycle.payload.sku});
  }

  const limitedRelations = args.limit > 0 ? relationRows.slice(0, args.limit) : relationRows;
  const limitedMotorcycleSkus = new Set(limitedRelations.map((relation) => relation.motorcycleSku));
  const limitedMotorcycles = [...motorcyclePayloads.values()].filter((payload) =>
    limitedMotorcycleSkus.has(payload.sku),
  );

  console.log(`Compatibility table: ${rows.length} rows`);
  console.log(`Existing products: ${existingProducts.size}`);
  console.log(`Motorcycles to upsert: ${limitedMotorcycles.length}`);
  console.log(`Relations to create: ${limitedRelations.length}`);
  console.log(`Mode: ${args.commit ? 'commit' : 'dry-run'}`);

  if (!args.commit) {
    console.log('\nMotorcycle preview:');
    console.log(JSON.stringify(limitedMotorcycles.slice(0, 5), null, 2));
    console.log('\nRelation preview:');
    console.log(JSON.stringify(limitedRelations.slice(0, 5), null, 2));
    console.log('\nNo data was written. Add --commit to import into Directus.');
    return;
  }

  const stats = {createdMotorcycles: 0, updatedMotorcycles: 0, createdRelations: 0, skippedRelations: 0};
  const motorcycleIds = new Map([...existingMotorcycles.entries()].map(([sku, item]) => [sku, item.id]));

  for (const payload of limitedMotorcycles) {
    const existing = existingMotorcycles.get(payload.sku);
    if (existing?.id) {
      const updated = await directusRequest(config, `/items/${args.motorcyclesCollection}/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      motorcycleIds.set(payload.sku, updated?.data?.id || existing.id);
      stats.updatedMotorcycles += 1;
    } else {
      const created = await directusRequest(config, `/items/${args.motorcyclesCollection}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      motorcycleIds.set(payload.sku, created?.data?.id);
      stats.createdMotorcycles += 1;
    }

    if (!args.quiet) {
      console.log(`motorcycle: ${payload.sku}`);
    }
  }

  for (const relation of limitedRelations) {
    const productId = existingProducts.get(relation.productSku)?.id;
    const motorcycleId = motorcycleIds.get(relation.motorcycleSku);
    const relationKey = `${motorcycleId}:${productId}`;

    if (!productId || !motorcycleId || relationKeys.has(relationKey)) {
      stats.skippedRelations += 1;
      continue;
    }

    relationKeys.add(relationKey);
    await directusRequest(config, `/items/${args.junctionCollection}`, {
      method: 'POST',
      body: JSON.stringify({
        motorcycles_id: motorcycleId,
        products_id: productId,
      }),
    });
    stats.createdRelations += 1;
  }

  console.log(
    `\nDone. Motorcycles created: ${stats.createdMotorcycles}. Motorcycles updated: ${stats.updatedMotorcycles}. Relations created: ${stats.createdRelations}. Relations skipped: ${stats.skippedRelations}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
