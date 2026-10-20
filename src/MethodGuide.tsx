export default function MethodGuide() {
  const steps = [
    [
      "Map the problem",
      "Discover → Landscape",
      "Validate the current process or business area. Mark pain and core value, then explore capabilities. Separate shared solutions from output dependencies and describe the cost of waiting.",
    ],
    [
      "Decompose the work",
      "Design → Task decomposition",
      "Choose two focal process steps. Start from the desired output, then define inputs, transformation, review and handover. Revisit neighboring steps, human roles, exceptions and ethical failure scenarios.",
    ],
    [
      "Test the value story",
      "Estimate value",
      "Use editable assumptions for volume, time saved, review effort and operating cost. Separate capacity released from cashable benefits. Identify overlap before comparing cases.",
    ],
    [
      "Prioritize a pilot",
      "Prioritize pilot → Review",
      "Compare benefit and cost, then assess feasibility. Choose a small pilot, shared solution cluster or north star. Workshop votes guide discussion; they are not ROI or approval. Keep unknowns visible.",
    ],
  ];
  return (
    <section className="method-guide">
      <span className="eyebrow">MAPPING → DESIGN → PRIORITIZATION</span>
      <h3>A method that leads to an experiment</h3>
      <div className="method-steps">
        {steps.map(([title, where, body], i) => (
          <article key={title}>
            <span className="method-number">0{i + 1}</span>
            <h4>{title}</h4>
            <p>{body}</p>
            <small>{where}</small>
          </article>
        ))}
      </div>
      <details>
        <summary>Method source and AI card status</summary>
        <p>
          The opportunity-to-use-case-to-prioritization sequence has been
          checked against the supplied sprint board. Task decomposition and
          feasibility scoring are Studio extensions. Source wording is retained
          separately in the authenticated method library.
        </p>
        <p>
          The six capability prompts below remain provisional. Verified method
          extracts can be linked to tasks and cases. Embedded capability-card
          wording has not been transcribed; no completeness claim is made for that deck.
        </p>
      </details>
    </section>
  );
}
