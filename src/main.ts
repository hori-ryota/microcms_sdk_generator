import { parseArgs } from "@std/cli/parse-args";
import { generate, generateFromManagementApi } from "./generate.ts";

const usage = `Usage:
  microcms_sdk_generator <schema directory> <destination typescript file>
  microcms_sdk_generator --service-domain <service domain> <destination typescript file>

Options:
  --service-domain  microCMS service domain. Generates from the management API instead of local schema files.
  --api-key         microCMS API key. Requires the "API情報の取得" permission.

Environment variables (used when the corresponding option is omitted):
  MICROCMS_SERVICE_DOMAIN
  MICROCMS_API_KEY`;

export async function main() {
  const args = parseArgs(Deno.args, {
    string: ["service-domain", "api-key"],
  });

  const serviceDomain = args["service-domain"] ??
    Deno.env.get("MICROCMS_SERVICE_DOMAIN");

  if (serviceDomain) {
    const apiKey = args["api-key"] ?? Deno.env.get("MICROCMS_API_KEY");
    const dstFilePath = args._[0]?.toString();
    if (!apiKey || !dstFilePath) {
      console.log(usage);
      Deno.exit(1);
    }
    await generateFromManagementApi({ serviceDomain, apiKey, dstFilePath });
    return;
  }

  const schemaDir = args._[0]?.toString();
  const dstFilePath = args._[1]?.toString();
  if (!schemaDir || !dstFilePath) {
    console.log(usage);
    Deno.exit(1);
  }
  await generate({ schemaDir, dstFilePath });
}

await main();
