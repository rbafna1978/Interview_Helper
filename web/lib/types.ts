export type ScoreValue = number | string | null;

export type QuestionMode = 'behavioral' | 'technical' | 'system_design' | 'company_pack';

export type QuestionSummary = {
  id: string;
  slug: string;
  text: string;
  mode: QuestionMode;
  pack?: string | null;
  difficulty: number;
  tags: string[];
  competencies: string[];
  timeLimitSec: number;
};

export type ScoreMap = Record<string, ScoreValue>;

export type ScoreIssue = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  evidenceSnippet: string;
  fixSuggestion: string;
  rewriteSuggestion?: string;
};

export type ScoreExplain = {
  weights: Record<string, number>;
  signals: Record<string, number>;
};

export type HistorySummary = {
  attempt_count: number;
  last_total?: number | null;
  delta_total?: number | null;
  best_total?: number | null;
  avg_total?: number | null;
  metric_deltas?: Record<string, number | null>;
  persisting_flags?: string[];
  last_metrics?: Record<string, unknown>;
};

export type AttemptFeedback = {
  transcript: string;
  duration_seconds?: number;
  scores?: ScoreMap | null;
  overallScore?: number | null;
  subscores?: Record<string, number> | null;
  issues?: ScoreIssue[] | null;
  explain?: ScoreExplain | null;
  suggestions?: string[] | null;
  explanations?: Record<string, unknown> | null;
  language?: string | null;
  strengths?: string[] | null;
  detected?: Record<string, unknown> | null;
  history_summary?: HistorySummary | null;
  question_alignment?: Record<string, unknown> | null;
};

export type AttemptRecord = AttemptFeedback & {
  id?: string | number;
  created_at?: string | number;
  question_slug?: string;
  user_id?: string;
  score_structure?: number | null;
  score_clarity?: number | null;
  score_concision?: number | null;
  score_content?: number | null;
  score_confidence?: number | null;
  score_total?: number | null;
};
