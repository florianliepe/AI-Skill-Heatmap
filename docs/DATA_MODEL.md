# Data model and API

The TypeScript entity definitions in `src/types.ts` are the frontend contract. Server-side mutation validation is implemented in `n8n/workspace-logic.mjs` and embedded into the n8n workflow by the deployment script.

| Collection | Fields and relationships |
|---|---|
| visions | Title, statement, purpose, horizon, owner |
| objectives | Title, description, owner, period, strategic pillar |
| keyResults | Objective ID, baseline, target, current value or null, unit, owner, due date, evidence |
| skills | Name, family, definition, four proficiency anchors, relevance/impact/upskilling scores 1–5, horizon, status, evidence |
| roles | Name, human accountability, dominant work mode |
| assessments | Unique role + skill, target proficiency 1–4, current proficiency 1–4 or null, evidence, priority |
| nodes | Canvas label, category, purpose, current/target states, owner, work mode, x/y position |
| edges | Existing source and target node IDs, label |
| audit | Latest 200 mutation events, timestamp, action, collection, record ID and label |

## Persistence

The n8n table has `workspace` (string), `revision` (number), and `payload` (JSON string) columns plus n8n system columns. One row stores the workspace. A mutation reads that row, validates the expected revision and writes only when both workspace and revision still match. Zero updated rows return an explicit conflict. The response contains the committed snapshot. A live parallel-request test verifies that only one of two writes using the same revision succeeds.

This is an MVP design for a small workshop team. It intentionally serializes changes to one workspace; a multi-workspace or high-write deployment should use a transactional database with record-level revisions. Payloads are capped at 1.5 million characters and collections at 2,000 records. Deleting an objective cascades to its key results; deleting a skill or role cascades to its assessments; deleting a node cascades to its connections.

## API contract

POST the configured workspace webhook with Basic authorization for the team credential. The body is one of:

```json
{"action":"read"}
```

```json
{"action":"create","collection":"objectives","record":{"id":"unique-id","title":"Outcome","description":"Rationale","owner":"Owner","period":"2027","pillar":"Business value"},"revision":1}
```

Use `update` with a complete record and the current revision, or `delete` with collection, ID and revision. Successful responses are `{ "data": { ... }, "revision": 2 }`. Domain validation and conflict responses return `{ "error": "..." }`; missing/invalid authentication returns HTTP 401. The client displays errors and preserves the form for correction. It does not silently retry stale writes.

## Measurement semantics

Key-result progress is `clamp((current - baseline) / (target - baseline), 0, 1)`. Baseline and target must differ. Objective and programme progress average measured key results, with explicit coverage counts. This is an unweighted MVP rollup; each result has equal weight. Skill gaps are `max(target - current, 0)` only when current is known. Null is unassessed, not zero. Priority scores and proficiency use separate scales.
