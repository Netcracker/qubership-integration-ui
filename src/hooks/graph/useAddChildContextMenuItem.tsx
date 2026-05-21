import { useLibraryContext } from "../../components/LibraryContext";
import { useNotificationService } from "../useNotificationService";
import { ContextMenuItemsHook } from "./useContextMenu";
import { CreateElementRequest, LibraryElement } from "../../api/apiTypes";
import { api } from "../../api/api";
import { Element } from "../../api/apiTypes.ts";
import {
  buildGraphNodes,
  findLibraryElement,
  getLibraryElement,
  getNodeFromElement,
  sortParentsBeforeChildren,
} from "../../misc/chain-graph-utils";
import {
  ChainGraphNode,
  ChainGraphNodeData,
} from "../../components/graph/nodes/ChainGraphNodeTypes";
import { arrangeNodes, useAutoLayout } from "./useAutoLayout";
import { getErrorMessage } from "../../misc/error-utils";
import { Node } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { ContextMenuItem } from "../../components/graph/ContextMenu";
import { useExpandCollapse } from "./useExpandCollapse";

export const useAddChildContextMenuItem: ContextMenuItemsHook = ({
  nodes,
  setNodes,
  edges,
  setEdges,
  structureChanged,
  chainId,
}) => {
  const notificationService = useNotificationService();
  const { libraryElements } = useLibraryContext();
  const { arrangeNodes, direction } = useAutoLayout();
  const { attachToggle, setNestedUnitCounts } = useExpandCollapse(
    nodes as ChainGraphNode[],
    setNodes,
    edges,
    setEdges,
    structureChanged,
  );

  const buildItems = (
    selectedElements: Node<ChainGraphNodeData>[],
  ): ContextMenuItem[] => {
    const nodeData = selectedElements[0];
    const elementTemplate = findLibraryElement(
      nodeData.data.elementType,
      libraryElements,
    )!;

    const allowedChildren = elementTemplate.allowedChildren;
    if (elementTemplate.container && Object.keys(allowedChildren).length > 0) {
      return [
        {
          id: uuidv4(),
          text: "Add child",
          children: Object.keys(allowedChildren).map((key) => {
            const childTemplate: LibraryElement = findLibraryElement(
              key,
              libraryElements,
            )!;

            return {
              id: uuidv4(),
              text: childTemplate.title,
              handler: () =>
                createChildElement(childTemplate.name, nodeData.id),
            };
          }),
          handler: () => {},
        },
      ];
    }

    return [];
  };

  const createChildElement = async (type: string, parentId: string) => {
    const createElementRequest: CreateElementRequest = {
      type: type,
      parentElementId: parentId,
    };

    try {
      const response = await api.createElement(createElementRequest, chainId!);
      const createdElement = response.createdElements?.[0];
      if (!createdElement) return;

      const newNode: ChainGraphNode = getNodeFromElement(
        createdElement,
        getLibraryElement(createdElement, libraryElements),
        direction,
      );
      if (!newNode) return;

      const childNodes: ChainGraphNode[] = createdElement?.children
        ? createdElement.children.map((child: Element) =>
            getNodeFromElement(
              child,
              getLibraryElement(child, libraryElements),
              direction,
            ),
          )
        : [];

      const updatedNodes = buildGraphNodes(
        response.updatedElements ?? [],
        libraryElements,
      );

      const arrangedNodes = await arrangeNodes(
        childNodes.concat(newNode, ...updatedNodes),
        edges,
      );
      const allNodes = (nodes as ChainGraphNode[])
        .filter((node) => !arrangedNodes.some((n) => n.id === node.id))
        .concat(arrangedNodes);
      const withToggle = attachToggle(allNodes);
      const withCount = setNestedUnitCounts(withToggle);

      const ordered = sortParentsBeforeChildren(withCount);
      setNodes(ordered);
    } catch (error) {
      notificationService.errorWithDetails(
        "Failed to create element",
        getErrorMessage(error, "Failed to create element"),
        error,
      );
    }
  };

  return { buildItems };
};
