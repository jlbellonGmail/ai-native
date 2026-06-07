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
  },
  "W1-T2": {
    status: "[x] COMPLETADO",
    evidence: [
      "workflow Trivy agregado",
      "validación real Trivy completada",
      "filesystem scan real ejecutado",
      "dependency scan real ejecutado",
      "0 HIGH",
      "0 CRITICAL",
      "evidencia archivada en governance/execution/archive/ENTERPRISE-10-10-V1/W1-T2/"
    ],
    notes: [
      "Trivy queda integrado como validación de seguridad del repositorio ai-foundation.",
      "El cierre se limita a W1-T2 y no avanza a W1-T3."
    ]
  }
};

if (!closures[taskId]) {
  console.error(`No existe cierre definido para ${taskId}`);
  process.exit(1);
}

const content = fs.readFileSync(roadmapPath, "utf8");
const today = new Date().toISOString().slice(0, 10);
const closure = closures[taskId];

const taskHeader = `## ${taskId}`;
const start = content.indexOf(taskHeader);

if (start === -1) {
  console.error(`No existe sección ${taskId}`);
  process.exit(1);
}

const nextTask = content.indexOf("\n## ", start + taskHeader.length);
const before = content.slice(0, start);
const section = content.slice(start, nextTask === -1 ? content.length : nextTask);
const after = nextTask === -1 ? "" : content.slice(nextTask);

if (!section.includes("Estado:")) {
  console.error(`La sección ${taskId} no tiene bloque Estado`);
  process.exit(1);
}

if (section.includes("[x] COMPLETADO")) {
  console.log(`${taskId} ya está completado. No se modifica.`);
  process.exit(0);
}

const updatedSection = section.replace(
  /Estado:\s*\n\s*\[ \]/,
  `Estado:
${closure.status}

Fecha cierre:
${today}

Evidencia:
${closure.evidence.map((x) => `* ${x}`).join("\n")}

Notas:
${closure.notes.map((x) => `* ${x}`).join("\n")}`
);

if (updatedSection === section) {
  console.error(`No pude actualizar Estado: [ ] dentro de ${taskId}`);
  process.exit(1);
}

fs.writeFileSync(roadmapPath, before + updatedSection + after, "utf8");

console.log(`Roadmap actualizado: ${taskId}`);
