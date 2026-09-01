import sys
import os
import time
import json
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

os.chdir(str(backend_dir))

from database import SessionLocal
from models.material import LearningMaterial
from ai.openrouter_provider import OpenRouterProvider
from ai.service import AIService

db = SessionLocal()
m = db.query(LearningMaterial).filter(LearningMaterial.id == 439).first()
ai = AIService()

req_count = 10
norm_type = 'MIXED'
dist_instruction = 'Generate EXACTLY 10 questions: 4 SHORT_MCQ, 3 WORD_PROBLEM, and 3 CASE_STUDY.'
comp_clause = 'Personal Material Study Assessment'

system_prompt = (
    'You are an expert assessment generator and psychometrician for SmartLearn. '
    'Generate calibrated, high-yield Multiple Choice Questions strictly grounded in the provided source text. '
    'CRITICAL GROUNDING RULES:\n'
    '1. Use ONLY facts, definitions, procedures, formulas, and relationships present in the source text.\n'
    '2. Do NOT invent unsupported facts, external definitions, or ungrounded statistics.\n'
    '3. For Word Problems, ensure all scenarios and computations are internally consistent and grounded in the source text.\n'
    '4. For Case Studies, provide a 2-4 sentence realistic workplace scenario followed by an applied problem-solving question.\n'
    '5. Calibrate difficulty across Level 1 (Easy/Foundational), Level 2 (Medium/Applied), and Level 3 (Hard/Analytical).\n'
    '6. Every question must have EXACTLY 4 distinct options with EXACTLY 1 correct option.\n'
    '7. Return valid JSON only matching the schema.'
)

prompt = f"""
Generate {req_count} calibrated material quiz questions based strictly on the following text:
---
{m.extracted_text[:4000]}
---
Document Title: {m.title or 'Learning Material'}
{comp_clause}
Distribution Requirement: {dist_instruction}

Required JSON Output Schema:
{{
  "questions": [
    {{
      "question_text": "Clear question or scenario prompt (minimum 15 characters)",
      "question_type": "SHORT_MCQ | WORD_PROBLEM | CASE_STUDY",
      "difficulty": "1 | 2 | 3",
      "cognitive_level": "understand | apply | analyze",
      "options": [
        {{"text": "Correct Option Text", "is_correct": true, "order": 1}},
        {{"text": "Plausible Distractor 1", "is_correct": false, "order": 2}},
        {{"text": "Plausible Distractor 2", "is_correct": false, "order": 3}},
        {{"text": "Plausible Distractor 3", "is_correct": false, "order": 4}}
      ],
      "correct_answer": "Exact text of the correct option",
      "explanation": "Detailed explanation explaining why the correct answer is valid based on the text",
      "concept": "Concept tested"
    }}
  ]
}}
"""

print('Sending request to OpenRouterProvider...', flush=True)
t0 = time.time()
raw_resp = OpenRouterProvider().generate(prompt, system_prompt=system_prompt, temperature=0.25, max_tokens=4000)
dt = time.time() - t0
print(f'Done in {dt:.2f}s! Raw length: {len(raw_resp)}', flush=True)
print('--- RAW RESPONSE (First 400 chars) ---', flush=True)
print(raw_resp[:400], flush=True)
print('--- RAW RESPONSE (Last 400 chars) ---', flush=True)
print(raw_resp[-400:], flush=True)

parsed = ai._parse_json(raw_resp)
print(f'Parsed type: {type(parsed)}', flush=True)
if isinstance(parsed, dict):
    print(f'Keys: {list(parsed.keys())}', flush=True)
    qs = parsed.get('questions', [])
    print(f'Questions count: {len(qs)}', flush=True)
    if len(qs) == 0:
        print('FULL RAW TEXT:', flush=True)
        print(raw_resp, flush=True)
    else:
        for idx, q in enumerate(qs, 1):
            print(f'Q{idx}: type={q.get("question_type")}, diff={q.get("difficulty")}, text={q.get("question_text")[:40]}', flush=True)
        valid, reason = ai.validate_material_quiz_questions(qs, 10, 'MIXED')
        print(f'validate_material_quiz_questions: valid={valid}, reason={reason}', flush=True)
        is_grounded, ground_reason = ai.validate_material_quiz_grounding(qs, m.extracted_text)
        print(f'validate_material_quiz_grounding: grounded={is_grounded}, reason={ground_reason}', flush=True)

db.close()
