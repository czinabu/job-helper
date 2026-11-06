"use client";

import { useEffect, useState } from "react";
import { openPdf, resumeFileKind } from "./parseResume";

/**
 * The person's profile links (LinkedIn, GitHub, a website). Resume text often has only the bare words
 * "LinkedIn" and "GitHub", because copying text out of a file drops the links behind them. These URLs
 * are kept in this browser and turned back into clickable links when a resume is downloaded.
 */
export interface ProfileLinks {
  linkedin: string;
  github: string;
  website: string;
}

export const EMPTY_LINKS: ProfileLinks = { linkedin: "", github: "", website: "" };

export const LINK_FIELDS: { key: keyof ProfileLinks; label: string; placeholder: string }[] = [
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/your-name" },
  { key: "github", label: "GitHub", placeholder: "github.com/your-name" },
  { key: "website", label: "Website", placeholder: "your-site.com" },
];

const KEY = "job-helper:links";
const EVENT = "job-helper:links-changed";

export function loadLinks(): ProfileLinks {
  try {
    return { ...EMPTY_LINKS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { ...EMPTY_LINKS };
  }
}

export function saveLinks(links: ProfileLinks) {
  try {
    localStorage.setItem(KEY, JSON.stringify(links));
  } catch {
    // Storage can be blocked (private windows); the links still work until the page closes.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: links }));
}

/** The saved links, kept in step across every component that shows them. */
export function useProfileLinks() {
  const [links, setLinks] = useState<ProfileLinks>(EMPTY_LINKS);
  useEffect(() => {
    setLinks(loadLinks());
    const onChange = (e: Event) => setLinks((e as CustomEvent<ProfileLinks>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  const update = (next: ProfileLinks) => {
    setLinks(next);
    saveLinks(next);
  };
  return [links, update] as const;
}

/** "linkedin.com/in/x" -> "https://linkedin.com/in/x". Returns "" for anything that isn't a web address. */
export function normalizeUrl(raw: string): string {
  const s = raw.trim();
  if (!s || (/^[a-z][a-z\d+.-]*:/i.test(s) && !/^https?:\/\//i.test(s))) return ""; // mailto:, tel:, and so on
  const url = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(url);
    return u.hostname.includes(".") && !u.username ? u.toString().replace(/\/$/, "") : "";
  } catch {
    return "";
  }
}

/** Sorts found URLs into the three fields. The first unknown http(s) address that isn't a mail link counts as the website. */
export function classifyUrls(urls: string[]): Partial<ProfileLinks> {
  const found: Partial<ProfileLinks> = {};
  for (const raw of urls) {
    const url = normalizeUrl(raw);
    if (!url) continue;
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.endsWith("linkedin.com")) found.linkedin ??= url;
    else if (host === "github.com") found.github ??= url;
    else if (!/(^|\.)(google|gmail|outlook|yahoo|icloud)\.com$/.test(host)) found.website ??= url;
  }
  return found;
}

const URL_IN_TEXT = /\b(?:https?:\/\/|www\.)[^\s<>()"'•|]+|\b(?:[a-z]{2,3}\.)?linkedin\.com\/[^\s<>()"'•|]+|\bgithub\.com\/[^\s<>()"'•|]+/gi;

/** URLs behind links in an uploaded resume (PDF link annotations, Word hyperlinks), plus any written out in its text. */
export async function findFileUrls(file: File, text = ""): Promise<string[]> {
  const urls: string[] = [...(text.match(URL_IN_TEXT) ?? [])];
  try {
    const kind = resumeFileKind(file.name);
    if (kind === "pdf") {
      const pdf = await openPdf(file);
      for (let n = 1; n <= Math.min(pdf.numPages, 3); n++) {
        const annots: { subtype?: string; url?: string; unsafeUrl?: string }[] = await (await pdf.getPage(n)).getAnnotations();
        for (const a of annots) if (a.subtype === "Link" && (a.url || a.unsafeUrl)) urls.push((a.url || a.unsafeUrl)!);
      }
    } else if (kind === "docx") {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const rels = (await zip.file("word/_rels/document.xml.rels")?.async("string")) ?? "";
      for (const m of rels.matchAll(/Target="([^"]+)"[^>]*TargetMode="External"/g)) urls.push(m[1].replace(/&amp;/g, "&"));
    }
  } catch {
    // Links are a bonus; the person can type them in.
  }
  return urls.filter((u) => !/^mailto:/i.test(u));
}

/** Fills empty fields from a newly uploaded resume, leaving anything the person already typed alone. */
export async function fillLinksFromFile(file: File, text: string) {
  const found = classifyUrls(await findFileUrls(file, text));
  const current = loadLinks();
  const next = { ...current };
  for (const k of Object.keys(EMPTY_LINKS) as (keyof ProfileLinks)[]) if (!next[k] && found[k]) next[k] = found[k]!;
  if (JSON.stringify(next) !== JSON.stringify(current)) saveLinks(next);
}

export type LinkNeed = "mentioned" | "recommended";

/** The lines above the first "## " heading (or the first few lines, if there's none): where contact links go. */
function contactBlock(text: string): string {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const heading = lines.findIndex((l) => /^\s*#{1,6}\s/.test(l));
  return (heading < 0 ? lines.slice(0, 6) : lines.slice(0, heading)).join("\n");
}

/**
 * Which of LinkedIn and GitHub to ask the person for. A link is needed when the contact line names it with no
 * address behind it ("mentioned"), or when it isn't there at all but would help for this job ("recommended").
 * Nothing is needed once the person has saved the address or the resume already has it written out.
 */
export function linksToAskFor(
  resume: string,
  links: ProfileLinks,
  advice?: { linkedin: string; github: string },
): Partial<Record<"linkedin" | "github", LinkNeed>> {
  const contact = contactBlock(resume);
  const out: Partial<Record<"linkedin" | "github", LinkNeed>> = {};
  const checks = [
    { key: "linkedin", host: /linkedin\.com\//i, word: /(^|[^\w/.])LinkedIn(?!\w)/i },
    { key: "github", host: /github\.com\//i, word: /(^|[^\w/.])GitHub(?!\w)/i },
  ] as const;
  for (const c of checks) {
    if (normalizeUrl(links[c.key]) || c.host.test(contact)) continue;
    if (c.word.test(contact)) out[c.key] = "mentioned";
    else if (advice?.[c.key] === "Recommended") out[c.key] = "recommended";
  }
  return out;
}
