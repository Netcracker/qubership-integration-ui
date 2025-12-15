import {
  Chain,
  DiagramMode,
  Element,
  IntegrationSystem,
} from "../api/apiTypes.ts";
import { Action, Participant, SequenceDiagram } from "./model.ts";
import { api } from "../api/api.ts";

const EMPTY_PROPERTY_STUB = "%empty_property%";

const TRIGGERS = [
  "async-api-trigger",
  "chain-trigger",
  "chain-trigger-2",
  "http-trigger",
  "kafka",
  "kafka-trigger-2",
  "pubsub-trigger",
  "quartz-scheduler",
  "rabbitmq",
  "rabbitmq-trigger-2",
  "scheduler",
  "sftp-trigger",
  "sftp-trigger-2",
];

const PARTICIPANTS_GETTERS: Record<string, ParticipantsGetter> = {
  "async-api-trigger": getAsyncApiTriggerParticipants,
  "chain-call": getChainCallParticipants,
  "chain-call-2": getChainCallParticipants,
  "chain-trigger": getChainTriggerParticipants,
  "chain-trigger-2": getChainTriggerParticipants,
  checkpoint: getCheckpointParticipants,
  "graphql-sender": getGraphQlSenderParticipants,
  "http-trigger": getHttpTriggerParticipants,
  "http-sender": getHttpSenderParticipants,
  kafka: getKafkaParticipants,
  "kafka-sender": getKafkaParticipants,
  "kafka-sender-2": getKafkaParticipants,
  "kafka-trigger-2": getKafkaParticipants,
  "mail-sender": getMailParticipants,
  "pubsub-sender": getPubSubParticipants,
  "pubsub-trigger": getPubSubParticipants,
  rabbitmq: getRabbitMqParticipants,
  "rabbitmq-sender": getRabbitMqParticipants,
  "rabbitmq-sender-2": getRabbitMqParticipants,
  "rabbitmq-trigger-2": getRabbitMqParticipants,
  "service-call": getServiceCallParticipants,
  "sftp-download": getSftpParticipants,
  "sftp-trigger": getSftpParticipants,
  "sftp-trigger-2": getSftpParticipants,
  "sftp-upload": getSftpParticipants,
};

const ELEMENT_ACTIONS_GETTERS: Record<string, TriggerActionsGetter> = {
  "async-api-trigger": () => [], // FIXME
  "chain-call": () => [], // FIXME
  "chain-call-2": () => [], // FIXME
  "chain-trigger": () => [], // FIXME
  "chain-trigger-2": () => [], // FIXME
  checkpoint: () => [], // FIXME
  choice: () => [], // FIXME
  "circuit-breaker": () => [], // FIXME
  "circuit-breaker-2": () => [], // FIXME
  condition: () => [], // FIXME
  "context-storage": () => [], // FIXME
  "file-read": () => [], // FIXME
  "file-write": () => [], // FIXME
  "graphql-sender": () => [], // FIXME
  "http-sender": () => [], // FIXME
  "http-trigger": () => [], // FIXME
  kafka: () => [], // FIXME
  "kafka-sender": () => [], // FIXME
  "kafka-sender-2": () => [], // FIXME
  "kafka-trigger-2": () => [], // FIXME
  loop: () => [], // FIXME
  "loop-2": () => [], // FIXME
  "mail-sender": () => [], // FIXME
  "pubsub-sender": () => [], // FIXME
  "pubsub-trigger": () => [], // FIXME
  "quartz-scheduler": () => [], // FIXME
  rabbitmq: () => [], // FIXME
  "rabbitmq-sender": () => [], // FIXME
  "rabbitmq-sender-2": () => [], // FIXME
  "rabbitmq-trigger-2": () => [], // FIXME
  reuse: () => [], // FIXME
  "reuse-reference": () => [], // FIXME
  scheduler: () => [], // FIXME
  "service-call": () => [], // FIXME
  "sftp-download": () => [], // FIXME
  "sftp-trigger": () => [], // FIXME
  "sftp-trigger-2": () => [], // FIXME
  "sftp-upload": () => [], // FIXME
  split: () => [], // FIXME
  "split-2": () => [], // FIXME
  "split-async": () => [], // FIXME
  "split-async-2": () => [], // FIXME
  swimlane: () => [], // FIXME
  "try-catch-finally": () => [], // FIXME
  "try-catch-finally-2": () => [], // FIXME
};

type ChainDependencies = {
  serviceMap: Map<string, IntegrationSystem>;
  chainMap: Map<string, Chain>; // element ID -> chain
};

type DiagramBuildContext = {
  mode: DiagramMode;
  chain: Chain;
  elementMap: Map<string, Element>;
  connections: Map<string, string>;
  dependencies: ChainDependencies;
};

type ParticipantsGetter = (
  element: Element,
  context: DiagramBuildContext,
) => Participant[];

type TriggerActionsGetter = (
  trigger: Element,
  context: DiagramBuildContext,
) => Action[];

export async function buildSequenceDiagram(
  chain: Chain,
  mode: DiagramMode,
): Promise<SequenceDiagram> {
  const context = createBuildContext(chain, mode);
  context.dependencies = await loadChainDependencies(context);

  const participants = [createChainParticipant(context)];
  const actions: Action[] = [];

  context.chain.elements
    .flatMap((element: Element) => {
      const participantsGetter = getParticipantsGetter(element.type);
      return participantsGetter(element, context);
    })
    .filter((participant) => {
      const participantAlreadyExists = participants.some(
        (p) => p.id === participant.id,
      );
      return !participantAlreadyExists;
    })
    .forEach((participant) => participants.push(participant));

  const triggers = getTriggers(context);

  triggers
    .flatMap((trigger) => {
      const actionsGetter = getElementActionsGetter(trigger);
      return actionsGetter(trigger, context);
    })
    .forEach((action) => actions.push(action));

  return {
    autonumber: true,
    participants,
    actions,
  };
}

function getAppName(): string {
  return "QIP"; // FIXME
}

function createBuildContext(
  chain: Chain,
  mode: DiagramMode,
): DiagramBuildContext {
  return {
    mode,
    chain,
    elementMap: new Map<string, Element>(chain.elements.map((e) => [e.id, e])),
    connections: new Map<string, string>(
      chain.dependencies.map((d) => [d.from, d.to]),
    ),
    dependencies: {
      serviceMap: new Map<string, IntegrationSystem>(),
      chainMap: new Map<string, Chain>(),
    },
  };
}

async function loadChainDependencies(
  context: DiagramBuildContext,
): Promise<ChainDependencies> {
  const elementIds: string[] = context.chain.elements
    .flatMap((element) => {
      return [
        element.properties["elementId"] as string,
        element.properties["idempotency"]?.["chainTriggerParameters"]?.[
          "triggerElementId"
        ],
        element.properties["chainFailureHandlerContainer"]?.["elementId"],
      ];
    })
    .filter((id) => !!id);

  const chainMap = new Map<string, Chain>(
    await Promise.all(
      elementIds.map<Promise<[string, Chain]>>(async (id) => [
        id,
        await api.findChainByElementId(id),
      ]),
    ),
  );

  const serviceIds = context.chain.elements
    .map((element) => element.properties["integrationSystemId"] as string)
    .filter((id) => !!id);
  const services = await Promise.all(
    serviceIds.map(async (id) => api.getService(id)),
  );

  return {
    chainMap,
    serviceMap: new Map<string, IntegrationSystem>(
      services.map((s) => [s.id, s]),
    ),
  };
}

function isTrigger(type: string): boolean {
  return TRIGGERS.includes(type);
}

function getTriggers(context: DiagramBuildContext): Element[] {
  return context.chain.elements.filter((element) => isTrigger(element.type));
}

function createChainParticipant(context: DiagramBuildContext): Participant {
  return {
    id: context.chain.id,
    name: `${getAppName()} chain: ${context.chain.name}`,
  };
}

function getElementActionsGetter(trigger: Element): TriggerActionsGetter {
  return ELEMENT_ACTIONS_GETTERS[trigger.type] ?? defaultElementActionsGetter;
}

function getParticipantsGetter(elementType: string): ParticipantsGetter {
  return PARTICIPANTS_GETTERS[elementType] ?? (() => []);
}

function getChainTriggerParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  return [createSimpleParticipant(`Unknown ${getAppName()} chain`)];
}

function getSftpParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const connectUrl =
    (element.properties["connectUrl"] as string) ?? EMPTY_PROPERTY_STUB;
  return [createSimpleParticipant(`SFTP server: ${connectUrl}`)];
}

function getGraphQlSenderParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const uri = (element.properties["uri"] as string) ?? EMPTY_PROPERTY_STUB;
  return [createSimpleParticipant(`GraphQL server: ${uri}`)];
}

function getKafkaParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const connectionSourceType = element.properties[
    "connectionSourceType"
  ] as string;
  const name =
    connectionSourceType === "maas"
      ? "Kafka (MaaS)"
      : `Kafka ${(element.properties["brokers"] as string) ?? EMPTY_PROPERTY_STUB}`;
  return [
    createSimpleParticipant(name),
    ...getIdempotencyParticipants(element, context),
  ];
}

function getRabbitMqParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const connectionSourceType = element.properties[
    "connectionSourceType"
  ] as string;
  const name =
    connectionSourceType === "maas"
      ? "RabbitMQ (MaaS)"
      : `RabbitMQ ${(element.properties["addresses"] as string) ?? EMPTY_PROPERTY_STUB}`;
  return [
    createSimpleParticipant(name),
    ...getIdempotencyParticipants(element, context),
  ];
}

function getPubSubParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const projectId =
    (element.properties["projectId"] as string) ?? EMPTY_PROPERTY_STUB;
  return [
    createSimpleParticipant(`Google Cloud PubSub Project Id ${projectId}`),
    ...getIdempotencyParticipants(element, context),
  ];
}

function getChainCallParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const elementId = element.properties["elementId"] as string;
  const chain = context.dependencies.chainMap.get(elementId);
  return [
    {
      id: elementId,
      name: `${getAppName()} chain: ${chain?.name ?? EMPTY_PROPERTY_STUB}`,
    },
  ];
}

function getMailParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const url = (element.properties["url"] as string) ?? EMPTY_PROPERTY_STUB;
  return [createSimpleParticipant(`Mail server: ${url}`)];
}

function getServiceCallParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const serviceId =
    (element.properties["integrationSystemId"] as string) ??
    EMPTY_PROPERTY_STUB;
  const service = context.dependencies.serviceMap.get(serviceId);
  return [
    { id: serviceId, name: `Service: ${service?.name ?? EMPTY_PROPERTY_STUB}` },
  ];
}

function getAsyncApiTriggerParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  return getServiceCallParticipants(element, context);
}

function getHttpSenderParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const uri = element.properties["uri"] as string ?? EMPTY_PROPERTY_STUB;
  const isExternalCall = element.properties["isExternalCall"];
  const host = /^https?:\/\/[^:/]+(:\\d{1,5})?/.exec(uri)?.[0] ?? EMPTY_PROPERTY_STUB;
  const name = `${isExternalCall === undefined || isExternalCall === null || Boolean(isExternalCall) ? "External" : "Internal"} service: ${host ?? EMPTY_PROPERTY_STUB}`;
  return [createSimpleParticipant(name)];
}

function getCheckpointParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  return [createSimpleParticipant("Unknown user")];
}

function getHttpTriggerParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const serviceId = element.properties["integrationSystemId"] as string ?? EMPTY_PROPERTY_STUB;
  const serviceName = context.dependencies.serviceMap.get(serviceId)?.name ?? EMPTY_PROPERTY_STUB;
  const isManualSource = !element.properties["systemType"];
  const isExternal = Boolean(element.properties["externalRoute"] ?? true);
  const isPrivate = Boolean(element.properties["privateRoute"] ?? false);
  const route =
    isExternal && isPrivate
      ? "external or private"
      : isExternal
        ? "external"
        : "private";
  const name = isManualSource
    ? `Unknown ${isExternal || isPrivate ? `external (via ${route} route)` : "internal"} service`
    : serviceName
      ? `Service: ${serviceName}`
      : "Unknown service";
  const id = isManualSource ? name : serviceId;
  return [{ id, name }, ...getIdempotencyParticipants(element, context)];
}

function getIdempotencyParticipants(
  element: Element,
  context: DiagramBuildContext,
): Participant[] {
  const enabled = Boolean(
    element.properties["idempotency"]?.["enabled"] ?? false,
  );
  const isChainCall =
    element.properties["idempotency"]?.["actionOnDuplicate"] ===
    "execute-subchain";
  const elementId =
    element.properties["idempotency"]?.["chainTriggerParameters"]?.[
      "triggerElementId"
    ] ?? EMPTY_PROPERTY_STUB;
  return enabled && isChainCall && elementId
    ? [
        {
          id: elementId,
          name: `${getAppName()} chain: ${context.dependencies.chainMap.get(elementId)?.name ?? EMPTY_PROPERTY_STUB}`,
        },
      ]
    : [];
}

function createSimpleParticipant(name: string): Participant {
  return { id: name, name };
}

function defaultElementActionsGetter(
  element: Element,
  context: DiagramBuildContext,
): Action[] {
  return context.mode === DiagramMode.FULL
    ? [
        {
          type: "message",
          fromId: element.id,
          toId: element.id,
          arrowType: "arrow-solid",
          message: element.name,
        },
      ]
    : [];
}
