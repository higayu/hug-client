// scripts/build-preload.js
const esbuild = require("esbuild");
const path = require("path");

esbuild
  .build({
    entryPoints: [path.join(__dirname, "../electron/preload/index.js")],
    outfile: path.join(__dirname, "../electron/preload/preload.bundle.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node18",
    external: ["electron"],
  })
  .then(() => {
    console.log("✅ preload bundle created: electron/preload/preload.bundle.cjs");
  })
  .catch((error) => {
    console.error("❌ preload bundle failed:", error);
    process.exit(1);
  });
