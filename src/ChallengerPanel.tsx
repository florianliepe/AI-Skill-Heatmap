import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { WorkItem } from "./workbench-model";
import type { Proposal, ChallengerResult } from "./proposal-model";
import * as api from "./api";
const labels = {
  design: "Workflow concept",
  alternative: "Non-AI alternative",
  nextAction: "Next action",
};
export default function ChallengerPanel({
  record,
  revision,
  dirty,
  demo,
  onApply,
}: {
  record: WorkItem;
  revision: number;
  dirty: boolean;
  demo: boolean;
  onApply: (edits: Proposal[]) => void;
}) {
  const [input, setInput] = useState(
    "Challenge this use case. Identify the weakest assumption and suggest a clearer next step.",
  );
  const [result, setResult] = useState<ChallengerResult | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const liveDraft = useRef(record);
  liveDraft.current = record;
  return (
    <section className="challenger-panel">
      <div className="section-heading">
        <h3>
          <Sparkles size={19} />
          AI challenger
        </h3>
        <small>REVIEW BEFORE APPLYING</small>
      </div>
      <p>
        Uses this saved case and its linked strategy context. Suggestions are
        unverified; check every claim. No measurements or decisions are created.
      </p>
      <label className="wb-field">
        Ask about this use case
        <textarea
          rows={3}
          maxLength={3000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </label>
      <button
        disabled={busy || dirty || demo || !input.trim()}
        onClick={async () => {
          setBusy(true);
          setError("");
          setResult(null);
          setApplied(false);
          setSelected([]);
          try {
            setResult(await api.challenge(record.id, revision, input));
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Challenging the case…" : "Ask challenger"}
      </button>
      {dirty && (
        <p className="wb-help">
          Save the case first so the proposal uses the same version as your
          team.
        </p>
      )}
      {demo && (
        <p className="wb-help">
          The challenger is available on saved workspace cases. Example mode
          does not call the AI service.
        </p>
      )}
      {error && (
        <div className="wb-alert" role="alert">
          {error}
        </div>
      )}
      {result && (
        <div className="challenger-results">
          {result.questions.length > 0 && (
            <>
              <h4>Questions to resolve</h4>
              <ul>
                {result.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          )}
          {result.proposals.map((p) => (
            <article key={p.field}>
              <label>
                <input
                  type="checkbox"
                  disabled={applied || dirty || busy}
                  checked={selected.includes(p.field)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, p.field]
                        : selected.filter((x) => x !== p.field),
                    )
                  }
                />
                <strong>{labels[p.field]}</strong>
              </label>
              <details>
                <summary>Current text</summary>
                <p>{record[p.field] || "Not defined"}</p>
              </details>
              <small>PROPOSED REPLACEMENT</small>
              <p>{p.proposed}</p>
              <small>Why: {p.reason}</small>
            </article>
          ))}
          <button
            disabled={busy || dirty || applied || !selected.length}
            onClick={async () => {
              setBusy(true);
              setError("");
              const before = JSON.stringify(record);
              try {
                const latest = await api.refresh();
                if (JSON.stringify(liveDraft.current) !== before)
                  throw new Error(
                    "Your draft changed during the check. Save it and generate a fresh proposal.",
                  );
                if (latest.revision !== result.revision)
                  throw new Error(
                    "The shared workspace changed. Refresh and generate a new proposal; the old proposal cannot be applied.",
                  );
                onApply(
                  result.proposals.filter((p) => selected.includes(p.field)),
                );
                setApplied(true);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Apply selected to draft
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setResult(null);
              setSelected([]);
            }}
          >
            Dismiss proposals
          </button>
          {applied && (
            <p role="status">
              Selected suggestions are in your draft. Review them and Save
              changes to publish them to the team.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
