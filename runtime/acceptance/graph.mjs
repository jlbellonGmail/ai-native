// Deterministic dependency graph (spec 001 RF-3, RF-4, RF-6). Pure: no I/O,
// no inference, never writes dependencies. All outputs are sorted.
import { validateManifest } from "./manifest.mjs";

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const uniqSorted = (xs) => [...new Set(xs)].sort(cmp);

/** Finds a cycle in module edges (consumer -> provider). Returns ordered ids or null. */
function findCycle(ids, adj) {
  const state = new Map(); // 1 visiting, 2 done
  const stack = [];
  let found = null;
  const visit = (n) => {
    if (found) return;
    state.set(n, 1);
    stack.push(n);
    for (const next of adj.get(n) ?? []) {
      if (found) return;
      if (state.get(next) === 1) {
        found = [...stack.slice(stack.indexOf(next)), next];
        return;
      }
      if (!state.has(next)) visit(next);
    }
    stack.pop();
    state.set(n, 2);
  };
  for (const id of ids) if (!state.has(id) && !found) visit(id);
  return found;
}

/** Returns { ok:false, errors } on an invalid manifest or cycle, else { ok:true, graph }. */
export function buildGraph(manifest) {
  const v = validateManifest(manifest);
  if (!v.ok) return { ok: false, errors: v.errors };

  const modules = uniqSorted(manifest.modules.map((m) => m.id));
  const providersOf = new Map(modules.map((m) => [m, new Set()])); // consumer -> providers
  const consumersOf = new Map(modules.map((m) => [m, new Set()])); // provider -> consumers
  const edges = [];
  for (const d of manifest.dependencies) {
    providersOf.get(d.consumer).add(d.provider);
    consumersOf.get(d.provider).add(d.consumer);
    edges.push({ consumer: d.consumer, provider: d.provider, contract: d.contract });
  }
  edges.sort((a, b) => cmp(a.consumer, b.consumer) || cmp(a.provider, b.provider) || cmp(a.contract, b.contract));

  const adj = new Map(modules.map((m) => [m, uniqSorted([...providersOf.get(m)])]));
  const cycle = findCycle(modules, adj);
  if (cycle) return { ok: false, errors: [`dependency cycle: ${cycle.join(" -> ")}`] };

  const contracts = new Map(); // "mod/contract" -> path
  for (const m of manifest.modules) for (const c of m.contracts) contracts.set(`${m.id}/${c.id}`, c.path);

  const closure = (start, rel) => {
    const seen = new Set();
    const work = [...(rel.get(start) ?? [])];
    while (work.length) {
      const n = work.pop();
      if (seen.has(n)) continue;
      seen.add(n);
      for (const x of rel.get(n) ?? []) work.push(x);
    }
    return uniqSorted([...seen]);
  };

  // Stable topological order: providers before consumers; ties by id.
  const indeg = new Map(modules.map((m) => [m, providersOf.get(m).size]));
  const ready = modules.filter((m) => indeg.get(m) === 0);
  const topo = [];
  while (ready.length) {
    ready.sort(cmp);
    const n = ready.shift();
    topo.push(n);
    for (const c of uniqSorted([...consumersOf.get(n)])) {
      indeg.set(c, indeg.get(c) - 1);
      if (indeg.get(c) === 0) ready.push(c);
    }
  }

  const graph = {
    modules,
    edges,
    topologicalOrder: topo,
    contractPath: (moduleId, contractId) => contracts.get(`${moduleId}/${contractId}`) ?? null,
    contractEntries: () =>
      [...contracts.entries()]
        .map(([k, path]) => ({ moduleId: k.split("/")[0], contractId: k.slice(k.indexOf("/") + 1), path }))
        .sort((a, b) => cmp(a.moduleId, b.moduleId) || cmp(a.contractId, b.contractId)),
    directProviders: (m) => uniqSorted([...(providersOf.get(m) ?? [])]),
    directConsumers: (m) => uniqSorted([...(consumersOf.get(m) ?? [])]),
    transitiveProviders: (m) => closure(m, providersOf),
    transitiveConsumers: (m) => closure(m, consumersOf),
    /** Consumers that declare a dependency on exactly this provider contract. */
    consumersOfContract: (provider, contract) =>
      uniqSorted(edges.filter((e) => e.provider === provider && e.contract === contract).map((e) => e.consumer)),
    edgesOf: (consumer) => edges.filter((e) => e.consumer === consumer),
    /** Canonical serialization: identical input => identical text. */
    serialize: () =>
      JSON.stringify({ modules, edges, topologicalOrder: topo, contracts: [...contracts.entries()].sort((a, b) => cmp(a[0], b[0])) }),
  };
  return { ok: true, graph };
}
