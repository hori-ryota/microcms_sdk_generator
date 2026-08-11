import { join } from "@std/path";
import { existsSync } from "@std/fs/exists";
import { expandGlobSync } from "@std/fs/expand-glob";
import { walkSync } from "@std/fs/walk";
import { ApiSchemaSchema } from "./schemaParser.ts";
import { type ApiDefinition, apiTypes } from "./apiDefinition.ts";

export type { ApiDefinition };

export function parseSchemaFiles(dirPath: string): ApiDefinition[] {
  return apiTypes
    .flatMap((apiType) => {
      const dir = join(dirPath, apiType);
      if (!existsSync(dir)) {
        console.warn(`Directory ${dir} does not exist.`);
        return [];
      }
      walkSync(dir, { includeDirs: false, exts: [".json"] });
      const schemaFiles = Array.from(expandGlobSync(join(dir, "*.json")));
      return schemaFiles.map((entry) => {
        const schemaFileName = entry.name;
        const schemaFilePath = entry.path;
        const schemaFileContent = Deno.readTextFileSync(schemaFilePath);
        const apiSchema = ApiSchemaSchema.parse(JSON.parse(schemaFileContent));
        return {
          endpointName: schemaFileName.replace(/\..*/, ""),
          apiSchema,
          apiType,
        };
      });
    })
    .sort((a, b) => a.endpointName.localeCompare(b.endpointName));
}
