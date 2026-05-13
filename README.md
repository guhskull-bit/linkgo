# LinkQ

Aplicação web minimalista para encurtar links e gerar QR codes. O frontend é feito em React, as APIs rodam em Netlify Functions e os links são salvos com Netlify Blobs no deploy.

## Recursos

- Encurtamento de URLs com slug automático.
- Apelido personalizado opcional.
- QR code gerado dinamicamente no frontend.
- Download do QR code em SVG.
- Redirecionamento via `/s/:slug`.
- Função extra `/api/qrcode?url=https://exemplo.com` para gerar QR code SVG no backend.
- Fallback local em `.netlify-local/links.json` durante o desenvolvimento.

## Rodando localmente

```bash
npm install
npm run dev
```

O script local compila o frontend e abre a aplicação em `http://127.0.0.1:8888`, usando as mesmas funções serverless por trás das rotas `/api/shorten`, `/api/qrcode` e `/s/:slug`.

Se quiser usar o Netlify Dev oficial:

```bash
npm run dev:netlify
```

## Deploy no Netlify

O projeto já inclui `netlify.toml` com:

- build: `npm run build`
- publicação: `dist`
- funções: `netlify/functions`
- rotas `/api/shorten`, `/api/qrcode` e `/s/:slug`

No Netlify, o armazenamento usa Netlify Blobs automaticamente. Para usar Firebase ou outro banco no futuro, substitua a implementação em `netlify/functions/lib/links-store.js`.
