import fs from "fs";
import path from "path";
import { Validator } from "../validator-types";

export const noRawErrorValidator: Validator = async () => {

    const dir = path.resolve(process.cwd(), "services");

    const files = fs.readdirSync(dir);

    for (const file of files) {

        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isFile()) {

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