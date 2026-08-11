# microcms_sdk_generator

`microcms_sdk_generator` is a Deno tool designed to automatically generate
TypeScript SDKs from your [microCMS](https://microcms.io/) API schema. The tool
leverages [Zod](https://zod.dev/) schemas to ensure TypeScript type safety.
Installation and usage are easily handled via npm or Deno.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Installation with Deno](#installation-with-deno)
  - [Installation with npm](#installation-with-npm)
- [Usage](#usage)
  - [Generating from the management API](#generating-from-the-management-api)
  - [Generating from schema files](#generating-from-schema-files)
- [SDK Usage](#sdk-usage)
- [Schema Files](#schema-files)
- [Contributing](#contributing)
- [License](#license)
- [FAQ](#faq)

## Features

- Generates TypeScript SDKs from your [microCMS](https://microcms.io/) API
  schema automatically.
- Fetches schemas directly from the microCMS management API, or reads exported
  schema files.
- Utilizes [Zod](https://zod.dev/) schemas to maintain TypeScript type safety.
- Supports usage in both server-side and client-side environments.

## Getting Started

### Installation with Deno

Execute the following command for installation using Deno.

```sh
deno install --allow-read --allow-write --allow-net --allow-env https://deno.land/x/microcms_sdk_generator/microcms_sdk_generator.ts
```

> [microcms\_sdk\_generator \| Deno](https://deno.land/x/microcms_sdk_generator)

Or execute directly.

```sh
deno run --allow-read --allow-write --allow-net --allow-env https://deno.land/x/microcms_sdk_generator/microcms_sdk_generator.ts
```

NOTE: `--allow-net` and `--allow-env` are only required when generating from the
management API.

### Installation with npm

Execute the following command for installation using npm.

```sh
npm install --global microcms_sdk_generator
```

> [microcms\_sdk\_generator \- npm](https://www.npmjs.com/package/microcms_sdk_generator)

Or execute directly.

```sh
npx microcms_sdk_generator
```

## Usage

### Generating from the management API

Specify your service domain and API key, and the destination TypeScript file.
Every API in the service is fetched and generated, so no directory layout is
needed.

```sh
microcms_sdk_generator --service-domain <service domain> --api-key <api key> <destination typescript file>
```

The service domain and API key can also be given as the
`MICROCMS_SERVICE_DOMAIN` and `MICROCMS_API_KEY` environment variables, which
keeps the API key out of your shell history and process list.

```sh
MICROCMS_SERVICE_DOMAIN=your-service MICROCMS_API_KEY=your-api-key \
  microcms_sdk_generator ./src/generated.ts
```

The API key needs the `API情報の取得 (一覧・詳細)` permission, which is granted
under the `マネジメントAPI (ベータ)` tab of the API key settings.

> [GET /api/v1/apis/{endpoint} \| microCMS](https://document.microcms.io/management-api/get-api-info)

### Generating from schema files

Alternatively, specify the directory of the schema files exported from the
microCMS admin console, and the destination TypeScript file.

```sh
microcms_sdk_generator <schema directory> <destination typescript file>
```

For example, execute the following command on the root of this repository.

```sh
microcms_sdk_generator ./src/testdata/schemas ./src/testdata/generated.ts
```

## SDK Usage

### Initialize

Initialize the client with your service domain and API key.

```typescript
const client = createClient({
    serviceDomain: "YOUR_SERVICE_DOMAIN",
    apiKey: "YOUR_API_KEY",
});
```

### Making Requests

Use the client to make requests as follows.

```typescript
const resp = await client[`${endpointName}`].list({...})
const resp = await client[`${endpointName}`].get({...})
const resp = await client[`${endpointName}`].post({...})
const resp = await client[`${endpointName}`].put({...})
const resp = await client[`${endpointName}`].patch({...})
const resp = await client[`${endpointName}`].delete({...})
const resp = await client[`${endpointName}`].listMetadata({...})
const resp = await client[`${endpointName}`].getMetadata({...})
const resp = await client[`${endpointName}`].patchStatus({...})
```

For example, for the `sampleForListApi` endpoint.

```typescript
const listResp = await client.sampleForListApi.list({
    limit: 2,
    orders: ["-createdAt"],
});
if (!listResp.ok) {
    throw listResp;
}
console.log(listResp.data.contents);
```

## Schema Files

This section only applies when generating from schema files. Generating from the
management API resolves everything below automatically.

Schema files need to be placed under the schema directory in the following
structure:

- {schema directory}
  - list
    - {endpointName}.json
    - ...
  - object
    - {endpointName}.json
    - ...

NOTE: A schema file exported from the admin console does not carry the
`endpointName` or the `API type (list or object)`. Therefore, you should
structure your files as shown above.

Both the format exported from the admin console and the format returned by the
management API are accepted.

## Contributing

We welcome bug reports and feature requests through GitHub issues. Pull requests
are also welcome.

## License

This project is open-sourced under the MIT License. See the [LICENSE](./LICENSE)
file for details.

## FAQ

### How are empty fields represented?

microCMS returns an empty field either as `null` or by omitting the key
entirely, depending on how the content was written. The generated schemas accept
both and normalize them to `undefined`, so an optional field is always typed as
`T | undefined`.

> [GET APIのフィールドごとのレスポンス形式 \| microCMS](https://document.microcms.io/content-api/get-api-field-responses)

### How can I set up a retry policy?

You can prepare a fetcher capable of retrying, and specify it as a customFetcher
in option.

e.g.
[vercel/async\-retry: Retrying made simple, easy and async](https://github.com/vercel/async-retry)
