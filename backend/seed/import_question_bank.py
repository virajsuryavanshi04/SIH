import json
import logging
import os
import sys
from pathlib import Path

# Add backend root to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database import SessionLocal
from models.assessment import Question, QuestionOption
from models.competency import Competency, CompetencyTopic

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("import_question_bank")

# 1. Canonical Competency Name Mapping (JSON competency -> DB competency name)
COMPETENCY_MAPPING = {
    "Statistical Methods": "Statistical Methods",
    "Survey Methodology": "Survey Methodology",
    "Sampling Techniques": "Sampling Techniques",
    "Data Quality & Validation": "Data Quality",
    "Data Analysis": "Data Analysis",
    "Data Visualization": "Data Visualization",
    "Statistical Programming": "Statistical Programming",
    "Data Interpretation": "Data Interpretation",
}

# 2. Canonical Topic Mapping (JSON (competency, topic) -> DB topic name)
TOPIC_MAPPING = {
    # Statistical Methods
    ("Statistical Methods", "Probability Distributions"): "Probability Distributions",
    ("Statistical Methods", "Measures of Central Tendency"): "Statistical Inference",
    ("Statistical Methods", "Measures of Dispersion"): "Statistical Inference",
    ("Statistical Methods", "Central Tendency Calculation"): "Statistical Inference",
    ("Statistical Methods", "Hypothesis Testing"): "Hypothesis Testing",
    ("Statistical Methods", "Correlation"): "Hypothesis Testing",
    ("Statistical Methods", "Regression Interpretation"): "Hypothesis Testing",
    ("Statistical Methods", "Statistical Inference"): "Statistical Inference",
    ("Statistical Methods", "Statistical Inference / Significance vs Effect Size"): "Statistical Inference",
    ("Statistical Methods", "Index Numbers"): "Statistical Inference",
    ("Statistical Methods", "Time Series Analysis"): "Statistical Inference",

    # Survey Methodology
    ("Survey Methodology", "Questionnaire Design"): "Questionnaire Design",
    ("Survey Methodology", "Data Collection Modes"): "Questionnaire Design",
    ("Survey Methodology", "Non-Response"): "Non-Response Adjustment",
    ("Survey Methodology", "Non-Response Bias"): "Non-Response Adjustment",
    ("Survey Methodology", "Measurement Error"): "Non-Response Adjustment",
    ("Survey Methodology", "Coverage Error"): "Non-Response Adjustment",
    ("Survey Methodology", "Field Operations & Audits"): "Field Operations & Audits",
    ("Survey Methodology", "Survey Planning"): "Field Operations & Audits",
    ("Survey Methodology", "Census vs Sample Survey Trade-offs"): "Field Operations & Audits",
    ("Survey Methodology", "Survey Design Trade-offs"): "Field Operations & Audits",
    ("Survey Methodology", "Multi-Error Diagnosis"): "Field Operations & Audits",

    # Sampling Techniques
    ("Sampling Techniques", "Sampling Fundamentals"): "Sampling Fundamentals",
    ("Sampling Techniques", "Census vs Sample Survey"): "Sampling Fundamentals",
    ("Sampling Techniques", "Probability Sampling"): "Sampling Fundamentals",
    ("Sampling Techniques", "Choosing a Sampling Design"): "Sampling Fundamentals",
    ("Sampling Techniques", "Sample Size Determination"): "Sampling Fundamentals",
    ("Sampling Techniques", "Systematic Sampling"): "Sampling Fundamentals",
    ("Sampling Techniques", "Stratified Sampling Allocation"): "Stratified Random Sampling",
    ("Sampling Techniques", "Coefficient of Variation & Design Efficiency"): "Stratified Random Sampling",
    ("Sampling Techniques", "Design Trade-offs: Stratification vs Clustering"): "Stratified Random Sampling",
    ("Sampling Techniques", "Multi-Stage Sampling"): "Cluster & Multi-Stage Sampling",
    ("Sampling Techniques", "Cluster Sampling Efficiency"): "Cluster & Multi-Stage Sampling",

    # Data Quality & Validation
    ("Data Quality & Validation", "Validation Rules"): "Rule-Based Validation",
    ("Data Quality & Validation", "Logical Consistency"): "Rule-Based Validation",
    ("Data Quality & Validation", "Missing Values"): "Rule-Based Validation",
    ("Data Quality & Validation", "Validation Workflow Design"): "Rule-Based Validation",
    ("Data Quality & Validation", "Data Quality Dimensions"): "Rule-Based Validation",
    ("Data Quality & Validation", "QA Resource Allocation Trade-offs"): "Rule-Based Validation",
    ("Data Quality & Validation", "Root-Cause Diagnosis and Correction"): "Rule-Based Validation",
    ("Data Quality & Validation", "Outlier Detection"): "Anomaly & Outlier Scoring",
    ("Data Quality & Validation", "Anomaly & Outlier Scoring"): "Anomaly & Outlier Scoring",
    ("Data Quality & Validation", "Duplicate Detection"): "Anomaly & Outlier Scoring",
    ("Data Quality & Validation", "Record Linkage"): "Record Linkage",
    ("Data Quality & Validation", "Data Linkage Quality"): "Record Linkage",

    # Data Analysis
    ("Data Analysis", "Descriptive vs Inferential Statistics"): "Descriptive Statistics",
    ("Data Analysis", "Exploratory Data Analysis"): "Descriptive Statistics",
    ("Data Analysis", "Handling Outliers Transparently"): "Descriptive Statistics",
    ("Data Analysis", "Robust Comparison of Groups"): "Descriptive Statistics",
    ("Data Analysis", "Selecting the Appropriate Analytical Method"): "Descriptive Statistics",
    ("Data Analysis", "Linear & Logistic Regression"): "Linear & Logistic Regression",
    ("Data Analysis", "Regression Diagnostics"): "Linear & Logistic Regression",
    ("Data Analysis", "Correlation vs Causation"): "Linear & Logistic Regression",
    ("Data Analysis", "Confounding in Aggregate Analysis"): "Linear & Logistic Regression",
    ("Data Analysis", "Time Series & Forecasting"): "Time Series & Forecasting",
    ("Data Analysis", "Trend Analysis Accounting for Sampling Variability"): "Time Series & Forecasting",
    ("Data Analysis", "Trend and Percentage Change Calculation"): "Time Series & Forecasting",

    # Data Visualization
    ("Data Visualization", "Statistical Charts"): "Statistical Charts",
    ("Data Visualization", "Chart Selection for Comparison"): "Statistical Charts",
    ("Data Visualization", "Chart Selection for Trends"): "Statistical Charts",
    ("Data Visualization", "Chart Selection for Categorical Composition"): "Statistical Charts",
    ("Data Visualization", "Visualizing Distributions"): "Statistical Charts",
    ("Data Visualization", "Scale Interpretation"): "Statistical Charts",
    ("Data Visualization", "Misleading Visualizations"): "Statistical Charts",
    ("Data Visualization", "Diagnosing Dual-Axis Distortion"): "Statistical Charts",
    ("Data Visualization", "Audience-Appropriate Dissemination Design"): "Statistical Charts",
    ("Data Visualization", "Communicating Statistical Uncertainty"): "Statistical Charts",
    ("Data Visualization", "Choropleth Mapping"): "Choropleth Mapping",
    ("Data Visualization", "Diagnosing Area-Based Distortion"): "Choropleth Mapping",

    # Statistical Programming
    ("Statistical Programming", "Python for Data Manipulation"): "Python for Data Manipulation",
    ("Statistical Programming", "Data Manipulation - Filtering"): "Python for Data Manipulation",
    ("Statistical Programming", "Data Transformation Pipeline Reasoning"): "Python for Data Manipulation",
    ("Statistical Programming", "Grouped Aggregation"): "Python for Data Manipulation",
    ("Statistical Programming", "Interpreting Aggregation Output"): "Python for Data Manipulation",
    ("Statistical Programming", "Missing Value Handling"): "Python for Data Manipulation",
    ("Statistical Programming", "Debugging Analytical Logic"): "Python for Data Manipulation",
    ("Statistical Programming", "Diagnosing Cross-Tool Discrepancies"): "Python for Data Manipulation",
    ("Statistical Programming", "R for Official Statistics"): "R for Official Statistics",
    ("Statistical Programming", "Automated Validation in Pipelines"): "R for Official Statistics",
    ("Statistical Programming", "Reproducibility and Data Versioning"): "R for Official Statistics",
    ("Statistical Programming", "Reproducible Workflow Design"): "R for Official Statistics",

    # Data Interpretation
    ("Data Interpretation", "National Accounts"): "National Accounts",
    ("Data Interpretation", "Reading Tables"): "National Accounts",
    ("Data Interpretation", "Table Interpretation with Calculation"): "National Accounts",
    ("Data Interpretation", "Clarifying Divergent Indicator Definitions"): "National Accounts",
    ("Data Interpretation", "Reconciling Conflicting Welfare Indicators"): "National Accounts",
    ("Data Interpretation", "Interpreting Enrolment Indicators for Policy"): "National Accounts",
    ("Data Interpretation", "Price Indices"): "Price Indices",
    ("Data Interpretation", "Percentage Change Calculation"): "Price Indices",
    ("Data Interpretation", "Percentage Points vs Percentage Change"): "Price Indices",
    ("Data Interpretation", "Weighted Average Calculation"): "Price Indices",
    ("Data Interpretation", "Interpreting Trends with Statistical Caution"): "Price Indices",
    ("Data Interpretation", "Interpreting Cross-Tabulated Data Cautiously"): "Price Indices",
}

# 3. Difficulty Normalization (JSON -> canonical DB string representation)
DIFFICULTY_MAPPING = {
    "EASY": "1",
    "MEDIUM": "2",
    "HARD": "3",
    "1": "1",
    "2": "2",
    "3": "3",
}

COGNITIVE_MAPPING = {
    "EASY": "understand",
    "MEDIUM": "apply",
    "HARD": "analyze",
    "1": "understand",
    "2": "apply",
    "3": "analyze",
}


def import_questions(json_path: str = None, dry_run: bool = False):
    """
    Imports the 80-question bank into the SmartLearn database.
    Idempotent: Skips questions if bank_question_id already exists.
    """
    if not json_path:
        json_path = os.path.join(backend_dir, "seed", "question_bank", "smartlearn_question_bank.json")

    logger.info(f"Loading question bank from: {json_path}")
    if not os.path.exists(json_path):
        logger.error(f"File not found: {json_path}")
        return {"status": "error", "message": f"File not found: {json_path}"}

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    qb_meta = data.get("question_bank", {})
    bank_version = qb_meta.get("version", "1.0")
    questions = qb_meta.get("questions", [])

    logger.info(f"Question bank version: {bank_version}, Total questions in file: {len(questions)}")

    db = SessionLocal()
    try:
        # Pre-fetch competencies and topics for fast lookup
        competencies = {c.name: c.id for c in db.query(Competency).all()}
        topics_by_comp_and_name = {
            (t.competency_id, t.name.lower()): t.id for t in db.query(CompetencyTopic).all()
        }

        logger.info(f"Found {len(competencies)} existing competencies in database: {list(competencies.keys())}")

        imported_count = 0
        skipped_count = 0
        error_count = 0

        for q in questions:
            bank_qid = q.get("question_id")
            if not bank_qid:
                logger.warning("Skipping question without question_id")
                error_count += 1
                continue

            # Check idempotency
            existing_q = db.query(Question).filter(Question.bank_question_id == bank_qid).first()
            if existing_q:
                logger.debug(f"Question {bank_qid} already exists (#ID {existing_q.id}). Skipping.")
                skipped_count += 1
                continue

            # 1. Resolve Competency
            raw_comp_name = q.get("competency")
            canonical_comp_name = COMPETENCY_MAPPING.get(raw_comp_name, raw_comp_name)
            comp_id = competencies.get(canonical_comp_name)
            if not comp_id:
                logger.error(f"Could not map competency '{raw_comp_name}' for question {bank_qid}")
                error_count += 1
                continue

            # 2. Resolve Topic
            raw_topic_name = q.get("topic", "")
            mapped_topic_name = TOPIC_MAPPING.get((raw_comp_name, raw_topic_name))
            topic_id = None
            if mapped_topic_name:
                topic_id = topics_by_comp_and_name.get((comp_id, mapped_topic_name.lower()))
            if not topic_id:
                # Fallback: check exact topic name match under this competency
                topic_id = topics_by_comp_and_name.get((comp_id, raw_topic_name.lower()))

            # 3. Resolve Difficulty & Cognitive Level
            raw_diff = str(q.get("difficulty", "MEDIUM")).upper()
            diff_val = DIFFICULTY_MAPPING.get(raw_diff, "2")
            cog_val = COGNITIVE_MAPPING.get(raw_diff, "understand")

            # 4. Resolve Question Type & Source
            q_type = q.get("question_type", "SHORT_MCQ")
            src_info = q.get("source", {})
            if isinstance(src_info, dict):
                source_type_val = src_info.get("source_type", "STANDARD_STATISTICAL_KNOWLEDGE")
                source_title_val = src_info.get("source_title", "Established statistical/survey methodology principles")
                source_org_val = src_info.get("source_organization", "N/A")
                source_ref_val = src_info.get("source_reference", "N/A")
            else:
                source_type_val = "STANDARD_STATISTICAL_KNOWLEDGE"
                source_title_val = str(src_info)
                source_org_val = "N/A"
                source_ref_val = "N/A"

            q_text = q.get("question_text", "").strip()
            explanation_text = q.get("explanation", "").strip()
            correct_ans_letter = q.get("correct_answer", "A")

            # 5. Resolve Options
            options_list = q.get("options", [])
            correct_ans_text = ""
            for opt in options_list:
                if opt.get("id") == correct_ans_letter:
                    correct_ans_text = opt.get("text", "")
                    break

            if not dry_run:
                # Create Question record
                new_q = Question(
                    competency_id=comp_id,
                    topic_id=topic_id,
                    difficulty=diff_val,
                    question_text=q_text,
                    text=q_text,
                    correct_answer=correct_ans_text,
                    explanation=explanation_text,
                    cognitive_level=cog_val,
                    question_type=q_type,
                    bank_question_id=bank_qid,
                    bank_version=bank_version,
                    source_type=source_type_val,
                    source_title=source_title_val,
                    source_organization=source_org_val,
                    source_reference=source_ref_val,
                    is_ai_generated=True,
                    source="ai_generated",
                    status="pending_review",  # Governed: all new imports start as pending_review
                )
                db.add(new_q)
                db.flush()

                # Insert 4 options
                for idx, opt in enumerate(options_list):
                    is_corr = (opt.get("id") == correct_ans_letter)
                    opt_record = QuestionOption(
                        question_id=new_q.id,
                        text=opt.get("text", ""),
                        is_correct=is_corr,
                        order=idx + 1
                    )
                    db.add(opt_record)

            imported_count += 1

        if not dry_run:
            db.commit()
            logger.info(f"Database commit successful. Imported: {imported_count}, Skipped (duplicates): {skipped_count}, Errors: {error_count}")
        else:
            logger.info(f"Dry run complete. Would import: {imported_count}, Would skip: {skipped_count}, Errors: {error_count}")

        return {
            "status": "success",
            "imported": imported_count,
            "skipped": skipped_count,
            "errors": error_count,
            "total_processed": len(questions)
        }

    except Exception as e:
        db.rollback()
        logger.exception(f"Error during import: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


if __name__ == "__main__":
    result = import_questions()
    print("\n=== IMPORT RESULT ===")
    print(json.dumps(result, indent=2))
