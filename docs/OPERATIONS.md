# Operating the MVP

## Facilitating the workbench

Use one designated scribe per workshop. Capture title and problem, then add process/session and capability mapping. Develop a saved idea into a linked use case. Follow Discover → Design → Estimate value → Prioritize pilot → Track outcomes. Record comparison criteria, a baseline collection plan and a next review before advancing the pilot.

Landscape offers Coverage (assessed/captured), Potential (median assessed impact) and Count. Hatched cells are unassessed; empty cells mean nothing captured. A record can belong to multiple capabilities, so cell counts are not additive. Select a cell to see contributing records. Filters apply to the landscape; the workshop pulse shows the full workspace. Impact is a declared 1–5 judgment with rationale, not an automated ranking.

Example mode uses fictional browser-only records and cannot save them to the team workspace. Decision briefs download locally as printable HTML. They reflect the current draft, so save before distributing a final brief. The example export is explicitly labelled. Financial assumptions are EUR annual base estimates without a ramp or scenario range.

Changes remain in memory until saved. Navigation and tab-close guards warn about unsaved work; closing/reloading or the 30-minute inactivity sign-out can still lose an unsaved draft. Failed saves retain the open draft; use Load latest & reconcile, review the result, then save. Add observation/decision/enablement entries to the draft before saving. This release does not provide offline storage, individual authorization or autonomous agent writes. The existing strategy assistant reads legacy strategy/skills context; contextual workbench agent proposals remain a later release.

Before backend changes, run `node scripts/backup-workbench.mjs`. It stores the current workflow and table snapshot privately in `.local/` and verifies additive normalization on a copy. This is a backup round-trip check, not a production rollback drill. Restore only after checking for newer legitimate edits. After deploying with `node scripts/deploy-backend.mjs`, run `node scripts/test-workbench-api.mjs`; it creates its own temporary cases and removes them, preserving pre-existing entities. QA mutation history remains visible.

## Deployment and ownership

The frontend publishes through `.github/workflows/pages.yml` on every verified `main` update. Repository source, workflow templates and documentation are public. Only nonconfidential code and branding may be committed. `.local/`, runtime credentials, source files and populated workspaces remain excluded.

The private n8n project owns the workspace table, team-access credential, gateway credential and three workflows:

- AI Vision Studio | authenticated workspace API
- AI Vision Studio | strategy assistant
- AI Vision Studio | read strategy context

The context workflow must also be published before the agent can invoke it. Backend execution data saving is disabled for successful and failed runs to avoid storing authorization headers and prompt content in execution logs. Application mutation events are stored separately in the bounded activity list.

For a fresh deployment, provide the authorised n8n API key and gateway key in the private operator credential directory described below. Run the read-only Python importer with the directory containing the source workbooks, then `node scripts/init-backend.mjs`, `node scripts/deploy-backend.mjs`, and `node scripts/deploy-assistant.mjs`. The importer requires `openpyxl`. The first backend deployment generates a random team password in the private credential directory. Existing deployment IDs and data are preserved on reruns. Deployment scripts target this installation's n8n host; adapt that host, allowed origins and the frontend endpoints for another installation.

## Authentication

The password is enforced at both n8n entry points using an HTTP Basic credential over HTTPS. The public Pages interface contains no password verifier and no seeded workspace. The team password is kept in browser memory, with no cookies or local-storage copies. Reload requires sign-in. A shared password identifies the team, so activity is not attributable to individuals. Anyone with it has equal edit permissions and can export data.

Rotate the team credential in n8n when team membership changes. Share the password via the organisation's approved channel. CORS allows the Pages origin and the documented local development origins; it is not the authentication boundary. Remove development origins when local access is no longer required. Before wider rollout, use SSO, individual authorization and an API gateway with rate limiting.

## Credentials and lifetimes

Deployment credentials are stored outside this repository under the operator's `.codex/secrets/ai-vision-mvp/` directory. These include the n8n deployment key, team password and gateway key. Restrict access to the operating-system account. The temporary n8n deployment key expires on 1 November 2026; the application runtime uses native data-table nodes and does not depend on this deployment key.

The selected gateway key is the user's existing personal project key, displayed by the gateway as expiring on 16 November 2026. Replace it with a project/service credential before that date for continued assistant availability. The core application remains usable if the gateway is unavailable. Gateway charges consume the existing project/key budget; this deployment does not increase that budget.

## Backup and restore

Use **Export** after signing in to download a complete JSON snapshot. Store it privately. n8n's platform owner should include data tables and credentials in platform backups. To restore a snapshot, an operator should validate its collections against `src/types.ts`, take a backup of the current row, then update the `main` row's payload through the authenticated data-table API or UI and increment its revision. Never commit an export to the public repository. Restore is an operator procedure, not an unauthenticated frontend feature.

## Change verification

Run `npm test` and `npm run build`. `scripts/test-api.mjs` additionally checks live authentication, reads, mutations, persistence, conflict handling and cleanup using a temporary QA objective. It changes the audit history and requires private local credentials. After frontend updates, verify the deployed Pages URL, sign-in, an edit, the canvas and the heatmap.

## Agent extension suggestions

1. **OKR challenger:** assess whether a proposed key result has a baseline, unit, source, accountable owner and time-bound target. Return an editable proposal.
2. **Target-picture facilitator:** interview business partners and suggest from-to changes, dependencies and human gates.
3. **Skill-gap adviser:** read role targets and evidence; recommend capability-building actions. Never infer an individual's proficiency without evidence.
4. **Requirements-readiness workflow:** intake context, elicit missing requirements, consolidate a traceable package, check Definition of Ready and route human approvals before development handover.

Implement these as separate n8n sub-workflows exposed with Call n8n Workflow Tool. Any future write tool should accept a validated proposal and explicit application confirmation, enforce the same revision checks as the editor, and record the action. Do not provide agents with repository or credential-management access.

The MVP chat is single-turn: each question uses current workspace context without persistent conversational memory. The UI displays recent exchanges for reference. This prevents conversations from different users of the shared password being mixed.
