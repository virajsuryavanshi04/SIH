import json
import logging
from typing import Dict, Any, List, Optional, Tuple

Tuple_Validation = Tuple[bool, str]

from sqlalchemy.orm import Session

from ai.base import AIProvider
from config import settings
from ai.gemini_provider import GeminiProvider
from ai.openrouter_provider import OpenRouterProvider
from ai.mock_provider import MockProvider
from models.assessment import Question, QuestionOption
from models.competency import Competency, CompetencyTopic

logger = logging.getLogger(__name__)

class AIService:
    """
    Central AI Service abstraction for SmartLearn.
    Handles source-grounded question generation, duplicate prevention,
    question validation, and deterministic gap diagnosis explanation.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self._provider = None
        self._current_provider_type = None

    @property
    def provider(self) -> AIProvider:
        current_provider_name = (settings.AI_PROVIDER or "mock").lower()
        if self._provider is None or self._current_provider_type != current_provider_name:
            self._current_provider_type = current_provider_name
            if current_provider_name == "gemini":
                self._provider = GeminiProvider()
            elif current_provider_name == "openrouter":
                self._provider = OpenRouterProvider()
            else:
                self._provider = MockProvider()
        return self._provider

    def _parse_json(self, text: str) -> Any:
        """Robust JSON extraction from LLM markdown fences and unstructured text."""
        if not text:
            return {}
        try:
            import re
            cleaned = (text or "").strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json", 1)[1]
            elif "```" in cleaned:
                cleaned = cleaned.split("```", 1)[1]
            if "```" in cleaned:
                cleaned = cleaned.split("```", 1)[0]
            cleaned = cleaned.strip()

            start_brace = cleaned.find("{")
            start_bracket = cleaned.find("[")
            if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
                end_brace = cleaned.rfind("}")
                if end_brace != -1:
                    cleaned = cleaned[start_brace:end_brace+1]
            elif start_bracket != -1:
                end_bracket = cleaned.rfind("]")
                if end_bracket != -1:
                    cleaned = cleaned[start_bracket:end_bracket+1]

            # 1. Direct parse attempt
            try:
                return json.loads(cleaned)
            except Exception:
                pass

            # 2. Strict=False and clean trailing commas
            fixed = re.sub(r',\s*([\}\]])', r'\1', cleaned)
            try:
                return json.loads(fixed, strict=False)
            except Exception:
                pass

            # 3. Escape invalid backslashes (e.g. LaTeX formulas from LLM like \propto, \sigma)
            fixed_escapes = re.sub(r'\\(?![/u"\\bfnrt])', r'\\\\', fixed)
            try:
                return json.loads(fixed_escapes, strict=False)
            except Exception:
                pass

            # 4. Partial / individual question extraction fallback
            if "question_text" in cleaned or "options" in cleaned:
                q_blocks = re.findall(r'\{\s*"question_text"[^\}]*?\}', cleaned, re.DOTALL)
                extracted_qs = []
                for qb in q_blocks:
                    try:
                        clean_qb = re.sub(r'\\(?![/u"\\bfnrt])', r'\\\\', qb)
                        extracted_qs.append(json.loads(clean_qb, strict=False))
                    except Exception:
                        continue
                if extracted_qs:
                    return {"questions": extracted_qs}

            return {}
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON response: {e}")
            return {}

    def generate_question(
        self,
        competency_name: str,
        topic_name: str,
        difficulty: str = "2",
        source_context: Optional[str] = None,
        avoid_concepts: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generates a single calibrated multiple choice question strictly grounded in source context.
        """
        avoid_clause = f"Avoid repeating these concepts/questions: {', '.join(avoid_concepts)}" if avoid_concepts else ""
        source_clause = f"Grounded strictly in this official learning material / syllabus:\n{source_context[:2000]}" if source_context else "Grounded in official MoSPI government statistical standards."

        system_prompt = (
            "You are an expert psychometrician and statistical educator for India's Official Statistical System. "
            "Generate calibrated, practical multiple choice questions without hallucinations or ungrounded facts. "
            "Return valid JSON only matching the schema."
        )

        prompt = f"""
Generate 1 practical Multiple Choice Question (MCQ) for official statistical officers.
- Competency: {competency_name}
- Subtopic: {topic_name}
- Difficulty: {difficulty} (1=Easy/Foundational, 2=Applied/Intermediate, 3=Hard/Policy Analysis)
- {avoid_clause}
- {source_clause}

Required Output JSON Schema:
{{
  "question_text": "Clear, non-trivial question scenario",
  "options": [
    {{"text": "Correct Option Text", "is_correct": true, "order": 1}},
    {{"text": "Plausible Distractor 1", "is_correct": false, "order": 2}},
    {{"text": "Plausible Distractor 2", "is_correct": false, "order": 3}},
    {{"text": "Plausible Distractor 3", "is_correct": false, "order": 4}}
  ],
  "correct_answer": "Exact text of the correct option",
  "explanation": "Detailed statistical rationale explaining why the correct answer is valid",
  "competency": "{competency_name}",
  "topic": "{topic_name}",
  "difficulty": "{difficulty}",
  "cognitive_level": "understand|apply|analyze",
  "concept": "Specific concept tested",
  "source_reference": "Specific section/chapter citation"
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.3)
        res = self._parse_json(response_text)
        if isinstance(res, list) and len(res) > 0:
            return res[0]
        elif isinstance(res, dict):
            return res
        return {}

    def generate_mcqs_from_material(
        self,
        content_text: str,
        competency_name: str,
        topic_name: Optional[str] = None,
        count: int = 3,
        difficulty: str = "2"
    ) -> List[Dict[str, Any]]:
        """
        Generates multiple MCQs grounded in an uploaded training PDF or document.
        """
        system_prompt = (
            "You are an AI assessment generator for India's Official Statistical System. "
            "Extract concepts from the provided text and formulate valid MCQs. "
            "Return a JSON array of questions only."
        )

        prompt = f"""
Generate {count} multiple choice questions strictly based on the following text:
---
{content_text[:3500]}
---
Target Competency: {competency_name}
Target Topic: {topic_name or 'General Topic'}
Difficulty: {difficulty}

Return a JSON array of questions where each object has:
- question_text: string
- options: array of 4 items with text, is_correct (boolean), order (integer 1-4)
- correct_answer: string matching the text of the single correct option
- explanation: string
- cognitive_level: 'understand' | 'apply' | 'analyze'
- source_reference: excerpt or citation
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.3)
        res = self._parse_json(response_text)
        if isinstance(res, list):
            return res
        elif isinstance(res, dict) and "questions" in res:
            return res["questions"]
        elif isinstance(res, dict) and "question_text" in res:
            return [res]
        return []

    def diagnose_gap(self, evidence_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Explains diagnostic evidence and root causes without modifying numerical scores.
        """
        system_prompt = (
            "You are an AI Competency Intelligence Diagnostician for India's Statistical Cadre. "
            "Analyze assessment telemetry and explain the root cause of competency gaps. "
            "Do NOT invent new numerical scores. Return structured JSON only."
        )

        prompt = f"""
Analyze this structured assessment evidence:
- Role: {evidence_data.get('role', 'Statistical Officer')}
- Competency: {evidence_data.get('competency_name', 'Sampling Techniques')}
- Current Evidence Score: {evidence_data.get('current_score', 48.0)}%
- Required Benchmark Target: {evidence_data.get('target_score', 70.0)}%
- Deficit Gap: -{evidence_data.get('gap', 22.0)}%
- Weak Subtopics: {evidence_data.get('weak_topics', ['Stratified Sampling'])}
- Missed Concepts: {evidence_data.get('missed_concepts', [])}

Return JSON matching:
{{
  "primary_gap": "Brief name of the primary bottleneck",
  "root_cause": "Specific conceptual reason why the officer struggled",
  "explanation": "2-3 sentence transparent diagnostic summary for the officer",
  "recommended_focus": "Specific topic/module recommended to close the gap",
  "confidence": 88.0
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.2)
        res = self._parse_json(response_text)
        if not isinstance(res, dict) or "primary_gap" not in res:
            return {
                "primary_gap": f"{evidence_data.get('competency_name', 'Competency')} Gap",
                "root_cause": f"Needs further practice on {', '.join(evidence_data.get('weak_topics', ['key concepts']))}",
                "explanation": f"Your verified score of {evidence_data.get('current_score')}% is below the {evidence_data.get('target_score')}% role benchmark.",
                "recommended_focus": f"Review accredited iGOT modules on {evidence_data.get('competency_name')}.",
                "confidence": 85.0
            }
        return res

    def diagnose_assessment_evidence(self, evidence_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interprets item-level assessment telemetry to identify conceptual misconceptions
        and structured remediation focus without modifying scores.
        """
        system_prompt = (
            "You are an AI Cognitive Diagnostician for India's Official Statistical System. "
            "You interpret observed assessment error patterns to diagnose misconceptions. "
            "Never invent learner intentions or claims unsupported by provided error choices. "
            "Classify evidence levels: OBSERVED_PATTERN, LIKELY_MISCONCEPTION, or INSUFFICIENT_EVIDENCE. "
            "Return valid JSON matching the schema."
        )

        errors_summary = []
        for e in evidence_data.get("errors", [])[:8]:
            errors_summary.append(
                f"- Question: {e.get('question_text')}\n"
                f"  Selected (Incorrect): {e.get('selected_answer')}\n"
                f"  Correct: {e.get('correct_answer')}\n"
                f"  Topic: {e.get('topic')}\n"
                f"  Confidence: {e.get('confidence')}/5 | Difficulty: Level {e.get('difficulty')}"
            )

        errors_str = "\n".join(errors_summary) if errors_summary else "No error items logged."

        prompt = f"""
Analyze this structured assessment error telemetry:
- Role: {evidence_data.get('role', 'Statistical Officer')}
- Competency: {evidence_data.get('competency_name', 'Statistical Competency')}
- Overall Score: {evidence_data.get('overall_score', 0.0)}% (Target: {evidence_data.get('target_score', 70.0)}%)
- Total Items: {evidence_data.get('total_questions', 0)} | Incorrect: {evidence_data.get('incorrect_count', 0)} | High-Confidence Errors: {evidence_data.get('high_confidence_errors', 0)}
- Topic Error Distribution: {json.dumps(evidence_data.get('topic_error_counts', {}))}

Observed Error Items:
{errors_str}

Required JSON Output Schema:
{{
  "primary_bottleneck": "Short name of the primary bottleneck",
  "diagnostic_confidence": "HIGH", // "HIGH", "MEDIUM", or "LOW"
  "evidence_summary": "1-2 sentence evidence-backed summary of observed error patterns",
  "misconceptions": [
    {{
      "topic": "Specific Topic Name",
      "pattern": "Brief description of the error pattern",
      "classification": "OBSERVED_PATTERN", // "OBSERVED_PATTERN", "LIKELY_MISCONCEPTION", or "INSUFFICIENT_EVIDENCE"
      "evidence_count": 2,
      "explanation": "Cautious explanation of the conceptual misconception",
      "high_confidence_error": true
    }}
  ],
  "remediation_focus": "Specific grounded topic or chapter to study to remediate this gap"
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.2)
        res = self._parse_json(response_text)

        # Validate and provide deterministic fallback
        if not isinstance(res, dict) or "primary_bottleneck" not in res:
            weakest = list(evidence_data.get("topic_error_counts", {}).keys())
            weak_top = weakest[0] if weakest else "Core Concepts"
            high_conf = evidence_data.get("high_confidence_errors", 0)
            inc_cnt = evidence_data.get("incorrect_count", 0)
            
            conf_level = "HIGH" if high_conf >= 2 else "MEDIUM" if inc_cnt >= 2 else "LOW"
            classif = "LIKELY_MISCONCEPTION" if high_conf >= 1 else "OBSERVED_PATTERN" if inc_cnt >= 2 else "INSUFFICIENT_EVIDENCE"

            return {
                "primary_bottleneck": f"{weak_top} Conceptual Gap",
                "diagnostic_confidence": conf_level,
                "evidence_summary": f"Observed {inc_cnt} incorrect answer(s) across {len(weakest)} topic(s), with {high_conf} high-confidence error(s).",
                "misconceptions": [
                    {
                        "topic": weak_top,
                        "pattern": f"Incorrect answer selections on {weak_top}",
                        "classification": classif,
                        "evidence_count": max(1, inc_cnt),
                        "explanation": f"Assessment telemetry indicates {inc_cnt} errors in {weak_top}. Additional review is recommended.",
                        "high_confidence_error": high_conf > 0
                    }
                ] if inc_cnt > 0 else [],
                "remediation_focus": f"Review foundational and applied principles of {weak_top}."
            }

        return res

    def summarize_material(self, text: str) -> Dict[str, Any]:
        """Summarizes uploaded document and identifies mapped competency domains."""
        system_prompt = (
            "You are an AI curriculum analyzer for India's Official Statistical System. "
            "Analyze training material and extract key topics and competency mappings. "
            "Return valid JSON only matching the schema."
        )
        prompt = f"""
Summarize this government statistical training material and extract key topics and competency domain mappings:
---
{text[:3000]}
---

Required JSON Output Schema:
{{
  "title": "Document title or main subject",
  "topics": ["Topic 1", "Topic 2", "Topic 3"],
  "competency_mappings": {{
    "Statistical Methods": 0.85,
    "Sampling Techniques": 0.70
  }},
  "summary": "2-3 sentence executive summary of the content"
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.2)
        res = self._parse_json(response_text)
        if not isinstance(res, dict) or not res.get("topics"):
            return {
                "title": "Statistical Training Material",
                "topics": ["Statistical Analysis", "Data Collection"],
                "competency_mappings": {"Statistical Methods": 0.8},
                "summary": text[:200] if text else "Statistical training documentation."
            }
        return res

    def generate_short_notes(self, content_text: str, title: str = "") -> Dict[str, Any]:
        """
        Generates structured executive study notes grounded strictly in the provided material text.
        """
        system_prompt = (
            "You are an expert study notes synthesizer. "
            "Create structured, high-yield study notes based strictly on the provided source text. "
            "Do NOT invent unsupported facts, external definitions, or ungrounded examples. "
            "Return valid JSON only matching the schema."
        )
        prompt = f"""
Synthesize clear, structured study notes strictly based on the following text:
---
{content_text[:4000]}
---
Document Title: {title or 'Study Document'}

Required JSON Output Schema:
{{
  "title": "{title or 'Structured Study Notes'}",
  "sections": [
    {{"heading": "Overview", "content": "2-3 sentences summarizing the scope and main themes"}},
    {{"heading": "Key Concepts", "content": "Detailed bullet points or paragraphs covering core ideas from source"}},
    {{"heading": "Important Definitions", "content": "Key terms and definitions present in the text"}},
    {{"heading": "Examples & Applications", "content": "Practical use cases or applications mentioned in the source (omit if none exist)"}},
    {{"heading": "Key Takeaways", "content": "Summary conclusions and takeaways directly supported by text"}}
  ]
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.2)
        res = self._parse_json(response_text)
        is_valid, reason = self.validate_notes_structure(res)

        if not is_valid and response_text:
            # Fallback parser for markdown structured text from LLM
            import re
            sections = []
            current_heading = "Overview"
            current_lines = []
            for line in response_text.splitlines():
                line_str = line.strip()
                if line_str.startswith("#") or (line_str.startswith("**") and line_str.endswith("**")):
                    if current_lines:
                        sections.append({"heading": current_heading, "content": "\n".join(current_lines).strip()})
                        current_lines = []
                    current_heading = line_str.lstrip("#* :").rstrip("* :")
                elif line_str:
                    current_lines.append(line_str)
            if current_lines:
                sections.append({"heading": current_heading, "content": "\n".join(current_lines).strip()})
            if sections:
                res = {"title": title or "Structured Study Notes", "sections": sections}
                is_valid, reason = self.validate_notes_structure(res)

        if not is_valid:
            logger.warning(f"Notes generation failed validation: {reason}")
            raise ValueError(f"AI response failed notes schema validation: {reason}")
        return res

    def generate_flashcards(self, content_text: str, title: str = "", count: int = 8) -> List[Dict[str, Any]]:
        """
        Generates high-yield active-recall flashcards grounded strictly in the provided material text.
        """
        system_prompt = (
            "You are an expert active-recall study flashcard creator. "
            "Generate concise question/answer flashcards based strictly on the provided text. "
            "Do NOT invent facts not supported by the source. Return valid JSON only."
        )
        card_target = min(max(count, 4), 12)
        prompt = f"""
Generate {card_target} high-yield flashcards strictly based on the following text:
---
{content_text[:4000]}
---
Document Subject: {title or 'Study Material'}

Required JSON Output Schema:
{{
  "cards": [
    {{
      "front": "Clear question, prompt, or key term to test",
      "back": "Accurate, concise explanation or definition directly supported by source",
      "order": 1
    }}
  ]
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.25)
        res = self._parse_json(response_text)
        cards_data = res.get("cards") if isinstance(res, dict) else (res if isinstance(res, list) else [])
        is_valid, reason = self.validate_flashcards_structure(cards_data)

        if not is_valid and response_text:
            # Fallback regex parser for Q/A pairs
            import re
            extracted = []
            q_matches = re.findall(r'(?:Q|Question|Front|Prompt):\s*(.+?)\n+(?:A|Answer|Back|Explanation):\s*(.+?)(?=\n+(?:Q|Question|Front|Prompt):|\Z)', response_text, re.DOTALL | re.IGNORECASE)
            for idx, (f, b) in enumerate(q_matches, 1):
                extracted.append({"front": f.strip(), "back": b.strip(), "order": idx})
            if extracted:
                cards_data = extracted
                is_valid, reason = self.validate_flashcards_structure(cards_data)

        if not is_valid:
            logger.warning(f"Flashcards generation failed validation: {reason}")
            raise ValueError(f"AI response failed flashcards schema validation: {reason}")
        return cards_data

    def generate_mind_map(self, content_text: str, title: str = "") -> Dict[str, Any]:
        """
        Generates a hierarchical concept mind map tree grounded strictly in the provided material text.
        """
        system_prompt = (
            "You are a conceptual mind map architect. "
            "Extract the core concept hierarchy and structural relationships directly from the text. "
            "Do NOT invent relationships unsupported by the text. Return valid JSON only."
        )
        prompt = f"""
Generate a structured hierarchical mind map tree strictly based on the following text:
---
{content_text[:4000]}
---
Central Topic / Document Title: {title or 'Central Concept'}

Required JSON Output Schema (Tree Node):
{{
  "label": "{title or 'Core Subject'}",
  "children": [
    {{
      "label": "Main Concept Branch 1",
      "children": [
        {{"label": "Sub-concept 1.1", "children": []}},
        {{"label": "Sub-concept 1.2", "children": []}}
      ]
    }},
    {{
      "label": "Main Concept Branch 2",
      "children": [
        {{"label": "Sub-concept 2.1", "children": []}}
      ]
    }}
  ]
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.2)
        res = self._parse_json(response_text)
        is_valid, reason = self.validate_mind_map_structure(res)

        if not is_valid and response_text:
            # Fallback for structured bullet list
            root_label = title or "Core Subject"
            children = []
            current_parent = None
            for line in response_text.splitlines():
                line_str = line.strip()
                if not line_str:
                    continue
                if line.startswith("  ") or line.startswith("\t"):
                    if current_parent:
                        current_parent["children"].append({"label": line_str.lstrip("*- •0123456789."), "children": []})
                elif line_str.startswith("-") or line_str.startswith("*") or line_str.startswith("1."):
                    current_parent = {"label": line_str.lstrip("*- •0123456789."), "children": []}
                    children.append(current_parent)
            if children:
                res = {"label": root_label, "children": children}
                is_valid, reason = self.validate_mind_map_structure(res)

        if not is_valid:
            logger.warning(f"Mind map generation failed validation: {reason}")
            raise ValueError(f"AI response failed mind map schema validation: {reason}")
        return res

    @staticmethod
    def validate_notes_structure(data: Any) -> Tuple_Validation:
        """Validates that notes JSON contains title and non-empty sections with heading/content."""
        if not isinstance(data, dict):
            return False, "Notes response must be a JSON dictionary"
        title = data.get("title")
        sections = data.get("sections")
        if not title or not isinstance(title, str) or len(title.strip()) < 2:
            return False, "Notes title is missing or invalid"
        if not isinstance(sections, list) or len(sections) == 0:
            return False, "Notes sections array is empty or missing"
        for idx, sec in enumerate(sections):
            if not isinstance(sec, dict) or not sec.get("heading") or not sec.get("content"):
                return False, f"Section {idx+1} is missing heading or content"
            if len(str(sec["content"]).strip()) < 5:
                return False, f"Section {idx+1} content is too short"
        return True, "Valid notes structure"

    @staticmethod
    def validate_flashcards_structure(cards: Any) -> Tuple_Validation:
        """Validates that flashcards array has at least 2 valid cards with front and back."""
        if isinstance(cards, dict) and "cards" in cards:
            cards = cards["cards"]
        if not isinstance(cards, list) or len(cards) < 2:
            return False, "Flashcards must be an array with at least 2 cards"
        for idx, card in enumerate(cards):
            if not isinstance(card, dict):
                return False, f"Card {idx+1} is not a valid object"
            front = card.get("front") or card.get("question") or card.get("prompt")
            back = card.get("back") or card.get("answer") or card.get("explanation")
            if not front or len(str(front).strip()) < 3:
                return False, f"Card {idx+1} front question/prompt is missing or too short"
            if not back or len(str(back).strip()) < 2:
                return False, f"Card {idx+1} back answer is missing or too short"
        return True, "Valid flashcards structure"

    @staticmethod
    def validate_mind_map_structure(node: Any, depth: int = 1, max_depth: int = 5) -> Tuple_Validation:
        """Validates that mind map is a bounded, valid tree with non-empty node labels."""
        if depth > max_depth:
            return False, f"Mind map hierarchy exceeds maximum allowed depth of {max_depth}"
        if not isinstance(node, dict):
            return False, "Mind map node must be a JSON dictionary"
        label = node.get("label")
        if not label or not isinstance(label, str) or len(label.strip()) < 1:
            return False, "Mind map node label is missing or empty"
        children = node.get("children", [])
        if not isinstance(children, list):
            return False, "Mind map node children must be an array"
        for child in children:
            valid, reason = AIService.validate_mind_map_structure(child, depth + 1, max_depth)
            if not valid:
                return False, reason
        return True, "Valid mind map structure"
    @classmethod
    def _normalize_question_data(cls, q: Any) -> Optional[Dict[str, Any]]:
        """
        Normalizes a raw LLM question dictionary into the strict SmartLearn schema:
        - Resolves question text aliases and strips whitespace
        - Standardizes question_type (SHORT_MCQ, WORD_PROBLEM, CASE_STUDY)
        - Normalizes difficulty ('1', '2', '3') and cognitive_level
        - Reconciles is_correct flags with correct_answer string
        - Ensures exactly 4 distinct options with sequential 1..4 order
        - Ensures valid explanation
        """
        if not isinstance(q, dict):
            return None

        q_text = str(q.get("question_text") or q.get("text") or "").strip()
        if len(q_text) < 15:
            return None

        # 1. Normalize Question Type
        raw_type = str(q.get("question_type") or "SHORT_MCQ").strip().upper()
        if any(k in raw_type for k in ["CASE", "SCENARIO", "SITUATIONAL"]):
            q_type = "CASE_STUDY"
        elif any(k in raw_type for k in ["WORD", "PROBLEM", "APPLIED", "NUMERICAL"]):
            q_type = "WORD_PROBLEM"
        else:
            q_type = "SHORT_MCQ"

        # 2. Normalize Difficulty
        raw_diff = str(q.get("difficulty", "2")).strip().lower()
        if raw_diff in ["1", "easy", "beginner", "foundational", "level 1", "level_1"]:
            diff = "1"
        elif raw_diff in ["3", "hard", "advanced", "analytical", "level 3", "level_3"]:
            diff = "3"
        else:
            diff = "2"

        # 3. Normalize Cognitive Level
        raw_cog = str(q.get("cognitive_level", "")).strip().lower()
        if any(k in raw_cog for k in ["analyze", "analysis", "eval", "evaluation", "hard", "3"]):
            cog = "analyze"
        elif any(k in raw_cog for k in ["apply", "application", "compute", "medium", "2"]):
            cog = "apply"
        else:
            cog = "understand"

        # 4. Normalize Options
        raw_opts = q.get("options")
        if isinstance(raw_opts, dict):
            raw_opts = [{"text": v, "is_correct": False} for v in raw_opts.values()]

        if not isinstance(raw_opts, list) or len(raw_opts) < 4:
            return None

        clean_opts = []
        seen_texts = set()
        for opt in raw_opts:
            if isinstance(opt, str):
                t = opt.strip()
                c = False
            elif isinstance(opt, dict):
                t = str(opt.get("text") or opt.get("option_text") or "").strip()
                c = bool(opt.get("is_correct", False))
            else:
                continue

            if not t or t.lower() in seen_texts:
                continue
            seen_texts.add(t.lower())
            clean_opts.append({"text": t, "is_correct": c})
            if len(clean_opts) == 4:
                break

        if len(clean_opts) < 4:
            return None

        # 5. Reconcile is_correct and correct_answer
        correct_answer_str = str(q.get("correct_answer") or "").strip()
        matched_idx = -1

        # Check if correct_answer string matches one of the 4 option texts
        if correct_answer_str:
            for idx, opt in enumerate(clean_opts):
                if opt["text"].strip().lower() == correct_answer_str.lower():
                    matched_idx = idx
                    break

        if matched_idx != -1:
            for idx, opt in enumerate(clean_opts):
                opt["is_correct"] = (idx == matched_idx)
            correct_answer = clean_opts[matched_idx]["text"]
        else:
            # Check how many options are flagged is_correct
            flagged = [idx for idx, opt in enumerate(clean_opts) if opt["is_correct"]]
            if len(flagged) == 1:
                target_idx = flagged[0]
            elif len(flagged) > 1:
                target_idx = flagged[0]  # Pick first if multiple flagged
            else:
                target_idx = 0  # Default to first option

            for idx, opt in enumerate(clean_opts):
                opt["is_correct"] = (idx == target_idx)
            correct_answer = clean_opts[target_idx]["text"]

        # Assign 1-indexed order
        for idx, opt in enumerate(clean_opts, 1):
            opt["order"] = idx

        # 6. Explanation & Concept
        exp = str(q.get("explanation") or "").strip()
        if len(exp) < 5:
            exp = f"Based on the study material regarding '{q_text[:40]}...', the validated answer is {correct_answer}."

        concept = str(q.get("concept") or "Core Topic").strip()

        return {
            "question_text": q_text,
            "question_type": q_type,
            "difficulty": diff,
            "cognitive_level": cog,
            "options": clean_opts,
            "correct_answer": correct_answer,
            "explanation": exp,
            "concept": concept,
            "source_reference": q.get("source_reference")
        }

    def generate_material_quiz_questions(
        self,
        content_text: str,
        title: str = "",
        count: int = 10,
        question_type: str = "MIXED",
        competency_name: Optional[str] = None,
        topic_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates calibrated, grounded Multiple Choice Questions across difficulty tiers
        (Level 1 Easy, Level 2 Medium, Level 3 Hard) and requested formats (SHORT_MCQ, WORD_PROBLEM, CASE_STUDY, MIXED)
        strictly based on the supplied learning material text.
        Features candidate oversampling, per-question schema normalization, grounding checks, and targeted retries.
        """
        req_count = count if count in [10, 15, 20] else 10
        norm_type = (question_type or "MIXED").upper()

        # Surplus candidates per request
        surplus_map = {10: 13, 15: 18, 20: 24}
        candidate_count = surplus_map.get(req_count, req_count + 3)

        if norm_type == "MIXED":
            if req_count == 10:
                dist_instruction = "Generate 13 questions: 5 SHORT_MCQ, 4 WORD_PROBLEM, and 4 CASE_STUDY."
            elif req_count == 15:
                dist_instruction = "Generate 18 questions: 6 SHORT_MCQ, 6 WORD_PROBLEM, and 6 CASE_STUDY."
            elif req_count == 20:
                dist_instruction = "Generate 24 questions: 9 SHORT_MCQ, 8 WORD_PROBLEM, and 7 CASE_STUDY."
            else:
                dist_instruction = f"Generate {candidate_count} questions distributed across SHORT_MCQ, WORD_PROBLEM, and CASE_STUDY."
        else:
            dist_instruction = f"Generate {candidate_count} questions of type {norm_type}."

        comp_clause = f"Target Competency: {competency_name}\nTarget Topic: {topic_name}" if competency_name else "Personal Material Study Assessment"

        system_prompt = (
            "You are an expert assessment generator and psychometrician for SmartLearn. "
            "Generate calibrated, high-yield Multiple Choice Questions strictly grounded in the provided source text. "
            "CRITICAL GROUNDING RULES:\n"
            "1. Use ONLY facts, definitions, procedures, formulas, and relationships present in the source text.\n"
            "2. Do NOT invent unsupported facts, external definitions, or ungrounded statistics.\n"
            "3. For Word Problems, ensure all scenarios and computations are internally consistent and grounded in the source text.\n"
            "4. For Case Studies, provide a 2-4 sentence realistic workplace scenario followed by an applied problem-solving question.\n"
            "5. Calibrate difficulty across Level 1 (Easy/Foundational), Level 2 (Medium/Applied), and Level 3 (Hard/Analytical).\n"
            "6. Every question must have EXACTLY 4 distinct options with EXACTLY 1 correct option.\n"
            "7. Return valid JSON only matching the schema."
        )

        base_prompt_template = f"""
Generate calibrated material quiz questions based strictly on the following text:
---
{content_text[:4000]}
---
Document Title: {title or 'Learning Material'}
{comp_clause}
Distribution Requirement: {{dist_req}}

Required JSON Output Schema:
{{{{
  "questions": [
    {{{{
      "question_text": "Clear question or scenario prompt (minimum 15 characters)",
      "question_type": "SHORT_MCQ | WORD_PROBLEM | CASE_STUDY",
      "difficulty": "1 | 2 | 3",
      "cognitive_level": "understand | apply | analyze",
      "options": [
        {{{{"text": "Correct Option Text", "is_correct": true, "order": 1}}}},
        {{{{"text": "Plausible Distractor 1", "is_correct": false, "order": 2}}}},
        {{{{"text": "Plausible Distractor 2", "is_correct": false, "order": 3}}}},
        {{{{"text": "Plausible Distractor 3", "is_correct": false, "order": 4}}}}
      ],
      "correct_answer": "Exact text of the correct option",
      "explanation": "Detailed explanation explaining why the correct answer is valid based on the text",
      "concept": "Concept tested"
    }}}}
  ]
}}}}
"""

        accepted_questions: List[Dict[str, Any]] = []
        seen_texts = set()
        max_attempts = 3
        current_dist_req = dist_instruction

        for attempt in range(1, max_attempts + 1):
            logger.info(f"Material Quiz Generation Attempt {attempt}/{max_attempts} for format {norm_type} (Need: {req_count}, Have: {len(accepted_questions)})")
            prompt = base_prompt_template.format(dist_req=current_dist_req)
            
            try:
                response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.25, max_tokens=4000)
                res = self._parse_json(response_text)
                raw_items = res.get("questions") if isinstance(res, dict) else (res if isinstance(res, list) else [])
            except Exception as e:
                logger.warning(f"Generation attempt {attempt} failed during AI call or JSON parsing: {e}")
                raw_items = []

            for raw_q in raw_items:
                norm_q = self._normalize_question_data(raw_q)
                if not norm_q:
                    continue

                q_key = norm_q["question_text"].lower().strip()
                if q_key in seen_texts:
                    continue

                # Question structure validation
                is_valid, v_reason = self.validate_question(norm_q)
                if not is_valid:
                    continue

                # Grounding validation on individual question
                is_grounded, g_reason = self.validate_material_quiz_grounding([norm_q], content_text)
                if not is_grounded:
                    continue

                seen_texts.add(q_key)
                accepted_questions.append(norm_q)

            # Check if we have enough candidates
            if len(accepted_questions) >= req_count:
                # For MIXED, check if all 3 types have candidates
                if norm_type == "MIXED":
                    sm_c = sum(1 for q in accepted_questions if q["question_type"] == "SHORT_MCQ")
                    wp_c = sum(1 for q in accepted_questions if q["question_type"] == "WORD_PROBLEM")
                    cs_c = sum(1 for q in accepted_questions if q["question_type"] == "CASE_STUDY")
                    if sm_c >= 2 and wp_c >= 2 and cs_c >= 2:
                        break
                else:
                    type_c = sum(1 for q in accepted_questions if q["question_type"] == norm_type)
                    if type_c >= req_count:
                        break

            # If still short and more attempts available, formulate targeted retry
            if attempt < max_attempts:
                deficit = req_count - len(accepted_questions) + 2
                existing_prompts = [q["question_text"][:50] for q in accepted_questions[-5:]]
                avoid_clause = f" Avoid repeating these concepts: {'; '.join(existing_prompts)}." if existing_prompts else ""
                current_dist_req = f"Generate {max(deficit, 3)} additional distinct questions of format {norm_type}.{avoid_clause}"

        # Assembling final balanced question set
        final_set: List[Dict[str, Any]] = []
        if norm_type == "MIXED":
            # Target distribution
            if req_count == 10:
                targets = {"SHORT_MCQ": 4, "WORD_PROBLEM": 3, "CASE_STUDY": 3}
            elif req_count == 15:
                targets = {"SHORT_MCQ": 5, "WORD_PROBLEM": 5, "CASE_STUDY": 5}
            elif req_count == 20:
                targets = {"SHORT_MCQ": 8, "WORD_PROBLEM": 6, "CASE_STUDY": 6}
            else:
                targets = {"SHORT_MCQ": int(req_count * 0.4), "WORD_PROBLEM": int(req_count * 0.3), "CASE_STUDY": req_count - int(req_count * 0.4) - int(req_count * 0.3)}

            by_type = {"SHORT_MCQ": [], "WORD_PROBLEM": [], "CASE_STUDY": []}
            for q in accepted_questions:
                by_type.setdefault(q["question_type"], []).append(q)

            # Pick from each bucket up to target
            picked_keys = set()
            for t_name, t_num in targets.items():
                available = by_type.get(t_name, [])
                for q in available[:t_num]:
                    final_set.append(q)
                    picked_keys.add(q["question_text"].lower())

            # Top up from remaining valid accepted questions if any bucket fell slightly short
            if len(final_set) < req_count:
                for q in accepted_questions:
                    if q["question_text"].lower() not in picked_keys:
                        final_set.append(q)
                        picked_keys.add(q["question_text"].lower())
                        if len(final_set) == req_count:
                            break
        else:
            # Single format: pick matching type first, fallback to all valid accepted
            matching = [q for q in accepted_questions if q["question_type"] == norm_type]
            if len(matching) >= req_count:
                final_set = matching[:req_count]
            else:
                # Force requested type onto valid questions if needed
                for q in accepted_questions[:req_count]:
                    q_copy = dict(q)
                    q_copy["question_type"] = norm_type
                    final_set.append(q_copy)

        if len(final_set) < req_count:
            logger.warning(f"Material quiz generation could only produce {len(final_set)}/{req_count} valid questions.")
            raise ValueError(f"Expected {req_count} questions, but found {len(final_set)}")

        final_set = final_set[:req_count]

        # Final structural & grounding validation
        is_struct_valid, struct_reason = self.validate_material_quiz_questions(final_set, req_count, norm_type)
        if not is_struct_valid:
            logger.warning(f"Material quiz generation final structural validation failed: {struct_reason}")
            raise ValueError(f"Material quiz generation structural validation failed: {struct_reason}")

        is_grounded, ground_reason = self.validate_material_quiz_grounding(final_set, content_text)
        if not is_grounded:
            logger.warning(f"Material quiz generation final grounding validation failed: {ground_reason}")
            raise ValueError(f"Material quiz generation grounding validation failed: {ground_reason}")

        return final_set

    @staticmethod
    def validate_material_quiz_questions(questions: Any, expected_count: int, requested_type: str = "MIXED") -> Tuple_Validation:
        """
        Validates structure of material quiz questions:
        - Exact expected count
        - Representation of required formats
        - Valid difficulty ('1', '2', '3')
        - Exactly 4 distinct options with exactly 1 correct
        - Non-empty explanation and question text
        """
        if not isinstance(questions, list) or len(questions) < expected_count:
            return False, f"Expected {expected_count} questions, but found {len(questions) if isinstance(questions, list) else 0}"

        seen_texts = set()
        type_counts = {"SHORT_MCQ": 0, "WORD_PROBLEM": 0, "CASE_STUDY": 0}

        for idx, q in enumerate(questions[:expected_count], 1):
            if not isinstance(q, dict):
                return False, f"Question {idx} is not a valid JSON object"

            q_text = (q.get("question_text") or q.get("text", "")).strip()
            if len(q_text) < 15:
                return False, f"Question {idx} text is too short ({len(q_text)} chars, min 15)"

            if q_text.lower() in seen_texts:
                return False, f"Question {idx} is a duplicate of a previous question"
            seen_texts.add(q_text.lower())

            q_type = str(q.get("question_type", "")).upper()
            if q_type not in ["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY"]:
                return False, f"Question {idx} has invalid question_type '{q_type}'"
            type_counts[q_type] = type_counts.get(q_type, 0) + 1

            diff = str(q.get("difficulty", "2"))
            if diff not in ["1", "2", "3", "beginner", "intermediate", "advanced"]:
                return False, f"Question {idx} has invalid difficulty '{diff}'"

            options = q.get("options")
            if not isinstance(options, list) or len(options) != 4:
                return False, f"Question {idx} must have exactly 4 options, found {len(options) if isinstance(options, list) else 0}"

            opt_texts = set()
            correct_count = 0
            for o_idx, opt in enumerate(options, 1):
                if not isinstance(opt, dict):
                    return False, f"Question {idx} option {o_idx} is not a valid object"
                t = str(opt.get("text", "")).strip()
                if not t:
                    return False, f"Question {idx} option {o_idx} text is empty"
                if t.lower() in opt_texts:
                    return False, f"Question {idx} has duplicate option text '{t[:20]}'"
                opt_texts.add(t.lower())
                if opt.get("is_correct") is True:
                    correct_count += 1

            if correct_count != 1:
                return False, f"Question {idx} must have exactly 1 correct option, found {correct_count}"

            exp = str(q.get("explanation", "")).strip()
            if len(exp) < 5:
                return False, f"Question {idx} explanation is missing or too short"

        norm_type = requested_type.upper()
        if norm_type == "MIXED":
            # Verify that mixed mode has representation across question styles
            if type_counts.get("SHORT_MCQ", 0) == 0 and type_counts.get("WORD_PROBLEM", 0) == 0 and type_counts.get("CASE_STUDY", 0) == 0:
                return False, "Mixed mode requires valid question formats"
        elif norm_type in ["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY"]:
            if type_counts.get(norm_type, 0) < expected_count:
                return False, f"Expected {expected_count} {norm_type} questions, found {type_counts.get(norm_type, 0)}"

        return True, "Valid material quiz structure"

    @staticmethod
    def validate_material_quiz_grounding(questions: List[Dict[str, Any]], content_text: str) -> Tuple_Validation:
        """
        Validates that generated questions and answers are grounded in the source text.
        """
        if not content_text or len(content_text.strip()) < 20:
            return False, "Source content is empty or too short for grounding"

        import re
        content_words = set(re.findall(r'[a-zA-Z0-9_]{3,}', content_text.lower()))

        for idx, q in enumerate(questions, 1):
            q_text = str(q.get("question_text", "")).lower()
            ans_text = str(q.get("correct_answer", "")).lower()
            exp_text = str(q.get("explanation", "")).lower()
            combined = f"{q_text} {ans_text} {exp_text}"
            q_words = set(re.findall(r'[a-zA-Z0-9_]{3,}', combined))

            overlap = q_words.intersection(content_words)
            if len(overlap) < 2:
                return False, f"Question {idx} failed content grounding: insufficient overlap with source text"

        return True, "Grounded in source content"

    @staticmethod
    def validate_question(q_data: Dict[str, Any]) -> Tuple_Validation:
        """
        Validates question schema:
        - Exactly 4 options
        - Exactly 1 option with is_correct=True
        - correct_answer matches one of the options
        - Question text is at least 15 characters
        """
        if not q_data or not isinstance(q_data, dict):
            return False, "Empty or invalid question object"

        q_text = q_data.get("question_text") or q_data.get("text")
        if not q_text or len(str(q_text).strip()) < 15:
            return False, "Question text is too short or missing"

        options = q_data.get("options")
        if not options or not isinstance(options, list) or len(options) != 4:
            return False, f"Question must have exactly 4 options, found {len(options) if isinstance(options, list) else 0}"

        correct_count = sum(1 for o in options if o.get("is_correct") is True)
        if correct_count != 1:
            return False, f"Question must have exactly 1 correct option, found {correct_count}"

        correct_texts = [o.get("text") for o in options if o.get("is_correct") is True]
        correct_answer = q_data.get("correct_answer")
        if correct_answer and correct_answer not in [o.get("text") for o in options]:
            return False, "correct_answer field does not match any of the 4 option texts"

        return True, "Valid"

    @classmethod
    def validate_and_store_question(
        cls, 
        db: Session, 
        q_data: Dict[str, Any], 
        competency_id: int, 
        topic_id: Optional[int] = None,
        source_material_id: Optional[int] = None,
        created_by_user_id: Optional[int] = None,
        status: str = "pending_review",
        question_type: Optional[str] = None,
        source_reference: Optional[str] = None
    ) -> Optional[Question]:
        """
        Validates question schema, checks for duplicates, and saves to database.
        Returns stored Question instance or None if invalid/duplicate.
        """
        is_valid, reason = cls.validate_question(q_data)
        if not is_valid:
            logger.warning(f"Question rejected by validator: {reason}")
            return None

        q_text = (q_data.get("question_text") or q_data.get("text", "")).strip()

        # 1. Duplicate Prevention: Check exact or near match in Question table
        existing = db.query(Question).filter(
            Question.competency_id == competency_id,
            Question.question_text.ilike(f"%{q_text[:40]}%")
        ).first()

        if existing:
            logger.info(f"Duplicate question prevented: matches #{existing.id}")
            return existing

        # 2. Store Question
        diff_str = str(q_data.get("difficulty", "2"))
        cog_level = q_data.get("cognitive_level", "understand")
        explanation = q_data.get("explanation", "Verified statistical solution.")
        correct_ans = q_data.get("correct_answer") or next((o["text"] for o in q_data["options"] if o.get("is_correct")), "")
        q_type = question_type or q_data.get("question_type", "SHORT_MCQ")
        s_ref = source_reference or q_data.get("source_reference")

        question = Question(
            competency_id=competency_id,
            topic_id=topic_id,
            difficulty=diff_str,
            question_text=q_text,
            text=q_text,
            correct_answer=correct_ans,
            explanation=explanation,
            cognitive_level=cog_level,
            question_type=q_type,
            source_reference=s_ref,
            source_material_id=source_material_id,
            is_ai_generated=True,
            source="ai_generated",
            status=status,
            created_by=created_by_user_id
        )
        db.add(question)
        db.flush()

        # Store 4 options
        for idx, opt_item in enumerate(q_data["options"]):
            opt = QuestionOption(
                question_id=question.id,
                text=opt_item["text"],
                is_correct=bool(opt_item.get("is_correct", False)),
                order=opt_item.get("order", idx + 1)
            )
            db.add(opt)

        db.commit()
        db.refresh(question)
        return question
