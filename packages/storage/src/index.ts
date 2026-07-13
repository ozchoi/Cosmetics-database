import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";

export interface ImageValidationResult {
  ok: boolean;
  mimeType?: SupportedImageMime;
  error?: string;
}

export interface StoredObject {
  provider: string;
  key: string;
  sha256: string;
  byteSize: number;
  mimeType: SupportedImageMime;
  exifRemoved: boolean;
}

export interface ImageStorageProvider {
  readonly id: string;
  putProcessedImage(input: {
    bytes: Uint8Array;
    mimeType: SupportedImageMime;
    consentToStore: boolean;
  }): Promise<StoredObject>;
}

export const sniffImageMime = (bytes: Uint8Array): ImageValidationResult => {
  if (bytes.length < 12) {
    return { ok: false, error: "檔案太短，未能確認圖片格式。" };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ok: true, mimeType: "image/jpeg" };
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { ok: true, mimeType: "image/png" };
  }

  const header = new TextDecoder("ascii").decode(bytes.slice(0, 12));
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") {
    return { ok: true, mimeType: "image/webp" };
  }

  return { ok: false, error: "只支援 JPEG、PNG 或 WebP 圖片。" };
};

export const sha256Hex = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

export const createObjectKey = (mimeType: SupportedImageMime): string => {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
  return `processed-labels/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
};

export class LocalDiskImageStorageProvider implements ImageStorageProvider {
  readonly id = "local-disk";

  constructor(private readonly rootDirectory: string) {}

  async putProcessedImage(input: {
    bytes: Uint8Array;
    mimeType: SupportedImageMime;
    consentToStore: boolean;
  }): Promise<StoredObject> {
    if (!input.consentToStore) {
      throw new Error("Image storage consent is required before persisting processed images.");
    }

    const sniffed = sniffImageMime(input.bytes);
    if (!sniffed.ok || sniffed.mimeType !== input.mimeType) {
      throw new Error(sniffed.error ?? "Image MIME validation failed.");
    }

    const key = createObjectKey(input.mimeType);
    const path = join(this.rootDirectory, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.bytes);

    return {
      provider: this.id,
      key,
      sha256: sha256Hex(input.bytes),
      byteSize: input.bytes.byteLength,
      mimeType: input.mimeType,
      exifRemoved: true,
    };
  }
}
