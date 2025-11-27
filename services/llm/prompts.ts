/**
 * LLM Prompt Templates
 * 데이터 분석 기반 최적화된 프롬프트
 */

import { ToneType, GenreType } from '@/types/analysis.types';

// ============================================================
// Prompt Template Interface
// ============================================================

export interface PromptTemplate {
  system: string;
  user: string;
  constraints: string[];
  examples?: Array<{ input: string; output: string }>;
}

// ============================================================
// Tone-specific Instructions (데이터 기반)
// ============================================================

const TONE_INSTRUCTIONS: Record<ToneType, string> = {
  normal: `
    일상적이고 자연스러운 표현을 사용하세요.
    - 친근하면서도 격식을 갖춘 중립적 톤
    - "~이다", "~한다" 등의 서술형 종결어미
    - 사용자의 69.3%가 선호하는 기본 톤입니다.
  `,
  
  formal: `
    격식있고 전문적인 표현을 사용하세요.
    - "~입니다", "~습니다" 등의 격식체
    - 정중하고 신중한 어투
    - 비즈니스 또는 공식 문서에 적합
    - 사용자의 19.6%가 선호합니다.
  `,
  
  terminal_word: `
    핵심 단어를 강조하는 간결한 표현을 사용하세요.
    - 명사형 종결 ("~임", "~것")
    - 간결하고 힘있는 문장
    - 6.5%의 사용자가 특정 상황에서 선호합니다.
  `,
  
  common: `
    일반적이고 쉬운 표현을 사용하세요.
    - 누구나 이해하기 쉬운 평이한 어휘
    - 짧고 단순한 문장 구조
    - 4.7%의 사용자가 선호합니다.
  `,
};

// ============================================================
// Genre-specific Instructions
// ============================================================

const GENRE_INSTRUCTIONS: Record<GenreType, string> = {
  narrative: `
    서사적 흐름을 유지하며 이야기를 전개하세요.
    - 시간 순서에 따른 전개
    - 인물, 사건, 배경의 조화
    - 감정선과 긴장감 유지
  `,
  
  descriptive: `
    생생한 묘사로 장면을 그려내세요.
    - 오감을 활용한 구체적 표현
    - 분위기와 정서 전달
    - 공간적 배치와 시각적 디테일
  `,
  
  informative: `
    정보를 명확하고 논리적으로 전달하세요.
    - 사실 중심의 객관적 서술
    - 논리적 구조 (원인-결과, 분류, 비교)
    - 정확한 용어 사용
  `,
  
  dialogue: `
    자연스러운 대화체로 작성하세요.
    - 말하는 사람의 특성 반영
    - 대화의 흐름과 호흡
    - 행동과 감정 묘사 병행
  `,
};

// ============================================================
// Paraphrase Prompts (다듬기)
// ============================================================

export function getParaphrasePrompt(
  text: string,
  tone: ToneType = 'normal',
  genre: GenreType = 'informative'
): PromptTemplate {
  return {
    system: `당신은 한국어 텍스트를 자연스럽게 다듬는 전문 편집자입니다.
    
**목표**: 원문의 의미를 정확히 유지하면서 더 간결하고 명료하게 개선

**원칙**:
1. 불필요한 수식어 제거
2. 중복 표현 정리
3. 문장 구조 최적화
4. 가독성 향상

${TONE_INSTRUCTIONS[tone]}
${GENRE_INSTRUCTIONS[genre]}`,

    user: `다음 텍스트를 다듬어주세요:

"${text}"

**요구사항**:
- 원문의 핵심 의미 100% 보존
- 30% 이상 간결화
- 자연스러운 한국어 표현
- ${tone} 톤 유지`,

    constraints: [
      '원문보다 30% 이상 짧게',
      '핵심 정보 누락 금지',
      '문법 오류 없이',
      '자연스러운 흐름 유지',
    ],

    examples: [
      {
        input: '그 당시에 우리가 생각했던 것은 아마도 그렇게 간단한 문제가 아니었을 것으로 보입니다.',
        output: '당시 우리 생각은 그리 간단하지 않았습니다.',
      },
    ],
  };
}

// ============================================================
// Tone Adjustment Prompts (톤 조절)
// ============================================================

export function getToneAdjustPrompt(
  text: string,
  fromTone: ToneType,
  toTone: ToneType,
  genre: GenreType = 'informative'
): PromptTemplate {
  const toneChange = fromTone === 'formal' 
    ? '격식체 → 친근한 표현' 
    : '친근한 표현 → 격식체';

  return {
    system: `당신은 한국어 문체 전환 전문가입니다.

**목표**: ${toneChange} 자연스럽게 변환

**핵심**:
- 의미 변화 없이 톤만 조정
- 어색하지 않은 자연스러운 전환
- 장르적 특성 유지

${TONE_INSTRUCTIONS[toTone]}
${GENRE_INSTRUCTIONS[genre]}`,

    user: `다음 텍스트의 톤을 "${fromTone}"에서 "${toTone}"으로 변경해주세요:

"${text}"

**변환 방향**: ${toneChange}
**유지사항**: 
- 내용과 뉘앙스
- 문장 수 (±1개)
- 장르적 특성`,

    constraints: [
      '목표 톤 100% 적용',
      '의미 왜곡 금지',
      '자연스러운 전환',
      `장르(${genre}) 특성 유지`,
    ],

    examples: [
      {
        input: '이 문제는 신중하게 검토해야 합니다.',
        output: '이 문제는 신중하게 검토해야 해요.',
      },
    ],
  };
}

// ============================================================
// Expand Prompts (확장)
// ============================================================

export function getExpandPrompt(
  text: string,
  tone: ToneType = 'normal',
  genre: GenreType = 'narrative'
): PromptTemplate {
  // 데이터 분석: 확장 시 장르별 전략
  const expansionStrategies: Record<GenreType, string> = {
    narrative: '시간적 흐름, 인물 심리, 사건의 디테일을 추가',
    descriptive: '오감 묘사, 공간 배치, 분위기 요소를 강화',
    informative: '논거, 예시, 데이터로 뒷받침',
    dialogue: '말투 특성, 비언어적 요소, 맥락 설명 추가',
  };

  return {
    system: `당신은 텍스트를 풍부하게 확장하는 작가입니다.

**목표**: ${expansionStrategies[genre]}

**원칙**:
1. 원문의 핵심 메시지 강화
2. 구체적이고 생생한 디테일 추가
3. 논리적 흐름 유지
4. 과도한 확장 지양 (50% 이내)

${TONE_INSTRUCTIONS[tone]}
${GENRE_INSTRUCTIONS[genre]}`,

    user: `다음 텍스트를 확장해주세요:

"${text}"

**확장 전략**: ${expansionStrategies[genre]}
**제약**:
- 원문 대비 30~50% 증가
- 구체적 디테일 3개 이상 추가
- ${tone} 톤 유지
- 장황함 지양`,

    constraints: [
      '원문 대비 30~50% 증가',
      '구체적 디테일 우선',
      '논리적 흐름 유지',
      '과잉 수식 금지',
    ],
  };
}

// ============================================================
// Compress Prompts (압축)
// ============================================================

export function getCompressPrompt(
  text: string,
  targetRatio: number = 0.5
): PromptTemplate {
  return {
    system: `당신은 핵심만 추출하는 요약 전문가입니다.

**목표**: 원문의 ${Math.round(targetRatio * 100)}%로 압축하되 핵심 정보 100% 보존

**원칙**:
1. 중요도 순서로 정보 선별
2. 불필요한 수식어 전면 제거
3. 명사형 종결로 간결화
4. 핵심 키워드 반드시 포함`,

    user: `다음 텍스트를 ${Math.round(targetRatio * 100)}%로 압축해주세요:

"${text}"

**압축 기준**:
- 핵심 메시지 우선
- 부가 설명 최소화
- 명료한 표현
- 정보 손실 최소화`,

    constraints: [
      `원문의 ${Math.round(targetRatio * 100)}% 이하`,
      '핵심 정보 100% 보존',
      '명사형 종결 우선',
      '간결하고 명료하게',
    ],
  };
}

// ============================================================
// Prompt Builder
// ============================================================

export function buildPrompt(template: PromptTemplate): string {
  let prompt = `${template.system}\n\n`;
  prompt += `${template.user}\n\n`;
  
  if (template.constraints.length > 0) {
    prompt += `**제약조건**:\n`;
    template.constraints.forEach(c => {
      prompt += `- ${c}\n`;
    });
  }
  
  if (template.examples && template.examples.length > 0) {
    prompt += `\n**예시**:\n`;
    template.examples.forEach((ex, i) => {
      prompt += `\n${i + 1}. 입력: "${ex.input}"\n`;
      prompt += `   출력: "${ex.output}"\n`;
    });
  }
  
  return prompt;
}

// ============================================================
// Prompt Validation
// ============================================================

export function validatePrompt(prompt: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!prompt || prompt.trim().length === 0) {
    errors.push('프롬프트가 비어있습니다');
  }
  
  if (prompt.length > 4000) {
    errors.push('프롬프트가 너무 깁니다 (최대 4000자)');
  }
  
  if (!prompt.includes('"')) {
    errors.push('변환할 텍스트가 포함되지 않았습니다');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}