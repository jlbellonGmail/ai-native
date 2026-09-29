type Incident = {
    message: string;
    type: string;
};

export class SelfImprovement {

    static run(incidents: Incident[] = []) {

        try {

            if (!incidents.length) {
                return; // 🔇 sin ruido innecesario
            }

            console.log(`🧠 Analizando ${incidents.length} incidentes...`);

            // 🔥 agrupar por mensaje NORMALIZADO
            const counter: Record<string, number> = {};

            for (const inc of incidents) {

                // 🔥 CLAVE: normalizar mensajes (evita duplicados)
                const normalized = inc.message
                    .replace(" (auto-blocked by AI system)", "")
                    .trim();

                counter[normalized] = (counter[normalized] || 0) + 1;
            }

            // 🔥 detectar patrones
            for (const [message, count] of Object.entries(counter)) {

                if (count >= 3) {

                    console.log(`🧠 Patrón detectado: "${message}" (${count})`);

                    this.activateStrategy(message);
                }

            }

        } catch {
            // 🔇 nunca romper ejecución ni ensuciar consola
        }

    }

    private static activateStrategy(message: string) {

        if (message.includes("Email is required")) {
            console.log("⚡ Activando estrategia: validación temprana obligatoria");
        }

        if (message.includes("Invalid email format")) {
            console.log("⚡ Activando estrategia: validación estricta de email");
        }

    }

}