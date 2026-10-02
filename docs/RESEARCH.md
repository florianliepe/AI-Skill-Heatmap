# Research and design decisions

Reviewed 2 October 2026. Official documentation was used for integration behavior; source attachments were treated as reference data.

| Decision | Basis |
|---|---|
| Static Pages frontend with protected data API | [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) serves static HTML, CSS and JavaScript. Password enforcement therefore belongs in the backend. |
| Native private workspace storage in n8n | [n8n Data Tables](https://docs.n8n.io/data/data-tables/) and [Data Table node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datatable/) support persistent rows and matching conditions. |
| Authenticated request/response entry point | [Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) supports Basic authentication and response nodes. |
| Integrated chat and modular agent tools | [Chat Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/) supports embedded chat; [Call n8n Workflow Tool](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolworkflow/) exposes sub-workflows to the agent. |
| Verifiable autonomous goal | [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex) describes outcome-driven work with verifiable completion conditions. |
| Visual direction | [Eraneos](https://www.eraneos.com/) and the supplied brand assets informed the black wordmark, restrained typography, warm neutral surfaces and amber accents. |

The source workbooks supply a specialised AI overlay, role targets, score definitions and a broader knowledge base. Import preserves the source's four proficiency levels, six specialised AI families and proposal status. Current assessments and measured KPI values were not supplied, so they are not fabricated. The source-specific domain wording was adapted to the requested energy-efficiency and licence-management value stream. Eight exact skill-name matches enrich the specialised catalog from the broader knowledge-base candidates.

The assistant model is selected from the authenticated gateway's actual `/v1/models` response. Its key and model requests stay server-side in n8n.
