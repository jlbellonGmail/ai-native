import fs from "fs";
import path from "path";
import { Incident } from "./incident-types";

export class IncidentRepository {

    private static filePath = path.resolve(
        process.cwd(),
        "logs/incidents-history.json"
    );

    static save(incident: Incident) {

        let incidents: Incident[] = [];

        // 🔥 leer existentes
        if (fs.existsSync(this.filePath)) {
            try {
                const raw = fs.readFileSync(this.filePath, "utf-8");
                incidents = JSON.parse(raw);
            } catch {
                incidents = [];
            }
        }

        // 🔥 agregar nuevo
        incidents.push(incident);

        // 🔥 guardar
        const dir = path.dirname(this.filePath);

        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(
            this.filePath,
            JSON.stringify(incidents, null, 2)
        );
    }

    static getAll(): Incident[] {
        if (!fs.existsSync(this.filePath)) {
            return [];
        }
        try {
            const raw = fs.readFileSync(this.filePath, "utf-8");
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

}