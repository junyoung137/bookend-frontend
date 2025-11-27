/**
 * API Client
 * LLM API 호출을 위한 중앙화된 클라이언트
 * - Next.js API Routes를 통한 안전한 API 키 관리
 * - 재시도 로직
 * - 에러 처리
 */

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // ✅ 1. 프론트에서 전달받은 요청 본문 파싱
    const body = await req.json();

    // ✅ 2. FastAPI 서버 주소 지정 (환경변수 사용 권장)
    const API_URL =
      process.env.BACKEND_URL || "http://localhost:8000/api/v1/recommend";

    // ✅ 3. FastAPI로 요청 전송
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    // ✅ 4. FastAPI 응답 검사
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ FastAPI Error:", errorText);
      return NextResponse.json(
        { error: "FastAPI request failed", detail: errorText },
        { status: response.status }
      );
    }

    // ✅ 5. 응답 본문을 JSON으로 파싱
    const data = await response.json();

    // ✅ 6. 예상 응답 형식 검증 (예: { results: [...] } 형태)
    if (!data || typeof data !== "object") {
      console.error("❌ Invalid response structure:", data);
      return NextResponse.json(
        { error: "Invalid response format from backend" },
        { status: 500 }
      );
    }

    // ✅ 7. 정상 응답 반환
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    // ✅ 8. 에러 핸들링
    console.error("❌ APIError in /api/transform:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}