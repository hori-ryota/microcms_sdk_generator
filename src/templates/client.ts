import { match } from "npm:ts-pattern@^5.0.3";
import { format } from "npm:prettier@^3.0.0";
import { pascalCase } from "https://deno.land/x/case@2.1.1/mod.ts";
import { ApiDefinition } from "../schemaFilesParser.ts";
import camelCase from "https://deno.land/x/case@2.1.1/camelCase.ts";

export async function printClientImpl(
  apiDefinitions: ApiDefinition[],
): Promise<string> {
  return await format(
    `
export type RequestOptions = RequestInit & {
  customFetcher?: typeof fetch;
};

export type QueryForObjectApi = {
  draftKey?: string;
  fields?: string[];
  depth?: 1 | 2 | 3;
};

export type QueryForListApi = QueryForObjectApi & {
  limit: number;
  offset?: number;
  orders?: string[];
  q?: string;
  ids?: string[];
  filters?: string;
};

export class RequestError extends Error {
  public readonly ok = false;
  public readonly isRequestError = true;
  static {
    this.prototype.name = "RequestError";
  }
  constructor(
    public readonly statusCode: number,
    public readonly responseBody: string,
    public readonly responseHeaders: Headers,
  ) {
    super(\`Request failed with status code \${statusCode}: \${responseBody}\`);
  }
}

export class ParseResponseError extends Error {
  public readonly ok = false;
  public readonly isParseResponseError = true;
  static {
    this.prototype.name = "ParseResponseError";
  }
  constructor(
    public readonly statusCode: number,
    public readonly data: unknown,
    public readonly parseError: z.ZodError,
    public readonly responseHeaders: Headers,
  ) {
    super(
      \`Failed to parse response with status code \${statusCode}: \${parseError.message}: \${JSON.stringify(
        data
      )}\`
    );
  }
}

export function createClient({
  serviceDomain,
  apiKey,
  requestBaseOptions,
}: {
  serviceDomain: string;
  apiKey: string;
  requestBaseOptions?: RequestOptions;
}) {
  const headers = {
    "Content-Type": "application/json",
    "X-MICROCMS-API-KEY": apiKey,
  };

  function contentUrl(path: string) {
    return new URL(
      path,
      \`https://\${serviceDomain}.microcms.io/api/v1/\`
    ).toString();
  }
  function managementUrl(path: string) {
    return new URL(
      path,
      \`https://\${serviceDomain}.microcms-management.io/api/v1/\`
    ).toString();
  }

  async function request<OkResponseSchema extends z.AnyZodObject>(
    url: string,
    okResponseSchema: OkResponseSchema,
    options: RequestOptions
  ): Promise<
    | {
        ok: true;
        statusCode: number;
        data: z.infer<OkResponseSchema>;
        responseHeaders: Headers;
      }
    | RequestError
    | ParseResponseError
  > {
    const opts = {
      ...requestBaseOptions,
      ...options,
      headers: {
        ...headers,
        ...(requestBaseOptions?.headers ?? {}),
        ...(options?.headers ?? {}),
      },
    };

    const res = await (opts.customFetcher ?? fetch)(url, opts);
    if (!res.ok) {
      return new RequestError(res.status, await res.text(), res.headers);
    }

    let respBody: unknown;
    if (res.status === 202) {
      await res.text();
      respBody = {};
    } else {
      respBody = await res.json();
    }
    const parser = okResponseSchema.safeParse(respBody);
    if (!parser.success) {
      return new ParseResponseError(
        res.status,
        respBody,
        parser.error,
        res.headers
      );
    }
    return {
      ok: true,
      statusCode: res.status,
      data: parser.data,
      responseHeaders: res.headers,
    };
  }

  function requestGet<OkResponseSchema extends z.AnyZodObject>(
    url: string,
    okResponseSchema: OkResponseSchema,
    query?: QueryForObjectApi | QueryForListApi,
    options?: RequestOptions,
  ): Promise<
    | {
      ok: true;
      statusCode: number;
      data: z.infer<OkResponseSchema>;
      responseHeaders: Headers;
    }
    | RequestError
    | ParseResponseError
  > {
    const searchParams = new URLSearchParams(
      Object.fromEntries(
        Object.entries(query ?? {}).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.join(",") : v.toString(),
        ]),
      ),
    );

    return request(
      url + (searchParams.size > 0 ? \`?\${searchParams.toString()}\` : ""),
      okResponseSchema,
      { ...options, method: "GET" },
    );
  }

  function requestWrite<OkResponseSchema extends z.AnyZodObject>(
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    okResponseSchema: OkResponseSchema,
    content?: unknown,
    options?: RequestOptions,
  ): Promise<
    | {
      ok: true;
      statusCode: number;
      data: z.infer<OkResponseSchema>;
      responseHeaders: Headers;
    }
    | RequestError
    | ParseResponseError
  > {
    return request(url, okResponseSchema, {
      ...options,
      method,
      body: content ? JSON.stringify(content) : null,
    });
  }

  return {${
      apiDefinitions.map((apiDefinition) => {
        const pascalCaseEndpointName = pascalCase(apiDefinition.endpointName);
        const camelCaseEndpointName = camelCase(apiDefinition.endpointName);
        const schemaName = pascalCaseEndpointName + "Schema";
        const inputTypeName = pascalCaseEndpointName + "Input";
        return `${camelCaseEndpointName}: {
            ${
          match(apiDefinition.apiType)
            .with("list", () => {
              return [
                `list: ({
                    options,
                    ...query
                  }: QueryForListApi & {options?: RequestOptions}) =>
                    requestGet(
                      contentUrl(\`${apiDefinition.endpointName}\`),
                      makeListResponseSchema(${schemaName}),
                      query,
                      options,
                    ),`,
                `get: ({
                    id,
                    options,
                    ...query
                  }: QueryForObjectApi & {
                    id: string;
                    options?: RequestOptions;
                  }) =>
                    requestGet(
                      contentUrl(\`${apiDefinition.endpointName}/\${id}\`),
                      ${schemaName}.merge(MicroCmsListContentFieldsSchema),
                      query,
                      options,
                    ),`,
                `post: ({content, status, options}: {
                    content: ${inputTypeName};
                    status?: "draft";
                    options?: RequestOptions;
                  }) =>
                    requestWrite(
                      "POST",
                      contentUrl(\`${apiDefinition.endpointName}\${status ? \`?status=\${status}\` : ""}\`),
                      OnlyIdSchema,
                      content,
                      options,
                    ),`,
                `put: ({id, content, status, options}: {
                    id: string;
                    content: ${inputTypeName};
                    status?: "draft";
                    options?: RequestOptions;
                  }) =>
                    requestWrite(
                      "PUT",
                      contentUrl(\`${apiDefinition.endpointName}/\${id}\${status ? \`?status=\${status}\` : ""}\`),
                      OnlyIdSchema,
                      content,
                      options,
                    ),`,
                `patch: ({id, content, options}: {
                    id: string;
                    content: Partial<${inputTypeName}>;
                    options?: RequestOptions;
                  }) =>
                    requestWrite(
                      "PATCH",
                      contentUrl(\`${apiDefinition.endpointName}/\${id}\`),
                      OnlyIdSchema,
                      content,
                      options,
                    ),`,
                `delete: ({id, options}: {
                    id: string;
                    options?: RequestOptions;
                  }) =>
                    requestWrite(
                      "DELETE",
                      contentUrl(\`${apiDefinition.endpointName}/\${id}\`),
                      z.object({}),
                      undefined,
                      options,
                    ),`,
                `listMetadata: ({
                    options,
                    ...query
                  }: Pick<QueryForListApi, "limit" | "offset"> & {options?: RequestOptions}) =>
                    requestGet(
                      managementUrl(\`contents/${apiDefinition.endpointName}\`),
                      makeListResponseSchema(ListContentMetadataSchema),
                      query,
                      options,
                    ),`,
                `getMetadata: ({
                    id,
                    options,
                  }: QueryForObjectApi & {
                    id: string;
                    options?: RequestOptions;
                  }) =>
                    requestGet(
                      managementUrl(\`contents/${apiDefinition.endpointName}/\${id}\`),
                      ListContentMetadataSchema,
                      undefined,
                      options,
                    ),`,
                `patchStatus: ({id, status, options}: {
                    id: string;
                    status: "PUBLISH" | "DRAFT";
                    options?: RequestOptions;
                  }) =>
                    requestWrite(
                      "PATCH",
                      managementUrl(\`contents/${apiDefinition.endpointName}/\${id}/status\`),
                      OnlyIdSchema,
                      {status: [status]},
                      options,
                    ),`,
              ];
            })
            .with("object", () => {
              return [
                // NOTE: list is not supported for object type
                `get: (param?: QueryForObjectApi & {
                    options?: RequestOptions;
                  }) => {
                    const { options, ...query } = param ?? {};
                    return requestGet(
                      contentUrl(\`${apiDefinition.endpointName}\`),
                      ${schemaName}.merge(MicroCmsObjectContentFieldsSchema),
                      query,
                      options,
                    );
                  },`,
                // NOTE: post is not supported for object type
                // NOTE: put is not supported for object type
                `patch: ({content, options}: {
                    content: Partial<${inputTypeName}>;
                    options?: RequestOptions;
                  }) =>
                    requestWrite(
                      "PATCH",
                      contentUrl(\`${apiDefinition.endpointName}\`),
                      OnlyIdSchema,
                      content,
                      options,
                    ),`,
                `getMetadata: (params?: {
                    options?: RequestOptions;
                  }) => {
                    const { options } = params ?? {};
                    return requestGet(
                      managementUrl(\`contents/${apiDefinition.endpointName}\`),
                      ObjectContentMetadataSchema,
                      undefined,
                      options,
                    );
                  },`,
                // NOTE: may be not supported (tried but got 403 error response).
                // `patchStatus: ({status, options}: {
                //   status: "PUBLISH" | "DRAFT";
                //   options?: RequestOptions;
                // }) => {
                //   return requestWrite(
                //     "PATCH",
                //     managementUrl(\`contents/${apiDefinition.endpointName}/status\`),
                //     // FIXME: fix schema
                //     OnlyIdSchema,
                //     {status: [status]},
                //     options,
                //   );
                // },`,
              ];
            })
            .exhaustive()
            .join("\n")
        }
      }`;
      })
    }};
};`,
    { parser: "typescript" },
  );
}
