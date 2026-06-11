import { IncidentRepository } from "./incident-repository";

export class IncidentAnalyzer {

    static analyze() {

        const incidents = IncidentRepository.getAll();

        const summary: Record<string, number> = {};

        for (const inc of incidents) {
            summary[inc.message] = (summary[inc.message] || 0) + 1;
        }

        return summary;
    }

}