// app/api/feedback/submit/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * 프론트 → Next API → FastAPI /api/feedback/submit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 프론트에서 보낸 값들 (아래에서 다시 쓸 예정)
    const {
      userId,
      originalText,
      correctedText,
      feature,
      tone,
      genre,
      complexity,
      recommendationScore,
    } = body;

    if (!userId || !originalText || !correctedText || !feature) {
      return NextResponse.json(
        { error: "필수 값이 부족합니다." },
        { status: 400 }
      );
    }

    const payload = {
      user_id: userId,
      original: originalText,
      corrected_text: correctedText,
      selected_feature: feature, // 예: "Paraphrase" / "ToneAdjust" / "Expand"
      feedback: body.feedback ?? "unknown", // "positive"/"negative" 혹은 "만족"/"불만족" 등
      context: {
        tone: tone ?? "normal",
        genre: genre ?? "informative",
        complexity: complexity ?? "simple",
        recommendation_score: recommendationScore ?? 0,
      },
      timestamp: new Date().toISOString(),
    };

    const resp = await fetch(`${BACKEND_BASE_URL}/api/feedback/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error("❌ Backend feedback error:", resp.status, data);
      return NextResponse.json(
        {
          error:
            data.detail ||
            data.error ||
            `Backend error ${resp.status}: ${resp.statusText}`,
        },
        { status: resp.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ Feedback route error:", error);
    return NextResponse.json(
      { error: error.message || "알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}