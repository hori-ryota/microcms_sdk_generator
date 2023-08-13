import { assertObjectMatch } from "https://deno.land/std@0.194.0/testing/asserts.ts";
import {
  createClient,
  SampleForListApiDef,
  SampleForListApiDefSchema,
  SampleForObjectApiInputSchema,
} from "./generated.ts";

Deno.test({
  name: "CRUD: list",
  ignore: !Deno.env.get("TEST_WITH_MICROCMS_REQUEST"),
  fn: async () => {
    // fixtures
    const now = new Date();
    const nowString = now.toISOString();
    const sample1: SampleForListApiDef = {
      textfield: "sample1" + nowString,
    };

    const client = createClient({
      serviceDomain: Deno.env.get("TEST_SERVICE_DOMAIN")!,
      apiKey: Deno.env.get("TEST_API_KEY")!,
    });

    // create by post
    const postResp = await client.sampleForListApi.post({
      content: sample1,
    });
    if (!postResp.ok) {
      throw postResp;
    }

    // create by put
    const putResp = await client.sampleForListApi.put({
      id: now.getTime().toString(),
      content: sample1,
    });
    if (!putResp.ok) {
      throw putResp;
    }

    // list
    const listResp = await client.sampleForListApi.list({
      limit: 2,
      orders: ["-createdAt"],
    });
    if (!listResp.ok) {
      throw listResp;
    }
    assertObjectMatch(listResp.data.contents[0], {
      ...sample1,
      ...putResp.data,
    });
    assertObjectMatch(listResp.data.contents[1], {
      ...sample1,
      ...postResp.data,
    });

    // list with offset
    const listWithOffsetResp = await client.sampleForListApi.list({
      limit: 2,
      offset: 1,
      orders: ["-createdAt"],
    });
    if (!listWithOffsetResp.ok) {
      throw listWithOffsetResp;
    }
    assertObjectMatch(listWithOffsetResp.data.contents[0], {
      ...sample1,
      ...postResp.data,
    });

    // get and update
    const getResp = await client.sampleForListApi.get({ id: postResp.data.id });
    if (!getResp.ok) {
      throw getResp;
    }
    const patchResp = await client.sampleForListApi.patch({
      id: getResp.data.id,
      content: SampleForListApiDefSchema.parse(getResp.data),
    });
    if (!patchResp.ok) {
      throw patchResp;
    }

    // metadata
    const listMetadataResp = await client.sampleForListApi.listMetadata({
      limit: 10,
    });
    if (!listMetadataResp.ok) {
      throw listMetadataResp;
    }
    const getMetadataResp = await client.sampleForListApi.getMetadata({
      id: getResp.data.id,
    });
    if (!getMetadataResp.ok) {
      throw getMetadataResp;
    }

    // update status
    const patchStatusResp = await client.sampleForListApi.patchStatus({
      id: getResp.data.id,
      status: "DRAFT",
    });
    if (!patchStatusResp.ok) {
      throw patchStatusResp;
    }

    // delete
    await Promise.all(
      [postResp, putResp].map(async (resp) => {
        const id = resp.data.id;
        const deleteResp = await client.sampleForListApi.delete({
          id,
        });
        if (!deleteResp.ok) {
          throw deleteResp;
        }
      }),
    );
  },
});

Deno.test({
  name: "CRUD: object",
  ignore: !Deno.env.get("TEST_WITH_MICROCMS_REQUEST"),
  fn: async () => {
    // init
    const client = createClient({
      serviceDomain: Deno.env.get("TEST_SERVICE_DOMAIN")!,
      apiKey: Deno.env.get("TEST_API_KEY")!,
    });

    // get and update
    const getResp = await client.sampleForObjectApi.get();
    if (!getResp.ok) {
      throw getResp;
    }
    const patchInput = SampleForObjectApiInputSchema.parse({
      ...getResp.data,
      relation: getResp.data.relation?.id,
      multirelation: getResp.data.multirelation?.map((r) => r.id),
    });
    const patchResp = await client.sampleForObjectApi.patch({
      content: patchInput,
    });
    if (!patchResp.ok) {
      throw patchResp;
    }

    // metadata
    const getMetadataResp = await client.sampleForObjectApi.getMetadata();
    if (!getMetadataResp.ok) {
      throw getMetadataResp;
    }
  },
});
