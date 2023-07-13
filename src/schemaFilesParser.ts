import { join } from "https://deno.land/std@0.182.0/path/mod.ts";
import {
  existsSync,
  expandGlobSync,
} from "https://deno.land/std@0.182.0/fs/mod.ts";
import { type ApiSchema, ApiSchemaSchema } from "./schemaParser.ts";
import { walkSync } from "https://deno.land/std@0.182.0/fs/walk.ts";

const apiTypes = ["list", "object"] as const;

export type ApiDefinition = {
  endpointName: string;
  apiSchema: ApiSchema;
  apiType: (typeof apiTypes)[number];
};

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
