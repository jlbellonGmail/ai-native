import fs from "node:fs";
import { execSync } from "node:child_process";

const root = process.cwd();
const foundation = `${root}/ai-foundation`;
const roadmap = `${root}/governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`;

const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error: error.message });
  }
}

function run(command, cwd = foundation) {
  execSync(command, {
    cwd,
    stdio: "pipe",
    shell: true,
  });
}

check("Roadmap existe", () => {
  if (!fs.existsSync(roadmap)) throw new Error("No existe ENTERPRISE-10-10-ROADMAP.md");
});

check("W1-T1 está marcado como completado", () => {
  const content = fs.readFileSync(roadmap, "utf8");
  if (!content.includes("## W1-T1")) throw new Error("No existe sección W1-T1");
  if (!content.includes("[x] COMPLETADO")) throw new Error("W1-T1 no está cerrado");
});

check("ai-foundation existe", () => {
  if (!fs.existsSync(foundation)) throw new Error("No existe ai-foundation");
});

check("package.json existe", () => {
  if (!fs.existsSync(`${foundation}/package.json`)) throw new Error("No existe package.json");
});

check("pnpm install OK", () => {
  run("pnpm install");
});

check("pnpm typecheck OK", () => {
  run("pnpm typecheck");
});

check("pnpm test OK", () => {
  run("pnpm test");
});

check("pnpm build OK", () => {
  run("pnpm build");
});

check("pnpm lint OK", () => {
  run("pnpm lint");
});

console.log("\n# W1-T1 Verification\n");

for (const item of checks) {
  console.log(`${item.ok ? "✅" : "❌"} ${item.name}`);
  if (!item.ok) console.log(`   ${item.error}`);
}

const failed = checks.filter((x) => !x.ok);

console.log("\nResultado:");
if (failed.length === 0) {
  console.log("✅ W1-T1 VERIFICADO Y CERRADO CORRECTAMENTE");
  process.exit(0);
} else {
  console.log("❌ W1-T1 NO ESTÁ COMPLETAMENTE VALIDADO");
  process.exit(1);
}