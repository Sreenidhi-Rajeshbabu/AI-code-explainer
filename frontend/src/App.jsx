import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./App.css";

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C", "Go", "Rust", "PHP", "Ruby"];
const LANG_MAP = { "Python": "python", "JavaScript": "javascript", "TypeScript": "typescript", "Java": "java", "C++": "cpp", "C": "c", "Go": "go", "Rust": "rust", "PHP": "php", "Ruby": "ruby" };

const TABS = [
  { key: "line_by_line", label: "Line by Line", icon: "📝" },
  { key: "time_complexity", label: "Complexity", icon: "⏱" },
  { key: "bugs", label: "Bugs", icon: "🐛" },
  { key: "optimized_version", label: "Optimized", icon: "⚡" },
  { key: "interview_explanation", label: "Interview", icon: "🎤" },
];

const MAX_HISTORY = 3;

export default function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("line_by_line");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("codeExplainerHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  function saveToHistory(code, language, result) {
    const entry = {
      id: Date.now(),
      code,
      language,
      result,
      preview: code.slice(0, 60).replace(/\n/g, " ") + (code.length > 60 ? "..." : ""),
    };
    const updated = [entry, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem("codeExplainerHistory", JSON.stringify(updated));
  }

  function loadFromHistory(entry) {
    setCode(entry.code);
    setLanguage(entry.language);
    setResult(entry.result);
    setActiveTab("line_by_line");
    setError("");
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExplain() {
    if (!code.trim()) { setError("Please paste some code first."); return; }
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Something went wrong."); return; }
      setResult(data);
      setActiveTab("line_by_line");
      saveToHistory(code, language, data);
    } catch {
      setError("Could not reach the backend. Make sure it is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {/* Toast */}
      {copied && <div className="toast">✓ Copied to clipboard</div>}

      <header className="header">
        <div className="header-inner">
          <div className="logo"><span className="logo-bracket">&lt;</span>CodeExplain<span className="logo-bracket">/&gt;</span></div>
          <p className="tagline">Paste code. Understand everything.</p>
        </div>
      </header>

      <main className="main">

        {/* History Bar */}
        {history.length > 0 && (
          <div className="history-bar">
            <span className="history-label">Recent</span>
            {history.map((entry) => (
              <button key={entry.id} className="history-pill" onClick={() => loadFromHistory(entry)}>
                <span className="history-lang">{entry.language}</span>
                <span className="history-preview">{entry.preview}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Panel */}
        <section className="input-panel">
          <div className="input-toolbar">
            <label className="toolbar-label">Language</label>
            <select className="lang-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="char-count">{code.length} / 5000</div>
          </div>

          <textarea
            className="code-input"
            placeholder={`# Paste your ${language} code here...`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />

          {error && <div className="error-msg">⚠ {error}</div>}

          <button className={`explain-btn ${loading ? "loading" : ""}`} onClick={handleExplain} disabled={loading}>
            <span className="btn-inner">
              {loading ? <><span className="spinner" /> Analyzing...</> : <>✦ Explain Code</>}
            </span>
          </button>
        </section>

        {/* Results */}
        {result && (
          <section className="results-panel">
            <div className="tabs">
              {TABS.map((tab) => (
                <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="tab-content">

              {activeTab === "line_by_line" && (
                <div className="section">
                  {result.line_by_line.map((item, i) => (
                    <div key={i} className="line-row">
                      <div className="line-number">{i + 1}</div>
                      <div className="line-right">
                        <code className="line-code">{item.line}</code>
                        <p className="line-explanation">{item.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "time_complexity" && (
                <div className="section">
                  <div className="complexity-badge">{result.time_complexity.complexity}</div>
                  <p className="complexity-text">{result.time_complexity.explanation}</p>
                </div>
              )}

              {activeTab === "bugs" && (
                <div className="section">
                  {result.bugs.map((bug, i) => (
                    <div key={i} className={`bug-card ${bug.line === "none" ? "no-bug" : "has-bug"}`}>
                      {bug.line === "none" ? (
                        <p className="no-bug-text">✅ No bugs found. Your code looks clean!</p>
                      ) : (
                        <>
                          <div className="bug-line"><span className="bug-label">Line</span><code>{bug.line}</code></div>
                          <div className="bug-issue"><span className="bug-label">Issue</span><span>{bug.issue}</span></div>
                          <div className="bug-fix"><span className="bug-label">Fix</span><span>{bug.fix}</span></div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "optimized_version" && (
                <div className="section">
                  <div className="code-block-header">
                    <span>Optimized Code</span>
                    <button className="copy-btn" onClick={() => handleCopy(result.optimized_version.code)}>
                      {copied ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={LANG_MAP[language] || "python"}
                    style={vscDarkPlus}
                    customStyle={{ borderRadius: "8px", fontSize: "13px", margin: 0 }}
                  >
                    {result.optimized_version.code}
                  </SyntaxHighlighter>
                  <div className="changes-box">
                    <p className="changes-label">What changed</p>
                    <p className="changes-text">{result.optimized_version.changes}</p>
                  </div>
                </div>
              )}

              {activeTab === "interview_explanation" && (
                <div className="section">
                  <div className="interview-card">
                    <h3 className="interview-heading">Summary</h3>
                    <p>{result.interview_explanation.summary}</p>
                  </div>
                  <div className="interview-card">
                    <h3 className="interview-heading">How to explain your approach</h3>
                    <p>{result.interview_explanation.approach}</p>
                  </div>
                  <div className="interview-card">
                    <h3 className="interview-heading">Edge Cases</h3>
                    <p>{result.interview_explanation.edge_cases}</p>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}
      </main>
    </div>
  );
}