import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { protos } from "@google-cloud/vision";
import vision from "@google-cloud/vision";

let visionClient: InstanceType<typeof vision.ImageAnnotatorClient> | null = null;

type VisionCredentials = Record<string, string>;

function getVisionCredentials() {
  const raw = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS_JSON?.trim();
  const credentialsPath =
    process.env.GOOGLE_CLOUD_VISION_CREDENTIALS_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (raw) {
    try {
      return JSON.parse(raw) as VisionCredentials;
    } catch {
      throw new Error("GOOGLE_CLOUD_VISION_CREDENTIALS_JSON is not valid JSON.");
    }
  }

  if (!credentialsPath) {
    return undefined;
  }

  try {
    const resolvedPath = resolve(credentialsPath);
    const fileContents = readFileSync(resolvedPath, "utf8");
    return JSON.parse(fileContents) as VisionCredentials;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Google Cloud Vision credentials file is not valid JSON.");
    }

    if (error instanceof Error) {
      throw new Error(`Unable to read Google Cloud Vision credentials file: ${error.message}`);
    }

    throw new Error("Unable to read Google Cloud Vision credentials file.");
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
