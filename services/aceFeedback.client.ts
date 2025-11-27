// services/aceFeedback.client.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


// Feature 이름 매핑
const FEATURE_MAP: Record<string, string> = {
  "다듬기": "Paraphrase",
  "톤 조정": "ToneAdjust",
  "확장": "Expand",
  "압축": "Compress"
};

// --- 타입 정의 ---

export interface FeedbackStatus {
  user_id: string;
  has_feedback: boolean;
  personalization_enabled: boolean;
}

export interface AceCorrectParams {
  userId: string;
  text: string;
  feature: string;          // Paraphrase / ToneAdjust / Expand / Compress
  tone?: string;            // 'normal' | 'formal' 등
  genre?: string;           // 'informative' 등
}

export interface AceCorrectResponse {
  corrected: string;
  method: string;           // 'personalized' | 'default' ... 백엔드에서 오는 값
}

/**
 * 1) 이 유저가 피드백 남긴 적 있는지 확인
 *    GET /api/feedback/status/{user_id}
 */
export async function getFeedbackStatus(userId: string): Promise<FeedbackStatus> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/feedback/status/${userId}`);
      
      if (!res.ok) {
        console.error("getFeedbackStatus error:", res.status);
        // 에러 시 피드백 없는 걸로 간주
        return {
          user_id: userId,
          has_feedback: false,
          personalization_enabled: false
        };
      }
      
      return res.json();
    } catch (error) {
      console.error("getFeedbackStatus failed:", error);
      return {
        user_id: userId,
        has_feedback: false,
        personalization_enabled: false
      };
    }
  }

// --- 2) 피드백 있으면 ACE로 교정, 없으면 null 반환 ---
/**
 * 2) ACE 개인화 교정 요청
 *    POST /api/feedback/correct
 */
export async function aceCorrectOrNull(
  params: AceCorrectParams
): Promise<AceCorrectResponse | null> {
  try {
    // 1. 피드백 상태 확인
    const status = await getFeedbackStatus(params.userId);
    console.log("📊 피드백 상태:", status);

    if (!status.personalization_enabled) {
      // 피드백 이력 X 유저 -> ACE 사용x, 프론트에서 기존 HF LLM을 쓰도록 넘겨줌
      console.log("⚪ 피드백 없음 → HF LLM 사용");
      return null;
    }

    // 2. Feature 이름 변환
    const mappedFeature = FEATURE_MAP[params.feature] || params.feature;
    console.log(`🔄 Feature 매핑: ${params.feature} → ${mappedFeature}`);

    // 3. ACE 교정 요청
    const res = await fetch(`${API_BASE_URL}/api/feedback/correct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: params.userId,
        text: params.text,
        feature: mappedFeature, 
        tone: params.tone ?? "normal",
        genre: params.genre ?? "informative",
      }),
    });

    if (!res.ok) {
      console.error("❌ ACE API failed:", res.status, res.statusText);
      // 에러 시 null 반환 → HF LLM 폴백
      return null;
    }

    const result = await res.json();
    console.log("✅ ACE 개인화 성공!");
    return result;
    
  } catch (error) {
    console.error("❌ ACE pipeline error:", error);
    // 에러 발생 시 null 반환 → 기존 방식으로 폴백
    return null;
  }
}

export async function correctWithACE(
  params: AceCorrectParams
): Promise<AceCorrectResponse> {
  const result = await aceCorrectOrNull(params);
  if (!result) {
    throw new Error("personalization disabled");
  }
  return result;
}