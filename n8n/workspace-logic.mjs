// Pure application logic, also embedded in the n8n Code node by deploy-backend.mjs.
export function applyMutation(snapshot, request) {
  const fail = (message) => ({ write: false, response: { error: message } });
  const { data, revision } = snapshot;
  if (request.action === "read")
    return { write: false, response: { data, revision } };
  if (!["create", "update", "delete"].includes(request.action))
    return fail("Unsupported action.");
  if (!Number.isInteger(request.revision) || request.revision !== revision)
    return fail(
      "Someone else updated this workspace. Refresh to load their changes, then try again.",
    );
  const specs = {
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
      } else if (numberFields.includes(key)) {
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
