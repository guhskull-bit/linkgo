import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, 'dist');
const preferredPort = Number(process.env.PORT || 8888);
const shouldCheck = process.argv.includes('--check');

process.env.CONTEXT ||= 'dev';
process.env.NETLIFY ||= 'false';

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon'],
]);

async function loadFunction(name) {
  const functionPath = path.join(projectRoot, 'netlify', 'functions', `${name}.js`);
  return import(`${pathToFileURL(functionPath).href}?v=${Date.now()}`);
}

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

function writeResponse(response, output) {
  response.writeHead(output.statusCode || 200, output.headers || {});
  response.end(output.body || '');
}

async function serveStatic(response, pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const requestedPath = path.normalize(normalizedPath).replace(/^([/\\])+/, '');
  const filePath = path.join(distRoot, requestedPath);

  if (!filePath.startsWith(distRoot)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const bytes = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes.get(path.extname(filePath)) || 'application/octet-stream',
    });
    response.end(bytes);
  } catch {
    const fallback = await readFile(path.join(distRoot, 'index.html'));
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(fallback);
  }
}

async function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once('error', async (error) => {
      if (error.code === 'EADDRINUSE' && port < preferredPort + 10) {
        try {
          const nextPort = await listen(server, port + 1);
          resolve(nextPort);
        } catch (nextError) {
          reject(nextError);
        }
        return;
      }

      reject(error);
    });

    server.listen(port, '127.0.0.1', () => resolve(port));
  });
}

await mkdir(path.join(projectRoot, '.netlify-local'), { recursive: true });
await build();

const functions = {
  qrcode: await loadFunction('qrcode'),
  redirect: await loadFunction('redirect'),
  shorten: await loadFunction('shorten'),
};

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
    const headers = {
      ...request.headers,
      host: request.headers.host || '127.0.0.1',
      'x-forwarded-proto': 'http',
    };

    if (requestUrl.pathname === '/api/shorten') {
      const output = await functions.shorten.handler({
        body: await readBody(request),
        headers,
        httpMethod: request.method,
        path: requestUrl.pathname,
        queryStringParameters: Object.fromEntries(requestUrl.searchParams),
      });
      writeResponse(response, output);
      return;
    }

    if (requestUrl.pathname === '/api/qrcode') {
      const output = await functions.qrcode.handler({
        body: await readBody(request),
        headers,
        httpMethod: request.method,
        path: requestUrl.pathname,
        queryStringParameters: Object.fromEntries(requestUrl.searchParams),
      });
      writeResponse(response, output);
      return;
    }

    if (requestUrl.pathname.startsWith('/s/')) {
      const output = await functions.redirect.handler({
        body: '',
        headers,
        httpMethod: request.method,
        path: requestUrl.pathname,
        queryStringParameters: { slug: requestUrl.pathname.split('/').pop() },
      });
      writeResponse(response, output);
      return;
    }

    await serveStatic(response, requestUrl.pathname);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error.stack || error.message);
  }
});

const port = await listen(server, preferredPort);
console.log(`Local app ready: http://127.0.0.1:${port}`);

if (shouldCheck) {
  const baseUrl = `http://127.0.0.1:${port}`;
  const createResponse = await fetch(`${baseUrl}/api/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com/local-check',
    }),
  });
  const createPayload = await createResponse.json();
  const qrResponse = await fetch(`${baseUrl}/api/qrcode?url=${encodeURIComponent(createPayload.shortUrl)}`);

  if (
    createResponse.status !== 201 ||
    !/^https?:\/\//i.test(createPayload.shortUrl || '') ||
    qrResponse.status !== 200
  ) {
    throw new Error('Local smoke check failed.');
  }

  await new Promise((resolve) => server.close(resolve));
  console.log('Local smoke check passed.');
}
