export default function MethodGuide() {
  const steps = [
    [
      "Map the problem",
      "Discover → Landscape",
      "Name the process step, affected user and observable pain. Capture evidence and a baseline question. Map opportunities to capabilities; keep alternative approaches open.",
    ],
    [
      "Decompose the work",
      "Design → Task decomposition",
      "List tasks in order with inputs and outputs. Assign human judgment, deterministic automation or bounded AI. Specify an accountable role, acceptance check and fallback for every handover.",
    ],
    [
      "Test the value story",
      "Estimate value",
      "Use editable assumptions for volume, time saved, review effort and operating cost. Separate capacity released from cashable benefits. Identify overlap before comparing cases.",
    ],
    [
      "Prioritize a pilot",
      "Prioritize pilot → Review",
      "Assess business impact and feasibility separately. Keep unknowns outside the matrix. Challenge data access, integration, evaluation and risks. Record a decision and test the riskiest assumption.",
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
          feasibility scoring are Studio extensions, not a transcription of the
          training deck.
        </p>
        <p>
          The six capability prompts below remain provisional. The new AI card
          deck is awaiting upload and review; no new card content has been
          imported. Task-level card references can capture a title/version once
          the source is available.
        </p>
      </details>
    </section>
  );
}
