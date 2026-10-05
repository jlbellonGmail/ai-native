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

        // 🔥 leer existentes (lectura directa: sin existsSync previo, que es una carrera comprobar-y-usar)
        try {
            const raw = fs.readFileSync(this.filePath, "utf-8");
            incidents = JSON.parse(raw);
        } catch {
            incidents = [];
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
        try {
            const raw = fs.readFileSync(this.filePath, "utf-8");
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

}