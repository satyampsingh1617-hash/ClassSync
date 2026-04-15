// Railway entry point — delegates to the actual Express backend
// Note: this file uses .js extension but backend uses CommonJS (require)
// We use dynamic import to bridge ESM (root) → CJS (backend)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("./backend/server.js");
