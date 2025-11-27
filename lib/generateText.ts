// src/lib/generateText.ts
export async function generateText({
  input,
  tone,
  segment,
  strategy,
}: {
  input: string;
  tone: string;
  segment: string;
  strategy: { temperature: number; top_p: number };
}) {
  const prompt = `
You are a ${segment}-style assistant.
Rewrite this text in a ${tone} tone, keeping it natural and fluent.

Input:
${input}

Output:
`;

  // ✅ 무료 허깅페이스 Inference API (공개 엔드포인트)
  const response = await fetch("https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        temperature: strategy.temperature,
        top_p: strategy.top_p,
        max_new_tokens: 256,
      },
    }),
  });

  if (!response.ok) {
    console.error("❌ HuggingFace API error:", await response.text());
    return "(생성 실패: 모델 응답 오류)";
  }

  const data = await response.json();
  const text = data?.generated_text || data?.[0]?.generated_text || "";

  return text.trim();
}
