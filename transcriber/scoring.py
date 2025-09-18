import re
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
        if candidate in QUESTION_RUBRICS:
            return candidate
    normalized = _normalize_question(question_text)
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
    if not qid or qid not in QUESTION_RUBRICS:
        return {
            'question_id': qid,
            'score': 1.0,
            'topics': [],
            'missing_topics': [],
            'suggestions': [],
            'strengths': [],
            'penalty': 0.0,
        }

    rubric = QUESTION_RUBRICS[qid]
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
def bounded(score: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, score))


def score_answer(
    question: str,
    transcript: str,
    duration_seconds: int,
    history: Optional[List[Dict[str, Any]]] = None,
    question_id: Optional[str] = None,
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
    }
    question_analysis = analyze_question_alignment(question_id, question, transcript, question_metrics)

    star["tags"]["r"] = res["score"] >= 0.35
    star["coverage"] = sum(1 for v in star["tags"].values() if v)

    snapshots = build_history_snapshots(history or [])
    last_snapshot = snapshots[0] if snapshots else {}

    clarity = 1.0
    clarity -= bounded((fillers["per_100w"] - 1.8) / 6, 0, 0.7)
    clarity -= bounded((hedges["per_100w"] - 1.2) / 5, 0, 0.5)
    if sstats["avg_len"] > 28:
        clarity -= 0.18
    if lexical["diversity"] < 0.36:
        clarity -= 0.12
    elif lexical["diversity"] > 0.52:
        clarity += 0.05
    clarity = bounded(clarity)

    pacing = 1.0
    if wpm < 100:
        pacing -= bounded((100 - wpm) / 80, 0, 0.6)
    elif wpm > 190:
        pacing -= bounded((wpm - 190) / 90, 0, 0.6)
    if duration_seconds < 50 or duration_seconds > 160:
        pacing -= 0.25
    pacing = bounded(pacing)

    struct = star["coverage"] / 4.0
    if sequence["ordered"] and star["coverage"] >= 3:
        struct += 0.15
    if reflection["has_reflection"]:
        struct += 0.05
    struct = bounded(struct)

    content = 0.0
    content += bounded(actions["density"] / 0.018, 0, 0.45)
    content += 0.42 * res["score"]
    content += 0.12 if quant["has_numbers"] else 0.0
    content += 0.08 if reflection["has_reflection"] else 0.0
    content -= min(0.4, vag["penalty"])
    content = bounded(content)

    conf = 0.92
    conf -= bounded(hedges["per_100w"] / 7, 0, 0.6)
    conf -= bounded((fillers["per_100w"] - 1.2) / 8, 0, 0.3)
    ir = own["i_ratio"]
    if ir < 0.45:
        conf -= 0.2
    elif ir > 0.88:
        conf -= 0.08
    if reflection["has_reflection"]:
        conf += 0.03
    conf = bounded(conf)

    alignment = question_analysis['score']
    topics = question_analysis.get('topics', [])
    met_topics = sum(1 for topic in topics if topic.get('met'))
    topic_ratio = met_topics / len(topics) if topics else 1.0

    sentence_count = len(sstats['sentences'])
    brevity_penalty = 0.0
    if words < 80:
        brevity_penalty = min(0.7, (80 - words) / 80)
    brevity_factor = max(0.2, 1.0 - brevity_penalty)
    if sentence_count < 2:
        brevity_factor = max(0.2, brevity_factor * 0.5)

    penalty = question_analysis.get('penalty', 0.0)

    structure_factor = max(0.0, min(alignment, topic_ratio)) * brevity_factor
    struct = bounded(struct * structure_factor)

    content = bounded(content * alignment * brevity_factor - penalty)

    clarity = bounded(clarity * (0.55 + 0.45 * alignment) * max(0.3, brevity_factor))
    conf = bounded(conf * (0.6 + 0.4 * alignment) * max(0.35, brevity_factor) - penalty * 0.5)
    pacing = bounded(pacing * (0.5 + 0.5 * alignment) * max(0.35, brevity_factor))

    short_answer = words < 50 or sentence_count < 2

    # Adaptive nudges based on most recent attempt
    previous_fillers = last_snapshot.get("fillers_per_100w")
    previous_result = last_snapshot.get("result_strength")
    previous_wpm = last_snapshot.get("wpm")
    previous_star = last_snapshot.get("star_coverage")

    if previous_fillers is not None:
        delta_fillers = previous_fillers - fillers["per_100w"]
        if delta_fillers >= 0.5:
            clarity = bounded(clarity + min(0.06, delta_fillers / 12))
        elif delta_fillers <= -0.5:
            clarity -= min(0.05, abs(delta_fillers) / 10)

    if previous_result is not None:
        delta_result = res["score"] - previous_result
        if delta_result >= 0.15:
            content = bounded(content + min(0.06, delta_result / 2))
        elif delta_result <= -0.15:
            content -= min(0.06, abs(delta_result) / 2)

    if previous_star is not None and star["coverage"] >= 3 > previous_star:
        struct = bounded(struct + 0.05)

    if previous_wpm is not None:
        delta_wpm = wpm - previous_wpm
        if abs(delta_wpm) > 25:
            pacing -= min(0.08, abs(delta_wpm) / 200)

    scores = {
        "structure": round(struct * 25, 1),
        "clarity": round(clarity * 20, 1),
        "concision": round(pacing * 10, 1),
        "content": round(content * 30, 1),
        "confidence": round(conf * 15, 1),
    }
    total = round(sum(scores.values()), 1)
    scores["total"] = total

    current_metrics = {
        "fillers": fillers,
        "hedges": hedges,
        "result": res,
        "star": star,
        "wpm": wpm,
    }
    history_summary = make_history_summary(snapshots, current_metrics, total)

    focus_candidates: List[Tuple[float, str]] = []
    focus_seen: set = set()

    def add_focus(priority: float, text: str) -> None:
        if text not in focus_seen:
            focus_candidates.append((priority, text))
            focus_seen.add(text)

    if short_answer:
        add_focus(0.995, 'Expand your answer with concrete situation, actions, and results—this was too brief to evaluate.')

    for idx, text_focus in enumerate(question_analysis['suggestions']):
        add_focus(0.98 - idx * 0.02, text_focus)

    missing_tags = [k.upper() for k, v in star['tags'].items() if not v]
    if missing_tags:
        add_focus(0.95, f"Cover all STAR parts; you still need {', '.join(missing_tags)} in this story.")
    if res["score"] < 0.5:
        add_focus(0.9, "Make the result explicit near the end with concrete impact (metrics, user outcome).")
    if not quant["has_numbers"]:
        add_focus(0.75, "Quantify impact (%, time saved, errors reduced, users reached).")
    if fillers["per_100w"] > 2.2:
        add_focus(0.7, f"Reduce fillers—heard ~{fillers['per_100w']:.1f}/100w (target ≤1.5). Practice pausing before key points.")
    if hedges["per_100w"] > 1.6:
        add_focus(0.65, "Trim hedging phrases (swap 'I think' for confident action verbs).")
    if vag["penalty"] > 0:
        vague_words = ", ".join([w for w, _ in vag["hits"][:3]])
        add_focus(0.6, f"Be more specific; avoid vague phrasing ({vague_words}). Give concrete steps.")
    if not reflection["has_reflection"]:
        add_focus(0.45, "Close with a quick reflection or learning for continued growth.")
    if lexical["diversity"] < 0.35:
        add_focus(0.4, "Vary language—repeat fewer phrases and add unique specifics to each section.")
    if wpm < 110 or wpm > 175:
        add_focus(0.5, f"Adjust pacing to ~110–170 WPM (currently {int(round(wpm))} WPM).")

    if history_summary["delta_total"] is not None and history_summary["delta_total"] < -2:
        add_focus(1.0, f"Overall score dipped {abs(history_summary['delta_total']):.1f} vs last attempt—review your structure and clarity notes before re-running.")

    metric_deltas = history_summary.get("metric_deltas", {})
    delta_fillers = metric_deltas.get("fillers_per_100w")
    if delta_fillers is not None and delta_fillers > 0.4:
        add_focus(0.7, f"Fillers crept up by +{delta_fillers:.1f}/100w compared with last run; reset with deliberate pauses.")
    delta_result = metric_deltas.get("result_strength")
    if delta_result is not None and delta_result < -0.15:
        add_focus(0.8, "Impact statement weakened versus last time—close with outcome + metrics again.")

    if "result_strength" in history_summary.get("persisting_flags", []):
        add_focus(0.9, "Across attempts the result is still vague—plan a crisp final sentence with numbers before recording.")
    if "fillers" in history_summary.get("persisting_flags", []):
        add_focus(0.75, "Fillers remain above target across sessions—script transitions to stay concise.")
    if "structure" in history_summary.get("persisting_flags", []):
        add_focus(0.85, "Structure remains a gap—outline Situation→Task→Action→Result before hitting record.")

    focus_candidates.sort(key=lambda x: x[0], reverse=True)
    suggestions = [text for _, text in focus_candidates[:6]]

    strengths: List[str] = []
    def add_strength(text: str) -> None:
        if text not in strengths:
            strengths.append(text)

    for topic_label in question_analysis['strengths']:
        add_strength(f"{topic_label} - strong alignment with the prompt.")

    if star['coverage'] >= 3:
        add_strength("Strong storytelling arc—most STAR elements are present.")
    if res["score"] >= 0.7:
        add_strength("Clear impact statement with tangible results.")
    if quant["has_numbers"]:
        add_strength("Nice use of metrics to ground the story.")
    if reflection["has_reflection"]:
        add_strength("Thoughtful takeaway at the end keeps the answer growth-oriented.")
    if fillers["per_100w"] <= 1.2:
        add_strength(f"Very low filler rate (~{fillers['per_100w']:.1f}/100w).")
    if history_summary["delta_total"] is not None and history_summary["delta_total"] > 0:
        add_strength(f"Overall score up {history_summary['delta_total']:.1f} vs last run—keep that momentum.")
    if delta_fillers is not None and delta_fillers < -0.4:
        add_strength(f"Fillers down {abs(delta_fillers):.1f}/100w compared with last attempt—great control.")
    if delta_result is not None and delta_result > 0.15:
        add_strength("Impact statement sharper than last attempt.")

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

    return {
        "scores": scores,
        "explanations": explanations,
        "detected": detected,
        "suggestions": suggestions,
        "strengths": strengths[:5],
        "history_summary": history_summary,
        "question_alignment": question_analysis,
    }
