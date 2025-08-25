import re
from typing import Dict, List, Tuple

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
    "built","implemented","designed","led","drove","optimized","reduced",
    "increased","launched","migrated","refactored","debugged","delivered",
    "automated","integrated","owned","shipped","deployed","scaled","mentored",
    "verified","configured","reconfigured","reproduced","benchmarked","profiled",
    "triaged","isolated","documented"
]
# Broader outcome / result phrases
RESULT_CUES = [
    "as a result","resulted in","so that","thereby","which led to",
    "leading to","therefore","ultimately","in the end","the outcome",
    "this helped","this enabled","we were able to","users could","the system could",
    "confirmed on the","successfully","we succeeded","we achieved","earned recognition",
    "unblocked","fixed the issue","resolved the issue","passed tests","met the goal","met our goal"
]
SITUATION_CUES = [
    "at my internship","at school","on a project","the situation","the context",
    "when i","while i","our team was","we were","the problem was","we faced","one challenge"
]
TASK_CUES = [
    "my task","i needed to","i had to","i was responsible for","the goal was",
    "the objective was","we needed to","we had to"
]
ACTION_CUES = [
    "so i","i decided to","i started by","i then","i worked on","i implemented",
    "we implemented","i built","we built","i designed","we designed","i verified","i debugged"
]

VAGUE_PHRASES = [
    "some things","stuff","things","technical issues","it started working",
    "figured it out","googling","okay in the end","tough but managed",
    "sort of worked","kind of worked","did some research","did research"
]

NUMBER_RE = re.compile(r"(?<!\w)(?:\$?\d+(?:\.\d+)?%?|\d{1,3}(?:,\d{3})+%?)(?!\w)")
TIME_RE = re.compile(r"\b(days?|weeks?|months?|quarters?|years?)\b", re.I)

SENTENCE_SPLIT = re.compile(r'(?<=[.!?])\s+')
WORD_SPLIT = re.compile(r"\b[\w'-]+\b", re.I)

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

def filler_stats(text: str) -> Dict:
    matches = count_matches(text, FILLERS)
    total = sum(c for _, c in matches)
    words = max(1, len(tokenize_words(text)))
    rate_per_100 = (total / words) * 100
    return {"total": total, "per_100w": rate_per_100, "details": matches}

def hedge_stats(text: str) -> Dict:
    matches = count_matches(text, HEDGES)
    total = sum(c for _, c in matches)
    words = max(1, len(tokenize_words(text)))
    rate_per_100 = (total / words) * 100
    return {"total": total, "per_100w": rate_per_100, "details": matches}

def action_verb_density(text: str) -> Dict:
    tokens = tokenize_words(text)
    actions = [w for w in tokens if w in ACTION_VERBS]
    density = len(actions) / max(1, len(tokens))
    return {"count": len(actions), "density": density, "examples": actions[:10]}

def ownership_ratio(text: str) -> Dict:
    tokens = tokenize_words(text)
    i_ct = tokens.count("i")
    we_ct = tokens.count("we")
    total = i_ct + we_ct
    ratio = i_ct / total if total else 0.5
    return {"i": i_ct, "we": we_ct, "i_ratio": ratio}

def quantification(text: str) -> Dict:
    nums = NUMBER_RE.findall(text)
    times = TIME_RE.findall(text)
    return {"numbers": nums[:20], "has_numbers": bool(nums), "time_terms": times[:20]}

def sentence_stats(text: str) -> Dict:
    sents = [s.strip() for s in split_sentences(text) if s.strip()]
    if not sents:
        return {"avg_len": 0, "sentences": []}
    lens = [len(tokenize_words(s)) for s in sents]
    avg_len = sum(lens) / len(lens)
    return {"avg_len": avg_len, "sentences": sents[:40]}

def star_segments(text: str) -> Dict:
    tl = _lower(text)
    tags = {"s": False, "t": False, "a": False, "r": False}
    if any(c in tl for c in SITUATION_CUES): tags["s"] = True
    if any(c in tl for c in TASK_CUES):      tags["t"] = True
    if any(c in tl for c in ACTION_CUES):    tags["a"] = True
    # R will be assigned by result_strength(); keep a placeholder here
    return {"tags": tags, "coverage": sum(1 for v in tags.values() if v)}

# ---------- New: Result strength & Vagueness ----------
def result_strength(text: str) -> Dict:
    """
    Score 0..1 based on (a) explicit outcome phrases, (b) numbers, (c) location near end.
    """
    tl = _lower(text)
    sents = split_sentences(text)
    n = max(1, len(sents))
    end_idx = int(n * 0.7)  # last 30% treated as 'result region'

    # a) outcome phrases anywhere
    cue_hits = count_matches(text, RESULT_CUES)
    cue_score = min(1.0, sum(c for _, c in cue_hits) * 0.25)  # diminishing returns

    # b) numbers/metrics
    has_num = bool(NUMBER_RE.search(tl))
    num_score = 0.35 if has_num else 0.0

    # c) any sentence in the last 30% that mentions improvement verbs or “users could”, “successfully”
    end_text = " ".join(sents[end_idx:]).lower()
    end_cues = ["users could","successfully","enabled","reduced","increased",
                "confirmed","recognized","passed","fixed","resolved","unblocked","achieved"]
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

def vagueness_penalty(text: str) -> Dict:
    hits = count_matches(text, VAGUE_PHRASES)
    total = sum(c for _, c in hits)
    # scale: 0 (none) .. 0.6 (very vague)
    penalty = min(0.6, total * 0.2)
    return {"penalty": penalty, "hits": hits}

# ---------- Scoring ----------
def bounded(score: float, lo=0.0, hi=1.0) -> float:
    return max(lo, min(hi, score))

def score_answer(question: str, transcript: str, duration_seconds: int) -> Dict:
    words = len(tokenize_words(transcript))
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

    # mark R present for STAR if result strength is decent
    star["tags"]["r"] = res["score"] >= 0.35
    star["coverage"] = sum(1 for v in star["tags"].values() if v)

    # ---- Clarity (20)
    clarity = 1.0
    clarity -= bounded((fillers["per_100w"] - 2.0) / 8, 0, 0.7)
    clarity -= bounded((hedges["per_100w"] - 1.5) / 6, 0, 0.5)
    if sstats["avg_len"] > 28: clarity -= 0.2
    clarity = bounded(clarity)

    # ---- Concision / Pacing (10)
    pacing = 1.0
    if wpm < 95:
        pacing -= bounded((95 - wpm) / 70, 0, 0.6)
    elif wpm > 185:
        pacing -= bounded((wpm - 185) / 85, 0, 0.6)
    if duration_seconds < 45 or duration_seconds > 150:
        pacing -= 0.3
    pacing = bounded(pacing)

    # ---- Structure STAR (25)
    struct = 0.25 * star["coverage"]  # 0..1
    struct = bounded(struct)

    # ---- Content & Impact (30)
    content = 0.0
    content += bounded(actions["density"] / 0.02, 0, 0.5)
    content += 0.35 * res["score"]  # stronger weight to outcome strength
    content += 0.15 if quant["has_numbers"] else 0.0
    content -= vag["penalty"]  # penalize vague phrasing
    content = bounded(content)

    # ---- Confidence (15)
    conf = 0.9  # slightly lower baseline
    conf -= bounded(hedges["per_100w"] / 8, 0, 0.7)
    ir = own["i_ratio"]
    if ir < 0.45: conf -= 0.25
    if ir > 0.9:  conf -= 0.1
    conf = bounded(conf)

    scores = {
        "structure": round(struct * 25, 1),
        "clarity": round(clarity * 20, 1),
        "concision": round(pacing * 10, 1),
        "content": round(content * 30, 1),
        "confidence": round(conf * 15, 1),
    }
    total = round(sum(scores.values()), 1)

    suggestions: List[str] = []
    if star["coverage"] < 4:
        missing = [k.upper() for k, v in star["tags"].items() if not v]
        suggestions.append(f"Cover all STAR parts; missing: {', '.join(missing)}.")
    if res["score"] < 0.5:
        suggestions.append("Make the result explicit and near the end (e.g., “As a result, users could X; errors dropped 35%”).")
    if not quant["has_numbers"]:
        suggestions.append("Quantify impact (%, time saved, errors reduced, users affected).")
    if fillers["per_100w"] > 2:
        suggestions.append(f"Reduce fillers (found {fillers['total']}, ~{fillers['per_100w']:.1f}/100w). Pause, then speak.")
    if hedges["per_100w"] > 1.5:
        suggestions.append("Cut hedging. Prefer decisive verbs (“I implemented…”, “I verified…”).")
    if vag["penalty"] > 0:
        vague_words = ", ".join([w for w, _ in vag["hits"][:3]])
        suggestions.append(f"Be specific; avoid vague phrases ({vague_words}). State exact steps and outcomes.")
    if sstats["avg_len"] > 28:
        suggestions.append("Shorten sentences; aim 15–22 words each for clarity.")
    if (words / minutes) < 110 or (words / minutes) > 170:
        suggestions.append(f"Adjust pacing to ~110–170 WPM (now ~{int(wpm)} WPM).")

    explanations = {
        "wpm": round(wpm, 1),
        "avg_sentence_len": round(sstats["avg_len"], 1),
        "fillers_per_100w": round(fillers["per_100w"], 1),
        "hedges_per_100w": round(hedges["per_100w"], 1),
        "action_density": round(actions["density"], 4),
        "i_we": own,
        "quantification": quant,
        "star": star,
        "result_strength": res,
        "vagueness": vag,
    }

    return {
        "scores": {**scores, "total": total},
        "explanations": explanations,
        "detected": {
            "fillers": fillers["details"],
            "hedges": hedges["details"],
            "action_verbs": actions["examples"],
            "numbers": quant["numbers"],
            "time_terms": quant["time_terms"],
            "sentences": sentence_stats(transcript)["sentences"],
        },
        "suggestions": suggestions[:6],
    }
