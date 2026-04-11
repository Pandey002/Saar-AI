# Saar AI

Saar AI is a structured AI study platform built with Next.js. It turns a topic, note dump, imported article, uploaded document, or handwritten notes image into guided learning output across four modes:

- `Summary` for quick revision
- `Explain` for conceptual clarity
- `Assignment` for exam-style practice
- `Revision` for recall drills

The product goal is straightforward:

> AI output should feel like a polished learning interface, not raw generated text.

## Features

- Structured AI output with titles, sections, concept blocks, and follow-up topics
- Premium mode-specific UI for summary, explanation, assignment, and revision flows
- English and Hinglish output modes
- Clarification flow for ambiguous topics
- Follow-up topic regeneration in the same mode
- Optional web augmentation for recent or factual queries
- Safe response normalization so malformed AI JSON does not crash the UI
- URL import for article and notes pages
- File ingestion for `.txt`, `.md`, `.json`, `.pdf`, `.jpg`, and `.png`
- Handwritten Notes OCR with Google Cloud Vision, image preprocessing, and AI cleanup
- Server-backed workspace history and library persistence
- Automated tests for normalization and route validation

## Tech Stack

- `Next.js 16`
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `Lucide React`
- `Vitest`

## Project Structure

```text
app/
  api/study/route.ts
  api/assignment/evaluate/route.ts
  api/extract-file/route.ts
  api/extract-url/route.ts
  api/topic-image/route.ts
  api/workspace/route.ts
  dashboard/page.tsx
  dashboard/DashboardClient.tsx
  page.tsx

components/
  feature/
    PremiumResultsView.tsx
    LanguageSelector.tsx
    StudyModeModal.tsx
    results/
  ui/

lib/
  ai/client.ts
  ai/prompts.ts
  ai/webContext.ts
  utils/
  workspace/store.ts

services/
  aiService.ts

tests/
  aiService.test.ts
  studyRoute.test.ts
```

## Environment Variables

Create `.env.local` in the project root.

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
AI_PROVIDER=gemini
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AI_MODEL=gemini-2.5-flash
GOOGLE_CLOUD_VISION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id"}
```

Supported provider presets live in `lib/ai/client.ts`.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
```

## Notes

- Workspace history and library data are persisted in `data/workspaces.json` and keyed by a session cookie.
- Assignment generation still includes a backend fallback when model output is incomplete.
- Web enhancement is intentionally lightweight and falls back silently if retrieval fails.

## License

This repository is currently `UNLICENSED`. See [LICENSE](./LICENSE).
