function notFoundPage(slug) {
  const safeSlug = String(slug || '').replace(/[<>&"]/g, '');

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Link não encontrado</title>
    <style>
      body {
        display: grid;
        min-height: 100vh;
        place-items: center;
        margin: 0;
        background: #eef2f6;
        color: #111827;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(92vw, 460px);
        padding: 32px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 22px 60px rgba(30, 41, 59, 0.14);
      }
      h1 {
        margin: 0 0 10px;
        font-size: 1.6rem;
      }
      p {
        margin: 0;
        color: #64748b;
        line-height: 1.6;
      }
      a {
        display: inline-flex;
        margin-top: 22px;
        color: #0f766e;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Link não encontrado</h1>
      <p>O atalho ${safeSlug ? `<strong>${safeSlug}</strong>` : 'solicitado'} não existe ou foi removido.</p>
      <a href="/">Criar um novo link</a>
    </main>
  </body>
</html>`;
}

export const handler = async (event) => {
  const slug = event.queryStringParameters?.slug || event.path.split('/').filter(Boolean).pop();

  return {
    statusCode: slug ? 404 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: notFoundPage(slug),
  };
};
