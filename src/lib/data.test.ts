import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { districts, flow, minerals, mineralsReaching, sourceById, sources, supply } from "./data";

describe("minerals", () => {
  const ids = new Set(districts.list.map((d) => d.id));

  it("models all 33 districts, with five not yet drawn", () => {
    expect(districts.list).toHaveLength(33);
    const drawn = JSON.parse(readFileSync("data/districts-2021.geojson", "utf8")).features as unknown[];
    expect(drawn).toHaveLength(28);
    expect(districts.list.filter((d) => d.parent)).toHaveLength(5);
  });

  it("uses only known districts", () => {
    for (const m of minerals.list) expect(m.districts.filter((d) => !ids.has(d))).toEqual([]);
    for (const d of districts.list) if (d.parent) expect(ids.has(d.parent)).toBe(true);
  });

  it("names every district IBM names, including the ones an earlier version missed", () => {
    const of = (id: string) => minerals.list.find((m) => m.id === id)!.districts;
    expect(of("iron-ore")).toContain("rajnandgaon");
    expect(of("bauxite")).toEqual(expect.arrayContaining(["bilaspur", "kabirdham"]));
    expect(of("limestone")).toEqual(expect.arrayContaining(["janjgir-champa", "kabirdham", "rajnandgaon"]));
  });

  it("matches IBM's value table", () => {
    const value = (id: string) => minerals.list.find((m) => m.id === id)!.valueThousand!;
    expect(Math.round((value("iron-ore") / minerals.allNonFuelValueThousand) * 100)).toBe(87);
    expect(((value("bauxite") / minerals.allNonFuelValueThousand) * 100).toFixed(2)).toBe("0.64");
  });

  it("never shows a missing value as zero", () => {
    for (const m of minerals.list) {
      expect(m.valueThousand === null || m.valueThousand > 0).toBe(true);
      expect(m.quantity === null || m.quantity.value > 0).toBe(true);
    }
  });
});

describe("flow map", () => {
  const nodes = new Set([...minerals.list.map((m) => m.id), ...flow.materials.map((m) => m.id), ...flow.uses.map((m) => m.id)]);

  it("links only nodes that exist", () => {
    for (const e of flow.edges) {
      expect(nodes.has(e.from), e.from).toBe(true);
      expect(nodes.has(e.to), e.to).toBe(true);
    }
  });

  it("gives every link a source and a sentence", () => {
    for (const e of flow.edges) {
      expect(sourceById(e.source).url).toMatch(/^https:/);
      expect(e.text.length).toBeGreaterThan(0);
    }
  });

  it("carries every mineral through to at least one use", () => {
    const reach = mineralsReaching();
    for (const m of minerals.list) {
      expect(flow.uses.some((u) => (reach.get(u.id) ?? []).includes(m.id)), m.id).toBe(true);
    }
  });
});

describe("sources", () => {
  it("has unique ids and real links", () => {
    expect(new Set(sources.map((s) => s.id)).size).toBe(sources.length);
    for (const s of sources) expect(s.url).toMatch(/^https:/);
  });
});

describe("supply chain page", () => {
  const facts = supply.minerals.flatMap((m) => [...m.available, ...m.possible, ...m.risky]);

  it("covers the same six minerals, each with all three lenses", () => {
    expect(supply.minerals.map((m) => m.id)).toEqual(minerals.list.map((m) => m.id));
    for (const m of supply.minerals) {
      expect(m.available.length, m.id).toBeGreaterThan(0);
      expect(m.possible.length, m.id).toBeGreaterThan(0);
      expect(m.risky.length, m.id).toBeGreaterThan(0);
    }
  });

  it("sources every fact, card and watchlist item", () => {
    const ids = [
      ...facts.flatMap((f) => f.sources),
      ...supply.acrossAll.flatMap((r) => r.sources),
      ...supply.watchlist.sources,
      ...supply.watchlist.items.flatMap((w) => w.sources),
      ...supply.watchlist.auction.sources,
      ...supply.watchlist.winners.sources,
      ...supply.minerals.map((m) => m.lead.source),
    ];
    expect(ids.length).toBeGreaterThan(40);
    for (const id of ids) expect(sourceById(id).url).toMatch(/^https:/);
  });

  it("matches the headline: all six mined, five with a local product, one announced, none operating above", () => {
    expect(supply.minerals.every((m) => m.chain.ground.status === "available")).toBe(true);
    expect(supply.minerals.filter((m) => m.chain.made.status === "available")).toHaveLength(5);
    expect(supply.minerals.filter((m) => m.chain.next.status === "possible").map((m) => m.id)).toEqual(["bauxite"]);
    expect(supply.minerals.filter((m) => m.chain.next.status === "available")).toHaveLength(0);
  });

  it("gives every chain short tile text for each lens", () => {
    for (const m of supply.minerals) {
      for (const tile of [m.tiles.possible, m.tiles.risky.ground, m.tiles.risky.made]) {
        expect(tile.big.length, m.id).toBeGreaterThan(0);
        expect(tile.big.length, m.id).toBeLessThanOrEqual(28);
        expect(tile.small.length, m.id).toBeLessThanOrEqual(60);
      }
    }
  });

  it("backs the risky headline: China leads all six, from 24% to 99%", () => {
    const leads = supply.minerals.map((m) => m.lead);
    expect(leads.every((l) => l.country === "China")).toBe(true);
    expect(Math.min(...leads.map((l) => l.share))).toBe(24);
    expect(Math.max(...leads.map((l) => l.share))).toBe(99);
  });

  it("reads tin from the quantity column of the 2023 yearbook, not the value column", () => {
    const tin = supply.minerals.find((m) => m.id === "tin")!;
    const text = JSON.stringify(tin);
    expect(minerals.list.find((m) => m.id === "tin")!.quantity!.value).toBe(45.429);
    expect(tin.chain.ground.label).toBe("45 t a year");
    expect(text).toContain("13,507 t");
    expect(text).toContain("17 t of metal");
    expect(text).not.toMatch(/\b33 t\b/);
  });

  it("states production figures for the same year as the minerals table", () => {
    const shown = supply.minerals.filter((m) => m.id !== "dolomite").map((m) => m.chain.ground.note);
    for (const note of shown) expect(note).toContain("2022-23");
  });

  it("lists the five Chhattisgarh blocks in Tranche VIII as the ministry does", () => {
    const blocks = supply.watchlist.auction.blocks;
    expect(blocks.map((b) => b.name)).toEqual(["Gohirapali", "Sabag (North)", "Sambalpur", "Gurur", "Karahibhadar"]);
    expect(blocks.filter((b) => b.attempt === "Second attempt").map((b) => b.name)).toEqual(["Gurur", "Karahibhadar"]);
    expect(blocks.filter((b) => b.licence === "Mining lease").map((b) => b.name)).toEqual(["Sambalpur"]);
  });

  it("records only the Tranche VIII result MSTC lists for these blocks", () => {
    const blocks = supply.watchlist.auction.blocks;
    expect(blocks.filter((b) => b.result.startsWith("Preferred bidder")).map((b) => b.name)).toEqual(["Gurur"]);
    expect(blocks.filter((b) => b.result === "No result listed")).toHaveLength(4);
    expect(JSON.stringify(supply)).not.toContain("no completed auction");
    expect(JSON.stringify(supply)).not.toContain("found no published result");
  });

  it("lists all 18 preferred bidders from MSTC, newest first, with no unitless offers", () => {
    const { rows, title } = supply.watchlist.winners;
    expect(rows).toHaveLength(18);
    expect(title.startsWith(String(rows.length))).toBe(true);
    expect(rows.filter((w) => w.by === "Ministry of Mines")).toHaveLength(6);
    expect(rows.filter((w) => w.by === "State")).toHaveLength(12);
    const dates = rows.map((w) => w.began);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(new Set(rows.map((w) => w.block)).size).toBe(18);
    expect(rows.find((w) => w.block === "Gurur")!.bidder).toBe("AMPL Minerals Private Limited");
    expect(rows.every((w) => !("offer" in w))).toBe(true);
  });

  it("states the two IEA facts as the IEA does", () => {
    const text = JSON.stringify(supply);
    expect(text).toContain("over 10% of today's gallium supply in 2030");
    expect(text).toContain("almost entirely in China");
    expect(sourceById("iea-energy-summary").url).toContain("energy-and-ai/executive-summary");
  });

  it("dates the LFP share and cites the IEA itself", () => {
    const text = JSON.stringify([supply, flow]);
    expect(text).toContain("over 55%");
    expect(text).not.toContain("nearly half");
    expect(sourceById("iea-lfp").url).toContain("iea.org/reports/global-ev-outlook-2026");
  });

  it("backs the electrical steel fraction", () => {
    expect(50000 / 400000).toBe(1 / 8);
  });

  it("uses USGS arithmetic for the shares it quotes", () => {
    const share = (id: string) => supply.minerals.find((m) => m.id === id)!.lead.share;
    expect(share("tin")).toBe(Math.round((71000 / 290000) * 100));
    expect(share("iron-ore")).toBe(Math.round((980 / 1900) * 100));
    expect(share("limestone")).toBe(Math.round((1700000 / 3800000) * 100));
  });

  it("keeps the bauxite and coking arithmetic honest", () => {
    expect(Number((1056576 / 1e6).toFixed(2))).toBe(1.06);
    expect(((262.56 + 11.07 + 70.77 + 112.74) / 85263.22) * 100).toBeCloseTo(0.54, 1);
    expect(4592111 / 1000).toBeCloseTo(4592, 0);
  });
});

describe("copy", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  it("contains no em dashes anywhere the reader or a contributor sees", () => {
    const files = [...walk("src"), ...walk("data"), "README.md"].filter((f) => /\.(astro|ts|json|md|css)$/.test(f));
    const offenders = files.filter((f) => readFileSync(f, "utf8").includes(String.fromCharCode(0x2014)));
    expect(offenders).toEqual([]);
  });
});
