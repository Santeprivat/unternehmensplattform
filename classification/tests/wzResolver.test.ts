import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { openWzDb } from "@resolver/db";
import { WzResolver } from "@resolver/wzResolver";
import path from "path";

beforeAll(() => {
  execSync("npm run build:wz-db", {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env}
  });
});

describe("WzResolver", () => {
  it("resolves software activity to WZ via synonyms", () => {
    const { db, close } = openWzDb();
    const r = new WzResolver(db);

    const res = r.assess({ text: "Wir machen Softwareentwicklung und App Entwicklung" });
    console.log("RESOLVED WZ:", res.resolvedWz);
    close();

    expect(res.clarification.needed).toBe(false);
    expect(res.resolvedWz?.code).toBe("62.01");
    expect(res.resolvedWz?.confidence).toBe("HIGH");
    expect(res.candidates.length).toBeGreaterThan(0);
  });

  it("emits MDR hint when tags indicate medical device context", () => {
    const { db, close } = openWzDb();
    const r = new WzResolver(db);

    const res = r.assess({ text: "Softwareentwicklung", tags: ["medical_device"] });
    close();

    expect(res.clarification.needed).toBe(false);
    expect(res.hints.some((h) => h.id === "MDR_HINT")).toBe(true);
  });
});

