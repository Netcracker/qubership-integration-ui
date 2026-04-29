import { Button, Flex, Radio, Tooltip } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { Change } from "./useChainDiff.tsx";
import { OverridableIcon } from "../../../icons/IconProvider.tsx";

export type DiffViewType = "graph" | "list";

export type ChainDiffViewControlsProps = {
  changes: Change[];
  selectedChangeId?: string;
  onSelectChange: (id: string) => void;
  onViewTypeChange: (value: DiffViewType) => void;
};

export const ChainDiffViewControls: React.FC<ChainDiffViewControlsProps> = ({
  changes,
  selectedChangeId,
  onSelectChange,
}): React.ReactNode => {
  const [isFirstChange, setIsFirstChange] = useState<boolean>(false);
  const [isLastChange, setIsLastChange] = useState<boolean>(false);

  useEffect(() => {
    setIsFirstChange(
      !!selectedChangeId &&
        changes.length > 0 &&
        changes[0].id === selectedChangeId,
    );
  }, [selectedChangeId, changes]);

  useEffect(() => {
    setIsLastChange(
      !!selectedChangeId &&
        changes.length > 0 &&
        changes[changes.length - 1].id === selectedChangeId,
    );
  }, [selectedChangeId, changes]);

  const goToPreviousChange = useCallback(() => {
    const idx = changes.findIndex((c) => c.id === selectedChangeId);
    const prevIdx = idx > 0 ? idx - 1 : 0;
    const id = changes[prevIdx]?.id;
    onSelectChange(id);
  }, [changes, selectedChangeId, onSelectChange]);

  const gotToNextChange = useCallback(() => {
    const idx = changes.findIndex((c) => c.id === selectedChangeId);
    const lastIdx = changes.length - 1;
    const nextIdx = idx < 0 || idx === lastIdx ? lastIdx : idx + 1;
    const id = changes[nextIdx]?.id;
    onSelectChange(id);
  }, [changes, selectedChangeId, onSelectChange]);

  return (
    <Flex vertical={false} align={"center"} justify={"space-between"} gap={24}>
      <Flex vertical={false} align={"center"} gap={8}>
        <Tooltip title={"Previous change"}>
          <Button
            icon={<OverridableIcon name={"previousChange"} />}
            type={"text"}
            disabled={isFirstChange}
            onClick={goToPreviousChange}
          />
        </Tooltip>
        <Tooltip title={"Next change"}>
          <Button
            icon={<OverridableIcon name={"nextChange"} />}
            type={"text"}
            disabled={isLastChange}
            onClick={gotToNextChange}
          />
        </Tooltip>
      </Flex>
      <Radio.Group
        size={"small"}
        block
        options={[
          { label: "Graph", value: "graph" },
          { label: "List", value: "list" },
        ]}
        defaultValue="graph"
        optionType="button"
        buttonStyle="solid"
      />
    </Flex>
  );
};
