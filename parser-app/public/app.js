const parseForm = document.querySelector('#parseForm');
const importForm = document.querySelector('#importForm');
const statusNode = document.querySelector('#status');
const importButton = document.querySelector('#importButton');
const importLog = document.querySelector('#importLog');
const jsonLink = document.querySelector('#jsonLink');
const csvLink = document.querySelector('#csvLink');
const productsInput = parseForm.querySelector('input[name="products"]');
const compatibilityInput = parseForm.querySelector('input[name="compatibility"]');
const productsFilesHint = document.querySelector('#productsFilesHint');
const compatibilityFilesHint = document.querySelector('#compatibilityFilesHint');
let currentRunId = '';

function setStatus(text, tone = '') {
  statusNode.textContent = text;
  statusNode.dataset.tone = tone;
}

function setMetric(id, value) {
  document.querySelector(id).textContent = String(value);
}

function renderTable(rows) {
  const head = document.querySelector('#tableHead');
  const body = document.querySelector('#tableBody');
  const hint = document.querySelector('#previewHint');
  head.innerHTML = '';
  body.innerHTML = '';

  if (!rows.length) {
    hint.textContent = 'Нет данных для предпросмотра.';
    return;
  }

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  head.innerHTML = `<tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>`;
  body.innerHTML = rows
    .map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(formatCell(row[header]))}</td>`).join('')}</tr>`)
    .join('');
  hint.textContent = `Показано ${rows.length} строк.`;
}

function formatCell(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value ?? '';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function enableDownloads(runId) {
  jsonLink.href = `/download?id=${encodeURIComponent(runId)}&format=json`;
  csvLink.href = `/download?id=${encodeURIComponent(runId)}&format=csv`;
  jsonLink.classList.remove('disabled');
  csvLink.classList.remove('disabled');
}

function formatFileSelection(input, emptyText) {
  const files = [...input.files].map((file) => file.name);
  if (files.length === 0) {
    return emptyText;
  }
  if (files.length <= 3) {
    return files.join(', ');
  }
  return `${files.slice(0, 3).join(', ')} + еще ${files.length - 3}`;
}

function updateFileHints() {
  productsFilesHint.textContent = formatFileSelection(productsInput, 'Можно выбрать сразу несколько D2-таблиц.');
  compatibilityFilesHint.textContent = formatFileSelection(
    compatibilityInput,
    'Можно выбрать сразу несколько D1-таблиц.',
  );
}

productsInput.addEventListener('change', updateFileHints);
compatibilityInput.addEventListener('change', updateFileHints);

parseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Разбираю файлы...', 'busy');
  importLog.textContent = '';

  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      body: new FormData(parseForm),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Ошибка парсинга');
    }

    currentRunId = payload.id;
    setMetric('#metricRows', payload.summary.productRows);
    setMetric('#metricPrepared', `${payload.summary.prepared}/${payload.summary.totalPrepared}`);
    setMetric('#metricModels', payload.summary.withModels);
    renderTable(payload.preview);
    enableDownloads(payload.id);
    importButton.disabled = payload.summary.prepared === 0;
    setStatus('Готово', 'ok');
  } catch (error) {
    setStatus('Ошибка', 'error');
    importLog.textContent = error.message;
  }
});

const motoParseForm = document.querySelector('#motoParseForm');
const motoImportForm = document.querySelector('#motoImportForm');
const motoImportButton = document.querySelector('#motoImportButton');
const motoImportLog = document.querySelector('#motoImportLog');
const motoFilesHint = document.querySelector('#motoFilesHint');
const compatibilityMotoInput = motoParseForm.querySelector('input[name="compatibility"]');
let currentMotoRunId = '';

compatibilityMotoInput.addEventListener('change', () => {
  motoFilesHint.textContent = formatFileSelection(
    compatibilityMotoInput,
    'OEM/MODEL/FAMILY/YEAR таблица (например, D1-1-1.xlsx).',
  );
});

function getDirectusCreds() {
  const data = Object.fromEntries(new FormData(importForm).entries());
  return {url: data.url, token: data.token};
}

motoParseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const {url, token} = getDirectusCreds();
  if (!url || !token) {
    motoImportLog.textContent = 'Сначала укажи URL и token в блоке Directus выше.';
    return;
  }

  setStatus('Проверяю модели...', 'busy');
  motoImportLog.textContent = '';

  const formData = new FormData(motoParseForm);
  formData.set('url', url);
  formData.set('token', token);

  try {
    const response = await fetch('/api/motorcycles/parse', {method: 'POST', body: formData});
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Ошибка проверки');
    }

    currentMotoRunId = payload.id;
    setMetric('#motoMetricModels', payload.summary.motorcycles);
    setMetric('#motoMetricRelations', payload.summary.relations);
    motoImportLog.textContent = [
      `Строк совместимости: ${payload.summary.compatibilityRows}`,
      `Строк с существующим товаром: ${payload.summary.matchedProductRows}`,
      `Моделей к созданию/обновлению: ${payload.summary.motorcycles} из ${payload.summary.totalMotorcycles}`,
      `Связей товар-мотоцикл: ${payload.summary.relations} из ${payload.summary.totalRelations}`,
    ].join('\n');
    motoImportButton.disabled = payload.summary.motorcycles === 0;
    setStatus('Готово', 'ok');
  } catch (error) {
    setStatus('Ошибка', 'error');
    motoImportLog.textContent = error.message;
  }
});

motoImportForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentMotoRunId) {
    motoImportLog.textContent = 'Сначала проверь файл совместимости.';
    return;
  }

  const {url, token} = getDirectusCreds();
  if (!url || !token) {
    motoImportLog.textContent = 'Сначала укажи URL и token в блоке Directus выше.';
    return;
  }

  const data = Object.fromEntries(new FormData(motoImportForm).entries());
  data.runId = currentMotoRunId;
  data.url = url;
  data.token = token;

  setStatus('Импортирую модели...', 'busy');
  motoImportButton.disabled = true;

  try {
    const response = await fetch('/api/motorcycles/import', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Ошибка импорта');
    }

    motoImportLog.textContent = [
      `Motorcycles created: ${payload.stats.createdMotorcycles}`,
      `Motorcycles updated: ${payload.stats.updatedMotorcycles}`,
      `Relations created: ${payload.stats.createdRelations}`,
      `Relations skipped: ${payload.stats.skippedRelations}`,
      '',
      ...payload.log.slice(0, 300),
    ].join('\n');
    setStatus('Импорт завершен', 'ok');
  } catch (error) {
    setStatus('Ошибка', 'error');
    motoImportLog.textContent = error.message;
  } finally {
    motoImportButton.disabled = false;
  }
});

importForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentRunId) {
    importLog.textContent = 'Сначала разбери таблицу.';
    return;
  }

  const data = Object.fromEntries(new FormData(importForm).entries());
  data.runId = currentRunId;
  setStatus('Импортирую...', 'busy');
  importButton.disabled = true;

  try {
    const response = await fetch('/api/import', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Ошибка импорта');
    }

    importLog.textContent = [
      `Created: ${payload.stats.created}`,
      `Updated: ${payload.stats.updated}`,
      `Skipped: ${payload.stats.skipped}`,
      '',
      ...payload.log.slice(0, 300),
    ].join('\n');
    setStatus('Импорт завершен', 'ok');
  } catch (error) {
    setStatus('Ошибка', 'error');
    importLog.textContent = error.message;
  } finally {
    importButton.disabled = false;
  }
});
