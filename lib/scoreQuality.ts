// src/lib/scoreQuality.ts
export function cosineSimilarity(a: string, b: string): number {
  const tokenize = (s: string) => s.toLowerCase().split(/\s+/).filter(Boolean);
  const vecA = tokenize(a);
  const vecB = tokenize(b);
  const set = new Set([...vecA, ...vecB]);
  const mapA = new Map<string, number>();
  const mapB = new Map<string, number>();

  set.forEach((word) => {
    mapA.set(word, vecA.filter((w) => w === word).length);
    mapB.set(word, vecB.filter((w) => w === word).length);
  });

  const dot = Array.from(set).reduce((sum, w) => sum + (mapA.get(w)! * mapB.get(w)!), 0);
  const normA = Math.sqrt(Array.from(mapA.values()).reduce((s, v) => s + v ** 2, 0));
  const normB = Math.sqrt(Array.from(mapB.values()).reduce((s, v) => s + v ** 2, 0));

  return normA && normB ? dot / (normA * normB) : 0;
}

export function scoreQuality(original: string, generated: string, tone: string) {
  const lengthRatio = generated.length / (original.length || 1);
  const toneMatch = generated.includes(tone) ? 1 : 0;
  const lexicalScore = cosineSimilarity(original, generated);
  const structurePenalty = Math.abs(1 - lengthRatio);
  const score = 0.5 * lexicalScore + 0.3 * toneMatch - 0.2 * structurePenalty;
  return Math.max(0, Math.min(1, score));
}
