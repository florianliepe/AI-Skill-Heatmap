// Pure application logic, also embedded in the n8n Code node by deploy-backend.mjs.
export function applyMutation(snapshot, request) {
  const fail = (message) => ({ write: false, response: { error: message } });
  const revision = snapshot.revision;
  const data = {
    ...snapshot.data,
    schemaVersion: 3,
    workItems: snapshot.data.workItems || [],
    sprintSessions: snapshot.data.sprintSessions || [],
  };
  const fingerprint = JSON.stringify({
    action: request.action,
    collection: request.collection,
    record: request.record,
    id: request.id,
  });
  if (request.requestId) {
    if (
      typeof request.requestId !== "string" ||
      !/^[\w-]{1,90}$/.test(request.requestId)
    )
      return fail("Invalid request identifier.");
    const prior = (data._requests || []).find(
      (r) => r.id === request.requestId,
    );
    if (prior)
      return prior.fingerprint === fingerprint
        ? { write: false, response: { data, revision } }
        : fail("Request identifier was reused with different content.");
  }
  if (request.action === "read")
    return { write: false, response: { data, revision } };
  if (!["create", "update", "delete"].includes(request.action))
    return fail("Unsupported action.");
  if (!Number.isInteger(request.revision) || request.revision !== revision)
    return fail(
      "Someone else updated this workspace. Refresh to load their changes, then try again.",
    );
  const specs = {
    sprintSessions: [
      "title",
      "problem",
      "scope",
      "facilitator",
      "participants",
      "module",
      "methodVersion",
      "date",
      "outcome",
    ],
    workItems: [],
    visions: ["title", "statement", "purpose", "horizon", "owner"],
    objectives: ["title", "description", "owner", "period", "pillar"],
    keyResults: [
      "objectiveId",
      "title",
      "baseline",
      "target",
      "current",
      "unit",
      "owner",
      "dueDate",
      "evidence",
    ],
    skills: [
      "name",
      "family",
      "definition",
      "levels",
      "relevance",
      "impact",
      "upskilling",
      "horizon",
      "status",
      "evidence",
    ],
    roles: ["name", "accountability", "workMode"],
    assessments: [
      "roleId",
      "skillId",
      "target",
      "current",
      "evidence",
      "priority",
    ],
    nodes: [
      "label",
      "category",
      "description",
      "currentState",
      "targetState",
      "owner",
      "mode",
      "x",
      "y",
    ],
    edges: ["source", "target", "label"],
  };
  const c = request.collection;
  if (!Object.hasOwn(specs, c)) return fail("Unknown collection.");
  const id = request.action === "delete" ? request.id : request.record?.id;
  if (typeof id !== "string" || !/^[\w-]{1,90}$/.test(id))
    return fail("Invalid record identifier.");
  const at = data[c].findIndex((r) => r.id === id);
  if (request.action === "create" && at >= 0)
    return fail("This record already exists.");
  if (request.action !== "create" && at < 0)
    return fail("This record no longer exists. Refresh the workspace.");
  const next = JSON.parse(JSON.stringify(data));
  let record;
  if (request.action !== "delete") {
    record = { id };
    if (c === "workItems") {
      const raw = request.record;
      record.sessionId = raw.sessionId || "";
      if (
        typeof record.sessionId !== "string" ||
        (record.sessionId &&
          !data.sprintSessions.some((s) => s.id === record.sessionId))
      )
        return fail("Select an existing sprint session.");
      const design = raw.workDesign || {};
      record.workDesign = {};
      for (const key of [
        "currentWork",
        "input",
        "aiTask",
        "humanJudgment",
        "handover",
        "output",
        "tools",
      ]) {
        const value = design[key] ?? "";
        if (typeof value !== "string" || value.length > 12000)
          return fail("Invalid workflow design field: " + key);
        record.workDesign[key] = value;
      }
      record.workDesign.autonomy = design.autonomy || "AI supported";
      if (
        !["AI supported", "AI augmented", "Agentic"].includes(
          record.workDesign.autonomy,
        )
      )
        return fail("Choose a valid AI working approach.");
      const textKeys = [
        "kind",
        "title",
        "problem",
        "process",
        "session",
        "methodVersion",
        "owner",
        "objectiveId",
        "nodeId",
        "stage",
        "evidence",
        "evidenceNote",
        "assumptionsNote",
        "nextAction",
        "due",
        "design",
        "alternative",
        "valueIntent",
        "overlap",
      ];
      for (const k of textKeys) {
        if (typeof raw[k] !== "string" || raw[k].length > 12000)
          return fail("Missing or invalid workbench field: " + k);
        record[k] = raw[k];
      }
      if (!raw.title.trim() || !raw.problem.trim())
        return fail("Give the idea a title and describe the problem.");
      if (
        !["idea", "usecase"].includes(raw.kind) ||
        ![
          "Captured",
          "Framed",
          "Experiment planned",
          "Piloting",
          "In use",
          "Paused",
          "Archived",
        ].includes(raw.stage) ||
        ![
          "Assumption",
          "Source-supported",
          "Sampled",
          "Pilot-observed",
        ].includes(raw.evidence) ||
        ![
          "Capacity",
          "Cash",
          "Quality / service",
          "Risk",
          "New revenue",
          "Enabling capability",
        ].includes(raw.valueIntent)
      )
        return fail("Invalid workbench classification.");
      const cats = [
        "Organize information",
        "Fulfill tasks",
        "Decision support",
        "Conversation",
        "Listen & understand",
        "Optimize processes",
      ];
      if (
        !Array.isArray(raw.categories) ||
        raw.categories.length > 6 ||
        new Set(raw.categories).size !== raw.categories.length ||
        raw.categories.some((x) => !cats.includes(x))
      )
        return fail("Select valid capability categories.");
      record.categories = raw.categories;
      if (
        !Array.isArray(raw.sourceIds) ||
        raw.sourceIds.length > 100 ||
        new Set(raw.sourceIds).size !== raw.sourceIds.length ||
        raw.sourceIds.some(
          (x) => x === id || !data.workItems.some((w) => w.id === x),
        )
      )
        return fail("Invalid source opportunity link.");
      record.sourceIds = raw.sourceIds;
      for (const [key, col] of [
        ["objectiveId", "objectives"],
        ["nodeId", "nodes"],
      ])
        if (raw[key] && !data[col].some((x) => x.id === raw[key]))
          return fail("Linked " + key + " no longer exists.");
      if (
        raw.impact !== null &&
        (!Number.isInteger(raw.impact) || raw.impact < 1 || raw.impact > 5)
      )
        return fail("Impact must be 1–5 or unknown.");
      if (raw.impact !== null && !raw.evidenceNote.trim())
        return fail("Add an assessment rationale before scoring impact.");
      record.impact = raw.impact;
      const numeric = (v) =>
        v === null ||
        (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e12);
      const econKeys = [
        "volume",
        "adoption",
        "baseline",
        "assisted",
        "review",
        "rate",
        "realization",
        "recurring",
        "setup",
      ];
      record.economics = {};
      for (const key of econKeys) {
        const v = raw.economics?.[key];
        if (
          !numeric(v) ||
          (v !== null &&
            (v < 0 || (["adoption", "realization"].includes(key) && v > 100)))
        )
          return fail("Invalid economic assumption: " + key);
        record.economics[key] = v;
      }
      record.experiment = {};
      for (const key of [
        "hypothesis",
        "measure",
        "unit",
        "sample",
        "stopRule",
        "owner",
        "due",
      ]) {
        if (
          typeof raw.experiment?.[key] !== "string" ||
          raw.experiment[key].length > 12000
        )
          return fail("Invalid experiment field.");
        record.experiment[key] = raw.experiment[key];
      }
      for (const key of ["baseline", "target"]) {
        if (!numeric(raw.experiment?.[key]))
          return fail("Invalid experiment number.");
        record.experiment[key] = raw.experiment[key];
      }
      const dateOk = (v) =>
        v === "" ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v);
      if (!dateOk(raw.due) || !dateOk(record.experiment.due))
        return fail("Use a valid date.");
      for (const [list, fields] of [
        ["observations", ["id", "date", "sample", "evidence"]],
        ["decisions", ["id", "date", "action", "owner", "rationale"]],
        [
          "enablement",
          [
            "id",
            "roleId",
            "skillId",
            "owner",
            "action",
            "due",
            "criterion",
            "status",
          ],
        ],
      ]) {
        if (!Array.isArray(raw[list]) || raw[list].length > 200)
          return fail("Invalid " + list + " list.");
        record[list] = [];
        const seen = new Set();
        for (const entry of raw[list]) {
          const clean = {};
          for (const key of fields) {
            if (typeof entry[key] !== "string" || entry[key].length > 12000)
              return fail("Invalid " + list + " field.");
            clean[key] = entry[key];
          }
          if (!/^[\w-]{1,90}$/.test(clean.id) || seen.has(clean.id))
            return fail("Invalid or duplicate entry identifier.");
          seen.add(clean.id);
          if (list === "observations") {
            if (
              entry.value === null ||
              !numeric(entry.value) ||
              !entry.evidence.trim() ||
              !entry.sample.trim() ||
              !entry.date ||
              !dateOk(entry.date)
            )
              return fail(
                "Observation needs a value, date, sample and evidence.",
              );
            clean.value = entry.value;
          }
          if (
            list === "decisions" &&
            (!["Investigate", "Test", "Defer", "Stop", "Scale"].includes(
              entry.action,
            ) ||
              !entry.owner.trim() ||
              !entry.rationale.trim() ||
              !entry.date ||
              !dateOk(entry.date))
          )
            return fail("Decision needs an owner, date and rationale.");
          if (list === "enablement") {
            if (
              !data.roles.some((r) => r.id === entry.roleId) ||
              !data.skills.some((s) => s.id === entry.skillId) ||
              !Number.isInteger(entry.target) ||
              entry.target < 1 ||
              entry.target > 4 ||
              !entry.action.trim() ||
              !entry.owner.trim() ||
              !entry.criterion.trim() ||
              !entry.due ||
              !dateOk(entry.due) ||
              ![
                "Planned",
                "Practicing",
                "Evidence ready",
                "Completed",
              ].includes(entry.status)
            )
              return fail(
                "Enablement action needs valid role, skill, owner, date and evidence criterion.",
              );
            clean.target = entry.target;
          }
          record[list].push(clean);
        }
      }
      if (
        ["Experiment planned", "Piloting", "In use"].includes(raw.stage) &&
        (!record.experiment.owner.trim() ||
          !record.experiment.hypothesis.trim() ||
          !record.experiment.measure.trim() ||
          !record.experiment.unit.trim() ||
          !record.experiment.sample.trim() ||
          !record.experiment.stopRule.trim() ||
          !record.experiment.due ||
          record.experiment.target === null)
      )
        return fail(
          "Complete the experiment essentials before changing to this stage.",
        );
      if (
        raw.stage === "In use" &&
        (!record.observations.length ||
          !record.decisions.some((d) => d.action === "Scale"))
      )
        return fail(
          "Record an outcome and a scale decision before marking in use.",
        );
      if (
        record.observations.length &&
        (!record.experiment.measure.trim() || !record.experiment.unit.trim())
      )
        return fail("Define the observation measure and unit first.");
      if (at >= 0) {
        const previous = data.workItems[at];
        for (const list of ["observations", "decisions"])
          if (
            previous[list].some(
              (entry, index) =>
                JSON.stringify(entry) !== JSON.stringify(record[list][index]),
            )
          )
            return fail(
              "Saved observations and decisions are immutable. Add a new entry to document a correction.",
            );
        if (
          previous.observations.length &&
          ["measure", "unit", "baseline", "target"].some(
            (k) => previous.experiment[k] !== record.experiment[k],
          )
        )
          return fail(
            "The measured experiment definition is frozen. Create a new use case for a changed measure or target.",
          );
      }
    }
    const numberFields = [
      "baseline",
      "target",
      "current",
      "relevance",
      "impact",
      "upskilling",
      "x",
      "y",
    ];
    for (const key of specs[c]) {
      const value = request.record[key];
      if (key === "levels") {
        if (
          !Array.isArray(value) ||
          value.length !== 4 ||
          value.some((v) => typeof v !== "string" || v.length > 4000)
        )
          return fail("Provide four proficiency definitions.");
      } else if (
        numberFields.includes(key) &&
        !(c === "edges" && key === "target")
      ) {
        if (
          !(key === "current" && value === null) &&
          (typeof value !== "number" || !Number.isFinite(value))
        )
          return fail("Enter valid numeric values.");
      } else if (typeof value !== "string" || value.length > 12000)
        return fail("A required text field is missing or too long.");
      record[key] = value;
    }
    if (
      (record.title !== undefined && !record.title.trim()) ||
      (record.name !== undefined && !record.name.trim()) ||
      (record.label !== undefined && c === "nodes" && !record.label.trim())
    )
      return fail("Enter a name or title.");
    if (c === "sprintSessions") {
      if (
        !record.problem.trim() ||
        ![
          "Awareness",
          "Opportunity mapping",
          "Process automation",
          "Products & services",
        ].includes(record.module)
      )
        return fail("A sprint needs a problem and valid module.");
      if (
        record.date &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) ||
          Number.isNaN(Date.parse(record.date)) ||
          new Date(record.date).toISOString().slice(0, 10) !== record.date)
      )
        return fail("Enter a valid session date.");
    }
    if (c === "keyResults") {
      if (!data.objectives.some((o) => o.id === record.objectiveId))
        return fail("Select an existing objective.");
      if (record.baseline === record.target)
        return fail("Baseline and target must differ.");
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(record.dueDate) ||
        Number.isNaN(Date.parse(record.dueDate))
      )
        return fail("Enter a valid due date.");
      record.updatedAt = new Date().toISOString();
    }
    if (
      c === "skills" &&
      ["relevance", "impact", "upskilling"].some(
        (k) => !Number.isInteger(record[k]) || record[k] < 1 || record[k] > 5,
      )
    )
      return fail("Priority scores must be integers from 1 to 5.");
    if (c === "assessments") {
      if (
        !data.roles.some((r) => r.id === record.roleId) ||
        !data.skills.some((s) => s.id === record.skillId)
      )
        return fail("Select an existing role and skill.");
      if (
        !Number.isInteger(record.target) ||
        record.target < 1 ||
        record.target > 4 ||
        (record.current !== null &&
          (!Number.isInteger(record.current) ||
            record.current < 1 ||
            record.current > 4))
      )
        return fail("Proficiency must be 1–4, or unassessed.");
      if (
        data.assessments.some(
          (a) =>
            a.id !== id &&
            a.roleId === record.roleId &&
            a.skillId === record.skillId,
        )
      )
        return fail(
          "This role already has an assessment for this skill. Edit that assessment.",
        );
    }
    if (
      c === "edges" &&
      (!data.nodes.some((n) => n.id === record.source) ||
        !data.nodes.some((n) => n.id === record.target) ||
        record.source === record.target)
    )
      return fail("Connect two different existing nodes.");
    if (
      c === "nodes" &&
      (Math.abs(record.x) > 10000 || Math.abs(record.y) > 10000)
    )
      return fail("Position is outside the canvas limits.");
    if (request.action === "create") next[c].push(record);
    else next[c][at] = record;
  } else {
    if (
      [
        "objectives",
        "nodes",
        "roles",
        "skills",
        "workItems",
        "sprintSessions",
      ].includes(c) &&
      data.workItems.some(
        (w) =>
          (c === "objectives" && w.objectiveId === id) ||
          (c === "nodes" && w.nodeId === id) ||
          (c === "sprintSessions" && w.sessionId === id) ||
          (c === "roles" && w.enablement.some((a) => a.roleId === id)) ||
          (c === "skills" && w.enablement.some((a) => a.skillId === id)) ||
          (c === "workItems" && w.sourceIds.includes(id)),
      )
    )
      return fail(
        "This record is linked to workbench records. Remove those links first.",
      );
    next[c].splice(at, 1);
    if (c === "objectives")
      next.keyResults = next.keyResults.filter((r) => r.objectiveId !== id);
    if (c === "roles")
      next.assessments = next.assessments.filter((r) => r.roleId !== id);
    if (c === "skills")
      next.assessments = next.assessments.filter((r) => r.skillId !== id);
    if (c === "nodes")
      next.edges = next.edges.filter((r) => r.source !== id && r.target !== id);
  }
  if (next[c].length > 2000) return fail("Collection limit reached.");
  if (request.requestId)
    next._requests = [
      { id: request.requestId, fingerprint },
      ...(next._requests || []),
    ].slice(0, 30);
  next.audit = [
    {
      id: "event-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
      at: new Date().toISOString(),
      action: request.action,
      collection: c,
      recordId: id,
      label:
        record?.title ||
        record?.name ||
        record?.label ||
        data[c][at]?.title ||
        data[c][at]?.name ||
        id,
    },
    ...next.audit,
  ].slice(0, 200);
  if (JSON.stringify(next).length > 1500000)
    return fail("Workspace size limit reached.");
  return {
    write: true,
    payload: JSON.stringify(next),
    revision: revision + 1,
    previousRevision: revision,
    response: { data: next, revision: revision + 1 },
  };
}
