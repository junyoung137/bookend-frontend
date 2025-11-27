import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🚀 [API] /api/generate 호출됨');
  
  try {
    const body = await request.json();
    const { prompt, parameters = {} } = body;
    
    console.log('📝 [API] 받은 요청:', { 
      promptLength: prompt?.length, 
      parameters 
    });

    if (!prompt) {
      console.error('❌ [API] 프롬프트 없음');
      return NextResponse.json(
        { error: '프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error('❌ [API] HUGGINGFACE_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.' },
        { status: 500 }
      );
    }

    const model = process.env.NEXT_PUBLIC_LLM_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
    const timeout = parseInt(process.env.NEXT_PUBLIC_LLM_TIMEOUT || '60000');

    console.log('🤖 [API] HuggingFace API 호출 시작:', { 
      model, 
      timeout,
      apiKeyExists: !!apiKey 
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // ✅ 최신 HuggingFace Router 엔드포인트 사용
      const response = await fetch(
        `https://router.huggingface.co/hf-inference/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: parameters.max_tokens || 512,
              temperature: parameters.temperature || 0.7,
              top_p: 0.9,
              do_sample: true,
              return_full_text: false,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log('📡 [API] HuggingFace 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API] HuggingFace 에러:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // 410 에러 처리 - 모델을 사용할 수 없음
        if (response.status === 410) {
          return NextResponse.json(
            { 
              error: '이 모델은 더 이상 사용할 수 없습니다. 다른 모델을 시도해보세요.',
              suggestion: 'meta-llama/Llama-2-7b-chat-hf 또는 mistralai/Mistral-7B-Instruct-v0.2를 .env.local의 NEXT_PUBLIC_LLM_MODEL에 설정해보세요.',
              details: errorText
            },
            { status: 410 }
          );
        }
        
        if (response.status === 503) {
          return NextResponse.json(
            { 
              error: '모델이 로딩 중입니다. 20-30초 후 다시 시도해주세요.',
              modelLoading: true,
              retryAfter: 30
            },
            { status: 503 }
          );
        }

        return NextResponse.json(
          { 
            error: `HuggingFace API 오류: ${response.status}`,
            details: errorText
          },
          { status: response.status }
        );
      }

      const result = await response.json();
      console.log('✅ [API] HuggingFace 응답 받음:', {
        type: Array.isArray(result) ? 'array' : typeof result,
        length: Array.isArray(result) ? result.length : 'N/A'
      });

      let generatedText = '';
      
      if (Array.isArray(result) && result.length > 0) {
        generatedText = result[0].generated_text || '';
      } else if (result.generated_text) {
        generatedText = result.generated_text;
      } else {
        console.warn('⚠️ [API] 예상치 못한 응답 형식:', result);
        generatedText = JSON.stringify(result);
      }

      console.log('✅ [API] 성공! 생성된 텍스트 길이:', generatedText.length);

      return NextResponse.json({
        success: true,
        data: {
          generated_text: generatedText,
          model: model,
        },
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ [API] 요청 타임아웃');
        return NextResponse.json(
          { error: '요청 시간이 초과되었습니다. 다시 시도해주세요.' },
          { status: 504 }
        );
      }
      
      console.error('❌ [API] Fetch 에러:', fetchError);
      throw fetchError;
    }

  } catch (error: any) {
    console.error('❌ [API] 전체 에러:', error);
    return NextResponse.json(
      { 
        error: error.message || '알 수 없는 오류가 발생했습니다.',
        stack: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API가 정상 작동 중입니다. POST 요청을 사용하세요.',
    endpoint: '/api/generate',
    method: 'POST'
  });
}