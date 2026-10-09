import type { Word } from '../types.ts';

// Handles quoted commas, escaped quotes, CRLF, and multiline quoted fields.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (quoted || !field.length) quoted = !quoted;
      else
        throw new Error(
          'Unexpected quote. Wrap fields containing commas or quotes in double quotes.',
        );
    } else if (char === ',' && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('A quoted field is missing its closing quote.');
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function importWords(text: string, existing: Word[]): Word[] {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('This file is empty. Add a word and its English meaning.');
  const header = rows[0].map((field) => field.toLowerCase());
  const hasHeader =
    ['word', 'japanese'].includes(header[0]) &&
    ['meaning', 'translation', 'english'].includes(header[1]);
  const seen = new Set(
    existing
      .filter((word) => word.source === 'custom')
      .map((word) => word.japanese.normalize('NFKC')),
  );
  const words: Word[] = [];
  for (const [index, row] of rows.slice(hasHeader ? 1 : 0).entries()) {
    if (row.length < 2 || row.length > 3 || !row[0] || !row[1]) {
      throw new Error(
        `Row ${index + (hasHeader ? 2 : 1)} needs word, meaning, and an optional reading. Quote meanings that contain commas.`,
      );
    }
    if (row.some((field) => field.length > 500))
      throw new Error('Keep each field under 500 characters.');
    const key = row[0].normalize('NFKC');
    if (seen.has(key)) continue;
    seen.add(key);
    words.push({
      id: `custom:${key}`,
      japanese: row[0],
      meaning: row[1],
      reading: row[2] || undefined,
      level: 'custom',
      source: 'custom',
    });
  }
  if (words.length + existing.filter((word) => word.source === 'custom').length > 5000)
    throw new Error('Your personal list can hold up to 5,000 words.');
  if (!words.length) throw new Error('These words are already in your personal list.');
  return words;
}

export function wordsToCsv(words: Word[]): string {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [
    'word,meaning,reading',
    ...words.map((word) => [word.japanese, word.meaning, word.reading || ''].map(escape).join(',')),
  ].join('\r\n');
}
