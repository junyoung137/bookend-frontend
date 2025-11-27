// app/api/ace/correct/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      text,
      feature = "Paraphrase",
      tone = "normal",
      genre = "informative",
      complexity = "simple",
      recommendationScore = 0,
    } = body;

    console.log("🚀 백엔드 교정 요청:", { userId, feature });

    // ✅ fetch 문법 수정 (백틱 사용)
    const response = await fetch(`${BACKEND_URL}/api/feedback/correct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        text,
        feature,
        tone,
        genre,
        complexity,
        recommendation_score: recommendationScore,
      }),
      signal: AbortSignal.timeout(90000), // ✅ 90초 타임아웃
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ ACE /feedback/correct 에러:", {
        status: response.status,
        error: errorData,
      });

      return NextResponse.json(
        { 
          error: "ACE 교정 API 호출 실패", 
          detail: errorData,
          shouldFallback: true, // ✅ 프론트엔드 폴백 지시
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    // ✅ method 체크: backend_skip이면 프론트엔드 처리 지시
    if (data.method === "backend_skip") {
      console.log("📝 피드백 없음 → 프론트엔드 HuggingFace 처리");
      return NextResponse.json({
        success: true,
        shouldUseFrontend: true, // ✅ 프론트엔드 플래그
        data,
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("❌ /api/ace/correct 라우트 에러:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "알 수 없는 오류",
        shouldFallback: true, // ✅ 에러 시 폴백
      },
      { status: 500 }
    );
  }
}
