import { createServer } from "vite";

const server = await createServer({
  root: process.cwd(),
  logLevel: "error",
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const mod = await server.ssrLoadModule("/scripts/smoke-entry.jsx");
  const results = mod.renderAll();
  let failed = false;
  for (const line of results) {
    console.log(line);
    if (line.startsWith("FAIL")) failed = true;
  }
  console.log(failed ? "\nSMOKE TEST FAILED" : "\nALL SMOKE TESTS PASSED");
  process.exit(failed ? 1 : 0);
} finally {
  await server.close();
}
