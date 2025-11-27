import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, parameters } = body;

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "❌ HuggingFace API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 한국어 톤 변환에 적합한 모델
    const model =
      process.env.NEXT_PUBLIC_LLM_MODEL ||
      "meta-llama/Llama-3.2-3B-Instruct";

    // ✅ HuggingFace 공식 Router API (2025년 11월 최신)
    const url = "https://router.huggingface.co/v1/chat/completions";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    console.log("🚀 HuggingFace API 요청:", { 
      url, 
      model, 
      promptLength: prompt.length 
    });

    const response = await fetch(url, {
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
        max_tokens: parameters?.max_tokens ?? 512,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ HuggingFace API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // 503 에러는 모델 로딩 중
      if (response.status === 503) {
        return NextResponse.json(
          {
            error: "모델이 로딩 중입니다. 20초 후 다시 시도해주세요.",
            retryable: true,
          },
          { status: 503 }
        );
      }

      // 404 에러는 모델 접근 권한 문제
      if (response.status === 404) {
        return NextResponse.json(
          {
            error: "모델에 접근할 수 없습니다. HuggingFace에서 모델 라이센스를 승인해주세요.",
            model: model,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `API Error ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ HuggingFace API 응답 성공:", data);

    // OpenAI 호환 응답 형식 파싱
    let generatedText = "";
    if (data.choices && data.choices.length > 0) {
      generatedText = data.choices[0].message?.content || "";
    } else if (data.generated_text) {
      generatedText = data.generated_text;
    } else {
      generatedText = JSON.stringify(data);
    }

    return NextResponse.json({
      success: true,
      data: {
        generated_text: generatedText,
      },
    });
  } catch (error: any) {
    console.error("❌ API Route Error:", error);

    // Timeout 에러
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "요청 시간이 초과되었습니다. 다시 시도해주세요." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error.message || "알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}