import { dirname, fromFileUrl, join } from "@std/path";
import { parseSchema } from "./schemaParser.ts";
import { assertEquals } from "@std/assert";

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
