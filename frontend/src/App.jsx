import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:5000/api/agent";

const STEP_ICONS = {
  thinking:    "ð§ ",
  tool_call:   "â¡",
  tool_result: "ð¦",
  answer:      "â",
  error:       "â",
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
            <span style={styles.logoIcon}>ð</span>
            <div>
              <div style={styles.logoTitle}>PRICE HUNTER</div>
              <div style={styles.logoSub}>Agentic AI · OpenAI / Claude · C# .NET 8 · React</div>
            </div>
          </div>
          <div style={styles.badge}>LIVE DEMO</div>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main}>