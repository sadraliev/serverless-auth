const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const handlersDir = path.resolve(__dirname, "src", "handlers");
const outDir = path.resolve(__dirname, "dist");

async function build() {
  const files = fs.readdirSync(handlersDir).filter((f) => f.endsWith("handler.ts"));

  for (const file of files) {
    const name = path.basename(file, "handler.ts");
    const handlerOutDir = path.resolve(outDir, name);

    console.log(`🔨 Building handler: ${name}`);

    if (!fs.existsSync(handlerOutDir)) {
      fs.mkdirSync(handlerOutDir, { recursive: true });
    }

    await esbuild.build({
      entryPoints: [path.resolve(handlersDir, file)],
      bundle: true,
      platform: "node",
      target: ["node18"],
      outfile: path.resolve(handlerOutDir, "index.js"),
      sourcemap: false,
      external: ["aws-sdk"],
      minify: false,
      format: "cjs",
    });

    console.log(`✅ Handler ${name} built successfully.\n`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
