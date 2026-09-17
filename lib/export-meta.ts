// Export metadata: what the night desk can say about a saved plate.
//
// Every function here is pure, or depends only on the browser APIs named in
// its own body, so the reveal screen's ledger and the keepsake front page can
// be reasoned about (and unit tested) without mounting the editor. See
// tests/export-meta.test.mjs.

// An explicit relative specifier, so this module resolves identically under
// Next, Vinext, and `node --test` (see tests/export-meta.test.mjs).
import { measureLuminance, readPress } from './press-read.ts';

// Saltline runs on night-desk time, not the reader's clock. A dispatch is
// filed a few minutes after its call came in, and the night advances with
// every plate that goes to print, so a keepsake front page never carries a
// daytime hour into "the 2:13 AM edition".
export function filedAt(callTime: string, printsBefore: number) {
  const [hours, minutes] = callTime.split(':').map(Number);
  const total = hours * 60 + minutes + 7 + printsBefore * 5;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

export function imageExtension(dataUrl: string) {
  const mimeType = /^data:image\/(png|jpeg|webp);/i.exec(dataUrl)?.[1]?.toLowerCase();
  return mimeType === 'jpeg' ? 'jpg' : mimeType ?? 'png';
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fallbackPlateCode(dataUrl: string) {
  const sample = `${dataUrl.slice(0, 4096)}${dataUrl.slice(-4096)}${dataUrl.length}`;
  let hash = 2166136261;

  for (let index = 0; index < sample.length; index += 1) {
    hash ^= sample.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export async function inspectExport(dataUrl: string, blob: Blob, baseLuminance: number) {
  let plateCode = fallbackPlateCode(dataUrl);
  let width: number | null = null;
  let height: number | null = null;

  try {
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    plateCode = Array.from(new Uint8Array(digest).slice(0, 5), (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch {
    // The deterministic fallback still gives every exact export a visible press identifier.
  }

  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blob);
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      // Dimensions are supporting metadata; the exported data URL remains the artifact.
    }
  }

  const luminance = await measureLuminance(blob);

  return { plateCode: `SL-${plateCode}`, width, height, press: readPress(width, height, luminance, baseLuminance) };
}

export function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = source;
  });
}
