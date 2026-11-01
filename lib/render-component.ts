import type { ComponentSchema } from './database.types';

export function renderComponentTemplate(
  html: string,
  values: Record<string, string | number | boolean | null | undefined> = {}
): string {
  let result = html;

  Object.keys(values).forEach((key) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(values[key] ?? ''));
  });

  return result;
}

export function buildPreviewValues(
  schema: Array<{ name: string; default?: unknown }>
): Record<string, string> {
  const values: Record<string, string> = {};

  schema.forEach((field) => {
    if (!field.name) return;
    values[field.name] = field.default != null ? String(field.default) : '';
  });

  return values;
}

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g;

export function extractPlaceholderNames(html: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(PLACEHOLDER_RE)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }

  return names;
}

export function inferFieldType(name: string): ComponentSchema['type'] {
  const lower = name.toLowerCase();

  if (/(image|img|photo|thumbnail|avatar|icon)/.test(lower)) return 'image';
  if (/(color|colour|bg|background)/.test(lower)) return 'color';
  if (/(url|href|link)/.test(lower)) return 'url';
  if (/(body|description|content|bio|message|text)/.test(lower)) return 'textarea';

  return 'text';
}

const LABEL_MAP: Record<string, string> = {
  headline: '見出し',
  title: 'タイトル',
  subtitle: 'サブタイトル',
  subheadline: 'サブ見出し',
  body: '本文',
  description: '説明',
  content: 'コンテンツ',
  cta: 'CTA',
  ctatext: 'ボタン文言',
  button: 'ボタン',
  buttontext: 'ボタン文言',
  image: '画像',
  img: '画像',
  url: 'URL',
  link: 'リンク',
  href: 'リンク',
  color: '色',
  background: '背景色',
};

export function inferFieldLabel(name: string): string {
  const key = name.toLowerCase().replace(/[_-]/g, '');
  if (LABEL_MAP[key]) return LABEL_MAP[key];

  const spaced = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function createFieldFromName(name: string): ComponentSchema {
  return {
    name,
    type: inferFieldType(name),
    label: inferFieldLabel(name),
    default: '',
  };
}

/**
 * Merge HTML placeholders into schema:
 * - add newly detected names
 * - keep edits for existing names
 * - keep removed placeholders as trailing unused rows (for cleanup UI)
 */
export function syncSchemaWithPlaceholders(
  html: string,
  current: ComponentSchema[]
): ComponentSchema[] {
  const names = extractPlaceholderNames(html);
  const nameSet = new Set(names);
  const byName = new Map(current.filter((f) => f.name).map((f) => [f.name, f]));

  const active = names.map((name) => byName.get(name) ?? createFieldFromName(name));
  const unused = current.filter((f) => f.name && !nameSet.has(f.name));

  return [...active, ...unused];
}

export function schemaForSave(
  html: string,
  current: ComponentSchema[]
): ComponentSchema[] {
  const nameSet = new Set(extractPlaceholderNames(html));
  return syncSchemaWithPlaceholders(html, current).filter(
    (f) => f.name && nameSet.has(f.name)
  );
}
