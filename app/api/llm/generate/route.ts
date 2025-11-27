/**
 * HuggingFace API Route (디버깅 강화)
 * - 상세한 로깅
 * - 환경변수 검증
 * - 타임아웃 최적화
 */
import { NextRequest, NextResponse } from "next/server";

interface GenerateRequest {
  prompt: string;
  parameters?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    console.log(`\n[${requestId}] ========== HuggingFace API 요청 시작 ==========`);

    // ✅ 요청 파싱
    const body: GenerateRequest = await request.json();
    const { prompt, parameters } = body;

    console.log(`[${requestId}] ✅ 요청 파싱 완료`);
    console.log(`[${requestId}] 프롬프트 길이: ${prompt.length}자`);

    // ✅ API 키 검증 (critical)
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error(`[${requestId}] ❌ CRITICAL: HUGGINGFACE_API_KEY 미설정`);
      return NextResponse.json(
        { error: "❌ HuggingFace API 키가 설정되지 않았습니다", retryable: false },
        { status: 500 }
      );
    }

    console.log(`[${requestId}] ✅ API 키 검증 완료 (길이: ${apiKey.length})`);

    // ✅ 모델 확인
    const model = process.env.NEXT_PUBLIC_LLM_MODEL || "Qwen/Qwen2.5-7B-Instruct";
    console.log(`[${requestId}] 모델: ${model}`);

    // ✅ 타임아웃 설정 (최대 30초)
    const timeout = 30000;
    console.log(`[${requestId}] 타임아웃: ${timeout}ms`);

    // ✅ HuggingFace API 호출
    console.log(`[${requestId}] 🚀 HuggingFace 호출 중...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: parameters?.temperature ?? 0.7,
        top_p: parameters?.top_p ?? 0.9,
        max_tokens: parameters?.max_tokens ?? 1024,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    console.log(`[${requestId}] ✅ 응답 받음 (${elapsed}ms) - 상태: ${response.status}`);

    // ❌ 에러 처리
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[${requestId}] ❌ HuggingFace 에러:`, {
        status: response.status,
        error: errorData,
      });

      // 503: 모델 로딩 중
      if (response.status === 503) {
        console.warn(`[${requestId}] ⏳ 모델 로딩 중 (재시도 가능)`);
        return NextResponse.json(
          {
            error: "모델이 로딩 중입니다. 20초 후 다시 시도해주세요.",
            retryable: true,
          },
          { status: 503 }
        );
      }

      // 401: 인증 실패
      if (response.status === 401 || response.status === 403) {
        console.error(`[${requestId}] 🔒 인증 실패`);
        return NextResponse.json(
          {
            error: "API 키 인증 실패. HuggingFace 토큰을 확인하세요.",
            retryable: false,
          },
          { status: 401 }
        );
      }

      // 404: 모델 없음
      if (response.status === 404) {
        console.error(`[${requestId}] 🚫 모델을 찾을 수 없음`);
        return NextResponse.json(
          {
            error: `모델 '${model}'에 접근할 수 없습니다.`,
            retryable: false,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `API 오류 ${response.status}`, retryable: true },
        { status: response.status }
      );
    }

    // ✅ 응답 파싱
    const data = await response.json();
    console.log(`[${requestId}] ✅ 응답 JSON 파싱 완료`);

    let generatedText = "";
    if (data.choices?.[0]?.message?.content) {
      generatedText = data.choices[0].message.content;
      console.log(`[${requestId}] ✅ 텍스트 추출 성공 (길이: ${generatedText.length})`);
    } else if (data.generated_text) {
      generatedText = data.generated_text;
    } else {
      console.warn(`[${requestId}] ⚠️ 예상치 못한 응답 형식:`, Object.keys(data));
      generatedText = JSON.stringify(data);
    }

    if (!generatedText.trim()) {
      console.error(`[${requestId}] ❌ 빈 응답`);
      return NextResponse.json(
        { error: "API에서 빈 응답을 반환했습니다", retryable: true },
        { status: 502 }
      );
    }

    console.log(`[${requestId}] ✅ 최종 성공! (${elapsed}ms)`);
    console.log(`[${requestId}] ========== 요청 완료 ==========\n`);

    return NextResponse.json({
      success: true,
      data: {
        generated_text: generatedText,
      },
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[${requestId}] ❌ 예외 발생 (${elapsed}ms):`, {
      name: error.name,
      message: error.message,
      code: error.code,
    });

    // Timeout
    if (error.name === "AbortError") {
      console.error(`[${requestId}] ⏱️ 타임아웃 초과`);
      return NextResponse.json(
        { error: "요청 시간 초과. 다시 시도해주세요.", retryable: true },
        { status: 504 }
      );
    }

    // 네트워크 오류
    if (error.message?.includes("fetch")) {
      console.error(`[${requestId}] 🌐 네트워크 오류`);
      return NextResponse.json(
        { error: "네트워크 연결 오류", retryable: true },
        { status: 502 }
      );
    }

    console.log(`[${requestId}] ========== 요청 실패 ==========\n`);

    return NextResponse.json(
      { error: error.message || "알 수 없는 오류", retryable: true },
      { status: 500 }
    );
  }
}
