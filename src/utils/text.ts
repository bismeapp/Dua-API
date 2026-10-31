export function stripReferenceMarkers(value: string): string {
  return value
    .replace(/\s*\[\d{1,3}\]/g, '')
    .replace(/\bhttps?:\/\/\S+/gi, '');
}

export function getDuaHeading(
  dua: { title: Record<string, string>; heading?: Record<string, string> },
  language: string,
): string {
  return dua.heading?.[language] || dua.heading?.en || dua.title[language] || dua.title.en;
}
