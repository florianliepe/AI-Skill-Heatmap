# Assessment card integration

The private card library now supports data-source, resource/role and risk-control decks alongside the existing capability cards and method extracts. Original wording, source references and category colours are stored only in the authenticated workspace. The public app contains generic UI and synthetic test fixtures.

## Working approach

1. Start with an explicit problem and proposed process; choose the task to assess.
2. Browse relevant cards and shortlist the minimum viable inputs and team. Five data sources and ten resources are workshop prompts, not enforced limits.
3. Specify exact data fields, owner, permission and quality evidence. Classify internal/external and structured/unstructured sources in the matrix; keep unknowns visible.
4. Define resource contributions, availability and evidence. Reconcile costs in the business case once; selection does not automatically add costs or imply a new full-time role.
5. Describe risk outcomes, affected people, mitigation, intervention and test evidence. Workshop card assertions are not compliance determinations.
6. Compare assessment gaps alongside value and feasibility. Card selection does not change readiness scores or approve a pilot.

The assessment is scoped to the proposed process or its individual tasks. Process alternatives do not inherit an assessment claim. Existing example cases remain illustrative. No client workshop scenario is added as a default case.

## UI and persistence

- Searchable, category-coloured compact cards with optional original/explanation detail panel.
- Three assessment tabs, a task overview with requirement/gap counts, an editable data matrix, and accountable requirements.
- Empty targets say **Not assessed**. A documented requirement needs specification, owner, evidence and an appropriate status; data also needs classification and risks need a control action.
- Explicit use-case save retains existing revision conflict handling. Removing a referenced task requires resolving its assessment links first; orphaned draft links can move to the whole process.
- Backend validates card type, target, enum values, text bounds, duplicate links and deletion dependencies. Bounded card imports validate all records before one revision-checked commit; failed batches write nothing.

## Source coverage

The newly imported sets contain 67 data cards, 18 resources/roles and 16 risk cards. Only front faces were available in the inspected export. Reverse content is not inferred; transcription remains marked for review in the private backlog. Existing two-sided capability cards retain their separate coverage checks.

## Validation

58 unit tests cover existing features, assessment round trips, invalid references/classifications, deletion protection, evidence gaps and atomic imports. Build, private-source scan and browser checks are part of release verification. The existing bundle-size warning remains; code splitting is a separate performance improvement.
