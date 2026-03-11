import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:5000/api/agent";

const STEP_ICONS = {
  thinking:    "🧠",
  tool_call:   "⚡",
  tool_result: "📦",
  answer:      "✅",
  error:       "❌",
};

const STEP_COLORS = {
  thinking:    { bg: "#1a1f2e", border: "#3b4a6b", label: "#7b9cff" },
  tool_call:   { bg: "#1a2a1a", border: "#3b6b3b", label: "#7bff9c" },
  tool_result: { bg: "#2a1a2a", border: "#6b3b6b", label: "#ff9cff" },
  answer:      { bg: "#1a2a1a", border: "#4bbb4b", label: "#4bff4b" },
  error:       { bg: "#2a1a1a", border: "#6b3b3b", label: "#ff7b7b" },
};

const STEP_LABELS = {
  thinking:    "AGENT THINKING",
  tool_call:   "TOOL CALL",
  tool_result: "TOOL RESULT",
  answer:      "FINAL ANSWER",
  error:       "ERROR",
};

export default function App() {
  const [product, setProduct]   = useState("");
  const [steps, setSteps]       = useState([]);
  const [report, setReport]     = useState(null);
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  const handleSearch = async () => {
    if (!product.trim() || running) return;
    setSteps([]);
    setReport(null);
    setDone(false);
    setRunning(true);

    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") { setDone(true); break; }
          try {
            const step = JSON.parse(payload);
            setSteps(prev => [...prev, step]);
            if (step.type === "answer" && step.data) {
              setReport(step.data);
            }
          } catch {}
        }
      }
    } catch (err) {
      setSteps(prev => [...prev, { type: "error", message: err.message }]);
    } finally {
      setRunning(false);
      setDone(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleReset = () => {
    setSteps([]);
    setReport(null);
    setDone(false);
    setProduct("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div style={styles.root}>
      {/* Noise overlay */}
      <div style={styles.noise} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🛒</span>
            <div>
              <div style={styles.logoTitle}>PRICE HUNTER</div>
              <div style={styles.logoSub}>Agentic AI · Built with Claude + C# .NET</div>
            </div>
          </div>
          <div style={styles.badge}>LIVE DEMO</div>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main}>

        {/* Search box */}
        <section style={styles.searchSection}>
          <p style={styles.tagline}>
            Drop a product name. Watch the AI agent hunt across stores,<br />
            compare prices, find coupons — all in real time.
          </p>
          <div style={styles.searchRow}>
            <input
              ref={inputRef}
              style={styles.input}
              value={product}
              onChange={e => setProduct(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Sony WH-1000XM5 headphones"
              disabled={running}
              autoFocus
            />
            <button
              style={{ ...styles.btn, ...(running ? styles.btnDisabled : {}) }}
              onClick={handleSearch}
              disabled={running}
            >
              {running ? <><Spinner /> HUNTING...</> : "HUNT PRICES →"}
            </button>
          </div>

          {/* Quick examples */}
          {!running && !steps.length && (
            <div style={styles.examples}>
              {["Sony WH-1000XM5", "MacBook Air M3", "iPhone 16 Pro", "Nintendo Switch 2"].map(ex => (
                <button
                  key={ex}
                  style={styles.exampleChip}
                  onClick={() => { setProduct(ex); setTimeout(handleSearch, 50); }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Agent steps live feed */}
        {steps.length > 0 && (
          <section style={styles.stepsSection}>
            <div style={styles.stepsHeader}>
              <span style={styles.stepsTitle}>AGENT ACTIVITY LOG</span>
              {running && <PulseDot />}
            </div>
            <div style={styles.stepsList}>
              {steps.map((step, i) => (
                <StepCard key={i} step={step} index={i} />
              ))}
              <div ref={bottomRef} />
            </div>
          </section>
        )}

        {/* Price report */}
        {report && <PriceReportCard report={report} />}

        {/* Reset */}
        {done && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button style={styles.resetBtn} onClick={handleReset}>
              ↺ Search Another Product
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>Built by <strong>Talal Khan</strong> · </span>
        <a href="https://github.com/mrtalalkhan/price-hunter-agent" style={styles.link} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        <span> · </span>
        <a href="https://linkedin.com/in/mrtalalkhan" style={styles.link} target="_blank" rel="noreferrer">
          LinkedIn ↗
        </a>
      </footer>
    </div>
  );
}

// ── Step Card ─────────────────────────────────────────────────────────────────
function StepCard({ step, index }) {
  const colors = STEP_COLORS[step.type] || STEP_COLORS.thinking;
  const label  = STEP_LABELS[step.type] || step.type.toUpperCase();
  const icon   = STEP_ICONS[step.type]  || "•";

  return (
    <div style={{
      ...styles.stepCard,
      background:   colors.bg,
      borderColor:  colors.border,
      animationDelay: `${index * 0.05}s`,
    }}>
      <div style={styles.stepMeta}>
        <span style={{ ...styles.stepLabel, color: colors.label }}>
          {icon} {label}
        </span>
        <span style={styles.stepNum}>#{index + 1}</span>
      </div>
      <div style={styles.stepMessage}>
        {step.message}
      </div>
    </div>
  );
}

// ── Price Report Card ─────────────────────────────────────────────────────────
function PriceReportCard({ report }) {
  const rec      = report.recommendation;
  const recColor = rec === "BUY_NOW" ? "#4bff4b" : rec === "WAIT" ? "#ffbb4b" : "#7b9cff";
  const recLabel = rec === "BUY_NOW" ? "✅ BUY NOW" : rec === "WAIT" ? "⏳ WAIT FOR SALE" : "🔍 COMPARE MORE";

  // Render inline markdown: **bold**, [link](url), __underline__
  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\)]+\)|__[^_]+__)/g);
    return parts.map((part, j) => {
      const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+)\)$/);
      if (linkMatch) return (
        <a key={j} href={linkMatch[2]} target="_blank" rel="noreferrer"
          style={{ color: "#7b9cff", textDecoration: "underline" }}>
          {linkMatch[1]}
        </a>
      );
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) return (
        <strong key={j} style={{ color: "#e0e6f0" }}>{boldMatch[1]}</strong>
      );
      const underlineMatch = part.match(/^__([^_]+)__$/);
      if (underlineMatch) return (
        <span key={j} style={{ color: "#7b9cff", textDecoration: "underline" }}>{underlineMatch[1]}</span>
      );
      return <span key={j}>{part}</span>;
    });
  };

  // Render full markdown block
  const renderMarkdown = (text) =>
    (text || "").split("\n").map((line, i) => {
      if (line.startsWith("### ")) return (
        <div key={i} style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginTop: 20, marginBottom: 6, letterSpacing: "0.05em" }}>
          {renderInline(line.replace(/^### /, ""))}
        </div>
      );
      if (line.startsWith("## ")) return (
        <div key={i} style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginTop: 20, marginBottom: 6 }}>
          {renderInline(line.replace(/^## /, ""))}
        </div>
      );
      if (line.startsWith("# ")) return (
        <div key={i} style={{ color: "#fff", fontWeight: 700, fontSize: 19, marginTop: 20, marginBottom: 8 }}>
          {renderInline(line.replace(/^# /, ""))}
        </div>
      );
      // Nested list item (2+ leading spaces before - or *)
      if (line.match(/^\s{2,}[-*] /)) return (
        <div key={i} style={{ paddingLeft: 32, marginBottom: 3, color: "#8090b0", fontSize: 13, lineHeight: 1.6 }}>
          {"· "}{renderInline(line.replace(/^\s+[-*] /, ""))}
        </div>
      );
      // Top-level list item
      if (line.match(/^[-*] /) || line.match(/^\d+\. /)) return (
        <div key={i} style={{ paddingLeft: 16, marginBottom: 5, color: "#b0c0d8", fontSize: 13, lineHeight: 1.6 }}>
          {"▸ "}{renderInline(line.replace(/^[-*] /, "").replace(/^\d+\. /, ""))}
        </div>
      );
      // Empty line = spacer
      if (!line.trim()) return <div key={i} style={{ height: 10 }} />;
      // Normal line
      return (
        <div key={i} style={{ marginBottom: 4, color: "#b0c0d8", fontSize: 13, lineHeight: 1.7 }}>
          {renderInline(line)}
        </div>
      );
    });

  return (
    <section style={styles.report}>
      <div style={styles.reportHeader}>
        <span style={styles.reportTitle}>PRICE REPORT</span>
        <span style={{ ...styles.recBadge, color: recColor, borderColor: recColor }}>
          {recLabel}
        </span>
      </div>

      <div style={styles.reportProduct}>{report.product}</div>

      {/* Rendered markdown answer with real links */}
      <div style={styles.agentAnswer}>
        {renderMarkdown(report.recommendationReason)}
      </div>

      <div style={styles.searchedAt}>
        Searched at {new Date(report.searchedAt).toLocaleTimeString()}
      </div>
    </section>
  );
}

// ── Tiny components ───────────────────────────────────────────────────────────
function Spinner() {
  return <span style={styles.spinner}>⟳ </span>;
}

function PulseDot() {
  return <span style={styles.pulseDot} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0d14",
    color: "#e0e6f0",
    fontFamily: "'Space Mono', 'Courier New', monospace",
    position: "relative",
    overflowX: "hidden",
  },
  noise: {
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
    opacity: 0.4,
  },
  header: {
    position: "relative", zIndex: 1,
    borderBottom: "1px solid #1e2535",
    background: "rgba(10,13,20,0.95)",
    backdropFilter: "blur(12px)",
  },
  headerInner: {
    maxWidth: 900, margin: "0 auto", padding: "18px 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 14 },
  logoIcon: { fontSize: 32 },
  logoTitle: {
    fontSize: 20, fontWeight: 700, letterSpacing: "0.12em", color: "#fff",
  },
  logoSub: { fontSize: 11, color: "#4a5a7a", letterSpacing: "0.08em", marginTop: 2 },
  badge: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.15em",
    padding: "4px 10px", borderRadius: 4,
    border: "1px solid #ff6b35", color: "#ff6b35",
    background: "rgba(255,107,53,0.08)",
  },
  main: {
    position: "relative", zIndex: 1,
    maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px",
  },
  searchSection: { marginBottom: 40 },
  tagline: {
    fontSize: 15, lineHeight: 1.7, color: "#8090b0",
    marginBottom: 28, textAlign: "center",
  },
  searchRow: { display: "flex", gap: 12, marginBottom: 20 },
  input: {
    flex: 1, padding: "14px 18px",
    background: "#111620", border: "1px solid #2a3550",
    borderRadius: 8, color: "#e0e6f0",
    fontFamily: "inherit", fontSize: 15,
    outline: "none", transition: "border 0.2s",
  },
  btn: {
    padding: "14px 24px",
    background: "#ff6b35", border: "none", borderRadius: 8,
    color: "#fff", fontFamily: "inherit",
    fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
    cursor: "pointer", whiteSpace: "nowrap",
    display: "flex", alignItems: "center", gap: 6,
    transition: "background 0.2s, transform 0.1s",
  },
  btnDisabled: { background: "#4a3020", cursor: "not-allowed" },
  examples: { display: "flex", gap: 8, flexWrap: "wrap" },
  exampleChip: {
    padding: "6px 14px",
    background: "transparent", border: "1px solid #2a3550",
    borderRadius: 20, color: "#6a7a9a",
    fontFamily: "inherit", fontSize: 12, cursor: "pointer",
    transition: "all 0.2s",
  },
  stepsSection: { marginBottom: 40 },
  stepsHeader: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#4a5a7a",
  },
  stepsList: { display: "flex", flexDirection: "column", gap: 8 },
  stepCard: {
    padding: "14px 18px", borderRadius: 8,
    border: "1px solid",
    animation: "fadeSlideIn 0.3s ease both",
  },
  stepMeta: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  stepLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" },
  stepNum:   { fontSize: 11, color: "#3a4a6a" },
  stepMessage: {
    fontSize: 13, lineHeight: 1.6, color: "#b0c0d8",
    whiteSpace: "pre-wrap", wordBreak: "break-word",
  },
  report: {
    background: "#0f1420", border: "1px solid #2a3a5a",
    borderRadius: 12, padding: "28px 28px 24px",
    marginBottom: 16,
  },
  reportHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 8,
  },
  reportTitle: { fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#4a5a7a" },
  recBadge: {
    fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
    padding: "4px 12px", borderRadius: 20, border: "1px solid",
    background: "rgba(0,0,0,0.3)",
  },
  reportProduct: {
    fontSize: 22, fontWeight: 700, color: "#fff",
    marginBottom: 20, letterSpacing: "0.02em",
  },
  agentAnswer: {
    marginBottom: 20,
  },
  searchedAt: { fontSize: 11, color: "#2a3a5a", textAlign: "right", marginTop: 16 },
  resetBtn: {
    padding: "12px 28px",
    background: "transparent", border: "1px solid #2a3550",
    borderRadius: 8, color: "#6a7a9a",
    fontFamily: "inherit", fontSize: 13, cursor: "pointer",
    transition: "all 0.2s", letterSpacing: "0.08em",
  },
  footer: {
    position: "relative", zIndex: 1, textAlign: "center",
    padding: "24px", borderTop: "1px solid #1e2535",
    fontSize: 12, color: "#3a4a6a",
  },
  link: { color: "#5a7aaa", textDecoration: "none" },
  spinner: {
    display: "inline-block",
    animation: "spin 1s linear infinite",
  },
  pulseDot: {
    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
    background: "#ff6b35", animation: "pulse 1s ease infinite",
  },
};
