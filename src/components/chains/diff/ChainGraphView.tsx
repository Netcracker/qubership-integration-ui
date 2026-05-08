import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import React, { useMemo, useRef } from "react";
import { Chain } from "../../../api/apiTypes.ts";
import { ElkDirectionContextProvider } from "../../../pages/ElkDirectionContext.tsx";
import {
  ElementFocus,
  ElementFocusContext,
  type FitViewToElementIdFn,
} from "../../graph/ElementFocus.tsx";
import { nodeTypes } from "../../graph/nodes/ChainGraphNodeTypes.ts";
import { CustomControls } from "../../graph/CustomControls.tsx";
import { useChainGraph } from "../../../hooks/graph/useChainGraph.tsx";
import { sanitizeEdge } from "../../../misc/chain-graph-utils.ts";
import { useElkDirection } from "../../../hooks/graph/useElkDirection.tsx";
import { ChainContext } from "../../../pages/ChainPage.tsx";
import { LibraryProvider } from "../../LibraryContext.tsx";

export type ChainGraphViewProps = {
  chain: Chain;
};

export const ChainGraphViewInner: React.FC<ChainGraphViewProps> = ({
  chain,
}): React.ReactNode => {
  const {
    nodes,
    edges,
    decorativeEdges,
    direction,
    toggleDirection,
    expandAllContainers,
    collapseAllContainers,
  } = useChainGraph(chain?.id, async () => {});

  const renderEdges = useMemo(
    () => [...edges, ...decorativeEdges].map(sanitizeEdge),
    [edges, decorativeEdges],
  );

  const { leftPanel, toggleLeftPanel, rightPanel, toggleRightPanel } =
    useElkDirection();

  const reactFlowWrapper = useRef(null);
  const fitViewToElementIdRef = useRef<FitViewToElementIdFn | null>(null);
  return (
    <div className="react-flow-container" ref={reactFlowWrapper}>
      <ElkDirectionContextProvider
        elkDirectionControl={{
          direction,
          toggleDirection,
          leftPanel,
          toggleLeftPanel,
          rightPanel,
          toggleRightPanel,
        }}
      >
        <ElementFocusContext.Provider value={fitViewToElementIdRef}>
          <div style={{ flex: 1, minWidth: 0, display: "flex" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ReactFlow
                nodes={nodes.map((node) => ({
                  ...node,
                  draggable: false,
                  connectable: false,
                }))}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={{ zIndex: 1001 }}
                edges={renderEdges}
                zoomOnDoubleClick={false}
                proOptions={{ hideAttribution: true }}
                fitView
              >
                <ElementFocus />
                <Background variant={BackgroundVariant.Dots} />
                <MiniMap
                  zoomable
                  pannable
                  position="top-right"
                  // nodeColor={getMinimapNodeColor}
                  // nodeStrokeColor={getMinimapNodeStrokeColor}
                  nodeStrokeWidth={2}
                />
                <CustomControls
                  showLeftPanelToggle={false}
                  onExpandAllContainers={expandAllContainers}
                  onCollapseAllContainers={collapseAllContainers}
                />
              </ReactFlow>
            </div>
          </div>
        </ElementFocusContext.Provider>
      </ElkDirectionContextProvider>
    </div>
  );
};

export const ChainGraphView: React.FC<ChainGraphViewProps> = ({
  chain,
}): React.ReactNode => {
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
          <ChainGraphViewInner chain={chain} />
        </ReactFlowProvider>
      </ChainContext.Provider>
    </LibraryProvider>
  );
};
