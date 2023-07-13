import { format } from "npm:prettier@^3.0.0";
import { pascalCase } from "https://deno.land/x/case@2.1.1/mod.ts";
import type { ApiSchema } from "../schemaParser.ts";

export async function printInputSchema({
  endpointName,
  apiSchema,
}: {
  endpointName: string;
  apiSchema: ApiSchema;
}): Promise<string> {
  const inputSchemaName = `${pascalCase(endpointName)}InputSchema`;
  const inputTypeName = `${pascalCase(endpointName)}Input`;
  const schemaName = `${pascalCase(endpointName)}Schema`;
  return await format(
    `
    export const ${inputSchemaName} = ${schemaName}.omit({
      ${
      apiSchema.apiFields
        .filter((f) =>
          [
            // NOTE: "image", "mediaList" and "file" are not supported: cf. https://document.microcms.io/content-api/post-content#h85a0f187d4
            "image",
            "mediaList",
            "file",
            // NOTE: "relation" and "relationList" must be in the form of id only
            "relation",
            "relationList",
          ].includes(f.kind)
        )
        .map((f) => `"${f.fieldId}": true,`)
        .join("\n")
    }
    }).extend({
      ${
      apiSchema.apiFields
        .flatMap((f) => {
          if (f.kind === "relation") {
            return [`"${f.fieldId}": z.string(),`];
          }
          if (f.kind === "relationList") {
            return [`"${f.fieldId}": z.array(z.string()),`];
          }
          return [];
        })
        .join("\n")
    }
    })
  export type ${inputTypeName} = z.infer<typeof ${inputSchemaName}>
`,
    {
      parser: "typescript",
    },
  );
}
