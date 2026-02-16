import re
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ---------- Lexicons ----------
FILLERS = [
    "um", "uh", "er", "ah", "like", "you know", "kind of", "kinda",
    "sort of", "actually", "basically", "literally", "so yeah", "i mean"
]
HEDGES = [
    "maybe", "perhaps", "probably", "possibly", "i think", "i guess",
    "i believe", "i feel like", "sort of", "kind of", "somewhat", "a bit",
    "might", "could", "not sure", "to be honest", "i suppose"
]
ACTION_VERBS = [
    "built", "implemented", "designed", "led", "drove", "optimized", "reduced",
    "increased", "launched", "migrated", "refactored", "debugged", "delivered",
    "automated", "integrated", "owned", "shipped", "deployed", "scaled", "mentored",
    "verified", "configured", "reconfigured", "reproduced", "benchmarked", "profiled",
    "triaged", "isolated", "documented"
]

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "then", "this", "that", "these", "those",
    "to", "of", "in", "on", "for", "with", "by", "from", "about", "as", "at", "into",
    "is", "are", "was", "were", "be", "been", "being", "it", "its", "i", "we", "you",
    "my", "our", "your", "they", "their", "them", "he", "she", "his", "her",
    "how", "what", "why", "when", "where", "who", "which"
}

REQUIREMENTS_TERMS = ["requirement", "constraint", "goal", "scope", "assumption", "require", "must"]
TRADEOFF_TERMS = ["trade-off", "tradeoff", "cost", "latency", "throughput", "consistency", "availability"]
RELIABILITY_TERMS = ["retry", "timeout", "failover", "monitoring", "alert", "observability", "resilient", "fallback"]
EDGE_TERMS = ["edge case", "failure", "error", "bug", "exception", "rollback"]
COMPLEXITY_TERMS = ["big o", "complexity", "runtime", "memory", "space", "efficient", "performance"]
SCALING_TERMS = ["scale", "shard", "partition", "load", "cache", "queue", "cdn", "replica"]
DATA_TERMS = ["schema", "table", "index", "data model", "storage", "database"]
API_TERMS = ["api", "endpoint", "request", "response", "contract", "versioning"]
# Broader outcome / result phrases
RESULT_CUES = [
    "as a result", "resulted in", "so that", "thereby", "which led to",
    "leading to", "therefore", "ultimately", "in the end", "the outcome",
    "this helped", "this enabled", "we were able to", "users could", "the system could",
    "confirmed on the", "successfully", "we succeeded", "we achieved", "earned recognition",
    "unblocked", "fixed the issue", "resolved the issue", "passed tests", "met the goal", "met our goal"
]
SITUATION_CUES = [
    "at my internship", "at school", "on a project", "the situation", "the context",
    "when i", "while i", "our team was", "we were", "the problem was", "we faced", "one challenge"
]
TASK_CUES = [
    "my task", "i needed to", "i had to", "i was responsible for", "the goal was",
    "the objective was", "we needed to", "we had to"
]
ACTION_CUES = [
    "so i", "i decided to", "i started by", "i then", "i worked on", "i implemented",
    "we implemented", "i built", "we built", "i designed", "we designed", "i verified", "i debugged"
]
REFLECTION_CUES = [
    "i learned", "i realised", "i realized", "what i learned", "this taught me",
    "i would", "next time", "going forward", "i now", "i took away", "i discovered",
    "i will", "we learned", "lesson", "key takeaway"
]

VAGUE_PHRASES = [
    "some things", "stuff", "things", "technical issues", "it started working",
    "figured it out", "googling", "okay in the end", "tough but managed",
    "sort of worked", "kind of worked", "did some research", "did research"
]

NUMBER_RE = re.compile(r"(?<!\w)(?:\$?\d+(?:\.\d+)?%?|\d{1,3}(?:,\d{3})+%?)(?!\w)")
TIME_RE = re.compile(r"\b(days?|weeks?|months?|quarters?|years?)\b", re.I)

SENTENCE_SPLIT = re.compile(r'(?<=[.!?])\s+')
WORD_SPLIT = re.compile(r"\b[\w'-]+\b", re.I)


# ---------- Question mapping / rubrics ----------
def _normalize_question(text: str) -> str:
    return text.strip().lower().replace('’', "'")


QUESTION_TEXT_TO_ID = {
    _normalize_question('Tell me about a challenge you faced and how you handled it.'): 'challenge-star',
    _normalize_question('Describe a time you had a conflict on a team. What did you do?'): 'conflict',
    _normalize_question('What is a project you’re proud of? What was the impact?'): 'impact',
    _normalize_question("What's a project you're proud of? What was the impact?"): 'impact',
    _normalize_question('Tell me about a failure and what you learned.'): 'failure',
}

QUESTION_LIBRARY_PATH = Path(__file__).with_name("question_bank.json")
QUESTION_LIBRARY: List[Dict[str, Any]] = []
QUESTION_BY_ID: Dict[str, Dict[str, Any]] = {}
QUESTION_BY_TEXT: Dict[str, str] = {}

try:
    if QUESTION_LIBRARY_PATH.exists():
        QUESTION_LIBRARY = json.loads(QUESTION_LIBRARY_PATH.read_text())
        QUESTION_BY_ID = {q["slug"]: q for q in QUESTION_LIBRARY if q.get("slug")}
        QUESTION_BY_TEXT = {
            _normalize_question(q["prompt"]): q["slug"] for q in QUESTION_LIBRARY if q.get("prompt") and q.get("slug")
        }
except Exception:
    QUESTION_LIBRARY = []
    QUESTION_BY_ID = {}
    QUESTION_BY_TEXT = {}


QUESTION_RUBRICS: Dict[str, Dict[str, Any]] = {
    'challenge-star': {
        'title': 'Tell me about a challenge you faced and how you handled it.',
        'topics': [
            {
                'id': 'challenge_context',
                'label': 'Describe the specific challenge, constraint, or stakes',
                'weight': 0.28,
                'keywords': ['challenge', 'problem', 'pressure', 'blocked', 'obstacle', 'difficult', 'hard', 'tight deadline', 'complex', 'constraint', 'limited'],
                'remedy': 'Name the concrete challenge or constraint you were up against before acting.',
            },
            {
                'id': 'ownership_actions',
                'label': 'Explain the decisive actions you personally took',
                'weight': 0.27,
                'keywords': ['i decided', 'i started', 'i built', 'i implemented', 'i led', 'i partnered', 'i coordinated', 'i organized', 'i drove', 'i resolved'],
                'metric': {'name': 'actions_density', 'min': 0.015},
                'remedy': 'Spell out the concrete actions you personally took instead of general team effort.',
            },
            {
                'id': 'result',
                'label': 'Highlight a measurable or observable result',
                'weight': 0.27,
                'keywords': ['as a result', 'resulted', 'so that', 'increased', 'reduced', 'impact', 'outcome', 'improved', 'enabled'],
                'metric': {'name': 'result_strength', 'min': 0.55},
                'remedy': 'Close with a tangible outcome or metric so the impact is obvious.',
            },
            {
                'id': 'reflection',
                'label': 'Share what you learned or would do differently',
                'weight': 0.18,
                'keywords': ['learned', 'lesson', 'next time', 'i now', 'i realized', 'i realised', 'takeaway'],
                'metric': {'name': 'reflection', 'equals': True},
                'remedy': 'Add a quick takeaway to show how the experience levelled you up.',
            },
        ],
    },
    'conflict': {
        'title': 'Describe a time you had a conflict on a team. What did you do?',
        'topics': [
            {
                'id': 'conflict_setup',
                'label': 'Set the scene with the conflict and the other party',
                'weight': 0.3,
                'keywords': ['conflict', 'disagreement', 'tension', 'pushback', 'misaligned', 'difference of opinion', 'friction'],
                'remedy': 'Briefly name the disagreement and who was involved so the stakes are clear.',
            },
            {
                'id': 'other_party',
                'label': 'Reference the other stakeholder or team member',
                'weight': 0.18,
                'keywords': ['teammate', 'coworker', 'manager', 'stakeholder', 'partner', 'client'],
                'remedy': 'Mention who you worked with so it’s obvious this was a people challenge.',
            },
            {
                'id': 'collaboration_actions',
                'label': 'Explain how you listened, negotiated, or collaborated',
                'weight': 0.28,
                'keywords': ['listened', 'empathized', 'aligned', 'understood', 'compromise', 'talked through', 'facilitated', 'mediated', 'worked together'],
                'remedy': 'Describe the conversations or collaboration that resolved the conflict.',
            },
            {
                'id': 'resolution',
                'label': 'Provide a positive resolution and relationship outcome',
                'weight': 0.24,
                'keywords': ['resolved', 'came to agreement', 'aligned', 'relationship', 'trust', 'we agreed', 'win-win', 'moved forward'],
                'metric': {'name': 'result_strength', 'min': 0.45},
                'remedy': 'Show how the conflict ended and what improved afterwards.',
            },
        ],
        'negative_keywords': {
            'blame': ['their fault', 'they messed up', 'i blamed', 'they were wrong'],
        },
    },
    'impact': {
        'title': 'What is a project you’re proud of? What was the impact?',
        'topics': [
            {
                'id': 'project_overview',
                'label': 'Name the project and why it mattered',
                'weight': 0.25,
                'keywords': ['project', 'initiative', 'launched', 'built', 'designed', 'shipped', 'deployed'],
                'remedy': 'Introduce the project and the problem it solved before diving into impact.',
            },
            {
                'id': 'personal_role',
                'label': 'Clarify your personal ownership',
                'weight': 0.2,
                'keywords': ['i owned', 'i led', 'i was responsible', 'i spearheaded', 'i drove', 'i architected'],
                'metric': {'name': 'actions_density', 'min': 0.017},
                'remedy': 'Call out exactly what you did so the interviewer can credit you.',
            },
            {
                'id': 'impact_metric',
                'label': 'Highlight the outcome with numbers or scale',
                'weight': 0.35,
                'keywords': ['impact', 'result', 'increase', 'decrease', 'improved', 'customers', 'users', 'revenue', 'conversion', 'latency'],
                'metric': {'name': 'has_numbers', 'equals': True},
                'remedy': 'Bring in a metric or tangible before/after change to prove the impact.',
            },
            {
                'id': 'reflection',
                'label': 'Share what success unlocked or what you learned next',
                'weight': 0.2,
                'keywords': ['we learned', 'i learned', 'next time', 'this taught', 'this meant', 'as a result we could'],
                'metric': {'name': 'reflection', 'equals': True},
                'remedy': 'Close with the broader takeaway or what you tackled next because of the win.',
            },
        ],
    },
    'failure': {
        'title': 'Tell me about a failure and what you learned.',
        'topics': [
            {
                'id': 'admit_failure',
                'label': 'Clearly state the failure or mistake',
                'weight': 0.3,
                'keywords': ['failed', 'failure', 'mistake', 'missed', 'broke', 'went wrong', 'error', 'slipped'],
                'remedy': 'Be explicit about what went wrong so it feels candid.',
            },
            {
                'id': 'accountability',
                'label': 'Own your part without blaming others',
                'weight': 0.2,
                'keywords': ['my fault', 'i overlooked', 'i misjudged', 'i assumed', 'i underestimated', "i didn't"],
                'remedy': 'Explain your role in the failure instead of pushing blame outward.',
            },
            {
                'id': 'correction_actions',
                'label': 'Detail the actions you took to fix or mitigate',
                'weight': 0.25,
                'keywords': ['i fixed', 'i corrected', 'i addressed', 'i changed', 'i improved', 'i put in place', 'i reworked'],
                'remedy': 'Walk through the corrective steps you took to recover.',
            },
            {
                'id': 'lesson',
                'label': 'Share the learning and what you do differently now',
                'weight': 0.25,
                'keywords': ['since then', 'now i', 'i learned', 'i make sure', 'next time', 'i realised', 'i realized'],
                'metric': {'name': 'reflection', 'equals': True},
                'remedy': 'Wrap up with what you changed going forward to show growth.',
            },
        ],
        'negative_keywords': {
            'blame': ['their fault', 'they failed', 'they messed up'],
        },
    },
}


# ---------- Basic helpers ----------
def _lower(s: str) -> str:
    return s.lower().strip()


def tokenize_words(text: str) -> List[str]:
    return WORD_SPLIT.findall(text.lower())


def split_sentences(text: str) -> List[str]:
    text = text.strip()
    if not text:
        return []
    return SENTENCE_SPLIT.split(text)


def extract_keywords(text: str, limit: int = 8) -> List[str]:
    tokens = [t.lower() for t in WORD_SPLIT.findall(text)]
    filtered = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    uniq: List[str] = []
    for t in filtered:
        if t not in uniq:
            uniq.append(t)
        if len(uniq) >= limit:
            break
    return uniq


def keyword_signal(text: str, keywords: List[str]) -> bool:
    t = text.lower()
    return any(kw in t for kw in keywords)


def build_rubric_for_question(qid: Optional[str], question_text: str) -> Optional[Dict[str, Any]]:
    if qid and qid in QUESTION_RUBRICS:
        return QUESTION_RUBRICS[qid]

    entry = QUESTION_BY_ID.get(qid or "")
    if not entry and question_text:
        entry = QUESTION_BY_ID.get(QUESTION_BY_TEXT.get(_normalize_question(question_text), ""))
    if not entry and not question_text:
        return None

    mode = (entry.get("mode") if entry else None) or ("system_design" if "design" in question_text.lower() else "behavioral")
    prompt_keywords = extract_keywords(question_text)
    tags = (entry.get("tags", []) if entry else []) + (entry.get("competencies", []) if entry else [])
    tag_keywords = [t.replace("_", " ") for t in tags]

    if mode == "behavioral":
        topics = [
            {
                "id": "situation",
                "label": "Set context and stakes",
                "weight": 0.2,
                "keywords": SITUATION_CUES + prompt_keywords,
                "remedy": "Open with the situation or context to set stakes quickly.",
            },
            {
                "id": "task",
                "label": "Clarify your responsibility or goal",
                "weight": 0.18,
                "keywords": TASK_CUES + ["goal", "objective"] + prompt_keywords,
                "remedy": "State your role and what you needed to accomplish.",
            },
            {
                "id": "action",
                "label": "Describe decisive actions you took",
                "weight": 0.26,
                "keywords": ACTION_CUES + ACTION_VERBS + tag_keywords,
                "metric": {"name": "actions_density", "min": 0.014},
                "remedy": "Emphasize the actions you personally took, not the team in general.",
            },
            {
                "id": "result",
                "label": "Close with tangible results",
                "weight": 0.22,
                "keywords": RESULT_CUES + ["impact", "outcome", "improved"] + tag_keywords,
                "metric": {"name": "result_strength", "min": 0.45},
                "remedy": "Finish with a measurable or observable outcome.",
            },
            {
                "id": "reflection",
                "label": "Share a takeaway or learning",
                "weight": 0.14,
                "keywords": REFLECTION_CUES,
                "metric": {"name": "reflection", "equals": True},
                "remedy": "Add a quick takeaway or what you'd do differently next time.",
            },
        ]
        return {"title": question_text, "topics": topics}

    if mode == "technical":
        topics = [
            {
                "id": "problem",
                "label": "Frame the problem and constraints",
                "weight": 0.18,
                "keywords": REQUIREMENTS_TERMS + prompt_keywords,
                "metric": {"name": "has_requirements", "equals": True},
                "remedy": "Start by clarifying requirements, constraints, and goal.",
            },
            {
                "id": "approach",
                "label": "Propose a concrete approach",
                "weight": 0.22,
                "keywords": ["approach", "solution", "algorithm", "design", "plan"] + tag_keywords,
                "metric": {"name": "actions_density", "min": 0.012},
                "remedy": "Outline a step-by-step approach or algorithm.",
            },
            {
                "id": "correctness",
                "label": "Address correctness and edge cases",
                "weight": 0.18,
                "keywords": EDGE_TERMS + ["test", "verify", "validate"],
                "metric": {"name": "has_edges", "equals": True},
                "remedy": "Mention edge cases or how you would validate correctness.",
            },
            {
                "id": "complexity",
                "label": "Discuss performance or complexity",
                "weight": 0.2,
                "keywords": COMPLEXITY_TERMS + SCALING_TERMS,
                "metric": {"name": "has_complexity", "equals": True},
                "remedy": "Call out performance considerations or complexity.",
            },
            {
                "id": "tradeoffs",
                "label": "Explain tradeoffs",
                "weight": 0.22,
                "keywords": TRADEOFF_TERMS,
                "metric": {"name": "has_tradeoffs", "equals": True},
                "remedy": "State tradeoffs (latency vs cost, consistency vs availability, etc.).",
            },
        ]
        return {"title": question_text, "topics": topics}

    topics = [
        {
            "id": "requirements",
            "label": "Clarify requirements and constraints",
            "weight": 0.18,
            "keywords": REQUIREMENTS_TERMS + prompt_keywords,
            "metric": {"name": "has_requirements", "equals": True},
            "remedy": "Start by defining requirements, scale, and constraints.",
        },
        {
            "id": "architecture",
            "label": "Propose a high-level architecture",
            "weight": 0.22,
            "keywords": ["architecture", "components", "services", "pipeline"] + SCALING_TERMS + tag_keywords,
            "remedy": "Describe the major components and data flow.",
        },
        {
            "id": "data",
            "label": "Cover data model or storage",
            "weight": 0.18,
            "keywords": DATA_TERMS + ["cache", "index"],
            "metric": {"name": "has_data", "equals": True},
            "remedy": "Call out what data you store and where.",
        },
        {
            "id": "scale",
            "label": "Discuss scaling and reliability",
            "weight": 0.22,
            "keywords": SCALING_TERMS + RELIABILITY_TERMS,
            "metric": {"name": "has_scaling", "equals": True},
            "remedy": "Explain how the design handles scale, failures, and reliability.",
        },
        {
            "id": "tradeoffs",
            "label": "Explain tradeoffs",
            "weight": 0.2,
            "keywords": TRADEOFF_TERMS,
            "metric": {"name": "has_tradeoffs", "equals": True},
            "remedy": "State the tradeoffs you would make and why.",
        },
        {
            "id": "api",
            "label": "Define API or interaction surface",
            "weight": 0.1,
            "keywords": API_TERMS,
            "metric": {"name": "has_api", "equals": True},
            "remedy": "Outline the API or user interaction surface.",
        },
    ]
    return {"title": question_text, "topics": topics}


# ---------- Configuration ----------
CONFIG_PATH = Path(__file__).with_name("scoring_config.json")
DEFAULT_CONFIG = {
    "weights": {
        "structure": 0.22,
        "relevance": 0.2,
        "clarity": 0.18,
        "conciseness": 0.15,
        "delivery": 0.15,
        "technical": 0.1,
    },
    "thresholds": {
        "max_filler_per_100": 2.5,
        "max_avg_sentence": 32,
        "min_tokens": 80,
        "ideal_duration": 150,
    },
    "issues": {},
}

try:
    CONFIG = json.loads(CONFIG_PATH.read_text())
except FileNotFoundError:
    CONFIG = DEFAULT_CONFIG

WEIGHTS = CONFIG.get("weights", DEFAULT_CONFIG["weights"])
MODE_WEIGHTS = CONFIG.get("mode_weights", {})
THRESHOLDS = CONFIG.get("thresholds", DEFAULT_CONFIG["thresholds"])
ISSUE_DEFS = CONFIG.get("issues", {})

def clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def weight(label: str, mode: Optional[str] = None) -> float:
    if mode and mode in MODE_WEIGHTS:
        return float(MODE_WEIGHTS.get(mode, {}).get(label, WEIGHTS.get(label, 0)))
    return float(WEIGHTS.get(label, 0))


def infer_mode(question_id: Optional[str], question_text: str) -> str:
    text = (question_id or question_text or "").lower()
    if any(term in text for term in ["system", "architecture", "design"]):
        return "system_design"
    if any(term in text for term in ["technical", "code", "algorithm", "debug"]):
        return "technical"
    return "behavioral"


def issue_entry(key: str, snippet: str) -> Optional[Dict[str, str]]:
    meta = ISSUE_DEFS.get(key)
    if not meta:
        return None
    return {
        "type": meta.get("type", key),
        "severity": meta.get("severity", "medium"),
        "evidenceSnippet": snippet,
        "fixSuggestion": meta.get("message", ""),
    }


# ---------- Detectors ----------
def count_matches(text: str, terms: List[str]) -> List[Tuple[str, int]]:
    t = " " + _lower(text) + " "
    results = []
    for term in terms:
        cnt = len(re.findall(rf"(?<!\w){re.escape(term)}(?!\w)", t))
        if cnt > 0:
            results.append((term, cnt))
    return results


def filler_stats(text: str) -> Dict[str, Any]:
    matches = count_matches(text, FILLERS)
    total = sum(c for _, c in matches)
    words = max(1, len(tokenize_words(text)))
    rate_per_100 = (total / words) * 100
    return {"total": total, "per_100w": rate_per_100, "details": matches}


def hedge_stats(text: str) -> Dict[str, Any]:
    matches = count_matches(text, HEDGES)
    total = sum(c for _, c in matches)
    words = max(1, len(tokenize_words(text)))
    rate_per_100 = (total / words) * 100
    return {"total": total, "per_100w": rate_per_100, "details": matches}


def action_verb_density(text: str) -> Dict[str, Any]:
    tokens = tokenize_words(text)
    actions = [w for w in tokens if w in ACTION_VERBS]
    density = len(actions) / max(1, len(tokens))
    return {"count": len(actions), "density": density, "examples": actions[:10]}


def ownership_ratio(text: str) -> Dict[str, Any]:
    tokens = tokenize_words(text)
    i_ct = tokens.count("i")
    we_ct = tokens.count("we")
    total = i_ct + we_ct
    ratio = i_ct / total if total else 0.5
    return {"i": i_ct, "we": we_ct, "i_ratio": ratio}


def quantification(text: str) -> Dict[str, Any]:
    nums = NUMBER_RE.findall(text)
    times = TIME_RE.findall(text)
    return {"numbers": nums[:20], "has_numbers": bool(nums), "time_terms": times[:20]}


def sentence_stats(text: str) -> Dict[str, Any]:
    sents = [s.strip() for s in split_sentences(text) if s.strip()]
    if not sents:
        return {"avg_len": 0, "sentences": []}
    lens = [len(tokenize_words(s)) for s in sents]
    avg_len = sum(lens) / len(lens)
    return {"avg_len": avg_len, "sentences": sents[:40]}


def star_segments(text: str) -> Dict[str, Any]:
    tl = _lower(text)
    tags = {"s": False, "t": False, "a": False, "r": False}
    if any(c in tl for c in SITUATION_CUES):
        tags["s"] = True
    if any(c in tl for c in TASK_CUES):
        tags["t"] = True
    if any(c in tl for c in ACTION_CUES):
        tags["a"] = True
    return {"tags": tags, "coverage": sum(1 for v in tags.values() if v)}


def result_strength(text: str) -> Dict[str, Any]:
    """Score 0..1 based on explicit impact phrases, metrics, and result placement."""
    tl = _lower(text)
    sents = split_sentences(text)
    n = max(1, len(sents))
    end_idx = int(n * 0.7)  # last 30% treated as result region

    cue_hits = count_matches(text, RESULT_CUES)
    cue_score = min(1.0, sum(c for _, c in cue_hits) * 0.25)

    has_num = bool(NUMBER_RE.search(tl))
    num_score = 0.35 if has_num else 0.0

    end_text = " ".join(sents[end_idx:]).lower()
    end_cues = [
        "users could", "successfully", "enabled", "reduced", "increased",
        "confirmed", "recognized", "passed", "fixed", "resolved", "unblocked", "achieved"
    ]
    end_hits = sum(1 for c in end_cues if c in end_text)
    end_score = min(0.4, end_hits * 0.2)

    score = min(1.0, cue_score + num_score + end_score)
    details = {
        "cue_hits": cue_hits,
        "has_numbers": has_num,
        "end_hits": end_hits,
        "end_region": sents[end_idx:] if sents else []
    }
    return {"score": score, "details": details}


def vagueness_penalty(text: str) -> Dict[str, Any]:
    hits = count_matches(text, VAGUE_PHRASES)
    total = sum(c for _, c in hits)
    penalty = min(0.6, total * 0.2)
    return {"penalty": penalty, "hits": hits}


def reflection_presence(text: str) -> Dict[str, Any]:
    matches = count_matches(text, REFLECTION_CUES)
    return {
        "has_reflection": bool(matches),
        "phrases": [term for term, _ in matches][:3],
        "total": sum(c for _, c in matches)
    }


def lexical_stats(tokens: List[str]) -> Dict[str, Any]:
    if not tokens:
        return {"diversity": 0.0, "long_ratio": 0.0, "unique": 0}
    unique = len(set(tokens))
    long_words = sum(1 for t in tokens if len(t) >= 7)
    return {
        "diversity": unique / len(tokens),
        "long_ratio": long_words / len(tokens),
        "unique": unique
    }


def star_sequence_signal(text: str) -> Dict[str, Any]:
    tl = _lower(text)
    length = max(1, len(tl))
    labels = [
        ("s", SITUATION_CUES),
        ("t", TASK_CUES),
        ("a", ACTION_CUES),
        ("r", RESULT_CUES),
    ]
    positions: Dict[str, Optional[float]] = {}
    for label, cues in labels:
        idxs = [tl.find(c) for c in cues if c in tl]
        positions[label] = (min(idxs) / length) if idxs else None
    ordered_positions = [positions[l] for l in ["s", "t", "a", "r"] if positions[l] is not None]
    ordered = all(ordered_positions[i] < ordered_positions[i + 1] for i in range(len(ordered_positions) - 1))
    return {"positions": positions, "observed": sum(v is not None for v in positions.values()), "ordered": ordered}


def infer_question_id(provided_id: Optional[str], question_text: str) -> Optional[str]:
    if provided_id:
        candidate = provided_id.strip().lower()
        if candidate in QUESTION_RUBRICS or candidate in QUESTION_BY_ID:
            return candidate
        return candidate
    normalized = _normalize_question(question_text)
    if normalized in QUESTION_BY_TEXT:
        return QUESTION_BY_TEXT[normalized]
    for key, value in QUESTION_BY_TEXT.items():
        if key in normalized or normalized in key:
            return value
    if normalized in QUESTION_TEXT_TO_ID:
        return QUESTION_TEXT_TO_ID[normalized]
    for key, value in QUESTION_TEXT_TO_ID.items():
        if key in normalized or normalized in key:
            return value
    return None


def find_sentence_with_keyword(sentences: List[str], keyword: str) -> Optional[str]:
    kw = keyword.lower()
    for sent in sentences:
        if kw in sent.lower():
            return sent.strip()
    return None


def evaluate_metric(spec: Dict[str, Any], metrics: Dict[str, Any]) -> bool:
    if not spec:
        return False
    name = spec.get('name')
    if name is None:
        return False
    value = metrics.get(name)
    if value is None:
        return False
    if 'min' in spec:
        try:
            return float(value) >= float(spec['min'])
        except (TypeError, ValueError):
            return False
    if 'max' in spec:
        try:
            return float(value) <= float(spec['max'])
        except (TypeError, ValueError):
            return False
    if 'equals' in spec:
        return bool(value) == bool(spec['equals'])
    return False


def analyze_question_alignment(
    question_id: Optional[str],
    question_text: str,
    transcript: str,
    metrics: Dict[str, Any],
) -> Dict[str, Any]:
    qid = infer_question_id(question_id, question_text)
    rubric = build_rubric_for_question(qid, question_text)
    if not rubric:
        return {
            'question_id': qid,
            'score': 1.0,
            'topics': [],
            'missing_topics': [],
            'suggestions': [],
            'strengths': [],
            'penalty': 0.0,
        }
    transcript_lower = _lower(transcript)
    sentences = split_sentences(transcript)

    topic_results: List[Dict[str, Any]] = []
    total_weight = sum(topic.get('weight', 0.0) for topic in rubric['topics']) or 1.0
    earned = 0.0
    suggestions: List[str] = []
    strengths: List[str] = []

    for topic in rubric['topics']:
        weight = float(topic.get('weight', 0.0))
        keywords = topic.get('keywords', [])
        metric_spec = topic.get('metric')

        keyword_hits = [kw for kw in keywords if kw in transcript_lower]
        metric_hit = evaluate_metric(metric_spec, metrics) if metric_spec else False
        hit = bool(keyword_hits) or metric_hit

        evidence = None
        if keyword_hits:
            for kw in keyword_hits:
                evidence = find_sentence_with_keyword(sentences, kw)
                if evidence:
                    break
        if not evidence and metric_hit and sentences:
            evidence = sentences[-1].strip()

        if hit:
            earned += weight
            strengths.append(topic['label'])
        else:
            suggestions.append(topic.get('remedy', topic['label']))

        topic_results.append({
            'id': topic['id'],
            'label': topic['label'],
            'met': hit,
            'weight': weight,
            'evidence': evidence,
            'keywords_hit': keyword_hits,
            'metric_used': metric_hit,
        })

    score = earned / total_weight

    penalty = 0.0
    negative_details = []
    for label, patterns in rubric.get('negative_keywords', {}).items():
        hits = [p for p in patterns if p in transcript_lower]
        if hits:
            negative_details.extend(hits)
            penalty += min(0.12 * len(hits), 0.25)

    if penalty:
        suggestions.append('Avoid phrasing that sounds like blame; focus on your ownership and collaboration.')

    return {
        'question_id': qid,
        'score': max(0.0, min(1.0, score)),
        'topics': topic_results,
        'missing_topics': [topic['label'] for topic, result in zip(rubric['topics'], topic_results) if not result['met']],
        'suggestions': suggestions,
        'strengths': strengths,
        'penalty': penalty,
        'negative_hits': negative_details,
    }


# ---------- History helpers ----------
def safe_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _ensure_dict(value: Any) -> Dict[str, Any]:
    if isinstance(value, dict):
        return value
    return {}


def build_history_snapshots(history: List[Any]) -> List[Dict[str, Any]]:
    snapshots: List[Dict[str, Any]] = []
    for entry in history or []:
        if not isinstance(entry, dict):
            continue
        scores_raw = entry.get("scores")
        scores = _ensure_dict(scores_raw)
        explanations_raw = entry.get("explanations")
        explanations = _ensure_dict(explanations_raw)
        transcript = entry.get("transcript") or ""
        duration = safe_float(entry.get("duration_seconds"))
        snapshot: Dict[str, Any] = {
            "total": safe_float(scores.get("total")),
            "clarity": safe_float(scores.get("clarity")),
            "concision": safe_float(scores.get("concision")),
            "content": safe_float(scores.get("content")),
            "confidence": safe_float(scores.get("confidence")),
        }
        if explanations:
            snapshot["wpm"] = safe_float(explanations.get("wpm"))
            snapshot["avg_sentence_len"] = safe_float(explanations.get("avg_sentence_len"))
            snapshot["fillers_per_100w"] = safe_float(explanations.get("fillers_per_100w"))
            snapshot["hedges_per_100w"] = safe_float(explanations.get("hedges_per_100w"))
            star_info = _ensure_dict(explanations.get("star"))
            snapshot["star_coverage"] = safe_float(star_info.get("coverage"))
            result_info = _ensure_dict(explanations.get("result_strength"))
            snapshot["result_strength"] = safe_float(result_info.get("score"))
        else:
            # derive lightweight metrics from transcript when explanations are absent
            if transcript:
                fill = filler_stats(transcript)
                hed = hedge_stats(transcript)
                res = result_strength(transcript)
                star = star_segments(transcript)
                star["tags"]["r"] = res["score"] >= 0.35
                star["coverage"] = sum(1 for v in star["tags"].values() if v)
                snapshot["fillers_per_100w"] = fill["per_100w"]
                snapshot["hedges_per_100w"] = hed["per_100w"]
                snapshot["result_strength"] = res["score"]
                snapshot["star_coverage"] = star["coverage"]
                tokens = tokenize_words(transcript)
                if duration:
                    minutes = max(0.001, duration / 60.0)
                    snapshot["wpm"] = len(tokens) / minutes
        snapshots.append(snapshot)
    return snapshots


def make_history_summary(
    snapshots: List[Dict[str, Any]],
    current_metrics: Dict[str, Any],
    current_total: float
) -> Dict[str, Any]:
    summary = {
        "attempt_count": len(snapshots),
        "last_total": None,
        "delta_total": None,
        "best_total": None,
        "avg_total": None,
        "metric_deltas": {},
        "persisting_flags": [],
        "last_metrics": snapshots[0] if snapshots else {},
    }
    if not snapshots:
        return summary

    last = snapshots[0]
    summary["last_total"] = last.get("total")
    totals = [s["total"] for s in snapshots if s.get("total") is not None]
    if totals:
        summary["best_total"] = max(totals)
        summary["avg_total"] = sum(totals) / len(totals)
    if last.get("total") is not None and current_total is not None:
        summary["delta_total"] = round(current_total - last["total"], 1)

    metric_deltas: Dict[str, Optional[float]] = {}
    comparisons = {
        "fillers_per_100w": current_metrics["fillers"]["per_100w"],
        "hedges_per_100w": current_metrics["hedges"]["per_100w"],
        "result_strength": current_metrics["result"]["score"],
        "star_coverage": current_metrics["star"]["coverage"],
        "wpm": current_metrics["wpm"],
    }
    for key, current_val in comparisons.items():
        prev_val = last.get(key)
        if prev_val is None or current_val is None:
            metric_deltas[key] = None
        else:
            metric_deltas[key] = round(current_val - prev_val, 2)
    summary["metric_deltas"] = metric_deltas

    persisting: List[str] = []
    if last.get("result_strength") is not None and current_metrics["result"]["score"] < 0.5 and last["result_strength"] < 0.5:
        persisting.append("result_strength")
    if last.get("fillers_per_100w") is not None and current_metrics["fillers"]["per_100w"] > 2.5 and last["fillers_per_100w"] > 2.5:
        persisting.append("fillers")
    if last.get("star_coverage") is not None and current_metrics["star"]["coverage"] < 3 and last["star_coverage"] < 3:
        persisting.append("structure")
    summary["persisting_flags"] = persisting
    return summary


# ---------- Scoring ----------
def score_answer(
    question: str,
    transcript: str,
    duration_seconds: int,
    history: Optional[List[Dict[str, Any]]] = None,
    question_id: Optional[str] = None,
    video_metrics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    tokens = tokenize_words(transcript)
    words = len(tokens)
    minutes = max(0.001, duration_seconds / 60.0)
    wpm = words / minutes

    fillers = filler_stats(transcript)
    hedges = hedge_stats(transcript)
    actions = action_verb_density(transcript)
    own = ownership_ratio(transcript)
    quant = quantification(transcript)
    sstats = sentence_stats(transcript)
    star = star_segments(transcript)
    res = result_strength(transcript)
    vag = vagueness_penalty(transcript)
    reflection = reflection_presence(transcript)
    lexical = lexical_stats(tokens)
    sequence = star_sequence_signal(transcript)

    question_metrics = {
        'actions_density': actions['density'],
        'result_strength': res['score'],
        'has_numbers': quant['has_numbers'],
        'reflection': reflection['has_reflection'],
        'star_coverage': star['coverage'],
        'has_tradeoffs': keyword_signal(transcript, TRADEOFF_TERMS),
        'has_requirements': keyword_signal(transcript, REQUIREMENTS_TERMS),
        'has_reliability': keyword_signal(transcript, RELIABILITY_TERMS),
        'has_edges': keyword_signal(transcript, EDGE_TERMS),
        'has_complexity': keyword_signal(transcript, COMPLEXITY_TERMS),
        'has_scaling': keyword_signal(transcript, SCALING_TERMS),
        'has_data': keyword_signal(transcript, DATA_TERMS),
        'has_api': keyword_signal(transcript, API_TERMS),
    }
    question_analysis = analyze_question_alignment(question_id, question, transcript, question_metrics)

    star["tags"]["r"] = res["score"] >= 0.35
    star["coverage"] = sum(1 for v in star["tags"].values() if v)

    snapshots = build_history_snapshots(history or [])
    last_snapshot = snapshots[0] if snapshots else {}

    clarity = 1.0
    clarity -= clamp((fillers["per_100w"] - 1.8) / 6)
    clarity -= clamp((hedges["per_100w"] - 1.2) / 5)
    if sstats["avg_len"] > 28:
        clarity -= 0.18
    if lexical["diversity"] < 0.36:
        clarity -= 0.12
    elif lexical["diversity"] > 0.52:
        clarity += 0.05
    clarity = clamp(clarity)

    pacing = 1.0
    if wpm < 100:
        pacing -= clamp((100 - wpm) / 80)
    elif wpm > 190:
        pacing -= clamp((wpm - 190) / 90)
    if duration_seconds < 50 or duration_seconds > 160:
        pacing -= 0.25
    pacing = clamp(pacing)

    struct = star["coverage"] / 4.0
    if sequence["ordered"] and star["coverage"] >= 3:
        struct += 0.15
    if reflection["has_reflection"]:
        struct += 0.05
    struct = clamp(struct)

    content = 0.0
    content += clamp(actions["density"] / 0.018, 0, 0.45)
    content += 0.42 * res["score"]
    content += 0.12 if quant["has_numbers"] else 0.0
    content += 0.08 if reflection["has_reflection"] else 0.0
    content -= min(0.4, vag["penalty"])
    content = clamp(content)

    conf = 0.92
    conf -= clamp(hedges["per_100w"] / 7)
    conf -= clamp((fillers["per_100w"] - 1.2) / 8)
    ir = own["i_ratio"]
    if ir < 0.45:
        conf -= 0.2
    elif ir > 0.88:
        conf -= 0.08
    if reflection["has_reflection"]:
        conf += 0.03
    conf = clamp(conf)
    
    video_issues = []
    if video_metrics and not video_metrics.get("error"):
        # Video confidence adjustment
        ec = video_metrics.get("eye_contact_score", 0.0)
        fp = video_metrics.get("face_presence_score", 0.0)
        
        if ec >= 0.7:
            conf += 0.06
        elif ec < 0.3:
            conf -= 0.08
            entry = issue_entry("poor_eye_contact", f"Eye contact was low ({int(ec*100)}%).")
            if entry: video_issues.append(entry)
            
        if fp < 0.5:
            conf -= 0.1
            entry = issue_entry("face_not_visible", f"Face only visible in {int(fp*100)}% of frames.")
            if entry: video_issues.append(entry)

        # Cap confidence with video
        conf = clamp(conf)

    alignment = question_analysis['score']
    topics = question_analysis.get('topics', [])
    met_topics = sum(1 for topic in topics if topic.get('met'))
    topic_ratio = met_topics / len(topics) if topics else 1.0

    sentence_count = len(sstats['sentences'])
    brevity_penalty = 0.0
    if words < THRESHOLDS.get("min_tokens", 80):
        brevity_penalty = min(0.7, (THRESHOLDS.get("min_tokens", 80) - words) / 80)
    brevity_factor = max(0.2, 1.0 - brevity_penalty)
    if sentence_count < 2:
        brevity_factor = max(0.2, brevity_factor * 0.5)

    penalty = question_analysis.get('penalty', 0.0)

    structure_factor = max(0.0, min(alignment, topic_ratio)) * brevity_factor
    struct = clamp(struct * structure_factor)

    content = clamp(content * alignment * brevity_factor - penalty)

    clarity = clamp(clarity * (0.55 + 0.45 * alignment) * max(0.3, brevity_factor))
    conf = clamp(conf * (0.6 + 0.4 * alignment) * max(0.35, brevity_factor) - penalty * 0.5)
    pacing = clamp(pacing * (0.5 + 0.5 * alignment) * max(0.35, brevity_factor))

    short_answer = words < THRESHOLDS.get("min_tokens", 80) or sentence_count < 2

    previous_fillers = last_snapshot.get("fillers_per_100w")
    previous_result = last_snapshot.get("result_strength")
    previous_wpm = last_snapshot.get("wpm")
    previous_star = last_snapshot.get("star_coverage")

    if previous_fillers is not None:
        delta_fillers = previous_fillers - fillers["per_100w"]
        if delta_fillers >= 0.5:
            clarity = clamp(clarity + min(0.06, delta_fillers / 12))
        elif delta_fillers <= -0.5:
            clarity -= min(0.05, abs(delta_fillers) / 10)

    if previous_result is not None:
        delta_result = res["score"] - previous_result
        if delta_result >= 0.15:
            content = clamp(content + min(0.06, delta_result / 2))
        elif delta_result <= -0.15:
            content -= min(0.06, abs(delta_result) / 2)

    if previous_star is not None and star["coverage"] >= 3 > previous_star:
        struct = clamp(struct + 0.05)

    if previous_wpm is not None:
        delta_wpm = wpm - previous_wpm
        if abs(delta_wpm) > 25:
            pacing -= min(0.08, abs(delta_wpm) / 200)

    question_mode = infer_mode(question_id, question)

    subscores_raw = {
        "structure": struct,
        "relevance": clamp(alignment),
        "clarity": clarity,
        "conciseness": clamp(1 - brevity_penalty),
        "delivery": conf,
        "technical": clamp(content if question_mode != "technical" else min(1.0, content + 0.1)),
    }
    # Mode-specific penalties for missing critical technical content.
    if question_mode == "technical":
        missing = []
        if not question_metrics.get("has_requirements"):
            missing.append("requirements")
        if not question_metrics.get("has_tradeoffs"):
            missing.append("tradeoffs")
        if not question_metrics.get("has_complexity"):
            missing.append("complexity")
        if not question_metrics.get("has_edges"):
            missing.append("edge cases")
        penalty = min(0.25, 0.05 * len(missing))
        if penalty:
            subscores_raw["technical"] = clamp(subscores_raw["technical"] - penalty)
            subscores_raw["relevance"] = clamp(subscores_raw["relevance"] - penalty * 0.6)

    if question_mode == "system_design":
        missing = []
        if not question_metrics.get("has_requirements"):
            missing.append("requirements")
        if not question_metrics.get("has_scaling"):
            missing.append("scaling")
        if not question_metrics.get("has_data"):
            missing.append("data model")
        if not question_metrics.get("has_tradeoffs"):
            missing.append("tradeoffs")
        if not question_metrics.get("has_reliability"):
            missing.append("reliability")
        penalty = min(0.3, 0.05 * len(missing))
        if penalty:
            subscores_raw["technical"] = clamp(subscores_raw["technical"] - penalty)
            subscores_raw["relevance"] = clamp(subscores_raw["relevance"] - penalty * 0.6)
    conciseness_raw = subscores_raw["conciseness"]
    if duration_seconds > THRESHOLDS.get("ideal_duration", 150) * 1.4:
        conciseness_raw = clamp(conciseness_raw - 0.2)
        subscores_raw["conciseness"] = conciseness_raw

    subscores = {k: round(v * 100, 1) for k, v in subscores_raw.items()}

    weight_sum = sum(weight(k, question_mode) for k in subscores_raw)
    overall = 0.0
    for key, value in subscores_raw.items():
        overall += value * weight(key, question_mode)
    overall = round((overall / weight_sum) * 100, 1) if weight_sum else round(sum(subscores.values()) / len(subscores), 1)

    current_metrics = {
        "fillers": fillers,
        "hedges": hedges,
        "result": res,
        "star": star,
        "wpm": wpm,
    }
    history_summary = make_history_summary(snapshots, current_metrics, overall)

    issues: List[Dict[str, str]] = []
    if subscores_raw["structure"] < 0.6:
        entry = issue_entry("structure_missing", sstats["sentences"][0] if sstats["sentences"] else transcript[:120])
        if entry:
            issues.append(entry)
    relevance_floor = THRESHOLDS.get("relevance_floor", 0.5)
    relevance_hard = THRESHOLDS.get("relevance_hard_floor", 0.35)
    if subscores_raw["relevance"] < relevance_floor:
        entry = issue_entry("low_relevance", sstats["sentences"][0] if sstats["sentences"] else transcript[:120])
        if entry:
            issues.append(entry)
    if subscores_raw["relevance"] < relevance_hard:
        entry = issue_entry("off_prompt", sstats["sentences"][0] if sstats["sentences"] else transcript[:120])
        if entry:
            issues.append(entry)
    if subscores_raw["conciseness"] < 0.55:
        entry = issue_entry("rambling", sstats["sentences"][-1] if sstats["sentences"] else transcript[-120:])
        if entry:
            issues.append(entry)
    if fillers["per_100w"] > THRESHOLDS.get("max_filler_per_100", 2.5):
        entry = issue_entry("filler_heavy", ", ".join(f"{term} ({cnt})" for term, cnt in fillers["details"][:3]))
        if entry:
            issues.append(entry)
    
    # Append video issues
    issues.extend(video_issues)

    suggestions = [issue["fixSuggestion"] for issue in issues[:3]]

    strengths: List[str] = []
    if subscores_raw["structure"] > 0.75:
        strengths.append("Clear STAR structure throughout the answer.")
    if subscores_raw["relevance"] > 0.75:
        strengths.append("Answer stays tightly aligned to the prompt.")
    if subscores_raw["delivery"] > 0.8:
        strengths.append("Confident delivery with minimal hedging.")
    if quant["has_numbers"]:
        strengths.append("Impact backed by metrics.")
    if video_metrics and video_metrics.get("eye_contact_score", 0) > 0.75:
        strengths.append("Strong eye contact engaged the audience.")

    explanations = {
        "wpm": round(wpm, 1),
        "avg_sentence_len": round(sstats["avg_len"], 1),
        "fillers_per_100w": round(fillers["per_100w"], 2),
        "hedges_per_100w": round(hedges["per_100w"], 2),
        "action_density": round(actions["density"], 4),
        "i_we": own,
        "quantification": quant,
        "star": star,
        "sequence": sequence,
        "result_strength": res,
        "vagueness": vag,
        "lexical": lexical,
        "reflection": reflection,
        "question_alignment": question_analysis,
        "video_metrics": video_metrics
    }

    detected = {
        "fillers": fillers["details"],
        "hedges": hedges["details"],
        "action_verbs": actions["examples"],
        "numbers": quant["numbers"],
        "time_terms": quant["time_terms"],
        "sentences": sstats["sentences"],
        "reflection_phrases": reflection["phrases"],
        "question_alignment": question_analysis,
    }

    explain = {
        "weights": MODE_WEIGHTS.get(question_mode, WEIGHTS),
        "signals": {
            "starCoverage": star["coverage"],
            "resultStrength": res["score"],
            "fillerRate": fillers["per_100w"],
            "hedgeRate": hedges["per_100w"],
            "wpm": wpm,
            "avgSentenceLength": sstats["avg_len"],
        },
    }

    legacy_scores = {**subscores, "total": overall}

    return {
        "overallScore": overall,
        "subscores": subscores,
        "issues": issues,
        "explain": explain,
        "scores": legacy_scores,
        "explanations": explanations,
        "detected": detected,
        "suggestions": suggestions,
        "strengths": strengths[:5],
        "history_summary": history_summary,
        "question_alignment": question_analysis,
    }
