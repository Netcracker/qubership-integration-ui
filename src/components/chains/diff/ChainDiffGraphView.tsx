import React, { useEffect, useState } from "react";
import { Chain } from "../../../api/apiTypes.ts";
import { Change } from "./compare/types.ts";
import { Col, Flex, Row } from "antd";
import { ChangedEntityView, LinkToChain } from "./ChangedEntityView.tsx";
import { ChainGraphPanel } from "./ChainGraphPanel.tsx";
import styles from "./ChainDiffGraphView.module.css";

export function getElementId(
  change: Change | undefined,
  key: "one" | "another",
): string | undefined {
  return change?.kind === "element-property"
    ? change[key]?.entityId
    : change?.kind === "connection"
      ? change[key]?.from
      : undefined;
}

export type ChainDiffGraphViewProps = {
  chain1?: Chain;
  chain2?: Chain;
  changes: Change[];
  selectedChangeId?: string;
  onSelectChange: (id: string) => void;
};

export const ChainDiffGraphView: React.FC<ChainDiffGraphViewProps> = ({
  chain1,
  chain2,
  changes,
  selectedChangeId,
  onSelectChange,
}): React.ReactNode => {
  const [selectedChange, setSelectedChange] = useState<Change | undefined>(
    undefined,
  );

  useEffect(() => {
    setSelectedChange(changes.find((c) => c.id === selectedChangeId));
  }, [changes, selectedChangeId]);

  return (
    <Flex
      vertical
      gap={16}
      style={{ minHeight: 0, flexGrow: 1, flexShrink: 1 }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <LinkToChain chain={chain1} />
        </Col>
        <Col span={12}>
          <LinkToChain chain={chain2} />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          {selectedChange && chain1 ? (
            <ChangedEntityView
              side="one"
              change={selectedChange}
              chain={chain1}
            />
          ) : null}
        </Col>
        <Col span={12}>
          {selectedChange && chain2 ? (
            <ChangedEntityView
              side="another"
              change={selectedChange}
              chain={chain2}
            />
          ) : null}
        </Col>
      </Row>
      <Row gutter={16} style={{ minHeight: 0, flexGrow: 1, flexShrink: 0 }}>
        <Col span={12}>
          {chain1 ? (
            <ChainGraphPanel
              chain={chain1}
              className={styles["left-view"]}
              selectedElementId={getElementId(selectedChange, "one")}
            />
          ) : null}
        </Col>
        <Col span={12}>
          {chain2 ? (
            <ChainGraphPanel
              chain={chain2}
              className={styles["right-view"]}
              selectedElementId={getElementId(selectedChange, "another")}
            />
          ) : null}
        </Col>
      </Row>
    </Flex>
  );
};
