import sys
import os
import time
import traceback
from pathlib import Path

# Adjust path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

os.chdir(str(backend_dir))

from database import SessionLocal
from models.material import LearningMaterial
from ai.service import AIService
from ai.openrouter_provider import OpenRouterProvider
from ai.gemini_provider import GeminiProvider
from ai.mock_provider import MockProvider
from config import settings

def log(msg):
    print(msg, flush=True)

def test_provider_raw(provider_name, provider):
    log(f"\n==========================================")
    log(f"Testing raw provider: {provider_name}")
    log(f"==========================================")
    t0 = time.time()
    try:
        res = provider.generate("Return a JSON with {\"status\": \"ok\", \"count\": 10}", "You are a JSON assistant", temperature=0.1, max_tokens=100)
        dt = time.time() - t0
        log(f"[{provider_name}] SUCCESS in {dt:.2f}s! Response: {res[:150]!r}")
    except Exception as e:
        dt = time.time() - t0
        log(f"[{provider_name}] FAILED in {dt:.2f}s: {e}")

def test_full_pipeline():
    log("=== DIAGNOSTICS FOR MATERIAL QUIZ GENERATION ===")
    log(f"Config AI_PROVIDER: {settings.AI_PROVIDER}")
    log(f"Config OPENROUTER_MODEL: {settings.OPENROUTER_MODEL}")
    log(f"Config GEMINI_MODEL: {settings.GEMINI_MODEL}")
    
    # 1. Test each provider directly
    test_provider_raw("MockProvider", MockProvider())
    test_provider_raw("GeminiProvider", GeminiProvider())
    test_provider_raw("OpenRouterProvider", OpenRouterProvider())

    db = SessionLocal()
    m = db.query(LearningMaterial).filter(LearningMaterial.id == 439).first() # SQL material
    if not m:
        m = db.query(LearningMaterial).order_by(LearningMaterial.id.desc()).first()
    
    log(f"\nTarget Material: #{m.id} '{m.title}' (Text length: {len(m.extracted_text or '')})")

    ai = AIService()
    log(f"AIService Active Provider: {ai.provider.__class__.__name__}")

    for q_type in ["MIXED", "SHORT_MCQ"]:
        log(f"\n--- Testing AIService.generate_material_quiz_questions(format={q_type}, count=10) ---")
        t0 = time.time()
        try:
            qs = ai.generate_material_quiz_questions(
                content_text=m.extracted_text,
                title=m.title,
                count=10,
                question_type=q_type,
                competency_name=m.competency.name if m.competency else None,
                topic_name=m.topic.name if m.topic else None
            )
            dt = time.time() - t0
            log(f"SUCCESS in {dt:.2f}s! Generated {len(qs)} questions:")
            for idx, q in enumerate(qs, 1):
                log(f"  Q{idx}: type={q.get('question_type')} | diff={q.get('difficulty')} | text={q.get('question_text')[:50]}")
        except Exception as e:
            dt = time.time() - t0
            log(f"FAILED in {dt:.2f}s with {type(e).__name__}: {e}")
            traceback.print_exc()

    db.close()

if __name__ == "__main__":
    test_full_pipeline()
