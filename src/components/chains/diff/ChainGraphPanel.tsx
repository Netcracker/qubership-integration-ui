import { ReactFlowProvider } from "@xyflow/react";
import React, { HTMLAttributes, useEffect, useRef } from "react";
import { Chain } from "../../../api/apiTypes.ts";
import {
  ElementFocusContext,
  type FitViewToElementIdFn,
  useFocusToElementId,
} from "../../graph/ElementFocus.tsx";
import { ChainGraphView } from "../../../pages/ChainGraphView.tsx";
import { ChainContext } from "../../../pages/ChainPage.tsx";
import { LibraryProvider } from "../../LibraryContext.tsx";

export type ChainGraphPanelInnerProps = HTMLAttributes<HTMLDivElement> & {
  selectedElementId?: string;
};

export const ChainGraphPanelInner: React.FC<ChainGraphPanelInnerProps> = ({
  selectedElementId,
  ...rest
}): React.ReactNode => {
  const focusToElementId = useFocusToElementId();

  useEffect(() => {
    if (selectedElementId) {
      focusToElementId(selectedElementId);
    }
  }, [focusToElementId, selectedElementId]);

  return <ChainGraphView readOnly={true} {...rest} />;
};

export type ChainGraphViewProps = ChainGraphPanelInnerProps & {
  chain: Chain;
};

export const ChainGraphPanel: React.FC<ChainGraphViewProps> = ({
  chain,
  ...rest
}): React.ReactNode => {
  const fitViewToElementIdRef = useRef<FitViewToElementIdFn | null>(null);
  return (
    <LibraryProvider>
      <ChainContext.Provider
        value={{
          chain,
          update: async () => {},
          refresh: async () => {},
        }}
      >
        <ReactFlowProvider>
          <ElementFocusContext.Provider value={fitViewToElementIdRef}>
            <ChainGraphPanelInner {...rest} />
          </ElementFocusContext.Provider>
        </ReactFlowProvider>
      </ChainContext.Provider>
    </LibraryProvider>
  );
};
