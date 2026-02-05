import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  Sparkles,
} from "lucide-react";



// Backend-free implementation
// Note: JS regex differs from Python (checked by backend previously).
// - Replacement backreferences: $1 instead of \\1
// - No atomic groups, possessive quantifiers (unless using v flag, but we use standard flags)

const DATASETS = {
  literal_characters: {
    label: "1. Literal Characters",
    data: "cat, cAt, dog, DOG, mouse, Mouse, Mouse",
  },
  character_classes: {
    label: "2. Character Classes",
    data: "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 !@#$%^&*()_+-=[]{}\\|;:'\",<.>/?`~"
  },
  logs: {
    label: "Server Logs",
    data: `2026-01-29T12:34:56Z service=api env=prod status=503 latency=123ms msg="upstream timeout"
2026-01-29T12:35:02Z service=web env=prod status=200 latency=18ms msg="ok"
2026-01-29T12:35:10Z service=api env=staging status=429 latency=95ms msg="rate limited"
2026-01-29T12:35:11Z service=worker env=prod status=500 latency=2500ms msg="job failed id=9f1c"
ERROR 2026-01-29T12:35:12Z service=api env=prod status=502 latency=532ms msg="bad gateway"`,
  },
  kv: {
    label: "Key-Value Pairs",
    data: `USER=alice
ROLE=admin
TOKEN="abc-123-xyz"
TIMEOUT_MS=1500`,
  },
  csv: {
    label: "CSV Data",
    data: `id,email,amount
1,alex@example.com,12.50
2,dev@corp.io,99.00
3,test.user@sample.net,5.25`,
  },
  custom: {
    label: "Custom",
    data: "Enter your text here...",
  },
};



function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function buildHighlightedHtml(text, matches, selectedIdx) {
  if (!matches?.length) return escapeHtml(text);

  const spans = matches
    .map((m, idx) => ({ start: m.span?.[0], end: m.span?.[1], idx }))
    .filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end >= s.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  // Keep non-overlapping spans (simple for demos)
  const filtered = [];
  let lastEnd = -1;
  for (const s of spans) {
    if (s.start >= lastEnd) {
      filtered.push(s);
      lastEnd = s.end;
    }
  }

  let out = "";
  let pos = 0;
  for (const s of filtered) {
    out += escapeHtml(text.slice(pos, s.start));
    const cls =
      s.idx === selectedIdx
        ? "bg-indigo-200/80 ring-1 ring-indigo-400 rounded px-0.5"
        : "bg-amber-200/60 rounded px-0.5";
    out += `<span data-mid="${s.idx}" class="${cls}">${escapeHtml(text.slice(s.start, s.end))}</span>`;
    pos = s.end;
  }
  out += escapeHtml(text.slice(pos));
  return out;
}



function Badge({ children, tone = "slate" }) {
  const toneMap = {
    slate: "border-slate-200 bg-white text-slate-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-800",
    bad: "border-rose-200 bg-rose-50 text-rose-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-indigo-200 bg-indigo-50 text-indigo-800",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", toneMap[tone])}>
      {children}
    </span>
  );
}

function Card({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TogglePill({ on, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold transition",
        on
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
      type="button"
    >
      {label}
    </button>
  );
}

export default function App() {
  const [datasetKey, setDatasetKey] = useState("Literal Characters");
  const [mode, setMode] = useState("match");
  const [pattern, setPattern] = useState('');
  const [replacement, setReplacement] = useState("");
  const [flags, setFlags] = useState({
    IGNORECASE: false,
    MULTILINE: false
  });
  const [text, setText] = useState(DATASETS.literal_characters.data);

  const [resp, setResp] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(-1);
  const [status, setStatus] = useState({ kind: "idle", msg: "Ready." });

  const [liveMatches, setLiveMatches] = useState([]);
  const [liveError, setLiveError] = useState(null);


  const previewRef = useRef(null);


  const flagsArray = useMemo(() => Object.keys(flags).filter((k) => flags[k]), [flags]);

  const matchesToDisplay = liveMatches;

  const highlightedHtml = useMemo(() => {
    if (mode === "replace") return escapeHtml(text);
    return buildHighlightedHtml(text, matchesToDisplay, selectedMatch);
  }, [mode, text, matchesToDisplay, selectedMatch]);

  function jsFlagsFromState(flags) {
    let f = "";
    if (flags.IGNORECASE) f += "i";
    if (flags.MULTILINE) f += "m";
    if (flags.DOTALL) f += "s";
    // VERBOSE has no JS equivalent — ignore
    return f;
  }

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const handler = (e) => {
      const t = e.target;
      if (t?.dataset?.mid) setSelectedMatch(parseInt(t.dataset.mid, 10));
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, []);

  function resetToDataset(key) {
    setDatasetKey(key);
    setText(DATASETS[key].data);
    setResp(null);
    setSelectedMatch(-1);
    setAttempts(0);
    setStatus({ kind: "idle", msg: "Reset." });
  }

  useEffect(() => {
    // Unified reactive logic
    if (!pattern) {
      setLiveMatches([]);
      setLiveError(null);
      setResp(null);
      setStatus({ kind: "idle", msg: "Enter a pattern." });
      return;
    }

    try {
      const flagsStr = jsFlagsFromState(flags);
      const re = new RegExp(pattern, flagsStr + (mode === "match" ? "g" : "g"));

      let out = { ok: true, matches: [], replaced_text: "" };
      const matches = [];

      // Always compute matches for highlighting/listing
      // reset lastIndex just in case
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        if (m[0] === "") { re.lastIndex++; continue; }
        matches.push({
          span: [m.index, m.index + m[0].length],
          match: m[0],
          groups: Array.from(m).slice(1)
        });
        if (matches.length >= 200) break;
      }
      out.matches = matches;
      setLiveMatches(matches);
      setLiveError(null);

      if (mode === "replace") {
        out.replaced_text = text.replace(re, replacement);
      }

      setResp(out);
      setStatus({ kind: "good", msg: "OK" });

    } catch (err) {
      setLiveMatches([]);
      setLiveError(err.message || "Invalid regex");
      setResp({ ok: false, error: err.message });
      setStatus({ kind: "bad", msg: err.message });
    }
  }, [pattern, flags, text, mode, replacement]);

  const warn = resp?.warn || [];
  const timeMs = resp?.time_ms; // Undefined now, which is fine

  const statusIcon =
    status.kind === "good" ? <CheckCircle2 className="text-emerald-600" size={18} /> :
      status.kind === "bad" ? <XCircle className="text-rose-600" size={18} /> :
        <Timer className="text-slate-500" size={18} />;

  return (
    <div className="min-h-screen bg-[radial-gradient(80%_60%_at_50%_0%,#e0e7ff_0%,#ffffff_55%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <Sparkles size={18} />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Regex Dojo</h1>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Glad to be here!
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Controls */}
          <Card
            title="Controls"
            subtitle="Dataset, flags, pattern, text"
            right={null}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Dataset</label>
                <select
                  value={datasetKey}
                  onChange={(e) => resetToDataset(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {Object.keys(DATASETS).map((k) => (
                    <option key={k} value={k}>
                      {k === "custom" && datasetKey === "custom" ? "Custom (Edited)" : DATASETS[k].label}
                    </option>
                  ))}
                </select>
              </div>



              <div>
                <label className="text-xs font-semibold text-slate-600">Mode</label>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => setMode("match")}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold",
                      mode === "match"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                    type="button"
                  >
                    Match
                  </button>
                  <button
                    onClick={() => setMode("replace")}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold",
                      mode === "replace"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                    type="button"
                  >
                    Replace
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Flags</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.keys(flags).map((k) => (
                    <TogglePill
                      key={k}
                      label={k}
                      on={flags[k]}
                      onClick={() => setFlags((f) => ({ ...f, [k]: !f[k] }))}
                    />
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Pattern</label>
                <input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {mode === "replace" && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Replacement (\\1, \\g&lt;name&gt;)</label>
                  <input
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Text</label>
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setDatasetKey("custom");
                  }}
                  className="mt-1 h-64 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>


            </div>
          </Card>

          {/* Output */}
          <Card
            title="Output"
            subtitle="Preview and matches"
            right={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={status.kind === "good" ? "good" : status.kind === "bad" ? "bad" : "slate"}>
                  {statusIcon} {status.msg}
                </Badge>
                {timeMs != null && (
                  <Badge>
                    <Timer size={14} /> {timeMs}ms
                  </Badge>
                )}
                {warn.map((w) => (
                  <Badge key={w} tone="warn">
                    <AlertTriangle size={14} /> {w}
                  </Badge>
                ))}
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-600">Preview</div>
                <div
                  ref={previewRef}
                  className="mt-2 rounded-2xl border border-slate-200 bg-white/70 p-3 font-mono text-sm leading-relaxed text-slate-900 shadow-sm whitespace-pre-wrap break-all"
                  dangerouslySetInnerHTML={{
                    __html: mode === "replace" ? escapeHtml(text) : buildHighlightedHtml(text, matchesToDisplay, selectedMatch),
                  }}
                />
                <div className="mt-2 text-xs text-slate-500">
                  Click a highlighted segment to select a match.
                </div>
              </div>

              {mode === "replace" && (
                <div>
                  <div className="text-xs font-semibold text-slate-600">Replace output</div>
                  <pre className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-relaxed text-slate-900 whitespace-pre-wrap break-all">
                    {resp?.replaced_text || ""}
                  </pre>
                </div>
              )}

              {mode === "match" && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Matches</div>
                    <div className="mt-2 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white">
                      {(matchesToDisplay || []).map((m, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedMatch(idx)}
                          className={cn(
                            "w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50",
                            idx === selectedMatch && "bg-indigo-50"
                          )}
                          type="button"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-700">#{idx}</div>
                            <div className="text-[11px] text-slate-500">[{m.span?.[0]}, {m.span?.[1]}]</div>
                          </div>
                          <div className="mt-1 line-clamp-2 font-mono text-xs text-slate-800">{m.match}</div>
                        </button>
                      ))}
                      {!matchesToDisplay?.length && (
                        <div className="p-3 text-sm text-slate-600">No matches.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-600">Selected match</div>
                    <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      {selectedMatch >= 0 && matchesToDisplay?.[selectedMatch] ? (
                        <pre className="font-mono text-xs leading-relaxed text-slate-900">
                          {JSON.stringify(matchesToDisplay[selectedMatch], null, 2)}
                        </pre>
                      ) : (
                        <div className="text-sm text-slate-600">Select a match from the list or the highlight.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>


      </div>
    </div>
  );
}
