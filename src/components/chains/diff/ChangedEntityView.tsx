import { Change, ChangedSide } from "./compare/types.ts";
import {
  Chain,
  Connection,
  Element,
  EntityLabel,
} from "../../../api/apiTypes.ts";
import React from "react";
import { Descriptions, Space } from "antd";
import { EntityLabels } from "../../labels/EntityLabels.tsx";

export function getElement(
  elementId: string,
  chain: Chain,
): Element | undefined {
  return chain.elements.find((e) => e.id === elementId);
}

export const LinkToChain: React.FC<{ chain?: Chain }> = ({
  chain,
}): React.ReactNode => {
  return chain ? (
    <a href={`/chains/${chain.id}`} target="_blank">
      {chain.name}
    </a>
  ) : null;
};

export const LinkToElement: React.FC<{ element?: Element }> = ({
  element,
}): React.ReactNode => {
  return element ? (
    <a href={`/chains/${element.chainId}/graph/${element.id}`} target="_blank">
      {element.name}
    </a>
  ) : (
    <></>
  );
};

export const ChainProperty: React.FC<{ name: string; value: unknown }> = ({
  name,
  value,
}): React.ReactNode => {
  return (
    <Descriptions
      size="small"
      layout="horizontal"
      colon={true}
      column={1}
      items={[
        {
          key: "name",
          label: "Name",
          children: name,
        },
        {
          key: "value",
          label: "Value",
          children:
            name === "labels" ? (
              <EntityLabels labels={(value ?? []) as EntityLabel[]} />
            ) : (
              JSON.stringify(value)
            ),
        },
      ]}
    />
  );
};

export const ElementProperty: React.FC<{
  element?: Element;
  name: string;
  value: unknown;
}> = ({ element, name, value }): React.ReactNode => {
  return (
    <Descriptions
      size="small"
      layout="horizontal"
      colon={true}
      column={1}
      items={[
        ...(element
          ? [
              {
                key: "element",
                label: "Element",
                children: <LinkToElement element={element} />,
              },
            ]
          : []),
        {
          key: "name",
          label: "Name",
          children: name,
        },
        {
          key: "value",
          label: "Value",
          children:
            name === "labels" ? (
              <EntityLabels labels={(value ?? []) as EntityLabel[]} />
            ) : (
              JSON.stringify(value)
            ),
        },
      ]}
    />
  );
};

export const ConnectionView: React.FC<{
  connection: Connection;
  chain: Chain;
}> = ({ connection, chain }) => {
  return (
    <Space>
      <LinkToElement element={getElement(connection.from, chain)} />
      →
      <LinkToElement element={getElement(connection.to, chain)} />
    </Space>
  );
};

export type ChangedEntityViewProps = {
  change: Change;
  side: ChangedSide;
  chain: Chain;
};

export const ChangedEntityView: React.FC<ChangedEntityViewProps> = ({
  side,
  change,
  chain,
}): React.ReactNode => {
  if (!change[side]) {
    return "N/A";
  }
  switch (change.kind) {
    case "element":
      return <LinkToElement element={change[side]} />;
    case "chain-property":
      return (
        <ChainProperty name={change[side].name} value={change[side].value} />
      );
    case "element-property":
      return (
        <ElementProperty
          element={getElement(change[side].entityId, chain)}
          name={change[side].name}
          value={change[side].value}
        />
      );
    case "connection":
      return <ConnectionView connection={change[side]} chain={chain} />;
    default:
      return <></>;
  }
};
