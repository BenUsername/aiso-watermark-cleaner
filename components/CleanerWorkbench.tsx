"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Copy, LoaderCircle, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";

type Stats = { inputLength: number; outputLength: number; removedCount: number; replacedCount: number };
type StoredRecord = { id: string; deletionToken: string; expiresAt: string };

const EXAMPLE = "This\u200B sentence\u2060 looks normal, but\u00A0it contains invisible marks.";
const RECORD_STORAGE_KEY = "aiso-watermark-cleaner:last-record:v1";

export default function CleanerWorkbench() {
  const [text, setText] = useState("");
  const [source, setSource] = useState("unknown");
  const [ownsContent, setOwnsContent] = useState(false);
  const [storageConsent, setStorageConsent] = useState(false);
  const [normalizeConfusables, setNormalizeConfusables] = useState(false);
  const [nfkc, setNfkc] = useState(false);
  const [cleanedText, setCleanedText] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "cleaning" | "success" | "error" | "deleting">("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const characters = useMemo(() => Array.from(text).length, [text]);
  const canSubmit = text.trim().length > 0 && characters <= 50_000 && ownsContent && storageConsent && status !== "cleaning" && status !== "deleting";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECORD_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as StoredRecord[];
      const active = Array.isArray(parsed)
        ? parsed.filter((item) => item.id && item.deletionToken && new Date(item.expiresAt).getTime() > Date.now())
        : [];
      if (active.length === 0) {
        localStorage.removeItem(RECORD_STORAGE_KEY);
        return;
      }
      setRecords(active);
      setMessage(`${active.length} stored ${active.length === 1 ? "record" : "records"} can still be deleted from this browser.`);
    } catch {
      // Ignore unavailable or invalid browser storage.
    }
  }, []);

  async function clean() {
    setStatus("cleaning");
    setMessage("");
    setCopied(false);
    try {
      const response = await fetch("/api/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source, ownsContent, storageConsent, normalizeConfusables, nfkc }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Cleaning failed.");
      setCleanedText(payload.cleanedText);
      setStats(payload.stats);
      const nextRecords = [payload.record as StoredRecord, ...records].slice(0, 20);
      setRecords(nextRecords);
      try {
        localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(nextRecords));
      } catch {
        // The current session keeps the deletion token if browser storage is unavailable.
      }
      setStatus("success");
      setMessage(payload.stats.removedCount + payload.stats.replacedCount > 0
        ? "Clean copy ready. The activity record is stored for 30 days unless you delete it sooner."
        : "No removable Unicode marks were found. The activity record is stored for 30 days unless you delete it sooner.");
    } catch (cause) {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "The cleaner is temporarily unavailable.");
    }
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
        const response = await fetch(`/api/clean/${record.id}`, { method: "DELETE", headers: { "x-deletion-token": record.deletionToken } });
        return { record, deleted: response.ok || response.status === 404 };
      }));
      const remaining = results.filter((result) => !result.deleted).map((result) => result.record);
      setRecords(remaining);
      try { localStorage.removeItem(RECORD_STORAGE_KEY); } catch { /* Browser storage can be unavailable. */ }
      if (remaining.length > 0) {
        try { localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(remaining)); } catch { /* Browser storage can be unavailable. */ }
        throw new Error(`Deleted ${records.length - remaining.length} records. ${remaining.length} could not be deleted right now.`);
      }
      setStatus("success");
      setMessage("All stored activity records from this browser were deleted.");
    } catch (cause) {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "Deletion failed.");
    }
  }

  function reset() {
    setText("");
    setCleanedText("");
    setStats(null);
    setStatus("idle");
    setMessage("");
  }

  return (
    <section className="workbench" aria-labelledby="cleaner-heading">
      <div className="workbench-head">
        <div>
          <span className="status-pill"><ShieldCheck aria-hidden="true" /> Transparent storage</span>
          <h2 id="cleaner-heading">Paste, clean, copy.</h2>
        </div>
        <button className="text-button" type="button" onClick={() => setText(EXAMPLE)}><Clipboard aria-hidden="true" /> Try an example</button>
      </div>

      <div className="editor-grid">
        <div className="editor-panel">
          <div className="panel-label"><label htmlFor="source-text">Original text</label><span className={characters > 50_000 ? "over-limit" : ""}>{characters.toLocaleString()} / 50,000</span></div>
          <textarea id="source-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste text you own or are authorized to process..." spellCheck="true" />
        </div>
        <div className="editor-panel result-panel">
          <div className="panel-label"><span>Clean copy</span>{cleanedText && <button className="copy-button" type="button" onClick={copyResult}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button>}</div>
          <textarea value={cleanedText} readOnly placeholder="Your clean copy will appear here." aria-label="Cleaned text" />
        </div>
      </div>

      {stats && (
        <div className="stats-row" aria-live="polite">
          <div><strong>{stats.removedCount}</strong><span>characters removed</span></div>
          <div><strong>{stats.replacedCount}</strong><span>spaces or lookalikes normalized</span></div>
          <div><strong>{stats.inputLength === stats.outputLength ? "Same" : `${stats.inputLength} → ${stats.outputLength}`}</strong><span>character length</span></div>
        </div>
      )}

      <div className="controls-grid">
        <div className="control-group">
          <label htmlFor="source">Where did this text come from?</label>
          <select id="source" value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="unknown">Prefer not to say</option>
            <option value="claude">Claude</option>
            <option value="chatgpt">ChatGPT / OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="other">Another source</option>
          </select>
          <details>
            <summary>Advanced normalization</summary>
            <label className="check-row"><input type="checkbox" checked={normalizeConfusables} onChange={(event) => setNormalizeConfusables(event.target.checked)} /><span><strong>Normalize Latin lookalikes</strong><small>May change Cyrillic or full-width characters that resemble Latin text.</small></span></label>
            <label className="check-row"><input type="checkbox" checked={nfkc} onChange={(event) => setNfkc(event.target.checked)} /><span><strong>Apply Unicode NFKC</strong><small>Useful for strict text hygiene, but can alter special formatting.</small></span></label>
          </details>
        </div>

        <div className="consent-card">
          <h3>Before you clean</h3>
          <label className="check-row"><input type="checkbox" checked={ownsContent} onChange={(event) => setOwnsContent(event.target.checked)} /><span>I own this text or I am authorized to process it.</span></label>
          <label className="check-row"><input type="checkbox" checked={storageConsent} onChange={(event) => setStorageConsent(event.target.checked)} /><span>I agree that Aiso may store the original and cleaned text for 30 days to operate and improve this free tool.</span></label>
          <p>Do not paste secrets, personal data, health data, or confidential client material. Read the <Link href="/privacy">privacy policy</Link>.</p>
        </div>
      </div>

      <div className="action-row">
        <button className="primary-button" type="button" disabled={!canSubmit} onClick={clean}>
          {status === "cleaning" ? <LoaderCircle className="spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
          {status === "cleaning" ? "Cleaning..." : "Clean text"}
        </button>
        {(text || cleanedText) && <button className="secondary-button" type="button" onClick={reset}><RotateCcw aria-hidden="true" /> Start over</button>}
        {records.length > 0 ? <button className="danger-button" type="button" onClick={deleteRecords} disabled={status === "deleting"}><Trash2 aria-hidden="true" />{status === "deleting" ? "Deleting..." : `Delete ${records.length} stored ${records.length === 1 ? "record" : "records"}`}</button> : null}
      </div>
      {message && <p className={`notice ${status === "error" ? "notice-error" : "notice-success"}`} role="status">{message}</p>}
    </section>
  );
}
