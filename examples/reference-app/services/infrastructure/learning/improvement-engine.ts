import { IncidentAnalyzer } from "./incident-analyzer";

export class ImprovementEngine {

    static suggest() {

        const analysis = IncidentAnalyzer.analyze();

        const suggestions: string[] = [];

        for (const [message, count] of Object.entries(analysis)) {

            if (count > 3) {
                suggestions.push(`Alta frecuencia de error: "${message}" → revisar lógica`);
            }

            if (message.includes("EMAIL_REQUIRED")) {
                suggestions.push("Agregar validación temprana en frontend");
            }

        }

        return suggestions;
    }

}