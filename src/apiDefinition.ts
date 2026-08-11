import { z } from "zod";
import type { ApiSchema } from "./schemaParser.ts";

export const apiTypes = ["list", "object"] as const;
export const ApiTypeSchema = z.enum(apiTypes);
export type ApiType = z.infer<typeof ApiTypeSchema>;

export type ApiDefinition = {
  endpointName: string;
  apiSchema: ApiSchema;
  apiType: ApiType;
};
