import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:5000/api/agent";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none", sw = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  search:   ["M21 21l-4.35-4.35", "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"],
  arrow:    ["M5 12h14", "m12 5 7 7-7 7"],
  refresh:  ["M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", "M21 3v5h-5", "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", "M8 16H3v5"],
  brain:    ["M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z", "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z", "M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4", "M17.599 6.5a3 3 0 0 0 .399-1.375", "M6.003 5.125A3 3 0 0 0 6.401 6.5", "M3.477 10.896a4 4 0 0 1 .585-.396", "M19.938 10.5a4 4 0 0 1 .585.396", "M6 18a4 4 0 0 1-1.967-.516", "M19.967 17.484A4 4 0 0 1 18 18"],
  zap:      "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  box:      ["M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z", "m3.3 7 8.7 5 8.7-5", "M12 22V12"],
  check:    "M20 6 9 17l-5-5",
  alert:    ["M12 9v4", "M12 17h.01", "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"],
  tag:      ["M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z", "M7.5 7.5v.01"],
  external: ["M15 3h6v6", "M10 14 21 3", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"],
  github:   null,
  spinner:  null,
};

const Spinner = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ animation: "spin 0.75s linear infinite", display: "inline-block" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const GithubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

// ── Step config ───────────────────────────────────────────────────────────────
const STEP_CONFIG = {
  thinking:    { label: "Reasoning",    color: "#2563eb", bg: "#eff4ff",  border: "#bfdbfe", iconKey: "brain"  },
  tool_call:   { label: "Tool Call",    color: "#d97706", bg: "#fffbeb",  border: "#fde68a", iconKey: "zap"    },
  tool_result: { label: "Tool Result",  color: "#0891b2", bg: "#ecfeff",  border: "#a5f3fc", iconKey: "box"    },
  answer:      { label: "Final Answer", color: "#16a34a", bg: "#f0fdf4",  border: "#bbf7d0", iconKey: "check"  },
  error:       { label: "Error",        color: "#dc2626", bg: "#fef2f2",  border: "#fecaca", iconKey: "alert"  },
};

const EXAMPLES = [
  "Sony WH-1000XM5 headphones",
  "MacBook Air M3",
  "iPhone 16 Pro",
  "Nintendo Switch 2",
  "LG C4 OLED 55\"",
  "Canon PIXMA MG3620",
];

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [product, setProduct] = useState("");
  const [steps, setSteps]     = useState([]);
  const [report, setReport]   = useState(null);
  const [running, setRunning] = useState(false);
  const [done, setDone]       = useState(false);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  const handleSearch = async (override) => {
    const query = (override ?? product).trim();
    if (!query || running) return;
    if (override) setProduct(override);
    setSteps([]); setReport(null); setDone(false); setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: query }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done: sd } = await reader.read();
        if (sd) break;
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
            if (step.type === "answer" && step.data) setReport(step.data);
          } catch {}
        }
      }
    } catch (err) {
      setSteps(prev => [...prev, { type: "error", message: err.message }]);
    } finally {
      setRunning(false); setDone(true);
    }
  };

  const handleReset = () => {
    setSteps([]); setReport(null); setDone(false); setProduct("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const hasContent = steps.length > 0 || report;

  return (
    <div style={s.root}>

      {/* ── Header ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.brand}>
            <div style={s.logoMark}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" x2="21" y1="6" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div>
              <div style={s.brandName}>PriceHunter</div>
              <div style={s.brandSub}>AI-powered price comparison</div>
            </div>
          </div>
          <nav style={s.nav}>
            <span style={s.navPill}>
              <span style={s.liveDot} />
              Live demo
            </span>
            <a
              href="https://github.com/talalkhan/PriceHunterAgent"
              target="_blank" rel="noreferrer"
              style={s.ghBtn}
            >
              <GithubIcon />
              View on GitHub
            </a>
          </nav>
        </div>
      </header>

      <main style={s.main}>

        {/* ── Hero (empty state only) ── */}
        {!hasContent && (
          <section style={s.hero}>
            <div style={s.heroLabel}>Agentic AI Demo</div>
            <h1 style={s.heroTitle}>
              Find the best price — automatically
            </h1>
            <p style={s.heroSub}>
              An AI agent that searches across major retailers, compares prices, hunts
              for coupons, and delivers a clear recommendation. Watch every reasoning
              step in real time.
            </p>

            <div style={s.techRow}>
              {["Claude AI", ".NET 8", "React", "ReAct Agent", "SSE Streaming"].map(t => (
                <span key={t} style={s.techPill}>{t}</span>
              ))}
            </div>
          </section>
        )}

        {/* ── Search ── */}
        <div style={hasContent ? s.searchBarCompact : s.searchBarHero}>
          <div style={s.searchBox}>
            <span style={s.searchIconWrap}>
              <Icon d={icons.search} size={16} sw={2} />
            </span>
            <input
              ref={inputRef}
              style={s.searchInput}
              value={product}
              onChange={e => setProduct(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search any product, e.g. Sony WH-1000XM5 headphones"
              disabled={running}
              autoFocus
            />
            <button
              style={running ? { ...s.searchBtn, ...s.searchBtnBusy } : s.searchBtn}
              onClick={() => handleSearch()}
              disabled={running}
            >
              {running
                ? <><Spinner /> Searching…</>
                : <><Icon d={icons.arrow} size={14} stroke="#fff" sw={2} /> Search</>
              }
            </button>
          </div>

          {!hasContent && (
            <div style={s.chipRow}>
              <span style={s.chipLabel}>Try:</span>
              {EXAMPLES.map(ex => (
                <button key={ex} style={s.chip} onClick={() => handleSearch(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Results ── */}
        {hasContent && (
          <div style={s.resultsGrid}>

            {/* Activity log */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <span style={s.cardTitle}>Agent Activity</span>
                {running && (
                  <span style={s.liveTag}>
                    <span style={s.liveDotGreen} />
                    Running
                  </span>
                )}
              </div>
              <div style={s.timeline}>
                {steps.map((step, i) => (
                  <StepRow key={i} step={step} index={i} total={steps.length} />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Price report */}
            {report && <ReportCard report={report} onReset={handleReset} done={done} />}

          </div>
        )}

        {/* ── How it works (empty state) ── */}
        {!hasContent && (
          <section style={s.howSection}>
            <div style={s.howTitle}>How it works</div>
            <div style={s.howGrid}>
              {[
                { n: "1", label: "Search",    desc: "Queries Google Shopping and major retailers for current prices across 5+ stores." },
                { n: "2", label: "Fetch",     desc: "Retrieves detailed pricing, stock level, and shipping info from the top results." },
                { n: "3", label: "Coupons",   desc: "Searches for stackable coupon codes and cashback offers at the best-priced store." },
                { n: "4", label: "Recommend", desc: "Synthesizes findings into a clear buy / wait / compare recommendation." },
              ].map(({ n, label, desc }) => (
                <div key={n} style={s.howCard}>
                  <div style={s.howNum}>{n}</div>
                  <div style={s.howCardLabel}>{label}</div>
                  <div style={s.howCardDesc}>{desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <span>Built by{" "}
          <a href="https://linkedin.com/in/mrtalalkhan" target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
            Talal Khan
          </a>
        </span>
        <span style={s.footerDot}>·</span>
        <span>Claude AI · .NET 8 · React</span>
        <span style={s.footerDot}>·</span>
        <a href="https://github.com/talalkhan/PriceHunterAgent" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
          GitHub ↗
        </a>
      </footer>
    </div>
  );
}

// ── Step Row ──────────────────────────────────────────────────────────────────
function StepRow({ step, index, total }) {
  const cfg  = STEP_CONFIG[step.type] || STEP_CONFIG.thinking;
  const last = index === total - 1;

  return (
    <div className="animate-up" style={{ ...s.stepRow, animationDelay: `${Math.min(index * 0.03, 0.25)}s` }}>
      {/* Rail */}
      <div style={s.rail}>
        <div style={{ ...s.railDot, background: cfg.color }} />
        {!last && <div style={s.railLine} />}
      </div>
      {/* Body */}
      <div style={{ ...s.stepBody, background: cfg.bg, borderColor: cfg.border }}>
        <div style={{ ...s.stepBadge, color: cfg.color }}>
          <Icon d={icons[cfg.iconKey]} size={12} stroke={cfg.color} sw={2} />
          {cfg.label}
        </div>
        <div style={step.type === "answer" ? s.stepTextAnswer : s.stepText}>
          {step.type === "answer"
            ? <MarkdownBlock text={step.message} />
            : step.message
          }
        </div>
      </div>
    </div>
  );
}

// ── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ report, onReset, done }) {
  const recMap = {
    BUY_NOW: { label: "Buy Now",       color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    WAIT:    { label: "Wait for Sale", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    COMPARE: { label: "Compare More",  color: "#2563eb", bg: "#eff4ff", border: "#bfdbfe" },
  };
  const rec = recMap[report.recommendation] || recMap.COMPARE;

  return (
    <div style={s.reportCard} className="animate-up">

      {/* Header */}
      <div style={s.reportHead}>
        <div style={s.cardTitle}>Price Report</div>
        <span style={{ ...s.recBadge, color: rec.color, background: rec.bg, borderColor: rec.border }}>
          {rec.label}
        </span>
      </div>

      <div style={s.reportProduct}>{report.product}</div>

      {/* Coupon */}
      {report.couponFound && (
        <div style={s.couponBox}>
          <Icon d={icons.tag} size={13} stroke="#d97706" sw={2} />
          <span>Coupon found:</span>
          <code style={s.couponCode}>{report.couponFound}</code>
        </div>
      )}

      {/* Markdown answer */}
      <div style={s.reportBody}>
        <MarkdownBlock text={report.recommendationReason} />
      </div>

      {/* Listings grid */}
      {report.listings?.length > 0 && (
        <div style={s.listingsSection}>
          <div style={s.listingsTitle}>Prices Found</div>
          <div style={s.listingsGrid}>
            {report.listings.slice(0, 6).map((l, i) => (
              <a
                key={i}
                href={l.url || "#"}
                target="_blank" rel="noreferrer"
                style={{ ...s.listing, ...(l.isBestPrice ? s.listingBest : {}) }}
              >
                {l.isBestPrice && <div style={s.bestLabel}>Best Price</div>}
                <div style={s.listingStore}>{l.store}</div>
                <div style={{ ...s.listingPrice, ...(l.isBestPrice ? { color: "#16a34a" } : {}) }}>
                  {l.price}
                </div>
                {l.notes && <div style={s.listingNote}>{l.notes}</div>}
                {l.url && (
                  <div style={s.listingViewLink}>
                    View deal <Icon d={icons.external} size={11} stroke="#2563eb" sw={2} />
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={s.reportFoot}>
        <span>Searched at {new Date(report.searchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        {done && (
          <button style={s.resetBtn} onClick={onReset}>
            <Icon d={icons.refresh} size={13} stroke="currentColor" sw={2} />
            New search
          </button>
        )}
      </div>
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MarkdownBlock({ text }) {
  const inline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\)]+\)|`[^`]+`)/g);
    return parts.map((p, j) => {
      const lm = p.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+)\)$/);
      if (lm) return (
        <a key={j} href={lm[2]} target="_blank" rel="noreferrer" style={s.mdLink}>
          {lm[1]} <Icon d={icons.external} size={10} stroke="#2563eb" sw={2} />
        </a>
      );
      const bm = p.match(/^\*\*([^*]+)\*\*$/);
      if (bm) return <strong key={j} style={{ color: "var(--text)", fontWeight: 600 }}>{bm[1]}</strong>;
      const cm = p.match(/^`([^`]+)`$/);
      if (cm) return <code key={j} style={s.mdCode}>{cm[1]}</code>;
      return <span key={j}>{p}</span>;
    });
  };

  return (
    <div>
      {(text || "").split("\n").map((line, i) => {
        if (line.startsWith("### ")) return <p key={i} style={s.mdH3}>{inline(line.slice(4))}</p>;
        if (line.startsWith("## "))  return <p key={i} style={s.mdH2}>{inline(line.slice(3))}</p>;
        if (line.startsWith("# "))   return <p key={i} style={s.mdH1}>{inline(line.slice(2))}</p>;
        if (line.startsWith("---"))  return <hr key={i} style={s.mdHr} />;
        if (line.match(/^\s{2,}[-*] /)) return (
          <div key={i} style={s.mdSub}>{inline(line.replace(/^\s+[-*] /, ""))}</div>
        );
        if (line.match(/^[-*] /) || line.match(/^\d+\. /)) return (
          <div key={i} style={s.mdItem}>
            <span style={s.mdBullet}>•</span>
            <span>{inline(line.replace(/^[-*] /, "").replace(/^\d+\. /, ""))}</span>
          </div>
        );
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        return <div key={i} style={s.mdLine}>{inline(line)}</div>;
      })}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  root: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    background: "var(--bg)",
  },

  // Header
  header: {
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
    position: "sticky", top: 0, zIndex: 50,
  },
  headerInner: {
    maxWidth: 1080, margin: "0 auto", padding: "0 32px",
    height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  brand: { display: "flex", alignItems: "center", gap: 11 },
  logoMark: {
    width: 34, height: 34, borderRadius: 8,
    background: "#eff4ff", border: "1px solid #bfdbfe",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  brandName: { fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" },
  brandSub:  { fontSize: 11, color: "var(--text-dim)", marginTop: 1 },
  nav: { display: "flex", alignItems: "center", gap: 12 },
  navPill: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, fontWeight: 500, color: "var(--text-muted)",
    background: "var(--bg2)", border: "1px solid var(--border)",
    padding: "4px 10px", borderRadius: 99,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: "50%", background: "#16a34a",
    boxShadow: "0 0 0 2px #dcfce7",
  },
  ghBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 14px", borderRadius: "var(--radius-sm)",
    background: "var(--text)", color: "#fff",
    fontSize: 12, fontWeight: 600, transition: "all 0.15s",
  },

  // Main
  main: {
    flex: 1, maxWidth: 1080, width: "100%", margin: "0 auto",
    padding: "0 32px 80px",
  },

  // Hero
  hero: { padding: "64px 0 40px", maxWidth: 640 },
  heroLabel: {
    display: "inline-block", fontSize: 11, fontWeight: 600,
    color: "var(--accent)", letterSpacing: "0.07em", textTransform: "uppercase",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 38, fontWeight: 700, lineHeight: 1.2,
    letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 16,
  },
  heroSub: {
    fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7,
    maxWidth: 560, marginBottom: 28,
  },
  techRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  techPill: {
    fontSize: 11, fontWeight: 500, padding: "4px 10px",
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 99, color: "var(--text-muted)",
  },

  // Search
  searchBarHero:    { marginBottom: 48 },
  searchBarCompact: { marginBottom: 28, paddingTop: 24 },
  searchBox: {
    display: "flex", alignItems: "center",
    background: "var(--surface)", border: "1px solid var(--border2)",
    borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)",
    padding: "5px 5px 5px 16px", gap: 8,
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  searchIconWrap: { color: "var(--text-dim)", display: "flex", flexShrink: 0 },
  searchInput: {
    flex: 1, border: "none", background: "transparent",
    fontSize: 14, color: "var(--text)", outline: "none",
    padding: "9px 4px", minWidth: 0,
  },
  searchBtn: {
    display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
    padding: "9px 18px", borderRadius: "var(--radius)",
    background: "var(--accent)", color: "#fff", border: "none",
    fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em",
    boxShadow: "0 1px 3px rgba(37,99,235,0.35)",
  },
  searchBtnBusy: { background: "#93a8e8", cursor: "not-allowed", boxShadow: "none" },
  chipRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chipLabel: { fontSize: 12, color: "var(--text-dim)", fontWeight: 500 },
  chip: {
    fontSize: 12, fontWeight: 500, padding: "5px 12px",
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 99, color: "var(--text-muted)", cursor: "pointer",
    transition: "all 0.15s",
    boxShadow: "var(--shadow-sm)",
  },

  // Results layout
  resultsGrid: { display: "flex", flexDirection: "column", gap: 20 },

  // Card shell
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", overflow: "hidden",
    boxShadow: "var(--shadow-sm)",
  },
  cardHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px", borderBottom: "1px solid var(--border)",
  },
  cardTitle: { fontSize: 12, fontWeight: 700, color: "var(--text)", letterSpacing: "0.01em" },
  liveTag: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 600, color: "#16a34a",
  },
  liveDotGreen: {
    width: 6, height: 6, borderRadius: "50%", background: "#16a34a",
    animation: "pulse 1.2s ease infinite",
  },

  // Timeline
  timeline: { padding: "8px 0 4px" },
  stepRow: {
    display: "flex", gap: 0, padding: "0 20px 0 16px",
  },
  rail: {
    display: "flex", flexDirection: "column", alignItems: "center",
    width: 24, flexShrink: 0, paddingTop: 14,
  },
  railDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0, border: "2px solid var(--surface)" },
  railLine: { width: 1, flex: 1, background: "var(--border)", minHeight: 8, marginTop: 3 },
  stepBody: {
    flex: 1, marginLeft: 10, marginBottom: 6,
    border: "1px solid", borderRadius: "var(--radius-sm)",
    padding: "9px 13px", marginTop: 8,
  },
  stepBadge: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase", marginBottom: 5,
  },
  stepText: {
    fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
    whiteSpace: "pre-wrap", wordBreak: "break-word",
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  },
  stepTextAnswer: { fontSize: 13, lineHeight: 1.7, color: "var(--text-muted)" },

  // Report
  reportCard: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", overflow: "hidden",
    boxShadow: "var(--shadow-sm)",
  },
  reportHead: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px 12px", borderBottom: "1px solid var(--border)",
    gap: 12,
  },
  reportProduct: {
    fontSize: 18, fontWeight: 700, color: "var(--text)",
    letterSpacing: "-0.02em", padding: "14px 20px 0",
  },
  recBadge: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
    padding: "4px 12px", borderRadius: 99, border: "1px solid",
    whiteSpace: "nowrap",
  },
  couponBox: {
    display: "flex", alignItems: "center", gap: 7,
    margin: "14px 20px 0",
    background: "#fffbeb", border: "1px solid #fde68a",
    borderRadius: "var(--radius-sm)", padding: "8px 12px",
    fontSize: 12, color: "var(--text-muted)", fontWeight: 500,
  },
  couponCode: {
    fontFamily: "'SF Mono','Fira Code',monospace",
    fontWeight: 700, color: "#d97706", fontSize: 12, letterSpacing: "0.05em",
    background: "#fef9c3", padding: "1px 6px", borderRadius: 4,
    border: "1px solid #fde68a",
  },
  reportBody: { padding: "16px 20px" },
  reportFoot: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 20px", borderTop: "1px solid var(--border)",
    fontSize: 11, color: "var(--text-dim)",
  },
  resetBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 14px", borderRadius: "var(--radius-sm)",
    background: "var(--surface2)", border: "1px solid var(--border)",
    color: "var(--text-muted)", fontSize: 12, fontWeight: 500, cursor: "pointer",
  },

  // Listings
  listingsSection: { padding: "0 20px 20px" },
  listingsTitle: {
    fontSize: 11, fontWeight: 700, color: "var(--text-dim)",
    letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10,
  },
  listingsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 },
  listing: {
    display: "block", padding: "12px",
    background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", transition: "all 0.15s",
    textDecoration: "none", color: "inherit",
    boxShadow: "var(--shadow-sm)",
  },
  listingBest: {
    borderColor: "#bbf7d0", background: "#f0fdf4",
    boxShadow: "0 0 0 1px #bbf7d0",
  },
  bestLabel: {
    fontSize: 10, fontWeight: 700, color: "#16a34a",
    letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5,
  },
  listingStore: { fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 3 },
  listingPrice: { fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" },
  listingNote:  { fontSize: 11, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.4 },
  listingViewLink: {
    display: "flex", alignItems: "center", gap: 3,
    fontSize: 11, color: "var(--accent)", marginTop: 8, fontWeight: 500,
  },

  // How it works
  howSection: { paddingBottom: 64 },
  howTitle: {
    fontSize: 13, fontWeight: 700, color: "var(--text-muted)",
    marginBottom: 16, letterSpacing: "-0.01em",
  },
  howGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  howCard: {
    padding: "18px", background: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
  },
  howNum: {
    width: 26, height: 26, borderRadius: 8, background: "var(--accent-light)",
    border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 12,
  },
  howCardLabel: { fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 },
  howCardDesc:  { fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 },

  // Footer
  footer: {
    borderTop: "1px solid var(--border)", background: "var(--surface)",
    padding: "16px 32px", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 8,
    fontSize: 12, color: "var(--text-dim)",
  },
  footerDot: { color: "var(--border2)" },

  // Markdown
  mdH1: { fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "16px 0 6px", letterSpacing: "-0.02em" },
  mdH2: { fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "14px 0 5px", letterSpacing: "-0.01em" },
  mdH3: { fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "12px 0 4px" },
  mdHr: { border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" },
  mdItem: {
    display: "flex", gap: 7, padding: "2px 0",
    fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65,
  },
  mdBullet: { color: "var(--accent)", flexShrink: 0, fontWeight: 700, fontSize: 12, marginTop: 1 },
  mdSub: {
    paddingLeft: 24, fontSize: 12, color: "var(--text-dim)",
    lineHeight: 1.6, padding: "1px 0 1px 24px",
  },
  mdLine: { fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 1 },
  mdLink: {
    color: "var(--accent)", fontWeight: 500,
    textDecoration: "underline", textDecorationColor: "#bfdbfe",
    display: "inline-flex", alignItems: "center", gap: 3,
  },
  mdCode: {
    background: "var(--bg2)", border: "1px solid var(--border)",
    borderRadius: 4, padding: "1px 5px", fontSize: "0.85em",
    fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
    color: "#d97706",
  },
};
