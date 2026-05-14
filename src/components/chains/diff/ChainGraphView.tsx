import { ReactFlowProvider } from "@xyflow/react";
import React, { HTMLAttributes, useRef } from "react";
import { Chain } from "../../../api/apiTypes.ts";
import {
  ElementFocusContext,
  type FitViewToElementIdFn,
} from "../../graph/ElementFocus.tsx";
import { ChainGraphView as ChainGraphViewInner } from "../../../pages/ChainGraphView.tsx";
import { ChainContext } from "../../../pages/ChainPage.tsx";
import { LibraryProvider } from "../../LibraryContext.tsx";

export type ChainGraphViewProps = HTMLAttributes<HTMLDivElement> & {
  chain: Chain;
};

export const ChainGraphView: React.FC<ChainGraphViewProps> = ({
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
            <ChainGraphViewInner readOnly={true} {...rest} />
          </ElementFocusContext.Provider>
        </ReactFlowProvider>
      </ChainContext.Provider>
    </LibraryProvider>
  );
};
