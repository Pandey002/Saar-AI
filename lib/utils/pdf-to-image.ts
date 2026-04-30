/**
 * Vidya PDF-to-Image Utility
 * Converts PDF pages into high-resolution images for Vision AI processing.
 * Scale is set to 2.0 to ensure OCR clarity for complex formulas and diagrams.
 */

export async function convertPdfToImages(file: File): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist');
  
  // Use a reliable worker URL from CDN
  const PDF_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs`;
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const imageUrls: string[] = [];

  // Limit to first 5 pages for speed and to avoid Vercel timeouts (10s limit on Hobby)
  const totalPages = Math.min(pdf.numPages, 5);

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 }); // Balanced for OCR accuracy and payload size
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ 
      canvasContext: context, 
      viewport,
      canvas
    }).promise;

    // Convert to optimized JPEG for smaller payload
    imageUrls.push(canvas.toDataURL('image/jpeg', 0.8));
  }

  return imageUrls;
}
