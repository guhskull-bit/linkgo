import QRCode from 'qrcode';
import { emptyOptionsResponse } from './lib/http.js';
import { normalizeUrl } from './lib/validate-url.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return emptyOptionsResponse();
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido.' }),
    };
  }

  try {
    const value = normalizeUrl(event.queryStringParameters?.url);
    const size = Number(event.queryStringParameters?.size || 256);
    const width = Number.isFinite(size) ? Math.min(Math.max(size, 128), 640) : 256;
    const svg = await QRCode.toString(value, {
      type: 'svg',
      margin: 2,
      width,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': 'image/svg+xml; charset=utf-8',
      },
      body: svg,
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
