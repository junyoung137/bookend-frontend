/**
 * Spellcheck Service - 클라이언트 전용 버전
 * 서버 측에서는 규칙만, LLM은 클라이언트에서 처리
 */

import { getSpellCheckPrompt, buildSpellCheckPrompt } from "../spellcheck-prompts";

export interface SpellCheckError {
  id: string;
  original: string;
  corrected: string;
  type: "spelling" | "spacing" | "grammar";
  explanation: string;
  start: number;
  end: number;
  suggestions: string[];
  confidence?: number;
}

export interface SpellCheckResult {
  hasErrors: boolean;
  correctedText: string;
  errors: SpellCheckError[];
  confidence: number;
  processingTime: number;
}

class SpellCheckService {
  private readonly timeout = 60000;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 오타 사전
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private readonly TYPO_DICTIONARY: Record<string, string> = {
    // 시간/날짜
    "오랫만": "오랜만", "오랫만에": "오랜만에",
    "몇일": "며칠", "몇일간": "며칠간",
    "지난 번": "지난번", "지난 주": "지난주", "다음 번": "다음번",
    
    // 발음대로 적기
    "왠만": "웬만", "왠만하": "웬만하", "왠만해": "웬만해",
    "웬지": "왠지",
    "구지": "굳이",
    "금새": "금세",
    "어떻해": "어떻게", "어케": "어떻게",
    "어의없": "어이없",
    
    // 부사 어미
    "일일히": "일일이", "틈틈히": "틈틈이", "번번히": "번번이",
    "곰곰히": "곰곰이",
    
    // 외래어
    "메세지": "메시지", "메신져": "메신저",
    "컨퍼런스": "콘퍼런스", "컨텐츠": "콘텐츠",
    "스케쥴": "스케줄", "쥬스": "주스",
    "케잌": "케이크", "쵸콜릿": "초콜릿",
    "렌트카": "렌터카",
    
    // 명사 오타
    "희사": "회사", "외이": "회의",
    "뇌졸증": "뇌졸중",
    "문안": "무난", "문안한": "무난한",
    "희안": "희한", "희안한": "희한한",
    "설겆이": "설거지",
    "도데체": "도대체",
    "저녁식사": "저녁 식사", "아침식사": "아침 식사", "점심식사": "점심 식사",
    
    // 동음이의어
    "성공율": "성공률", "합격율": "합격률",
    
    // 띄어쓰기 복합어
    "할수가": "할 수가", "될수가": "될 수가",
    "할수있": "할 수 있", "할수없": "할 수 없",
    "예를들어": "예를 들어",
    
    // 관용구
    "큰 코": "큰코",
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 띄어쓰기 규칙
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private readonly SPACING_RULES = [
    // 의존명사 "것"
    { 
      pattern: /([가-힣]+)(하는|되는|한|된|할|될|는)(것)(이|을|를|은|도|에요|입니다)/g,
      replace: "$1$2 것$3",
      desc: "의존명사 '것'",
      confidence: 0.92
    },
    
    // 형용사 + "ㄴ/은" 띄어쓰기 오류
    {
      pattern: /([가-힣]+[적|스러운|로운])\s+(인|은|을|이|으로)/g,
      replace: "$1$2",
      desc: "형용사 불필요한 띄어쓰기",
      confidence: 0.95
    },
    
    // 부정 부사
    { 
      pattern: /\b(안|못)\s?(가|와|해|되|먹|자|보|듣|알)(어|아|요|었|았|는|다|습니다)/g,
      replace: "$1 $2$3",
      desc: "부정 부사",
      confidence: 0.88
    },
    
    // 단위명사
    { 
      pattern: /([0-9]+)(개|명|잔|번|시|분|초|원|살|kg|m|cm)/g,
      replace: "$1 $2",
      desc: "단위명사",
      confidence: 0.95
    },

    // 동사 + 것
    {
      pattern: /([가-힣]+)(하는|되는|보는|먹는|가는|오는|만드는|생각하는)(것)(이|을|를|은|도|에요|입니다)/g,
      replace: "$1$2 것$3",
      desc: "동사 + 의존명사 '것'",
      confidence: 0.93
    },

    // "~는 건" → "~는 것은"
    {
      pattern: /([가-힣]+)(하는|되는|한|될)(건)\b/g,
      replace: "$1$2 것은",
      desc: "축약형 '건' → '것은'",
      confidence: 0.85
    },
  ];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 형태소 패턴
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private readonly MORPHEME_PATTERNS = {
    doe: [
      { pattern: /\b안되/g, replace: "안 돼", desc: "안되→안 돼" },
      { pattern: /\b안되요/g, replace: "안 돼요", desc: "안되요→안 돼요" },
      { pattern: /\b되요/g, replace: "돼요", desc: "되요→돼요" },
      { pattern: /\b되서/g, replace: "돼서", desc: "되서→돼서" },
      { pattern: /\b됬/g, replace: "됐", desc: "됬→됐" },
    ],
    
    not: [
      { pattern: /\b않해/g, replace: "안 해", desc: "않해→안 해" },
      { pattern: /\b않먹/g, replace: "안 먹", desc: "않먹→안 먹" },
    ],
    
    passive: [
      { pattern: /되어지다/g, replace: "되다", desc: "중복 피동" },
      { pattern: /되어졌/g, replace: "되었", desc: "중복 피동" },
    ],
    
    passive2: [
      { pattern: /볼려고/g, replace: "보려고", desc: "볼려고→보려고" },
      { pattern: /먹을려/g, replace: "먹으려", desc: "먹을려→먹으려" },
    ],
    
    irregular: [
      { pattern: /춥어/g, replace: "추워", desc: "ㅂ 불규칙" },
      { pattern: /덥어/g, replace: "더워", desc: "ㅂ 불규칙" },
      { pattern: /아퍼/g, replace: "아파", desc: "ㅍ 불규칙" },
    ],
    
    particles: [
      { pattern: /이예요/g, replace: "이에요", desc: "이예요→이에요" },
    ],

    // 존댓말 오류
    honorific: [
      { pattern: /맛있셨어/g, replace: "맛있었어", desc: "음식에는 과거 시제만" },
      { pattern: /맛있으셨/g, replace: "맛있었", desc: "음식에는 과거 시제만" },
    ],
  };

  async check(text: string, useLLM: boolean = true): Promise<SpellCheckResult> {
    const startTime = Date.now();

    if (!text || text.trim().length < 5) {
      throw new Error("최소 5자 이상 입력해주세요");
    }

    if (text.length > 300) {
      throw new Error("300자 이하로 입력해주세요");
    }

    try {
      console.log("\n📝 원문:", text);
      
      // 1단계: 규칙 기반
      const ruleErrors = this.runRuleBasedCheck(text);
      console.log(`✅ 규칙: ${ruleErrors.length}개`, ruleErrors.map(e => e.original));

      // 2단계: LLM (옵션)
      let llmErrors: any[] = [];
      if (useLLM) {
        try {
          console.log("🤖 LLM 검사는 클라이언트에서 처리됩니다");
        } catch (e: any) {
          console.warn("⚠️ LLM 실패:", e.message);
        }
      }

      // 3단계: 통합
      const finalErrors = this.smartMergeErrors(text, ruleErrors, llmErrors);
      console.log(`📊 최종: ${finalErrors.length}개`);

      // 4단계: 교정
      const correctedText = this.applyCorrections(text, finalErrors);
      console.log("✅ 교정:", correctedText);

      return {
        hasErrors: finalErrors.length > 0,
        correctedText,
        errors: finalErrors.map((err, idx) => ({
          id: `error-${idx}`,
          original: err.original,
          corrected: err.corrected,
          type: err.type || "spelling",
          explanation: err.explanation || "교정",
          start: err.start,
          end: err.end,
          suggestions: [err.corrected],
          confidence: err.confidence || 0.8,
        })),
        confidence: this.calculateOverallConfidence(finalErrors),
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error("❌ 오류:", error);
      throw error;
    }
  }

  /**
   * LLM 기반 추가 검사 (클라이언트 전용)
   */
  async checkWithLLM(text: string): Promise<any[]> {
    try {
      const template = getSpellCheckPrompt(text);
      const prompt = buildSpellCheckPrompt(template);
      
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          parameters: {
            temperature: 0.1,
            top_p: 0.9,
            max_tokens: 1500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }

      const data = await response.json();
      const llmResult = this.parseResponse(data.data.generated_text, text);
      return llmResult.errors || [];
    } catch (error: any) {
      console.error("LLM 검사 실패:", error);
      return [];
    }
  }

  private runRuleBasedCheck(text: string): any[] {
    const errors: any[] = [];

    // 1. 오타 사전
    Object.entries(this.TYPO_DICTIONARY).forEach(([wrong, correct]) => {
      let idx = text.indexOf(wrong);
      while (idx >= 0) {
        errors.push({
          original: wrong,
          corrected: correct,
          type: "spelling",
          explanation: "오타",
          start: idx,
          end: idx + wrong.length,
          confidence: 0.95,
        });
        idx = text.indexOf(wrong, idx + 1);
      }
    });

    // 2. 띄어쓰기
    this.SPACING_RULES.forEach(rule => {
      Array.from(text.matchAll(rule.pattern)).forEach(m => {
        const corrected = m[0].replace(rule.pattern, rule.replace);
        if (m[0] !== corrected && m[0].trim() !== corrected.trim()) {
          errors.push({
            original: m[0],
            corrected,
            type: "spacing",
            explanation: rule.desc,
            start: m.index!,
            end: m.index! + m[0].length,
            confidence: rule.confidence,
          });
        }
      });
    });

    // 3. 형태소
    Object.values(this.MORPHEME_PATTERNS).flat().forEach(rule => {
      Array.from(text.matchAll(rule.pattern)).forEach(m => {
        const corrected = m[0].replace(rule.pattern, rule.replace);
        if (m[0] !== corrected) {
          errors.push({
            original: m[0],
            corrected,
            type: "grammar",
            explanation: rule.desc,
            start: m.index!,
            end: m.index! + m[0].length,
            confidence: 0.9,
          });
        }
      });
    });

    return this.deduplicateErrors(errors);
  }

  private smartMergeErrors(text: string, rule: any[], llm: any[]): any[] {
    const map = new Map<string, any>();

    rule.forEach(e => {
      const k = `${e.start}-${e.end}`;
      if (!map.has(k) || map.get(k).confidence < e.confidence) {
        map.set(k, e);
      }
    });

    llm.forEach(e => {
      const start = text.indexOf(e.original);
      if (start >= 0) {
        const end = start + e.original.length;
        const k = `${start}-${end}`;
        if (!map.has(k)) {
          map.set(k, { ...e, start, end, confidence: 0.75 });
        }
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => {
      const ld = (b.end - b.start) - (a.end - a.start);
      return ld !== 0 ? ld : a.start - b.start;
    });

    const result: any[] = [];
    const used: Array<[number, number]> = [];

    sorted.forEach(e => {
      const overlap = used.some(([s, en]) => !(e.end <= s || e.start >= en));
      if (!overlap) {
        result.push(e);
        used.push([e.start, e.end]);
      }
    });

    return result.sort((a, b) => a.start - b.start);
  }

  private applyCorrections(text: string, errors: any[]): string {
    if (!errors.length) return text;
    
    const sorted = [...errors].sort((a, b) => b.start - a.start);
    let result = text;
    
    for (const e of sorted) {
      const current = result.substring(e.start, e.end);
      if (current === e.original) {
        result = result.substring(0, e.start) + e.corrected + result.substring(e.end);
      }
    }
    
    return result;
  }

  private deduplicateErrors(errors: any[]): any[] {
    const map = new Map<string, any>();
    errors.forEach(e => {
      const k = `${e.start}-${e.end}`;
      if (!map.has(k) || map.get(k).confidence < e.confidence) {
        map.set(k, e);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.start - b.start);
  }

  private calculateOverallConfidence(errors: any[]): number {
    if (!errors.length) return 1.0;
    const avg = errors.reduce((s, e) => s + (e.confidence || 0.8), 0) / errors.length;
    return Math.round(avg * 100) / 100;
  }

  private parseResponse(raw: string, orig: string): any {
    try {
      let jsonStr = raw.trim();
      
      jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.hasErrors || !Array.isArray(parsed.errors) || parsed.errors.length === 0) {
        return { hasErrors: false, correctedText: orig, errors: [] };
      }
      
      return {
        hasErrors: true,
        correctedText: parsed.correctedText || orig,
        errors: parsed.errors,
      };
    } catch (e: any) {
      console.error("JSON 파싱 실패:", e.message);
      return { hasErrors: false, correctedText: orig, errors: [] };
    }
  }
}

export const spellCheckService = new SpellCheckService();