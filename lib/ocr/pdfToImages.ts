import { createRequire } from "node:module";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_OCR_PDF_PAGES = 6;
const PDF_RENDER_SCALE = 2;
const require = createRequire(import.meta.url);

export async function renderPdfPagesToImages(pdfBuffer: Buffer) {
  const { createCanvas } = require("@napi-rs/canvas") as typeof import("@napi-rs/canvas");
  const document = await getDocument({
    data: new Uint8Array(pdfBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const pageCount = Math.min(document.numPages, MAX_OCR_PDF_PAGES);
  const pages: Buffer[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d");

    await page.render({
      canvas: canvas as never,
      canvasContext: context as never,
      viewport,
    }).promise;

    pages.push(canvas.toBuffer("image/png"));
  }

  return pages;
}
