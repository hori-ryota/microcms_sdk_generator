import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

export const TextFieldSchema = z.object({
  idValue: z.string().optional(),
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("text"),
  required: z.boolean().optional(),
});

export const TextAreaSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("textArea"),
  required: z.boolean().optional(),
});

export const RichEditorSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("richEditorV2"),
  required: z.boolean().optional(),
  richEditorV2Options: z
    .array(
      z.enum([
        "headerOne",
        "headerTwo",
        "headerThree",
        "headerFour",
        "headerFive",
        "undo",
        "redo",
        "paragraph",
        "bold",
        "italic",
        "underline",
        "strike",
        "code",
        "blockquote",
        "codeBlock",
        "listBullet",
        "listOrdered",
        "link",
        "image",
        "table",
        "horizontalRule",
        "textAlign",
        "oembedly",
        "clean",
        "customClass",
      ]),
    )
    .optional(),
});

export const ImageSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("media"),
  required: z.boolean().optional(),
});

export const MultipleImageSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("mediaList"),
  required: z.boolean().optional(),
});

export const DateSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("date"),
  required: z.boolean().optional(),
});

export const BooleanSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("boolean"),
  required: z.boolean().optional(),
});

export const SelectFieldItemSchema = z.object({
  id: z.string(),
  value: z.string(),
});

export const SelectFieldSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("select"),
  selectItems: z.array(SelectFieldItemSchema),
  selectInitialValue: z.array(z.string()).optional(),
  multipleSelect: z.boolean(),
  required: z.boolean().optional(),
});

export const NumberSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("number"),
  required: z.boolean().optional(),
});

export const RelationSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("relation"),
  required: z.boolean().optional(),
});

export const RelationListSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("relationList"),
  required: z.boolean().optional(),
});

export const CustomSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("custom"),
  customFieldCreatedAt: z.string(),
  required: z.boolean().optional(),
});

export const RepeaterSchema = z.object({
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  kind: z.literal("repeater"),
  customFieldCreatedAtList: z.array(z.string()),
  required: z.boolean().optional(),
});

export const ApiFieldSchema = z.union([
  TextFieldSchema,
  TextAreaSchema,
  RichEditorSchema,
  ImageSchema,
  MultipleImageSchema,
  DateSchema,
  BooleanSchema,
  SelectFieldSchema,
  NumberSchema,
  RelationSchema,
  RelationListSchema,
  CustomSchema,
  RepeaterSchema,
]);

export const CustomFieldSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  fieldId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  fields: z.array(ApiFieldSchema),
  position: z.array(z.array(z.string())),
  viewerGroup: z.string(),
});

export const ApiSchemaSchema = z.object({
  apiFields: z.array(ApiFieldSchema),
  customFields: z.array(CustomFieldSchema),
});
export type ApiSchema = z.infer<typeof ApiSchemaSchema>;

export function parseSchema(schemaJson: string): ApiSchema {
  return ApiSchemaSchema.parse(JSON.parse(schemaJson));
}
