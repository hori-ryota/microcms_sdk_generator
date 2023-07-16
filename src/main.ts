import { generate } from "./generate.ts";

export async function main() {
  const schemaDir = Deno.args[0];
  const dstFilePath = Deno.args[1];

  if (!schemaDir || !dstFilePath) {
    console.log(
      "Usage: microcms_sdk_generator <schema directory> <destination typescript file>",
    );
    Deno.exit(1);
  }
  await generate({ schemaDir, dstFilePath });
}

if (import.meta.main) {
  await main();
}
