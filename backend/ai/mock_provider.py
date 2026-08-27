import json
import re
from ai.base import AIProvider

class MockProvider(AIProvider):
    """
    Mock / Offline AI Provider for SmartLearn.
    Returns calibrated statistical questions, grounded curriculum mappings, and diagnostic explanations.
    """

    def generate(self, prompt: str, system_prompt: str = '', temperature: float = 0.7, max_tokens: int = 2000) -> str:
        prompt_lower = prompt.lower()

        # 1. Question Generation (Single or Multiple)
        if "generate" in prompt_lower and ("question" in prompt_lower or "mcq" in prompt_lower):
            # Statistical Question Template Pool
            pool = [
                {
                    "question_text": "In a national socio-economic survey with high intra-stratum homogeneity and significant inter-stratum variation in household income, which sampling design minimizes the variance of the population mean estimator?",
                    "options": [
                        {"text": "Neyman Optimal Allocation Stratified Sampling", "is_correct": True, "order": 1},
                        {"text": "Simple Random Sampling without Replacement (SRSWOR)", "is_correct": False, "order": 2},
                        {"text": "Single-Stage Cluster Sampling with equal cluster sizes", "is_correct": False, "order": 3},
                        {"text": "Convenience Intercept Sampling", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "Neyman Optimal Allocation Stratified Sampling",
                    "explanation": "Neyman optimal allocation minimizes estimator variance by allocating sample sizes proportional to stratum size multiplied by stratum standard deviation ($n_h \\propto N_h S_h$).",
                    "competency": "Sampling Techniques",
                    "topic": "Stratified Sampling",
                    "difficulty": "2",
                    "cognitive_level": "analyze",
                    "concept": "Neyman Optimal Sample Allocation",
                    "source_reference": "MoSPI Sampling Methodologies Handbook (Section 4.2)"
                },
                {
                    "question_text": "In two-stage cluster sampling where primary sampling units (PSUs) are villages, what is the impact on estimator variance if the intra-cluster correlation coefficient (roh) is positive and large?",
                    "options": [
                        {"text": "The design effect exceeds 1.0, increasing estimator variance", "is_correct": True, "order": 1},
                        {"text": "Estimator variance drops to zero asymptotically", "is_correct": False, "order": 2},
                        {"text": "The effective sample size becomes equal to total sample size", "is_correct": False, "order": 3},
                        {"text": "Non-sampling error is automatically eliminated", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "The design effect exceeds 1.0, increasing estimator variance",
                    "explanation": "Positive intra-cluster correlation indicates homogeneity within clusters, resulting in Deff = 1 + (m-1)roh > 1 and higher standard errors.",
                    "competency": "Sampling Techniques",
                    "topic": "Cluster Sampling",
                    "difficulty": "2",
                    "cognitive_level": "analyze",
                    "concept": "Design Effect & Intra-Cluster Correlation",
                    "source_reference": "MoSPI Survey Methodology Guidelines (Section 5.3)"
                },
                {
                    "question_text": "When performing probabilistic record linkage on civil registration records without unique identifiers, which model calculates optimal log-likelihood agreement weights?",
                    "options": [
                        {"text": "Fellegi-Sunter Probabilistic Record Linkage Theory", "is_correct": True, "order": 1},
                        {"text": "K-Means Centroid Partitioning", "is_correct": False, "order": 2},
                        {"text": "Principal Component Dimensionality Reduction", "is_correct": False, "order": 3},
                        {"text": "Naive Cartesian Product Matching", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "Fellegi-Sunter Probabilistic Record Linkage Theory",
                    "explanation": "The Fellegi-Sunter methodology assigns weights based on m-probability (true match agreement) and u-probability (coincidental agreement).",
                    "competency": "Data Quality",
                    "topic": "Record Linkage",
                    "difficulty": "2",
                    "cognitive_level": "apply",
                    "concept": "Fellegi-Sunter Linkage Theory",
                    "source_reference": "MoSPI Official Quality Assurance Guidelines (Chapter 7)"
                },
                {
                    "question_text": "Under the Gauss-Markov theorem, which optimal property is satisfied by Ordinary Least Squares (OLS) regression estimators?",
                    "options": [
                        {"text": "Best Linear Unbiased Estimator (BLUE) with minimal variance", "is_correct": True, "order": 1},
                        {"text": "Exact zero standard errors across all sample sizes", "is_correct": False, "order": 2},
                        {"text": "Asymptotic non-linear maximum likelihood consistency", "is_correct": False, "order": 3},
                        {"text": "Total robustness to multicollinearity between regressors", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "Best Linear Unbiased Estimator (BLUE) with minimal variance",
                    "explanation": "The Gauss-Markov theorem proves that under spherical disturbance assumptions, OLS estimators have minimum variance among all linear unbiased estimators.",
                    "competency": "Statistical Methods",
                    "topic": "Regression Modeling",
                    "difficulty": "2",
                    "cognitive_level": "understand",
                    "concept": "Gauss-Markov Theorem",
                    "source_reference": "National Statistical Training Institute Courseware (Vol. 3)"
                },
                {
                    "question_text": "Which formula is officially utilized by MoSPI for compiling the Consumer Price Index (CPI) and Index of Industrial Production (IIP)?",
                    "options": [
                        {"text": "Modified Laspeyres Price Index Formula", "is_correct": True, "order": 1},
                        {"text": "Paasche Current Weighted Price Index", "is_correct": False, "order": 2},
                        {"text": "Fisher Ideal Geometric Mean Formula", "is_correct": False, "order": 3},
                        {"text": "Simple Unweighted Arithmetic Average", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "Modified Laspeyres Price Index Formula",
                    "explanation": "MoSPI utilizes the base-weighted Laspeyres formula using fixed base-period expenditure weights for macroeconomic index tabulation.",
                    "competency": "Data Interpretation",
                    "topic": "Price Indices",
                    "difficulty": "2",
                    "cognitive_level": "apply",
                    "concept": "Laspeyres Index Formulation",
                    "source_reference": "MoSPI CPI Compilation Manual (Chapter 2)"
                },
                {
                    "question_text": "In survey quality audit procedures, how is Unit Non-Response distinguished from Item Non-Response?",
                    "options": [
                        {"text": "Unit non-response is total absence of a selected sample unit, while item non-response is missing data for specific questions", "is_correct": True, "order": 1},
                        {"text": "Unit non-response only occurs in enterprise surveys", "is_correct": False, "order": 2},
                        {"text": "Item non-response is corrected by complete replacement of the household", "is_correct": False, "order": 3},
                        {"text": "Both types are identical in mathematical estimation", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "Unit non-response is total absence of a selected sample unit, while item non-response is missing data for specific questions",
                    "explanation": "Unit non-response requires sample weighting adjustments, whereas item non-response is typically addressed via imputation methods.",
                    "competency": "Survey Methodology",
                    "topic": "Non-Sampling Errors",
                    "difficulty": "2",
                    "cognitive_level": "understand",
                    "concept": "Non-Response Categorization",
                    "source_reference": "MoSPI Standards for Survey Operations (Section 3.1)"
                },
                {
                    "question_text": "Which imputation technique replaces a missing observation with the value from a similar responding unit within the same demographic cell?",
                    "options": [
                        {"text": "Hot-Deck Imputation", "is_correct": True, "order": 1},
                        {"text": "Zero-Filling Default Replacement", "is_correct": False, "order": 2},
                        {"text": "Mean Substitution across entire national sample", "is_correct": False, "order": 3},
                        {"text": "Deterministic Random Drop", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "Hot-Deck Imputation",
                    "explanation": "Hot-deck imputation donors are selected from the current sample survey records matching specified auxiliary stratification criteria.",
                    "competency": "Data Quality",
                    "topic": "Imputation Methods",
                    "difficulty": "2",
                    "cognitive_level": "apply",
                    "concept": "Hot-Deck Imputation",
                    "source_reference": "National Statistical Quality Assurance Framework (Section 6.4)"
                },
                {
                    "question_text": "In Gross Value Added (GVA) estimation for national accounting, what is the formula relating Basic Prices to Factor Cost?",
                    "options": [
                        {"text": "GVA at Basic Prices = GVA at Factor Cost + Production Taxes - Production Subsidies", "is_correct": True, "order": 1},
                        {"text": "GVA at Basic Prices = GDP at Market Prices - Intermediate Consumption", "is_correct": False, "order": 2},
                        {"text": "GVA at Basic Prices = GVA at Factor Cost + Product Taxes - Product Subsidies", "is_correct": False, "order": 3},
                        {"text": "GVA at Basic Prices = Net National Income + Depreciation", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "GVA at Basic Prices = GVA at Factor Cost + Production Taxes - Production Subsidies",
                    "explanation": "Under SNA 2008 standards adopted by MoSPI, Basic Prices include production taxes/subsidies but exclude product taxes/subsidies.",
                    "competency": "Data Interpretation",
                    "topic": "National Accounts",
                    "difficulty": "3",
                    "cognitive_level": "analyze",
                    "concept": "GVA Compilation System of National Accounts",
                    "source_reference": "National Accounts Statistics Sources & Methods (Chapter 1)"
                },
                {
                    "question_text": "What is the primary diagnostic utility of the Variance Inflation Factor (VIF) in multiple linear regression analysis?",
                    "options": [
                        {"text": "Quantifying the severity of multicollinearity among explanatory regressors", "is_correct": True, "order": 1},
                        {"text": "Testing for first-order autoregressive autocorrelation in residuals", "is_correct": False, "order": 2},
                        {"text": "Detecting non-constant error variance (heteroscedasticity)", "is_correct": False, "order": 3},
                        {"text": "Determining optimal sample stratification boundaries", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "Quantifying the severity of multicollinearity among explanatory regressors",
                    "explanation": "VIF measures how much the variance of an estimated regression coefficient increases when regressors are correlated ($VIF = 1 / (1 - R_j^2)$). A VIF > 5 or 10 suggests severe collinearity.",
                    "competency": "Statistical Methods",
                    "topic": "Regression Diagnostics",
                    "difficulty": "2",
                    "cognitive_level": "apply",
                    "concept": "Variance Inflation Factor",
                    "source_reference": "Statistical Analysis for Official Surveys (Vol. 2)"
                },
                {
                    "question_text": "In the Periodic Labour Force Survey (PLFS), how is the Current Weekly Status (CWS) of an individual defined?",
                    "options": [
                        {"text": "Activity status determined on the basis of a reference period of 7 days preceding the survey date", "is_correct": True, "order": 1},
                        {"text": "Activity status determined over a 365-day major time reference period", "is_correct": False, "order": 2},
                        {"text": "Employment status on the single interview day only", "is_correct": False, "order": 3},
                        {"text": "Average working hours recorded across the preceding quarter", "is_correct": False, "order": 4}
                    ],
                    "correct_answer": "Activity status determined on the basis of a reference period of 7 days preceding the survey date",
                    "explanation": "Current Weekly Status measures economic activity during the 7-day recall window preceding enumeration, capturing short-term employment fluctuations.",
                    "competency": "Survey Methodology",
                    "topic": "PLFS Labour Indicators",
                    "difficulty": "2",
                    "cognitive_level": "understand",
                    "concept": "Current Weekly Status Activity Classification",
                    "source_reference": "MoSPI Periodic Labour Force Survey Concepts & Definitions (Chapter 3)"
                }
            ]

            # Detect requested count from prompt
            count_match = re.search(r'generate\s+(\d+)', prompt_lower)
            req_count = int(count_match.group(1)) if count_match else 1
            if "json array" in prompt_lower and req_count < 2:
                req_count = 3

            # Check if avoid concepts mentioned
            avoid_text = ""
            if "avoid repeating" in prompt_lower:
                avoid_text = prompt_lower.split("avoid repeating")[1]

            available = [q for q in pool if q["question_text"][:30].lower() not in avoid_text]
            if not available:
                available = pool

            if req_count > 1:
                selected = (available * ((req_count // len(available)) + 1))[:req_count]
                # Adjust numbering if repeated
                result = []
                for idx, q in enumerate(selected):
                    q_copy = dict(q)
                    if idx >= len(available):
                        q_copy["question_text"] = f"[Variant {idx+1}] " + q_copy["question_text"]
                    result.append(q_copy)
                return json.dumps(result)
            else:
                return json.dumps(available[0])

        # 2. AI Gap Diagnosis & Explanation
        elif "diagnose" in prompt_lower or "gap" in prompt_lower or "root" in prompt_lower:
            return json.dumps({
                "primary_gap": "Stratified Sampling Allocation & Variance Estimation",
                "root_cause": "Theoretical confusion between proportional versus Neyman optimal sample allocation when stratum variances differ significantly.",
                "explanation": "In your recent assessment, while basic random sampling concepts were answered correctly, advanced questions involving stratum-weighted standard errors and Neyman allocation formulas were missed, creating an active 22% deficit gap.",
                "recommended_focus": "Study MoSPI Module on Stratified Survey Design and Neyman Sample Size Distribution.",
                "confidence": 90.0
            })

        # 3. Document Material Ingestion & Summarization
        elif "summarize" in prompt_lower or "extract" in prompt_lower:
            return json.dumps({
                "title": "Extracted MoSPI Training Manual",
                "topics": ["Stratified Sampling", "Cluster Sampling", "Record Linkage", "Price Indices"],
                "competency_mappings": {
                    "Sampling Techniques": 0.85,
                    "Survey Methodology": 0.75,
                    "Data Quality": 0.60
                },
                "summary": "Covers field survey design, sample size determination, non-sampling error minimization, and official data validation rules."
            })

        return "{}"
