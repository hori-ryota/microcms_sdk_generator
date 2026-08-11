import { dirname, fromFileUrl, join } from "@std/path";
import { findCustomField, parseSchema, UNKNOWN_KIND } from "./schemaParser.ts";
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

// microCMS は未設定の項目を null で書き出す。
// cf. https://document.microcms.io/management-api/get-api-info
Deno.test("parseSchema accepts null for unset properties", () => {
  const parsed = parseSchema(JSON.stringify({
    apiFields: [
      {
        fieldId: "title",
        name: "タイトル",
        kind: "text",
        description: null,
        required: false,
        textSizeLimitValidation: null,
        patternMatchValidation: null,
        isUnique: false,
        initialValue: null,
      },
    ],
    customFields: [],
  }));

  assertEquals(parsed.apiFields[0].kind, "text");
  assertEquals(parsed.apiFields[0].description, null);
});

Deno.test("parseSchema falls back for an unknown kind", () => {
  const parsed = parseSchema(JSON.stringify({
    apiFields: [
      { fieldId: "someday", name: "someday", kind: "aNewKindFromMicroCms" },
    ],
    customFields: [],
  }));

  const field = parsed.apiFields[0];
  assertEquals(field.kind, UNKNOWN_KIND);
  assertEquals(
    field.kind === UNKNOWN_KIND ? field.originalKind : undefined,
    "aNewKindFromMicroCms",
  );
});

Deno.test("findCustomField resolves both reference styles", () => {
  const customFields = [
    {
      createdAt: "2023-07-16T02:27:32.099Z",
      fieldId: "customField1",
      name: "customField1",
      fields: [],
    },
  ];

  assertEquals(
    findCustomField(customFields, { customFieldId: "customField1" })?.fieldId,
    "customField1",
  );
  assertEquals(
    findCustomField(customFields, {
      customFieldCreatedAt: "2023-07-16T02:27:32.099Z",
    })?.fieldId,
    "customField1",
  );
  assertEquals(
    findCustomField(customFields, { customFieldId: "nope" }),
    undefined,
  );
});
