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
  
  // Reset any transforms or problematic styles on the clone
  clone.style.transform = "none";
  clone.style.position = "static";
  clone.style.width = `${width}px`;
  clone.style.maxWidth = "none";
  clone.style.minWidth = `${width}px`;
  clone.style.overflow = "visible";
  
  // Create a fixed-size container for export (offscreen but visible)
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${width}px`;
  container.style.backgroundColor = "#0B0F19";
  container.style.zIndex = "-9999";
  container.style.visibility = "visible";
  container.style.opacity = "1";
  container.appendChild(clone);
  document.body.appendChild(container);

  // Small delay to ensure clone is rendered
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    const dataUrl = await toPng(container, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0B0F19",
      width,
      skipFonts: false,
      style: {
        transform: "none",
        opacity: "1",
        visibility: "visible",
      },
    });

    if (!dataUrl || dataUrl === "data:,") {
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
