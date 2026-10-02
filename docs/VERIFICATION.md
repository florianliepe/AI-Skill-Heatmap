# MVP verification

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
