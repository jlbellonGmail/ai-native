import fs from "fs";
import path from "path";
import { Validator } from "../validator-types";

export const noRawErrorValidator: Validator = async () => {

    const dir = path.resolve(process.cwd(), "services");

    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of files) {

        const file = entry.name;
        const fullPath = path.join(dir, file);

        if (entry.isFile()) {

            const content = fs.readFileSync(fullPath, "utf-8");

            if (content.includes("new Error(")) {
                return {
                    rule: "no-raw-error",
                    success: false,
                    message: `Archivo ${file} usa new Error()`
                };
            }
        }
    }

    return {
        rule: "no-raw-error",
        success: true
    };
};