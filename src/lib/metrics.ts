export type Metrics = {
  completeness: number;
  coherence: number;
  repetition: number;
  readability: number;
  lengthFit: number;
  structure: number;
  composite: number;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\.]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function sentenceSplit(text: string) {
  return text
    .split(/[.!?]+\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function syllableEstimate(word: string) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;
  const groups = cleaned.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function fleschReadingEase(text: string) {
  const sentences = Math.max(1, sentenceSplit(text).length);
  const wordsArr = tokenize(text);
  const words = Math.max(1, wordsArr.length);
  const syllables = wordsArr.reduce((sum, w) => sum + syllableEstimate(w), 0);
  const ASL = words / sentences; // average sentence length
  const ASW = syllables / words; // average syllables per word
  // Flesch score ~ 206.835 - 1.015*ASL - 84.6*ASW. Normalize to 0..1 (roughly)
  const score = 206.835 - 1.015 * ASL - 84.6 * ASW;
  return clamp01((score - 0) / 100); // approx normalization
}

function repetitionScore(text: string) {
  const words = tokenize(text);
  if (words.length < 4) return 1;
  const ngramCounts = new Map<string, number>();
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i + n <= words.length; i++) {
      const key = words.slice(i, i + n).join(" ");
      ngramCounts.set(key, (ngramCounts.get(key) || 0) + 1);
    }
  }
  let repeated = 0;
  ngramCounts.forEach((v) => {
    if (v > 1) repeated += v - 1;
  });
  const ratio = repeated / Math.max(1, words.length);
  return clamp01(1 - ratio); // higher is better (less repetition)
}

function structureScore(text: string) {
  // Headings, lists, code blocks
  const lines = text.split(/\r?\n/);
  const headings = lines.filter((l) => /^#{1,3}\s|^[A-Z].+:$/.test(l)).length;
  const lists = lines.filter((l) => /^[-*+]\s|^\d+\.\s/.test(l)).length;
  const code = text.includes("```") ? 1 : 0;
  const normalized = clamp01((headings + lists + code) / 6);
  return normalized;
}

function coherenceScore(text: string) {
  // Heuristic: variance of sentence length and function word transitions
  const sents = sentenceSplit(text);
  if (sents.length <= 1) return 0.5;
  const lengths = sents.map((s) => tokenize(s).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  // penalize very high variance as less coherent
  const vNorm = Math.min(1, variance / 50);
  return clamp01(1 - vNorm);
}

function completenessScore(text: string, prompt: string) {
  // Extract keywords from prompt (simple heuristic: nouns/verbs by stopword filtering)
  const stop = new Set(
    "the a an and or but if when of to in for on with as by is are was were be been being this that these those it they them you your\n".split(
      /\s+/
    )
  );
  const pWords = tokenize(prompt).filter((w) => !stop.has(w) && w.length > 2);
  const uniq = Array.from(new Set(pWords)).slice(0, 15);
  const t = tokenize(text);
  const covered = uniq.filter((w) => t.includes(w)).length;
  return clamp01(uniq.length ? covered / uniq.length : 0.5);
}

function lengthFitScore(text: string, desired: "short" | "medium" | "long" | null) {
  const words = tokenize(text).length;
  const targets = {
    short: 120,
    medium: 300,
    long: 600,
  } as const;
  if (!desired) return 0.7;
  const target = targets[desired];
  const ratio = Math.min(words, target) / Math.max(words, target);
  return clamp01(ratio);
}

export function computeMetrics(params: {
  text: string;
  prompt: string;
  desiredLength?: "short" | "medium" | "long" | null;
}): Metrics {
  const { text, prompt, desiredLength = null } = params;
  const completeness = completenessScore(text, prompt);
  const coherence = coherenceScore(text);
  const repetition = repetitionScore(text);
  const readability = fleschReadingEase(text);
  const lengthFit = lengthFitScore(text, desiredLength);
  const structure = structureScore(text);
  // Weighted composite: prioritize completeness and coherence
  const composite = clamp01(
    0.3 * completeness +
      0.25 * coherence +
      0.15 * repetition +
      0.1 * readability +
      0.1 * lengthFit +
      0.1 * structure
  );
  return {
    completeness,
    coherence,
    repetition,
    readability,
    lengthFit,
    structure,
    composite,
  };
}
