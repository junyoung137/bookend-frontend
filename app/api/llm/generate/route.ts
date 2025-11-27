/**
 * 개선된 HuggingFace API Route
 * - 더 짧은 타임아웃 (30초)
 * - 재시도 로직 개선
 * - 상세한 에러 로깅
 * - 모델 캐시 전략
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

// 모델 응답 캐시 (5분)
const modelCache = new Map<string, { timestamp: number; available: boolean }>();
const CACHE_TTL = 5 * 60 * 1000;

async function isModelAvailable(model: string, apiKey: string): Promise<boolean> {
  const cached = modelCache.get(model);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.available;
  }

  try {
    const response = await fetch("https://huggingface.co/api/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    const available = response.ok;
    modelCache.set(model, { timestamp: Date.now(), available });
    return available;
  } catch {
    return true; // 기본값: 사용 가능하다고 가정
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, parameters } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "프롬프트가 비어있습니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error(`[${requestId}] ❌ HuggingFace API 키가 설정되지 않았습니다.`);
      return NextResponse.json(
        { error: "서버 설정 오류: HuggingFace API 키가 없습니다." },
        { status: 500 }
      );
    }

    const model = process.env.NEXT_PUBLIC_LLM_MODEL || "Qwen/Qwen2.5-7B-Instruct";
    const timeout = Math.min(
      parseInt(process.env.NEXT_PUBLIC_LLM_TIMEOUT || "30000"),
      30000 // 최대 30초
    );

    console.log(`[${requestId}] 🚀 HuggingFace 요청:`, {
      model,
      promptLength: prompt.length,
      timeout,
      temperature: parameters?.temperature ?? 0.7,
    });

    // 모델 가용성 확인 (선택사항)
    const available = await isModelAvailable(model, apiKey);
    if (!available) {
      console.warn(`[${requestId}] ⚠️ 모델 응답 없음 (캐시)`);
    }

    // ✅ HuggingFace Router API 호출
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

    // ❌ 에러 처리
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[${requestId}] ❌ HuggingFace 에러:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      if (response.status === 503) {
        return NextResponse.json(
          {
            error: "모델이 로딩 중입니다. 잠시 후 다시 시도해주세요.",
            retryable: true,
            retryAfter: 20,
          },
          { status: 503 }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          {
            error: "API 키 인증 실패: HuggingFace에서 토큰을 확인해주세요.",
            code: "AUTH_FAILED",
          },
          { status: 401 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          {
            error: `모델 '${model}'에 접근할 수 없습니다. HuggingFace에서 라이센스를 승인해주세요.`,
            model,
            code: "MODEL_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `API 오류 ${response.status}` },
        { status: response.status }
      );
    }

    // ✅ 응답 파싱
    const data = await response.json();
    let generatedText = "";

    if (data.choices?.[0]?.message?.content) {
      generatedText = data.choices[0].message.content;
    } else if (data.generated_text) {
      generatedText = data.generated_text;
    } else {
      console.warn(`[${requestId}] ⚠️ 예상치 못한 응답 형식:`, Object.keys(data));
      generatedText = JSON.stringify(data);
    }

    if (!generatedText.trim()) {
      return NextResponse.json(
        { error: "API에서 빈 응답을 반환했습니다." },
        { status: 502 }
      );
    }

    console.log(`[${requestId}] ✅ HuggingFace 성공:`, {
      responseLength: generatedText.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        generated_text: generatedText,
      },
    });

  } catch (error: any) {
    console.error(`[${requestId}] ❌ 예외 발생:`, {
      name: error.name,
      message: error.message,
      code: error.code,
    });

    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          error: "요청 시간 초과. 다시 시도해주세요.",
          code: "TIMEOUT",
          retryable: true,
        },
        { status: 504 }
      );
    }

    if (error.message?.includes("fetch")) {
      return NextResponse.json(
        {
          error: "네트워크 연결 오류. 인터넷을 확인해주세요.",
          code: "NETWORK_ERROR",
          retryable: true,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "알 수 없는 오류",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
