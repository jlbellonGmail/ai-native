import fs from "fs";
import path from "path";
import { AISession } from "../models/session-model.js";
import { AIDecision } from "../models/decision-model.js";

export class FileRuntimeRepository {
    private basePath = path.resolve(process.cwd(), ".ai-runtime-data");

    constructor() {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }

    saveSession(session: AISession) {
        const filePath = path.join(this.basePath, `session-${session.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    }

    saveDecision(decision: AIDecision) {
        const filePath = path.join(
            this.basePath,
            `decision-${decision.id}.json`
        );
        fs.writeFileSync(filePath, JSON.stringify(decision, null, 2));
    }

    updateSession(session: AISession) {
        this.saveSession(session);
    }
}