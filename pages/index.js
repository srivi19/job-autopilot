// pages/index.js — Landing Page
import { useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Landing() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const canvasRef = useRef(null);

  // If already signed in, go straight to the app
  useEffect(() => {
    if (status === "authenticated") router.push("/app");
  }, [status, router]);

  // Animated node graph background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let w, h;
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const nodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * 1200, y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.5 + 1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,70,210,${0.12 * (1 - dist / 180)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99,70,210,0.25)"; ctx.fill();
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <>
      <Head>
        <title>Job Autopilot — AI-powered job applications</title>
        <meta name="description" content="Paste a LinkedIn URL. Get a scored cover letter, Gmail draft, and calendar reminders — automatically." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#0a0812", minHeight: "100vh", color: "#fff", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />
        <div style={{ position: "fixed", top: "-200px", left: "-100px", width: "600px", height: "600px", background: "radial-gradient(circle,rgba(99,70,210,0.18) 0%,transparent 70%)", zIndex: 0, pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: "-150px", right: "-100px", width: "500px", height: "500px", background: "radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Nav */}
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#6346d2,#3b82f6)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>⚡</div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", letterSpacing: "-0.02em" }}>Job Autopilot</span>
            </div>
            <button
<<<<<<< HEAD
              onClick={() => signIn("google", { callbackUrl: "/app" })}
=======
              onClick={() => signIn("google", { callbackUrl: `${window.location.origin}/app` })}
>>>>>>> dc35a031ee47cb98c22c55c2a22bcbfc23298e1c
              disabled={status === "loading"}
              style={{ padding: "9px 20px", background: "linear-gradient(135deg,#6346d2,#3b82f6)", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "#fff", border: "none", cursor: "pointer" }}
            >
              {status === "loading" ? "Loading..." : "Sign in with Google →"}
            </button>
          </nav>

          {/* Hero */}
          <section style={{ maxWidth: "900px", margin: "0 auto", padding: "100px 48px 80px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(99,70,210,0.12)", border: "0.5px solid rgba(99,70,210,0.35)", borderRadius: "20px", padding: "6px 14px", marginBottom: "36px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c5ce8", display: "inline-block" }}></span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>AIRIA HACKATHON 2026</span>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(42px,7vw,80px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "28px", background: "linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.5))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Apply smarter.<br />Not harder.
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 48px", fontWeight: 300 }}>
              Paste a LinkedIn job URL and your resume. Claude scores your fit, writes a tailored cover letter, saves it to Gmail, and blocks time on your calendar — in seconds.
            </p>
            <button
<<<<<<< HEAD
              onClick={() => signIn("google", { callbackUrl: "/app" })}
=======
              onClick={() => signIn("google", { callbackUrl: `${window.location.origin}/app` })}
>>>>>>> dc35a031ee47cb98c22c55c2a22bcbfc23298e1c
              style={{ padding: "14px 36px", background: "linear-gradient(135deg,#6346d2,#3b82f6)", borderRadius: "10px", fontSize: "15px", fontWeight: 500, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 0 40px rgba(99,70,210,0.35)" }}
            >
              Get started with Google →
            </button>
            <p style={{ marginTop: "12px", fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>
              Requires Gmail + Google Calendar access
            </p>
          </section>

          {/* Kanban preview */}
          <section style={{ maxWidth: "820px", margin: "0 auto 100px", padding: "0 48px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
                {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "20px", marginLeft: "8px" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
                {[
                  { col: "To Apply", dot: "#6346d2", cards: [{ co: "Linear", r: "Eng II", s: 91 }] },
                  { col: "Applied", dot: "#3b82f6", cards: [{ co: "Stripe", r: "Sr. Frontend", s: 87 }] },
                  { col: "Following Up", dot: "#f59e0b", cards: [{ co: "Notion", r: "Prod Eng", s: 72 }] },
                  { col: "Closed", dot: "#6b7280", cards: [] },
                ].map((c) => (
                  <div key={c.col}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.dot }} />
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.col}</span>
                    </div>
                    {c.cards.map((card, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "2px" }}>{card.co}</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>{card.r}</div>
                        <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: card.s >= 80 ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)", color: card.s >= 80 ? "#4ade80" : "#fbbf24" }}>{card.s}% fit</span>
                      </div>
                    ))}
                    {c.cards.length === 0 && <div style={{ border: "0.5px dashed rgba(255,255,255,0.08)", borderRadius: "8px", padding: "20px", textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.15)" }}>Empty</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features */}
          <section style={{ maxWidth: "900px", margin: "0 auto 80px", padding: "0 48px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
              {[
                { icon: "🔍", title: "Scrapes the JD", desc: "Reads the live job description from LinkedIn using web search" },
                { icon: "📊", title: "Scores your fit", desc: "0–100 fit score with specific skill gaps identified" },
                { icon: "✍️", title: "Writes cover letter", desc: "Tailored 3-paragraph letter saved to your Gmail drafts" },
                { icon: "📅", title: "Books your calendar", desc: "Apply + follow-up events created in Google Calendar" },
              ].map((f) => (
                <div key={f.title} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "24px" }}>
                  <div style={{ fontSize: "24px", marginBottom: "12px" }}>{f.icon}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>{f.title}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Powered by */}
          <section style={{ textAlign: "center", padding: "0 48px 80px" }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>Powered by</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              {["Claude Sonnet","Gmail MCP","Google Calendar MCP","Web Search","Railway"].map((t) => (
                <span key={t} style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: "20px" }}>{t}</span>
              ))}
            </div>
          </section>

          <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>Job Autopilot</span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>Airia Hackathon 2026 · srivi19</span>
          </footer>
        </div>
      </div>
    </>
  );
}
