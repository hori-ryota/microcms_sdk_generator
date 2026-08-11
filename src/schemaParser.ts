import { z } from "zod";

// NOTE: microCMS は未設定の項目を null で書き出すため、任意項目はすべて nullish で受ける。
// また、管理画面のエクスポートとマネジメントAPIでキー名が異なる項目があるので両方受け付ける。
const FieldBaseSchema = z.object({
  idValue: z.string().nullish(),
  fieldId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  required: z.boolean().nullish(),
});

export const TextFieldSchema = FieldBaseSchema.extend({
  kind: z.literal("text"),
});

export const TextAreaSchema = FieldBaseSchema.extend({
  kind: z.literal("textArea"),
});

export const RichEditorSchema = FieldBaseSchema.extend({
  kind: z.literal("richEditorV2"),
  // NOTE: 選択肢は microCMS 側で随時追加されるため enum では固定しない
  richEditorV2Options: z.array(z.string()).nullish(),
});

export const RichEditorV1Schema = FieldBaseSchema.extend({
  kind: z.literal("richEditor"),
});

export const ImageSchema = FieldBaseSchema.extend({
  kind: z.literal("media"),
});

export const MultipleImageSchema = FieldBaseSchema.extend({
  kind: z.literal("mediaList"),
});

export const FileSchema = FieldBaseSchema.extend({
  kind: z.literal("file"),
});

export const DateSchema = FieldBaseSchema.extend({
  kind: z.literal("date"),
});

export const BooleanSchema = FieldBaseSchema.extend({
  kind: z.literal("boolean"),
});

export const SelectFieldItemSchema = z.object({
  id: z.string(),
  value: z.string(),
});

export const SelectFieldSchema = FieldBaseSchema.extend({
  kind: z.literal("select"),
  selectItems: z.array(SelectFieldItemSchema),
  // NOTE: 初期値のキーはエクスポートが selectInitialValue、マネジメントAPIが initialValue
  selectInitialValue: z.array(z.string()).nullish(),
  initialValue: z.array(z.string()).nullish(),
  multipleSelect: z.boolean(),
});

export const NumberSchema = FieldBaseSchema.extend({
  kind: z.literal("number"),
});

export const RelationSchema = FieldBaseSchema.extend({
  kind: z.literal("relation"),
  referencedApiEndpoint: z.string().nullish(),
});

export const RelationListSchema = FieldBaseSchema.extend({
  kind: z.literal("relationList"),
  referencedApiEndpoint: z.string().nullish(),
});

export const IframeSchema = FieldBaseSchema.extend({
  kind: z.literal("iframe"),
});

// NOTE: カスタムフィールドの参照キーは、エクスポートが customFieldCreatedAt
// （customFields[].createdAt と突き合わせる）、マネジメントAPIが customFieldId
// （customFields[].fieldId と突き合わせる）
export const CustomSchema = FieldBaseSchema.extend({
  kind: z.literal("custom"),
  customFieldId: z.string().nullish(),
  customFieldCreatedAt: z.string().nullish(),
});

export const RepeaterSchema = FieldBaseSchema.extend({
  kind: z.literal("repeater"),
  customFieldIds: z.array(z.string()).nullish(),
  customFieldCreatedAtList: z.array(z.string()).nullish(),
});

// NOTE: microCMS 側で追加された未知の kind でも生成自体は通したいのでフォールバックとして受ける。
// 既知の kind と型で判別できるよう kind を差し替え、元の値は originalKind に退避する。
export const UNKNOWN_KIND = "__unknown__" as const;
export const UnknownFieldSchema = FieldBaseSchema.extend({
  kind: z.string(),
}).transform((field) => ({
  ...field,
  kind: UNKNOWN_KIND,
  originalKind: field.kind,
}));

export const ApiFieldSchema = z.union([
  TextFieldSchema,
  TextAreaSchema,
  RichEditorSchema,
  RichEditorV1Schema,
  ImageSchema,
  MultipleImageSchema,
  FileSchema,
  DateSchema,
  BooleanSchema,
  SelectFieldSchema,
  NumberSchema,
  RelationSchema,
  RelationListSchema,
  IframeSchema,
  CustomSchema,
  RepeaterSchema,
  UnknownFieldSchema,
]);
export type ApiField = z.infer<typeof ApiFieldSchema>;

export const CustomFieldSchema = z.object({
  createdAt: z.iso.datetime().nullish(),
  updatedAt: z.iso.datetime().nullish(),
  fieldId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  fields: z.array(ApiFieldSchema),
  // NOTE: 並び順のキーはエクスポートが position、マネジメントAPIが fieldOrderByColumn
  position: z.array(z.array(z.string())).nullish(),
  fieldOrderByColumn: z.array(z.array(z.string())).nullish(),
  viewerGroup: z.string().nullish(),
});
export type CustomField = z.infer<typeof CustomFieldSchema>;

export const ApiSchemaSchema = z.object({
  apiFields: z.array(ApiFieldSchema),
  customFields: z.array(CustomFieldSchema),
});
export type ApiSchema = z.infer<typeof ApiSchemaSchema>;

export function parseSchema(schemaJson: string): ApiSchema {
  return ApiSchemaSchema.parse(JSON.parse(schemaJson));
}

/**
 * custom / repeater が参照しているカスタムフィールドを解決する。
 * エクスポート形式は createdAt、マネジメントAPI形式は fieldId で参照される。
 */
export function findCustomField(
  customFields: CustomField[],
  ref: { customFieldId?: string | null; customFieldCreatedAt?: string | null },
): CustomField | undefined {
  return customFields.find(
    (c) =>
      (ref.customFieldId != null && c.fieldId === ref.customFieldId) ||
      (ref.customFieldCreatedAt != null &&
        c.createdAt === ref.customFieldCreatedAt),
  );
}
