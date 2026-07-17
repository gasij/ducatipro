const parseForm = document.querySelector('#parseForm');
const importForm = document.querySelector('#importForm');
const statusNode = document.querySelector('#status');
const importButton = document.querySelector('#importButton');
const importLog = document.querySelector('#importLog');
const jsonLink = document.querySelector('#jsonLink');
const csvLink = document.querySelector('#csvLink');
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

parseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Разбираю файл...', 'busy');
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
