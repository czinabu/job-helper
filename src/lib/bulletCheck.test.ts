import { describe, expect, test } from "vitest";
import { checkBullets, extractBullets } from "./bulletCheck";

const ids = (resume: string) => checkBullets(resume).flagged.map((b) => b.issues.map((i) => i.id));

describe("extractBullets", () => {
  test("keeps bullet lines and strips the symbol", () => {
    expect(extractBullets("EXPERIENCE\n- Led a team of 5\n• Cut costs 10%\nplain line")).toEqual([
      "Led a team of 5",
      "Cut costs 10%",
    ]);
  });
});

describe("checkBullets", () => {
  test("passes a strong bullet", () => {
    expect(checkBullets("- Cut produce waste 18% in one year").flagged).toEqual([]);
  });

  test("flags a weak opener and suggests verbs", () => {
    const [b] = checkBullets("- Responsible for opening the store each day for 3 years").flagged;
    expect(b.issues.map((i) => i.id)).toEqual(["weak-opener"]);
    expect(b.verbs.length).toBeGreaterThan(0);
  });

  test("flags a bullet with no number or result", () => {
    expect(ids("- Trained new hires on the point-of-sale system")).toEqual([["no-result"]]);
  });

  test("counts number words as results", () => {
    expect(checkBullets("- Trained dozens of new hires").flagged).toEqual([]);
  });

  test("flags passive voice but not adjectives like motivated", () => {
    expect(ids("- The weekly report was built by me for 6 stores")).toEqual([["passive"]]);
    expect(ids("- Was highly motivated to hit 120% of target")).toEqual([]);
  });

  test("flags first person and long bullets", () => {
    expect(ids("- I trained 12 new hires")).toEqual([["first-person"]]);
    const long = `- Managed ${"many different things ".repeat(12)}for 5 stores`;
    expect(ids(long)).toEqual([["too-long"]]);
  });

  test("lists openers used three or more times", () => {
    const report = checkBullets("- Managed 3 stores\n- Managed 14 people\n- Managed $2M budget");
    expect(report.repeated).toEqual([{ verb: "Managed", count: 3, alternatives: ["Led", "Directed", "Ran", "Oversaw"] }]);
  });

  test("dedupes gaps", () => {
    expect(checkBullets("- Led 3 teams", ["SQL", "sql", " Tableau "]).gaps).toEqual(["SQL", "Tableau"]);
  });
});
