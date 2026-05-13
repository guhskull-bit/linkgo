export function normalizeUrl(value) {
  const candidate = String(value || '').trim();

  if (!candidate) {
    throw new Error('Informe um link para continuar.');
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(candidate);
  } catch {
    throw new Error('Use uma URL completa, como https://exemplo.com.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('A URL precisa começar com http:// ou https://.');
  }

  return parsedUrl.toString();
}
