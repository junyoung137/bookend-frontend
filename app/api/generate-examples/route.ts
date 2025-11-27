import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🚀 [API] /api/generate-examples 호출됨');
  
  try {
    const body = await request.json();
    const { originalText } = body;
    
    console.log('📝 [API] 받은 요청:', { 
      textLength: originalText?.length
    });

    if (!originalText) {
      console.error('❌ [API] 텍스트 없음');
      return NextResponse.json(
        { error: '원본 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error('❌ [API] HUGGINGFACE_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 환경변수에서 모델 선택 (프로바이더 지정 없이 자동 라우팅)
    const model = process.env.NEXT_PUBLIC_EXAMPLE_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
    const timeout = parseInt(process.env.NEXT_PUBLIC_EXAMPLE_TIMEOUT || '45000');

    console.log('🤖 [API] HuggingFace API 호출 시작:', { model, timeout });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // 한국어에 최적화된 프롬프트
      const systemPrompt = `You are a helpful assistant that generates concrete, practical examples in Korean to support given text. Each example should:
- Start with "예를 들어"
- Include specific numbers, situations, or data
- Be easy to understand in real-life context
- Be exactly one complete sentence`;

      const userPrompt = `다음 텍스트를 뒷받침할 수 있는 구체적이고 실용적인 예시를 2-3개 생성해주세요:

${originalText}

각 예시는 "예를 들어"로 시작하고, 한 문장으로 완성해주세요.`;

      // ✅ HuggingFace OpenAI-compatible API 사용
      const apiUrl = 'https://router.huggingface.co/v1/chat/completions';
      
      console.log('📡 [API] 요청 URL:', apiUrl);
      console.log('📡 [API] 사용 모델:', model);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 400,
          temperature: 0.8,
          top_p: 0.92,
          stream: false
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 [API] HuggingFace 응답 상태:', response.status);
      console.log('📡 [API] 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API] HuggingFace 에러:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        // 404 에러 - 모델/프로바이더 조합 문제
        if (response.status === 404) {
          console.error('❌ [API] 404 에러: 모델을 찾을 수 없음');
          console.log('💡 [API] 현재 모델:', model);
          console.log('💡 [API] 추천 모델: deepseek-ai/DeepSeek-R1, Qwen/Qwen2.5-7B-Instruct');
          
          return NextResponse.json({
            success: true,
            examples: generateSmartFallback(originalText),
            fallback: true,
            debug: {
              reason: 'model_not_found',
              status: 404,
              message: `모델 '${model}'을 사용할 수 없습니다.`,
              suggestion: '추천 모델: deepseek-ai/DeepSeek-R1, Qwen/Qwen2.5-7B-Instruct, meta-llama/Llama-3.3-70B-Instruct'
            }
          });
        }
        
        // 400 에러 - 잘못된 요청 (모델/프로바이더 불일치)
        if (response.status === 400) {
          console.error('❌ [API] 400 에러: 잘못된 요청');
          console.log('💡 [API] 프로바이더를 지정하지 말고 자동 라우팅을 사용하세요');
          
          let errorDetail = '';
          try {
            const errorData = JSON.parse(errorText);
            errorDetail = errorData.error?.message || errorText;
          } catch (e) {
            errorDetail = errorText;
          }
          
          return NextResponse.json({
            success: true,
            examples: generateSmartFallback(originalText),
            fallback: true,
            debug: {
              reason: 'bad_request',
              status: 400,
              message: '잘못된 요청입니다. 모델명을 확인하세요.',
              errorDetail: errorDetail.substring(0, 200),
              suggestion: 'model:provider 형식 대신 model만 사용하세요 (예: deepseek-ai/DeepSeek-R1)'
            }
          });
        }
        
        // 401 에러 - 인증 문제
        if (response.status === 401) {
          console.error('❌ [API] 401 에러: API 키 인증 실패');
          
          return NextResponse.json({
            success: true,
            examples: generateSmartFallback(originalText),
            fallback: true,
            debug: {
              reason: 'authentication_failed',
              status: 401,
              message: 'API 키가 유효하지 않습니다.',
              suggestion: 'HUGGINGFACE_API_KEY를 확인하세요.'
            }
          });
        }
        
        // 503 에러 - 서비스 이용 불가
        if (response.status === 503) {
          console.log('⏳ [API] 서비스 일시적으로 이용 불가');
          
          return NextResponse.json({
            success: true,
            examples: generateSmartFallback(originalText),
            fallback: true,
            debug: {
              reason: 'service_unavailable',
              status: 503,
              message: '서비스가 일시적으로 이용 불가능합니다.',
              estimatedTime: '잠시 후 다시 시도해주세요.'
            }
          });
        }

        // 기타 에러
        console.log('⚠️ [API] 기본 예시로 대체');
        return NextResponse.json({
          success: true,
          examples: generateSmartFallback(originalText),
          fallback: true,
          debug: {
            reason: 'api_request_failed',
            status: response.status,
            errorPreview: errorText.substring(0, 200)
          }
        });
      }

      const result = await response.json();
      console.log('✅ [API] 응답 받음:', JSON.stringify(result, null, 2));

      // OpenAI 형식 응답 파싱
      let generatedText = '';
      
      if (result.choices && result.choices.length > 0) {
        generatedText = result.choices[0].message?.content || '';
        console.log('📝 [API] OpenAI 형식 응답:', generatedText.substring(0, 100));
      } else {
        console.warn('⚠️ [API] 예상치 못한 응답 형식:', Object.keys(result));
      }

      // 텍스트에서 예시 추출
      if (!generatedText || generatedText.trim().length === 0) {
        console.warn('⚠️ [API] 생성된 텍스트가 비어있음');
        return NextResponse.json({
          success: true,
          examples: generateSmartFallback(originalText),
          fallback: true,
          debug: { reason: 'empty_generated_text', result }
        });
      }

      console.log('🔍 [API] 전체 생성 텍스트:', generatedText);

      const lines = generatedText
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => {
          const startsWithExample = line.startsWith('예를 들어') || line.startsWith('예를들면');
          const hasMinLength = line.length > 15;
          return startsWithExample && hasMinLength;
        })
        .slice(0, 3);

      console.log('✅ [API] 추출된 예시:', lines);

      if (lines.length > 0) {
        return NextResponse.json({
          success: true,
          examples: lines,
          debug: { source: 'ai_generated', model }
        });
      }

      // 예시 패턴이 없으면 기본 예시 반환
      console.log('⚠️ [API] 적절한 예시 없음, 기본값 반환');
      console.log('🔍 [DEBUG] 원본 응답 확인:', generatedText.substring(0, 200));
      
      return NextResponse.json({
        success: true,
        examples: generateSmartFallback(originalText),
        fallback: true,
        debug: { 
          reason: 'no_example_pattern_found',
          generatedLength: generatedText.length,
          generatedPreview: generatedText.substring(0, 150)
        }
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ [API] 요청 타임아웃');
      }
      
      console.error('❌ [API] Fetch 에러:', fetchError);
      
      // 에러 시에도 기본 예시 반환
      return NextResponse.json({
        success: true,
        examples: generateSmartFallback(originalText),
        fallback: true,
        debug: {
          reason: 'fetch_error',
          error: fetchError.message,
          errorName: fetchError.name
        }
      });
    }

  } catch (error: any) {
    console.error('❌ [API] 전체 에러:', error);
    
    // 최종 fallback
    return NextResponse.json({
      success: true,
      examples: generateSmartFallback(),
      fallback: true,
      debug: {
        reason: 'unexpected_error',
        error: error.message,
        stack: error.stack?.substring(0, 200)
      }
    });
  }
}

/**
 * 문맥을 고려한 스마트 기본 예시 생성
 */
function generateSmartFallback(originalText?: string): string[] {
  if (!originalText) {
    return [
      '예를 들어 구체적인 사례를 들면 독자의 이해를 도울 수 있습니다.',
      '예를 들어 실생활의 경험을 추가하면 설득력이 높아집니다.',
    ];
  }

  // 텍스트 분석하여 맞춤형 기본 예시 생성
  const hasNumbers = /\d+/.test(originalText);
  const hasData = /데이터|통계|수치|비율|퍼센트|조사/.test(originalText);
  const hasProcess = /과정|방법|절차|단계|시스템/.test(originalText);
  const hasBenefit = /효과|이점|장점|도움|개선/.test(originalText);
  const hasTech = /기술|시스템|플랫폼|서비스|도구/.test(originalText);
  const hasUser = /사용자|고객|이용자/.test(originalText);

  const examples: string[] = [];

  if (hasData || hasNumbers) {
    examples.push('예를 들어 2023년 연구 결과에 따르면 관련 지표가 평균 42% 향상되었습니다.');
  }

  if (hasProcess) {
    examples.push('예를 들어 매일 15분씩 꾸준히 실천하면 한 달 안에 눈에 띄는 변화를 경험할 수 있습니다.');
  }

  if (hasBenefit) {
    examples.push('예를 들어 실제 적용 사례에서는 6개월 만에 생산성이 35% 이상 증가했습니다.');
  }

  if (hasTech && hasUser) {
    examples.push('예를 들어 A 기업은 이 방식을 도입한 후 사용자 만족도가 28% 상승했습니다.');
  }

  // 최소 2개 보장
  if (examples.length < 2) {
    examples.push('예를 들어 실제 현장에서 이 방법을 적용하면 즉각적인 개선 효과를 볼 수 있습니다.');
    examples.push('예를 들어 전문가들은 이러한 접근이 장기적으로 더 효과적이라고 평가합니다.');
  }

  return examples.slice(0, 3);
}

export async function GET() {
  return NextResponse.json({ 
    message: '예시 생성 API가 정상 작동 중입니다.',
    endpoint: '/api/generate-examples',
    method: 'POST',
    apiType: 'OpenAI-compatible HuggingFace Router API',
    model: process.env.NEXT_PUBLIC_EXAMPLE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct:together'
  });
}