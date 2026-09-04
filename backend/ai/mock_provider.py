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

        # 0. Material Quiz MCQ Generation (Phase 5C)
        if ("material quiz" in prompt_lower or "material_quiz" in prompt_lower or "calibrated material quiz" in prompt_lower) and ("question" in prompt_lower or "mcq" in prompt_lower) and "flashcard" not in prompt_lower:
            is_tcp_udp = "tcp" in prompt_lower and "udp" in prompt_lower
            
            # Detect count
            req_count = 10
            c_match = re.search(r'generate\s+(\d+)', prompt_lower)
            if c_match:
                req_count = int(c_match.group(1))

            # Detect requested question_type
            q_type = "MIXED"
            if "of type short_mcq" in prompt_lower or "format short_mcq" in prompt_lower or ("short_mcq" in prompt_lower and "word_problem" not in prompt_lower and "case_study" not in prompt_lower):
                q_type = "SHORT_MCQ"
            elif "of type word_problem" in prompt_lower or "format word_problem" in prompt_lower or ("word_problem" in prompt_lower and "short_mcq" not in prompt_lower and "case_study" not in prompt_lower):
                q_type = "WORD_PROBLEM"
            elif "of type case_study" in prompt_lower or "format case_study" in prompt_lower or ("case_study" in prompt_lower and "short_mcq" not in prompt_lower and "word_problem" not in prompt_lower):
                q_type = "CASE_STUDY"
            elif "distributed across" in prompt_lower or "mixed" in prompt_lower:
                q_type = "MIXED"

            # Distribution calculation for MIXED
            if q_type == "MIXED":
                if req_count == 10:
                    counts = [("SHORT_MCQ", 4), ("WORD_PROBLEM", 3), ("CASE_STUDY", 3)]
                elif req_count == 13:
                    counts = [("SHORT_MCQ", 5), ("WORD_PROBLEM", 4), ("CASE_STUDY", 4)]
                elif req_count == 15:
                    counts = [("SHORT_MCQ", 5), ("WORD_PROBLEM", 5), ("CASE_STUDY", 5)]
                elif req_count == 18:
                    counts = [("SHORT_MCQ", 6), ("WORD_PROBLEM", 6), ("CASE_STUDY", 6)]
                elif req_count == 20:
                    counts = [("SHORT_MCQ", 8), ("WORD_PROBLEM", 6), ("CASE_STUDY", 6)]
                elif req_count == 24:
                    counts = [("SHORT_MCQ", 9), ("WORD_PROBLEM", 8), ("CASE_STUDY", 7)]
                else:
                    sm = max(1, int(req_count * 0.4))
                    wp = max(1, int(req_count * 0.3))
                    cs = max(1, req_count - sm - wp)
                    counts = [("SHORT_MCQ", sm), ("WORD_PROBLEM", wp), ("CASE_STUDY", cs)]
            else:
                counts = [(q_type, req_count)]

            is_sampling = "sampling" in prompt_lower or "stratif" in prompt_lower or "neyman" in prompt_lower or "cluster" in prompt_lower
            
            # Extract material snippet if available
            extracted_snippet = ""
            if "---" in prompt:
                parts = prompt.split("---")
                if len(parts) >= 3:
                    extracted_snippet = parts[1].strip()

            sentences = [s.strip() for s in re.split(r'[\.\n;]+', extracted_snippet) if len(s.strip()) > 15] if extracted_snippet else []

            generated = []
            q_idx = 1
            for typ, n in counts:
                for i in range(n):
                    diff = str(((i + len(generated)) % 3) + 1)  # alternate 1, 2, 3
                    if is_tcp_udp:
                        if typ == "SHORT_MCQ":
                            qt = f"What fundamental transport property distinguishes TCP from UDP under variable network conditions? (Item {q_idx})"
                            ans = "TCP provides reliable, connection-oriented byte stream transmission with error checking."
                            d1 = "TCP transmits datagrams without establishing a connection."
                            d2 = "TCP prioritizes low latency over packet acknowledgment."
                            d3 = "TCP eliminates the need for IP layer routing."
                            exp = "TCP guarantees delivery via sequence numbers and acknowledgments, whereas UDP is connectionless and unacknowledged."
                        elif typ == "WORD_PROBLEM":
                            qt = f"A real-time financial telemetry application requires low-latency packet delivery where occasional dropped packets are acceptable. Which transport protocol configuration should the network engineer implement? (Item {q_idx})"
                            ans = "User Datagram Protocol (UDP) with application-level timestamping."
                            d1 = "Transmission Control Protocol (TCP) with three-way handshake."
                            d2 = "Synchronous point-to-point leased circuit without packet headers."
                            d3 = "Persistent TCP socket with retransmission timers set to infinite."
                            exp = "UDP incurs minimal transmission overhead and zero retransmission latency, making it optimal for time-sensitive financial streams."
                        else:  # CASE_STUDY
                            qt = f"Case Study: An enterprise statistical data center is deploying a distributed file replication service across multiple cloud regions. Given that data integrity is strictly mandatory and silent corruption cannot be tolerated, which transport mechanism is required? (Item {q_idx})"
                            ans = "TCP connection with checksum verification and guaranteed acknowledgment."
                            d1 = "Raw UDP broadcast across unencrypted UDP ports."
                            d2 = "Connectionless multicast without sequence verification."
                            d3 = "Stateless datagram transmission bypassing transport sockets."
                            exp = "The replication service demands complete byte-level data integrity, which is guaranteed by TCP's connection orientation and flow control."
                    elif is_sampling or not sentences:
                        if typ == "SHORT_MCQ":
                            qt = f"In statistical sampling methodology, what is the primary purpose of stratification when population variance varies across subgroups? (Item {q_idx})"
                            ans = "To partition heterogeneous population units into homogeneous strata, thereby reducing estimator variance."
                            d1 = "To maximize the non-sampling error across all enumeration blocks."
                            d2 = "To eliminate the necessity of probability sample selection."
                            d3 = "To ensure equal sample allocation regardless of stratum standard deviation."
                            exp = "Stratification ensures internal homogeneity within strata, yielding higher precision and lower standard errors."
                        elif typ == "WORD_PROBLEM":
                            qt = f"A field survey supervisor has 500 enumeration units divided into rural and urban strata with standard deviations of 12 and 24 respectively. Under Neyman optimal allocation, which stratum receives a larger sampling fraction? (Item {q_idx})"
                            ans = "The urban stratum receives a proportionally larger sample due to its higher standard deviation."
                            d1 = "The rural stratum receives all samples because of geographical size."
                            d2 = "Both strata receive identical sample sizes regardless of standard deviation."
                            d3 = "Sample allocation is determined solely by convenience sampling."
                            exp = "Neyman optimal allocation distributes sample size proportional to stratum size multiplied by stratum standard deviation (n_h proportional to N_h * S_h)."
                        else:  # CASE_STUDY
                            qt = f"Case Study: The National Statistics Office is conducting a national household expenditure survey. Enumerators report significant non-response in affluent urban clusters. Which data quality protocol must be applied? (Item {q_idx})"
                            ans = "Apply calibrated non-response weight adjustments and dual-stage substitution auditing."
                            d1 = "Discard all urban observations and double rural weights arbitrarily."
                            d2 = "Replace non-responding households with arbitrary intercept interviews."
                            d3 = "Treat non-response as zero expenditure without bias estimation."
                            exp = "Official survey standards require systematic non-response weighting adjustments to prevent estimator bias."
                    else:
                        # Dynamic generation grounded directly in uploaded sentences
                        s_target = sentences[(q_idx - 1) % len(sentences)]
                        words = [w for w in re.findall(r'[a-zA-Z0-9_]{3,}', s_target)]
                        key_term = words[0] if words else "the core concept"
                        
                        if typ == "SHORT_MCQ":
                            qt = f"Based on the study material, which statement accurately reflects the principles regarding '{s_target[:60]}...'? (Item {q_idx})"
                            ans = f"It aligns with: {s_target[:80]}."
                            d1 = f"It explicitly contradicts the definition of {key_term}."
                            d2 = f"It requires completely bypassing the standard {key_term} protocol."
                            d3 = f"It is only applicable in deprecated legacy configurations."
                            exp = f"Grounded directly in the provided material text: '{s_target[:120]}'."
                        elif typ == "WORD_PROBLEM":
                            qt = f"In an operational implementation where a practitioner works with {s_target[:50]}..., what outcome is expected based on the material? (Item {q_idx})"
                            ans = f"The implementation must observe: {s_target[:80]}."
                            d1 = f"The procedure ignores {key_term} parameters completely."
                            d2 = f"All operational outputs for {key_term} default to zero without evaluation."
                            d3 = f"The system overrides documented constraints arbitrarily."
                            exp = f"According to the source documentation: '{s_target[:120]}'."
                        else: # CASE_STUDY
                            qt = f"Case Study: An engineering team is reviewing a system scenario involving '{s_target[:50]}...'. What standard best practice from the documentation should be applied? (Item {q_idx})"
                            ans = f"Apply the validated guideline: {s_target[:80]}."
                            d1 = f"Suspend all {key_term} monitoring indefinitely."
                            d2 = f"Substitute random mock values in place of {key_term}."
                            d3 = f"Enforce manual overrides that bypass the documented specification."
                            exp = f"The case requirement is resolved by the principle: '{s_target[:120]}'."

                    generated.append({
                        "question_text": qt,
                        "question_type": typ,
                        "difficulty": diff,
                        "cognitive_level": "understand" if diff == "1" else ("apply" if diff == "2" else "analyze"),
                        "options": [
                            {"text": ans, "is_correct": True, "order": 1},
                            {"text": d1, "is_correct": False, "order": 2},
                            {"text": d2, "is_correct": False, "order": 3},
                            {"text": d3, "is_correct": False, "order": 4}
                        ],
                        "correct_answer": ans,
                        "explanation": exp,
                        "concept": "Material Study Concept"
                    })
                    q_idx += 1

            return json.dumps({"questions": generated})

        # 1. Question Generation (Single or Multiple)
        if "generate" in prompt_lower and ("question" in prompt_lower or "mcq" in prompt_lower) and "flashcard" not in prompt_lower and "mind map" not in prompt_lower and "mindmap" not in prompt_lower and "notes" not in prompt_lower:
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

        # 2. AI Gap Diagnosis & Cognitive Misconception Interpretation
        elif "misconception" in prompt_lower or "cognitive" in prompt_lower or "telemetry" in prompt_lower or "primary_bottleneck" in prompt_lower:
            return json.dumps({
                "primary_bottleneck": "Stratified Sampling Allocation & Variance Estimation",
                "diagnostic_confidence": "HIGH",
                "evidence_summary": "Observed repeated errors under stratified sampling calculations where variance weights were misapplied.",
                "misconceptions": [
                    {
                        "topic": "Stratified Sampling",
                        "pattern": "Confusion between proportional and Neyman optimal sample allocation",
                        "classification": "LIKELY_MISCONCEPTION",
                        "evidence_count": 2,
                        "explanation": "Selected proportional allocation formulas when stratum standard deviations were explicitly heterogeneous.",
                        "high_confidence_error": True
                    }
                ],
                "remediation_focus": "Review MoSPI module on Stratified Survey Design and Neyman Sample Size Distribution."
            })
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

        # 4. Short Notes Generation
        elif "notes" in prompt_lower or "short notes" in prompt_lower or "executive notes" in prompt_lower:
            # Check for controlled grounding test keywords
            is_tcp_udp = "tcp" in prompt_lower and "udp" in prompt_lower
            if is_tcp_udp:
                return json.dumps({
                    "title": "Networking Protocols: TCP vs UDP",
                    "sections": [
                        {"heading": "Overview", "content": "Comparison of fundamental transport layer protocols: Transmission Control Protocol (TCP) and User Datagram Protocol (UDP)."},
                        {"heading": "Key Concepts", "content": "TCP provides connection-oriented, reliable data delivery with error checking. In contrast, UDP is connectionless and prioritized for lower latency."},
                        {"heading": "Important Definitions", "content": "TCP: Connection-oriented transport protocol.\nUDP: Connectionless transport protocol."},
                        {"heading": "Key Takeaways", "content": "Choose TCP when reliability is essential; choose UDP when real-time speed and low overhead are prioritized."}
                    ]
                })

            return json.dumps({
                "title": "Statistical Methods & Sampling Notes",
                "sections": [
                    {"heading": "Overview", "content": "Comprehensive overview of official statistical sampling methodologies, survey execution standards, and variance reduction techniques."},
                    {"heading": "Key Concepts", "content": "Stratified sampling partitions heterogeneous populations into homogeneous strata. Optimal Neyman allocation minimizes estimator variance when stratum standard deviations differ."},
                    {"heading": "Important Definitions", "content": "Design Effect (Deff): Ratio of estimator variance under complex sampling design to simple random sampling variance.\nStratification: Classification of units into non-overlapping groups."},
                    {"heading": "Examples & Applications", "content": "Application in National Sample Survey (NSS) multi-stage socioeconomic surveys and Periodic Labour Force Survey (PLFS) sampling frames."},
                    {"heading": "Key Takeaways", "content": "Effective survey design requires balancing sample allocation, minimizing non-sampling error, and verifying data validation rules."}
                ]
            })

        # 5. Flashcard Generation
        elif "flashcard" in prompt_lower or "flashcards" in prompt_lower:
            is_tcp_udp = "tcp" in prompt_lower and "udp" in prompt_lower
            if is_tcp_udp:
                return json.dumps({
                    "cards": [
                        {"front": "Is TCP connection-oriented or connectionless?", "back": "TCP is connection-oriented, establishing a session before data transfer.", "order": 1},
                        {"front": "What is the primary characteristic of UDP?", "back": "UDP is connectionless, transmitting datagrams without prior handshake.", "order": 2},
                        {"front": "When should TCP be preferred over UDP?", "back": "When data integrity and guaranteed delivery are mandatory.", "order": 3}
                    ]
                })

            return json.dumps({
                "cards": [
                    {"front": "What is the primary objective of Neyman Optimal Allocation?", "back": "To minimize the variance of the population mean estimator for a fixed total sample size.", "order": 1},
                    {"front": "How does intra-cluster correlation affect the design effect (Deff)?", "back": "A positive intra-cluster correlation increases the design effect (Deff > 1), raising estimator variance.", "order": 2},
                    {"front": "What constitutes a Primary Sampling Unit (PSU) in national surveys?", "back": "Typically a census enumeration block in urban areas or a revenue village in rural areas.", "order": 3},
                    {"front": "What is the difference between sampling error and non-sampling error?", "back": "Sampling error arises from inspecting a subset; non-sampling error results from measurement, non-response, or processing mistakes.", "order": 4},
                    {"front": "When is stratified sampling most efficient compared to simple random sampling?", "back": "When intra-stratum variation is small (homogeneity) and inter-stratum variation is large.", "order": 5}
                ]
            })

        # 6. Mind Map Generation
        elif "mind map" in prompt_lower or "mindmap" in prompt_lower or "concept map" in prompt_lower:
            is_tcp_udp = "tcp" in prompt_lower and "udp" in prompt_lower
            is_cpp = "c++" in prompt_lower or "cpp" in prompt_lower or "c plus plus" in prompt_lower
            if is_tcp_udp:
                return json.dumps({
                    "label": "Transport Protocols",
                    "children": [
                        {
                            "label": "TCP",
                            "children": [
                                {"label": "Connection-Oriented", "children": []},
                                {"label": "Reliable Delivery", "children": []}
                            ]
                        },
                        {
                            "label": "UDP",
                            "children": [
                                {"label": "Connectionless", "children": []},
                                {"label": "Low Latency", "children": []}
                            ]
                        }
                    ]
                })
            elif is_cpp:
                return json.dumps({
                    "label": "C++ Programming Language",
                    "children": [
                        {
                            "label": "Foundations & Syntax",
                            "children": [
                                {"label": "Data Types & Variables", "children": []},
                                {"label": "Control Structures & Loops", "children": []}
                            ]
                        },
                        {
                            "label": "Memory Management",
                            "children": [
                                {"label": "Pointers & References", "children": []},
                                {"label": "Dynamic Allocation (new/delete)", "children": []}
                            ]
                        },
                        {
                            "label": "Object-Oriented Programming",
                            "children": [
                                {"label": "Classes & Encapsulation", "children": []},
                                {"label": "Inheritance & Polymorphism", "children": []}
                            ]
                        },
                        {
                            "label": "Standard Template Library (STL)",
                            "children": [
                                {"label": "Containers (vector, map)", "children": []},
                                {"label": "Algorithms & Iterators", "children": []}
                            ]
                        }
                    ]
                })

            return json.dumps({
                "label": "Statistical Survey Design",
                "children": [
                    {
                        "label": "Sampling Strategies",
                        "children": [
                            {"label": "Stratified Sampling", "children": [{"label": "Proportional Allocation", "children": []}, {"label": "Neyman Optimal Allocation", "children": []}]},
                            {"label": "Cluster Sampling", "children": [{"label": "Primary Sampling Units", "children": []}, {"label": "Intra-Cluster Correlation", "children": []}]}
                        ]
                    },
                    {
                        "label": "Error Estimation",
                        "children": [
                            {"label": "Sampling Error & Deff", "children": []},
                            {"label": "Non-Sampling Imputation", "children": []}
                        ]
                    },
                    {
                        "label": "Quality Assurance",
                        "children": [
                            {"label": "Field Verification", "children": []},
                            {"label": "Data Consistency Auditing", "children": []}
                        ]
                    }
                ]
            })

        return "{}"
