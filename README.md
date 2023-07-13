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
- [SDK Usage](#sdk-usage)
- [Schema Files](#schema-files)
- [Contributing](#contributing)
- [License](#license)
- [FAQ](#faq)

## Features

- Generates TypeScript SDKs from your [microCMS](https://microcms.io/) API
  schema automatically.
- Utilizes [Zod](https://zod.dev/) schemas to maintain TypeScript type safety.
- Supports usage in both server-side and client-side environments.

## Getting Started

### Installation with Deno

Execute the following command for installation using Deno.

```sh
deno install --allow-net --unstable --reload https://deno.land/x/microcms_sdk_generator/mod.ts
```

### Installation with npm

Execute the following command for installation using npm.

```sh
npm install --global microcms_sdk_generator
```

## Usage

To use the tool, specify the directory of the schema files and the destination
TypeScript file.

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

Schema files need to be placed under the schema directory in the following
structure:

- {schema directory}
  - list
    - {endpointName}.json
    - ...
  - object
    - {endpointName}.json
    - ...

NOTE: microCMS currently does not support exporting schemas per endpoint. You
will need to use the exported schema file, but this file does not resolve
`endpointName` and `API type (list or object)`. Therefore, you should structure
your files as shown above.

## Contributing

We welcome bug reports and feature requests through GitHub issues. Pull requests
are also welcome.

## License

This project is open-sourced under the MIT License. See the [LICENSE](./LICENSE)
file for details.

## FAQ

### How can I set up a retry policy?

You can prepare a fetcher capable of retrying, and specify it as a customFetcher
in option.

e.g.
[vercel/async\-retry: Retrying made simple, easy and async](https://github.com/vercel/async-retry)
