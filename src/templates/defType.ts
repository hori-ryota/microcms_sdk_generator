import { match } from "npm:ts-pattern@^5.0.3";
import { format } from "npm:prettier@^3.0.0";
import type { ApiSchema } from "../schemaParser.ts";
import {
  customFieldTypeName,
  customFieldTypeSchemaName,
  defTypeName,
  defTypeSchemaName,
} from "./helper.ts";

function fieldToImpl(
  endpointName: string,
  field: ApiSchema["apiFields"][number],
  customFields: ApiSchema["customFields"],
): string {
  return `"${field.fieldId}": ${
    match(field)
      .with({ kind: "text" }, () => `z.string()`)
      .with({ kind: "textArea" }, () => `z.string()`)
      .with({ kind: "richEditorV2" }, () => `z.string()`)
      .with(
        { kind: "media" },
        () =>
          `z.object({
          url: z.string().url(),
          height: z.number(),
          width: z.number(),
        })`,
      )
      .with(
        { kind: "mediaList" },
        () =>
          `z.array(z.object({
          url: z.string().url(),
          height: z.number(),
          width: z.number(),
        }))`,
      )
      .with({ kind: "date" }, () => `z.string().datetime()`)
      .with({ kind: "boolean" }, () => `z.boolean()`)
      .with(
        { kind: "select", multipleSelect: false },
        (field) =>
          `z.tuple([z.enum([
          ${field.selectItems.map((o) => `"${o.value}"`).join(",")}
        ])])`,
      )
      .with(
        { kind: "select", multipleSelect: true },
        (field) =>
          `z.array(z.enum([
          ${field.selectItems.map((o) => `"${o.value}"`).join(",")}
        ]))`,
      )
      .with({ kind: "number" }, () => `z.number()`)
      .with({ kind: "relation" }, () => `OnlyIdSchema.and(z.unknown())`)
      .with(
        { kind: "relationList" },
        () => `z.array(OnlyIdSchema.and(z.unknown()))`,
      )
      .with({ kind: "custom" }, (field) => {
        const customField = customFields.find(
          (c) => c.createdAt === field.customFieldCreatedAt,
        );
        if (!customField) {
          return `z.unknown()`;
        }
        return customFieldTypeSchemaName(endpointName, customField.fieldId);
      })
      .with({ kind: "repeater" }, (field) => {
        let schema = customFields
          .filter((c) => field.customFieldCreatedAtList.includes(c.createdAt))
          .map((c) => customFieldTypeSchemaName(endpointName, c.fieldId))
          .join(",");
        if (field.customFieldCreatedAtList.length > 1) {
          schema = `z.unknown([${schema}])`;
        }
        return `z.array(${schema})`;
      })
      .exhaustive()
      .trim()
  }${field.required ? "" : ".optional()"},`;
}

function customFieldToSchema(
  endpointName: string,
  customField: ApiSchema["customFields"][number],
): string {
  const schemaName = customFieldTypeSchemaName(
    endpointName,
    customField.fieldId,
  );
  const typeName = customFieldTypeName(endpointName, customField.fieldId);
  return `// eslint-disable-next-line @typescript-eslint/naming-convention
  export const ${schemaName} = z.object({
    fieldId: z.string(),
  ${
    customField.fields
      .map((field) => fieldToImpl(endpointName, field, []))
      .join("\n")
  }})
  // eslint-disable-next-line @typescript-eslint/naming-convention
  export type ${typeName} = z.infer<typeof ${schemaName}>
  `;
}

export async function printDefTypeImpl({
  endpointName,
  apiSchema,
}: {
  endpointName: string;
  apiSchema: ApiSchema;
}): Promise<string> {
  return await format(
    `
    ${
      apiSchema.customFields
        .map((c) => customFieldToSchema(endpointName, c))
        .join("\n")
    }
export const ${defTypeSchemaName(endpointName)} = z.object({
    ${
      apiSchema.apiFields
        .map((field) =>
          fieldToImpl(endpointName, field, apiSchema.customFields)
        )
        .join("\n")
    }
      })
      export type ${
      defTypeName(
        endpointName,
      )
    } = z.infer<typeof ${defTypeSchemaName(endpointName)}>
`,
    {
      parser: "typescript",
    },
  );
}
