import { parseSchemaFiles } from "./schemaFilesParser.ts";
import { format } from "npm:prettier@^3.0.0";
import { printDefTypeImpl } from "./templates/defType.ts";
import { printOutputSchema } from "./templates/outputSchema.ts";
import { printClientImpl } from "./templates/client.ts";
import { printBaseSchemas } from "./templates/baseSchemas.ts";
import { printInputSchema } from "./templates/inputSchema.ts";

export async function generate({
  schemaDir,
  dstFilePath,
}: {
  schemaDir: string;
  dstFilePath: string;
}): Promise<void> {
  await Deno.writeTextFile(dstFilePath, await generateAsString({ schemaDir }));
}

export async function generateAsString({
  schemaDir,
}: {
  schemaDir: string;
}): Promise<string> {
  const header = `// Auto generated by "microcms_sdk_generator". DO NOT EDIT.
    import { z } from "zod";
    `;

  const apis = parseSchemaFiles(schemaDir);
  return format(
    [
      header,
      await printBaseSchemas(),
      (
        await Promise.all(apis.map(async (api) => await printDefTypeImpl(api)))
      ).join("\n"),
      (
        await Promise.all(apis.map(async (api) => await printInputSchema(api)))
      ).join("\n"),
      (
        await Promise.all(apis.map(async (api) => await printOutputSchema(api)))
      ).join("\n"),
      await printClientImpl(apis),
    ].join("\n"),
    { parser: "typescript", semi: true, trailingComma: "all" },
  );
}
