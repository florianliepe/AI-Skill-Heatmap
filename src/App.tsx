import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Grid2X2,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessageSquare,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import * as api from "./api";
import { gap, objectiveProgress, progress } from "./metrics";
import type {
  Assessment,
  Collection,
  RecordValue,
  Snapshot,
  Workspace,
} from "./types";
import Editor, { newRecord } from "./Editor";
import TargetCanvas from "./TargetCanvas";
type Page =
  | "Overview"
  | "Vision & OKRs"
  | "Target picture"
  | "Skill catalog"
  | "Skill heatmap"
  | "Role profiles"
  | "Activity";
const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Vision & OKRs", icon: Target },
  { name: "Target picture", icon: Network },
  { name: "Skill catalog", icon: Layers },
  { name: "Skill heatmap", icon: Grid2X2 },
  { name: "Role profiles", icon: Users },
] as const;
const fmt = (v: number | null) =>
  v === null ? "Not measured" : `${Math.round(v)}%`;
const colors = [
  "#4e514c",
  "#b39a72",
  "#d0b684",
  "#8f9b9f",
  "#b88873",
  "#9a9488",
];
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <Compass size={28} />
      <p>{children}</p>
    </div>
  );
}
function Progress({ value }: { value: number | null }) {
  return (
    <div className="progress-track">
      <span style={{ width: (value ?? 0) + "%" }} />
    </div>
  );
}
export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [page, setPage] = useState<Page>("Overview");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<{
    collection: Collection;
    record: RecordValue;
    create: boolean;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("All families");
  const [heatMode, setHeatMode] = useState("Target");
  const [canvasLayer, setCanvasLayer] = useState("Operating model");
  const [chat, setChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: string; text: string }[]
  >([]);
  const [chatBusy, setChatBusy] = useState(false);
  const data = snapshot?.data;
  const families = useMemo(
    () => (data ? [...new Set(data.skills.map((s) => s.family))] : []),
    [data],
  );
  const logout = () => {
    api.clearSession();
    setSnapshot(null);
    setPassword("");
    setEditing(null);
    setChat(false);
    setChatMessages([]);
    setNotice("");
  };
  useEffect(() => {
    if (!snapshot) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, 30 * 60 * 1000);
    };
    reset();
    window.addEventListener("pointerdown", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [!!snapshot]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setSnapshot(await api.login(password));
      setPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    setBusy(true);
    setError("");
    try {
      setSnapshot(await api.refresh());
      setNotice("Workspace refreshed");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(collection: Collection, record?: RecordValue) {
    if (!data) return;
    setEditing({
      collection,
      record: record || newRecord(collection, data),
      create: !record,
    });
  }
  async function save(
    collection: Collection,
    record: RecordValue,
    create = false,
  ) {
    if (!snapshot) throw new Error("Please sign in.");
    setBusy(true);
    setError("");
    try {
      setSnapshot(
        await api.save(collection, record, snapshot.revision, create),
      );
      setNotice("Saved to shared workspace");
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  function exportData() {
    if (!snapshot) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-vision-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const message = chatInput;
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", text: message }]);
    setChatBusy(true);
    try {
      const response = await api.chat(message);
      setChatMessages((m) => [...m, { role: "assistant", text: response }]);
    } catch (e) {
      setChatMessages((m) => [
        ...m,
        { role: "assistant", text: (e as Error).message },
      ]);
    } finally {
      setChatBusy(false);
    }
  }
  if (!data || !snapshot)
    return (
      <div className="login-page">
        <div className="login-brand">
          <img src={import.meta.env.BASE_URL + "eraneos.png"} alt="eraneos" />
          <span>AI VISION STUDIO</span>
        </div>
        <main className="login-main">
          <div className="login-story">
            <span className="eyebrow">STRATEGY. PEOPLE. POSSIBILITIES.</span>
            <h1>
              Make your
              <br />
              AI ambition
              <br />
              <em>tangible.</em>
            </h1>
            <p>
              One shared workspace to connect your vision,
              <br />
              measurable outcomes and the skills to get there.
            </p>
            <div className="login-steps">
              <span>01 &nbsp; Set direction</span>
              <span>02 &nbsp; Design the future</span>
              <span>03 &nbsp; Build capability</span>
            </div>
          </div>
          <form className="login-card" onSubmit={signIn}>
            <div className="lock-icon">
              <LockKeyhole size={24} />
            </div>
            <h2>Welcome to your workspace</h2>
            <p>Enter your team password to continue.</p>
            <label htmlFor="team-password">Team password</label>
            <input
              id="team-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Opening workspace…" : "Open workspace"}
              <ArrowRight size={18} />
            </button>
            <small>
              <ShieldCheck size={15} /> Private data · Authenticated team access
            </small>
          </form>
        </main>
        <footer className="login-footer">
          AI transformation starts with a shared direction.
          <span>VISION 2027 / 2028</span>
        </footer>
      </div>
    );
  const vision = data.visions[0];
  const visibleNodes = data.nodes.filter(
    (n) =>
      canvasLayer === "All layers" ||
      (canvasLayer === "Value stream"
        ? n.category === "Value stream"
        : n.category !== "Value stream"),
  );
  const visibleEdges = data.edges.filter(
    (e) =>
      visibleNodes.some((n) => n.id === e.source) &&
      visibleNodes.some((n) => n.id === e.target),
  );
  const canvasData = { ...data, nodes: visibleNodes, edges: visibleEdges };
  const measured = data.keyResults.filter((k) => k.current !== null).length;
  const assessed = data.assessments.filter((a) => a.current !== null).length;
  const overall = objectiveProgress(data.keyResults);
  const skills = data.skills.filter(
    (s) =>
      (family === "All families" || s.family === family) &&
      `${s.name} ${s.definition}`.toLowerCase().includes(search.toLowerCase()),
  );
  const titles: Record<
    Page,
    { kicker: string; title: string; description: string }
  > = {
    Overview: {
      kicker: "YOUR TRANSFORMATION, CONNECTED",
      title: "A clear view of what’s next.",
      description:
        "Connect strategic ambition with measurable progress and the capabilities that make it possible.",
    },
    "Vision & OKRs": {
      kicker: "01 / SET DIRECTION",
      title: "Ambition into outcomes.",
      description:
        "A shared vision, focused objectives and key results you can measure.",
    },
    "Target picture": {
      kicker: "02 / DESIGN THE FUTURE",
      title: "Shape your AI-native value stream.",
      description:
        "Connect capabilities, teams and services. Make the shift from today to tomorrow explicit.",
    },
    "Skill catalog": {
      kicker: "03 / BUILD CAPABILITY",
      title: "The skills behind the strategy.",
      description:
        "A shared language for AI capability. Explore definitions, proficiency and future relevance.",
    },
    "Skill heatmap": {
      kicker: "CAPABILITY INTELLIGENCE",
      title: "See where to grow.",
      description:
        "Compare role targets with assessed proficiency. Unassessed cells stay separate from skill gaps.",
    },
    "Role profiles": {
      kicker: "PEOPLE & OPERATING MODEL",
      title: "Human expertise. Expanded.",
      description:
        "Define the skills and accountability of your future product teams.",
    },
    Activity: {
      kicker: "SHARED WORKSPACE",
      title: "Changes with context.",
      description: "The latest 200 changes made in the shared team workspace.",
    },
  };
  const heading = titles[page];
  const editButton = (c: Collection, r: RecordValue, label = "Edit") => (
    <button
      className="icon-button"
      title={label}
      aria-label={label}
      disabled={busy}
      onClick={() => edit(c, r)}
    >
      <Pencil size={15} />
    </button>
  );
  const filters = (
    <div className="filters">
      <div className="search-box">
        <Search size={17} />
        <input
          aria-label="Search skills"
          placeholder="Search skills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <select
        aria-label="Filter by skill family"
        value={family}
        onChange={(e) => setFamily(e.target.value)}
      >
        <option>All families</option>
        {families.map((f) => (
          <option key={f}>{f}</option>
        ))}
      </select>
      <span className="muted">{skills.length} skills</span>
    </div>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Overview");
          }}
        >
          <img src={import.meta.env.BASE_URL + "eraneos.png"} alt="eraneos" />
        </a>
        <div className="workspace-label">
          <span className="workspace-mark">
            <Compass size={19} />
          </span>
          <div>
            <strong>AI Vision Studio</strong>
            <small>Value Stream Workspace</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {navigation.map((n) => (
            <button
              className={page === n.name ? "active" : ""}
              key={n.name}
              onClick={() => {
                setPage(n.name);
                setSearch("");
              }}
            >
              <n.icon size={18} />
              {n.name}
              {page === n.name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={18} />
          <strong>From maker to architect</strong>
          <p>
            Design the work.
            <br />
            Build the capability.
            <br />
            Keep people accountable.
          </p>
          <span>
            2027 — 2028 <ArrowUpRight size={14} />
          </span>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => setPage("Activity")}>
            <ChartNoAxesCombined size={17} />
            Workspace activity
          </button>
          <button onClick={logout}>
            <LogOut size={17} />
            Sign out
          </button>
          <div className="team-profile">
            <span>VS</span>
            <div>
              <strong>Value Stream Team</strong>
              <small>Shared team workspace</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div>
            <span>AI native programme</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <span className="live-dot" />
            Shared workspace
            <button
              className="icon-button"
              title="Refresh workspace"
              aria-label="Refresh workspace"
              onClick={reload}
              disabled={busy}
            >
              <RefreshCw size={16} className={busy ? "spin" : ""} />
            </button>
            <button className="outline-small" onClick={exportData}>
              <ArrowDownToLine size={15} />
              <span>Export</span>
            </button>
            <button
              className="icon-button mobile-signout"
              aria-label="Sign out"
              onClick={logout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{heading.kicker}</span>
              <h1>{heading.title}</h1>
              <p>{heading.description}</p>
            </div>
            {page === "Overview" ? (
              <span className="horizon-pill">
                <span />
                Horizon 2027 / 2028
              </span>
            ) : page === "Vision & OKRs" ? (
              <button className="primary" onClick={() => edit("objectives")}>
                <Plus size={17} />
                Add objective
              </button>
            ) : page === "Target picture" ? (
              <button className="primary" onClick={() => edit("nodes")}>
                <Plus size={17} />
                Add element
              </button>
            ) : page === "Skill catalog" ? (
              <button className="primary" onClick={() => edit("skills")}>
                <Plus size={17} />
                Add skill
              </button>
            ) : page === "Role profiles" ? (
              <button className="primary" onClick={() => edit("roles")}>
                <Plus size={17} />
                Add role
              </button>
            ) : null}
          </div>
          {error && (
            <div className="banner error" role="alert">
              <span>{error}</span>
              <button onClick={reload}>Refresh workspace</button>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={15} />
              </button>
            </div>
          )}
          {page === "Overview" && (
            <>
              <div className="overview-grid">
                <section className="vision-card">
                  <div className="vision-card-top">
                    <span className="eyebrow">OUR NORTH STAR</span>
                    {vision && (
                      <button
                        aria-label="Edit vision"
                        className="light-icon"
                        onClick={() => edit("visions", vision)}
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                  <h2>{vision?.title || "Define your AI vision"}</h2>
                  <p>
                    {vision?.statement ||
                      "Start with the future you want to create."}
                  </p>
                  <button onClick={() => setPage("Vision & OKRs")}>
                    Explore the vision <ArrowUpRight size={18} />
                  </button>
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                </section>
                <section className="card programme-card">
                  <span className="eyebrow">PROGRAMME PULSE</span>
                  <div className="big-value">
                    {measured ? Math.round(overall ?? 0) + "%" : "—"}
                    <span>OKR attainment</span>
                  </div>
                  <Progress value={overall} />
                  <p>
                    {measured} of {data.keyResults.length} key results measured
                  </p>
                  <div className="info-note">
                    <CircleHelp size={17} />
                    <span>
                      {measured
                        ? "Progress uses measured key results only."
                        : "Add your first measurements to establish an evidence-based view."}
                    </span>
                  </div>
                </section>
              </div>
              <div className="stat-grid">
                <button
                  className="stat-card"
                  onClick={() => setPage("Vision & OKRs")}
                >
                  <span className="stat-icon">
                    <Target size={20} />
                  </span>
                  <div>
                    <span>Strategic objectives</span>
                    <strong>
                      {data.objectives.length.toString().padStart(2, "0")}
                    </strong>
                    <small>{data.keyResults.length} linked key results</small>
                  </div>
                  <ArrowUpRight size={18} />
                </button>
                <button
                  className="stat-card"
                  onClick={() => setPage("Skill catalog")}
                >
                  <span className="stat-icon">
                    <Layers size={20} />
                  </span>
                  <div>
                    <span>AI skills in focus</span>
                    <strong>{data.skills.length}</strong>
                    <small>{families.length} capability families</small>
                  </div>
                  <ArrowUpRight size={18} />
                </button>
                <button
                  className="stat-card"
                  onClick={() => setPage("Role profiles")}
                >
                  <span className="stat-icon">
                    <Users size={20} />
                  </span>
                  <div>
                    <span>Future role profiles</span>
                    <strong>{data.roles.length}</strong>
                    <small>{data.assessments.length} skill targets</small>
                  </div>
                  <ArrowUpRight size={18} />
                </button>
                <button
                  className="stat-card"
                  onClick={() => setPage("Skill heatmap")}
                >
                  <span className="stat-icon">
                    <Grid2X2 size={20} />
                  </span>
                  <div>
                    <span>Assessment coverage</span>
                    <strong>
                      {data.assessments.length
                        ? Math.round((100 * assessed) / data.assessments.length)
                        : 0}
                      <em>%</em>
                    </strong>
                    <small>
                      {assessed} of {data.assessments.length} assessed
                    </small>
                  </div>
                  <ArrowUpRight size={18} />
                </button>
              </div>
              <div className="dashboard-lower">
                <section className="card">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">STRATEGIC FOCUS</span>
                      <h2>Objectives at a glance</h2>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage("Vision & OKRs")}
                    >
                      View all <ArrowRight size={16} />
                    </button>
                  </div>
                  {data.objectives.slice(0, 4).map((o, i) => {
                    const krs = data.keyResults.filter(
                      (k) => k.objectiveId === o.id,
                    );
                    return (
                      <button
                        className="objective-preview"
                        key={o.id}
                        onClick={() => setPage("Vision & OKRs")}
                      >
                        <span className="index-num">0{i + 1}</span>
                        <div>
                          <strong>{o.title}</strong>
                          <small>
                            {o.pillar} · {krs.length} key results
                          </small>
                          <Progress value={objectiveProgress(krs)} />
                        </div>
                        <span className="quiet-badge">
                          {fmt(objectiveProgress(krs))}
                        </span>
                      </button>
                    );
                  })}
                  {!data.objectives.length && (
                    <Empty>Add an objective to get started.</Empty>
                  )}
                </section>
                <section className="card capability-card">
                  <span className="eyebrow">CAPABILITY LANDSCAPE</span>
                  <h2>Build the foundations.</h2>
                  <p className="muted">Skills by capability family</p>
                  {families.map((f, i) => (
                    <div className="family-bar" key={f}>
                      <div>
                        <span>{f.replace("AI ", "")}</span>
                        <strong>
                          {data.skills.filter((s) => s.family === f).length}
                        </strong>
                      </div>
                      <div>
                        <span
                          style={{
                            width:
                              Math.max(
                                8,
                                (100 *
                                  data.skills.filter((s) => s.family === f)
                                    .length) /
                                  Math.max(
                                    ...families.map(
                                      (g) =>
                                        data.skills.filter(
                                          (s) => s.family === g,
                                        ).length,
                                    ),
                                  ),
                              ) + "%",
                            background: colors[i % 6],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </section>
              </div>
              <div className="next-step">
                <span className="step-icon">
                  <Compass size={22} />
                </span>
                <div>
                  <strong>Your next step: validate the starting point.</strong>
                  <p>
                    Review proposed targets, assign accountable owners and
                    capture current proficiency.
                  </p>
                </div>
                <button onClick={() => setPage("Skill heatmap")}>
                  Open heatmap <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
          {page === "Vision & OKRs" && (
            <>
              <section className="card vision-detail">
                <div>
                  <span className="eyebrow">VISION & PURPOSE</span>
                  <h2>{vision?.title || "Your north star"}</h2>
                  <p>{vision?.statement || "Add a vision to set direction."}</p>
                  <small>{vision?.purpose}</small>
                </div>
                <button onClick={() => edit("visions", vision)}>
                  <Pencil size={16} />
                  {vision ? "Edit vision" : "Add vision"}
                </button>
              </section>
              {data.visions.slice(1).map((v) => (
                <section className="card" key={v.id}>
                  <h2>
                    {v.title}
                    {editButton("visions", v)}
                  </h2>
                  <p>{v.statement}</p>
                </section>
              ))}
              <div className="method-note">
                <CircleHelp size={17} />
                <span>
                  Progress = (current − baseline) / (target − baseline), capped
                  at 0–100%. Supports increasing and decreasing targets.
                  Proposed baselines and targets need owner validation.
                </span>
              </div>
              {data.objectives.map((o, i) => {
                const krs = data.keyResults.filter(
                  (k) => k.objectiveId === o.id,
                );
                return (
                  <section className="card objective-card" key={o.id}>
                    <div className="objective-header">
                      <span className="index-num">0{i + 1}</span>
                      <div className="grow">
                        <span className="eyebrow">
                          {o.pillar} · {o.period}
                        </span>
                        <h2>{o.title}</h2>
                        <p>{o.description}</p>
                        <small>{o.owner || "Owner not assigned"}</small>
                      </div>
                      <div className="objective-score">
                        <strong>{fmt(objectiveProgress(krs))}</strong>
                        <small>
                          {krs.filter((k) => k.current !== null).length}/
                          {krs.length} measured
                        </small>
                      </div>
                      {editButton("objectives", o, "Edit objective")}
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Key result</th>
                            <th>Baseline</th>
                            <th>Current</th>
                            <th>Target</th>
                            <th>Progress</th>
                            <th>Due</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {krs.map((k) => (
                            <tr key={k.id}>
                              <td>
                                <strong>{k.title}</strong>
                                <small>
                                  {k.owner} · {k.unit}
                                </small>
                              </td>
                              <td>{k.baseline}</td>
                              <td>{k.current ?? "—"}</td>
                              <td>{k.target}</td>
                              <td className="kr-progress">
                                <span>{fmt(progress(k))}</span>
                                <Progress value={progress(k)} />
                              </td>
                              <td>{k.dueDate}</td>
                              <td>
                                {editButton("keyResults", k, "Edit key result")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      className="text-button"
                      onClick={() =>
                        setEditing({
                          collection: "keyResults",
                          record: {
                            ...newRecord("keyResults", data),
                            objectiveId: o.id,
                          } as RecordValue,
                          create: true,
                        })
                      }
                    >
                      <Plus size={15} />
                      Add key result
                    </button>
                  </section>
                );
              })}
              {!data.objectives.length && (
                <Empty>Add your first strategic objective.</Empty>
              )}
            </>
          )}
          {page === "Target picture" && (
            <>
              <div className="canvas-toolbar">
                <div className="segmented">
                  {["Operating model", "Value stream", "All layers"].map(
                    (layer) => (
                      <button
                        key={layer}
                        className={canvasLayer === layer ? "selected" : ""}
                        onClick={() => setCanvasLayer(layer)}
                      >
                        {layer}
                      </button>
                    ),
                  )}
                </div>
                <span className="muted">
                  Drag to arrange · Double-click to edit · Connect handles
                </span>
                <button
                  onClick={() => edit("edges")}
                  disabled={data.nodes.length < 2}
                >
                  <Plus size={15} />
                  Connection
                </button>
              </div>
              <TargetCanvas
                key={canvasLayer}
                data={canvasData}
                busy={busy}
                onEdit={(n) => edit("nodes", n)}
                onMove={(n) => save("nodes", n)}
                onConnect={(e) => save("edges", e, true).catch(() => {})}
                onEdge={(e) => edit("edges", e)}
              />
              <div className="section-heading beneath">
                <h2>From current state to target state</h2>
                <span className="muted">
                  {visibleNodes.length} elements · {visibleEdges.length}{" "}
                  connections
                </span>
              </div>
              <div className="target-list">
                {visibleNodes.map((n) => (
                  <article className="card" key={n.id}>
                    <div className="section-heading">
                      <span className="quiet-badge">{n.category}</span>
                      {editButton("nodes", n, "Edit target element")}
                    </div>
                    <h3>{n.label}</h3>
                    <div className="from-to">
                      <div>
                        <span>FROM</span>
                        <p>{n.currentState || "Current state to be defined"}</p>
                      </div>
                      <ArrowRight size={17} />
                      <div>
                        <span>TO</span>
                        <p>{n.targetState || "Target state to be defined"}</p>
                      </div>
                    </div>
                    <small>
                      {n.mode} · {n.owner || "Owner to be assigned"}
                    </small>
                  </article>
                ))}
              </div>
              {!visibleNodes.length && (
                <Empty>Add an element to start designing.</Empty>
              )}
            </>
          )}
          {page === "Skill catalog" && (
            <>
              {filters}
              <section className="card catalog-table">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Skill / definition</th>
                        <th>Family</th>
                        <th>Relevance</th>
                        <th>Impact</th>
                        <th>Upskilling</th>
                        <th>Horizon</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {skills.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <button
                              className="skill-name"
                              onClick={() => edit("skills", s)}
                            >
                              {s.name}
                            </button>
                            <p className="skill-definition">{s.definition}</p>
                          </td>
                          <td>
                            <span className="family-tag">
                              {s.family.replace("AI ", "")}
                            </span>
                          </td>
                          <td>
                            <span className="score-dot">{s.relevance}</span>
                          </td>
                          <td>
                            <span className="score-dot">{s.impact}</span>
                          </td>
                          <td>
                            <span className="score-dot warm">
                              {s.upskilling}
                            </span>
                          </td>
                          <td>{s.horizon}</td>
                          <td>
                            <span
                              className={"status " + s.status.toLowerCase()}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td>{editButton("skills", s, "Edit " + s.name)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!skills.length && (
                  <Empty>No skills match these filters.</Empty>
                )}
              </section>
            </>
          )}
          {page === "Skill heatmap" && (
            <>
              {filters}
              <div className="heat-toolbar">
                <div className="segmented">
                  {["Target", "Current", "Gap", "Priority portfolio"].map(
                    (m) => (
                      <button
                        key={m}
                        className={heatMode === m ? "selected" : ""}
                        onClick={() => setHeatMode(m)}
                      >
                        {m}
                      </button>
                    ),
                  )}
                </div>
                <button onClick={() => edit("assessments")}>
                  <Plus size={16} />
                  Role skill
                </button>
              </div>
              {heatMode === "Priority portfolio" ? (
                <section className="card">
                  <h2>Relevance × value-stream impact</h2>
                  <p className="muted">
                    Bubble size indicates upskilling need. Scores are working
                    proposals on a 1–5 scale.
                  </p>
                  <div style={{ height: 440 }}>
                    <ResponsiveContainer>
                      <ScatterChart
                        margin={{ top: 30, right: 35, bottom: 30, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="4 5" stroke="#dfe4dc" />
                        <XAxis
                          type="number"
                          dataKey="relevance"
                          domain={[0, 5.5]}
                          ticks={[1, 2, 3, 4, 5]}
                          name="Future relevance"
                          label={{
                            value: "Future relevance",
                            position: "insideBottom",
                            offset: -15,
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="impact"
                          domain={[0, 5.5]}
                          ticks={[1, 2, 3, 4, 5]}
                          name="Value-stream impact"
                        />
                        <ZAxis
                          type="number"
                          dataKey="upskilling"
                          range={[80, 420]}
                          name="Upskilling need"
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          content={({ payload }) =>
                            payload?.[0] ? (
                              <div className="chart-tooltip">
                                <strong>{payload[0].payload.name}</strong>
                                <p>
                                  Relevance {payload[0].payload.relevance} ·
                                  Impact {payload[0].payload.impact} ·
                                  Upskilling {payload[0].payload.upskilling}
                                </p>
                              </div>
                            ) : null
                          }
                        />
                        {families.map((f, i) => (
                          <Scatter
                            key={f}
                            name={f}
                            data={skills.filter((s) => s.family === f)}
                            fill={colors[i % 6]}
                            fillOpacity={0.6}
                            onClick={(s) =>
                              edit("skills", s as unknown as RecordValue)
                            }
                          />
                        ))}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="method-note">
                    Skills with the same scores overlap. Use the catalog for
                    individual values and definitions.
                  </p>
                </section>
              ) : (
                <section className="card heatmap-card">
                  <div className="heat-legend">
                    <strong>{heatMode} proficiency</strong>
                    {(heatMode === "Gap" ? [0, 1, 2, 3] : [1, 2, 3, 4]).map(
                      (n) => (
                        <span key={n}>
                          <i
                            className={`heat-cell ${heatMode === "Gap" ? "gap-" : "level-"}${n}`}
                          />
                          {n}
                          {heatMode === "Gap"
                            ? " level gap"
                            : [
                                "",
                                " Guided",
                                " Proficient",
                                " Advanced",
                                " Expert",
                              ][n]}
                        </span>
                      ),
                    )}
                    <span>
                      <i className="heat-cell unknown" />
                      Unassessed
                    </span>
                    <span>
                      <i className="heat-cell not-mapped" />
                      Not mapped
                    </span>
                  </div>
                  <div className="table-wrap heat-scroll">
                    <table className="heat-table">
                      <thead>
                        <tr>
                          <th>AI skill</th>
                          {data.roles.map((r) => (
                            <th key={r.id} title={r.name}>
                              {r.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {skills.map((s) => (
                          <tr key={s.id}>
                            <th>
                              {s.name}
                              <small>{s.family.replace("AI ", "")}</small>
                            </th>
                            {data.roles.map((r) => {
                              const a = data.assessments.find(
                                (a) => a.skillId === s.id && a.roleId === r.id,
                              );
                              const v = a
                                ? heatMode === "Target"
                                  ? a.target
                                  : heatMode === "Current"
                                    ? a.current
                                    : gap(a)
                                : null;
                              return (
                                <td key={r.id}>
                                  <button
                                    aria-label={`${s.name}, ${r.name}: ${a ? (v === null ? "unassessed" : heatMode + " " + v) : "not mapped"}`}
                                    title={
                                      a
                                        ? `Current: ${a.current ?? "Unassessed"} · Target: ${a.target}`
                                        : "Add role skill"
                                    }
                                    className={
                                      "heat-cell " +
                                      (!a
                                        ? "not-mapped"
                                        : v === null
                                          ? "unknown"
                                          : `${heatMode === "Gap" ? "gap-" : "level-"}${v}`)
                                    }
                                    onClick={() =>
                                      a
                                        ? edit("assessments", a)
                                        : setEditing({
                                            collection: "assessments",
                                            record: {
                                              ...newRecord("assessments", data),
                                              roleId: r.id,
                                              skillId: s.id,
                                            } as Assessment,
                                            create: true,
                                          })
                                    }
                                  >
                                    {a ? (v === null ? "?" : v) : "+"}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
          {page === "Role profiles" && (
            <div className="role-grid">
              {data.roles.map((r) => {
                const targets = data.assessments.filter(
                  (a) => a.roleId === r.id,
                );
                return (
                  <section className="card role-card" key={r.id}>
                    <div className="section-heading">
                      <span className="role-icon">
                        <Users size={20} />
                      </span>
                      {editButton("roles", r, "Edit role")}
                    </div>
                    <h2>{r.name}</h2>
                    <span className="quiet-badge">{r.workMode}</span>
                    <p>{r.accountability}</p>
                    <div className="role-skills">
                      {targets.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => edit("assessments", a)}
                        >
                          <span>
                            {data.skills.find((s) => s.id === a.skillId)
                              ?.name || "Unknown skill"}
                          </span>
                          <strong>
                            {a.current ?? "—"}
                            <span>/ {a.target}</span>
                          </strong>
                        </button>
                      ))}
                    </div>
                    <footer>
                      <small>
                        Current / Target ·{" "}
                        {targets.filter((a) => a.current !== null).length}/
                        {targets.length} assessed
                      </small>
                      <button
                        className="text-button"
                        onClick={() =>
                          setEditing({
                            collection: "assessments",
                            record: {
                              ...newRecord("assessments", data),
                              roleId: r.id,
                            } as Assessment,
                            create: true,
                          })
                        }
                      >
                        <Plus size={15} />
                        Skill
                      </button>
                    </footer>
                  </section>
                );
              })}
              {!data.roles.length && (
                <Empty>Add a role to define its AI capability profile.</Empty>
              )}
            </div>
          )}
          {page === "Activity" && (
            <section className="card">
              {data.audit.length ? (
                data.audit.map((a) => (
                  <div className="activity-row" key={a.id}>
                    <span className="activity-dot" />
                    <div>
                      <strong>{a.label}</strong>
                      <small>
                        {a.action} · {a.collection} · Team workspace
                      </small>
                    </div>
                    <time>{new Date(a.at).toLocaleString()}</time>
                  </div>
                ))
              ) : (
                <Empty>Your saved changes will appear here.</Empty>
              )}
              <p className="muted">
                Shared-password access identifies the team, not individual
                contributors.
              </p>
            </section>
          )}
          <footer className="content-footer">
            <span>AI Vision Studio · Value Stream</span>
            <span>Revision {snapshot.revision} · Shared data</span>
          </footer>
        </main>
      </div>
      <button
        className="chat-launcher"
        aria-label="Open strategy assistant"
        onClick={() => setChat(!chat)}
      >
        <MessageSquare size={20} />
        <span>Strategy assistant</span>
      </button>
      {chat && (
        <aside className="chat-panel">
          <header>
            <div>
              <Sparkles size={18} />
              <strong>Strategy assistant</strong>
            </div>
            <button
              className="icon-button"
              aria-label="Close assistant"
              onClick={() => setChat(false)}
            >
              <X size={18} />
            </button>
          </header>
          <div className="chat-content">
            <div className="chat-message assistant">
              Explore your strategy, challenge an OKR or identify capability
              gaps. Suggestions remain drafts until you apply them in the
              workspace.
            </div>
            {chatMessages.map((m, i) => (
              <div key={i} className={"chat-message " + m.role}>
                {m.text}
              </div>
            ))}
            {chatBusy && <p className="muted">Thinking…</p>}
          </div>
          <form onSubmit={sendChat}>
            <input
              aria-label="Message strategy assistant"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your strategy…"
              maxLength={3000}
            />
            <button
              className="primary"
              disabled={chatBusy || !chatInput.trim()}
              aria-label="Send message"
            >
              <ArrowRight size={18} />
            </button>
          </form>
        </aside>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {editing && (
        <Editor
          key={editing.record.id}
          {...editing}
          data={data}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={async (r) => {
            await save(editing.collection, r, editing.create);
            setEditing(null);
          }}
          onDelete={async () => {
            setBusy(true);
            try {
              setSnapshot(
                await api.remove(
                  editing.collection,
                  editing.record.id,
                  snapshot.revision,
                ),
              );
              setEditing(null);
              setNotice("Record deleted");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}
