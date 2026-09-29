import { AISession } from "../models/session.model";
import { FileRuntimeRepository } from "../storage/file-runtime.repository";

export class SessionManager {
    private repository = new FileRuntimeRepository();
    private currentSession: AISession | null = null;

    start(metadata: Record<string, any> = {}) {
        const session: AISession = {
            id: Date.now().toString(),
            startTime: new Date().toISOString(),
            status: "RUNNING",
            metadata,
        };

        this.currentSession = session;
        this.repository.saveSession(session);

        return session;
    }

    end(status: "COMPLETED" | "FAILED") {
        if (!this.currentSession) return;

        this.currentSession.status = status;
        this.currentSession.endTime = new Date().toISOString();

        this.repository.updateSession(this.currentSession);
    }

    getSession() {
        return this.currentSession;
    }
}