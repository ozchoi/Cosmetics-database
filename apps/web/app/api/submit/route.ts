import { NextResponse, type NextRequest } from "next/server";
import { assertRateLimit } from "../../../lib/rate-limit";
import { contributionSchema } from "../../../lib/schemas";
import { createSubmission } from "../../../lib/submission-store";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request.headers.get("x-forwarded-for") ?? "local", 20, 60_000);
    const json = await request.json();
    const parsed = contributionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "提交資料格式不正確。" },
        { status: 400 },
      );
    }

    if (parsed.data.contributionMode !== "instant_only" && !parsed.data.consentConfirmed) {
      return NextResponse.json({ error: "請先確認提交同意。" }, { status: 400 });
    }

    if (parsed.data.contributionMode === "instant_only") {
      return NextResponse.json({ error: "即時分析模式不會建立待審核提交。" }, { status: 400 });
    }

    const submission = await createSubmission(parsed.data);
    return NextResponse.json({ id: submission.id, status: submission.status }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "提交失敗。" },
      { status: 429 },
    );
  }
}
