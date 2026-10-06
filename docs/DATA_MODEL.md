# Data model and API

## Guided sprint extension (schema version 3)

`sprintSessions` stores title, problem, scope, facilitator, participants, module, method version, date and intended outcome. The four module values are Awareness, Opportunity mapping, Process automation and Products & services. Title and problem are required; dates, when provided, must be real calendar dates. Session references block deletion while a case is linked.

Work items may now contain `sessionId` and `workDesign`. The latter stores current work, input, AI task, human judgment, handover, output, tools and autonomy (AI supported / AI augmented / Agentic). Existing records remain valid and normalize these fields on their next save. The workflow canvas describes a design and does not execute it.

Deliverable coverage uses only filtered, non-archived use cases. Target-picture coverage requires objective and node links. Working-approach coverage requires six nonempty design fields (current work, input, AI task, human judgment, handover, output). Team-enablement coverage requires at least one validated enablement action. Zero cases shows no coverage, not 100%. These are completeness indicators, not approvals, maturity scores or benefits.

The contextual challenger endpoint accepts `caseId`, workspace `revision` and a question. Its native n8n Chat Trigger authenticates the shared team credential. The AI Agent calls a fixed, read-only workflow tool for that selected case and its linked objective/node. A deterministic validator checks the tool was used and allows only text proposals for `design`, `alternative` and `nextAction`, plus questions. No observation, financial input, ID, score or decision field can be applied by the proposal interface. The client validates again, checks the latest revision and guards against in-flight draft changes before applying explicitly selected text to the draft. The user must save separately. Proposals are not persisted; execution payload logging is disabled.

## Workbench extension (schema version 2)

`src/workbench-model.ts` defines `workItems`. Each record is an idea or use case with problem evidence, process/session, versioned capability categories, optional objective and target-node references, source-idea links, impact, value assumptions, experiment, observations, decisions, enablement actions and next action. New records start with unknown numerical inputs, not zero. Financial assumptions have a separate source/uncertainty field from problem evidence.

Legacy payloads normalize additively on read; existing IDs and collections stay unchanged. The normalized schema is persisted on the next successful mutation. Referenced objectives, nodes, roles, skills and source ideas cannot be deleted while workbench links remain. Archive the case or remove its links first.

Workbench writes use an optional request ID. The last 30 successful mutation fingerprints allow identical retries without another write. Reusing an ID for a different payload is rejected. Outside that window, record IDs and workspace revisions still prevent a duplicate create or silent overwrite. The client merges independent top-level fields after a conflict; nested structures require an explicit choice when both sides changed them.

Saved decisions and observations are append-only. Once observations exist, experiment measure, unit, baseline and target are fixed to preserve comparability. Plan a new linked case for a changed measurement definition. Pilot stages require an owner, hypothesis, measure/unit, sample plan, target, stop rule and review date. “In use” also requires an observation and Scale decision; declared owners remain unverified under shared access.

Value estimates are annual EUR base scenarios: released hours = volume × adoption × (baseline minutes − assisted minutes − review minutes) / 60. Capacity value = hours × loaded hourly rate; cashable benefit = capacity value × realization percentage. Net cash subtracts recurring cost; first-year net also subtracts setup cost. Payback is only displayed for positive annual net cash. Unknown inputs propagate; negative results remain visible. No portfolio benefit sum is calculated because cases can overlap. Outcomes remain separately recorded observations, not automatically claimed savings.

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
