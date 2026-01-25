export type Domain = "people" | "process" | "business_environment";
export type AccessTier = "free" | "premium";
export type SetId = "set_a" | "set_b" | "set_c" | "free";

export type QuestionType =
  | "mcq_single"
  | "mcq_multi"
  | "dnd_match"
  | "dnd_order"
  | "hotspot"
  | "fill_blank";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type Media = { imageUrl?: string; alt?: string };
export type Scenario = { id: string; title?: string; text: string };
export type Choice = { id: string; text: string };

export type RectRegion = { id: string; shape: "rect"; x: number; y: number; w: number; h: number };
export type HotspotPayload = { regions: RectRegion[]; coordinateSpace: "percent" | "px" };

export type MCQSinglePayload = { choices: Choice[] };
export type MCQMultiPayload = { choices: Choice[]; minSelections?: number; maxSelections?: number };

export type DndMatchPayload = {
  prompts: { id: string; text: string }[];
  answers: { id: string; text: string }[];
};

export type DndOrderPayload = { items: { id: string; text: string }[] };

export type FillBlankPayload = { blanks: { id: string; placeholder?: string }[]; inputMode?: "text" | "numeric" };

export type BaseQuestion = {
  id: string;
  type: QuestionType;
  domain: Domain;
  prompt: string;
  scenarioId?: string;
  tags?: string[];
  difficulty?: Difficulty;
  accessTier?: AccessTier;
  setId?: SetId;
  version?: number;
  media?: Media;
  explanation?: string;
};

export type Question =
  | (BaseQuestion & { type: "mcq_single"; payload: MCQSinglePayload; answerKey: { correctChoiceId: string } })
  | (BaseQuestion & {
      type: "mcq_multi";
      payload: MCQMultiPayload;
      answerKey: { correctChoiceIds: string[]; scoring?: "strict" | "partial" };
    })
  | (BaseQuestion & { type: "dnd_match"; payload: DndMatchPayload; answerKey: { mapping: Record<string, string> } })
  | (BaseQuestion & { type: "dnd_order"; payload: DndOrderPayload; answerKey: { orderedIds: string[] } })
  | (BaseQuestion & { type: "hotspot"; payload: HotspotPayload; answerKey: { correctRegionId: string } })
  | (BaseQuestion & {
      type: "fill_blank";
      payload: FillBlankPayload;
      answerKey: { values: Record<string, string[]>; numericTolerance?: number; caseInsensitive?: boolean };
    });

export type Response =
  | { type: "mcq_single"; choiceId: string | null }
  | { type: "mcq_multi"; choiceIds: string[] }
  | { type: "dnd_match"; mapping: Record<string, string | null> }
  | { type: "dnd_order"; orderedIds: string[] }
  | { type: "hotspot"; selectedRegionId: string | null; click?: { x: number; y: number } }
  | { type: "fill_blank"; values: Record<string, string> };

export type Mode = "practice" | "exam";

export type Blueprint = {
  total: number;
  domains?: Partial<Record<Domain, number>>;
  types?: Partial<Record<QuestionType, number>>;
  difficulty?: Partial<Record<Difficulty, number>>;
  includeTags?: string[];
  excludeTags?: string[];
  accessTier?: AccessTier;
  setId?: SetId;
};

export type Attempt = {
  id: string;
  mode: Mode;
  seed: string;
  createdAt: string;
  lastSavedAt: string;
  blueprint: Blueprint;
  questionRefs: { id: string; version?: number }[];
  questionOrder: string[];
  optionOrderByQuestionId: Record<string, string[]>;
  currentIndex: number;
  responsesByQuestionId: Record<string, Response>;
  flagged: Record<string, boolean>;
  timeSpentMsByQuestionId: Record<string, number>;
  submittedAt?: string | null;
};

export type ScoreResult = { questionId: string; isCorrect: boolean; score: number; maxScore: number; details?: any };

export type AttemptResult = {
  attemptId: string;
  totalScore: number;
  maxScore: number;
  byDomain: Record<Domain, { score: number; maxScore: number; correct: number; total: number }>;
  byType: Record<QuestionType, { score: number; maxScore: number; correct: number; total: number }>;
  incorrectQuestionIds: string[];
  scoreResults: ScoreResult[];
};
