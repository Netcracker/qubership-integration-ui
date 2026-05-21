import { MouseEvent, Dispatch, SetStateAction, useState } from "react";
import {
  ChainGraphNode,
  ChainGraphNodeData,
  OnDeleteEvent,
} from "../../components/graph/nodes/ChainGraphNodeTypes";

import { Edge, Node } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import {
  ContextMenuData,
  ContextMenuItem,
} from "../../components/graph/ContextMenu.tsx";
import {
  buildGraphNodes,
  collectChildren,
  findLibraryElement,
  getLibraryElement,
  getNodeFromElement,
  sortParentsBeforeChildren,
} from "../../misc/chain-graph-utils.ts";
import { useAutoLayout } from "./useAutoLayout.tsx";
import { api } from "../../api/api.ts";
import { CreateElementRequest, Element, LibraryElement } from "../../api/apiTypes.ts";
import { useNotificationService } from "../useNotificationService.tsx";
import { useLibraryContext } from "../../components/LibraryContext.tsx";
import { useExpandCollapse } from "./useExpandCollapse.tsx";
import { getErrorMessage } from "../../misc/error-utils.ts";

export const useContextMenu = (
  handleDelete: (changes: OnDeleteEvent) => Promise<void>,
  openElementModal: (node?: Node<ChainGraphNodeData>) => void,
  nodes: Node<ChainGraphNodeData>[],
  setNodes: Dispatch<SetStateAction<Node<ChainGraphNodeData>[]>>,
  edges: Edge[],
  setEdges: Dispatch<React.SetStateAction<Edge[]>>,
  structureChanged: (parentIds?: string[]) => void,
  chainId?: string,
  onChainUpdate?: () => void | Promise<void>,
) => {
  const [menu, setMenu] = useState<ContextMenuData | null>(null);
  const { arrangeNodes, direction } = useAutoLayout();
  const [copiedNodes, setCopiedNodes] = useState<Node<ChainGraphNodeData>[]>(
    [],
  );
  const notificationService = useNotificationService();
  const { libraryElements } = useLibraryContext();
  const { attachToggle, setNestedUnitCounts } = useExpandCollapse(
    nodes as ChainGraphNode[],
    setNodes,
    edges,
    setEdges,
    structureChanged,
  );

  const closeMenu = () => setMenu(null);

  const parentElementHasRestrictions = (
    elements: Node<ChainGraphNodeData>[],
  ): boolean => {
    for (const nodeData of elements) {
      if (
        nodeData.parentId &&
        (findLibraryElement(nodeData.data.elementType, libraryElements)
          ?.parentRestriction?.length ??
          0 > 0)
      ) {
        return true;
      }
    }
    return false;
  };

  const onContextMenuCall = (
    event: MouseEvent,
    selectedElements: Node<ChainGraphNodeData>[],
  ) => {
    event.preventDefault();

    const items: ContextMenuItem[] =
      selectedElements?.length === 0
        ? [
            {
              id: uuidv4(),
              text: "Paste",
              handler: () => pasteElements(),
              disabled: copiedNodes.length === 0,
            },
          ]
        : [
            ...(parentElementHasRestrictions(selectedElements)
              ? []
              : [
                  {
                    id: uuidv4(),
                    text: "Copy",
                    handler: () => copyElements(selectedElements),
                  },
                ]),
            ...(selectedElements?.length === 1 &&
            selectedElements[0].data.elementType === "container"
              ? [
                  {
                    id: uuidv4(),
                    text: "Paste",
                    handler: () => pasteElements(selectedElements[0]),
                    disabled: copiedNodes.length === 0,
                  },
                ]
              : []),
            {
              id: uuidv4(),
              text: "Delete",
              handler: () => deleteElements(selectedElements),
            },
          ];
    if (selectedElements?.length === 1) {
      const nodeData = selectedElements[0];
      if (selectedElements[0].data.elementType === "container") {
        items.unshift({
          id: uuidv4(),
          text: "Ungroup",
          handler: () => ungroupElements(nodeData),
        });
      } else {
        const elementTemplate = findLibraryElement(
          nodeData.data.elementType,
          libraryElements,
        )!;

        const allowedChildren = elementTemplate.allowedChildren;
        if (
          elementTemplate.container &&
          Object.keys(allowedChildren).length > 0
        ) {
          items.unshift({
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
                handler: () => createChildElement(childTemplate.name, nodeData.id),
              };
            }),
            handler: () => {},
          });
        }

        items.unshift({
          id: uuidv4(),
          text: "Edit",
          handler: () => openElementModal(nodeData),
        });
      }
    } else if (selectedElements?.length > 1) {
      items.unshift({
        id: uuidv4(),
        text: "Group",
        handler: () => groupElements(selectedElements),
      });
    }

    setMenu({
      x: event.clientX,
      y: event.clientY,
      items,
    });
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

  const deleteElements = (selectedElements: Node<ChainGraphNodeData>[]) => {
    const nodesWithChildren: Node<ChainGraphNodeData>[] = [];
    for (const node of selectedElements) {
      if (node.type === "container") {
        nodesWithChildren.push(...collectChildren(node.id, nodes));
      }
      nodesWithChildren.push(node);
    }

    void handleDelete({ nodes: nodesWithChildren, edges: [] });
  };

  const copyElements = (selectedElements: Node<ChainGraphNodeData>[]) => {
    setCopiedNodes(selectedElements);
  };

  const pasteElements = async (target?: Node<ChainGraphNodeData>) => {
    if (chainId == null) {
      return;
    }

    const createdElements = await api.cloneElements(
      chainId,
      copiedNodes.map((item) => item.id),
      target?.id,
    );

    const newNodes = buildGraphNodes(createdElements, libraryElements);

    const arrangedNew = await arrangeNodes(newNodes, []);
    const allNodes = nodes.concat(arrangedNew);
    const withToggle = attachToggle(allNodes);
    const withCount = setNestedUnitCounts(withToggle);

    const ordered = sortParentsBeforeChildren(withCount);
    setNodes(ordered);

    if (onChainUpdate) {
      void onChainUpdate();
    }

    structureChanged();
  };

  const groupElements = async (
    selectedElements: Node<ChainGraphNodeData>[],
  ) => {
    if (chainId == null) {
      return;
    }

    try {
      const container = await api.groupElements(
        chainId,
        selectedElements.map((node) => node.id),
      );

      const containerNode: ChainGraphNode = getNodeFromElement(
        container,
        undefined,
        direction,
        undefined,
      );
      if (!containerNode) return;

      const childNodes: ChainGraphNode[] = [];
      let nodesWithoutChangedElements = nodes as ChainGraphNode[];

      if (container?.children?.length) {
        (nodes as ChainGraphNode[]).forEach((prevNode) => {
          for (const childrenElement of container.children as Element[]) {
            if (prevNode.id === childrenElement.id) {
              const updatedNode: ChainGraphNode = {
                ...prevNode,
                parentId: containerNode.id,
              };
              childNodes.push(updatedNode);
              break;
            }
          }
        });

        const childrenElementIds = container.children.map((node) => node.id);
        nodesWithoutChangedElements = (nodes as ChainGraphNode[]).filter(
          (node) => !childrenElementIds.includes(node.id),
        );
      }

      const arrangedNew = await arrangeNodes(
        childNodes.concat(containerNode),
        [],
      );
      const allNodes = nodesWithoutChangedElements.concat(arrangedNew);
      const withToggle = attachToggle(allNodes);
      const withCount = setNestedUnitCounts(withToggle);

      const ordered = sortParentsBeforeChildren(withCount);
      setNodes(ordered);

      structureChanged();
    } catch (error) {
      notificationService.requestFailed("Failed to group elements", error);
    }
  };

  const ungroupElements = async (selectedGroup: Node<ChainGraphNodeData>) => {
    if (chainId == null) {
      return;
    }

    try {
      const elements = await api.ungroupElements(chainId, selectedGroup.id);

      let nodesWithoutContainer = (nodes as ChainGraphNode[]).filter(
        (node) => node.id !== selectedGroup.id,
      );

      if (elements?.length) {
        nodesWithoutContainer = nodesWithoutContainer.map((prevNode) => {
          for (const childrenElement of elements) {
            if (prevNode.id === childrenElement.id) {
              const updatedNode: ChainGraphNode = {
                ...prevNode,
                parentId: undefined,
              };
              return updatedNode;
            }
          }
          return prevNode;
        });
      }

      setNodes(nodesWithoutContainer);

      structureChanged();
    } catch (error) {
      notificationService.requestFailed("Failed to ungroup elements", error);
    }
  };

  return {
    menu,
    closeMenu,
    onContextMenuCall,
  };
};
