export interface TimeComplexities {
  best: string;
  average: string;
  worst: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
}

/** Light shape used in catalog/list responses. */
export interface AlgorithmSummary {
  id: number;
  slug: string;
  name: string;
  summary: string | null;
  category: string; // category slug
  difficulty: string | null;
  visualizerType: string;
}

/** Full shape used to render an algorithm and drive its visualizer. */
export interface AlgorithmDetail extends AlgorithmSummary {
  description: string | null;
  spaceComplexity: string | null;
  timeComplexities: TimeComplexities;
  codeSnippets: CodeSnippet[];
}
