export const ResourceTypes = [
  "importInstructions",
  "secret",
  "commonVariable",
  "securedVariable",
  "folder",
  "chain",
  "snapshot",
  "deployment",
  "loggingSettings",
  "maskedField",
  "session",
  "service",
  "specification",
  "specificationGroup",
  "environment",
  "liveExchange",
  "devTools",
  "adminTools",
  "designTemplate",
  "actionLog"
] as const;

export type ResourceType = (typeof ResourceTypes)[number];

export const Operations = [
  "create",
  "read",
  "update",
  "delete",
  "import",
  "export",

  // chain
  "generateDDS",

  // chain, snapshot
  "compare",
  "generateSequenceDiagram",

  // snapshot
  "showXml",

  // snapshot
  "revert", // redundant? chain update?

  // session
  "retry",

  // specification
  "deprecate",

  // liveExchange
  "stop",

  // adminTools, devTools
  "access",

  // service
  "discover"
] as const;

export type Operation = (typeof Operations)[number];

export type UserPermissions = Partial<Record<ResourceType, Operation[]>>;

export type RequiredPermissions =
  | UserPermissions
  | { anyOf: UserPermissions[] };
