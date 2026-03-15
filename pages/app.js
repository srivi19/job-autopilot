// pages/app.js — Main Kanban Dashboard (requires Google sign-in)

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Head from "next/head";

const COLUMNS = ["To Apply", "Applied", "Following Up", "Closed"];

const COL_DOT = {
  "To Apply": "bg-violet-500",
  Applied: "bg-blue-500",
  "Following Up": "bg-amber-500",
  Closed: "bg-gray-400",
};

const scoreColor = (s) =>
  s >= 80
    ? "text-green-700 bg-green-50"
    : s >= 60
    ? "text-amber-700 bg-amber-50"
    : "text-red-700 bg-red-50";

const scoreBarColor = (s) =>
  s >= 80 ? "bg-green-500" : s >= 60 ? "bg-amber-500" : "bg-red-400";

const scoreTextColor = (s) =>
  s >= 80 ? "text-green-600" : s >= 60 ? "text-amber-500" : "text-red-500";

const STEPS = [
  "Scraping job description...",
  "Analyzing your resume...",
  "Matching skills & scoring fit...",
  "Drafting cover letter...",
  "Saving to Gmail drafts...",
  "Creating calendar reminders...",
];

const SAMPLE_APPS = [
  {
    id: 1,
    company: "Stripe",
    role: "Senior Frontend Engineer",
    fitScore: 87,
    status: "Applied",
    date: "Mar 10",
    followUpDate: "Mar 17",
    coverLetter:
      "Dear Stripe Hiring Team,\n\nI'm excited to apply for the Senior Frontend Engineer role at Stripe. With 5+ years building high-performance web applications in React and TypeScript, I am confident I can contribute meaningfully to Stripe's mission.\n\nMy experience with performance optimization and complex UI systems maps directly to your team's needs. I have shipped production applications used by hundreds of thousands of users and deeply understand the reliability bar you require.\n\nI would love the chance to discuss how my background aligns with your goals. Thank you for your consideration.\n\nBest regards",
    gaps: ["Payments domain knowledge", "Rust experience"],
    fitReasons: ["Strong React/TypeScript", "Performance optimization experience", "Large-scale UI systems"],
    gmailDraftId: "draft_example_1",
    calendarEventId: "event_example_1",
  },
  {
    id: 2,
    company: "Notion",
    role: "Product Engineer",
    fitScore: 72,
    status: "Following Up",
    date: "Mar 7",
    followUpDate: "Mar 14",
    coverLetter:
      "Dear Notion Team,\n\nAs a daily Notion user for three years, applying for this Product Engineer role feels especially exciting. My background in building collaborative tools aligns well with what your team values.\n\nI have experience shipping full-stack features in tight product cycles and working closely with design and PM. I care deeply about the intersection of engineering quality and user experience.\n\nI would love to chat more. Looking forward to connecting.\n\nBest regards",
    gaps: ["Design systems depth", "Advanced TypeScript patterns"],
    fitReasons: ["Collaborative tools experience", "Full-stack background", "Product mindset"],
    gmailDraftId: null,
    calendarEventId: null,
  },
];

export default function App() {
  const { data: session } = useSession();
  const [apps, setApps] = useState(SAMPLE_APPS);
  const [view, setView] = useState("board");
  const [selected, setSelected] = useState(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(-1);
  const [error, setError] = useState("");

  const simulateSteps = () => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) break;
        setLoadStep(i);
        await new Promise((r) => setTimeout(r, 1200));
      }
    })();
    return () => { cancelled = true; };
  };

  const runAgent = async () => {
    if (!linkedinUrl || !resume) return;
    setLoading(true);
    setError("");
    const cancelSteps = simulateSteps();

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl, resume }),
      });

      cancelSteps();

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || "Agent failed");
      }

      const data = await res.json();

      const newApp = {
        id: Date.now(),
        company: data.company || "Company",
        role: data.role || "Role",
        fitScore: data.fitScore || 75,
        status: "To Apply",
        date: data.applyDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        followUpDate: data.followUpDate || "",
        coverLetter: data.coverLetter || "",
        gaps: data.gaps || [],
        fitReasons: data.fitReasons || [],
        gmailDraftId: data.gmailDraftId || null,
        calendarEventId: data.calendarEventId || null,
      };

      setApps((prev) => [newApp, ...prev]);
      setSelected(newApp);
      setView("board");
      setLinkedinUrl("");
      setResume("");
    } catch (err) {
      cancelSteps();
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setLoadStep(-1);
    }
  };

  const moveCard = (id, newStatus) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    setSelected((prev) => (prev?.id === id ? { ...prev, status: newStatus } : prev));
  };

  const totalApps = apps.length;
  const avgScore = totalApps ? Math.round(apps.reduce((s, a) => s + a.fitScore, 0) / totalApps) : 0;
  const activeApps = apps.filter((a) => a.status !== "Closed").length;

  return (
    <>
      <Head>
        <title>Job Autopilot — Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">⚡</div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Job Autopilot</div>
              <div className="text-xs text-gray-400">Claude + Gmail + Google Calendar</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats pills */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">{totalApps} total</span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{activeApps} active</span>
              <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">{avgScore}% avg fit</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setView("board")}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  view === "board"
                    ? "bg-gray-100 border-gray-300 text-gray-800"
                    : "border-transparent text-gray-500 hover:bg-gray-50"
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setView("add")}
                className="px-3 py-1.5 rounded-lg text-sm bg-violet-600 text-white hover:bg-violet-700 transition"
              >
                + New
              </button>
            </div>

            {/* User avatar */}
            {session?.user && (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
                {session.user.image && (
                  <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6">

          {/* ── Add Application Form ── */}
          {view === "add" && (
            <div className="max-w-lg mx-auto">
              <h1 className="text-xl font-semibold text-gray-900 mb-1">New application</h1>
              <p className="text-sm text-gray-400 mb-6">
                Paste a LinkedIn job URL and your resume. Claude will score your fit, write a cover letter, save it to Gmail, and add calendar reminders.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  LinkedIn job URL
                </label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  Your resume (paste as text)
                </label>
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  rows={10}
                  placeholder="Paste your resume text here..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-y bg-white"
                />
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={runAgent}
                disabled={loading || !linkedinUrl || !resume}
                className="w-full py-3 rounded-lg bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 disabled:opacity-40 disabled:cursor-default transition"
              >
                {loading ? "Running agent..." : "Run agent →"}
              </button>

              {/* Step progress */}
              {loading && (
                <div className="mt-4 bg-white border border-gray-100 rounded-xl p-4">
                  {STEPS.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 py-1 text-sm transition-colors ${
                        i < loadStep
                          ? "text-green-500"
                          : i === loadStep
                          ? "text-violet-600 font-medium"
                          : "text-gray-200"
                      }`}
                    >
                      <span className="text-xs w-4">{i < loadStep ? "✓" : i === loadStep ? "▶" : "○"}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Kanban Board ── */}
          {view === "board" && (
            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
              {COLUMNS.map((col) => {
                const cards = apps.filter((a) => a.status === col);
                return (
                  <div key={col} className="min-w-[230px] flex-1">
                    {/* Column header */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${COL_DOT[col]}`} />
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex-1">{col}</span>
                      <span className="text-xs text-gray-300 bg-gray-100 rounded-full px-1.5">{cards.length}</span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {cards.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => setSelected(app)}
                          className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-violet-200 hover:shadow-sm transition-all"
                        >
                          <div className="font-semibold text-gray-900 text-sm mb-0.5">{app.company}</div>
                          <div className="text-xs text-gray-400 mb-3 truncate">{app.role}</div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreColor(app.fitScore)}`}>
                              {app.fitScore}% fit
                            </span>
                            <span className="text-xs text-gray-300">{app.date}</span>
                          </div>
                          {/* Mini status indicators */}
                          <div className="flex gap-1.5 mt-2.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${app.gmailDraftId ? "bg-blue-50 text-blue-500" : "bg-gray-50 text-gray-300"}`}>
                              Gmail {app.gmailDraftId ? "✓" : "—"}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${app.calendarEventId ? "bg-green-50 text-green-500" : "bg-gray-50 text-gray-300"}`}>
                              Calendar {app.calendarEventId ? "✓" : "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {cards.length === 0 && (
                        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-300">
                          No applications
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── Detail Drawer ── */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/40 flex items-start justify-end z-50"
            style={{ paddingTop: "56px" }}
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto p-6 flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selected.company}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{selected.role}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-300 hover:text-gray-500 text-2xl leading-none transition"
                >
                  ×
                </button>
              </div>

              {/* Fit score */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Fit score</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-3xl font-bold ${scoreTextColor(selected.fitScore)}`}>
                    {selected.fitScore}%
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${scoreBarColor(selected.fitScore)}`}
                      style={{ width: `${selected.fitScore}%` }}
                    />
                  </div>
                </div>
                {selected.fitReasons?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-400 mb-1.5">Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.fitReasons.map((r, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.gaps?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Skill gaps</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.gaps.map((g, i) => (
                        <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{g}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cover letter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cover letter</p>
                  {selected.gmailDraftId
                    ? <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Saved to Gmail ✓</span>
                    : <span className="text-xs text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">Not saved</span>
                  }
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
                  {selected.coverLetter || "No cover letter generated."}
                </div>
              </div>

              {/* Calendar events */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Calendar events</p>
                  {selected.calendarEventId
                    ? <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Created ✓</span>
                    : <span className="text-xs text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">Not created</span>
                  }
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                    Apply: {selected.date}
                  </span>
                  <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
                    Follow up: {selected.followUpDate || "+7 days"}
                  </span>
                </div>
              </div>

              {/* Move to */}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Move to column</p>
                <div className="flex flex-wrap gap-2">
                  {COLUMNS.filter((c) => c !== selected.status).map((col) => (
                    <button
                      key={col}
                      onClick={() => moveCard(selected.id, col)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <div className="pt-2 border-t border-gray-100 mt-auto">
                <button
                  onClick={() => {
                    setApps((prev) => prev.filter((a) => a.id !== selected.id));
                    setSelected(null);
                  }}
                  className="text-xs text-red-400 hover:text-red-600 transition"
                >
                  Remove application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
