import { ImprovementEngine } from "../learning/improvement-engine";

export class SelfImprovement {

    static run() {

        const suggestions = ImprovementEngine.suggest();

        for (const s of suggestions) {

            if (s.includes("EMAIL_REQUIRED")) {
                console.log("⚡ Activando mejora automática: validación previa");
            }

        }

    }

}