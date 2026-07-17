const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {readTableFromUpload} = require('./lib/table-reader');
const {parseProducts} = require('./lib/product-parser');
const {upsertProducts} = require('./lib/directus');

const PORT = Number(process.env.PORT) || 4177;
const PUBLIC_DIR = path.join(__dirname, 'public');
const runs = new Map();

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), {'Content-Type': 'application/json; charset=utf-8'});
}

function getContentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function collectRequest(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(buffer, contentType) {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
  if (!boundary) {
    throw new Error('Не найден boundary формы.');
  }

  const body = buffer.toString('latin1');
  const marker = `--${boundary}`;
  const fields = {};
  const files = {};

  for (const part of body.split(marker)) {
    if (!part || part === '--\r\n' || part === '--') {
      continue;
    }

    const trimmed = part.replace(/^\r\n/, '').replace(/\r\n--$/, '');
    const separatorIndex = trimmed.indexOf('\r\n\r\n');
    if (separatorIndex === -1) {
      continue;
    }

    const rawHeaders = trimmed.slice(0, separatorIndex);
    let rawContent = trimmed.slice(separatorIndex + 4);
    if (rawContent.endsWith('\r\n')) {
      rawContent = rawContent.slice(0, -2);
    }

    const disposition = rawHeaders.match(/content-disposition:[^\r\n]+/i)?.[0] || '';
    const name = disposition.match(/name="([^"]+)"/)?.[1];
    const filename = disposition.match(/filename="([^"]*)"/)?.[1];
    if (!name) {
      continue;
    }

    if (filename) {
      files[name] = {
        filename,
        buffer: Buffer.from(rawContent, 'latin1'),
      };
    } else {
      fields[name] = Buffer.from(rawContent, 'latin1').toString('utf8');
    }
  }

  return {fields, files};
}

function toCsv(rows) {
  if (!rows.length) {
    return '';
  }

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escapeCell = (value) => {
    const text = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(';'), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(';'))].join('\n');
}

function createRun(parseResult, sourceNames) {
  const id = crypto.randomUUID();
  const payload = {
    id,
    createdAt: new Date().toISOString(),
    sourceNames,
    ...parseResult,
  };
  runs.set(id, payload);
  return payload;
}

async function handleParse(req, res) {
  const body = await collectRequest(req);
  const {fields, files} = parseMultipart(body, req.headers['content-type'] || '');
  const productRows = readTableFromUpload(files.products);
  const compatibilityRows = readTableFromUpload(files.compatibility);
  const result = parseProducts(productRows, compatibilityRows, {
    identityField: fields.identityField,
    modelsField: fields.modelsField,
    modelsFormat: fields.modelsFormat,
    limit: fields.limit,
  });
  const run = createRun(result, {
    products: files.products?.filename || '',
    compatibility: files.compatibility?.filename || '',
  });

  sendJson(res, 200, {
    id: run.id,
    summary: {
      productRows: run.productRows,
      compatibilityRows: run.compatibilityRows,
      prepared: run.payloads.length,
      totalPrepared: run.totalPayloads,
      withModels: run.payloadsWithModels,
      productsFile: run.sourceNames.products,
      compatibilityFile: run.sourceNames.compatibility,
    },
    preview: run.payloads.slice(0, 100),
  });
}

async function handleImport(req, res) {
  const body = await collectRequest(req);
  const settings = JSON.parse(body.toString('utf8') || '{}');
  const run = runs.get(settings.runId);
  if (!run) {
    sendJson(res, 404, {error: 'Результат парсинга не найден. Сначала загрузи и разбери файл.'});
    return;
  }

  if (!settings.url || !settings.token) {
    sendJson(res, 400, {error: 'Нужны Directus URL и token.'});
    return;
  }

  const result = await upsertProducts(run.payloads, {
    url: settings.url,
    token: settings.token,
    collection: settings.collection,
    identityField: run.options.identityField,
    mode: settings.mode,
  });

  sendJson(res, 200, result);
}

function handleDownload(req, res, url) {
  const id = url.searchParams.get('id');
  const format = url.searchParams.get('format') || 'json';
  const run = runs.get(id);

  if (!run) {
    send(res, 404, 'Not found', {'Content-Type': 'text/plain; charset=utf-8'});
    return;
  }

  if (format === 'csv') {
    send(res, 200, toCsv(run.payloads), {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="products.csv"',
    });
    return;
  }

  send(res, 200, JSON.stringify(run.payloads, null, 2), {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': 'attachment; filename="products.json"',
  });
}

function serveStatic(req, res, url) {
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, 'Not found', {'Content-Type': 'text/plain; charset=utf-8'});
      return;
    }

    send(res, 200, data, {'Content-Type': getContentType(filePath)});
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'POST' && url.pathname === '/api/parse') {
      await handleParse(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/import') {
      await handleImport(req, res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/download') {
      handleDownload(req, res, url);
      return;
    }

    if (req.method === 'GET') {
      serveStatic(req, res, url);
      return;
    }

    send(res, 405, 'Method not allowed', {'Content-Type': 'text/plain; charset=utf-8'});
  } catch (error) {
    sendJson(res, 500, {error: error instanceof Error ? error.message : String(error)});
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Ducati Parser App: http://localhost:${PORT}`);
});
