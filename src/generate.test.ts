import { dirname, fromFileUrl, join } from "@std/path";
import { assertEquals } from "@std/assert";
import { generateAsString } from "./generate.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

// 管理画面のエクスポートとマネジメントAPIではスキーマJSONの形式が異なる
// （customFieldCreatedAt / customFieldId、position / fieldOrderByColumn、null の有無など）が、
// 生成される SDK は同じでなければならない。
Deno.test("generates the same SDK from export format and management API format", async () => {
  const fromExport = await generateAsString({
    schemaDir: join(__dirname, "testdata", "schemas"),
  });
  const fromManagementApi = await generateAsString({
    schemaDir: join(__dirname, "testdata", "schemas-management-api"),
  });

  assertEquals(fromManagementApi, fromExport);
});
