const {directusRequest, fetchExistingMap, runWithConcurrency} = require('./directus');

const DEFAULT_GALLERY_JUNCTION_COLLECTION = 'products_files_1';

const MIME_TYPES_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

// `new Blob([buffer])` has no type of its own, so without this Directus
// stores every upload as application/octet-stream — it then can't tell the
// file is an image at all, so it skips its own resize/quality transforms
// and serves the raw original verbatim (looks over-compressed/pixelated on
// the site, which just requests it through Next's own image optimizer).
function mimeTypeFromFilename(filename) {
  const extension = String(filename || '').split('.').pop()?.toLowerCase();
  return MIME_TYPES_BY_EXTENSION[extension] || 'application/octet-stream';
}

function articleFromFilename(filename) {
  return String(filename || '')
    .replace(/\.[^.]+$/, '')
    .trim();
}

// Strips a trailing "-2", "_2", " 2", "(2)" copy-suffix, then a trailing
// "-H" / "_H" / " H" hero-photo marker, so that e.g. "19410711A-2.jpg" or
// "67621241A-H.jpg" resolve back to the article "19410711A" / "67621241A"
// once the exact filename itself doesn't match any product.
function baseArticleFromFilename(filename) {
  let name = articleFromFilename(filename);
  let previous;
  // Suffixes can stack in either order (e.g. "...-1-H.jpg" or "...-H-1.jpg"),
  // so keep stripping both patterns until neither matches anymore.
  do {
    previous = name;
    name = name.replace(/[\s_-]*\(?\d+\)?$/, '').trim();
    name = name.replace(/[\s_-]+H$/i, '').trim();
  } while (name !== previous);
  return name;
}

async function uploadFileToDirectus(config, file) {
  const form = new FormData();
  form.append('file', new Blob([file.buffer], {type: mimeTypeFromFilename(file.filename)}), file.filename);

  const response = await fetch(`${config.url.replace(/\/$/, '')}/files`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${config.token}`},
    body: form,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`upload ${file.filename}: ${response.status} ${text}`);
  }

  return body?.data?.id;
}

function planPhotoUploads(files, existingProducts) {
  // Article numbers should match regardless of case (a filename like
  // "45613411ab.jpg" must still find product sku "45613411AB").
  const byUpperSku = new Map();
  for (const [sku, product] of existingProducts.entries()) {
    byUpperSku.set(sku.toUpperCase(), product);
  }
  const lookup = (article) => byUpperSku.get(String(article || '').toUpperCase());

  const plan = [];
  const claimedAsMain = new Set();
  const unmatched = [];

  for (const file of files) {
    const article = articleFromFilename(file.filename);
    const product = lookup(article);
    if (product) {
      plan.push({file, sku: article, productId: product.id, mode: 'main'});
      claimedAsMain.add(article.toUpperCase());
    }
  }

  for (const file of files) {
    const article = articleFromFilename(file.filename);
    if (claimedAsMain.has(article.toUpperCase()) && lookup(article)) {
      continue;
    }

    const baseArticle = baseArticleFromFilename(file.filename);
    const product = lookup(baseArticle);
    if (baseArticle && product) {
      plan.push({file, sku: baseArticle, productId: product.id, mode: 'gallery'});
    } else {
      unmatched.push(file.filename);
    }
  }

  return {plan, unmatched};
}

async function preparePhotoUpload(files, settings) {
  const config = {url: settings.url, token: settings.token};
  const collection = settings.collection || 'products';

  const existingProducts = await fetchExistingMap(config, collection, 'sku');
  const {plan, unmatched} = planPhotoUploads(files, existingProducts);

  return {
    plan,
    unmatched,
    productsLoaded: existingProducts.size,
    mainCount: plan.filter((item) => item.mode === 'main').length,
    galleryCount: plan.filter((item) => item.mode === 'gallery').length,
  };
}

async function commitPhotoUpload(plan, settings) {
  const config = {url: settings.url, token: settings.token};
  const collection = settings.collection || 'products';
  const galleryJunctionCollection = settings.galleryJunctionCollection || DEFAULT_GALLERY_JUNCTION_COLLECTION;
  const stats = {mainUploaded: 0, galleryUploaded: 0, skipped: 0};
  const log = [];

  await runWithConcurrency(plan, 4, async (item) => {
    try {
      const fileId = await uploadFileToDirectus(config, item.file);

      if (item.mode === 'main') {
        await directusRequest(config, `/items/${collection}/${item.productId}`, {
          method: 'PATCH',
          body: JSON.stringify({main_image: fileId}),
        });
        stats.mainUploaded += 1;
        log.push(`${item.sku}: главное фото ← ${item.file.filename}`);
      } else {
        await directusRequest(config, `/items/${galleryJunctionCollection}`, {
          method: 'POST',
          body: JSON.stringify({products_id: item.productId, directus_files_id: fileId}),
        });
        stats.galleryUploaded += 1;
        log.push(`${item.sku}: доп. фото в галерею ← ${item.file.filename}`);
      }
    } catch (error) {
      stats.skipped += 1;
      log.push(`ошибка «${item.file.filename}»: ${error instanceof Error ? error.message : error}`);
    }
  });

  return {stats, log};
}

module.exports = {
  preparePhotoUpload,
  commitPhotoUpload,
};
