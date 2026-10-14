// SemVer ordering for stable `vX.Y.Z` tags. Never the textual order of tags (v3.10.0 > v3.9.0).
const STABLE = /^v(\d+)\.(\d+)\.(\d+)$/;
export const isStable = (tag) => STABLE.test(tag ?? "");
const parts = (tag) => {
  const m = STABLE.exec(tag ?? "");
  if (!m) throw new Error(`not a stable version: ${tag}`);
  return m.slice(1).map(Number);
};
/** <0, 0, >0 like a comparator. */
export const cmpVersions = (a, b) => { const [x, y] = [parts(a), parts(b)]; return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };

const ANY = /^v(\d+)\.(\d+)\.(\d+)(?:-(alpha|rc)\.(\d+))?$/;
/** Full ordering of the tags a lock may pin: alpha.N < rc.N < stable of the same X.Y.Z. */
export function cmpAny(a, b) {
  const key = (tag) => {
    const m = ANY.exec(tag ?? "");
    if (!m) throw new Error(`not a platform version: ${tag}`);
    return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 2 : m[4] === "rc" ? 1 : 0, Number(m[5] ?? 0)];
  };
  const [x, y] = [key(a), key(b)];
  for (let i = 0; i < 5; i += 1) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}
