// services/llm/aceCorrect.ts

export interface AceCorrectParams {
  userId: string;
  text: string;
  feature?: "Paraphrase";
  tone?: string;
  genre?: string;
  complexity?: string;
  recommendationScore?: number;
}

export interface AceCorrectResponse {
  corrected: string;
  method: string;          // "personalized" | "baseline" 등
  rules_applied: number;
  confidence: number;
}

export async function requestAceCorrection(
  params: AceCorrectParams
): Promise<AceCorrectResponse> {
  const response = await fetch("/api/ace/correct", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("❌ requestAceCorrection error:", err);
    throw new Error(err.error || "ACE 교정 요청 실패");
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error || "ACE 교정 실패");
  }

  return json.data as AceCorrectResponse;
}