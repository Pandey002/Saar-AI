# Project Specification: The Flashcard Engine

## Overview
A standalone, premium flashcard application that transforms PDFs into high-quality study decks using AI-powered ingestion and spaced repetition (SM-2 algorithm).

## Core Features

### 1. Pedagogical Ingestion
- **Post-Upload Choice Screen**:
    - **Quick Review**: 15-20 cards, key concepts only, 10-minute session.
    - **Deep Dive**: 50+ cards, full coverage, edge cases, relationships, and worked examples.
- **AI Persona**: Master Teacher, focused on active recall rather than passive labels.
- **Card Types**:
    - *Deep Concept*: "The 'Why' behind X."
    - *Relationship*: "How does A impact B?"
    - *Edge Case*: "When does property C fail?"
    - *Worked Example*: Step-by-step logic.
    - *Common Pitfall*: "Why is mistake D common here?"

### 2. Spaced Repetition (SM-2 Algorithm)
- Logic for calculating `easeFactor`, `intervalDays`, and `repetitions`.
- **Logic Snippet (Ported from Saar AI)**:
  ```typescript
  function calculateNextReview(card, rating) {
    let { easeFactor, intervalDays, repetitions } = card;
    // quality: 1 (Forgot), 2 (Hard), 4 (Good), 5 (Easy)
    if (rating < 3) {
      repetitions = 0;
      intervalDays = 1;
    } else if (repetitions === 0) {
      repetitions = 1;
      intervalDays = 1;
    } else if (repetitions === 1) {
      repetitions = 2;
      intervalDays = 6;
    } else {
      repetitions += 1;
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    }
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
    return { ...card, easeFactor, intervalDays, repetitions, nextReviewDate: ... };
  }
  ```

## Technical Architecture

### 1. Data Models
```typescript
type Rating = 1 | 2 | 4 | 5;
type CardType = "concept" | "formula" | "date" | "process" | "definition" | "relationship" | "edge-case";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  type: CardType;
  tags: string[];
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
}

interface Deck {
  id: string;
  title: string;
  subject: string;
  cards: Flashcard[];
}
```

### 2. Ingestion Prompts
**Quick Review Prompt:**
> Create 15-20 essential flashcards for the topic "{topic}". 
> Focus on the absolute core concepts and definitions. One concept per card.
> Front: Question. Back: Direct, 2-line answer.

**Deep Dive Prompt:**
> Create 40-60 comprehensive flashcards for the topic "{topic}".
> Cover edge cases, specific relationships, and step-by-step logic.
> Include "How does X affect Y?" and "What happens if Z is removed?" type cards.
> Provide 2-3 worked examples.


### 3. Mastery & Progress Dashboard
- **Donut Chart**: visual breakdown of Mastered (Repetitions > 4), Shaky (Quality < 3 recently), and Not Started.
- **Streak Counter**: Daily engagement motivator.
- **Front & Center Stats**: "Cards Due Today" prominently displayed.

### 4. Tech Stack & Aesthetic
- **Framework**: Next.js (App Router).
- **Styling**: Premium Vanilla CSS with a Navy/Coral/Parchment palette.
- **Design Principles**: Glassmorphism, card-flip animations, micro-interactions, and high-quality typography (Inter/Outfit).

## Implementation Roadmap

### Phase 1: Setup
- Initialize Next.js standalone app.
- Configure Design System (Colors, Typography, Shared CSS tokens).

### Phase 2: Core Engine
- Implement SM-2 utility.
- Build PDF text extraction layer.
- Build AI prompt layer with "Choice Screen" logic.

### Phase 3: Flashcard UI
- Build the `Flashcard` component with 3D flip.
- Build `ReviewSession` with rating controls.

### Phase 4: Mastery Dashboard
- Build `MasteryDonut` and `DeckLibrary`.
- Implement deck management (search, grouping).

### Phase 5: Delight & Polish
- Add animations (Framer Motion or CSS).
- Add success states (confetti for "Easy" cards).
