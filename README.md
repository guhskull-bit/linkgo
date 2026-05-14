# LinkQ

Aplicação web minimalista para encurtar links e gerar QR codes. O frontend é feito em React e as APIs rodam em Netlify Functions.

## Recursos

- Encurtamento de URLs usando TinyURL.
- QR code gerado dinamicamente no frontend.
- Download do QR code em SVG.
- Função extra `/api/qrcode?url=https://exemplo.com` para gerar QR code SVG no backend.

## Rodando localmente

```bash
npm install
npm run dev
```

O script local compila o frontend e abre a aplicação em `http://127.0.0.1:8888`, usando as mesmas funções serverless por trás das rotas `/api/shorten` e `/api/qrcode`.

Se quiser usar o Netlify Dev oficial:

```bash
npm run dev:netlify
```

## Deploy no Netlify

O projeto já inclui `netlify.toml` com:

- build: `npm run build`
- publicação: `dist`
- funções: `netlify/functions`
- rotas `/api/shorten` e `/api/qrcode`

Esta versão não precisa de banco de dados nem Netlify Blobs.
