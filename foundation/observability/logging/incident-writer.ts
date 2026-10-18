import { AIError } from "../core/error-types.js";
import * as fs from "node:fs";
import * as path from "node:path";

export class IncidentWriter {
    async create(error: AIError) {
        const incidentId = `incident-${Date.now()}`;
        const dir = path.resolve(process.cwd(), "docs/incidents");

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const content = `
# Incident Report

ID: ${incidentId}
Type: ${error.type}
Severity: ${error.severity}
Timestamp: ${error.timestamp}

## Context
${JSON.stringify(error.context, null, 2)}

## Root Cause
Pendiente

## Resolución
Pendiente
`;

        fs.writeFileSync(path.join(dir, `${incidentId}.md`), content);
    }
}