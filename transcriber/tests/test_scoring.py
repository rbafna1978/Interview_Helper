import unittest
from scoring import score_answer


class ScoringEngineTests(unittest.TestCase):
    def test_star_story_scores_high(self):
        transcript = (
            "At my internship our API latency spiked 60%. My task was to restore performance without extra hardware. "
            "I profiled the pipeline, found redundant serialization, and partnered with infra to batch responses. "
            "As a result P95 dropped by 42% in two days and the incident review commended the fast communication. "
            "I learned to instrument first before changing code."
        )
        result = score_answer(
            "Tell me about a challenge you faced and how you handled it.",
            transcript,
            duration_seconds=140,
            history=None,
            question_id="challenge-star",
        )
        self.assertGreater(result["overallScore"], 75)
        self.assertGreater(result["subscores"]["structure"], 70)
        self.assertEqual(result["issues"], [])

    def test_missing_result_triggers_issue(self):
        transcript = (
            "When I joined the team we had a messy build pipeline. I owned fixing it. "
            "I met with stakeholders and started rewriting the scripts, coordinating everyone. "
            "I built dashboards and documentation."
        )
        result = score_answer(
            "Describe a time you improved a process.",
            transcript,
            duration_seconds=110,
            history=None,
            question_id="process-improvement",
        )
        self.assertLess(result["subscores"]["structure"], 60)
        self.assertTrue(any(issue["type"] == "missing_star" for issue in result["issues"]))

    def test_irrelevant_answer_penalized(self):
        transcript = (
            "I love hiking on weekends and recently organized a trip with friends. "
            "We discussed gear and enjoyed the forest. It was refreshing."
        )
        result = score_answer(
            "Tell me about a technical conflict at work.",
            transcript,
            duration_seconds=60,
            history=None,
            question_id="conflict",
        )
        self.assertLess(result["subscores"]["relevance"], 40)
        self.assertTrue(any(issue["type"] == "low_relevance" for issue in result["issues"]))

    def test_long_rambling_penalizes_conciseness(self):
        transcript = " ".join(["I started explaining every single detail of the legacy system and kept repeating myself."] * 12)
        result = score_answer(
            "Tell me about a high pressure deadline.",
            transcript,
            duration_seconds=260,
            history=None,
            question_id="conflicting-priorities",
        )
        self.assertLess(result["subscores"]["conciseness"], 40)
        self.assertTrue(any(issue["type"] == "rambling" for issue in result["issues"]))

    def test_filler_heavy_delivery_drop(self):
        transcript = (
            "Um so I was like the lead and um I think we basically uh had to migrate. "
            "I, um, told the team we should, uh, pause and you know gather context."
        )
        result = score_answer(
            "Describe a time you led a migration.",
            transcript,
            duration_seconds=90,
            history=None,
            question_id="technical-migration",
        )
        self.assertLess(result["subscores"]["delivery"], 55)
        self.assertTrue(any(issue["type"] == "filler_heavy" for issue in result["issues"]))

    def test_technical_mode_scores_technical_dimension(self):
        transcript = (
            "I would design the cache with Redis clusters, partition keys by tenant, and use write-through semantics. "
            "For consistency I'd add background warmers and metrics on hit rate. "
            "Failure handling would rely on multi-AZ replicas."
        )
        result = score_answer(
            "Explain how you would design a caching layer for our API.",
            transcript,
            duration_seconds=130,
            history=None,
            question_id="technical-caching",
        )
        self.assertGreater(result["subscores"]["technical"], 60)
        self.assertGreater(result["overallScore"], 65)

    def test_off_prompt_triggers_hard_relevance_issue(self):
        transcript = "I enjoy cooking on weekends and experimenting with new recipes."
        result = score_answer(
            "Design a distributed rate limiter.",
            transcript,
            duration_seconds=45,
            history=None,
            question_id="system-design-rate-limiter",
        )
        self.assertTrue(any(issue["type"] == "relevance" for issue in result["issues"]))

    def test_system_design_missing_scaling_penalizes(self):
        transcript = (
            "I would start by defining the core requirements. I'd use a single database table to store URLs "
            "and create a simple service to handle redirects."
        )
        result = score_answer(
            "Design a URL shortener.",
            transcript,
            duration_seconds=120,
            history=None,
            question_id="system-design-url-shortener",
        )
        self.assertLess(result["subscores"]["technical"], 60)


if __name__ == "__main__":
    unittest.main()
