import { IncidentRepository } from "../learning/incident-repository";
import { Incident } from "../learning/incident-types";

export class IncidentLogger {

    static log(error: any) {

        const incident: Incident = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            type: error.code === "INVALID_INPUT" ? "business" : "runtime"
        };

        // 🔥 SOLO historial (sin archivos individuales)
        IncidentRepository.save(incident);
    }

}