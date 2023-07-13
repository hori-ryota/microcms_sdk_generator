import { format } from "npm:prettier@^3.0.0";
export async function printBaseSchemas(): Promise<string> {
  return await format(
    `
// cf. https://document.microcms.io/manual/automatic-grant-fields
export const MicroCmsObjectContentFieldsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
  revisedAt: z.string().datetime().optional(),
});
export type MicroCmsObjectContentFields = z.infer<typeof MicroCmsObjectContentFieldsSchema>;

export const OnlyIdSchema = z.object({
  id: z.string(),
})
export type OnlyId = z.infer<typeof OnlyIdSchema>;

export const MicroCmsListContentFieldsSchema = MicroCmsObjectContentFieldsSchema.merge(OnlyIdSchema);
export type MicroCmsListContentFields = z.infer<typeof MicroCmsListContentFieldsSchema>;

export const makeListResponseSchema = <ContentSchema extends z.AnyZodObject>(
  contentSchema: ContentSchema,
) =>
  z.object({
    contents: z.array(MicroCmsListContentFieldsSchema.merge(contentSchema)),
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  });
export type ListResponse = z.infer<ReturnType<typeof makeListResponseSchema>>;

export const ObjectContentMetadataSchema = MicroCmsObjectContentFieldsSchema.extend({
  closedAt: z.string().datetime().nullable(),
  status: z.tuple([
    z.enum(["DRAFT", "PUBLISH", "PUBLISH_AND_DRAFT", "CLOSED"]),
  ]),
  customStatus: z.tuple([z.unknown()]).nullable(),
  draftKey: z.string().nullable(),
  reservationTime: z
    .object({
      publishTime: z.string().datetime().nullable(),
      stopTime: z.string().datetime().nullable(),
    })
    .nullable(),
});
export type ObjectContentMetadata = z.infer<typeof ObjectContentMetadataSchema>;

export const ListContentMetadataSchema = ObjectContentMetadataSchema.extend({
  id: z.string(),
});
export type ListContentMetadata = z.infer<typeof ListContentMetadataSchema>;
`,
    { parser: "typescript" },
  );
}
