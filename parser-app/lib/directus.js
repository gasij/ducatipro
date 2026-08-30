async function directusRequest(config, pathName, init = {}) {
  const response = await fetch(`${config.url.replace(/\/$/, '')}${pathName}`, {
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
    throw new Error(`${init.method || 'GET'} ${pathName}: ${response.status} ${text}`);
  }

  return body;
}

async function fetchExistingMap(config, collection, identityField) {
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

async function runWithConcurrency(items, concurrency, worker) {
  const queue = [...items];
  const workers = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      await worker(item);
    }
  });

  await Promise.all(workers);
}

async function upsertProducts(payloads, settings) {
  const config = {url: settings.url, token: settings.token};
  const collection = settings.collection || 'products';
  const identityField = settings.identityField || 'sku';
  const mode = settings.mode || 'upsert';
  const stats = {created: 0, updated: 0, skipped: 0};
  const log = [];

  const existingMap = mode === 'create' ? null : await fetchExistingMap(config, collection, identityField);
  if (existingMap) {
    log.push(`existing products loaded: ${existingMap.size}`);
  }

  await runWithConcurrency(payloads, 8, async (payload) => {
    const identityValue = payload[identityField];
    if (!identityValue) {
      stats.skipped += 1;
      log.push(`skipped: нет поля ${identityField}`);
      return;
    }

    try {
      const existing = existingMap?.get(String(identityValue)) || null;

      if (existing?.id) {
        const updated = await directusRequest(config, `/items/${collection}/${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        stats.updated += 1;
        log.push(`updated: ${identityValue} -> ${updated?.data?.id || existing.id}`);
        return;
      }

      if (mode === 'existing') {
        stats.skipped += 1;
        log.push(`skipped: ${identityValue}`);
        return;
      }

      const created = await directusRequest(config, `/items/${collection}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      stats.created += 1;
      log.push(`created: ${identityValue} -> ${created?.data?.id || 'ok'}`);
    } catch (error) {
      stats.skipped += 1;
      log.push(`error: ${identityValue} -> ${error instanceof Error ? error.message : error}`);
    }
  });

  return {stats, log};
}

async function fetchExistingRelationKeys(config, junctionCollection) {
  const keys = new Set();
  const pageSize = 500;
  let page = 1;

  while (true) {
    const params = new URLSearchParams();
    params.set('fields', 'motorcycles_id,products_id');
    params.set('limit', String(pageSize));
    params.set('page', String(page));

    const payload = await directusRequest(config, `/items/${junctionCollection}?${params.toString()}`);
    const items = Array.isArray(payload?.data) ? payload.data : [];

    for (const item of items) {
      if (item?.motorcycles_id && item?.products_id) {
        keys.add(`${item.motorcycles_id}:${item.products_id}`);
      }
    }

    if (items.length < pageSize) {
      break;
    }
    page += 1;
  }

  return keys;
}

async function upsertMotorcycles(motorcycles, relations, settings) {
  const config = {url: settings.url, token: settings.token};
  const productsCollection = settings.productsCollection || 'products';
  const motorcyclesCollection = settings.motorcyclesCollection || 'motorcycles';
  const junctionCollection = settings.junctionCollection || 'motorcycles_products';
  const stats = {createdMotorcycles: 0, updatedMotorcycles: 0, createdRelations: 0, skippedRelations: 0};
  const log = [];

  const [existingProducts, existingMotorcycles, existingRelationKeys] = await Promise.all([
    fetchExistingMap(config, productsCollection, 'sku'),
    fetchExistingMap(config, motorcyclesCollection, 'sku'),
    fetchExistingRelationKeys(config, junctionCollection),
  ]);

  const motorcycleIds = new Map();

  await runWithConcurrency(motorcycles, 8, async (payload) => {
    try {
      const existing = existingMotorcycles.get(payload.sku);
      if (existing?.id) {
        const updated = await directusRequest(config, `/items/${motorcyclesCollection}/${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        motorcycleIds.set(payload.sku, updated?.data?.id || existing.id);
        stats.updatedMotorcycles += 1;
        log.push(`motorcycle updated: ${payload.sku}`);
      } else {
        const created = await directusRequest(config, `/items/${motorcyclesCollection}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        motorcycleIds.set(payload.sku, created?.data?.id);
        stats.createdMotorcycles += 1;
        log.push(`motorcycle created: ${payload.sku}`);
      }
    } catch (error) {
      log.push(`motorcycle error: ${payload.sku} -> ${error instanceof Error ? error.message : error}`);
    }
  });

  const seenRelationKeys = new Set();
  const toCreate = [];

  for (const relation of relations) {
    const productId = existingProducts.get(relation.productSku)?.id;
    const motorcycleId = motorcycleIds.get(relation.motorcycleSku);

    if (!productId || !motorcycleId) {
      stats.skippedRelations += 1;
      continue;
    }

    const relationKey = `${motorcycleId}:${productId}`;
    if (existingRelationKeys.has(relationKey) || seenRelationKeys.has(relationKey)) {
      stats.skippedRelations += 1;
      continue;
    }
    seenRelationKeys.add(relationKey);
    toCreate.push({motorcycles_id: motorcycleId, products_id: productId});
  }

  const batchSize = 150;
  const batchDelayMs = 400;
  const batches = [];
  for (let index = 0; index < toCreate.length; index += batchSize) {
    batches.push(toCreate.slice(index, index + batchSize));
  }

  await runWithConcurrency(batches, 2, async (batch) => {
    try {
      await directusRequest(config, `/items/${junctionCollection}`, {
        method: 'POST',
        body: JSON.stringify(batch),
      });
      stats.createdRelations += batch.length;
      await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
    } catch (error) {
      log.push(`batch of ${batch.length} relations failed, retrying one by one: ${error instanceof Error ? error.message : error}`);
      await runWithConcurrency(batch, 2, async (item) => {
        try {
          await directusRequest(config, `/items/${junctionCollection}`, {
            method: 'POST',
            body: JSON.stringify(item),
          });
          stats.createdRelations += 1;
        } catch (itemError) {
          stats.skippedRelations += 1;
          log.push(`relation error: ${item.motorcycles_id} <-> ${item.products_id} -> ${itemError instanceof Error ? itemError.message : itemError}`);
        }
      });
    }
  });

  log.push(
    `Done. Motorcycles created: ${stats.createdMotorcycles}. Updated: ${stats.updatedMotorcycles}. Relations created: ${stats.createdRelations}. Skipped: ${stats.skippedRelations}.`,
  );

  return {stats, log};
}

module.exports = {
  directusRequest,
  fetchExistingMap,
  runWithConcurrency,
  upsertProducts,
  upsertMotorcycles,
};
