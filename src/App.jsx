import React, { useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Loader2,
  QrCode,
  WandSparkles,
} from 'lucide-react';

const initialForm = {
  url: '',
  customAlias: '',
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  const canSubmit = useMemo(() => form.url.trim().length > 0 && !isLoading, [form.url, isLoading]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) return;

    setIsLoading(true);
    setCopied(false);
    setError('');

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: form.url.trim(),
          customAlias: form.customAlias.trim() || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível encurtar este link.');
      }

      setResult(payload);
    } catch (requestError) {
      setResult(null);
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function copyShortUrl() {
    if (!result?.shortUrl) return;

    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadQrCode() {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement || !result?.slug) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `qr-${result.slug}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="brand-strip" aria-label="Resumo">
        <div className="brand-mark">
          <Link2 size={26} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">LinkQ</p>
          <h1>Encurte links e gere QR codes em segundos.</h1>
        </div>
      </section>

      <section className="workspace" aria-label="Criador de links curtos">
        <form className="shortener-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <QrCode size={22} aria-hidden="true" />
            <div>
              <h2>Novo link</h2>
              <p>Cole uma URL completa e escolha um apelido opcional.</p>
            </div>
          </div>

          <label className="field">
            <span>Link original</span>
            <div className="input-row">
              <Link2 size={19} aria-hidden="true" />
              <input
                value={form.url}
                onChange={(event) => updateField('url', event.target.value)}
                placeholder="https://exemplo.com/minha-pagina"
                type="url"
                inputMode="url"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Apelido personalizado</span>
            <div className="input-row">
              <WandSparkles size={19} aria-hidden="true" />
              <input
                value={form.customAlias}
                onChange={(event) => updateField('customAlias', event.target.value)}
                placeholder="campanha-maio"
                pattern="[a-zA-Z0-9_-]{3,48}"
                title="Use de 3 a 48 caracteres: letras, números, hífen ou underline."
              />
            </div>
          </label>

          {error ? <p className="message error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={!canSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="spin" size={18} aria-hidden="true" />
                Gerando...
              </>
            ) : (
              <>
                <QrCode size={18} aria-hidden="true" />
                Encurtar e gerar QR
              </>
            )}
          </button>
        </form>

        <aside className="result-panel" aria-live="polite">
          {result ? (
            <>
              <div className="result-header">
                <div>
                  <p className="eyebrow">Pronto</p>
                  <h2>Seu link curto está ativo</h2>
                </div>
                <span className="status-pill">
                  <Check size={16} aria-hidden="true" />
                  Criado
                </span>
              </div>

              <div className="short-url-box">
                <a href={result.shortUrl} target="_blank" rel="noreferrer">
                  {result.shortUrl}
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              </div>

              <div className="qr-frame" ref={qrRef}>
                <QRCodeSVG
                  value={result.shortUrl}
                  size={214}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="M"
                  marginSize={3}
                />
              </div>

              <div className="action-row">
                <button className="secondary-button" type="button" onClick={copyShortUrl}>
                  {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <button className="secondary-button" type="button" onClick={downloadQrCode}>
                  <Download size={17} aria-hidden="true" />
                  Baixar SVG
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="qr-placeholder" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <h2>O QR code aparecerá aqui</h2>
              <p>Depois do envio, o link encurtado e o QR ficam disponíveis para copiar ou baixar.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;
