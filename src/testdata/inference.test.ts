import { assertEquals } from "@std/assert";
import type { SampleForListApi } from "./generated.ts";

// makeListResponseSchema の推論が壊れるとフィールドが unknown に潰れる。
// deno test は型チェックも行うので、以下の代入自体が回帰テストになる。
Deno.test("list API type keeps per-field inference", () => {
  const sample: SampleForListApi = {
    id: "id",
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
    textfield: "text",
  };

  const textfield: string | undefined = sample.textfield?.toUpperCase();
  const id: string = sample.id;

  assertEquals(textfield, "TEXT");
  assertEquals(id, "id");
});
