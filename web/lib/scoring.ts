// TypeScript port of transcriber/scoring.py
// scoreAnswer() is the main export; same response shape as the Python /transcribe endpoint.

// ---------- Lexicons ----------
const FILLERS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'kind of', 'kinda',
  'sort of', 'actually', 'basically', 'literally', 'so yeah', 'i mean',
];

const HEDGES = [
  'maybe', 'perhaps', 'probably', 'possibly', 'i think', 'i guess',
  'i believe', 'i feel like', 'sort of', 'kind of', 'somewhat', 'a bit',
  'might', 'could', 'not sure', 'to be honest', 'i suppose',
];

const ACTION_VERBS = [
  'built', 'implemented', 'designed', 'led', 'drove', 'optimized', 'reduced',
  'increased', 'launched', 'migrated', 'refactored', 'debugged', 'delivered',
  'automated', 'integrated', 'owned', 'shipped', 'deployed', 'scaled', 'mentored',
  'verified', 'configured', 'reconfigured', 'reproduced', 'benchmarked', 'profiled',
  'triaged', 'isolated', 'documented',
];

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'this', 'that', 'these', 'those',
  'to', 'of', 'in', 'on', 'for', 'with', 'by', 'from', 'about', 'as', 'at', 'into',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'its', 'i', 'we', 'you',
  'my', 'our', 'your', 'they', 'their', 'them', 'he', 'she', 'his', 'her',
  'how', 'what', 'why', 'when', 'where', 'who', 'which',
]);

const REQUIREMENTS_TERMS = ['requirement', 'constraint', 'goal', 'scope', 'assumption', 'require', 'must'];
const TRADEOFF_TERMS = ['trade-off', 'tradeoff', 'cost', 'latency', 'throughput', 'consistency', 'availability'];
const RELIABILITY_TERMS = ['retry', 'timeout', 'failover', 'monitoring', 'alert', 'observability', 'resilient', 'fallback'];
const EDGE_TERMS = ['edge case', 'failure', 'error', 'bug', 'exception', 'rollback'];
const COMPLEXITY_TERMS = ['big o', 'complexity', 'runtime', 'memory', 'space', 'efficient', 'performance'];
const SCALING_TERMS = ['scale', 'shard', 'partition', 'load', 'cache', 'queue', 'cdn', 'replica'];
const DATA_TERMS = ['schema', 'table', 'index', 'data model', 'storage', 'database'];
const API_TERMS = ['api', 'endpoint', 'request', 'response', 'contract', 'versioning'];

const RESULT_CUES = [
  'as a result', 'resulted in', 'so that', 'thereby', 'which led to',
  'leading to', 'therefore', 'ultimately', 'in the end', 'the outcome',
  'this helped', 'this enabled', 'we were able to', 'users could', 'the system could',
  'confirmed on the', 'successfully', 'we succeeded', 'we achieved', 'earned recognition',
  'unblocked', 'fixed the issue', 'resolved the issue', 'passed tests', 'met the goal', 'met our goal',
];

const SITUATION_CUES = [
  'at my internship', 'at school', 'on a project', 'the situation', 'the context',
  'when i', 'while i', 'our team was', 'we were', 'the problem was', 'we faced', 'one challenge',
];

const TASK_CUES = [
  'my task', 'i needed to', 'i had to', 'i was responsible for', 'the goal was',
  'the objective was', 'we needed to', 'we had to',
];

const ACTION_CUES = [
  'so i', 'i decided to', 'i started by', 'i then', 'i worked on', 'i implemented',
  'we implemented', 'i built', 'we built', 'i designed', 'we designed', 'i verified', 'i debugged',
];

const REFLECTION_CUES = [
  'i learned', 'i realised', 'i realized', 'what i learned', 'this taught me',
  'i would', 'next time', 'going forward', 'i now', 'i took away', 'i discovered',
  'i will', 'we learned', 'lesson', 'key takeaway',
];

const VAGUE_PHRASES = [
  'some things', 'stuff', 'things', 'technical issues', 'it started working',
  'figured it out', 'googling', 'okay in the end', 'tough but managed',
  'sort of worked', 'kind of worked', 'did some research', 'did research',
];

// ---------- Defaults ----------
const WEIGHTS: Record<string, number> = {
  structure: 0.22,
  relevance: 0.2,
  clarity: 0.18,
  conciseness: 0.15,
  delivery: 0.15,
  technical: 0.1,
};

const THRESHOLDS = {
  max_filler_per_100: 2.5,
  max_avg_sentence: 32,
  min_tokens: 80,
  ideal_duration: 150,
  relevance_floor: 0.5,
  relevance_hard_floor: 0.35,
};

// ---------- Basic helpers ----------
function clamp(value: number, lo = 0.0, hi = 1.0): number {
  return Math.max(lo, Math.min(hi, value));
}

function lower(s: string): string {
  return s.toLowerCase().trim();
}

function tokenizeWords(text: string): string[] {
  const matches = text.toLowerCase().match(/\b[\w'-]+\b/g);
  return matches ?? [];
}

function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/(?<=[.!?])\s+/);
}

function extractKeywords(text: string, limit = 8): string[] {
  const tokens = (text.match(/\b[\w'-]+\b/g) ?? []).map((t) => t.toLowerCase());
  const filtered = tokens.filter((t) => !STOPWORDS.has(t) && t.length > 2);
  const uniq: string[] = [];
  for (const t of filtered) {
    if (!uniq.includes(t)) uniq.push(t);
    if (uniq.length >= limit) break;
  }
  return uniq;
}

function keywordSignal(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.some((kw) => t.includes(kw));
}

function countMatches(text: string, terms: string[]): Array<[string, number]> {
  const t = ' ' + lower(text) + ' ';
  const results: Array<[string, number]> = [];
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\w)${escaped}(?!\\w)`, 'gi');
    const cnt = (t.match(regex) ?? []).length;
    if (cnt > 0) results.push([term, cnt]);
  }
  return results;
}

// ---------- Detectors ----------
function fillerStats(text: string) {
  const matches = countMatches(text, FILLERS);
  const total = matches.reduce((s, [, c]) => s + c, 0);
  const words = Math.max(1, tokenizeWords(text).length);
  const rate_per_100 = (total / words) * 100;
  return { total, per_100w: rate_per_100, details: matches };
}

function hedgeStats(text: string) {
  const matches = countMatches(text, HEDGES);
  const total = matches.reduce((s, [, c]) => s + c, 0);
  const words = Math.max(1, tokenizeWords(text).length);
  const rate_per_100 = (total / words) * 100;
  return { total, per_100w: rate_per_100, details: matches };
}

function actionVerbDensity(text: string) {
  const tokens = tokenizeWords(text);
  const actions = tokens.filter((w) => ACTION_VERBS.includes(w));
  const density = actions.length / Math.max(1, tokens.length);
  return { count: actions.length, density, examples: actions.slice(0, 10) };
}

function ownershipRatio(text: string) {
  const tokens = tokenizeWords(text);
  const iCt = tokens.filter((t) => t === 'i').length;
  const weCt = tokens.filter((t) => t === 'we').length;
  const total = iCt + weCt;
  const ratio = total ? iCt / total : 0.5;
  return { i: iCt, we: weCt, i_ratio: ratio };
}

function quantification(text: string) {
  const numberRe = /(?<!\w)(?:\$?\d+(?:\.\d+)?%?|\d{1,3}(?:,\d{3})+%?)(?!\w)/g;
  const timeRe = /\b(days?|weeks?|months?|quarters?|years?)\b/gi;
  const nums = text.match(numberRe) ?? [];
  const times = text.match(timeRe) ?? [];
  return { numbers: nums.slice(0, 20), has_numbers: nums.length > 0, time_terms: times.slice(0, 20) };
}

function sentenceStats(text: string) {
  const sents = splitSentences(text).map((s) => s.trim()).filter(Boolean);
  if (!sents.length) return { avg_len: 0, sentences: [] };
  const lens = sents.map((s) => tokenizeWords(s).length);
  const avg_len = lens.reduce((s, n) => s + n, 0) / lens.length;
  return { avg_len, sentences: sents.slice(0, 40) };
}

function starSegments(text: string) {
  const tl = lower(text);
  const tags: Record<string, boolean> = { s: false, t: false, a: false, r: false };
  if (SITUATION_CUES.some((c) => tl.includes(c))) tags['s'] = true;
  if (TASK_CUES.some((c) => tl.includes(c))) tags['t'] = true;
  if (ACTION_CUES.some((c) => tl.includes(c))) tags['a'] = true;
  const coverage = Object.values(tags).filter(Boolean).length;
  return { tags, coverage };
}

function resultStrength(text: string) {
  const tl = lower(text);
  const sents = splitSentences(text);
  const n = Math.max(1, sents.length);
  const endIdx = Math.floor(n * 0.7);

  const cueHits = countMatches(text, RESULT_CUES);
  const cueScore = Math.min(1.0, cueHits.reduce((s, [, c]) => s + c, 0) * 0.25);

  const numberRe = /(?<!\w)(?:\$?\d+(?:\.\d+)?%?|\d{1,3}(?:,\d{3})+%?)(?!\w)/;
  const hasNum = numberRe.test(tl);
  const numScore = hasNum ? 0.35 : 0.0;

  const endText = sents.slice(endIdx).join(' ').toLowerCase();
  const endCues = [
    'users could', 'successfully', 'enabled', 'reduced', 'increased',
    'confirmed', 'recognized', 'passed', 'fixed', 'resolved', 'unblocked', 'achieved',
  ];
  const endHits = endCues.filter((c) => endText.includes(c)).length;
  const endScore = Math.min(0.4, endHits * 0.2);

  const score = Math.min(1.0, cueScore + numScore + endScore);
  return { score, details: { cue_hits: cueHits, has_numbers: hasNum, end_hits: endHits } };
}

function vagueness(text: string) {
  const hits = countMatches(text, VAGUE_PHRASES);
  const total = hits.reduce((s, [, c]) => s + c, 0);
  const penalty = Math.min(0.6, total * 0.2);
  return { penalty, hits };
}

function reflectionPresence(text: string) {
  const matches = countMatches(text, REFLECTION_CUES);
  return {
    has_reflection: matches.length > 0,
    phrases: matches.slice(0, 3).map(([term]) => term),
    total: matches.reduce((s, [, c]) => s + c, 0),
  };
}

function lexicalStats(tokens: string[]) {
  if (!tokens.length) return { diversity: 0.0, long_ratio: 0.0, unique: 0 };
  const unique = new Set(tokens).size;
  const longWords = tokens.filter((t) => t.length >= 7).length;
  return { diversity: unique / tokens.length, long_ratio: longWords / tokens.length, unique };
}

function starSequenceSignal(text: string) {
  const tl = lower(text);
  const length = Math.max(1, tl.length);
  const labels: Array<[string, string[]]> = [
    ['s', SITUATION_CUES],
    ['t', TASK_CUES],
    ['a', ACTION_CUES],
    ['r', RESULT_CUES],
  ];
  const positions: Record<string, number | null> = {};
  for (const [label, cues] of labels) {
    const idxs = cues.filter((c) => tl.includes(c)).map((c) => tl.indexOf(c));
    positions[label] = idxs.length ? Math.min(...idxs) / length : null;
  }
  const ordered_positions = (['s', 't', 'a', 'r'] as const)
    .map((l) => positions[l])
    .filter((p): p is number => p !== null);
  const ordered = ordered_positions.every((p, i) => i === 0 || p > ordered_positions[i - 1]!);
  return { positions, observed: Object.values(positions).filter((v) => v !== null).length, ordered };
}

// ---------- Question alignment ----------
type RubricTopic = {
  id: string;
  label: string;
  weight: number;
  keywords: string[];
  metric?: { name: string; min?: number; max?: number; equals?: boolean };
  remedy?: string;
};

function inferMode(questionId: string | undefined, questionText: string): string {
  const text = ((questionId ?? '') + questionText).toLowerCase();
  if (['system', 'architecture', 'design'].some((t) => text.includes(t))) return 'system_design';
  if (['technical', 'code', 'algorithm', 'debug'].some((t) => text.includes(t))) return 'technical';
  return 'behavioral';
}

function buildRubric(questionText: string): { title: string; topics: RubricTopic[] } {
  const mode = inferMode(undefined, questionText);
  const promptKeywords = extractKeywords(questionText);

  if (mode === 'behavioral') {
    return {
      title: questionText,
      topics: [
        { id: 'situation', label: 'Set context and stakes', weight: 0.2, keywords: [...SITUATION_CUES, ...promptKeywords], remedy: 'Open with the situation or context to set stakes quickly.' },
        { id: 'task', label: 'Clarify your responsibility or goal', weight: 0.18, keywords: [...TASK_CUES, 'goal', 'objective', ...promptKeywords], remedy: 'State your role and what you needed to accomplish.' },
        { id: 'action', label: 'Describe decisive actions you took', weight: 0.26, keywords: [...ACTION_CUES, ...ACTION_VERBS], metric: { name: 'actions_density', min: 0.014 }, remedy: 'Emphasize the actions you personally took, not the team in general.' },
        { id: 'result', label: 'Close with tangible results', weight: 0.22, keywords: [...RESULT_CUES, 'impact', 'outcome', 'improved', ...promptKeywords], metric: { name: 'result_strength', min: 0.45 }, remedy: 'Finish with a measurable or observable outcome.' },
        { id: 'reflection', label: 'Share a takeaway or learning', weight: 0.14, keywords: REFLECTION_CUES, metric: { name: 'reflection', equals: true }, remedy: 'Add a quick takeaway or what you\'d do differently next time.' },
      ],
    };
  }

  if (mode === 'technical') {
    return {
      title: questionText,
      topics: [
        { id: 'problem', label: 'Frame the problem and constraints', weight: 0.18, keywords: [...REQUIREMENTS_TERMS, ...promptKeywords], metric: { name: 'has_requirements', equals: true }, remedy: 'Start by clarifying requirements, constraints, and goal.' },
        { id: 'approach', label: 'Propose a concrete approach', weight: 0.22, keywords: ['approach', 'solution', 'algorithm', 'design', 'plan'], metric: { name: 'actions_density', min: 0.012 }, remedy: 'Outline a step-by-step approach or algorithm.' },
        { id: 'correctness', label: 'Address correctness and edge cases', weight: 0.18, keywords: [...EDGE_TERMS, 'test', 'verify', 'validate'], metric: { name: 'has_edges', equals: true }, remedy: 'Mention edge cases or how you would validate correctness.' },
        { id: 'complexity', label: 'Discuss performance or complexity', weight: 0.2, keywords: [...COMPLEXITY_TERMS, ...SCALING_TERMS], metric: { name: 'has_complexity', equals: true }, remedy: 'Call out performance considerations or complexity.' },
        { id: 'tradeoffs', label: 'Explain tradeoffs', weight: 0.22, keywords: TRADEOFF_TERMS, metric: { name: 'has_tradeoffs', equals: true }, remedy: 'State tradeoffs (latency vs cost, consistency vs availability, etc.).' },
      ],
    };
  }

  // system_design
  return {
    title: questionText,
    topics: [
      { id: 'requirements', label: 'Clarify requirements and constraints', weight: 0.18, keywords: [...REQUIREMENTS_TERMS, ...promptKeywords], metric: { name: 'has_requirements', equals: true }, remedy: 'Start by defining requirements, scale, and constraints.' },
      { id: 'architecture', label: 'Propose a high-level architecture', weight: 0.22, keywords: ['architecture', 'components', 'services', 'pipeline', ...SCALING_TERMS], remedy: 'Describe the major components and data flow.' },
      { id: 'data', label: 'Cover data model or storage', weight: 0.18, keywords: [...DATA_TERMS, 'cache', 'index'], metric: { name: 'has_data', equals: true }, remedy: 'Call out what data you store and where.' },
      { id: 'scale', label: 'Discuss scaling and reliability', weight: 0.22, keywords: [...SCALING_TERMS, ...RELIABILITY_TERMS], metric: { name: 'has_scaling', equals: true }, remedy: 'Explain how the design handles scale, failures, and reliability.' },
      { id: 'tradeoffs', label: 'Explain tradeoffs', weight: 0.2, keywords: TRADEOFF_TERMS, metric: { name: 'has_tradeoffs', equals: true }, remedy: 'State the tradeoffs you would make and why.' },
    ],
  };
}

function evaluateMetric(
  spec: NonNullable<RubricTopic['metric']>,
  metrics: Record<string, unknown>,
): boolean {
  const value = metrics[spec.name];
  if (value == null) return false;
  if (spec.min !== undefined) return Number(value) >= spec.min;
  if (spec.max !== undefined) return Number(value) <= spec.max;
  if (spec.equals !== undefined) return Boolean(value) === spec.equals;
  return false;
}

function analyzeQuestionAlignment(
  questionText: string,
  transcript: string,
  metrics: Record<string, unknown>,
) {
  const rubric = buildRubric(questionText);
  const transcriptLower = lower(transcript);

  let earned = 0.0;
  const totalWeight = rubric.topics.reduce((s, t) => s + t.weight, 0) || 1.0;
  const suggestions: string[] = [];
  const strengths: string[] = [];
  const topicResults: Array<{ id: string; label: string; met: boolean; weight: number }> = [];

  for (const topic of rubric.topics) {
    const keywordHits = topic.keywords.filter((kw) => transcriptLower.includes(kw));
    const metricHit = topic.metric ? evaluateMetric(topic.metric, metrics) : false;
    const hit = keywordHits.length > 0 || metricHit;

    if (hit) {
      earned += topic.weight;
      strengths.push(topic.label);
    } else {
      suggestions.push(topic.remedy ?? topic.label);
    }
    topicResults.push({ id: topic.id, label: topic.label, met: hit, weight: topic.weight });
  }

  const score = earned / totalWeight;
  const missingTopics = topicResults.filter((r) => !r.met).map((r) => r.label);

  return { score: clamp(score), topics: topicResults, missing_topics: missingTopics, suggestions, strengths, penalty: 0.0 };
}

// ---------- History ----------
type HistoryEntry = {
  transcript?: string;
  duration_seconds?: number | null;
  scores?: Record<string, unknown> | null;
  explanations?: Record<string, unknown> | string | null;
  suggestions?: string[] | null;
  strengths?: string[] | null;
};

type Snapshot = Record<string, number | null | undefined>;

function buildHistorySnapshots(history: HistoryEntry[]): Snapshot[] {
  return (history ?? []).map((entry) => {
    const scores = (entry.scores as Record<string, unknown>) ?? {};
    const expRaw = entry.explanations;
    let exp: Record<string, unknown> = {};
    if (typeof expRaw === 'string') {
      try { exp = JSON.parse(expRaw); } catch { /* ignore */ }
    } else if (expRaw && typeof expRaw === 'object') {
      exp = expRaw as Record<string, unknown>;
    }
    const transcript = entry.transcript ?? '';
    const duration = entry.duration_seconds ?? null;
    const snapshot: Snapshot = {
      total: scores.total != null ? Number(scores.total) : null,
      clarity: scores.clarity != null ? Number(scores.clarity) : null,
      concision: scores.concision != null ? Number(scores.concision) : null,
      content: scores.content != null ? Number(scores.content) : null,
      confidence: scores.confidence != null ? Number(scores.confidence) : null,
    };
    if (Object.keys(exp).length) {
      snapshot.wpm = exp.wpm != null ? Number(exp.wpm) : undefined;
      snapshot.fillers_per_100w = exp.fillers_per_100w != null ? Number(exp.fillers_per_100w) : undefined;
      snapshot.hedges_per_100w = exp.hedges_per_100w != null ? Number(exp.hedges_per_100w) : undefined;
      const starInfo = (exp.star as Record<string, unknown>) ?? {};
      snapshot.star_coverage = starInfo.coverage != null ? Number(starInfo.coverage) : undefined;
      const resultInfo = (exp.result_strength as Record<string, unknown>) ?? {};
      snapshot.result_strength = resultInfo.score != null ? Number(resultInfo.score) : undefined;
    } else if (transcript) {
      const fill = fillerStats(transcript);
      const hed = hedgeStats(transcript);
      const res = resultStrength(transcript);
      const star = starSegments(transcript);
      star.tags['r'] = res.score >= 0.35;
      star.coverage = Object.values(star.tags).filter(Boolean).length;
      snapshot.fillers_per_100w = fill.per_100w;
      snapshot.hedges_per_100w = hed.per_100w;
      snapshot.result_strength = res.score;
      snapshot.star_coverage = star.coverage;
      if (duration) {
        const tokens = tokenizeWords(transcript);
        snapshot.wpm = tokens.length / Math.max(0.001, duration / 60);
      }
    }
    return snapshot;
  });
}

function makeHistorySummary(
  snapshots: Snapshot[],
  currentMetrics: { fillers: { per_100w: number }; hedges: { per_100w: number }; result: { score: number }; star: { coverage: number }; wpm: number },
  currentTotal: number,
) {
  const summary = {
    attempt_count: snapshots.length,
    last_total: null as number | null,
    delta_total: null as number | null,
    best_total: null as number | null,
    avg_total: null as number | null,
    metric_deltas: {} as Record<string, number | null>,
    persisting_flags: [] as string[],
    last_metrics: snapshots[0] ?? {},
  };
  if (!snapshots.length) return summary;
  const last = snapshots[0]!;
  summary.last_total = last.total ?? null;
  const totals = snapshots.map((s) => s.total).filter((t): t is number => t != null);
  if (totals.length) {
    summary.best_total = Math.max(...totals);
    summary.avg_total = totals.reduce((a, b) => a + b, 0) / totals.length;
  }
  if (last.total != null) {
    summary.delta_total = Math.round((currentTotal - last.total) * 10) / 10;
  }
  const comparisons: Record<string, number> = {
    fillers_per_100w: currentMetrics.fillers.per_100w,
    hedges_per_100w: currentMetrics.hedges.per_100w,
    result_strength: currentMetrics.result.score,
    star_coverage: currentMetrics.star.coverage,
    wpm: currentMetrics.wpm,
  };
  for (const [key, currentVal] of Object.entries(comparisons)) {
    const prevVal = last[key];
    if (prevVal == null) {
      summary.metric_deltas[key] = null;
    } else {
      summary.metric_deltas[key] = Math.round((currentVal - prevVal) * 100) / 100;
    }
  }
  const persisting: string[] = [];
  if (last.result_strength != null && currentMetrics.result.score < 0.5 && last.result_strength < 0.5)
    persisting.push('result_strength');
  if (last.fillers_per_100w != null && currentMetrics.fillers.per_100w > 2.5 && last.fillers_per_100w > 2.5)
    persisting.push('fillers');
  if (last.star_coverage != null && currentMetrics.star.coverage < 3 && last.star_coverage < 3)
    persisting.push('structure');
  summary.persisting_flags = persisting;
  return summary;
}

// ---------- Main export ----------
export type ScoringResult = {
  overallScore: number;
  subscores: Record<string, number>;
  issues: Array<{ type: string; severity: string; evidenceSnippet: string; fixSuggestion: string }>;
  explain: { weights: Record<string, number>; signals: Record<string, number> };
  scores: Record<string, number>;
  explanations: Record<string, unknown>;
  detected: Record<string, unknown>;
  suggestions: string[];
  strengths: string[];
  history_summary: ReturnType<typeof makeHistorySummary>;
  question_alignment: ReturnType<typeof analyzeQuestionAlignment>;
  transcript: string;
  duration_seconds: number;
};

export function scoreAnswer(
  transcript: string,
  question: string,
  durationSeconds: number,
  history?: HistoryEntry[] | null,
  questionId?: string | null,
): ScoringResult {
  const tokens = tokenizeWords(transcript);
  const words = tokens.length;
  const minutes = Math.max(0.001, durationSeconds / 60.0);
  const wpm = words / minutes;

  const fillers = fillerStats(transcript);
  const hedges = hedgeStats(transcript);
  const actions = actionVerbDensity(transcript);
  const own = ownershipRatio(transcript);
  const quant = quantification(transcript);
  const sstats = sentenceStats(transcript);
  const star = starSegments(transcript);
  const res = resultStrength(transcript);
  const vag = vagueness(transcript);
  const reflection = reflectionPresence(transcript);
  const lexical = lexicalStats(tokens);
  const sequence = starSequenceSignal(transcript);

  const questionMetrics: Record<string, unknown> = {
    actions_density: actions.density,
    result_strength: res.score,
    has_numbers: quant.has_numbers,
    reflection: reflection.has_reflection,
    star_coverage: star.coverage,
    has_tradeoffs: keywordSignal(transcript, TRADEOFF_TERMS),
    has_requirements: keywordSignal(transcript, REQUIREMENTS_TERMS),
    has_reliability: keywordSignal(transcript, RELIABILITY_TERMS),
    has_edges: keywordSignal(transcript, EDGE_TERMS),
    has_complexity: keywordSignal(transcript, COMPLEXITY_TERMS),
    has_scaling: keywordSignal(transcript, SCALING_TERMS),
    has_data: keywordSignal(transcript, DATA_TERMS),
    has_api: keywordSignal(transcript, API_TERMS),
  };

  const questionAnalysis = analyzeQuestionAlignment(question, transcript, questionMetrics);
  star.tags['r'] = res.score >= 0.35;
  star.coverage = Object.values(star.tags).filter(Boolean).length;

  const snapshots = buildHistorySnapshots(history ?? []);
  const lastSnapshot = snapshots[0] ?? ({} as Snapshot);

  // Scoring components
  let clarity = 1.0;
  clarity -= clamp((fillers.per_100w - 1.8) / 6);
  clarity -= clamp((hedges.per_100w - 1.2) / 5);
  if (sstats.avg_len > 28) clarity -= 0.18;
  if (lexical.diversity < 0.36) clarity -= 0.12;
  else if (lexical.diversity > 0.52) clarity += 0.05;
  clarity = clamp(clarity);

  let pacing = 1.0;
  if (wpm < 100) pacing -= clamp((100 - wpm) / 80);
  else if (wpm > 190) pacing -= clamp((wpm - 190) / 90);
  if (durationSeconds < 50 || durationSeconds > 160) pacing -= 0.25;
  pacing = clamp(pacing);

  let struct = star.coverage / 4.0;
  if (sequence.ordered && star.coverage >= 3) struct += 0.15;
  if (reflection.has_reflection) struct += 0.05;
  struct = clamp(struct);

  let content = 0.0;
  content += clamp(actions.density / 0.018, 0, 0.45);
  content += 0.42 * res.score;
  content += quant.has_numbers ? 0.12 : 0.0;
  content += reflection.has_reflection ? 0.08 : 0.0;
  content -= Math.min(0.4, vag.penalty);
  content = clamp(content);

  let conf = 0.92;
  conf -= clamp(hedges.per_100w / 7);
  conf -= clamp((fillers.per_100w - 1.2) / 8);
  const ir = own.i_ratio;
  if (ir < 0.45) conf -= 0.2;
  else if (ir > 0.88) conf -= 0.08;
  if (reflection.has_reflection) conf += 0.03;
  conf = clamp(conf);

  const alignment = questionAnalysis.score;
  const topics = questionAnalysis.topics;
  const metTopics = topics.filter((t) => t.met).length;
  const topicRatio = topics.length ? metTopics / topics.length : 1.0;

  const sentenceCount = sstats.sentences.length;
  let brevityPenalty = 0.0;
  if (words < THRESHOLDS.min_tokens) {
    brevityPenalty = Math.min(0.7, (THRESHOLDS.min_tokens - words) / 80);
  }
  let brevityFactor = Math.max(0.2, 1.0 - brevityPenalty);
  if (sentenceCount < 2) brevityFactor = Math.max(0.2, brevityFactor * 0.5);

  const penalty = questionAnalysis.penalty;
  const structureFactor = Math.max(0.0, Math.min(alignment, topicRatio)) * brevityFactor;
  struct = clamp(struct * structureFactor);
  content = clamp(content * alignment * brevityFactor - penalty);
  clarity = clamp(clarity * (0.55 + 0.45 * alignment) * Math.max(0.3, brevityFactor));
  conf = clamp(conf * (0.6 + 0.4 * alignment) * Math.max(0.35, brevityFactor) - penalty * 0.5);
  pacing = clamp(pacing * (0.5 + 0.5 * alignment) * Math.max(0.35, brevityFactor));

  // History adjustments
  if (lastSnapshot.fillers_per_100w != null) {
    const deltaFillers = lastSnapshot.fillers_per_100w - fillers.per_100w;
    if (deltaFillers >= 0.5) clarity = clamp(clarity + Math.min(0.06, deltaFillers / 12));
    else if (deltaFillers <= -0.5) clarity -= Math.min(0.05, Math.abs(deltaFillers) / 10);
  }
  if (lastSnapshot.result_strength != null) {
    const deltaResult = res.score - lastSnapshot.result_strength;
    if (deltaResult >= 0.15) content = clamp(content + Math.min(0.06, deltaResult / 2));
    else if (deltaResult <= -0.15) content -= Math.min(0.06, Math.abs(deltaResult) / 2);
  }
  if (lastSnapshot.star_coverage != null && star.coverage >= 3 && lastSnapshot.star_coverage < 3) {
    struct = clamp(struct + 0.05);
  }
  if (lastSnapshot.wpm != null) {
    const deltaWpm = wpm - lastSnapshot.wpm;
    if (Math.abs(deltaWpm) > 25) pacing -= Math.min(0.08, Math.abs(deltaWpm) / 200);
  }

  const questionMode = inferMode(questionId ?? undefined, question);

  const subscoresRaw: Record<string, number> = {
    structure: struct,
    relevance: clamp(alignment),
    clarity,
    conciseness: clamp((1 - brevityPenalty + pacing) / 2),
    delivery: conf,
    technical: clamp(questionMode !== 'technical' ? content : Math.min(1.0, content + 0.1)),
  };

  if (questionMode === 'technical') {
    const missing = ['has_requirements', 'has_tradeoffs', 'has_complexity', 'has_edges'].filter((k) => !questionMetrics[k]).length;
    const techPenalty = Math.min(0.25, 0.05 * missing);
    if (techPenalty) {
      subscoresRaw.technical = clamp(subscoresRaw.technical! - techPenalty);
      subscoresRaw.relevance = clamp(subscoresRaw.relevance! - techPenalty * 0.6);
    }
  }

  if (questionMode === 'system_design') {
    const missing = ['has_requirements', 'has_scaling', 'has_data', 'has_tradeoffs', 'has_reliability'].filter((k) => !questionMetrics[k]).length;
    const sdPenalty = Math.min(0.3, 0.05 * missing);
    if (sdPenalty) {
      subscoresRaw.technical = clamp(subscoresRaw.technical! - sdPenalty);
      subscoresRaw.relevance = clamp(subscoresRaw.relevance! - sdPenalty * 0.6);
    }
  }

  if (durationSeconds > THRESHOLDS.ideal_duration * 1.4) {
    subscoresRaw.conciseness = clamp(subscoresRaw.conciseness! - 0.2);
  }

  const subscores: Record<string, number> = Object.fromEntries(
    Object.entries(subscoresRaw).map(([k, v]) => [k, Math.round(v * 100 * 10) / 10]),
  );

  const weightSum = Object.keys(subscoresRaw).reduce((s, k) => s + (WEIGHTS[k] ?? 0), 0);
  const overall = weightSum
    ? Math.round((Object.entries(subscoresRaw).reduce((s, [k, v]) => s + v * (WEIGHTS[k] ?? 0), 0) / weightSum) * 100 * 10) / 10
    : Math.round((Object.values(subscores).reduce((a, b) => a + b, 0) / Object.values(subscores).length) * 10) / 10;

  const currentMetrics = { fillers, hedges, result: res, star, wpm };
  const historySummary = makeHistorySummary(snapshots, currentMetrics, overall);

  // Issues
  const issues: ScoringResult['issues'] = [];
  if (subscoresRaw.structure! < 0.6 && sstats.sentences[0]) {
    issues.push({ type: 'missing_star', severity: 'medium', evidenceSnippet: sstats.sentences[0], fixSuggestion: 'Structure your answer with Situation, Task, Action, and Result.' });
  }
  if (subscoresRaw.relevance! < THRESHOLDS.relevance_floor && sstats.sentences[0]) {
    issues.push({ type: 'low_relevance', severity: 'medium', evidenceSnippet: sstats.sentences[0], fixSuggestion: 'Tie your answer more directly to the question prompt.' });
  }
  if (subscoresRaw.conciseness! < 0.55 && sstats.sentences[sstats.sentences.length - 1]) {
    issues.push({ type: 'rambling', severity: 'low', evidenceSnippet: sstats.sentences[sstats.sentences.length - 1]!, fixSuggestion: 'Aim for 1.5–2.5 minutes. Cut filler sentences.' });
  }
  if (fillers.per_100w > THRESHOLDS.max_filler_per_100) {
    issues.push({ type: 'filler_heavy', severity: 'low', evidenceSnippet: fillers.details.slice(0, 3).map(([t, c]) => `${t} (${c})`).join(', '), fixSuggestion: 'Pause instead of saying "um", "uh", or "like".' });
  }

  const suggestions = questionAnalysis.suggestions.slice(0, 3).length
    ? questionAnalysis.suggestions.slice(0, 3)
    : issues.slice(0, 3).map((i) => i.fixSuggestion);

  const strengths: string[] = [...(questionAnalysis.strengths.slice(0, 3))];
  if (subscoresRaw.delivery! > 0.8) strengths.push('Confident delivery with minimal hedging.');
  if (quant.has_numbers) strengths.push('Impact backed by metrics.');

  const explanations: Record<string, unknown> = {
    wpm: Math.round(wpm * 10) / 10,
    avg_sentence_len: Math.round(sstats.avg_len * 10) / 10,
    fillers_per_100w: Math.round(fillers.per_100w * 100) / 100,
    hedges_per_100w: Math.round(hedges.per_100w * 100) / 100,
    action_density: Math.round(actions.density * 10000) / 10000,
    i_we: own,
    quantification: quant,
    star,
    sequence,
    result_strength: res,
    vagueness: vag,
    lexical,
    reflection,
    question_alignment: questionAnalysis,
  };

  const detected: Record<string, unknown> = {
    fillers: fillers.details,
    hedges: hedges.details,
    action_verbs: actions.examples,
    numbers: quant.numbers,
    time_terms: quant.time_terms,
    sentences: sstats.sentences,
    reflection_phrases: reflection.phrases,
    question_alignment: questionAnalysis,
  };

  const explain = {
    weights: WEIGHTS,
    signals: {
      starCoverage: star.coverage,
      resultStrength: res.score,
      fillerRate: fillers.per_100w,
      hedgeRate: hedges.per_100w,
      wpm,
      avgSentenceLength: sstats.avg_len,
    },
  };

  return {
    overallScore: overall,
    subscores,
    issues,
    explain,
    scores: { ...subscores, total: overall },
    explanations,
    detected,
    suggestions,
    strengths: strengths.slice(0, 5),
    history_summary: historySummary,
    question_alignment: questionAnalysis,
    transcript,
    duration_seconds: durationSeconds,
  };
}
