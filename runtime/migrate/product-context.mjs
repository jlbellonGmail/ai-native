// M5 prerequisite (PAR-PRODUCT-CONTEXT, GOV-06 LOCAL_BY_DESIGN). The product
// context is a LOCAL file owned by the consumer; the platform only offers a
// bootstrap skeleton and a read check. Bootstrap never overwrites, and the
// content is data for the agent, never a source of permissions (policy >
// contenido, core/kernel.md).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const PRODUCT_CONTEXT_PATH = "docs/producto/contexto-producto.md";
export const REQUIRED_SECTIONS = ["Propósito", "Usuarios", "Alcance", "Restricciones"];

export function skeleton() {
  return `# Contexto de producto\n\n${REQUIRED_SECTIONS.map((s) => `## ${s}\n\n(completar)\n`).join("\n")}`;
}

export function bootstrapProductContext(projectRoot) {
  const full = join(projectRoot, PRODUCT_CONTEXT_PATH);
  if (existsSync(full)) return { status: "EXISTS", path: PRODUCT_CONTEXT_PATH };
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, skeleton(), "utf8");
  return { status: "CREATED", path: PRODUCT_CONTEXT_PATH };
}

/** NOT_APPLICABLE when absent (never a silent pass), FAIL when required sections are missing. */
export function checkProductContext(projectRoot) {
  const full = join(projectRoot, PRODUCT_CONTEXT_PATH);
  if (!existsSync(full)) return { status: "NOT_APPLICABLE", missing: [] };
  const text = readFileSync(full, "utf8");
  const missing = REQUIRED_SECTIONS.filter((s) => !new RegExp(`^##\\s+${s}\\b`, "m").test(text));
  return { status: missing.length ? "FAIL" : "PASS", missing };
}
