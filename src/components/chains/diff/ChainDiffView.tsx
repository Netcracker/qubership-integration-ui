import { Flex, FlexProps } from "antd";
import { Chain } from "../../../api/apiTypes.ts";
import { Change } from "./useChainDiff.tsx";
import React from "react";
import { ChainDiffViewControls } from "./ChainDiffViewControls.tsx";

export type ChainDiffViewProps = {
  chain1?: Chain;
  chain2?: Chain;
  changes: Change[];
  selectedChangeId?: string;
  onSelectChange: (id: string) => void;
} & FlexProps;

export const ChainDiffView: React.FC<ChainDiffViewProps> = ({
  chain1,
  chain2,
  changes,
  selectedChangeId,
  onSelectChange,
  ...rest
}): React.ReactNode => {
  return <Flex {...rest} vertical>
    <ChainDiffViewControls
      changes={changes}
      selectedChangeId={selectedChangeId}
      onSelectChange={onSelectChange}
    />
  </Flex>;
};
