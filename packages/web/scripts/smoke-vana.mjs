// Thin runner: vitest resolves the @/ alias and TS for us. Real calls against dev Supabase + AI Gateway.
import { spawnSync } from "node:child_process";
const r = spawnSync("pnpm", ["exec", "vitest", "run", "scripts/smoke-vana.test.ts", "--reporter=verbose"], { stdio: "inherit" });
process.exit(r.status ?? 1);
