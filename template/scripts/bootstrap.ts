import * as fs from 'fs';
import * as path from 'path';

console.log("[DX Bootstrap] Configuring local development environment...");
const runtimeDataDir = path.join(__dirname, '../.ai-runtime-data');
if (!fs.existsSync(runtimeDataDir)) {
    fs.mkdirSync(runtimeDataDir);
}
console.log("[DX Bootstrap] Local dev data directories setup complete!");
