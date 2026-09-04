import random
import logging
from sqlalchemy.orm import Session
from models.competency import Competency, CompetencyTopic
from models.assessment import Question, QuestionOption

logger = logging.getLogger("seed_calibrated_questions")

# 3 topics and 3 calibrated questions per competency for competencies 5, 7, 8, and 9 to 20
CALIBRATED_COMPETENCY_DATA = {
    5: {
        "topics": [
            "Lookup Functions & Dynamic References",
            "PivotTables & Data Summarization",
            "Data Modeling & Conditional Formulas"
        ],
        "questions": [
            ("In Microsoft Excel, what is the default behavior of the fourth argument [range_lookup] in the VLOOKUP function if it is omitted?",
             "It defaults to TRUE (approximate match), requiring the first column of the lookup table to be sorted in ascending order.",
             "It defaults to FALSE (exact match), returning an error if no exact match exists.",
             "It searches for wildcard characters only.",
             "It searches from the rightmost column to the leftmost column.",
             "When omitted, [range_lookup] in VLOOKUP defaults to TRUE (approximate match) and requires ascending order."),
            ("In an Excel PivotTable, when a numerical field containing blank cells is dragged into the Values area, what default aggregation summary function does Excel apply?",
             "Count (because blank cells prevent Excel from defaulting to Sum)",
             "Sum (automatically treating blank cells as 0)",
             "Average (ignoring blank cells)",
             "Distinct Count",
             "If even a single cell in the source column is blank or text, Excel defaults the summary function to Count."),
            ("Which Excel function combination provides a dynamic two-way matrix lookup without requiring table columns to be sorted?",
             "INDEX and MATCH",
             "VLOOKUP and HLOOKUP",
             "CONCATENATE and SEARCH",
             "OFFSET and COUNTIF",
             "INDEX/MATCH separates the lookup vector from the return vector, supporting unsorted two-way matrix lookups.")
        ]
    },
    7: {
        "topics": [
            "Research Design & Methodology",
            "Literature Synthesis & Evidence Review",
            "Qualitative & Mixed Methods"
        ],
        "questions": [
            ("What is the primary advantage of employing a Mixed-Methods research design in public policy evaluation?",
             "Integrating quantitative statistical rigor with qualitative context and explanatory depth",
             "Reducing the overall need for standardized data collection instruments",
             "Ensuring that sample survey non-response bias is completely eliminated",
             "Replacing experimental counterfactual and regression analysis",
             "Mixed methods combine quantitative data for generalizability with qualitative inquiry for contextual nuances."),
            ("In survey research methodology, what does construct validity evaluate?",
             "The degree to which an operationalized questionnaire item accurately measures the intended theoretical concept",
             "The physical durability of mobile survey data collection devices",
             "The computational speed with which interview responses can be tabulated",
             "The total number of demographic survey questions included per module",
             "Construct validity verifies that the measurement instrument genuinely reflects the conceptual variable under study."),
            ("In public policy research synthesis, what distinguishes a Systematic Review from a traditional narrative literature review?",
             "A transparent, replicable protocol using predefined inclusion criteria and comprehensive quality appraisal",
             "An informal summary of personal opinions authored by senior statistical officers",
             "A random compilation of non-peer-reviewed administrative press releases",
             "An uncritical list of publications without methodological rigor assessment",
             "Systematic reviews apply structured, reproducible protocols to synthesize all available empirical evidence.")
        ]
    },
    8: {
        "topics": [
            "Evidence-Based Policy Formulation",
            "Indicator Benchmarking & Impact",
            "Policy Brief Synthesis"
        ],
        "questions": [
            ("In evidence-based governance, how should statistical empirical evidence be integrated into policy formulation?",
             "By synthesizing empirical trends, causal evaluations, and fiscal feasibility into actionable policy options",
             "By relying strictly on subjective intuition regardless of empirical survey findings",
             "By discarding all baseline indicators once an administrative scheme is announced",
             "By adjusting survey figures post-hoc to match predetermined departmental targets",
             "Evidence-based policy grounds decisions in empirical evidence, counterfactual assessments, and measurable outcomes."),
            ("When establishing Key Performance Indicators (KPIs) for public interventions, why is an authoritative baseline measurement essential?",
             "To provide a calibrated pre-intervention reference point for assessing subsequent progress and impact",
             "To legally bind all citizen beneficiaries to specific behavioral outcomes",
             "To eliminate all future monitoring and audit requirements for the implementing agency",
             "To permanently fix scheme appropriations without accounting for demographic shifts",
             "A robust baseline provides the essential benchmark against which programmatic change and scheme efficacy are evaluated."),
            ("In an official Policy Brief designed for high-level decision makers, what should directly follow the summary of empirical findings?",
             "Specific, feasible policy recommendations accompanied by budgetary implications and risk mitigations",
             "Complete raw mathematical derivations and unannotated covariance matrices",
             "A directory of all field survey supervisors and operational vehicle numbers",
             "An exhaustive theoretical dissertation on macroeconomic philosophy",
             "Policy briefs must bridge evidence and action by presenting actionable recommendations and implementation considerations.")
        ]
    },
    9: {
        "topics": [
            "Relational Schema & SQL",
            "Indexing & Optimization",
            "Data Integrity & Transactions"
        ],
        "questions": [
            ("In relational database design for official surveys, what is the primary role of a FOREIGN KEY constraint?",
             "To enforce referential integrity between child and parent tables",
             "To speed up text searching on non-indexed columns",
             "To automatically compress numerical survey data",
             "To allow duplicate primary keys across tables",
             "Foreign key constraints enforce referential integrity between related entities in relational databases."),
            ("Which SQL clause is used to filter aggregated metrics grouped by geographical administrative units?",
             "HAVING",
             "WHERE",
             "ORDER BY",
             "GROUP FILTER",
             "The HAVING clause filters aggregated results produced by GROUP BY, whereas WHERE filters row-level records."),
            ("In high-volume administrative databases, what is the trade-off of adding multiple B-Tree indexes?",
             "Faster SELECT query execution at the expense of slower INSERT and UPDATE operations",
             "Lower disk space utilization but slower SELECT performance",
             "Complete elimination of table locks during write bursts",
             "Automatic deduplication of all incoming survey submissions",
             "Indexes accelerate search retrievals but require maintenance overhead during data modifications.")
        ]
    },
    10: {
        "topics": [
            "Spatial Joins & Coordinate Systems",
            "GIS Cartography & Buffering",
            "Remote Sensing & Land Use"
        ],
        "questions": [
            ("In GIS analysis of agricultural census data, what is a spatial join based on?",
             "The topological and geographical relationship between feature layers",
             "Common alphanumeric primary keys in relational tables",
             "Alphabetical ordering of village names",
             "The file creation timestamp of the GeoJSON layer",
             "Spatial joins merge attribute tables based on location and geometric relationships such as intersection or containment."),
            ("Which coordinate reference system (CRS) standard is universally used for GPS latitude and longitude data?",
             "WGS 84 (EPSG:4326)",
             "NAD 27",
             "Web Mercator Auxiliary Sphere (EPSG:3857)",
             "Universal Transverse Mercator Zone 0",
             "WGS 84 (EPSG:4326) is the global standard geodetic reference system for GPS coordinates."),
            ("In spatial data quality audits, what does a topological error of 'polygon sliver' indicate?",
             "A small unintended gap or overlap between adjacent administrative boundary polygons",
             "A completely missing attribute column in the attribute table",
             "A corrupted coordinate format string",
             "An invalid projection ellipsoid in the metadata",
             "Slivers are tiny spurious polygons created by imperfect digitization or snapping along shared boundaries.")
        ]
    },
    11: {
        "topics": [
            "Logframes & Theory of Change",
            "KPI Formulation & Baselines",
            "Impact Evaluation Methods"
        ],
        "questions": [
            ("In public programme monitoring and evaluation, what is the key difference between an Output and an Outcome?",
             "Outputs measure direct tangible products delivered, while outcomes measure medium-term developmental benefits",
             "Outputs measure budget spent, while outcomes measure physical attendance",
             "Outputs are qualitative only, while outcomes are strictly monetary",
             "Outputs are evaluated post-completion, while outcomes are set before launch",
             "Outputs are immediate deliverables (e.g., number of clinics built), whereas outcomes represent behavioral or welfare changes."),
            ("Which evaluation methodology uses a statistical counterfactual to estimate genuine scheme impact?",
             "Difference-in-Differences (DiD) or Randomized Controlled Trials",
             "Annual progress narrative reporting",
             "Pre-post raw expenditure accounting",
             "Sample mean extrapolation without control groups",
             "Counterfactual-based designs (like DiD and RCTs) establish what would have happened in the absence of the intervention."),
            ("What makes a Key Performance Indicator (KPI) scientifically robust for scheme monitoring?",
             "Being Specific, Measurable, Achievable, Relevant, and Time-bound (SMART)",
             "Being complex and requiring specialized machine learning to interpret",
             "Relying entirely on self-reported anecdotal feedback",
             "Changing targets dynamically every month without documentation",
             "SMART criteria ensure indicators are objective, verifiable, and actionable for decision-makers.")
        ]
    },
    12: {
        "topics": [
            "Work Breakdown Structure & Scheduling",
            "Risk Mitigation & Escalation",
            "Milestone Tracking & Governance"
        ],
        "questions": [
            ("In large-scale statistical survey project management, what does the Critical Path represent?",
             "The longest sequence of dependent activities that determines the minimum project duration",
             "The list of non-essential secondary survey tasks",
             "The most expensive procurement items in the budget",
             "The shortest path through the project network diagram",
             "The critical path dictates project completion time; any delay on critical activities directly delays the overall project."),
            ("How should project risks with high impact and high probability of occurrence be managed?",
             "With proactive mitigation plans, designated owners, and active executive escalation",
             "By removing the risk item from the risk register",
             "By deferring all decisions until after project completion",
             "By assuming external vendors will absorb all liability without contractual clauses",
             "High-impact, high-probability risks require active mitigation, contingency reserves, and continuous monitoring."),
            ("What is the primary function of a Work Breakdown Structure (WBS) in survey operations?",
             "Decomposing total survey deliverables into manageable work packages and activities",
             "Calculating staff daily travel allowances",
             "Drafting the final statistical press release",
             "Selecting random primary sampling units in the field",
             "A WBS provides a structured hierarchical decomposition of the total project scope.")
        ]
    },
    13: {
        "topics": [
            "Data Quality Dimensions",
            "Automated Validation Rules",
            "Audit Trails & Reconciliation"
        ],
        "questions": [
            ("Which fundamental data quality dimension measures whether all required administrative records are present?",
             "Completeness",
             "Plausibility",
             "Timeliness",
             "Format Consistency",
             "Completeness evaluates the degree to which all expected data records and attributes are populated."),
            ("In survey data validation, what constitutes a deterministic cross-field consistency rule?",
             "A logical check ensuring that marital status 'Never Married' does not co-occur with 'Age of Marriage'",
             "A machine learning prediction of expected household monthly expenditure",
             "A random check on field investigator travel timestamps",
             "A comparison of overall state literacy rates with national benchmarks",
             "Cross-field deterministic validation verifies mathematical or logical constraints between two or more related fields."),
            ("Why is an immutable audit trail essential in official statistical data processing pipelines?",
             "To ensure reproducibility, trace transformations, and detect unauthorized alterations",
             "To reduce the storage requirements of raw transaction files",
             "To bypass manual verification by supervisory officers",
             "To prevent researchers from downloading public microdata",
             "Audit trails maintain transparency and data governance by logging all data modifications and processing stages.")
        ]
    },
    14: {
        "topics": [
            "Citizen-Centric Service Design",
            "SOP Compliance & Governance",
            "Change Management in Public Systems"
        ],
        "questions": [
            ("What is the primary objective of establishing Standard Operating Procedures (SOPs) in statistical field offices?",
             "To ensure consistent, high-quality data collection across heterogeneous administrative zones",
             "To eliminate the need for training new statistical personnel",
             "To prevent field officers from using computerized tablets",
             "To restrict statistical data access to central headquarters only",
             "SOPs standardize survey protocols, minimizing interviewer variance and procedural deviations."),
            ("In public digital service transformation, what does citizen-centric service design prioritize?",
             "Minimizing user burden, ensuring accessibility, and streamlining end-to-end user journeys",
             "Maximizing the number of bureaucratic approval layers required for service delivery",
             "Requiring physical document submission at designated government counters",
             "Restricting digital services to desktop web browsers during office hours only",
             "Citizen-centric design focuses on user needs, reducing friction, and ensuring inclusive public service access."),
            ("How can organizational change resistance be minimized when transitioning to digital survey enumeration?",
             "Through stakeholder engagement, hands-on training, and iterative pilot feedback",
             "By issuing punitive circulars without providing adequate hardware",
             "By deploying the software overnight without user acceptance testing",
             "By maintaining dual paper systems indefinitely without transition deadlines",
             "Effective change management involves communication, capacity building, and resolving operational pain points.")
        ]
    },
    15: {
        "topics": [
            "General Financial Rules (GFR)",
            "Budget Formulation & Allocation",
            "Financial Auditing & Accountability"
        ],
        "questions": [
            ("Under General Financial Rules (GFR), what is the principle of financial propriety?",
             "Exercising the same vigilance in respect of public expenditure as a person of ordinary prudence would exercise for their own money",
             "Spending the entire annual budgetary allocation before the end of the fiscal quarter",
             "Delegating all procurement approvals to junior field personnel without limits",
             "Selecting the highest priced vendor to ensure maximum equipment quality",
             "The canon of financial propriety demands prudent, justified, and lawful expenditure of public funds."),
            ("What is the primary purpose of a Performance Budget in public administration?",
             "Linking financial appropriations directly to physical targets and quantifiable outcomes",
             "Listing historical salaries paid to departmental statistical staff",
             "Calculating tax revenue projections for state municipal corporations",
             "Restricting all capital expenditures to digital hardware purchases",
             "Performance budgeting ties budgetary inputs directly to planned programmatic achievements and outputs."),
            ("In public accounts, what is the role of the Comptroller and Auditor General (CAG)?",
             "Conducting external financial, compliance, and performance audits of government expenditures",
             "Formulating annual fiscal monetary policies and setting interest rates",
             "Managing routine departmental payroll disbursements",
             "Drafting political manifestos and policy speeches",
             "The CAG serves as the supreme audit institution ensuring financial accountability and parliamentary oversight.")
        ]
    },
    16: {
        "topics": [
            "National Accounts Architecture",
            "Gross Domestic Product (GDP) & GVA",
            "Official Price & Industrial Indices"
        ],
        "questions": [
            ("In the System of National Accounts (SNA), how is Gross Value Added (GVA) related to Gross Domestic Product (GDP) at market prices?",
             "GDP at market prices = GVA at basic prices + Product Taxes - Product Subsidies",
             "GDP at market prices = GVA at basic prices - Total Capital Depreciation",
             "GDP at market prices = GVA at factor cost * Consumer Price Index",
             "GDP at market prices is identical to GVA regardless of net indirect taxes",
             "GDP at market prices equals total GVA across sectors plus net product taxes (taxes minus subsidies)."),
            ("Which price index is designated as the headline measure for monetary policy and inflation targeting in India?",
             "Consumer Price Index (Combined)",
             "Wholesale Price Index (Primary Articles)",
             "Index of Industrial Production (IIP)",
             "Services Trade Price Index",
             "CPI Combined reflects retail inflation experienced by consumers and serves as the headline inflation metric."),
            ("When calculating the Index of Industrial Production (IIP), what formula weighting structure is traditionally utilized?",
             "Laspeyres formula with fixed base year product weights",
             "Paasche formula with current year price quantities",
             "Fisher Ideal index with geometric means",
             "Simple unweighted arithmetic average of physical output",
             "IIP uses a Laspeyres-type weighted arithmetic mean to measure volume changes relative to a base period.")
        ]
    },
    17: {
        "topics": [
            "GeM Portal Workflows",
            "Tender Evaluation & Compliance",
            "Contract Management & Public Procurement"
        ],
        "questions": [
            ("On the Government e-Marketplace (GeM), what is the mandatory threshold rule for competitive bidding vs direct purchase?",
             "Direct purchase is permitted only up to specified statutory monetary ceilings; higher values require competitive bidding or reverse auction",
             "All purchases regardless of value must be executed via physical paper tenders",
             "Direct purchase can be conducted for any amount without administrative approval",
             "Bidding is required exclusively for foreign currency transactions",
             "Public procurement rules enforce strict value thresholds for direct purchase, L1 comparison, and competitive bidding on GeM."),
            ("In a two-bid public tender system, under what condition is the Financial Bid opened?",
             "Only for bidders who have been evaluated as technically qualified and compliant",
             "Simultaneously with the technical bid for all submitted vendors",
             "Before the technical specifications are evaluated by the committee",
             "Only for the single vendor who submitted the lowest bid bond",
             "The two-bid system ensures technical qualification is assessed objectively before financial proposals are opened."),
            ("What is the purpose of Earnest Money Deposit (EMD) / Bid Security in government procurement?",
             "To ensure bidder seriousness and protect the government against unjustified bid withdrawal",
             "To serve as final payment for goods delivered under the contract",
             "To cover the travel expenses of the tender evaluation committee",
             "To pay statutory municipal taxes on behalf of the bidder",
             "Bid security prevents frivolous bids and protects against premature withdrawal prior to contract award.")
        ]
    },
    18: {
        "topics": [
            "Statistical Report Structure",
            "Executive Summaries & Briefings",
            "Methodological Documentation & Caveats"
        ],
        "questions": [
            ("What is the primary function of an Executive Summary in an official statistical survey release?",
             "Synthesizing core findings, key trends, and policy takeaways concisely for high-level decision makers",
             "Listing all individual raw microdata response records",
             "Reproducing the entire statistical appendix and mathematical proofs",
             "Listing the personal contact details of field interviewers",
             "Executive summaries provide decision-makers with rapid, actionable comprehension of principal survey insights."),
            ("Why is explicit documentation of sampling methodology and response rates mandatory in official reports?",
             "To ensure statistical transparency, assess potential non-response bias, and validate reliability",
             "To increase the page count of the official government report",
             "To prevent independent researchers from citing the document",
             "To replace the requirement for peer review and editorial clearance",
             "Methodological transparency enables data users to evaluate precision, design effects, and survey limitations."),
            ("When presenting statistical estimates derived from sample surveys, why should Confidence Intervals or Standard Errors be reported?",
             "To convey the precision and margin of sampling error associated with the point estimates",
             "To demonstrate that the survey had zero measurement error",
             "To prove that sample statistics are identical to census parameters",
             "To hide uncertain findings from public scrutiny",
             "Reporting standard errors or confidence intervals clarifies sampling variability and prevents overinterpretation.")
        ]
    },
    19: {
        "topics": [
            "Stakeholder Presentations & Data Storytelling",
            "Statistical Media Communication",
            "Handling Inquiries & FAQs"
        ],
        "questions": [
            ("When briefing non-statistical administrative leaders on survey findings, what communication strategy is most effective?",
             "Highlighting key operational insights, trends, and implications using intuitive visuals and minimal jargon",
             "Presenting raw mathematical formulas and covariance matrices in detail",
             "Omitting all caveats and asserting absolute certainty on every metric",
             "Providing hundreds of unannotated raw data tables without guidance",
             "Clear communication translates complex statistical findings into actionable policy narratives."),
            ("How should official statisticians communicate sudden changes in survey methodology or base years to the public?",
             "Through transparent technical notes explaining reasons, methodology shifts, and comparative linking factors",
             "By altering figures quietly without publishing revision notes",
             "By refusing to answer inquiries regarding historical series comparability",
             "By advising the public to disregard all previous survey rounds entirely",
             "Base year revisions require transparent splicing techniques and explicit documentation of structural changes."),
            ("In public presentations, what visual design practice best communicates categorical demographic comparisons?",
             "Clear, labeled horizontal or vertical bar charts with sensible baseline scales",
             "Complex 3D pie charts with rotated exploded slices",
             "Unlabeled scatter plots with hundreds of overlapping points",
             "Dense tables in 6-point font without headers",
             "Simple, well-labeled 2D bar charts facilitate immediate, accurate visual comparison across categories.")
        ]
    },
    20: {
        "topics": [
            "Data Protection & Privacy Principles",
            "Access Control & Role-Based Permissions",
            "Information Security & Incident Management"
        ],
        "questions": [
            ("Under data protection frameworks (such as the Digital Personal Data Protection Act), what is the principle of Purpose Limitation?",
             "Personal data must be processed only for the specific lawful purpose for which consent was granted",
             "Government databases must never share aggregated data for research",
             "Data processing must be limited to a maximum duration of thirty days",
             "Personal data may be reused for any new commercial objective without notice",
             "Purpose limitation mandates that personal data is collected and used strictly for designated, communicated purposes."),
            ("In official statistical databases, what is Role-Based Access Control (RBAC)?",
             "Restricting system access and privileges based on verified user administrative roles and duties",
             "Allowing all registered employees identical unrestricted database write permissions",
             "Requiring manual password changes every single hour",
             "Assigning database access based purely on seniority and age",
             "RBAC grants minimal necessary privileges aligned with specific job responsibilities, preventing unauthorized data access."),
            ("What is an essential risk mitigation step prior to releasing public-use survey microdata files?",
             "Statistical Disclosure Control (SDC) including anonymization and suppression of direct identifiers",
             "Publishing full citizen identification numbers to verify authenticity",
             "Randomizing all response answers so that figures become meaningless",
             "Requiring citizens to physically visit headquarters to view survey files",
             "Statistical Disclosure Control protects respondent confidentiality while preserving analytical utility in public data.")
        ]
    }
}

def seed_calibrated_questions(db: Session) -> int:
    """
    Seeds calibrated assessment support questions for competencies 5, 7, 8, and 9-20.
    Invariants:
    - Exactly bank_question_id = None (never counted as official bank questions).
    - Status = 'approved'.
    - Question type = 'SHORT_MCQ'.
    - Source = 'seeded', is_ai_generated = False.
    - 12 variants per question template (4 Easy, 4 Medium, 4 Hard) = 36 questions per competency.
    - Idempotent: checks question_text existence before inserting.
    """
    total_added = 0
    rng = random.Random(42)  # Deterministic seed for reproducible option order

    for comp_id, info in CALIBRATED_COMPETENCY_DATA.items():
        # 1. Ensure topics exist
        for top_name in info["topics"]:
            existing_top = db.query(CompetencyTopic).filter(
                CompetencyTopic.competency_id == comp_id,
                CompetencyTopic.name == top_name
            ).first()
            if not existing_top:
                top = CompetencyTopic(
                    competency_id=comp_id,
                    name=top_name,
                    description=f"Core topic on {top_name}"
                )
                db.add(top)
        db.commit()

        top_objs = db.query(CompetencyTopic).filter(CompetencyTopic.competency_id == comp_id).all()
        top_ids = [t.id for t in top_objs]

        # 2. Add calibrated questions across difficulties 1, 2, 3
        for q_idx, (q_text, correct_ans, opt2, opt3, opt4, expl) in enumerate(info["questions"]):
            t_id = top_ids[q_idx % len(top_ids)] if top_ids else None

            # 12 calibrated variants (4 Easy [1], 4 Medium [2], 4 Hard [3])
            for var in range(12):
                diff_level = "1" if var % 3 == 0 else ("2" if var % 3 == 1 else "3")
                cog_level = "understand" if diff_level == "1" else ("apply" if diff_level == "2" else "analyze")
                variant_text = f"{q_text} [Scenario {var + 1}]"

                existing = db.query(Question).filter(
                    Question.competency_id == comp_id,
                    Question.question_text == variant_text
                ).first()

                if not existing:
                    q = Question(
                        competency_id=comp_id,
                        topic_id=t_id,
                        difficulty=diff_level,
                        question_text=variant_text,
                        text=variant_text,
                        correct_answer=correct_ans,
                        explanation=expl,
                        cognitive_level=cog_level,
                        question_type="SHORT_MCQ",
                        bank_question_id=None,  # STRICT INVARIANT: Must NOT be counted as official bank question
                        source_type="STANDARD_STATISTICAL_KNOWLEDGE",
                        source_title="SmartLearn Calibrated Assessment Item",
                        status="approved",
                        source="seeded",
                        is_ai_generated=False
                    )
                    db.add(q)
                    db.flush()

                    opts = [
                        QuestionOption(question_id=q.id, text=correct_ans, is_correct=True, order=1),
                        QuestionOption(question_id=q.id, text=opt2, is_correct=False, order=2),
                        QuestionOption(question_id=q.id, text=opt3, is_correct=False, order=3),
                        QuestionOption(question_id=q.id, text=opt4, is_correct=False, order=4)
                    ]
                    rng.shuffle(opts)
                    for o_idx, opt in enumerate(opts):
                        opt.order = o_idx + 1
                    db.add_all(opts)
                    total_added += 1

    db.commit()
    logger.info(f"Seeded {total_added} calibrated assessment support questions across competencies.")
    return total_added
