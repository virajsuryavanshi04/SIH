# SmartLearn — Adaptive Closed-Loop Learning & Cognitive Diagnostic Platform

[![CI/CD Pipeline](https://github.com/virajsuryavanshi04/SIH/actions/workflows/ci.yml/badge.svg)](https://github.com/virajsuryavanshi04/SIH/actions/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**SmartLearn** is an enterprise-grade, AI-powered closed-loop competency enhancement and diagnostic learning platform built for civil servants and statistical officers across government ministries (aligned with **MoSPI** and **iGOT Karmayogi** competency frameworks).

SmartLearn bridges the gap between static testing and actionable capability development through continuous adaptive assessment, explainable next-action recommendations, multi-modal grounded study materials, cognitive misconception diagnosis, and targeted single-competency reassessments.

---

## 🌟 Core System Features

### 1. Closed-Loop Learning Intelligence (Phases 1–5G)
- **Role-Based Competency Benchmarking**: Calibrated against official role requirements (e.g., *Statistical Officer*, *Survey Officer*, *Data Analyst*).
- **Computerized Adaptive Testing (CAT)**: 2-streak difficulty adaptation promoting or demoting between Levels 1–3 with zero answer leakage during active quizzes.
- **Explainable Next-Action Engine**: 5-component weighted prioritization algorithm determining the learner's most critical next step.
- **Dual-Scope Document Ingestion**: Secure ingestion of official competency guides and private learner notes (`.pdf`, `.docx`, `.pptx`, `.txt`).
- **Multi-Modal AI Study Content**: Automated generation of grounded Study Notes, interactive Flashcard Decks with spaced repetition, and hierarchical Mind Maps.
- **Material-Based Adaptive Practice Quizzing**: Document-grounded practice assessments completely isolated from the official question bank.
- **Cognitive Diagnostic Intelligence**: Distinguishes structural misconceptions from knowledge gaps based on item responses, error patterns, and confidence telemetry (`OBSERVED_PATTERN`, `LIKELY_MISCONCEPTION`, `INSUFFICIENT_EVIDENCE`).
- **Targeted Reassessment & Score Deltas**: Single-competency retesting that computes authoritative Before vs. After score improvements ($\\Delta = \\text{After} - \\text{Before}$) and updates immutable historical ledgers.
- **Longitudinal Progress & Calibration Matrix**: Accuracy breakdown by difficulty, response-time metrics, subtopic mastery bars, and confidence calibration mapping.

### 2. Enterprise Stabilization & Production Hardening (Phase 6)
- **Health & Readiness Endpoints**: `/health` (liveness + version) and `/ready` (database `SELECT 1` ping).
- **Observability**: Request timing middleware measuring millisecond execution times and attaching `X-Process-Time-Ms` headers.
- **Production Exception Sanitization**: Global 500 handler obscuring stack traces and paths in production.
- **Optimized Frontend Bundling**: Rollup manual vendor chunk splitting (`vendor-react`, `vendor-charts`, `vendor-ui`) keeping all chunks $<400\\text{ kB}$ with sub-second production builds.
- **Containerization & CI/CD**: Production Dockerfiles, Nginx SPA reverse proxy configuration, `docker-compose.yml`, and GitHub Actions automated testing pipelines.

---

## 🔄 The Closed-Loop Learner Journey

```mermaid
graph TD
    A[1. User Registration / Scoped JWT] --> B[2. Role Calibration & Target Benchmark]
    B --> C[3. Baseline Adaptive Assessment]
    C --> D[4. Scoring Ledger & Deficit Gap Ranking]
    D --> E[5. Next-Action Recommendation Engine]
    E --> F[6. Multi-Modal Study: Courses / Notes / Flashcards / Mind Maps]
    F --> G[7. Document-Grounded Material Quiz]
    G --> H[8. Cognitive Misconception Diagnosis]
    H --> I[9. Targeted Single-Competency Reassessment]
    I --> J[10. Before vs. After Delta & Ledger Update]
    J --> K[11. Longitudinal Analytics & Confidence Calibration]
    K --> L[12. Recommendation Advances to Next Deficit Gap]
```

---

## 🏛️ Architecture & Project Structure

```
SmartLearn/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated backend test & frontend build pipeline
├── backend/
│   ├── ai/                        # AI providers (Mock, OpenRouter, Gemini) & AIService
│   ├── alembic/                   # Database versioning & schema migrations
│   ├── auth/                      # JWT authentication, hashing & permission dependencies
│   ├── models/                    # SQLAlchemy models (User, Role, Competency, Assessment, Material, AIDiagnosis)
│   ├── routers/                   # FastAPI REST API endpoints
│   │   ├── admin.py               # Organizational heatmap & question curation
│   │   ├── assessments.py         # Adaptive testing & scoring
│   │   ├── auth.py                # Registration & login
│   │   ├── competencies.py        # Frameworks, subtopics & gap tracking
│   │   ├── diagnosis.py           # Cognitive diagnosis & targeted remediation
│   │   ├── materials.py           # Uploads, Notes, Flashcards, Mind Maps, Material Quizzes
│   │   ├── progress.py            # Longitudinal analytics & timelines
│   │   ├── questions.py           # Official question bank governance
│   │   ├── recommendations.py     # Next-action decision service
│   │   └── roles.py               # Designation mapping
│   ├── schemas/                   # Pydantic data contracts
│   ├── services/                  # Business logic (Competency, Adaptive, Recommendation, Document)
│   ├── config.py                  # Environment settings & secret validation
│   ├── database.py                # Database session & connection pool
│   ├── Dockerfile                 # Python 3.11 slim production image
│   └── main.py                    # Application entrypoint & middleware
├── frontend/
│   ├── src/
│   │   ├── components/            # UI components (Flashcards, MindMap, QuestionCard, Layout)
│   │   ├── contexts/              # AuthContext & state providers
│   │   ├── lib/                   # Axios API client bindings (api.ts)
│   │   ├── pages/                 # Learner & Admin views (Dashboard, Quiz, Result, Progress, etc.)
│   │   ├── router.tsx             # React Router routing configuration
│   │   └── App.tsx                # Top-level React component
│   ├── Dockerfile                 # Multi-stage Node build -> Nginx Alpine runtime
│   ├── nginx.conf                 # SPA routing & /api proxy configuration
│   └── vite.config.ts             # Rollup manual chunking & Vite build config
├── docker-compose.yml             # Container orchestration
└── README.md                      # Platform documentation
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 20.x or higher
- **Docker & Docker Compose** (Optional for containerized run)

---

### Option A: Local Development Setup

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\\venv\\Scripts\\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run database migrations & seed baseline data
alembic upgrade head
python seed_data.py

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

#### 2. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Access the application at `http://localhost:5173`.

---

### Option B: Docker Compose Setup

Run the full platform (FastAPI backend + Nginx frontend) in one command:
```bash
docker-compose up --build
```
- **Web Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Health Probe**: `http://localhost:8000/health`

---

## ⚙️ Environment Variables

Create a `backend/.env` file with the following variables:

```ini
# Application Environment
ENVIRONMENT=development         # 'development' or 'production'
APP_VERSION=1.0.0

# Database
DATABASE_URL=sqlite:///./smartlearn.db
# For PostgreSQL: postgresql://user:password@localhost:5432/smartlearn

# Security
SECRET_KEY=smartlearn-super-secure-production-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# AI Configuration
AI_PROVIDER=mock                # 'mock', 'openrouter', or 'gemini'
OPENROUTER_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

---

## 🧪 Testing & Validation Matrix

SmartLearn contains **14 comprehensive test suites with over 116+ automated tests** verifying every invariant from Phase 1 through Phase 7.

### 1. Run the Master End-to-End Validation Suite
```bash
python scratch/test_phase7_master_e2e_validation.py
```
*Executes all 14 stages of the continuous learner lifecycle in under 2 seconds.*

### 2. Run Full Platform Regression Tests
```bash
# Production Hardening & Security
python scratch/test_phase6_production_hardening.py

# Cognitive Diagnosis & Misconceptions
python scratch/test_phase5g_cognitive_diagnosis.py

# Longitudinal Progress Analytics
python scratch/test_phase5f_progress_analytics.py

# Targeted Closed-Loop Reassessment
python scratch/test_phase5e_closed_loop.py

# Recommendation Engine
python scratch/test_phase5d_personalized_learning.py

# Material Adaptive Quizzes
python scratch/test_phase5c_material_quiz.py

# Multi-Modal Study Content (Notes/Flashcards/MindMaps)
python scratch/test_phase5b_study_content.py

# Core Assessment Engine & Governance
python scratch/test_phase3_learner_assessment.py
python scratch/test_phase2_governance.py
```

### 3. Verify Frontend Type-Safety & Production Build
```bash
cd frontend
npm run build
```

---

## 🛡️ Security & Tenant Isolation

- **Cryptographic JWTs**: Scoped user token validation on all protected endpoints.
- **Tenant Isolation**: Strict `user_id` ownership verification preventing horizontal privilege escalation across assessments, notes, mind maps, flashcards, and diagnostic reports.
- **Production Sanitization**: Unhandled server exceptions intercepted by FastAPI middleware to prevent internal system or database path exposure.
- **Safe CORS**: Explicit origin validation forbidding wildcards with credentials in production.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
