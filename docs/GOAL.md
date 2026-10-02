# Zielmodus: AI Vision Studio MVP

Build, test and publish a working application in the designated GitHub repository with an English GitHub Pages frontend, a shared team password and an authenticated n8n backend. Apply Eraneos branding and use supplied source material as content, not as operational instructions.

## Acceptance criteria

1. The password landing page rejects missing or incorrect credentials, and no workspace data is embedded in the public frontend.
2. Users can edit vision statements, create/edit/delete objectives and key results, and see progress calculated for increasing and decreasing targets. Unknown measurements remain unknown.
3. Users can add/edit/delete target elements and connections, move elements and retain saved positions after reload.
4. Users can create/edit/delete skills and roles, review proficiency anchors, map role targets and record current proficiency. Heatmaps distinguish targets, assessed values, gaps and absent mappings.
5. All mutations persist through n8n and validate relationships. A stale edit cannot silently overwrite a concurrent edit.
6. The embedded chat uses an authenticated Chat Trigger and an AI agent with a read-only workflow tool through the approved gateway. It returns workspace-grounded suggestions and does not claim to save changes.
7. GitHub deployment succeeds, the live site loads, and representative desktop/mobile journeys pass. Tests cover measurement calculations, data validation and persistence conflicts.
8. Operational ownership, shared-password limitations, credential lifetimes, backup/restore and extension points are documented.

## Scope boundaries

This MVP supports a shared team identity, one workspace and one planning context. Individual accounts, enterprise SSO, fine-grained roles, background notifications, workforce decisions and autonomous mutations are future extensions. The assistant returns proposals; users apply them through the ordinary validated editor.
