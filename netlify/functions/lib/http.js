export const jsonHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  };
}

export function emptyOptionsResponse() {
  return {
    statusCode: 204,
    headers: jsonHeaders,
    body: '',
  };
}

export function getSiteOrigin(event) {
  const forwardedProtocol = event.headers['x-forwarded-proto'];
  const protocol = forwardedProtocol || (event.headers.host?.includes('localhost') ? 'http' : 'https');
  const host = event.headers.host;

  return `${protocol}://${host}`.replace(/\/$/, '');
}
