# Zielmodus: source-informed method workbench

## Objective
Make workshop guidance usable while designing and comparing use cases. Users are
consultants and value-stream leads. Preserve all existing records.

## Execution instructions
1. Read the supplied new board through the connected Miro tools. Keep source
   extracts and exact wording outside this public repository.
2. Add an authenticated method-card library with searchable wording, version and
   source references. Link cards to cases and individual tasks. Distinguish
   verified method extracts from capability cards that have not been extracted.
3. Add a mapping canvas covering pain/value, shared solutions, output
   dependencies, cost of waiting and selection strategy.
4. Compare benefit and implementation cost separately from impact/feasibility.
   Keep unassessed cases visible and never infer scores from votes.
5. Support output-first task design and record data access, human value and
   business viability as distinct assessment lenses.
6. Validate references and legacy data, test the authenticated API, check desktop
   and mobile layouts, then publish through GitHub Pages.

## Acceptance
- Private card wording is absent from public source and generated assets.
- Case/task links survive refresh; linked records cannot be deleted accidentally.
- Unknown scores remain unknown. Map axes and qualitative scales are explicit.
- Shared-solution groupings are distinct from directed output dependencies.
- Source coverage is disclosed. Embedded card decks are not represented as read
  unless their wording has been verified.
- Estimates, workshop votes and measured outcomes remain distinct.

## Prioritized implementation backlog
P0: private library and validated links; preserve data and revision controls.
P1: mapping editor, three assessment lenses and benefit/cost portfolio.
P1: task-level card selection and output-first guidance.
P2: dedicated capability-deck import when embedded wording is readable.
P2: extend agent context with reviewed cards; current proposals remain human-reviewed.

## Delivered
- Authenticated method-card records, search, stage filters, source links and
  editing with optimistic revision checks.
- Stable references from cases and tasks, with deletion protection for linked
  cards and upstream cases.
- Mapping fields for strategy, shared solution, cost of waiting, upstream
  outputs, relative implementation cost and the three assessment lenses.
- Separate benefit/cost and impact/feasibility portfolio views; explicit
  unassessed records and a fictional example.
- Output-first decomposition guidance and searchable task card selection.

## Source coverage and limits
75 verified method extracts were imported privately across opportunity mapping,
concept design, assessment and synthesis. Source wording, board/item URLs and
extraction files are not part of this public repository.
Embedded capability-deck pages were not readable through the available connector;
the browser remained on the board loading screen. The interface states this
limitation and retains the six existing provisional capability prompts.
This release does not automatically execute workflows or approve investments.

## Validation
38 unit tests pass. An authenticated API check verified case/task card links,
mapping updates and reload, then removed its disposable record and compared
existing collections for preservation. Existing data was backed up before the
backend update. Desktop and narrow-layout checks exercised card search and
portfolio views; the matrix scrolls within its container.
