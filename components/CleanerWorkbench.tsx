"use client";

import { useEffect, useState } from "react";
import {
  Check, Clipboard, Copy, Download, FileSearch, FileUp, FlaskConical, Languages,
  LoaderCircle, RotateCcw, ShieldCheck, Sparkles, Trash2, Type,
} from "lucide-react";
import Link from "next/link";
import { inspectText, type TextInspectReport } from "@/lib/clean-text";
import { BASE_PATH } from "@/lib/site";

type Stats = { inputLength: number; outputLength: number; removedCount: number; replacedCount: number };
type StoredRecord = { id: string; deletionToken: string; expiresAt: string };
type FileInspection = {
  kind: string;
  format: string;
  hasC2pa: boolean;
  hasAiMetadata: boolean;
  findings: string[];
  text?: TextInspectReport;
  notes: string[];
};
type FileReport = {
  format: string;
  actions: string[];
  before: { hasC2pa: boolean; hasAiMetadata: boolean; findings: string[]; suspiciousUnicode: number };
  after: { hasC2pa: boolean; hasAiMetadata: boolean; findings: string[]; suspiciousUnicode: number };
  bytesIn: number;
  bytesOut: number;
  record: StoredRecord;
};

const EXAMPLE = "This\u200B sentence\u2060 looks normal, but\u00A0it contains invisible marks.";
const RECORD_STORAGE_KEY = "aiso-watermark-cleaner:last-record:v2";
const ACCEPTED_FILES = ".txt,.text,.md,.markdown,.mdx,.html,.htm,.svg,.pdf,.docx,.odt,.png,.jpg,.jpeg,.css,.js,.ts,.tsx,.jsx,.py,.rs,.go,.json,.yaml,.yml,.toml,.csv";

export default function CleanerWorkbench() {
  const [tab, setTab] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [source, setSource] = useState("unknown");
  const [ownsContent, setOwnsContent] = useState(false);
  const [storageConsent, setStorageConsent] = useState(false);
  const [normalizeConfusables, setNormalizeConfusables] = useState(false);
  const [nfkc, setNfkc] = useState(false);
  const [cleanedText, setCleanedText] = useState("");
  const [outputLabel, setOutputLabel] = useState("Clean copy");
  const [stats, setStats] = useState<Stats | null>(null);
  const [textInspection, setTextInspection] = useState<TextInspectReport | null>(null);
  const [rewriteStrength, setRewriteStrength] = useState<"paraphrase" | "backtranslate" | "structural">("paraphrase");
  const [rewriteEnabled, setRewriteEnabled] = useState<boolean | null>(null);
  const [rewriteModel, setRewriteModel] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileInspection, setFileInspection] = useState<FileInspection | null>(null);
  const [fileReport, setFileReport] = useState<FileReport | null>(null);
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "working" | "success" | "error" | "deleting">("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const characters = Array.from(text).length;
  const working = status === "working" || status === "deleting";
  const canCleanText = text.trim().length > 0 && characters <= 50_000 && ownsContent && storageConsent && !working;
  const canInspectText = text.trim().length > 0 && characters <= 50_000 && !working;
  const canInspectFile = Boolean(file && ownsContent && !working);
  const canCleanFile = Boolean(file && ownsContent && storageConsent && !working);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECORD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredRecord[];
        const active = Array.isArray(parsed)
          ? parsed.filter((item) => item.id && item.deletionToken && new Date(item.expiresAt).getTime() > Date.now())
          : [];
        setRecords(active);
        if (active.length) setMessage(`${active.length} stored ${active.length === 1 ? "record" : "records"} can still be deleted from this browser.`);
        else localStorage.removeItem(RECORD_STORAGE_KEY);
      }
    } catch {
      // The cleaner still works when browser storage is unavailable.
    }
    void fetch(`${BASE_PATH}/api/rewrite`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => { setRewriteEnabled(payload.enabled === true); setRewriteModel(payload.model || null); })
      .catch(() => setRewriteEnabled(false));
  }, []);

  function rememberRecord(record: StoredRecord) {
    setRecords((current) => {
      const next = [record, ...current].slice(0, 30);
      try { localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep it for this session. */ }
      return next;
    });
  }

  function inspectCurrentText() {
    const report = inspectText(text, { aggressive: normalizeConfusables });
    setTextInspection(report);
    setStatus("success");
    setMessage(report.suspiciousTotal
      ? `Inspection found ${report.suspiciousTotal} suspicious Unicode ${report.suspiciousTotal === 1 ? "character" : "characters"}. Nothing was stored.`
      : "No suspicious Layer A Unicode was found. Statistical marks cannot be detected by this inspection.");
  }

  async function cleanTextLayer() {
    setStatus("working");
    setMessage("");
    setCopied(false);
    try {
      const response = await fetch(`${BASE_PATH}/api/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source, ownsContent, storageConsent, normalizeConfusables, nfkc }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Cleaning failed.");
      setCleanedText(payload.cleanedText);
      setOutputLabel("Layer A clean copy");
      setStats(payload.stats);
      setTextInspection(inspectText(payload.cleanedText, { aggressive: normalizeConfusables }));
      rememberRecord(payload.record as StoredRecord);
      setStatus("success");
      setMessage(payload.stats.removedCount + payload.stats.replacedCount > 0
        ? "Layer A clean copy ready. The disclosed activity record expires after 30 days unless you delete it sooner."
        : "No removable Layer A characters were found. The disclosed activity record still expires after 30 days.");
    } catch (cause) {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "The cleaner is temporarily unavailable.");
    }
  }

  async function runRewrite(promptOnly: boolean) {
    const input = cleanedText || text;
    if (!input.trim()) return;
    setStatus("working");
    setMessage("");
    setCopied(false);
    try {
      const response = await fetch(`${BASE_PATH}/api/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input, source, ownsContent, storageConsent, strength: rewriteStrength,
          language: "French", originalLanguage: "English", promptOnly,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Rewrite failed.");
      if (promptOnly) {
        setCleanedText(payload.prompt);
        setOutputLabel("Layer B rewrite prompt");
        setStats(null);
        setMessage("Upstream-compatible Layer B prompt ready. Run it with a non-origin model when possible. Nothing was stored.");
      } else {
        setCleanedText(payload.rewrittenText);
        setOutputLabel("Best-effort Layer B rewrite");
        setStats(payload.stats);
        setTextInspection(inspectText(payload.rewrittenText, { aggressive: normalizeConfusables }));
        rememberRecord(payload.record as StoredRecord);
        setMessage(`Best-effort ${rewriteStrength} rewrite completed with ${payload.model}. This cannot certify that a private vendor detector will fail.`);
      }
      setStatus("success");
    } catch (cause) {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "The rewrite is temporarily unavailable.");
    }
  }

  async function inspectCurrentFile() {
    if (!file) return;
    setStatus("working");
    setMessage("");
    try {
      const response = await fetch(`${BASE_PATH}/api/file`, { method: "POST", body: fileForm("inspect") });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "File inspection failed.");
      setFileInspection(payload.inspection);
      setFileReport(null);
      setStatus("success");
      setMessage("Inspection complete. Nothing was stored and the file was not modified.");
    } catch (cause) {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "File inspection failed.");
    }
  }

  async function cleanCurrentFile() {
    if (!file) return;
    setStatus("working");
    setMessage("");
    try {
      const response = await fetch(`${BASE_PATH}/api/file`, { method: "POST", body: fileForm("clean") });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "File cleaning failed.");
      }
      const reportHeader = response.headers.get("X-Aiso-Clean-Report");
      if (!reportHeader) throw new Error("The cleaner returned a file without its verification report.");
      const report = JSON.parse(decodeBase64Url(reportHeader)) as FileReport;
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const downloadName = disposition.match(/filename="([^"]+)"/)?.[1] || `${file.name}.cleaned`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setFileReport(report);
      rememberRecord(report.record);
      setStatus("success");
      const residual = report.after.hasC2pa || report.after.hasAiMetadata || report.after.suspiciousUnicode > 0;
      setMessage(residual
        ? "Cleaned file downloaded. Review the residual warnings in the report before using it."
        : "Cleaned file downloaded and the post-clean inspection found no supported residual signals.");
    } catch (cause) {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "File cleaning failed.");
    }
  }

  function fileForm(mode: "inspect" | "clean") {
    const form = new FormData();
    if (file) form.set("file", file);
    form.set("mode", mode);
    form.set("source", source);
    form.set("ownsContent", String(ownsContent));
    form.set("storageConsent", String(storageConsent));
    form.set("normalizeConfusables", String(normalizeConfusables));
    form.set("nfkc", String(nfkc));
    return form;
  }

  async function copyResult() {
    await navigator.clipboard.writeText(cleanedText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  async function deleteRecords() {
    if (records.length === 0) return;
    setStatus("deleting");
    try {
      const results = await Promise.all(records.map(async (record) => {
        const response = await fetch(`${BASE_PATH}/api/clean/${record.id}`, {
          method: "DELETE", headers: { "x-deletion-token": record.deletionToken },
        });
        return { record, deleted: response.ok || response.status === 404 };
      }));
      const remaining = results.filter((result) => !result.deleted).map((result) => result.record);
      setRecords(remaining);
      try {
        if (remaining.length) localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(remaining));
        else localStorage.removeItem(RECORD_STORAGE_KEY);
      } catch { /* Browser storage can be unavailable. */ }
      if (remaining.length) throw new Error(`Deleted ${records.length - remaining.length} records. ${remaining.length} could not be deleted right now.`);
      setStatus("success");
      setMessage("All stored activity records from this browser were deleted.");
    } catch (cause) {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "Deletion failed.");
    }
  }

  function resetText() {
    setText("");
    setCleanedText("");
    setStats(null);
    setTextInspection(null);
    setOutputLabel("Clean copy");
    setStatus("idle");
    setMessage("");
  }

  return (
    <section className="workbench" aria-labelledby="cleaner-heading">
      <div className="workbench-head">
        <div>
          <span className="status-pill"><ShieldCheck aria-hidden="true" /> Full web implementation</span>
          <h2 id="cleaner-heading">Inspect first. Clean what is there.</h2>
        </div>
        {tab === "text" ? (
          <button className="text-button" type="button" onClick={() => setText(EXAMPLE)}><Clipboard aria-hidden="true" /> Try an example</button>
        ) : <span className="file-limit">Supported files up to 3 MB</span>}
      </div>

      <div className="tool-tabs" role="tablist" aria-label="Cleaner input">
        <button type="button" role="tab" aria-selected={tab === "text"} className={tab === "text" ? "active" : ""} onClick={() => setTab("text")}><Type aria-hidden="true" /> Text layers A and B</button>
        <button type="button" role="tab" aria-selected={tab === "file"} className={tab === "file" ? "active" : ""} onClick={() => setTab("file")}><FileUp aria-hidden="true" /> Files and metadata</button>
      </div>

      {tab === "text" ? (
        <div role="tabpanel" className="tool-panel">
          <div className="editor-grid">
            <div className="editor-panel">
              <div className="panel-label"><label htmlFor="source-text">Original text</label><span className={characters > 50_000 ? "over-limit" : ""}>{characters.toLocaleString()} / 50,000</span></div>
              <textarea id="source-text" value={text} onChange={(event) => { setText(event.target.value); setTextInspection(null); }} placeholder="Paste text you own or are authorized to process..." spellCheck="true" />
            </div>
            <div className="editor-panel result-panel">
              <div className="panel-label"><span>{outputLabel}</span>{cleanedText ? <button className="copy-button" type="button" onClick={copyResult}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button> : null}</div>
              <textarea value={cleanedText} readOnly placeholder="Your cleaned text or Layer B prompt will appear here." aria-label={outputLabel} />
            </div>
          </div>

          {stats ? <div className="stats-row" aria-live="polite">
            <div><strong>{stats.removedCount}</strong><span>Unicode characters removed</span></div>
            <div><strong>{stats.replacedCount}</strong><span>spaces or lookalikes normalized</span></div>
            <div><strong>{stats.inputLength === stats.outputLength ? "Same" : `${stats.inputLength} to ${stats.outputLength}`}</strong><span>character length</span></div>
          </div> : null}

          {textInspection ? <InspectionCard report={textInspection} /> : null}

          <div className="rewrite-card">
            <div>
              <span className="status-pill"><Sparkles aria-hidden="true" /> Layer B</span>
              <h3>Best-effort statistical rewrite</h3>
              <p>Statistical watermarks live in token choices. A substantial rewrite may reduce them, but it changes the writing and cannot guarantee a detector result.</p>
            </div>
            <div className="rewrite-controls">
              <label htmlFor="rewrite-strength">Rewrite method</label>
              <select id="rewrite-strength" value={rewriteStrength} onChange={(event) => setRewriteStrength(event.target.value as typeof rewriteStrength)}>
                <option value="paraphrase">Paraphrase every sentence</option>
                <option value="backtranslate">Back-translate through French</option>
                <option value="structural">Outline, then regenerate</option>
              </select>
              <small>{rewriteEnabled === null ? "Checking hosted model..." : rewriteEnabled ? `Hosted model: ${rewriteModel}` : "Hosted model unavailable. Prompt generation still works."}</small>
            </div>
          </div>
        </div>
      ) : (
        <div role="tabpanel" className="tool-panel">
          <label className="upload-box" htmlFor="cleaner-file">
            <FileUp aria-hidden="true" />
            <strong>{file ? file.name : "Choose a supported file"}</strong>
            <span>{file ? formatBytes(file.size) : "PNG, JPEG, SVG, PDF, DOCX, ODT, HTML, Markdown, and UTF-8 text"}</span>
            <input id="cleaner-file" className="visually-hidden" type="file" accept={ACCEPTED_FILES} onChange={(event) => { setFile(event.target.files?.[0] || null); setFileInspection(null); setFileReport(null); setMessage(""); }} />
          </label>
          {fileInspection ? <FileInspectionCard title="Inspection report" inspection={fileInspection} /> : null}
          {fileReport ? <CleanReportCard report={fileReport} /> : null}
        </div>
      )}

      <div className="controls-grid">
        <div className="control-group">
          <label htmlFor="source">Where did the content come from?</label>
          <select id="source" value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="unknown">Prefer not to say</option>
            <option value="claude">Claude</option>
            <option value="chatgpt">ChatGPT / OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="other">Another source</option>
          </select>
          <details>
            <summary>Advanced Unicode normalization</summary>
            <label className="check-row"><input type="checkbox" checked={normalizeConfusables} onChange={(event) => setNormalizeConfusables(event.target.checked)} /><span><strong>Normalize Latin lookalikes</strong><small>May change Cyrillic or full-width characters that resemble Latin text.</small></span></label>
            <label className="check-row"><input type="checkbox" checked={nfkc} onChange={(event) => setNfkc(event.target.checked)} /><span><strong>Apply Unicode NFKC</strong><small>Useful for strict hygiene, but can alter special formatting.</small></span></label>
          </details>
        </div>

        <div className="consent-card">
          <h3>Before you clean</h3>
          <label className="check-row"><input type="checkbox" checked={ownsContent} onChange={(event) => setOwnsContent(event.target.checked)} /><span>I own this content or I am authorized to process it.</span></label>
          <label className="check-row"><input type="checkbox" checked={storageConsent} onChange={(event) => setStorageConsent(event.target.checked)} /><span>I agree that Aiso may store text inputs and outputs, or a binary file&apos;s name and cleaning report, for 30 days.</span></label>
          <p>Inspection alone is not stored. Do not submit secrets, sensitive personal data, or confidential client material. Read the <Link href="/privacy">privacy policy</Link>.</p>
        </div>
      </div>

      <div className="action-row">
        {tab === "text" ? <>
          <button className="secondary-button" type="button" disabled={!canInspectText} onClick={inspectCurrentText}><FlaskConical aria-hidden="true" /> Inspect Layer A</button>
          <button className="primary-button" type="button" disabled={!canCleanText} onClick={cleanTextLayer}>{status === "working" ? <LoaderCircle className="spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}Clean Layer A</button>
          {rewriteEnabled ? <button className="primary-button rewrite-button" type="button" disabled={!canCleanText} onClick={() => void runRewrite(false)}><Languages aria-hidden="true" /> Rewrite Layer B</button> : null}
          <button className="secondary-button" type="button" disabled={!canInspectText || !ownsContent} onClick={() => void runRewrite(true)}><Sparkles aria-hidden="true" /> Generate Layer B prompt</button>
          {(text || cleanedText) ? <button className="secondary-button" type="button" onClick={resetText}><RotateCcw aria-hidden="true" /> Start over</button> : null}
        </> : <>
          <button className="secondary-button" type="button" disabled={!canInspectFile} onClick={inspectCurrentFile}><FileSearch aria-hidden="true" /> Inspect file</button>
          <button className="primary-button" type="button" disabled={!canCleanFile} onClick={cleanCurrentFile}>{status === "working" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Download aria-hidden="true" />}Clean and download</button>
        </>}
        {records.length ? <button className="danger-button" type="button" onClick={deleteRecords} disabled={status === "deleting"}><Trash2 aria-hidden="true" />{status === "deleting" ? "Deleting..." : `Delete ${records.length} stored ${records.length === 1 ? "record" : "records"}`}</button> : null}
      </div>
      {message ? <p className={`notice ${status === "error" ? "notice-error" : "notice-success"}`} role="status">{message}</p> : null}
    </section>
  );
}

function InspectionCard({ report }: { report: TextInspectReport }) {
  return <section className="inspection-card" aria-label="Unicode inspection report">
    <div className="inspection-heading"><div><strong>Layer A inspection</strong><span>{report.suspiciousTotal ? `${report.suspiciousTotal} suspicious characters` : "No suspicious Unicode found"}</span></div><span className={report.suspiciousTotal ? "risk-chip" : "clean-chip"}>{report.suspiciousTotal ? "Signals found" : "Clear"}</span></div>
    {report.hits.length ? <div className="findings-table" role="table" aria-label="Suspicious Unicode characters">
      {report.hits.slice(0, 20).map((hit) => <div className="finding-row" role="row" key={`${hit.codepoint}-${hit.kind}`}>
        <code>{hit.codepoint}</code><span>{hit.label.replace(`${hit.codepoint} `, "")}</span><small>{hit.kind.replace("_", " ")} | count {hit.count} | offsets {hit.sampleOffsets.join(", ")}</small>
      </div>)}
    </div> : null}
    <p>{report.notes[1]}</p>
  </section>;
}

function FileInspectionCard({ title, inspection }: { title: string; inspection: FileInspection }) {
  const signals = inspection.hasC2pa || inspection.hasAiMetadata || (inspection.text?.suspiciousTotal ?? 0) > 0;
  return <section className="inspection-card file-report" aria-label={title}>
    <div className="inspection-heading"><div><strong>{title}</strong><span>{inspection.format.toUpperCase()} | {inspection.kind}</span></div><span className={signals ? "risk-chip" : "clean-chip"}>{signals ? "Signals found" : "No supported signals"}</span></div>
    <div className="report-metrics"><span>C2PA <strong>{inspection.hasC2pa ? "Found" : "Not found"}</strong></span><span>AI metadata <strong>{inspection.hasAiMetadata ? "Found" : "Not found"}</strong></span><span>Unicode <strong>{inspection.text?.suspiciousTotal ?? 0}</strong></span></div>
    {inspection.findings.length ? <ul>{inspection.findings.slice(0, 20).map((finding, index) => <li key={`${index}-${finding}`}>{finding}</li>)}</ul> : <p>No metadata findings in the supported inspection channels.</p>}
    {inspection.notes.map((note, index) => <p key={`${index}-${note}`}>{note}</p>)}
  </section>;
}

function CleanReportCard({ report }: { report: FileReport }) {
  const residual = report.after.hasC2pa || report.after.hasAiMetadata || report.after.suspiciousUnicode > 0;
  return <section className="inspection-card file-report" aria-label="Clean and verify report">
    <div className="inspection-heading"><div><strong>Clean and verify report</strong><span>{report.format.toUpperCase()} | {formatBytes(report.bytesIn)} to {formatBytes(report.bytesOut)}</span></div><span className={residual ? "risk-chip" : "clean-chip"}>{residual ? "Review residuals" : "Verified clean"}</span></div>
    <div className="report-columns"><div><h4>Actions</h4><ul>{report.actions.map((action, index) => <li key={`${index}-${action}`}>{action}</li>)}</ul></div><div><h4>Post-clean inspection</h4><div className="report-metrics vertical"><span>C2PA <strong>{report.after.hasC2pa ? "Still found" : "Not found"}</strong></span><span>AI metadata <strong>{report.after.hasAiMetadata ? "Still found" : "Not found"}</strong></span><span>Unicode <strong>{report.after.suspiciousUnicode}</strong></span></div></div></div>
  </section>;
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return decodeURIComponent(Array.from(atob(base64), (character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
}

function formatBytes(bytes: number) {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
