import minerals from "../../data/minerals.json";
import flow from "../../data/flow.json";
import districts from "../../data/districts.json";
import supplyFile from "../../data/supply.json";
import sourcesFile from "../../data/sources.json";

export { minerals, flow, districts };
export const sources = sourcesFile.list;

type Fact = { text: string; sources: string[] };
type Status = "available" | "possible" | "notfound";
type Step = { status: Status; label: string; note: string };
type Tile = { big: string; small: string };
export const supply = supplyFile as unknown as Omit<typeof supplyFile, "minerals"> & {
  minerals: {
    id: string;
    chain: { ground: Step; made: Step; next: Step };
    lead: { country: string; share: number; of: string; year: string; source: string };
    tiles: { possible: Tile; risky: { ground: Tile; made: Tile } };
    available: Fact[];
    possible: Fact[];
    risky: Fact[];
  }[];
};

export function sourceById(id: string) {
  const found = sources.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown source: ${id}`);
  return found;
}

/** Which minerals reach a flow node, walking the edges forward from each mineral. */
export function mineralsReaching(): Map<string, string[]> {
  const reach = new Map<string, string[]>();
  for (const m of minerals.list) {
    const seen = new Set([m.id]);
    const queue = [m.id];
    while (queue.length) {
      const at = queue.shift()!;
      for (const e of flow.edges.filter((x) => x.from === at)) {
        if (!seen.has(e.to)) {
          seen.add(e.to);
          queue.push(e.to);
        }
      }
    }
    for (const id of seen) reach.set(id, [...(reach.get(id) ?? []), m.id]);
  }
  return reach;
}

/** The edges on a mineral's path, in walking order. */
export function pathOf(mineralId: string) {
  const first = flow.edges.filter((e) => e.from === mineralId);
  const second = flow.edges.filter((e) => first.some((f) => f.to === e.from));
  return [...first, ...second];
}
