"use client";

import { useCallback, useEffect, useState } from "react";

export const APPLICATIONS_KEY = "job-helper:applications";

export const STATUSES = {
  applied: "Applied",
  heard_back: "Heard back",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "No response",
} as const;

export type ApplicationStatus = keyof typeof STATUSES;

export interface Application {
  id: string;
  company: string;
  role: string;
  link: string;
  /** YYYY-MM-DD */
  dateApplied: string;
  status: ApplicationStatus;
  /** YYYY-MM-DD, or empty */
  followUp: string;
  notes: string;
}

export const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

export function newApplication(patch: Partial<Application> = {}): Application {
  return {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    link: "",
    dateApplied: today(),
    status: "applied",
    followUp: "",
    notes: "",
    ...patch,
  };
}

/** Keeps only well-formed fields, so imported files can't break the page. */
function clean(raw: unknown): Application | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const company = str(r.company);
  const role = str(r.role);
  if (!company && !role) return null;
  const status = str(r.status).toLowerCase().replace(/[\s-]+/g, "_");
  const byLabel = Object.entries(STATUSES).find(([, l]) => l.toLowerCase() === str(r.status).toLowerCase());
  return {
    id: str(r.id) || crypto.randomUUID(),
    company,
    role,
    link: str(r.link),
    dateApplied: str(r.dateApplied),
    status: status in STATUSES ? (status as ApplicationStatus) : ((byLabel?.[0] as ApplicationStatus) ?? "applied"),
    followUp: str(r.followUp),
    notes: typeof r.notes === "string" ? r.notes : "",
  };
}

export function loadApplications(): Application[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(clean).filter((a): a is Application => !!a) : [];
  } catch {
    return [];
  }
}

/** Adds one entry straight to storage (used by "Save to log" on the home page). */
export function addApplication(app: Application) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify([app, ...loadApplications()]));
}

/** The application log, remembered in this browser only. */
export function useApplications() {
  const [apps, setAppsState] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAppsState(loadApplications());
    setLoaded(true);
  }, []);

  const setApps = useCallback((next: Application[]) => {
    setAppsState(next);
    try {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked; the log still works until the tab closes.
    }
  }, []);

  return [apps, setApps, loaded] as const;
}

const CSV_COLUMNS = ["company", "role", "link", "dateApplied", "status", "followUp", "notes"] as const;

export function toCsv(apps: Application[]): string {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = apps.map((a) =>
    CSV_COLUMNS.map((c) => cell(c === "status" ? STATUSES[a.status] : a[c])).join(","),
  );
  return [CSV_COLUMNS.join(","), ...rows].join("\r\n");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

/** Reads a file exported from this page (JSON or CSV). Throws a readable error. */
export function parseImport(text: string, filename: string): Application[] {
  let raw: unknown[];
  if (filename.toLowerCase().endsWith(".csv")) {
    const [header, ...rows] = parseCsv(text.replace(/^﻿/, ""));
    if (!header) throw new Error("That file is empty.");
    raw = rows.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ""])));
  } else {
    try {
      const data = JSON.parse(text);
      raw = Array.isArray(data) ? data : data?.applications;
    } catch {
      throw new Error("That doesn't look like a Job Helper export.");
    }
  }
  if (!Array.isArray(raw)) throw new Error("That doesn't look like a Job Helper export.");
  const apps = raw.map(clean).filter((a): a is Application => !!a);
  if (apps.length === 0) throw new Error("No applications were found in that file.");
  return apps;
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
