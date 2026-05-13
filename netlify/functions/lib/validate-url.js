export function normalizeUrl(value) {
  let candidate = String(value || '').trim();

  if (!candidate) {
    throw new Error('Informe um link para continuar.');
  }

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(candidate);
  } catch {
    throw new Error('Use um link válido, como google.com ou https://exemplo.com.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('A URL precisa começar com http:// ou https://.');
  }

  return parsedUrl.toString();
}
