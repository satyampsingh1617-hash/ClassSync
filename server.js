// Railway entry point
// Root package.json has "type":"module" so this file is treated as ESM.
// We spawn the backend as a child process to avoid CJS/ESM conflicts.
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendPath = join(__dirname, "backend", "server.js");

const child = spawn(process.execPath, [backendPath], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
