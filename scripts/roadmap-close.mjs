import fs from "node:fs";

const taskId = process.argv[2];

if (!taskId) {
  console.error("Uso: pnpm roadmap:close W1-T1");
  process.exit(1);
}

const roadmapPath = "governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md";

if (!fs.existsSync(roadmapPath)) {
  console.error(`No existe roadmap: ${roadmapPath}`);
  process.exit(1);
}

const closures = {
  "W1-T1": {
    status: "[x] COMPLETADO",
    evidence: [
      "CodeQL baseline validado.",
      "pnpm install: OK",
      "pnpm typecheck: OK",
      "pnpm test: OK",
      "pnpm build: OK",
      "pnpm lint: OK con 5 warnings no bloqueantes",
      "Score: 9.1 → 9.3"
    ],
    notes: [
      "ai-foundation queda validado como foundation/runtime package.",
      "Build definido como validación TypeScript.",
      "Warnings trasladados a cleanup posterior."
    ]
  }
};

if (!closures[taskId]) {
  console.error(`No existe cierre definido para ${taskId}`);
  process.exit(1);
}

let content = fs.readFileSync(roadmapPath, "utf8");
const today = new Date().toISOString().slice(0, 10);
const closure = closures[taskId];

const sectionRegex = new RegExp(
  `(## ${taskId}\\s+[\\s\\S]*?Estado:\\s*)\\[ \\]`,
  "m"
);

if (!sectionRegex.test(content)) {
  console.error(`No pude encontrar ${taskId} con Estado: [ ]`);
  console.error("Verificá que el encabezado sea exactamente: ## " + taskId);
  process.exit(1);
}

const replacement = `$1${closure.status}

Fecha cierre:
${today}

Evidencia:
${closure.evidence.map((x) => `* ${x}`).join("\n")}

Notas:
${closure.notes.map((x) => `* ${x}`).join("\n")}`;

content = content.replace(sectionRegex, replacement);

fs.writeFileSync(roadmapPath, content, "utf8");

console.log(`Roadmap actualizado: ${taskId}`);