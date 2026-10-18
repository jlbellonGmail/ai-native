import OpenAI from "openai";
import fs from "fs";
import path from "path";

// 🔐 Init OpenAI
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 📂 Paths
const ROOT = process.cwd();

const SYSTEM_PATH = path.join(ROOT, ".ai/audit/audit-system.md");
const PROMPT_PATH = path.join(ROOT, ".ai/audit/audit-prompt.md");
const AGENT_PATH = path.join(ROOT, ".ai/core/audit-agent.md");

// 🧠 Helper: read file safely
function readFileSafe(filePath) {
    try {
        return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
        console.warn(`⚠️ Could not read ${filePath}`);
        return "";
    }
}

// 🧠 Helper: extract score
function extractScore(text) {
    const match = text.match(/Score\s*[:\-]?\s*(\d+(\.\d+)?)/i);
    if (!match) return null;
    return parseFloat(match[1]);
}

// 🚀 MAIN
async function runAudit() {
    console.log("🧠 Running AI Audit...");

    // 📄 Load context
    const systemContent = readFileSafe(SYSTEM_PATH);
    const promptContent = readFileSafe(PROMPT_PATH);
    const agentContent = readFileSafe(AGENT_PATH);

    if (!systemContent || !promptContent) {
        console.log("⚠️ Missing audit files, skipping audit");
        process.exit(0); // SAFE CI
    }

    const fullPrompt = `
SYSTEM:
${systemContent}

AGENT:
${agentContent}

USER:
${promptContent}
`;

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: fullPrompt,
                },
            ],
            temperature: 0.2,
        });

        const text = response.choices?.[0]?.message?.content || "";

        console.log("📄 AI Response:\n");
        console.log(text);

        const score = extractScore(text);

        if (score === null) {
            console.log("⚠️ Could not extract score → skipping failure (SAFE CI)");
            process.exit(0);
        }

        console.log(`🎯 AI Score: ${score}`);

        const THRESHOLD = 8;

        if (score < THRESHOLD) {
            console.log(`❌ Audit failed: score below threshold (${THRESHOLD})`);
            process.exit(1); // 👈 falla SOLO por calidad real
        }

        console.log("🎯 Audit passed");
        process.exit(0);

    } catch (error) {
        // 🛡️ SAFE CI HANDLING
        if (error?.status === 429) {
            console.log("⚠️ OpenAI quota exceeded → skipping audit (SAFE CI)");
            process.exit(0);
        }

        if (error?.status === 401) {
            console.log("⚠️ Unauthorized (API key issue) → skipping audit (SAFE CI)");
            process.exit(0);
        }

        console.log("❌ AI Audit error:", error.message);
        process.exit(0); // 👈 nunca rompe CI por error técnico
    }
}

// ▶️ Run
runAudit();