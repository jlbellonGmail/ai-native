import { runValidators } from "../services/infrastructure/validators/validator-runner";

async function main() {

    const results = await runValidators();

    const hasErrors = results.some(r => !r.success);

    if (hasErrors) {
        console.error("❌ Validation failed");
        process.exit(1);
    }

    console.log("✅ All validations passed");
}

main();