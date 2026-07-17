const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

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
    throw new Error('Не получилось прочитать первый лист XLSX. Проверь, что файл не поврежден.');
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

function detectDelimiter(content, fileName) {
  if (fileName.endsWith('.tsv')) {
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

function tableFromText(rawText, fileName) {
  const raw = rawText.replace(/^\uFEFF/, '');

  if (fileName.endsWith('.json')) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('JSON должен быть массивом объектов.');
    }
    return parsed;
  }

  const delimiter = detectDelimiter(raw, fileName);
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

function readTableFromUpload(file) {
  if (!file || !file.buffer?.length) {
    return [];
  }

  const fileName = String(file.filename || '').toLowerCase();

  if (fileName.endsWith('.xlsx')) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ducati-parser-'));
    const tempFile = path.join(tempDir, 'upload.xlsx');
    fs.writeFileSync(tempFile, file.buffer);

    try {
      return readXlsxTable(tempFile);
    } finally {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  }

  return tableFromText(file.buffer.toString('utf8'), fileName);
}

module.exports = {
  readTableFromUpload,
};
