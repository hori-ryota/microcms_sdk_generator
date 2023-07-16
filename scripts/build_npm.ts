import { build, emptyDir } from "https://deno.land/x/dnt@0.37.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: [
    {
      kind: "bin",
      name: "microcms_sdk_generator",
      path: "./src/main.ts",
    },
  ],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  scriptModule: false,
  mappings: {
    "https://deno.land/x/zod@v3.21.4/mod.ts": {
      name: "zod",
      version: "^3.21.4",
    },
  },
  compilerOptions: {
    lib: ["ES2022", "DOM"],
    target: "ES2022",
  },
  postBuild() {
    Deno.copyFileSync("./LICENSE", "./npm/LICENSE");
    Deno.copyFileSync("./README.md", "./npm/README.md");
    Deno.mkdirSync("./npm/esm/testdata/schemas/list", { recursive: true });
    Deno.copyFileSync(
      "./src/testdata/schemas/list/sample-for-list-api.schema.json",
      "./npm/esm/testdata/schemas/list/sample-for-list-api.schema.json",
    );
    Deno.mkdirSync("./npm/esm/testdata/schemas/object", { recursive: true });
    Deno.copyFileSync(
      "./src/testdata/schemas/object/sample-for-object-api.schema.json",
      "./npm/esm/testdata/schemas/object/sample-for-object-api.schema.json",
    );
    const npmignore = Deno.readTextFileSync("./npm/.npmignore");
    Deno.writeTextFileSync(
      "./npm/.npmignore",
      `${npmignore}
esm/testdata/
`,
    );
  },
  package: {
    name: "microcms_sdk_generator",
    version: Deno.args[0],
    description: "A type-safe MicroCMS SDK Generator",
    license: "MIT",
    keywords: ["microCMS", "sdk", "generator", "deno"],
    repository: {
      type: "git",
      url: "git+https://github.com/hori-ryota/microcms_sdk_generator.git",
    },
    bugs: {
      url: "https://github.com/hori-ryota/microcms_sdk_generator/issues",
    },
    author: {
      name: "Ryota Hori",
      email: "hori.ryota@gmail.com",
      url: "https://github.com/hori-ryota",
    },
  },
});
