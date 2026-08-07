import { format } from "prettier";
export async function printBaseSchemas(): Promise<string> {
  return await format(
    `
// cf. https://document.microcms.io/manual/automatic-grant-fields
export const MicroCmsObjectContentFieldsSchema = z.object({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().optional(),
  revisedAt: z.iso.datetime().optional(),
});
export type MicroCmsObjectContentFields = z.infer<typeof MicroCmsObjectContentFieldsSchema>;

export const OnlyIdSchema = z.object({
  id: z.string(),
})
export type OnlyId = z.infer<typeof OnlyIdSchema>;

export const MicroCmsListContentFieldsSchema = MicroCmsObjectContentFieldsSchema.extend(OnlyIdSchema.shape);
export type MicroCmsListContentFields = z.infer<typeof MicroCmsListContentFieldsSchema>;

export const makeListResponseSchema = <DefTypeSchema extends z.ZodObject>(
  defTypeSchema: DefTypeSchema,
) =>
  z.object({
    contents: z.array(MicroCmsListContentFieldsSchema.extend(defTypeSchema.shape)),
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  });
export type ListResponse = z.infer<ReturnType<typeof makeListResponseSchema>>;

export const ObjectContentMetadataSchema = z.object({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().nullable(),
  revisedAt: z.iso.datetime().nullable(),
  closedAt: z.iso.datetime().nullable(),
  status: z.tuple([
    z.enum(["DRAFT", "PUBLISH", "PUBLISH_AND_DRAFT", "CLOSED"]),
  ]),
  customStatus: z.tuple([z.unknown()]).nullable(),
  draftKey: z.string().nullable(),
  reservationTime: z
    .object({
      publishTime: z.iso.datetime().nullable(),
      stopTime: z.iso.datetime().nullable(),
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
