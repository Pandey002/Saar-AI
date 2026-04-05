# Saar AI

Saar AI is a structured AI study platform built with Next.js. It turns a topic, note dump, or short prompt into premium learning output across multiple modes:

- `Summary` for fast revision
- `Explain` for concept clarity
- `Assignment` for exam-style practice
- `Revision` for quick recall

The project is designed around one core idea:

> AI output should not feel like raw generated text. It should feel like a polished learning product.

## Features

- Structured AI output with titles, sections, concept blocks, and follow-up topics
- Premium mode-specific UI for summary, explanation, and assignment experiences
- Language toggle with `English` and `Hinglish`
- Clickable clarification flow for ambiguous topics
- Clickable follow-up topics that regenerate content in the same mode
- Optional web augmentation for recent or data-heavy topics
- Safe response normalization so incomplete AI responses do not crash the UI
- Topic + mode + language caching on the client for faster revisits

## Tech Stack

- `Next.js 14`
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `Lucide React`

## Project Structure

```text
app/
  api/study/route.ts        # Main AI generation API
  dashboard/page.tsx        # Input screen + app state management
  page.tsx                  # Marketing / landing page

components/
  feature/
    PremiumResultsView.tsx  # Main premium output shell
    LanguageSelector.tsx    # EN / Hinglish selector
    StudyModeModal.tsx      # Mode picker
    results/                # Reusable output UI blocks
  ui/                       # Shared UI primitives

lib/
  ai/client.ts              # LLM client wrapper
  ai/prompts.ts             # Prompt builders
  ai/webContext.ts          # Optional web augmentation
  utils/                    # Local utilities

services/
  aiService.ts              # AI orchestration + normalization + fallbacks

types/
  index.ts                  # Shared app and response types
```

## Study Modes

### 1. Summary

Best for quick understanding and revision.

Output includes:

- Title and short introduction
- Concept cards
- Core concepts
- Visual block placeholder
- Scannable sections
- Related topics

### 2. Explain

Best for conceptual learning.

Output includes:

- Title and subtitle
- Intuition / analogy card
- Formula block when relevant
- Theoretical framework cards
- Deeper step-by-step sections
- Key takeaways

### 3. Assignment

Best for assessment and exam practice.

Output includes:

- Assignment title and overview
- Instructions box
- MCQ and analytical sections
- Interactive option selection
- Right sidebar with marking scheme and export/print actions

### 4. Revision

Best for quick recall.

Output includes:

- Key concepts
- Short-answer recall prompts
- Revision-friendly structure

## Language Support

Saar AI supports:

- `English`
- `Hinglish`

Important behavior:

- Output language changes only when the user explicitly uses the language selector
- The page structure remains the same across languages
- Hinglish uses Roman Hindi + English mix
- Technical terms remain in English where appropriate

## AI Response Pipeline

The app does not dump raw AI text directly into the page.

Instead, it follows this flow:

1. User enters a topic or notes
2. `app/api/study/route.ts` receives `{ sourceText, mode, language }`
3. `services/aiService.ts` calls the LLM
4. AI output is parsed into structured data
5. The response is normalized and repaired with safe fallbacks
6. The frontend maps structured data to dedicated UI components

This keeps the product resilient even when the model returns partial or imperfect JSON.

## Ambiguity Handling

If the model decides a topic is ambiguous, the API returns clarification options instead of failing.

Example:

- `Network`
- `Deforestation`
- `AI`

The UI renders those options as clickable chips so the user can choose the intended meaning and regenerate immediately.

## Optional Web Augmentation

Saar AI can optionally enrich responses with recent or factual context for topics such as:

- current GDP
- latest trends
- recent data
- time-sensitive policy or statistics queries

Rules:

- Web enhancement is used only when needed
- Basic conceptual topics do not trigger it
- If web retrieval fails, the app quietly falls back to internal knowledge

## Environment Variables

Create a `.env.local` file in the project root.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
AI_PROVIDER=gemini
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AI_MODEL=gemini-2.0-flash
```

### Supported Providers

Current provider presets in [`lib/ai/client.ts`](F:\Saar AI\lib\ai\client.ts):

- `gemini`
- `groq`

If `AI_PROVIDER` is not set, Saar AI defaults to `gemini`.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Pandey002/Saar-AI.git
cd Saar-AI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` based on `.env.example`.

### 4. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev        # Start local development server
npm run build      # Create production build
npm run start      # Run production server
npm run lint       # Run linting
npm run typecheck  # Run TypeScript checks
```

## UI Architecture

The premium output experience is composed from reusable blocks.

Key components:

- `TitleHeader`
- `SectionBlock`
- `ConceptCard`
- `FormulaBlock`
- `InfoCard`
- `QuestionCard`
- `SidebarPanel`
- `FollowUpChips`

These live in:

- [`components/feature/results`](F:\Saar AI\components\feature\results)

The top-level results shell is:

- [`components/feature/PremiumResultsView.tsx`](F:\Saar AI\components\feature\PremiumResultsView.tsx)

## Export / Print

Assignment mode includes print and PDF-style export actions through the browser print flow.

Current behavior:

- Print assignment
- Export through print dialog
- Preserve the structured exam layout as much as possible

## Current Product Direction

Saar AI is aiming to become:

- a structured study platform for Indian students
- a concept learning assistant
- a revision and practice system

The product direction is not “chatbot first.”

It is:

> AI-generated educational content rendered as a real learning interface.

## Collaboration Workflow

If more than one person is working on the repo, do not code directly on `main`.

Recommended workflow:

### Create a new branch

```bash
git checkout main
git pull origin main
git checkout -b your-feature-branch
```

### Commit your work

```bash
git add .
git commit -m "Describe your change"
```

### Push your branch

```bash
git push -u origin your-feature-branch
```

### Open a Pull Request

Create a PR from your branch into `main`.

This keeps `main` stable and makes it easier for multiple collaborators to work safely.

## Recommended Git Rules

- Keep `main` deployable
- Use one branch per feature or bug fix
- Open PRs instead of pushing directly to shared work
- Pull latest `main` before starting new work
- Resolve conflicts in feature branches before merge

## Known Notes

- Assignment-mode LLM responses can sometimes be inconsistent, so the backend includes a fallback assignment generator
- Web enhancement is intentionally lightweight to keep latency under control
- Some older feature components remain in the repo even though the dashboard now uses the premium results surface

## Future Improvements

- Real concept diagrams instead of visual placeholders
- Stronger assignment generation quality
- Session history and saved study paths
- Better PDF export
- More exam-specific templates
- Subject-aware prompt tuning

## License

No license has been added yet. If this project is meant to be open-source, add a license file before wider distribution.
