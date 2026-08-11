import { z } from "zod";
import { type ApiDefinition, ApiTypeSchema } from "./apiDefinition.ts";
import { ApiSchemaSchema } from "./schemaParser.ts";

// cf. https://document.microcms.io/management-api/get-api-list
export const ApiListSchema = z.object({
  apis: z.array(
    z.object({
      name: z.string(),
      endpoint: z.string(),
      type: ApiTypeSchema,
    }),
  ),
});

export type ManagementApiOptions = {
  serviceDomain: string;
  apiKey: string;
};

async function request<Schema extends z.ZodType>(
  { serviceDomain, apiKey }: ManagementApiOptions,
  path: string,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const url = `https://${serviceDomain}.microcms-management.io/api/v1/${path}`;
  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": apiKey },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to request ${url}: ${res.status} ${await res.text()}`,
    );
  }
  return schema.parse(await res.json());
}

/**
 * マネジメントAPIから全APIのスキーマを取得する。
 * APIキーには「API情報の取得（一覧・詳細）」の権限が必要。
 * cf. https://document.microcms.io/management-api/get-api-info
 */
export async function fetchApiDefinitions(
  options: ManagementApiOptions,
): Promise<ApiDefinition[]> {
  const { apis } = await request(options, "apis", ApiListSchema);
  const definitions = await Promise.all(
    apis.map(async (api): Promise<ApiDefinition> => ({
      endpointName: api.endpoint,
      apiType: api.type,
      apiSchema: await request(
        options,
        `apis/${api.endpoint}`,
        ApiSchemaSchema,
      ),
    })),
  );
  return definitions.sort((a, b) =>
    a.endpointName.localeCompare(b.endpointName)
  );
}
