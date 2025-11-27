/**
 * Spellcheck API Route
 * LLM 기반 맞춤법 검사 엔드포인트
 */

import { NextRequest, NextResponse } from "next/server";
import { spellCheckService } from "@/lib/spellcheck/spellcheck-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    // 입력 검증
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "텍스트를 입력해주세요" },
        { status: 400 }
      );
    }

    if (text.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "최소 5자 이상 입력해주세요" },
        { status: 400 }
      );
    }

    if (text.length > 300) {
      return NextResponse.json(
        { success: false, error: "300자 이하로 입력해주세요" },
        { status: 400 }
      );
    }

    // 맞춤법 검사 실행
    console.log(
      "🔍 [API] Spellcheck request:",
      text.substring(0, 50) + "..."
    );

    const result = await spellCheckService.check(text);

    console.log(
      `✅ [API] Spellcheck complete: ${result.errors.length} errors found`
    );

    return NextResponse.json({
      success: true,
      data: {
        hasErrors: result.hasErrors,
        correctedText: result.correctedText,
        errors: result.errors,
      },
    });
  } catch (error: any) {
    console.error("❌ [API] Spellcheck error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "맞춤법 검사 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}