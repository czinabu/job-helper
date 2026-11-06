import { describe, expect, it } from "vitest";
import { checkFormat, dateStyles } from "./formatCheck";

const styleNames = (text: string) => dateStyles(text).styles.map((s) => s.name);

describe("dateStyles", () => {
  it("finds one style when every date matches", () => {
    expect(styleNames("Acme Jan 2020 – Mar 2023\nBeta Sept. 2017 – Dec 2019")).toEqual(["short month"]);
  });

  it("finds mixed styles", () => {
    expect(styleNames("Acme Jan 2020 – Present\nBeta 03/2017 - 12/2019\nSchool 2014 - 2018")).toEqual([
      "short month",
      "numeric month",
      "year only",
    ]);
  });

  it("tells full and short month names apart, but not May", () => {
    expect(styleNames("January 2020 – Jun 2021")).toEqual(["month name", "short month"]);
    expect(styleNames("Jan 2020 – May 2021\nMay 2016 – Dec 2019")).toEqual(["short month"]);
  });

  it("ignores phone numbers, single years, and prose", () => {
    const d = dateStyles("Call 555-123-2020. Graduated 2019. Kept up to current standards.");
    expect(d.count).toBe(0);
    expect(d.ongoing).toEqual([]);
  });

  it("collects the words used for ongoing jobs", () => {
    expect(dateStyles("Jan 2020 – Present\nJun 2017 – Current").ongoing).toEqual(["Present", "Current"]);
  });
});

describe("checkFormat dates", () => {
  const dates = (text: string) => checkFormat(text, null).checks.find((c) => c.id === "dates");

  it("warns about mixed styles and quotes them", () => {
    const c = dates("Acme Jan 2021 – Present\nBeta 06/2019 - 08/2020");
    expect(c?.status).toBe("warn");
    expect(c?.detail).toContain('"Jan 2021" and "06/2019"');
  });

  it("warns about Present and Current in the same resume", () => {
    expect(dates("Acme Jan 2021 – Present\nBeta Jun 2017 – Current")?.title).toBe("Current jobs worded differently");
  });

  it("passes consistent dates, and says nothing with fewer than two", () => {
    expect(dates("Acme Jan 2021 – Mar 2023\nBeta Jun 2017 – Dec 2019")?.status).toBe("pass");
    expect(dates("Acme since Jan 2021")).toBeUndefined();
  });
});
