import { describe, expect, it } from "vitest";
import { adviseLinks } from "./linkAdvice";

describe("adviseLinks", () => {
  it("recommends GitHub for software roles", () => {
    expect(adviseLinks("Senior Software Engineer. Build services in Go and Python.")).toMatchObject({
      linkedin: "Recommended",
      github: "Recommended",
    });
  });

  it("recommends GitHub when the posting names two or more languages", () => {
    expect(adviseLinks("Analyst role using Python and pandas daily.").github).toBe("Recommended");
  });

  it("makes GitHub optional for analyst and IT roles", () => {
    expect(adviseLinks("Data analyst: SQL, Excel, Tableau dashboards.").github).toBe("Optional");
    expect(adviseLinks("IT help desk technician, SQL Server a plus.").github).toBe("Optional");
  });

  it("needs no GitHub for office roles, and LinkedIn is recommended", () => {
    expect(adviseLinks("Marketing coordinator. Manage campaigns and social media.")).toMatchObject({
      linkedin: "Recommended",
      github: "Not needed",
    });
  });

  it("makes LinkedIn optional for hourly and trade jobs", () => {
    expect(adviseLinks("Warehouse associate, $18/hr, forklift experience a plus.")).toMatchObject({
      linkedin: "Optional",
      github: "Not needed",
    });
  });

  it("recommends LinkedIn whenever the posting mentions it", () => {
    expect(adviseLinks("Line cook needed. Apply with your LinkedIn profile.").linkedin).toBe("Recommended");
  });

  it("uses the target role when the posting is short", () => {
    expect(adviseLinks("Apply now.", "Frontend developer").github).toBe("Recommended");
  });
});
