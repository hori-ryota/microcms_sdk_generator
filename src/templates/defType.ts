import { match } from "ts-pattern";
import { format } from "prettier";
import {
  type ApiSchema,
  findCustomField,
  UNKNOWN_KIND,
} from "../schemaParser.ts";
import {
  customFieldTypeName,
  customFieldTypeSchemaName,
  defTypeName,
  defTypeSchemaName,
} from "./helper.ts";

// NOTE: microCMS は未入力のフィールドを「キーなし」または null で返す。
// cf. https://document.microcms.io/content-api/get-api-field-responses
// 利用側の型は今まで通り `T | undefined` に保ちたいので null は undefined に正規化する。
const NULLISH = `.nullish().transform((v) => v ?? undefined)`;

// NOTE: 単一選択のセレクトフィールドは未入力時に空配列が返るため、
// 1要素タプルだけでは弾かれる。空配列は未入力として undefined に寄せる。
const EMPTY_TUPLE_AS_UNDEFINED =
  `.nullish().transform((v) => (v?.length ? v : undefined))`;

function fieldToImpl(
  endpointName: string,
  field: ApiSchema["apiFields"][number],
  customFields: ApiSchema["customFields"],
): string {
  const schema = match(field)
    .with({ kind: "text" }, () => `z.string()`)
    .with({ kind: "textArea" }, () => `z.string()`)
    .with({ kind: "richEditorV2" }, () => `z.string()`)
    .with({ kind: "richEditor" }, () => `z.string()`)
    .with(
      { kind: "media" },
      () =>
        // NOTE: alt は任意設定、height/width は拡張子によってはキー自体が含まれない
        `z.object({
          url: z.url(),
          height: z.number().optional(),
          width: z.number().optional(),
          alt: z.string().optional(),
        })`,
    )
    .with(
      { kind: "mediaList" },
      () =>
        `z.array(z.object({
          url: z.url(),
          height: z.number().optional(),
          width: z.number().optional(),
          alt: z.string().optional(),
        }))`,
    )
    .with(
      { kind: "file" },
      () =>
        `z.object({
          url: z.url(),
          fileSize: z.number(),
        })`,
    )
    .with({ kind: "date" }, () => `z.iso.datetime()`)
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
    // NOTE: 拡張フィールドの中身は連携アプリ側の定義次第
    .with({ kind: "iframe" }, () => `z.record(z.string(), z.unknown())`)
    .with({ kind: "custom" }, (field) => {
      const customField = findCustomField(customFields, field);
      if (!customField) {
        console.warn(
          `Custom field for "${field.fieldId}" is not found. Falling back to z.unknown().`,
        );
        return `z.unknown()`;
      }
      return customFieldTypeSchemaName(endpointName, customField.fieldId);
    })
    .with({ kind: "repeater" }, (field) => {
      const refs = customFields.filter((c) =>
        (field.customFieldIds?.includes(c.fieldId) ?? false) ||
        (c.createdAt != null &&
          (field.customFieldCreatedAtList?.includes(c.createdAt) ?? false))
      );
      if (refs.length === 0) {
        console.warn(
          `Custom fields for repeater "${field.fieldId}" are not found. Falling back to z.unknown().`,
        );
        return `z.array(z.unknown())`;
      }
      let schema = refs
        .map((c) => customFieldTypeSchemaName(endpointName, c.fieldId))
        .join(",");
      if (refs.length > 1) {
        schema = `z.union([${schema}])`;
      }
      return `z.array(${schema})`;
    })
    .with({ kind: UNKNOWN_KIND }, (field) => {
      console.warn(
        `Unknown field kind "${field.originalKind}" for "${field.fieldId}". Falling back to z.unknown().`,
      );
      return `z.unknown()`;
    })
    .exhaustive()
    .trim();

  if (field.required) {
    return `"${field.fieldId}": ${schema},`;
  }
  if (field.kind === "select" && !field.multipleSelect) {
    return `"${field.fieldId}": z.union([${schema}, z.tuple([])])${EMPTY_TUPLE_AS_UNDEFINED},`;
  }
  return `"${field.fieldId}": ${schema}${NULLISH},`;
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
