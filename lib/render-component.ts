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
