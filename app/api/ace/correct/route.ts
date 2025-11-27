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

    try {
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
        signal: AbortSignal.timeout(10000), // ✅ 10초만 대기
      });

      if (response.ok) {
        const data = await response.json();

        // ✅ backend_skip 또는 use_frontend → 프론트엔드 처리
        if (data.method === "backend_skip" || data.use_frontend) {
          console.log("📝 백엔드 스킵 → 프론트엔드 HuggingFace 처리");
          return NextResponse.json({
            success: true,
            shouldUseFrontend: true,
            data,
          });
        }

        return NextResponse.json({
          success: true,
          data,
        });
      }

    } catch (backendError) {
      console.warn("⚠️ 백엔드 호출 실패, 프론트엔드 폴백:", backendError);
    }

    // ✅ 백엔드 실패 → 프론트엔드 처리
    return NextResponse.json({
      success: true,
      shouldUseFrontend: true,
      data: {
        corrected: text,
        method: "backend_failed",
        use_frontend: true,
      },
    });

  } catch (error: any) {
    console.error("❌ /api/ace/correct 라우트 에러:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "알 수 없는 오류",
        shouldUseFrontend: true,
      },
      { status: 500 }
    );
  }
}
