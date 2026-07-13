import type { ImageLike } from "tesseract.js";

export interface OcrImageInput {
  data: Blob | ArrayBuffer | Uint8Array | string;
  mimeType?: string;
  languageCodes: string[];
}

export interface OcrSegment {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  sequenceNumber: number;
}

export interface OcrResult {
  provider: string;
  providerVersion: string;
  rawText: string;
  averageConfidence: number;
  languageCodes: string[];
  segments: OcrSegment[];
  processingMetadata: Record<string, unknown>;
}

export interface OcrProvider {
  readonly id: string;
  readonly version: string;
  recognize(input: OcrImageInput): Promise<OcrResult>;
}

export const cleanOcrIngredientText = (value: string): string =>
  value
    .normalize("NFKC")
    .replace(/([A-Za-z])-\s*\n\s*([A-Za-z])/gu, "$1$2")
    .replace(/[|]/gu, "I")
    .replace(/\r\n?/gu, "\n")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

export class DeterministicOcrProvider implements OcrProvider {
  readonly id = "deterministic-test";
  readonly version = "0.1.0";

  constructor(private readonly text = "Ingredients: Aqua, Glycerin, Niacinamide, Phenoxyethanol") {}

  async recognize(input: OcrImageInput): Promise<OcrResult> {
    const rawText = cleanOcrIngredientText(this.text);
    const lines = rawText.split(/\n/gu).filter(Boolean);
    return {
      provider: this.id,
      providerVersion: this.version,
      rawText,
      averageConfidence: 0.98,
      languageCodes: input.languageCodes,
      segments: lines.map((line, index) => ({
        text: line,
        confidence: 0.98,
        sequenceNumber: index + 1,
      })),
      processingMetadata: {
        deterministic: true,
      },
    };
  }
}

export class BrowserTesseractOcrProvider implements OcrProvider {
  readonly id = "tesseract-browser";
  readonly version = "7.0.0";

  async recognize(input: OcrImageInput): Promise<OcrResult> {
    const { createWorker } = await import("tesseract.js");
    const languages = input.languageCodes.length > 0 ? input.languageCodes.join("+") : "eng";
    const worker = await createWorker(languages);
    const image = toImageLike(input.data);

    try {
      const result = await worker.recognize(image.value);
      const rawText = cleanOcrIngredientText(result.data.text);
      const lines = rawText.split(/\n/gu).filter(Boolean);

      return {
        provider: this.id,
        providerVersion: this.version,
        rawText,
        averageConfidence: Math.max(0, Math.min(1, result.data.confidence / 100)),
        languageCodes: input.languageCodes,
        segments: lines.map((line, index) => ({
          text: line,
          confidence: Math.max(0, Math.min(1, result.data.confidence / 100)),
          sequenceNumber: index + 1,
        })),
        processingMetadata: {
          languages,
        },
      };
    } finally {
      if (image.revokeUrl) URL.revokeObjectURL(image.revokeUrl);
      await worker.terminate();
    }
  }
}

const toImageLike = (data: OcrImageInput["data"]): { value: ImageLike; revokeUrl?: string } => {
  if (typeof data === "string") return { value: data };
  if (data instanceof Blob) {
    const url = URL.createObjectURL(data);
    return { value: url, revokeUrl: url };
  }
  const blobPart = data instanceof Uint8Array ? new Uint8Array(data).buffer : data;
  const blob = new Blob([blobPart]);
  const url = URL.createObjectURL(blob);
  return { value: url, revokeUrl: url };
};
