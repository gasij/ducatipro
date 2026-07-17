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

async function findExistingProduct(config, collection, identityField, identityValue) {
  const params = new URLSearchParams();
  params.set(`filter[${identityField}][_eq]`, identityValue);
  params.set('limit', '1');
  params.set('fields', `id,${identityField}`);

  const payload = await directusRequest(config, `/items/${collection}?${params.toString()}`);
  return Array.isArray(payload?.data) ? payload.data[0] : null;
}

async function upsertProducts(payloads, settings) {
  const config = {url: settings.url, token: settings.token};
  const collection = settings.collection || 'products';
  const identityField = settings.identityField || 'sku';
  const mode = settings.mode || 'upsert';
  const stats = {created: 0, updated: 0, skipped: 0};
  const log = [];

  for (const payload of payloads) {
    const identityValue = payload[identityField];
    if (!identityValue) {
      stats.skipped += 1;
      log.push(`skipped: нет поля ${identityField}`);
      continue;
    }

    if (mode === 'create') {
      const created = await directusRequest(config, `/items/${collection}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      stats.created += 1;
      log.push(`created: ${identityValue} -> ${created?.data?.id || 'ok'}`);
      continue;
    }

    const existing = await findExistingProduct(config, collection, identityField, String(identityValue));
    if (existing?.id) {
      if (mode === 'existing') {
        const updated = await directusRequest(config, `/items/${collection}/${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        stats.updated += 1;
        log.push(`updated: ${identityValue} -> ${updated?.data?.id || existing.id}`);
      } else {
        const updated = await directusRequest(config, `/items/${collection}/${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        stats.updated += 1;
        log.push(`updated: ${identityValue} -> ${updated?.data?.id || existing.id}`);
      }
      continue;
    }

    if (mode === 'existing') {
      stats.skipped += 1;
      log.push(`skipped: ${identityValue}`);
      continue;
    }

    const created = await directusRequest(config, `/items/${collection}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    stats.created += 1;
    log.push(`created: ${identityValue} -> ${created?.data?.id || 'ok'}`);
  }

  return {stats, log};
}

module.exports = {
  upsertProducts,
};
