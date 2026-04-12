// Export utilities for Content Factory

import { toPng } from "html-to-image";

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
 * Render an HTML element to a PNG Blob using html-to-image
 * Fixed dimensions for consistent export quality
 */
export async function renderNodeToBlob(
  node: HTMLElement,
  backgroundColor = "#0B0F19"
): Promise<Blob> {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor,
    style: {
      transform: "none",
      width: `${node.scrollWidth}px`,
      height: `${node.scrollHeight}px`,
    },
  });

  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * Render node to PNG with fixed width for one-pager export
 * Fixed to avoid blank exports by properly cloning and waiting for rendering
 */
export async function renderOnePagerToBlob(
  node: HTMLElement,
  width = 1080
): Promise<Blob> {
  // Wait for fonts to load
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Wait for next frame to ensure DOM is stable
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  // Clone the node deeply
  const clone = node.cloneNode(true) as HTMLElement;

  // Remove constraints that commonly cause blank captures
  clone.style.transform = "none";
  clone.style.filter = "none";
  clone.style.position = "static";
  clone.style.width = `${width}px`;
  clone.style.maxWidth = "none";
  clone.style.minWidth = `${width}px`;
  clone.style.maxHeight = "none";
  clone.style.height = "auto";
  clone.style.overflow = "visible";

  // Create a fixed-size container for export (offscreen but rendered)
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${width}px`;
  container.style.backgroundColor = "#0B0F19";
  container.style.zIndex = "-9999";
  container.style.visibility = "visible";
  container.style.opacity = "1";
  container.style.pointerEvents = "none";
  container.appendChild(clone);
  document.body.appendChild(container);

  // Allow layout to settle
  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    const rect = clone.getBoundingClientRect();
    const height = Math.ceil(rect.height);

    if (!Number.isFinite(height) || height < 80) {
      throw new Error(`Export node height too small (${height}px)`);
    }

    const dataUrl = await toPng(clone, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0B0F19",
      width,
      height,
      skipFonts: false,
      style: {
        transform: "none",
        filter: "none",
        opacity: "1",
        visibility: "visible",
        width: `${width}px`,
        height: `${height}px`,
      },
    });

    if (!dataUrl || dataUrl === "data:," || dataUrl.length < 50) {
      throw new Error("Export produced empty image");
    }

    const res = await fetch(dataUrl);
    return res.blob();
  } finally {
    document.body.removeChild(container);
  }
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
