# Shared parent question banks

Stay inside **foxtrail-family**. Do not implement adapters inside Camp Compass, Keytrail, or Lumen Isles from this project.

## Goal

One parent-owned bank can later feed **any** game that opts in. Spelling lists, Latin, math facts, or a custom list live on the family — not in a separate database per game.

## v1 on this hub

- Types and comments: `src/lib/question-banks/types.ts`
- Empty family-scoped store: `src/lib/question-banks/store.ts`
- Read-only parent UI: `/dashboard/question-banks` (“coming soon”)
- Stub API: `GET /api/question-banks` (empty list), `POST` returns 501

No game adapters. No persistence. No invented usage stats.

## Data model (later)

```
Family
  └── QuestionBank[]     // familyId + title + kind
        └── QuestionItem[]   // prompt, answer, optional hint/tags

QuestionBankGameOptIn    // familyId + bankId + gameId
```

Kinds: `spelling` | `latin` | `math-facts` | `custom`.

When a game is ready, it reads the family bank the parent opted in — it does not copy the list into its own repo.

## Why not per-game DBs

Parents would retype the same Latin list three times. The hub holds the list. Games subscribe later.
