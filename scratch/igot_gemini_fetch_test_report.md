# SMARTLEARN — GEMINI iGOT DATA FETCH CAPABILITY TEST REPORT

**Date & Time**: 2026-09-01 20:47 IST  
**Environment**: SmartLearn Architecture (Backend AI Provider Evaluation)  
**Target Target**: Official iGOT Karmayogi Public Portal (https://www.igotkarmayogi.gov.in/)  
**Scope**: Read-Only Direct LLM Fetch Capability Inspection  

---

## 1. Executive Summary

| Capability Check | Status | Details |
| :--- | :---: | :--- |
| **Direct iGOT Access** | **FAIL** | Gemini API cannot make direct HTTP network requests to scrape external sites. |
| **Catalogue Discovery** | **FAIL** | Provider lacks autonomous web browsing / search tooling to discover iGOT links. |
| **Course Metadata Extraction** | **FAIL** | No live page HTML/JSON ingestion pipeline connected to the LLM. |
| **Courses Retrieved** | **0** | Zero live courses fetched directly via Gemini. |
| **Database Modified** | **NO** | Zero database records altered or inserted. |
| **Source Code Modified** | **NO** | Zero SmartLearn production codebase files modified. |

---

## 2. Technical Investigation & Methodology

### 2.1 Provider Architecture Inspection
1. **Configured AI Provider**: SmartLearn implements GeminiProvider in [ackend/ai/gemini_provider.py](file:///d:/Affan/Hackathons/SIH/SmartLearn/backend/ai/gemini_provider.py).
2. **Execution Method**: GeminiProvider.generate() calls client.models.generate_content() on the Google GenAI SDK.
3. **Absence of Browsing Tools**: The standard model invocation does not configure Google Search grounding (	ools=[{'google_search': {}}]) or custom scraping tools. Therefore, the model operates purely on input context prompts and parametric training data without autonomous HTTP web navigation.

### 2.2 Target Website Architecture (igotkarmayogi.gov.in)
1. **Single Page Application (SPA)**: iGOT Karmayogi is built on the open-source Sunbird LMS stack with an Angular frontend.
2. **Client-Side Rendering**: Course listings, competency taxonomy, and search results are dynamically fetched via client-side XHR/REST API calls (/api/content/v1/search) rather than pre-rendered static HTML.
3. **Access Controls**: Deep competency linkages and interactive courses require Parichay / government SSO authentication, preventing public unauthenticated full-catalogue crawling.

---

## 3. Detailed Capability Assessment

### A. Able to browse/discover iGOT directly?
**NO (FAIL)**. The Gemini provider cannot independently open URLs or crawl the web unless supplied with an external HTTP fetching tool or search grounding service.

### B. Able to retrieve individual iGOT course pages?
**NO (FAIL)**. The model cannot fetch live HTML from https://www.igotkarmayogi.gov.in/app/toc/... directly without an intermediary scraping service.

### C. Able to retrieve catalogue/search results?
**NO (FAIL)**. Dynamic client-side search APIs on iGOT require JavaScript execution and specific API headers.

### D. Able to reliably extract structured metadata?
**PARTIAL (Context-Dependent)**. If structured JSON or HTML is fed *into* the prompt by a backend crawler, Gemini excels at parsing and extracting fields (Title, Provider, Competencies, Duration). However, it cannot perform the initial fetch itself.

### E. Able to retrieve a large number of courses?
**NO (FAIL)**. 0 courses retrieved.

---

## 4. Root Causes & Technical Limitations

1. **No Outbound Web Fetching in LLM Core**: Large Language Models process text inputs; they do not open TCP/HTTP sockets autonomously during inference.
2. **Missing Grounding Tools in Provider**: ackend/ai/gemini_provider.py does not attach live web search tools.
3. **Dynamic SPA Rendering**: HTML GET requests to igotkarmayogi.gov.in return an empty <app-root></app-root> skeleton that requires browser JavaScript execution.
4. **Authentication & Rate Limiting**: Full course catalogue synchronization requires official API integration or structured data exchange with the Karmayogi Bharat team.

---

## 5. Architectural Recommendation for SmartLearn

**Do NOT attempt to use prompt-based direct Gemini crawling for iGOT data ingestion.**

### Recommended Architecture:
1. **Backend iGOT Ingestion Client (iGOTService)**:
   - Create a background worker that queries public Sunbird/iGOT REST APIs or parses structured course exports.
   - Cache course catalogue metadata (Title, Provider, Competency Tag, Duration, URL) in the local database (courses table).
2. **AI-Driven Grounded Recommendations**:
   - Feed the pre-ingested course metadata into RecommendationService and AIService.
   - Use Gemini to compute semantic embeddings and match learner competency deficits against official iGOT courses deterministically.
