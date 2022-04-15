import { build, emptyDir } from "https://deno.land/x/dnt@0.22.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./trivia.ts"],
  outDir: "./npm",
  test: false,
  shims: {},
  package: {
    // package.json properties
    name: "@brecert/trivia",
    version: Deno.args[0],
    description: "A simple OpenTDB wrapper",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/brecert/trivia-deno.git",
    },
    bugs: {
      url: "https://github.com/brecert/trivia-deno/issues",
    },
  },
});

// post build steps
Deno.copyFileSync("README.md", "npm/README.md");
