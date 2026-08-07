import { format } from "prettier";
import type { ApiSchema } from "../schemaParser.ts";
import {
  defTypeSchemaName,
  inputTypeName,
  inputTypeSchemaName,
} from "./helper.ts";

export async function printInputSchema({
  endpointName,
  apiSchema,
}: {
  endpointName: string;
  apiSchema: ApiSchema;
}): Promise<string> {
  return await format(
    `
    export const ${inputTypeSchemaName(endpointName)} = ${
      defTypeSchemaName(
        endpointName,
      )
    }.omit({
      ${
      apiSchema.apiFields
        .filter((f) =>
          [
            // NOTE: "media", "mediaList" and "file" are not supported: cf. https://document.microcms.io/content-api/post-content#h85a0f187d4
            "media",
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
  export type ${
      inputTypeName(
        endpointName,
      )
    } = z.infer<typeof ${inputTypeSchemaName(endpointName)}>
`,
    {
      parser: "typescript",
    },
  );
}
