// app/api/ace/correct/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 프론트에서 받을 이름들
    const {
      userId,
      text,
      feature = "Paraphrase",
      tone = "normal",
      genre = "informative",
      complexity = "simple",
      recommendationScore = 0,
    } = body;

    const response = await fetch(`${BACKEND_URL}/api/feedback/correct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // 백엔드가 기대하는 필드 이름으로 매핑
      body: JSON.stringify({
        user_id: userId,
        text,
        feature,
        tone,
        genre,
        complexity,
        recommendation_score: recommendationScore,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ ACE /feedback/correct 에러:", {
        status: response.status,
        error: errorData,
      });
      return NextResponse.json(
        { error: "ACE 교정 API 호출 실패", detail: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();

    // 백엔드 응답 그대로 넘기되, 프론트에서 쓰기 편하게 래핑
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("❌ /api/ace/correct 라우트 에러:", error);
    return NextResponse.json(
      { error: error.message || "알 수 없는 오류" },
      { status: 500 }
    );
  }
}