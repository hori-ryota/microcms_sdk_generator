import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.194.0/path/mod.ts";
import { parseSchema } from "./schemaParser.ts";
import { assertEquals } from "https://deno.land/std@0.194.0/testing/asserts.ts";

const __filename = fromFileUrl(import.meta.url);
const __dirname = dirname(__filename);

Deno.test("parseSchema", () => {
  const jsonStr = Deno.readTextFileSync(
    join(
      __dirname,
      "testdata",
      "schemas",
      "object",
      "sample-for-object-api.schema.json",
    ),
  ).toString();

  assertEquals(parseSchema(jsonStr), JSON.parse(jsonStr));
});
