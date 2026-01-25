# Universal Exam Engine (Next.js + Styled-Components)

```bash
npm install
npm run dev
```

Open: http://localhost:3000/engine

- Question formats: MCQ single/multi, DnD match, DnD order, Hotspot, Fill-blank, Scenario blocks
- Blueprint selection (balanced)
- Deterministic shuffling (seeded)
- Attempt lifecycle: resume, restart, reshuffle, retry incorrect, flag
- Local persistence via localStorage (Supabase-ready later)
- Results analytics by domain/type

No inline styling: all styles are styled-components.
