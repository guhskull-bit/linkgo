import { emptyOptionsResponse, getSiteOrigin, jsonResponse } from './lib/http.js';
import { normalizeUrl } from './lib/validate-url.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return emptyOptionsResponse();
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido.' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const originalUrl = normalizeUrl(body.url);
    const tinyUrlResponse = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(originalUrl)}`,
    );
    const shortUrl = (await tinyUrlResponse.text()).trim();

    if (!tinyUrlResponse.ok || !/^https?:\/\//i.test(shortUrl)) {
      return jsonResponse(502, {
        error: 'O serviço de encurtamento não respondeu agora. Tente novamente em instantes.',
      });
    }

    const now = new Date().toISOString();
    const origin = getSiteOrigin(event);

    return jsonResponse(201, {
      slug: shortUrl.split('/').filter(Boolean).pop(),
      originalUrl,
      shortUrl,
      provider: 'tinyurl',
      appOrigin: origin,
      createdAt: now,
    });
  } catch (error) {
    const message = error instanceof SyntaxError ? 'O corpo da requisição precisa ser JSON válido.' : error.message;
    return jsonResponse(400, { error: message });
  }
};
