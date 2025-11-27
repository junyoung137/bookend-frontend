import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: '텍스트가 너무 짧습니다 (최소 10자)' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'API 키가 설정되지 않았습니다',
          message: '.env.local 파일에 GOOGLE_GEMINI_API_KEY를 추가해주세요',
        },
        { status: 500 }
      );
    }

    const prompt = `
당신은 사실 확인 전문가입니다. 다음 내용의 사실 관계를 확인해주세요:

"${text}"

다음 기준으로 평가해주세요:
1. 통계나 수치가 정확한가?
2. 역사적 사실이 맞는가?
3. 과학적/의학적 정보가 신뢰할 수 있는가?
4. 일반적으로 알려진 사실과 일치하는가?

반드시 다음 JSON 형식으로만 답변하세요:
{
  "isReliable": true 또는 false,
  "explanation": "150자 이내로 간단명료하게 설명",
  "sources": ["참고할 만한 웹사이트 URL 1-3개"]
}
`;

    // ⭐ 최신 무료 모델명 적용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);

      return NextResponse.json(
        {
          error: 'AI 서비스 오류',
          message: 'Google Gemini API에 문제가 있습니다. API 키 또는 모델명을 확인해주세요.',
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!responseText) {
      throw new Error('AI 응답이 비어있습니다');
    }

    let cleaned = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({
        isReliable: false,
        explanation: responseText.slice(0, 150),
        sources: [],
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      isReliable: parsed.isReliable ?? false,
      explanation: parsed.explanation ?? responseText.slice(0, 150),
      sources: parsed.sources ?? [],
    });
  } catch (error: any) {
    console.error('Fact check error:', error);

    return NextResponse.json(
      {
        error: '사실 확인 중 오류가 발생했습니다',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS 메서드 처리
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}
