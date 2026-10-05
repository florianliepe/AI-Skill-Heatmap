# MVP verification

## Workbench release — 5 October 2026

- TypeScript and production build passed; 21 unit tests passed. The build retains a large-bundle advisory (approximately 265 KB gzipped JavaScript); code splitting remains a follow-up.
- Live workbench integration verified create, same-request retry without duplication, linked cases, reference protection, stale-write rejection, pilot fields, zero-valued observations, enablement and immutable evidence. All pre-existing entity collections were compared before/after; temporary API cases were removed.
- Existing live authentication and concurrency suite passed: anonymous/wrong password rejected; exactly one competing write committed. Its temporary record was removed.
- Browser verified two-field idea capture, linked use-case creation, retained draft after a stale save, reconciliation and subsequent successful save. Its two temporary records were removed separately.
- Desktop landscape visually inspected with Potential, unknown versus empty cells, evidence counts and contributor drill-down. Example mode is explicitly separated from shared data.
- A native discard-confirmation dialog interrupted browser automation; cancellation and mobile workbench behavior are not yet signed off by this run. No automated end-to-end claim is made for those interactions.
- Backend snapshot/workflow backed up privately before deployment; additive schema normalization and backup serialization round-trip checked without overwriting live data.
- Source deployment and final publication are tracked by the GitHub Actions run associated with this change. Local checks do not by themselves confirm Pages publication.

Implementation scope and boundaries: `WORKBENCH_GOAL.md`; operating guidance: `OPERATIONS.md`.

Verified on 2 October 2026 against the configured n8n backend and the published GitHub Pages site.

| Check | Result |
|---|---|
| TypeScript and production build | Passed |
| Unit tests | 11 passed: increasing/decreasing OKRs, missing versus zero, bounds, skill gaps, entity validation, references, cascades, conflicts and edge IDs |
| Dependency audit | No known vulnerabilities reported by npm after the test-runner upgrade |
| Live authentication | Anonymous and incorrect-password requests rejected with HTTP 401; production browser sign-in succeeded |
| Live workspace mutations | Create, update, persisted read and delete passed for every editable collection |
| Concurrent writes | Exactly one of two requests with the same revision committed; the other returned an explicit conflict |
| Browser objective form | Temporary objective created and deleted successfully |
| Browser heatmap | 80 source targets initially unassessed; temporary current proficiency saved and then removed |
| Browser canvas | Element opened by double-click; changed position persisted across requests; original position restored |
| Live assistant | Authenticated embedded chat invoked its context workflow and returned the actual skill/role counts and strategic objectives |
| Responsive layout | Desktop and mobile layouts exercised; mobile canvas and controls visually inspected; mobile sign-out was visible |
| Public artifact inspection | No team password, source-specific branding or populated skill definitions in the built bundle; private credentials absent from tracked files |
| GitHub deployment | Build and Pages publication succeeded for application commit `0c83e8c` |

GitHub run: https://github.com/florianliepe/AI-Skill-Heatmap/actions/runs/37028349604

Temporary QA entities were removed. Their mutation events remain visible in the team's bounded activity history as evidence of verification. No real current proficiency or KPI measurements were introduced by testing.

The screenshot mechanism required a retry during responsive testing. Mobile geometry, visible controls and the final mobile canvas were checked; desktop pages were visually inspected. A physical-device test is still advisable before a wider rollout.

This is an MVP acceptance pass, not a penetration test or a full accessibility audit. The operational limitations and credential renewal dates are recorded in `OPERATIONS.md`.
# Palette refinement — 2 October 2026

- Sampled the user-supplied Eraneos swatch image: charcoal `#202020`, orange `#FF6428`, warm neutral and orange shade families.
- Proficiency uses four neutral shades; gaps and upskilling use orange shades. Numeric labels remain present. Unassessed cells retain a gray hatch and question mark; unmapped cells use a dashed border and plus sign.
- Catalog scoring guide, stronger table headers, status badges, selected controls and portfolio family legend improve distinctions without changing stored data.
- Production build and all 11 existing tests pass. Browser preview verified catalog, target/gap legends and portfolio legend. Sampled heatmap text/background contrast pairs range from 5.07:1 to 16.29:1; this is not a full accessibility audit.
