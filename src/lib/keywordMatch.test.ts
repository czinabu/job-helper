import { describe, expect, test } from "vitest";
import { EXAMPLE_INPUTS } from "./example";
import { extractKeywords, hasKeyword, matchKeywords, missingKeywords, weighLines } from "./keywordMatch";

const names = (list: { keyword: string }[]) => list.map((k) => k.keyword);
const find = <T extends { keyword: string }>(list: T[], keyword: string) => list.find((k) => k.keyword === keyword);

describe("hasKeyword", () => {
  test("matches whole words and phrases, ignoring case and spacing", () => {
    expect(hasKeyword("Built dashboards in Power   BI", "power bi")).toBe(true);
    expect(hasKeyword("Excellent communicator", "Excel")).toBe(false);
  });

  test("handles symbols in terms", () => {
    expect(hasKeyword("Wrote C++ and C# services on .NET", "C++")).toBe(true);
    expect(hasKeyword("Wrote C++ and C# services on .NET", ".NET")).toBe(true);
    expect(hasKeyword("Wrote C services", "C++")).toBe(false);
  });

  test("treats straight and curly apostrophes alike", () => {
    expect(hasKeyword("Bachelor’s degree required", "Bachelor's degree")).toBe(true);
  });

  test("can match case-sensitively", () => {
    expect(hasKeyword("Ready to go live", "Go", true)).toBe(false);
    expect(hasKeyword("Services written in Go", "Go", true)).toBe(true);
  });
});

describe("weighLines", () => {
  test("weighs sections by their headings", () => {
    const lines = weighLines(`Warehouse Associate
About us
We are a family-owned company.
Responsibilities
- Pick and pack orders
Requirements:
- Forklift certification
Nice to have
- CDL
Benefits
- Paid time off`);
    const weightOf = (text: string) => lines.find((l) => l.text.includes(text))?.weight;
    expect(weightOf("family-owned")).toBe(0);
    expect(weightOf("Pick and pack")).toBe(2);
    expect(weightOf("Forklift")).toBe(3);
    expect(weightOf("CDL")).toBe(1);
    expect(weightOf("Paid time off")).toBe(0);
  });

  test("a line's own wording can lower or raise it", () => {
    const lines = weighLines(`Responsibilities
- Python is a plus
- Must hold a valid driver's license`);
    expect(lines[1].weight).toBe(1);
    expect(lines[2].weight).toBe(3);
  });

  test("a 'Label: value' line or a sentence isn't a heading", () => {
    const lines = weighLines(`Requirements
Schedule: Full-time
Sales experience
- Salesforce`);
    expect(lines.every((l) => l.weight === 3)).toBe(true);
  });

  test("a posting with no headings counts as the job", () => {
    expect(weighLines("We need someone who knows SQL.").map((l) => l.weight)).toEqual([2]);
  });
});

describe("extractKeywords", () => {
  test("skips the company blurb and benefits", () => {
    const keywords = names(
      extractKeywords(`About us
We run on Salesforce and Slack.
Requirements
- SQL
Benefits
- Free Python classes`),
    );
    expect(keywords).toContain("SQL");
    expect(keywords).not.toContain("Salesforce");
    expect(keywords).not.toContain("Python");
  });

  test("marks nice-to-haves as preferred and weighs them less", () => {
    const keywords = extractKeywords(`Requirements
- Forklift certification
Nice to have
- Class A CDL`);
    const forklift = find(keywords, "Forklift")!;
    const cdl = find(keywords, "CDL Class A")!;
    expect(forklift.importance).toBe("required");
    expect(cdl.importance).toBe("preferred");
    expect(forklift.weight).toBeGreaterThan(cdl.weight);
  });

  test("doesn't count short or word-like names inside ordinary text", () => {
    const keywords = names(extractKeywords("Go to market with our sales team and read our R&D notes. Epic customer service."));
    expect(keywords).not.toContain("Go");
    expect(keywords).not.toContain("R");
    expect(keywords).not.toContain("Epic Systems");
    expect(keywords).toContain("Customer service");
    expect(names(extractKeywords("Requirements\n- Languages: Go, Rust, or R"))).toEqual(
      expect.arrayContaining(["Go", "Rust", "R"]),
    );
  });

  test("drops a term that only appears inside a longer one", () => {
    const keywords = names(extractKeywords("Requirements\n- SQL Server administration\n- Power BI"));
    expect(keywords).toContain("SQL Server");
    expect(keywords).not.toContain("SQL");
    expect(keywords).toContain("Power BI");
    expect(keywords).not.toContain("Business intelligence");
  });

  test("keeps a short term the posting also uses on its own", () => {
    const keywords = names(extractKeywords("Requirements\n- SQL Server\n- Strong SQL"));
    expect(keywords).toContain("SQL Server");
    expect(keywords).toContain("SQL");
  });

  test("adds phrases the posting repeats, but not names", () => {
    const keywords = extractKeywords(`Acme Robotics is hiring.
Responsibilities
- Run quarterly route audits for Acme Robotics
- Report route audits to the regional manager`);
    expect(find(keywords, "route audits")?.kind).toBe("phrase");
    expect(names(keywords)).not.toContain("Acme Robotics");
  });

  test("puts the most important keywords first", () => {
    const keywords = extractKeywords("Requirements\n- SQL\nNice to have\n- Python");
    expect(names(keywords)).toEqual(["SQL", "Python"]);
  });
});

describe("matchKeywords", () => {
  test("scores the sample resume against the sample posting", () => {
    const { background } = EXAMPLE_INPUTS;
    const match = matchKeywords(EXAMPLE_INPUTS.resume, EXAMPLE_INPUTS.jobPosting, `${background.skills}\n${background.notes}`);
    expect(match.score).toBeGreaterThan(0);
    expect(match.score).toBeLessThan(60);
    expect(names(match.found)).toEqual(expect.arrayContaining(["Excel", "Pivot tables", "Inventory", "Shrink"]));
    expect(names(match.missing)).toEqual(expect.arrayContaining(["SQL", "Tableau", "Power BI", "Python"]));
    // On Sam's background notes, but not the resume itself: easy, honest wins.
    expect(find(match.missing, "SQL")?.inBackground).toBe(true);
    expect(find(match.missing, "Power BI")?.inBackground).toBe(false);
    expect(find(match.missing, "Python")?.importance).toBe("preferred");
  });

  test("counts other spellings of the same term", () => {
    const match = matchKeywords("B.S. in Biology, 2020", "Requirements\n- Bachelor's degree");
    expect(match.score).toBe(100);
  });

  test("weights the score by importance", () => {
    const posting = "Requirements\n- SQL\nNice to have\n- Python";
    expect(matchKeywords("SQL", posting).score).toBe(75);
    expect(matchKeywords("Python", posting).score).toBe(25);
  });

  test("has no score when the posting names nothing it knows", () => {
    const match = matchKeywords("anything", "We are hiring a great person.");
    expect(match.score).toBeNull();
    expect(match.keywords).toEqual([]);
  });

  test("missingKeywords lists what the resume lacks, most important first", () => {
    expect(missingKeywords("Excel", "Requirements\n- SQL\n- Excel\nNice to have\n- Python")).toEqual(["SQL", "Python"]);
  });
});
