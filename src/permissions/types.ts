export const ResourceTypes = [
  "importInstructions",
  "commonVariable",
  "securedVariable",
  "chain",
  "snapshot",
  "deployment",
  "loggingSettings",
  "maskedFields",
  "session",
  "service",
  "specification",
  "specificationGroup",
  "environment",
  "liveExchanges",
  "devTools",
  "adminTools",
] as const;

export type ResourceType = typeof ResourceTypes[number];

export const Operations = [
  "create",
  "read",
  "update",
  "delete",
  "import",
  "export",

  "downloadTemplate", // securedVariables
  "revert", // snapshot
  "retry", // session

  "deprecate", // specification

  "access", // adminTools, devTools

] as const;

export type Operation = (typeof Operations)[number];

export type UserPermissions = Partial<Record<ResourceType, Operation[]>>;
