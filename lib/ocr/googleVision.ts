import type { protos } from "@google-cloud/vision";
import vision from "@google-cloud/vision";

let visionClient: InstanceType<typeof vision.ImageAnnotatorClient> | null = null;

function getVisionCredentials() {
  const raw = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS_JSON?.trim();

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    throw new Error("GOOGLE_CLOUD_VISION_CREDENTIALS_JSON is not valid JSON.");
  }
}

function getVisionClient() {
  if (visionClient) {
    return visionClient;
  }

  const credentials = getVisionCredentials();
  visionClient = credentials
    ? new vision.ImageAnnotatorClient({ credentials })
    : new vision.ImageAnnotatorClient();

  return visionClient;
}

export async function extractDocumentTextFromImage(imageBuffer: Buffer) {
  const client = getVisionClient();
  const [result] = await client.documentTextDetection({
    image: {
      content: imageBuffer,
    },
  });

  return result as protos.google.cloud.vision.v1.IAnnotateImageResponse;
}
