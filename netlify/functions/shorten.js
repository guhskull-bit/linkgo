import { emptyOptionsResponse, getSiteOrigin, jsonResponse } from './lib/http.js';
import { getLink, saveLink } from './lib/links-store.js';
import { createSlug, isValidCustomSlug, normalizeCustomSlug } from './lib/slug.js';
import { normalizeUrl } from './lib/validate-url.js';

const maxSlugAttempts = 10;

async function getAvailableSlug(customAlias) {
  const requestedSlug = normalizeCustomSlug(customAlias);

  if (requestedSlug) {
    if (!isValidCustomSlug(requestedSlug)) {
      return {
        error: 'O apelido deve ter de 3 a 48 caracteres e usar apenas letras, números, hífen ou underline.',
        statusCode: 400,
      };
    }

    const existingLink = await getLink(requestedSlug);

    if (existingLink) {
      return {
        error: 'Esse apelido já está em uso. Tente outro nome.',
        statusCode: 409,
      };
    }

    return { slug: requestedSlug, isCustom: true };
  }

  for (let attempt = 0; attempt < maxSlugAttempts; attempt += 1) {
    const slug = createSlug();
    const existingLink = await getLink(slug);

    if (!existingLink) {
      return { slug, isCustom: false };
    }
  }

  return {
    error: 'Não foi possível gerar um slug único agora. Tente novamente.',
    statusCode: 500,
  };
}

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
    const slugResult = await getAvailableSlug(body.customAlias);

    if (slugResult.error) {
      return jsonResponse(slugResult.statusCode, { error: slugResult.error });
    }

    const now = new Date().toISOString();
    const record = {
      slug: slugResult.slug,
      originalUrl,
      clicks: 0,
      custom: slugResult.isCustom,
      createdAt: now,
      updatedAt: now,
    };

    await saveLink(record);

    const origin = getSiteOrigin(event);
    const shortUrl = `${origin}/s/${record.slug}`;

    return jsonResponse(201, {
      ...record,
      shortUrl,
    });
  } catch (error) {
    const message = error instanceof SyntaxError ? 'O corpo da requisição precisa ser JSON válido.' : error.message;
    return jsonResponse(400, { error: message });
  }
};
