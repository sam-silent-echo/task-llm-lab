export type ParamGrid = {
  temperature: number[];
  top_p: number[];
  max_tokens: number[];
  model?: string;
  desiredLength?: "short" | "medium" | "long";
};

export type RunResult = {
  temperature: number;
  top_p: number;
  max_tokens: number;
  model: string;
  text: string;
  tokens: number;
  latencyMs: number;
  metrics: {
    completeness: number;
    coherence: number;
    repetition: number;
    readability: number;
    lengthFit: number;
    structure: number;
    composite: number;
  };
};
