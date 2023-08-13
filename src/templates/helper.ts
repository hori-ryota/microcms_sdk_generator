import { pascalCase } from "https://deno.land/x/case@2.1.1/mod.ts";

export function typeName(endpointName: string) {
  return `${pascalCase(endpointName)}`;
}

export function typeSchemaName(endpointName: string) {
  return `${typeName(endpointName)}Schema`;
}

export function defTypeName(endpointName: string) {
  return `${pascalCase(endpointName)}Def`;
}

export function defTypeSchemaName(endpointName: string) {
  return `${defTypeName(endpointName)}Schema`;
}

export function customFieldTypeName(
  endpointName: string,
  customFieldId: string,
): string {
  return `${pascalCase(endpointName)}_${pascalCase(customFieldId)}`;
}

export function customFieldTypeSchemaName(
  endpointName: string,
  customFieldId: string,
) {
  return `${customFieldTypeName(endpointName, customFieldId)}Schema`;
}

export function inputTypeName(endpointName: string) {
  return `${pascalCase(endpointName)}Input`;
}

export function inputTypeSchemaName(endpointName: string) {
  return `${inputTypeName(endpointName)}Schema`;
}

export function outputTypeName(endpointName: string) {
  return `${pascalCase(endpointName)}Output`;
}

export function outputTypeSchemaName(endpointName: string) {
  return `${outputTypeName(endpointName)}Schema`;
}
