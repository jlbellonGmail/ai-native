type Incident = {
    message: string;
    type: string;
};

export class AutoActions {

    static evaluate(incidents: Incident[]) {

        const counter: Record<string, number> = {};

        for (const inc of incidents) {
            counter[inc.message] = (counter[inc.message] || 0) + 1;
        }

        const actions: Record<string, boolean> = {};

        for (const [message, count] of Object.entries(counter)) {

            if (count >= 3) {

                if (message.includes("Email is required")) {
                    actions["BLOCK_MISSING_EMAIL"] = true;
                }

                if (message.includes("Invalid email format")) {
                    actions["STRICT_EMAIL_VALIDATION"] = true;
                }

            }

        }

        return actions;
    }

}