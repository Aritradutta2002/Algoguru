# Spring Boot & Backend Interview Track

A self-contained interview-prep track aimed at a **3–4 year experienced Java / Spring Boot
developer**. It is deliberately separate from the Core Java bank (`src/data/coreJavaQuestions/`),
which is frozen at 226 questions with DEV-time count assertions.

## What's in it

| Artefact | Count | File |
| --- | --- | --- |
| Questions with full answers | 138 (`b001`–`b138`) | `chunk-01…chunk-09*.ts` |
| Annotations, with internals | 155 across 16 categories | `annotations.ts` |
| Hands-on practice problems | 41 (`p01`–`p41`), ~21 hours | `practiceProblems.ts` |

Every question carries a 190–345 word answer, a self-contained code sample, a one-line
"what they're testing" note and 2–4 follow-up questions.

### Topic coverage

| Topic id | Questions | Ids |
| --- | --- | --- |
| `java-annotations` | 16 | `b001`–`b016` |
| `spring-annotations` | 20 | `b017`–`b036` |
| `spring-boot-core` | 10 | `b037`–`b046` |
| `collections` | 20 | `b047`–`b066` |
| `hashmap-internals` | 14 | `b067`–`b080` |
| `multithreading` | 26 | `b081`–`b106` |
| `spring-security` | 18 | `b107`–`b124` |
| `jwt` | 14 | `b125`–`b138` |

## Layout

```
src/data/backendInterview/
  contract.ts          types + defineBackendChunk() + the authoring rules
  topics.ts            ordered topic registry (render order lives here)
  chunk-NN-*.ts        one file per topic slice, exactly one exported chunk
  index.ts             aggregator: flat list, per-topic grouping, meta, DEV validation
  annotations.ts       the annotation reference catalogue
  practiceProblems.ts  the practice lab
```

Consumers:

- `src/lib/backendQuestionIndex.ts` — flat index, slugs, neighbours, search, per-topic stats.
- `src/hooks/useBackendInterviewProgress.ts` — localStorage progress / bookmarks / solved flags.
- `src/pages/interview/Backend*.tsx` — hub, question list, question detail, annotation
  reference, practice list, practice detail.
- Routes are registered in `src/App.tsx` under `/interview/:language/spring-boot`.

## Adding questions

1. Read the authoring rules at the top of `contract.ts` (markdown-lite dialect, `\${` escaping,
   no raw backticks inside code template literals).
2. Append to the relevant chunk with the next free `bNNN` id — **ids are immutable**, progress
   and bookmarks are keyed by them. Display numbers come from array position.
3. Add the matching entry to that chunk's `meta` map.
4. Bump the topic count in `EXPECTED_TOPIC_COUNTS` and `BACKEND_QUESTION_TOTAL` in `index.ts`.
5. Run `npm run test` — `src/test/backendInterviewData.test.ts` enforces unique ids, complete
   content, valid metadata, contiguous topic sections and valid cross-references.
