from sqlalchemy.orm import Session
from models.role import Role
from models.department import Department
from models.competency import Competency, CompetencyTopic, CompetencyDependency, RoleCompetency
from models.user import User
from models.user_competency import UserCompetency, CompetencyScore
from models.course import Course, CourseCompetency
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer, UserQuestionHistory
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from models.recommendation import AIRecommendation, AIDiagnosis
from auth.security import hash_password
from datetime import datetime, timedelta
import random

def seed_database(db: Session):
    if db.query(User).count() > 0:
        return
    
    # --- 1. Roles (Professional Statistical Cadres) ---
    roles = [
        Role(id=1, name="Statistical Officer", description="Senior analysis, sampling design, and official reporting"),
        Role(id=2, name="Survey Officer", description="Field operations, survey methodology, and data collection"),
        Role(id=3, name="Data Analyst", description="Data validation, regression modeling, and statistical visualization"),
        Role(id=4, name="Statistical Investigator", description="Registry verification, field auditing, and basic tabulation")
    ]
    db.add_all(roles)
    db.commit()

    # --- 2. Departments ---
    deps = [
        Department(id=1, name="Statistical Services", code="STAT"),
        Department(id=2, name="Survey Operations", code="SURV"),
        Department(id=3, name="Data Analysis Division", code="DATA"),
        Department(id=4, name="IT & Digital Statistics", code="ITDS")
    ]
    db.add_all(deps)
    db.commit()
    
    # --- 3. Competencies ---
    comps = [
        Competency(id=1, name="Statistical Methods", category="statistics", domain="Core Theory", level="advanced", description="Advanced statistical methods, central limit theorem, and inference."),
        Competency(id=2, name="Survey Methodology", category="survey", domain="Operations", level="intermediate", description="Design, non-response weighting, and execution of national surveys."),
        Competency(id=3, name="Sampling Techniques", category="survey", domain="Operations", level="intermediate", description="Stratified, cluster, and multi-stage sampling formulas."),
        Competency(id=4, name="Data Analysis", category="analytics", domain="Analytics", level="advanced", description="Analyzing socioeconomic datasets and regression synthesis."),
        Competency(id=5, name="Data Quality", category="quality", domain="Governance", level="intermediate", description="Ensuring registry accuracy, anomaly detection, and validation rules."),
        Competency(id=6, name="Data Visualization", category="analytics", domain="Analytics", level="intermediate", description="Visual representation and thematic demographic dashboards."),
        Competency(id=7, name="Statistical Programming", category="technology", domain="Technology", level="advanced", description="Python and R script automation for official data pipelines."),
        Competency(id=8, name="Data Interpretation", category="analytics", domain="Core Theory", level="foundational", description="National accounting, CPI, GDP, and economic index interpretation.")
    ]
    db.add_all(comps)
    db.commit()

    # --- 4. Competency Topics (Hierarchical Structure) ---
    topics = [
        # Competency 1: Statistical Methods
        CompetencyTopic(competency_id=1, name="Probability Distributions", description="Normal, binomial, and Poisson distributions"),
        CompetencyTopic(competency_id=1, name="Hypothesis Testing", description="Null hypothesis, p-values, t-tests, and ANOVA"),
        CompetencyTopic(competency_id=1, name="Statistical Inference", description="Confidence intervals and parameter estimation"),
        
        # Competency 2: Survey Methodology
        CompetencyTopic(competency_id=2, name="Questionnaire Design", description="Formulating unbiased survey items"),
        CompetencyTopic(competency_id=2, name="Non-Response Adjustment", description="Weighting adjustments and imputation methods"),
        CompetencyTopic(competency_id=2, name="Field Operations & Audits", description="Survey protocol compliance in field inspections"),

        # Competency 3: Sampling Techniques
        CompetencyTopic(competency_id=3, name="Sampling Fundamentals", description="Sampling frames, sampling error, and variance"),
        CompetencyTopic(competency_id=3, name="Stratified Random Sampling", description="Neyman optimal allocation and stratum weighting"),
        CompetencyTopic(competency_id=3, name="Cluster & Multi-Stage Sampling", description="Primary sampling units and design effects"),

        # Competency 4: Data Analysis
        CompetencyTopic(competency_id=4, name="Descriptive Statistics", description="Measures of central tendency and dispersion"),
        CompetencyTopic(competency_id=4, name="Linear & Logistic Regression", description="Multivariate regression and assumption testing"),
        CompetencyTopic(competency_id=4, name="Time Series & Forecasting", description="Trend analysis and seasonal adjustment"),

        # Competency 5: Data Quality
        CompetencyTopic(competency_id=5, name="Rule-Based Validation", description="Range, consistency, and format validation"),
        CompetencyTopic(competency_id=5, name="Anomaly & Outlier Scoring", description="Statistical detection of erroneous values"),
        CompetencyTopic(competency_id=5, name="Record Linkage", description="Probabilistic matching of administrative records"),

        # Competency 6: Data Visualization
        CompetencyTopic(competency_id=6, name="Statistical Charts", description="Histograms, scatter plots, and box plots"),
        CompetencyTopic(competency_id=6, name="Choropleth Mapping", description="Spatial demographic visualization"),

        # Competency 7: Statistical Programming
        CompetencyTopic(competency_id=7, name="Python for Data Manipulation", description="Pandas, NumPy, and data wrangling"),
        CompetencyTopic(competency_id=7, name="R for Official Statistics", description="Survey packages and tabulations in R"),

        # Competency 8: Data Interpretation
        CompetencyTopic(competency_id=8, name="National Accounts", description="GDP, GVA, and macroeconomic indicators"),
        CompetencyTopic(competency_id=8, name="Price Indices", description="CPI, WPI, and IIP index tabulation")
    ]
    db.add_all(topics)
    db.commit()
    
    # --- 5. Competency Dependencies ---
    dep_list = [
        CompetencyDependency(competency_id=2, prerequisite_id=3), # Survey Methodology depends on Sampling Techniques
        CompetencyDependency(competency_id=4, prerequisite_id=1), # Data Analysis depends on Statistical Methods
        CompetencyDependency(competency_id=6, prerequisite_id=4), # Visualization depends on Data Analysis
        CompetencyDependency(competency_id=7, prerequisite_id=1), # Programming depends on Statistical Methods
        CompetencyDependency(competency_id=5, prerequisite_id=4), # Data Quality depends on Data Analysis
        CompetencyDependency(competency_id=5, prerequisite_id=2)  # Data Quality depends on Survey Methodology
    ]
    db.add_all(dep_list)
    db.commit()
    
    # --- 6. Role Competency Requirements ---
    roles_req = []
    # Role 1: Statistical Officer (Target Benchmark)
    stat_officer_targets = [(1, 80.0, 3, 1.2), (2, 75.0, 3, 1.0), (3, 70.0, 3, 1.5), (4, 80.0, 3, 1.0), (5, 70.0, 2, 1.0), (6, 75.0, 2, 0.8), (7, 70.0, 2, 1.2), (8, 65.0, 2, 0.8)]
    for c_id, score, lvl, wt in stat_officer_targets:
        roles_req.append(RoleCompetency(role_id=1, role_name="Statistical Officer", competency_id=c_id, target_score=score, target_level=lvl, weight=wt))
    
    # Role 2: Survey Officer
    survey_officer_targets = [(1, 65.0, 2, 0.8), (2, 85.0, 3, 1.5), (3, 80.0, 3, 1.5), (4, 70.0, 2, 1.0), (5, 80.0, 3, 1.2), (6, 65.0, 2, 0.8), (7, 60.0, 2, 0.8), (8, 70.0, 2, 0.8)]
    for c_id, score, lvl, wt in survey_officer_targets:
        roles_req.append(RoleCompetency(role_id=2, role_name="Survey Officer", competency_id=c_id, target_score=score, target_level=lvl, weight=wt))

    # Role 3: Data Analyst
    data_analyst_targets = [(1, 80.0, 3, 1.2), (2, 60.0, 2, 0.8), (3, 60.0, 2, 0.8), (4, 85.0, 3, 1.5), (5, 80.0, 3, 1.2), (6, 85.0, 3, 1.2), (7, 80.0, 3, 1.5), (8, 75.0, 2, 1.0)]
    for c_id, score, lvl, wt in data_analyst_targets:
        roles_req.append(RoleCompetency(role_id=3, role_name="Data Analyst", competency_id=c_id, target_score=score, target_level=lvl, weight=wt))

    # Role 4: Statistical Investigator
    investigator_targets = [(1, 70.0, 2, 1.0), (2, 70.0, 2, 1.2), (3, 70.0, 2, 1.2), (4, 65.0, 2, 0.8), (5, 75.0, 2, 1.2), (6, 60.0, 2, 0.8), (7, 55.0, 1, 0.8), (8, 70.0, 2, 1.0)]
    for c_id, score, lvl, wt in investigator_targets:
        roles_req.append(RoleCompetency(role_id=4, role_name="Statistical Investigator", competency_id=c_id, target_score=score, target_level=lvl, weight=wt))

    db.add_all(roles_req)
    db.commit()
    
    # --- 7. Users (Admins and Learners) ---
    pwd = hash_password("admin123")
    lpwd = hash_password("learn123")
    users_data = [
        ("admin@smartlearn.gov.in", pwd, "Priya Sharma", "admin", 1, 1, "Director General", 8),
        ("manager@smartlearn.gov.in", pwd, "Rajesh Kumar", "admin", 1, 2, "Senior Statistical Officer", 12),
        ("arjun.patel@gov.in", lpwd, "Arjun Patel", "learner", 1, 1, "Statistical Officer", 5),
        ("meera.nair@gov.in", lpwd, "Meera Nair", "learner", 3, 3, "Data Analyst", 3),
        ("vikram.singh@gov.in", lpwd, "Vikram Singh", "learner", 2, 2, "Survey Officer", 6),
        ("ananya.reddy@gov.in", lpwd, "Ananya Reddy", "learner", 4, 1, "Statistical Investigator", 2),
        ("rohit.sharma@gov.in", lpwd, "Rohit Sharma", "learner", 3, 4, "Data Analyst", 4),
        ("kavita.desai@gov.in", lpwd, "Kavita Desai", "learner", 2, 2, "Survey Officer", 5),
        ("suresh.iyer@gov.in", lpwd, "Suresh Iyer", "learner", 1, 3, "Statistical Officer", 7),
        ("priyanka.gupta@gov.in", lpwd, "Priyanka Gupta", "learner", 4, 1, "Statistical Investigator", 3),
        ("amir.khan@gov.in", lpwd, "Amir Khan", "learner", 3, 3, "Data Analyst", 4),
        ("deepa.menon@gov.in", lpwd, "Deepa Menon", "learner", 2, 2, "Survey Officer", 5),
        ("sanjay.joshi@gov.in", lpwd, "Sanjay Joshi", "learner", 1, 4, "Statistical Officer", 9),
        ("lakshmi.pillai@gov.in", lpwd, "Lakshmi Pillai", "learner", 4, 2, "Statistical Investigator", 2)
    ]
    
    user_objs = []
    for email, password, full_name, role_sys, role_id, dept_id, designation, exp in users_data:
        u = User(
            email=email, 
            password_hash=password, 
            full_name=full_name, 
            name=full_name,
            role=role_sys, 
            role_id=role_id,
            department_id=dept_id, 
            designation=designation,
            experience_years=exp
        )
        db.add(u)
        user_objs.append(u)
    db.commit()

    # --- 8. User Competency State & History (Arjun Patel) ---
    arjun = next(u for u in user_objs if u.email == "arjun.patel@gov.in")
    arjun_competency_data = [
        (1, 86.0, 80.0, 94.0, "strong"),
        (2, 51.0, 75.0, 82.0, "needs_attention"),
        (3, 48.0, 70.0, 78.0, "critical_gap"),
        (4, 64.0, 80.0, 85.0, "on_track"),
        (5, 72.0, 70.0, 89.0, "strong"),
        (6, 81.0, 75.0, 92.0, "strong"),
        (7, 43.0, 70.0, 74.0, "critical_gap"),
        (8, 75.0, 65.0, 90.0, "strong")
    ]
    
    for c_id, score, target, conf, st in arjun_competency_data:
        uc = UserCompetency(
            user_id=arjun.id, 
            competency_id=c_id, 
            current_score=score, 
            target_score=target, 
            confidence=conf, 
            status=st, 
            last_assessed=datetime.utcnow()
        )
        db.add(uc)
        
        # Historical progression trajectory
        cs1 = CompetencyScore(user_id=arjun.id, competency_id=c_id, score=max(25.0, score - 21.0), source="baseline", assessed_at=datetime.utcnow() - timedelta(days=60))
        cs2 = CompetencyScore(user_id=arjun.id, competency_id=c_id, score=max(35.0, score - 12.0), source="adaptive", assessed_at=datetime.utcnow() - timedelta(days=30))
        cs3 = CompetencyScore(user_id=arjun.id, competency_id=c_id, score=score, source="assessment", assessed_at=datetime.utcnow())
        db.add_all([cs1, cs2, cs3])
    db.commit()

    # --- 9. Courses / Learning Resources (iGOT & Official Systems) ---
    course_list = [
        ("Survey Sampling Fundamentals & Design", 3, "beginner", 12.0, "Master stratified, cluster, and multi-stage sampling techniques configured for official statistical surveys.", "iGOT"),
        ("Python for Statistical Analysis & Automation", 7, "beginner", 10.0, "Data manipulation with Pandas, statistical hypothesis testing, and automated reporting pipelines.", "iGOT"),
        ("Data Quality Validation & Audit Frameworks", 5, "intermediate", 8.0, "Comprehensive error detection, anomaly scoring, and automated validation rules for census registries.", "SmartLearn"),
        ("Applied Regression Analysis & Modeling", 4, "intermediate", 14.0, "Linear, logistic, and multivariate regression techniques applied to socioeconomic datasets.", "iGOT"),
        ("Official Statistics Framework & National Accounts", 8, "foundational", 6.0, "Understanding GDP computation, CPI/IIP indexes, and international statistical standards.", "National Statistical Training Institute"),
        ("NSS Stratification Lab", 3, "intermediate", 0.4, "Practical 25-minute lab on Neyman optimal allocation for national sample surveys.", "iGOT"),
        ("Survey Sampling Methods", 2, "intermediate", 0.3, "18-minute micro-module on sampling frame maintenance and design effect reduction.", "iGOT"),
        ("Variance Estimation Basics", 1, "intermediate", 0.35, "20-minute primer on Taylor series linearization and jackknife variance estimation.", "iGOT")
    ]
    
    for title, comp_id, diff, hrs, desc, prov in course_list:
        c = Course(
            title=title, 
            description=desc, 
            difficulty=diff, 
            duration_hours=hrs, 
            provider=prov, 
            resource_type="course", 
            competency_id=comp_id,
            is_active=True
        )
        db.add(c)
        db.flush()
        cc = CourseCompetency(course_id=c.id, competency_id=comp_id, coverage_level=100)
        db.add(cc)
    db.commit()

    # --- 10. Calibrated Questions Pool (120+ Questions with Topics & Explanations) ---
    all_topics = db.query(CompetencyTopic).all()
    topic_map = {t.competency_id: t.id for t in all_topics}

    question_templates = {
        1: [
            ("Which of the following is NOT an assumption of Ordinary Least Squares (OLS) linear regression?", "Multicollinearity between independent variables", "Linear relationship between predictors and outcome", "Homoscedasticity of error variance", "Independence of observational errors", "Multicollinearity is a data condition, whereas linearity, homoscedasticity, and independence are core mathematical assumptions."),
            ("What does the Central Limit Theorem state regarding sample means?", "Sample means approximate a normal distribution as sample size grows large regardless of population distribution", "All population distributions are inherently normal", "The standard deviation is always equivalent to sample size", "Variance converges to zero as sample size increases", "The CLT establishes that sample means converge to normality with mean mu and variance sigma^2 / n.")
        ],
        2: [
            ("What is the primary objective of non-response weighting adjustment in survey audits?", "To compensate for systematic demographic differences between respondents and non-respondents", "To artificially increase the survey sample size", "To eliminate all non-sampling errors completely", "To decrease the survey operational budget", "Weighting adjustments restore representativeness by scaling up underrepresented respondent groups."),
            ("In survey design, what is a double-barreled question error?", "A question that inquires about two distinct concepts while allowing only a single response", "A question presented twice in different questionnaire sections", "A question containing contradictory answer options", "A question requiring two interviewers simultaneously", "Double-barreled items confuse respondents by combining multiple distinct inquiries.")
        ],
        3: [
            ("Under what condition does Neyman Optimal Allocation yield significant variance reduction in Stratified Sampling?", "When strata with larger variances or larger sizes receive proportionally larger sample allocations", "When every stratum receives an identical sample size regardless of variance", "When sampling costs are uniformly zero across all geographical strata", "When the target population is completely homogeneous", "Neyman allocation minimizes total variance by allocating sample sizes proportional to stratum size multiplied by stratum standard deviation."),
            ("What does the Design Effect (DEFF) quantify in multi-stage cluster surveys?", "The ratio of sampling variance of a complex design to the variance under Simple Random Sampling", "The monetary cost per completed interview", "The percentage of questionnaires rejected in validation", "The ratio of stratum size to overall population size", "DEFF measures the efficiency loss or gain of a complex cluster design relative to SRS.")
        ],
        4: [
            ("In multivariate socioeconomic modeling, what is the primary purpose of cross-validation?", "To assess how model inferences generalize to an independent unseen dataset", "To increase the computational speed of model estimation", "To automatically remove missing records from the registry", "To reduce the number of predictor variables to one", "Cross-validation guards against overfitting by evaluating models on out-of-fold validation sets.")
        ],
        5: [
            ("Which data quality technique directly identifies duplicated administrative records across disjoint registries?", "Probabilistic Record Linkage using similarity metrics", "K-Means cluster imputation", "Principal Component Analysis", "Cross-Validation fold splitting", "Probabilistic Record Linkage matches records across databases using weighted similarity scores.")
        ],
        6: [
            ("Which statistical visualization is most suitable for detecting outliers and evaluating skewness in continuous socioeconomic variables?", "Box and Whisker plot", "Pie chart", "Stacked area chart", "Radial donut chart", "Box plots display median, interquartile range (IQR), and explicitly demarcate outliers beyond 1.5 * IQR.")
        ],
        7: [
            ("In Python's pandas library, which method merges two administrative DataFrames on a common unique key?", "pandas.merge()", "pandas.concat_rows()", "pandas.combine_keys()", "pandas.filter_match()", "pandas.merge() performs database-style joins on common key columns.")
        ],
        8: [
            ("When interpreting official national accounts, what distinguishes Real GDP from Nominal GDP?", "Real GDP is adjusted for inflation using constant base year prices", "Real GDP includes only foreign exchange reserves", "Nominal GDP excludes agricultural production", "Real GDP is measured exclusively in foreign currencies", "Real GDP removes price level changes to measure genuine economic volume changes over time.")
        ]
    }

    for comp_id, items in question_templates.items():
        t_id = topic_map.get(comp_id)
        for idx, (q_text, correct_ans, opt2, opt3, opt4, expl) in enumerate(items):
            for var in range(15): # Generate 15 calibrated questions per template (150 total)
                diff_level = "1" if var % 3 == 0 else ("2" if var % 3 == 1 else "3")
                diff_str = "beginner" if diff_level == "1" else ("intermediate" if diff_level == "2" else "advanced")
                
                q = Question(
                    competency_id=comp_id,
                    topic_id=t_id,
                    difficulty=diff_level,
                    question_text=f"{q_text} (Case #{var + 1})",
                    text=f"{q_text} (Case #{var + 1})",
                    correct_answer=correct_ans,
                    explanation=expl,
                    cognitive_level="understand" if diff_level == "1" else ("apply" if diff_level == "2" else "analyze"),
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
                random.shuffle(opts)
                for o_idx, opt in enumerate(opts):
                    opt.order = o_idx + 1
                db.add_all(opts)
    db.commit()

    # --- 11. Assessments & Diagnostic Evidence for Arjun ---
    assessment = Assessment(
        user_id=arjun.id,
        assessment_type="adaptive",
        type="adaptive",
        status="completed",
        started_at=datetime.utcnow() - timedelta(days=1),
        completed_at=datetime.utcnow() - timedelta(days=1),
        overall_score=72.0
    )
    db.add(assessment)
    db.flush()

    # Add AI Diagnosis Record
    diag = AIDiagnosis(
        user_id=arjun.id,
        assessment_id=assessment.id,
        competency_id=3, # Sampling Techniques
        primary_gap="Neyman Stratification & Variance Calculation Deficit",
        root_cause="Underlying variance formulas from foundational statistics were improperly applied to survey strata.",
        explanation="Officer answered 4 of 7 calculation questions on Neyman allocation incorrectly with high response latency.",
        confidence=87.0
    )
    db.add(diag)
    
    # Add AI Recommendation Record
    rec = AIRecommendation(
        user_id=arjun.id,
        competency_id=3,
        match_score=94.0,
        reason="Directly addresses 22-point deficit in Neyman allocation and stratified survey design.",
        status="active",
        type="course",
        content={"title": "NSS Stratification Lab", "duration": "25 min"}
    )
    db.add(rec)
    db.commit()

    # --- 12. Learning Path & Progress ---
    lpath = LearningPath(
        user_id=arjun.id, 
        is_active=True, 
        ai_reasoning="Custom capability trajectory prioritized to close 22-point gap in Sampling Techniques."
    )
    db.add(lpath)
    db.flush()

    items = [
        LearningPathItem(learning_path_id=lpath.id, title="Sampling Fundamentals", item_type="course", reference_id=1, competency_id=3, order=1, status="completed", estimated_duration="2h", difficulty="beginner"),
        LearningPathItem(learning_path_id=lpath.id, title="NSS Stratification Lab", item_type="module", reference_id=6, competency_id=3, order=2, status="current", estimated_duration="25 min", difficulty="intermediate"),
        LearningPathItem(learning_path_id=lpath.id, title="Survey Design & Methodology", item_type="course", reference_id=2, competency_id=2, order=3, status="recommended", estimated_duration="12h", difficulty="intermediate"),
        LearningPathItem(learning_path_id=lpath.id, title="Field Validation Protocols", item_type="practice", reference_id=3, competency_id=5, order=4, status="recommended", estimated_duration="4h", difficulty="intermediate"),
        LearningPathItem(learning_path_id=lpath.id, title="Adaptive Competency Reassessment", item_type="assessment", reference_id=assessment.id, competency_id=3, order=5, status="recommended", estimated_duration="20 min", difficulty="adaptive")
    ]
    db.add_all(items)

    prog = LearningProgress(
        user_id=arjun.id, 
        course_id=1, 
        status="completed", 
        progress_percentage=100.0, 
        progress_percent=100.0,
        started_at=datetime.utcnow() - timedelta(days=10),
        completed_at=datetime.utcnow() - timedelta(days=5)
    )
    db.add(prog)
    db.commit()

    # --- 13. Question Bank Import (80 Governed Items) ---
    from seed.import_question_bank import import_questions
    import_questions()

    # Ensure all imported bank questions have approved status for assessments
    for q in db.query(Question).filter(Question.bank_question_id.isnot(None)).all():
        q.status = "approved"
    db.commit()

    # --- 14. Baseline Official Learning Materials & Multi-Modal Content ---
    from models.material import LearningMaterial, MaterialNote, MaterialFlashcardDeck, MaterialFlashcard, MaterialMindMap, MaterialQuizQuestionSet, MaterialQuizQuestion, MaterialQuizOption
    
    if db.query(LearningMaterial).count() < 225:
        for m_id in range(1, 226):
            if not db.query(LearningMaterial).filter(LearningMaterial.id == m_id).first():
                scope = "OFFICIAL_COMPETENCY" if m_id == 49 or m_id % 2 == 1 else "OTHER_LEARNING"
                mat = LearningMaterial(
                    id=m_id,
                    title="Official Statistical Methods Handbook" if m_id == 49 else f"Statistical Training Resource #{m_id}",
                    filename="official_methods.pdf" if m_id == 49 else f"resource_{m_id}.pdf",
                    original_filename="official_methods.pdf" if m_id == 49 else f"resource_{m_id}.pdf",
                    file_type="application/pdf",
                    file_size=2048,
                    storage_path="uploads/official_methods.pdf" if m_id == 49 else f"uploads/resource_{m_id}.pdf",
                    competency_id=((m_id - 1) % 8) + 1,
                    material_scope=scope,
                    uploaded_by=1 if scope == "OFFICIAL_COMPETENCY" else 3,
                    processing_status="completed",
                    extracted_text="Official Statistical Methods Handbook and Guidelines covering sampling, regression, and data inference."
                )
                db.add(mat)
        db.commit()

    # --- 15. Baseline Study Notes, Flashcard Decks, Mind Maps & Quizzes ---
    if db.query(MaterialNote).count() < 55:
        for n_id in range(1, 56):
            note = MaterialNote(
                material_id=((n_id - 1) % 50) + 1,
                title=f"Study Notes #{n_id}",
                content={"title": f"Study Notes #{n_id}", "sections": [{"heading": "Core Principles", "content": "Comprehensive summary."}]},
                status="ready",
                version=1
            )
            db.add(note)
        db.commit()

    if db.query(MaterialFlashcardDeck).count() < 40:
        for d_id in range(1, 41):
            deck = MaterialFlashcardDeck(
                material_id=((d_id - 1) % 50) + 1,
                title=f"Flashcard Deck #{d_id}",
                version=1,
                status="ready"
            )
            db.add(deck)
            db.flush()
            for c_idx in range(1, 5):
                card = MaterialFlashcard(
                    deck_id=deck.id,
                    material_id=deck.material_id,
                    front=f"Concept #{c_idx} of Deck #{d_id}",
                    back=f"Detailed definition of Concept #{c_idx}.",
                    order=c_idx
                )
                db.add(card)
        db.commit()

    if db.query(MaterialMindMap).count() < 45:
        for mm_id in range(1, 46):
            mm = MaterialMindMap(
                material_id=((mm_id - 1) % 50) + 1,
                root_node={"label": f"Mind Map #{mm_id}", "children": [{"label": "Branch 1"}, {"label": "Branch 2"}]},
                status="ready",
                version=1
            )
            db.add(mm)
        db.commit()

    if db.query(MaterialQuizQuestionSet).count() < 85:
        for qs_id in range(1, 86):
            qs = MaterialQuizQuestionSet(
                material_id=((qs_id - 1) % 50) + 1,
                title=f"Practice Quiz #{qs_id}",
                version=1,
                status="ready"
            )
            db.add(qs)
            db.flush()
            for q_idx in range(1, 4):
                mq = MaterialQuizQuestion(
                    set_id=qs.id,
                    material_id=qs.material_id,
                    question_text=f"Sample question {q_idx} for Quiz #{qs_id}?",
                    question_type="SHORT_MCQ",
                    difficulty="2",
                    cognitive_level="apply",
                    correct_answer="Option A (Correct)",
                    explanation="Detailed explanation.",
                    created_at=datetime.utcnow()
                )
                db.add(mq)
                db.flush()
                db.add_all([
                    MaterialQuizOption(question_id=mq.id, text="Option A (Correct)", is_correct=True, order=1),
                    MaterialQuizOption(question_id=mq.id, text="Option B", is_correct=False, order=2),
                    MaterialQuizOption(question_id=mq.id, text="Option C", is_correct=False, order=3),
                    MaterialQuizOption(question_id=mq.id, text="Option D", is_correct=False, order=4),
                ])
        db.commit()

    # --- 16. Baseline Historical Assessments & Scores ---
    all_users = db.query(User).all()
    user_ids = [u.id for u in all_users] if all_users else [1, 3]

    if db.query(Assessment).count() < 385:
        for a_idx in range(1, 386):
            u_id = user_ids[a_idx % len(user_ids)]
            score_val = 50.0 + (a_idx % 45)
            ass = Assessment(
                user_id=u_id,
                assessment_type="adaptive" if a_idx % 2 == 0 else "diagnostic",
                type="adaptive",
                status="completed",
                overall_score=score_val,
                started_at=datetime.utcnow() - timedelta(days=a_idx % 90 + 1),
                completed_at=datetime.utcnow() - timedelta(days=a_idx % 90 + 1)
            )
            db.add(ass)
        db.commit()

    if db.query(CompetencyScore).count() < 510:
        for cs_idx in range(1, 515):
            u_id = user_ids[cs_idx % len(user_ids)]
            c_id = (cs_idx % 8) + 1
            src = "baseline" if cs_idx % 3 == 0 else ("adaptive" if cs_idx % 3 == 1 else "reassessment")
            score_rec = CompetencyScore(
                user_id=u_id,
                competency_id=c_id,
                score=45.0 + (cs_idx % 50),
                source=src,
                assessed_at=datetime.utcnow() - timedelta(days=cs_idx % 60)
            )
            db.add(score_rec)
        db.commit()

    if db.query(AIDiagnosis).count() < 45:
        first_ass = db.query(Assessment).first()
        ass_id = first_ass.id if first_ass else 1
        for d_idx in range(1, 46):
            u_id = user_ids[d_idx % len(user_ids)]
            diag_rec = AIDiagnosis(
                user_id=u_id,
                assessment_id=ass_id,
                competency_id=(d_idx % 8) + 1,
                primary_gap=f"Identified Concept Deficit #{d_idx}",
                root_cause=f"Underlying conceptual gap #{d_idx}.",
                explanation=f"Detailed cognitive explanation for diagnosis #{d_idx}.",
                confidence=85.0
            )
            db.add(diag_rec)
        db.commit()



