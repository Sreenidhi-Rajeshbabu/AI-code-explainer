import { useState } from "react";
import "./App.css";

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C", "Go", "Rust", "PHP", "Ruby"];

const TABS = [
  { key: "line_by_line",        label: "Line by Line",   icon: "📝" },
  { key: "time_complexity",     label: "Complexity",     icon: "⏱" },
  { key: "bugs",                label: "Bugs",           icon: "🐛" },
  { key: "optimized_version",   label: "Optimized",      icon: "⚡" },
  { key: "interview_explanation", label: "Interview",    icon: "🎤" },
];

export default function App() {
  const [code, setCode]         = useState("");
  const [language, setLanguage] = useState("Python");
  const [result, setResult]     = useState(null);
  const [activeTab, setActiveTab] = useState("line_by_line");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleExplain() {
    if (!code.trim()) {
      setError("Please paste some code first.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Something went wrong. Please try again.");
        return;
      }

      setResult(data);
      setActiveTab("line_by_line");
    } catch (err) {
      setError("Could not reach the backend. Make sure it's running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-bracket">&lt;</span>
            CodeExplain
            <span className="logo-bracket">/&gt;</span>
          </div>
          <p className="tagline">Paste code. Understand everything.</p>
        </div>
      </header>

      <main className="main">
        {/* Input Panel */}
        <section className="input-panel">
          <div className="input-toolbar">
            <label className="toolbar-label">Language</label>
            <select
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <div className="char-count">{code.length} / 5000</div>
          </div>

          <textarea
            className="code-input"
            placeholder={`# Paste your ${language} code here...\n\ndef example():\n    pass`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />

          {error && <div className="error-msg">⚠ {error}</div>}

          <button
            className={`explain-btn ${loading ? "loading" : ""}`}
            onClick={handleExplain}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-inner">
                <span className="spinner" /> Analyzing...
              </span>
            ) : (
              <span className="btn-inner">✦ Explain Code</span>
            )}
          </button>
        </section>

        {/* Results Panel */}
        {result && (
          <section className="results-panel">
            {/* Tabs */}
            <div className="tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">

              {/* LINE BY LINE */}
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

              {/* TIME COMPLEXITY */}
              {activeTab === "time_complexity" && (
                <div className="section">
                  <div className="complexity-badge">
                    {result.time_complexity.complexity}
                  </div>
                  <p className="complexity-text">{result.time_complexity.explanation}</p>
                </div>
              )}

              {/* BUGS */}
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

              {/* OPTIMIZED VERSION */}
              {activeTab === "optimized_version" && (
                <div className="section">
                  <div className="code-block-header">
                    <span>Optimized Code</span>
                    <button
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(result.optimized_version.code)}
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="code-block">{result.optimized_version.code}</pre>
                  <div className="changes-box">
                    <p className="changes-label">What changed</p>
                    <p className="changes-text">{result.optimized_version.changes}</p>
                  </div>
                </div>
              )}

              {/* INTERVIEW EXPLANATION */}
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
