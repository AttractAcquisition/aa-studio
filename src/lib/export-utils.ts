// Export utilities for Content Factory

import html2canvas from "html2canvas";

/**
 * Convert a data URL to a Blob
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * Convert any URL (data URL or HTTP) to a Blob
 */
export async function urlToBlob(url: string): Promise<Blob> {
  if (!url) throw new Error("Missing image URL");

  if (url.startsWith("data:")) {
    return dataUrlToBlob(url);
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  return res.blob();
}

/**
 * Download a Blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Download from a URL or data URL
 */
export async function downloadFromUrlOrDataUrl(
  url: string,
  filename: string
): Promise<void> {
  const blob = await urlToBlob(url);
  downloadBlob(blob, filename);
}

/**
 * Render an HTML element to a PNG Blob using html2canvas
 */
export async function renderNodeToBlob(
  node: HTMLElement,
  backgroundColor = "#0B0F19"
): Promise<Blob> {
  const canvas = await html2canvas(node, {
    backgroundColor,
    scale: 2,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG export failed"))),
      "image/png",
      0.95
    );
  });
}

/**
 * Open HTML content in a new browser tab
 */
export function openHtmlInNewTab(html: string): void {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
