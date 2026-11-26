// GI reference pilot definition (spec 003 RF-6, RF-14 to RF-17; T5). Pure data and checks: the overlay feature,
// its acceptance plan and validation contract for a disposable copy of gi-common-reference, and the evidence-class
// rule (RF-17). `run-pilot.mjs` applies it to the copy and runs the platform's own acceptance stage twice.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const GI_REPO = "jlbellonGmail/gi-common-reference";
export const GI_SHA = "cd0a82a096f882b0fa9d83a8564cae07cb74d616";
// digest of postgres:16-alpine resolved from the registry when the pilot was pinned; the CI tags it locally so the
// GI fixtures (PostgresContainer("postgres:16-alpine")) use exactly this image
export const PG_IMAGE = "postgres:16-alpine@sha256:f2f98726820d0342055351c6e9d36e705f5bfffb3dd53ff556325114b08afb6d";
export const SLUG = "900-acceptance-pilot";
export const TEST_FILE = "tests/pilot/test_acceptance_pilot.py";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
export const overlayFiles = () => ({
  [`specs/${SLUG}/spec.md`]: readFileSync(here("./overlay/spec.md"), "utf8"),
  [TEST_FILE]: readFileSync(here("./overlay/tests/pilot/test_acceptance_pilot.py"), "utf8"),
  "tests/pilot/__init__.py": "",
});

// [case id = pytest test name, AC, category, expected, evidence class, why]
export const CASES = [
  ["test_real_locales_persist_and_read", "AC-1", "positive", "pass", "real-integration", "locales written to PostgreSQL are read through the public API"],
  ["test_real_regions_persist_and_read", "AC-1", "integration", "pass", "real-integration", "regions written after locales are read through the public API"],
  ["test_real_rejected_snapshot_leaves_state_identical", "AC-1", "negative", "reject", "real-integration", "a rejected snapshot writes nothing"],
  ["test_real_region_locale_fk_points_to_locale", "AC-2", "contract", "pass", "real-integration", "the schema FK region_locale -> locale is the dependency (not HTTP)"],
  ["test_real_nonexistent_locale_reference_is_rejected_by_fk", "AC-2", "negative", "reject", "real-integration", "referential integrity rejects a nonexistent locale and nothing is written"],
  ["test_real_region_names_resolve_by_locale_id", "AC-3", "boundary", "pass", "real-integration", "names resolve by locale_id with no fallback"],
  ["test_real_unknown_locale_id_is_422_distinct_from_404", "AC-3", "boundary", "reject", "real-integration", "an unknown locale_id is 422, an unknown region is 404"],
  ["test_real_fresh_databases_reach_the_same_state", "AC-4", "persistence", "pass", "real-integration", "two fresh databases reach the same normalized state and row counts"],
  ["test_real_resubmitting_a_snapshot_changes_nothing", "AC-4", "persistence", "reject", "real-integration", "a resubmitted older snapshot is a no-op"],
  ["test_sim_snapshot_digest_is_checked_without_a_database", "AC-5", "cross-cutting", "pass", "simulated", "the content digest check needs no database (simulated)"],
  ["test_sim_tampered_snapshot_digest_is_refused", "AC-5", "cross-cutting", "reject", "simulated", "a tampered snapshot fails its digest (simulated)"],
  ["test_real_api_answers_in_process_without_a_socket", "AC-5", "cross-cutting", "pass", "real-integration", "the API answers in-process (TestClient), no network socket is opened"],
];

export function overlayPlan() {
  return {
    schemaVersion: 1,
    slug: SLUG,
    criteria: [{ id: "AC-1", requirements: ["RF-1"] }, { id: "AC-2", requirements: ["RF-2"] }, { id: "AC-3", requirements: ["RF-3"] }, { id: "AC-4", requirements: ["RF-4"] }, { id: "AC-5", requirements: ["RF-5"] }],
    matrix: Object.fromEntries(["positive", "negative", "boundary", "integration", "contract", "persistence", "cross-cutting"].map((c) => [c, { status: "APPLICABLE" }])),
    datasets: [],
    cases: CASES.map(([id, ac, category, expected, executionKind, why]) => ({
      id, ac: [ac], category, runner: "pilot-pg", sutPaths: ["src/", "migrations/", "tests/conftest.py", "tests/fixtures/"], expected, mandatory: true, minTier: "restricted",
      why,
      realSystemUse: executionKind === "simulated" ? "digest check run by the loader before any write" : "the GI catalog loaders and the read-only API over the shared reference schema",
      intentionalErrors: expected === "reject" ? "the input or reference is invalid on purpose" : "none",
      limitations: executionKind === "simulated" ? "simulated: no database" : "real disposable PostgreSQL (container); API through FastAPI TestClient in-process, not an HTTP socket",
      restore: "every database is created per test and dropped; the container is discarded with the session",
      executionKind,
    })),
  };
}

export function overlayContract() {
  return {
    schemaVersion: 1,
    minObservedCases: CASES.length,
    runners: [{
      id: "pilot-pg", executable: "venv/bin/python", argv: ["-m", "pytest", "-q", "--junitxml={resultFile}", "tests/pilot/"], cwd: ".", format: "junit", resultFile: "junit.xml",
      timeoutMs: 1800000, isolation: "restricted",
      env: ["PATH", "HOME", "DOCKER_HOST", "TESTCONTAINERS_RYUK_DISABLED", "PYTHONDONTWRITEBYTECODE"],
      envValues: ["TESTCONTAINERS_RYUK_DISABLED", "PYTHONDONTWRITEBYTECODE"],
      // 002 RF-17/RF-18: the configuration that decides the environment and the schema, by content
      configFiles: ["pyproject.toml", "constraints.txt", "alembic.ini"],
    }],
    nonSutPaths: ["specs/**/*.md", "docs/**"],
  };
}

/** RF-17: the evidence class follows the test: `test_sim_*` is simulated, `test_real_*` is real integration. */
export function labelErrors(plan) {
  const errors = [];
  for (const k of plan.cases) {
    const expected = k.id.startsWith("test_sim_") ? "simulated" : k.id.startsWith("test_real_") ? "real-integration" : null;
    if (!expected) errors.push(`${k.id}: no evidence-class prefix (test_real_ or test_sim_)`);
    else if (k.executionKind !== expected) errors.push(`${k.id}: labelled ${k.executionKind}, its class is ${expected}`);
    if (/http-socket|socket e2e/i.test(k.limitations) && !/not an HTTP socket/.test(k.limitations)) errors.push(`${k.id}: claims socket E2E`);
  }
  return errors;
}

/** The pytest names the overlay test file defines, read from its source (the plan must match them exactly). */
export const definedTests = (source) => [...source.matchAll(/^def (test_[a-z0-9_]+)\(/gm)].map((m) => m[1]).sort();
