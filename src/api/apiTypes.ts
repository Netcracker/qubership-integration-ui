export type Chain = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ElementRequest = {
  type: string;
};

export type ConnectionRequest = {
  from: string;
  to: string;
};

export type Connection = {
  id: string;
  from: string;
  to: string;
};

export type ChainCreationRequest = {
  name: string;
  labels: string[];
};

export type LibraryData = {
  groups: Group[];
  elements: Element[];
  childElements: Record<string, Element>;
};

export type Group = {
  name: string;
  title: string;
  groups: Group[];
  elements: Element[];
  childElements: Record<string, Element>;
};

export type Element = {
  id: string;
  name: string;
  title: string;
  folder: string;
  type: string;
  inputEnabled: boolean;
  inputQuantity: "any" | number;
  outputEnabled: boolean;
  container: boolean;
  ordered: boolean;
  allowedInContainers: boolean;
  priorityProperty?: string;
  reuseReferenceProperty?: string;
  mandatoryInnerElement: boolean;
  parentRestriction: string[];
  allowedChildren: Record<string, "one" | "many">;
  properties: {
    common: Property[];
    advanced: Property[];
    hidden: Property[];
    async: Property[];
  };
  customTabs: any[];
  deprecated: boolean;
  unsupported: boolean;
  oldStyleContainer: boolean;
  referencedByAnotherElement: boolean;
  designContainerParameters?: {
    endOperations: Operation[];
    children: ChildElement[];
  };
  queryProperties: any[];
  referenceProperties: any[];
};

export type Property = {
  name: string;
  title: string;
  description?: string;
  type: string;
  resetValueOnCopy: boolean;
  unique: boolean;
  caseInsensitive: boolean;
  mandatory: boolean;
  autofocus: boolean;
  query: boolean;
  allowedValues: any[];
  allowCustomValue: boolean;
  multiple: boolean;
  reference: boolean;
  default?: any;
  mask?: string;
};

export type Operation = {
  type: string;
  args: string[];
};

export type ChildElement = {
  name: string;
  primaryOperation: Operation;
};

export type Snapshot = {
  id: string;
  name: string;
  description: string;
  createdWhen: number;
  createdBy: User;
  modifiedWhen: number;
  modifiedBy: User;
  xmlDefinition: string;
  labels: EntityLabel[];
};

export type EntityLabel = {
  name: string;
  technical: boolean;
}

export type ActionDifference = {
  createdElements?: Element[];
  updatedElements?: Element[];
  removedElements?: Element[];
  createdDefaultSwimlaneId?: string;
  createdReuseSwimlaneId?: string;
  createdDependencies?: Connection[];
  removedDependencies?: Connection[];
}

export type RuntimeState = {
  status: string;
  error: string;
  stacktrace: string;
  suspended: boolean;
}

export type RuntimeStates = {
  states: { [key: string]: RuntimeState };
}

export type User = {
  id: string;
  username: string;
}

export type Deployment = {
  id: string;
  chainId: string;
  snapshotId: string;
  name: string;
  domain: string;
  createdWhen : number;
  createdBy: User;
  runtime?: RuntimeStates;
  serviceName: string;
}

export type CreateDeploymentRequest = {
  domain: string;
  snapshotId: string;
  suspended: boolean;
}

export type EngineDomain = {
  id: string;
  name: string;
  replicas: number;
  namespace: string;
  version?: string;
}

export type ChainLoggingSettings = {
  fallbackDefault: ChainLoggingProperties;
  consulDefault?: ChainLoggingProperties;
  custom?: ChainLoggingProperties;
}

export type ChainLoggingProperties = {
  sessionsLoggingLevel: SessionsLoggingLevel;
  logLoggingLevel: LogLoggingLevel;
  logPayloadEnabled?: boolean; //Deprecated since 24.4
  logPayload: LogPayload[];
  dptEventsEnabled: boolean;
  maskingEnabled: boolean;
}

export enum SessionsLoggingLevel {
  OFF = 'OFF',
  ERROR = 'ERROR',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export enum LogLoggingLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
}

export enum LogPayload {
  BODY = 'Body',
  HEADERS = 'Headers',
  PROPERTIES = 'Properties',
}

export type MaskedFields = {
  fields: MaskedField[];
}

export type MaskedField = {
  id: string;
  name: string;
  createdWhen: number;
  createdBy: User;
  modifiedWhen: number;
  modifiedBy: User;
}

export type EventsUpdate = {
    lastEventId: string;
    events: Event[];
}

export type Event = {
    id: string;
    time?: number;
    userId?: string;
    objectType: ObjectType;
    data?: any;
}

export enum ObjectType {
    DEPLOYMENT = 'DEPLOYMENT',
    ENGINE = 'ENGINE',
    GENERIC_MESSAGE = 'GENERIC_MESSAGE',
}