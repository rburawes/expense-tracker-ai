'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon, DownloadIcon, ExternalIcon, QrIcon } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { QR_MAX_URL_LENGTH } from '@/lib/cloud/share';

export function useQrCode(text: string | null) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setError(null);
    if (!text) return;
    if (text.length > QR_MAX_URL_LENGTH) {
      setError('Too much data for a QR code. Turn off “Include transactions” to get a scannable code.');
      return;
    }
    import('qrcode')
      .then((QR) => QR.toString(text, { type: 'svg', errorCorrectionLevel: 'L', margin: 1, color: { dark: '#0f172a', light: '#ffffff' } }))
      .then((s) => !cancelled && setSvg(s))
      .catch(() => !cancelled && setError('Could not generate a QR code for this link.'));
    return () => {
      cancelled = true;
    };
  }, [text]);
  return { svg, error };
}

export function CopyButton({ text, label = 'Copy link', className = 'btn btn-secondary' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for insecure contexts.
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button type="button" className={className} onClick={() => void copy()} aria-live="polite">
      {copied ? <CheckIcon size={16} className="text-emerald-600" /> : <CopyIcon size={16} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

export function ShareResult({ url, filenameBase }: { url: string; filenameBase: string }) {
  const { svg, error } = useQrCode(url);

  function downloadQr() {
    if (!svg) return;
    const href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = href;
    a.download = `${filenameBase}-qr.svg`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
      <div className="min-w-0 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Share link</p>
          <p className="break-all font-mono text-xs leading-relaxed text-slate-700 line-clamp-3" title={url}>
            {url}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={url} className="btn btn-primary" />
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <ExternalIcon size={16} />
            Open
          </a>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void navigator.share({ title: 'Spendwise report', url }).catch(() => {})}
            >
              Share…
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5">
          {svg ? (
            <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label="QR code for the share link" />
          ) : error ? (
            <p className="p-2 text-center text-[11px] leading-snug text-slate-500">
              <QrIcon size={20} className="mx-auto mb-1 text-slate-300" />
              {error}
            </p>
          ) : (
            <Spinner className="h-5 w-5 text-slate-300" />
          )}
        </div>
        {svg && (
          <button type="button" onClick={downloadQr} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
            <DownloadIcon size={14} />
            Save QR
          </button>
        )}
      </div>
    </div>
  );
}
