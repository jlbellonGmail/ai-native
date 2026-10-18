import { ImprovementEngine } from "../examples/reference-app/services/infrastructure/learning/improvement-engine";

async function main() {

    const suggestions = ImprovementEngine.suggest();

    if (suggestions.length === 0) {
        console.log("No hay mejoras sugeridas");
        return;
    }

    console.log("Sugerencias del sistema:\n");

    suggestions.forEach(s => console.log("- " + s));
}

main();
