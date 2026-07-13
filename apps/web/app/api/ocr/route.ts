import { NextResponse, type NextRequest } from "next/server";
import { DeterministicOcrProvider } from "@cosmetic-lens/ocr";
import { assertRateLimit } from "../../../lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(`ocr:${request.headers.get("x-forwarded-for") ?? "local"}`, 10, 60_000);
    const provider = new DeterministicOcrProvider();
    const result = await provider.recognize({ data: new Uint8Array(), languageCodes: ["eng"] });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OCR 失敗。" },
      { status: 429 },
    );
  }
}
