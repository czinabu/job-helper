"use client";

import { useRef, useState } from "react";
import {
  STATUSES,
  download,
  newApplication,
  parseImport,
  toCsv,
  today,
  useApplications,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications";

export default function ApplicationsPage() {
  const [apps, setApps, loaded] = useApplications();
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [editing, setEditing] = useState<Application | null>(null);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const shown = apps.filter((a) => filter === "all" || a.status === filter);
  const dueCount = apps.filter(
    (a) => a.followUp && a.followUp <= today() && (a.status === "applied" || a.status === "heard_back"),
  ).length;

  function save(app: Application) {
    const exists = apps.some((a) => a.id === app.id);
    setApps(exists ? apps.map((a) => (a.id === app.id ? app : a)) : [app, ...apps]);
    setEditing(null);
  }

  async function importFile(file: File) {
    try {
      const incoming = parseImport(await file.text(), file.name);
      const known = new Set(apps.map((a) => a.id));
      const fresh = incoming.filter((a) => !known.has(a.id));
      setApps([...fresh, ...apps]);
      setMessage(`Added ${fresh.length} application${fresh.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't read that file.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Application log</h1>
        <p className="mt-1 text-sm text-muted">
          Keep track of where you applied and what you heard back. This list is saved only in this
          browser, so download a backup now and then.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn" onClick={() => setEditing(newApplication())}>
          Add application
        </button>
        <select
          className="field w-auto"
          aria-label="Show"
          value={filter}
          onChange={(e) => setFilter(e.target.value as ApplicationStatus | "all")}
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUSES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            className="btn-secondary"
            disabled={apps.length === 0}
            onClick={() => download("job-applications.csv", toCsv(apps), "text/csv")}
          >
            Download CSV
          </button>
          <button
            className="btn-secondary"
            disabled={apps.length === 0}
            onClick={() =>
              download("job-applications.json", JSON.stringify(apps, null, 2), "application/json")
            }
          >
            Download JSON
          </button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {message && (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      )}
      {dueCount > 0 && (
        <p className="rounded-md border border-accent p-3 text-sm">
          {dueCount} application{dueCount === 1 ? " is" : "s are"} ready for a follow-up.
        </p>
      )}

      {editing && <Editor app={editing} onSave={save} onCancel={() => setEditing(null)} />}

      {loaded && apps.length === 0 && !editing && (
        <p className="rounded-lg border border-line bg-card p-5 text-sm text-muted">
          Nothing here yet. Add an application, or tailor your resume to a job and choose
          &ldquo;Save to log&rdquo;.
        </p>
      )}

      <ul className="space-y-3">
        {shown.map((a) => {
          const due = a.followUp && a.followUp <= today() && (a.status === "applied" || a.status === "heard_back");
          return (
            <li key={a.id} className="rounded-lg border border-line p-4 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium">{a.role || "Untitled role"}</span>
                <span className="text-muted">{a.company}</span>
                <select
                  className="field ml-auto w-auto"
                  aria-label={`Status for ${a.role} at ${a.company}`}
                  value={a.status}
                  onChange={(e) => save({ ...a, status: e.target.value as ApplicationStatus })}
                >
                  {Object.entries(STATUSES).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-muted">
                {a.dateApplied && `Applied ${a.dateApplied}`}
                {a.followUp && (
                  <span className={due ? "text-bad" : ""}> · Follow up {a.followUp}</span>
                )}
                {a.link && (
                  <>
                    {" · "}
                    <a className="text-accent underline" href={safeUrl(a.link)} target="_blank" rel="noreferrer">
                      Job posting
                    </a>
                  </>
                )}
              </p>
              {a.notes && <p className="mt-2 whitespace-pre-wrap">{a.notes}</p>}
              <div className="mt-2 flex gap-4 text-xs">
                <button className="text-accent underline" onClick={() => setEditing(a)}>
                  Edit
                </button>
                <button
                  className="text-muted underline"
                  onClick={() => {
                    if (confirm(`Delete ${a.role || "this"} at ${a.company}?`))
                      setApps(apps.filter((x) => x.id !== a.id));
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Only http(s) links are clickable, so an imported file can't plant a javascript: link. */
function safeUrl(link: string) {
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(link) ? link : `https://${link}`;
  return /^https?:\/\//i.test(withScheme) ? withScheme : "#";
}

function Editor({
  app,
  onSave,
  onCancel,
}: {
  app: Application;
  onSave: (a: Application) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(app);
  const set = (patch: Partial<Application>) => setDraft({ ...draft, ...patch });
  const ok = draft.company.trim() || draft.role.trim();

  return (
    <form
      className="space-y-3 rounded-lg border border-accent bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSave(draft);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="field" placeholder="Company" value={draft.company} onChange={(e) => set({ company: e.target.value })} />
        <input className="field" placeholder="Job title" value={draft.role} onChange={(e) => set({ role: e.target.value })} />
        <input className="field sm:col-span-2" placeholder="Link to the job posting" value={draft.link} onChange={(e) => set({ link: e.target.value })} />
        <label className="text-xs text-muted">
          Date applied
          <input type="date" className="field mt-1" value={draft.dateApplied} onChange={(e) => set({ dateApplied: e.target.value })} />
        </label>
        <label className="text-xs text-muted">
          Follow up on
          <input type="date" className="field mt-1" value={draft.followUp} onChange={(e) => set({ followUp: e.target.value })} />
        </label>
        <label className="text-xs text-muted">
          Status
          <select className="field mt-1" value={draft.status} onChange={(e) => set({ status: e.target.value as ApplicationStatus })}>
            {Object.entries(STATUSES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea className="field h-20" placeholder="Notes: contacts, interview dates, salary, anything useful" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
      <div className="flex gap-3">
        <button className="btn" type="submit" disabled={!ok}>
          Save
        </button>
        <button className="btn-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
