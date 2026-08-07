import { match } from "ts-pattern";
import { format } from "prettier";
import {
  defTypeSchemaName,
  outputTypeName,
  outputTypeSchemaName,
  typeName,
  typeSchemaName,
} from "./helper.ts";
import { ApiDefinition } from "../schemaFilesParser.ts";

export async function printOutputSchema({
  endpointName,
  apiType,
}: ApiDefinition): Promise<string> {
  return await format(
    `
    export const ${outputTypeSchemaName(endpointName)} = ${
      match(apiType)
        .with(
          "list",
          () => `makeListResponseSchema(${defTypeSchemaName(endpointName)})`,
        )
        .with("object", () => `${defTypeSchemaName(endpointName)}`)
        .exhaustive()
    }

    export type ${
      outputTypeName(
        endpointName,
      )
    } = z.infer<typeof ${outputTypeSchemaName(endpointName)}>

    export const ${typeSchemaName(endpointName)} = ${
      match(apiType)
        .with(
          "list",
          () => `${outputTypeSchemaName(endpointName)}.shape.contents.element`,
        )
        .with("object", () => `${outputTypeSchemaName(endpointName)}`)
        .exhaustive()
    }

    export type ${typeName(endpointName)} = z.infer<typeof ${
      typeSchemaName(
        endpointName,
      )
    }>
`,
    {
      parser: "typescript",
    },
  );
}
