import json
import re
from ai.base import AIProvider

class MockProvider(AIProvider):
    def generate(self, prompt: str, system_prompt: str = '', temperature: float = 0.7, max_tokens: int = 2000) -> str:
        prompt_lower = prompt.lower()
        if "analyze" in prompt_lower and "competency" in prompt_lower:
            return json.dumps({"diagnosis": "User shows a solid understanding of basic statistics but lacks advanced analytical skills and programming knowledge. Focusing on Python and R for data manipulation is recommended."})
        elif "generate" in prompt_lower and "question" in prompt_lower:
            # Extract count if present
            count_match = re.search(r"generate (\d+)", prompt_lower)
            count = int(count_match.group(1)) if count_match else 5
            
            questions = []
            topics = [
                ("What is the primary advantage of stratified sampling?", "To ensure subgroups are adequately represented"),
                ("In hypothesis testing, what does a p-value represent?", "The probability of observing the data given the null hypothesis is true"),
                ("Which method handles missing data by predicting values?", "Imputation"),
                ("What is multicollinearity in regression?", "When independent variables are highly correlated"),
                ("Which visualization is best for showing distributions?", "Histogram"),
                ("What is the main purpose of an ANOVA test?", "To compare means across three or more groups")
            ]
            
            for i in range(min(count, len(topics))):
                topic, correct = topics[i]
                questions.append({
                    "text": topic,
                    "question_type": "mcq",
                    "difficulty": "intermediate",
                    "cognitive_level": "understand",
                    "options": [
                        {"text": correct, "is_correct": True, "order": 1},
                        {"text": "A completely unrelated concept", "is_correct": False, "order": 2},
                        {"text": "A common misconception", "is_correct": False, "order": 3},
                        {"text": "None of the above", "is_correct": False, "order": 4}
                    ],
                    "explanation": f"The correct answer is {correct} because it is fundamentally true in statistics."
                })
            return json.dumps(questions)
        elif "explain" in prompt_lower and "gap" in prompt_lower:
            return json.dumps({"explanation": "Your recent assessments indicate that while you grasp foundational statistical methods, your scores in applied programming and advanced modeling dropped slightly. Reviewing regression assumptions and Python libraries like pandas will help close this gap."})
        elif "recommend" in prompt_lower and "path" in prompt_lower:
            return json.dumps([
                {"course_id": 1, "reason": "Covers the fundamental gaps in your Statistical Methods knowledge."},
                {"course_id": 3, "reason": "Provides hands-on practice for Data Analysis."}
            ])
        elif "summarize" in prompt_lower:
            return json.dumps({
                "topics": ["Survey Design", "Sampling Methods", "Data Validation"],
                "competency_mappings": {"Survey Methodology": 0.9, "Sampling Techniques": 0.8, "Data Quality": 0.6}
            })
        return "{}"
