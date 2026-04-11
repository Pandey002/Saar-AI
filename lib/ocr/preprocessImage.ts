import sharp from "sharp";

export async function preprocessNotesImage(imageBuffer: Buffer) {
  return sharp(imageBuffer)
    .rotate()
    .trim({ threshold: 12 })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.1 })
    .png()
    .toBuffer();
}
