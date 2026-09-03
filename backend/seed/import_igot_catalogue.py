import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from models.role import Role
from models.competency import Competency, CompetencyTopic, RoleCompetency
from models.course import Course, CourseCompetency

logger = logging.getLogger('import_igot_catalogue')

ROLES_DATA = [
    {'id': 1, 'name': 'Statistical Officer', 'description': 'Official statistics compilation, survey oversight, sampling design, and statistical governance.'},
    {'id': 2, 'name': 'Data Analyst', 'description': 'Advanced statistical analysis, regression modeling, exploratory analytics, and dashboarding.'},
    {'id': 3, 'name': 'Data Management Officer', 'description': 'Relational databases, data architecture, security compliance, and lifecycle stewardship.'},
    {'id': 4, 'name': 'Field & Geospatial Data Officer', 'description': 'GIS mapping, spatial telemetry, field survey operations, and boundary validation.'},
    {'id': 5, 'name': 'Research Officer', 'description': 'Methodological research, economic policy synthesis, econometric modeling, and study design.'},
    {'id': 6, 'name': 'Policy & Planning Officer', 'description': 'Evidence-based policy formulation, governance models, stakeholder synthesis, and strategic planning.'},
    {'id': 7, 'name': 'Monitoring & Evaluation Officer', 'description': 'Results frameworks, indicator benchmarking, programme audit, and performance telemetry.'},
    {'id': 8, 'name': 'Programme & Project Officer', 'description': 'Detailed project reports, capital execution, agile public governance, and milestones.'},
    {'id': 9, 'name': 'Data Quality & Process Improvement Officer', 'description': 'Six Sigma, Lean BPR, statistical error control, registry deduplication, and quality assurance.'},
    {'id': 10, 'name': 'Statistical Reporting & Communication Officer', 'description': 'Public science dissemination, citizen-centric visualization, technical briefing, and reporting.'},
    {'id': 11, 'name': 'Digital Systems & Data Protection Officer', 'description': 'Cybersecurity hygiene, e-Governance architectures, data privacy compliance, and digital infrastructure.'},
    {'id': 12, 'name': 'Finance, Accounts & Procurement Officer', 'description': 'Government financial management, accrual accounting, GeM procurement, and public budget systems.'}
]

COMPETENCIES_DATA = [
    {'id': 1, 'name': 'Statistical Literacy & Reasoning', 'category': 'statistics', 'domain': 'Core Theory', 'level': 'foundational', 'description': 'Foundational statistical concepts, probability intuition, and data literacy for civil servants.'},
    {'id': 2, 'name': 'Statistical & Data Analysis', 'category': 'analytics', 'domain': 'Analytics', 'level': 'advanced', 'description': 'Inferential statistics, regression modeling, hypothesis testing, and quantitative problem solving.'},
    {'id': 3, 'name': 'Data Visualization', 'category': 'analytics', 'domain': 'Analytics', 'level': 'intermediate', 'description': 'Statistical charts, interactive thematic dashboards, and visual data storytelling.'},
    {'id': 4, 'name': 'R Programming', 'category': 'technology', 'domain': 'Technology', 'level': 'advanced', 'description': 'Statistical computing, reproducible scripts, and survey data processing in R.'},
    {'id': 5, 'name': 'Spreadsheet Analytics', 'category': 'analytics', 'domain': 'Analytics', 'level': 'intermediate', 'description': 'Data modeling, pivot tables, lookup formulas, and automated spreadsheet reporting in Excel.'},
    {'id': 6, 'name': 'Survey Operations & Data Collection', 'category': 'survey', 'domain': 'Operations', 'level': 'intermediate', 'description': 'Field enumeration, sampling frame verification, questionnaire execution, and survey logistics.'},
    {'id': 7, 'name': 'Research Methods', 'category': 'research', 'domain': 'Core Theory', 'level': 'advanced', 'description': 'Public policy research design, qualitative/quantitative synthesis, and academic literature analysis.'},
    {'id': 8, 'name': 'Policy Analytics & Evidence Use', 'category': 'policy', 'domain': 'Governance', 'level': 'advanced', 'description': 'Translating empirical statistical evidence into sound public policy interventions.'},
    {'id': 9, 'name': 'Database Management', 'category': 'technology', 'domain': 'Technology', 'level': 'intermediate', 'description': 'Relational database design, SQL querying, indexing, and administrative data storage.'},
    {'id': 10, 'name': 'Geospatial Analysis (GIS)', 'category': 'geospatial', 'domain': 'Operations', 'level': 'advanced', 'description': 'Geographic Information Systems, spatial data layers, remote sensing, and choropleth mapping.'},
    {'id': 11, 'name': 'Monitoring & Evaluation', 'category': 'management', 'domain': 'Governance', 'level': 'intermediate', 'description': 'Programme monitoring indicators, baseline tracking, impact evaluation, and performance audit.'},
    {'id': 12, 'name': 'Project & Programme Management', 'category': 'management', 'domain': 'Operations', 'level': 'intermediate', 'description': 'Detailed project reports (DPR), scope/time management, milestone delivery, and risk mitigation.'},
    {'id': 13, 'name': 'Data Quality & Continuous Improvement', 'category': 'quality', 'domain': 'Governance', 'level': 'advanced', 'description': 'Six Sigma, Lean BPR, statistical error rectification, anomaly detection, and validation rules.'},
    {'id': 14, 'name': 'Public Governance, Service Design & Change', 'category': 'governance', 'domain': 'Governance', 'level': 'intermediate', 'description': 'Citizen-centric public administration, design thinking, change management, and leadership ethos.'},
    {'id': 15, 'name': 'Government Financial Management', 'category': 'finance', 'domain': 'Finance', 'level': 'intermediate', 'description': 'Union budgetary systems, accrual accounting, cash book administration, and public financial rules.'},
    {'id': 16, 'name': 'National Accounts & Official Statistics', 'category': 'statistics', 'domain': 'Core Theory', 'level': 'advanced', 'description': 'GDP estimation, Gross Value Added, CPI/WPI index construction, and economic accounting.'},
    {'id': 17, 'name': 'Public Procurement & Digital Marketplace', 'category': 'procurement', 'domain': 'Finance', 'level': 'intermediate', 'description': 'GFR 2017 rules, GeM buyer operations, bidding frameworks, and contract administration.'},
    {'id': 18, 'name': 'Technical & Report Writing', 'category': 'communication', 'domain': 'Communication', 'level': 'intermediate', 'description': 'Drafting policy briefs, executive summaries, scientific research notes, and official reports.'},
    {'id': 19, 'name': 'Stakeholder Communication & Presentation', 'category': 'communication', 'domain': 'Communication', 'level': 'foundational', 'description': 'Public speaking, citizen engagement, presentation design, and science communication.'},
    {'id': 20, 'name': 'Digital Government, Cybersecurity & Data Protection', 'category': 'technology', 'domain': 'Technology', 'level': 'intermediate', 'description': 'e-Office, digital literacy, cyber hygiene, network defense, and data protection compliance.'}
]

ROLE_COMPETENCY_MAP = {
    # 1. Statistical Officer (8 competencies)
    1: [
        (1, 80.0, 3, 1.2),   # Statistical Literacy & Reasoning
        (2, 85.0, 3, 1.5),   # Statistical & Data Analysis
        (6, 80.0, 3, 1.3),   # Survey Operations & Data Collection
        (16, 80.0, 3, 1.3),  # National Accounts & Official Statistics
        (13, 75.0, 2, 1.0),  # Data Quality & Continuous Improvement
        (3, 75.0, 2, 1.0),   # Data Visualization
        (18, 75.0, 2, 1.0),  # Technical & Report Writing
        (19, 70.0, 2, 0.9)   # Stakeholder Communication & Presentation
    ],
    # 2. Data Analyst (8 competencies)
    2: [
        (2, 85.0, 3, 1.5),   # Statistical & Data Analysis
        (3, 85.0, 3, 1.3),   # Data Visualization
        (4, 80.0, 3, 1.2),   # R Programming
        (5, 80.0, 2, 1.0),   # Spreadsheet Analytics
        (9, 75.0, 2, 1.0),   # Database Management
        (13, 75.0, 2, 1.0),  # Data Quality & Continuous Improvement
        (1, 75.0, 2, 0.9),   # Statistical Literacy & Reasoning
        (18, 70.0, 2, 0.8)   # Technical & Report Writing
    ],
    # 3. Data Management Officer (6 competencies)
    3: [
        (9, 85.0, 3, 1.5),   # Database Management
        (20, 80.0, 3, 1.3),  # Digital Government, Cybersecurity & Data Protection
        (13, 80.0, 3, 1.2),  # Data Quality & Continuous Improvement
        (5, 75.0, 2, 1.0),   # Spreadsheet Analytics
        (2, 70.0, 2, 0.9),   # Statistical & Data Analysis
        (1, 70.0, 2, 0.8)    # Statistical Literacy & Reasoning
    ],
    # 4. Field & Geospatial Data Officer (6 competencies)
    4: [
        (10, 85.0, 3, 1.5),  # Geospatial Analysis (GIS)
        (6, 85.0, 3, 1.4),   # Survey Operations & Data Collection
        (13, 75.0, 2, 1.1),  # Data Quality & Continuous Improvement
        (5, 75.0, 2, 1.0),   # Spreadsheet Analytics
        (1, 70.0, 2, 0.9),   # Statistical Literacy & Reasoning
        (19, 70.0, 2, 0.8)   # Stakeholder Communication & Presentation
    ],
    # 5. Research Officer (5 competencies)
    5: [
        (7, 85.0, 3, 1.5),   # Research Methods
        (8, 85.0, 3, 1.3),   # Policy Analytics & Evidence Use
        (2, 80.0, 3, 1.2),   # Statistical & Data Analysis
        (18, 80.0, 2, 1.0),  # Technical & Report Writing
        (16, 75.0, 2, 1.0)   # National Accounts & Official Statistics
    ],
    # 6. Policy & Planning Officer (5 competencies)
    6: [
        (8, 85.0, 3, 1.5),   # Policy Analytics & Evidence Use
        (14, 85.0, 3, 1.3),  # Public Governance, Service Design & Change
        (19, 75.0, 2, 1.0),  # Stakeholder Communication & Presentation
        (7, 75.0, 2, 1.0),   # Research Methods
        (15, 70.0, 2, 0.9)   # Government Financial Management
    ],
    # 7. Monitoring & Evaluation Officer (5 competencies)
    7: [
        (11, 85.0, 3, 1.5),  # Monitoring & Evaluation
        (8, 80.0, 3, 1.2),   # Policy Analytics & Evidence Use
        (12, 80.0, 2, 1.1),  # Project & Programme Management
        (13, 75.0, 2, 1.0),  # Data Quality & Continuous Improvement
        (2, 75.0, 2, 1.0)    # Statistical & Data Analysis
    ],
    # 8. Programme & Project Officer (5 competencies)
    8: [
        (12, 85.0, 3, 1.5),  # Project & Programme Management
        (14, 80.0, 3, 1.2),  # Public Governance, Service Design & Change
        (15, 75.0, 2, 1.0),  # Government Financial Management
        (19, 75.0, 2, 1.0),  # Stakeholder Communication & Presentation
        (11, 70.0, 2, 0.9)   # Monitoring & Evaluation
    ],
    # 9. Data Quality & Process Improvement Officer (5 competencies)
    9: [
        (13, 85.0, 3, 1.5),  # Data Quality & Continuous Improvement
        (2, 80.0, 3, 1.2),   # Statistical & Data Analysis
        (9, 75.0, 2, 1.0),   # Database Management
        (14, 75.0, 2, 1.0),  # Public Governance, Service Design & Change
        (6, 70.0, 2, 0.9)    # Survey Operations & Data Collection
    ],
    # 10. Statistical Reporting & Communication Officer (5 competencies)
    10: [
        (18, 85.0, 3, 1.5),  # Technical & Report Writing
        (19, 85.0, 3, 1.4),  # Stakeholder Communication & Presentation
        (3, 80.0, 2, 1.1),   # Data Visualization
        (1, 75.0, 2, 1.0),   # Statistical Literacy & Reasoning
        (20, 70.0, 2, 0.8)   # Digital Government, Cybersecurity & Data Protection
    ],
    # 11. Digital Systems & Data Protection Officer (5 competencies)
    11: [
        (20, 85.0, 3, 1.5),  # Digital Government, Cybersecurity & Data Protection
        (9, 80.0, 3, 1.2),   # Database Management
        (14, 75.0, 2, 1.0),  # Public Governance, Service Design & Change
        (13, 75.0, 2, 1.0),  # Data Quality & Continuous Improvement
        (5, 70.0, 2, 0.8)    # Spreadsheet Analytics
    ],
    # 12. Finance, Accounts & Procurement Officer (5 competencies)
    12: [
        (15, 85.0, 3, 1.5),  # Government Financial Management
        (17, 85.0, 3, 1.4),  # Public Procurement & Digital Marketplace
        (16, 75.0, 2, 1.0),  # National Accounts & Official Statistics
        (5, 75.0, 2, 1.0),   # Spreadsheet Analytics
        (12, 70.0, 2, 0.9)   # Project & Programme Management
    ]
}

def ensure_schema_columns(db: Session):
    from sqlalchemy import text
    try:
        # Check courses columns
        result = db.execute(text("PRAGMA table_info(courses);")).fetchall()
        course_cols = [r[1] for r in result]
        
        new_course_cols = [
            ("igot_identifier", "VARCHAR(100)"),
            ("category", "VARCHAR(100)"),
            ("duration_seconds", "INTEGER"),
            ("duration_display", "VARCHAR(50)"),
            ("poster_image", "VARCHAR(500)"),
            ("app_icon", "VARCHAR(500)"),
            ("is_igot", "BOOLEAN DEFAULT 1"),
            ("catalogue_source", "VARCHAR(50) DEFAULT 'IGOT.json'"),
            ("mapping_source", "VARCHAR(50) DEFAULT 'smartlearn_curated'"),
            ("external_url", "VARCHAR(500)")
        ]
        for col, col_type in new_course_cols:
            if col not in course_cols:
                db.execute(text(f"ALTER TABLE courses ADD COLUMN {col} {col_type};"))
                
        # Check course_competencies columns
        result_cc = db.execute(text("PRAGMA table_info(course_competencies);")).fetchall()
        cc_cols = [r[1] for r in result_cc]
        new_cc_cols = [
            ("confidence", "VARCHAR(20) DEFAULT 'High'"),
            ("mapping_source", "VARCHAR(50) DEFAULT 'smartlearn_inferred'"),
            ("is_primary", "BOOLEAN DEFAULT 1")
        ]
        for col, col_type in new_cc_cols:
            if col not in cc_cols:
                db.execute(text(f"ALTER TABLE course_competencies ADD COLUMN {col} {col_type};"))
        db.commit()
    except Exception as e:
        logger.warning(f"Schema upgrade note: {e}")
        db.rollback()

def sync_igot_catalogue(db: Session) -> Dict[str, Any]:
    ensure_schema_columns(db)
    report = {
        'roles_imported': 0,
        'competencies_imported': 0,
        'courses_imported': 0,
        'course_mappings_imported': 0,
        'role_mappings_imported': 0,
        'duplicates_skipped': 0,
        'invalid_records': 0
    }

    # 1. Sync Competencies
    comp_map = {}
    for c_data in COMPETENCIES_DATA:
        comp = db.query(Competency).filter(Competency.name == c_data['name']).first()
        if not comp:
            comp = db.query(Competency).filter(Competency.id == c_data['id']).first()
            if comp:
                comp.name = c_data['name']
                comp.category = c_data['category']
                comp.domain = c_data['domain']
                comp.level = c_data['level']
                comp.description = c_data['description']
            else:
                comp = Competency(
                    id=c_data['id'],
                    name=c_data['name'],
                    category=c_data['category'],
                    domain=c_data['domain'],
                    level=c_data['level'],
                    description=c_data['description'],
                    created_at=datetime.utcnow()
                )
                db.add(comp)
        else:
            comp.category = c_data['category']
            comp.domain = c_data['domain']
            comp.level = c_data['level']
            comp.description = c_data['description']
        
        db.flush()
        comp_map[c_data['name']] = comp.id
        report['competencies_imported'] += 1

    # 2. Sync Roles
    role_map = {}
    for r_data in ROLES_DATA:
        role = db.query(Role).filter(Role.name == r_data['name']).first()
        if not role:
            role = db.query(Role).filter(Role.id == r_data['id']).first()
            if role:
                role.name = r_data['name']
                role.description = r_data['description']
            else:
                role = Role(
                    id=r_data['id'],
                    name=r_data['name'],
                    description=r_data['description'],
                    created_at=datetime.utcnow()
                )
                db.add(role)
        else:
            role.description = r_data['description']
            
        db.flush()
        role_map[r_data['name']] = role.id
        report['roles_imported'] += 1

    # 3. Sync Role Competency Requirements
    for role_id, req_list in ROLE_COMPETENCY_MAP.items():
        role_obj = db.query(Role).filter(Role.id == role_id).first()
        r_name = role_obj.name if role_obj else f'Role {role_id}'
        valid_comp_ids = {c_id for c_id, score, lvl, wt in req_list}
        
        # Remove any non-curated/obsolete associations
        db.query(RoleCompetency).filter(
            RoleCompetency.role_id == role_id,
            ~RoleCompetency.competency_id.in_(valid_comp_ids)
        ).delete(synchronize_session=False)

        for c_id, score, lvl, wt in req_list:
            rc = db.query(RoleCompetency).filter(
                RoleCompetency.role_id == role_id,
                RoleCompetency.competency_id == c_id
            ).first()
            if not rc:
                rc = RoleCompetency(
                    role_id=role_id,
                    role_name=r_name,
                    competency_id=c_id,
                    target_score=score,
                    target_level=lvl,
                    weight=wt,
                    created_at=datetime.utcnow()
                )
                db.add(rc)
            else:
                rc.role_name = r_name
                rc.target_score = score
                rc.target_level = lvl
                rc.weight = wt
            report['role_mappings_imported'] += 1
    db.flush()

    # 4. Deactivate old demo courses (preserve foreign keys)
    demo_courses = db.query(Course).filter(Course.igot_identifier.is_(None)).all()
    for dc in demo_courses:
        dc.is_active = False
    db.flush()

    # 5. Load and Sync 60 iGOT Courses
    json_path = Path(__file__).resolve().parent / 'igot_shortlist.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        courses_list = json.load(f)

    seen_ids = set()
    for crs_data in courses_list:
        igot_id = crs_data['igot_identifier']
        if igot_id in seen_ids:
            report['duplicates_skipped'] += 1
            continue
        seen_ids.add(igot_id)

        target_comp_id = comp_map.get(crs_data['competency_name'], 1)
        dur_hrs = round(crs_data['duration_seconds'] / 3600.0, 2) if crs_data.get('duration_seconds') else 2.0
        if dur_hrs < 0.1:
            dur_hrs = 0.5

        course = db.query(Course).filter(Course.igot_identifier == igot_id).first()
        if not course:
            course = Course(
                title=crs_data['name'],
                description=crs_data['description'],
                provider=crs_data['provider'],
                resource_type='course',
                external_id=igot_id,
                igot_identifier=igot_id,
                category=crs_data.get('primary_category', 'Course'),
                duration_seconds=crs_data.get('duration_seconds', 0),
                duration_display=crs_data.get('duration_display', '2h'),
                duration_hours=dur_hrs,
                poster_image=crs_data.get('poster_image'),
                app_icon=crs_data.get('app_icon'),
                thumbnail_url=crs_data.get('poster_image') or crs_data.get('app_icon'),
                is_igot=True,
                catalogue_source='IGOT.json',
                mapping_source='smartlearn_curated',
                external_url='https://igotkarmayogi.gov.in/',
                url='https://igotkarmayogi.gov.in/',
                content_url='https://igotkarmayogi.gov.in/',
                competency_id=target_comp_id,
                difficulty='intermediate',
                language='English',
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(course)
            db.flush()
            report['courses_imported'] += 1
        else:
            course.title = crs_data['name']
            course.description = crs_data['description']
            course.provider = crs_data['provider']
            course.category = crs_data.get('primary_category', 'Course')
            course.duration_seconds = crs_data.get('duration_seconds', 0)
            course.duration_display = crs_data.get('duration_display', '2h')
            course.duration_hours = dur_hrs
            course.poster_image = crs_data.get('poster_image')
            course.app_icon = crs_data.get('app_icon')
            course.thumbnail_url = crs_data.get('poster_image') or crs_data.get('app_icon')
            course.competency_id = target_comp_id
            course.is_active = True
            course.is_igot = True
            course.catalogue_source = 'IGOT.json'
            course.mapping_source = 'smartlearn_curated'
            course.external_url = 'https://igotkarmayogi.gov.in/'
            db.flush()
            report['courses_imported'] += 1

        # CourseCompetency Mapping
        cc = db.query(CourseCompetency).filter(
            CourseCompetency.course_id == course.id,
            CourseCompetency.competency_id == target_comp_id
        ).first()
        if not cc:
            cc = CourseCompetency(
                course_id=course.id,
                competency_id=target_comp_id,
                coverage_level=100,
                confidence=crs_data.get('confidence', 'High'),
                mapping_source='smartlearn_inferred',
                is_primary=True
            )
            db.add(cc)
            report['course_mappings_imported'] += 1
        else:
            cc.confidence = crs_data.get('confidence', 'High')
            cc.mapping_source = 'smartlearn_inferred'
            report['course_mappings_imported'] += 1

    # 6. Soft-archive old learning paths containing inactive/demo course references
    from models.learning_path import LearningPath, LearningPathItem
    old_paths = db.query(LearningPath).filter(LearningPath.is_active == True).all()
    for p in old_paths:
        has_stale = False
        for it in p.items:
            if it.reference_id:
                c = db.query(Course).filter(Course.id == it.reference_id).first()
                if not c or not c.is_active or not c.is_igot:
                    has_stale = True
                    break
        if has_stale:
            p.is_active = False

    db.commit()
    return report

if __name__ == '__main__':
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from database import SessionLocal
    db = SessionLocal()
    res = sync_igot_catalogue(db)
    print('Sync Results:')
    print(json.dumps(res, indent=2))
    db.close()
