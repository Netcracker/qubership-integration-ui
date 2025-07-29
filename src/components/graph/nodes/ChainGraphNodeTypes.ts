import {ElementDescriptor} from "../../../api/apiTypes.ts";
import {ElkDirection} from "../../../hooks/graph/useElkDirection.tsx";
import {Edge, Node} from "@xyflow/react";
import {ContainerNode} from "./ContainerNode.tsx";
import {UnitNode} from "./UnitNode.tsx";

export type ChainGraphNodeData =  {
    elementType: string;
    label: string;
    description: string;
    properties: ElementDescriptor["properties"];
    direction?: ElkDirection;
    inputEnabled?: boolean;
    outputEnabled?: boolean;
};

export type ChainGraphNode = Node<ChainGraphNodeData>;

export const nodeTypes = {
    container: ContainerNode,
    unit: UnitNode,
};

export type OnDeleteEvent = {
    nodes: Node<ChainGraphNodeData>[];
    edges: Edge[];
};
