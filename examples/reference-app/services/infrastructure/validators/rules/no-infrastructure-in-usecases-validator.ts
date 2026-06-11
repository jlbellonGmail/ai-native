import fs from "fs";
import path from "path";
import { Validator } from "../validator-types";

export const noInfrastructureInUseCases: Validator = async () => {

    const dir = path.resolve(process.cwd(), "services/application/use-cases");

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), "utf-8");

        if (content.includes("@/infrastructure")) {
            return {
                rule: "no-infrastructure-in-usecases",
                success: false,
                message: `Use-case ${file} importa infrastructure`
            };
        }
    }

    return {
        rule: "no-infrastructure-in-usecases",
        success: true
    };
};