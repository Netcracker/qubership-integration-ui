import React, {
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Attribute,
  AttributeKind,
  AttributeReference,
  Constant,
  ConstantReference,
  DataType,
  MappingDescription,
  SchemaKind,
} from "../../mapper/model/model.ts";
import {
  Col,
  Dropdown,
  Flex,
  message,
  Row,
  Select,
  Space,
  Table,
  TableColumnsType,
  Tag,
} from "antd";
import {
  AttributeItem,
  buildAttributeItemId,
  buildConstantId,
  buildElementReference,
  buildMappingTableItemPredicate,
  buildMappingTableItems,
  ConstantItem,
  filterMappingTableItems,
  isAttributeItem,
  isBodyGroup,
  isConstantGroup,
  isConstantItem,
  isHeaderGroup,
  isPropertyGroup,
  MappingTableItem,
  TableControlsState,
} from "./MappingTableView.tsx";
import styles from "./MappingTableView.module.css";
import graphViewStyles from "./MappingGraphView.module.css";
import constantValueStyles from "./ConstantValue.module.css";
import { useModalsContext } from "../../Modals.tsx";
import {
  DESCRIPTION_KEY,
  METADATA_DATA_FORMAT_KEY,
  SourceFormat,
} from "../../mapper/model/metadata.ts";
import { MetadataUtil } from "../../mapper/util/metadata.ts";
import { ConnectionAnchor } from "./ConnectionAnchor.tsx";
import { verifyMappingAction } from "../../mapper/verification/actions.ts";
import { Connection, useMappingDescription } from "./useMappingDescription.tsx";
import { MappingTableItemActionButton } from "./MappingTableItemActionButton.tsx";
import { TransformationInfoTooltip } from "./TransformationInfoTooltip.tsx";
import { GENERATORS } from "../../mapper/model/generators.ts";
import { DataTypes } from "../../mapper/util/types.ts";
import {
  ArcherContainer,
  ArcherContainerRef,
  ArcherElement,
} from "react-archer";
import { EditAttributeDialog } from "./EdtAttributeDialog.tsx";
import { MappingUtil } from "../../mapper/util/mapping.ts";
import { Attributes } from "../../mapper/util/attributes.ts";
import { EditConstantDialog } from "./EditConstantDialog.tsx";
import { parseJson } from "../../misc/json-helper.ts";
import { MappingActions } from "../../mapper/util/actions.ts";
import {
  TransformationContext,
  TransformationEditDialog,
} from "./TransformationEditDialog.tsx";
import { TransformationInfoCard } from "./TransformationInfo.tsx";
import { TRANSFORMATIONS } from "../../mapper/model/transformations.ts";
import { ElementReferencesList } from "./ElementReferencesList.tsx";
import { DeleteOutlined } from "@ant-design/icons";

const MAPPER_DND_REFERENCE_MEDIA_TYPE = "mapper/reference-json";
const DRAG_POINT_ID = "drag-point";

function buildTableItems(
  mappingDescription: MappingDescription,
  schemaKind: SchemaKind,
  controlsState?: TableControlsState,
): MappingTableItem[] {
  const items = buildMappingTableItems(mappingDescription, schemaKind);
  const predicate = buildMappingTableItemPredicate(
    mappingDescription,
    schemaKind,
    controlsState?.searchString ?? "",
  );
  return filterMappingTableItems(items, predicate);
}

function getBodyFormat(
  mappingDescription: MappingDescription,
  schemaKind: SchemaKind,
): string {
  return mappingDescription[schemaKind].body
    ? (MetadataUtil.getString(
        mappingDescription[schemaKind].body,
        METADATA_DATA_FORMAT_KEY,
      ) ?? "")
    : SourceFormat.JSON;
}

function buildTableItemId(
  schemaKind: SchemaKind,
  reference: ConstantReference | AttributeReference,
): string {
  return MappingUtil.isConstantReference(reference)
    ? buildConstantId(reference.constantId)
    : buildAttributeItemId(schemaKind, reference.kind, reference.path);
}

function buildArcherElementId(
  schemaKind: SchemaKind,
  item: ConstantItem | AttributeItem | AttributeReference,
): string {
  return isAttributeItem(item)
    ? buildAttributeItemId(
        schemaKind,
        item.kind,
        item.path.map((i) => i.id),
      )
    : isConstantItem(item)
      ? buildConstantId(item.constant.id)
      : buildAttributeItemId(schemaKind, item.kind, item.path);
}

type SchemaTreeItemViewProps = {
  mappingDescription: MappingDescription;
  schemaKind: SchemaKind;
  item: MappingTableItem;
  onBodyFormatChange?: (type: DataType) => void;
};

const SchemaTreeItemView: React.FC<SchemaTreeItemViewProps> = ({
  item,
  mappingDescription,
  schemaKind,
  onBodyFormatChange,
}) => {
  return isBodyGroup(item) ? (
    <Space>
      <span className={styles["group-label"]}>body</span>
      {mappingDescription[schemaKind].body ? (
        <Select<string>
          size={"small"}
          value={getBodyFormat(mappingDescription, schemaKind)}
          variant="borderless"
          options={[
            { value: SourceFormat.JSON, label: "JSON" },
            { value: SourceFormat.XML, label: "XML" },
          ]}
          onChange={(value) => {
            if (!mappingDescription[schemaKind].body) {
              return;
            }
            const type = MetadataUtil.setValue(
              mappingDescription[schemaKind].body,
              METADATA_DATA_FORMAT_KEY,
              value,
            );
            onBodyFormatChange?.(type);
          }}
        />
      ) : (
        <></>
      )}
    </Space>
  ) : isConstantGroup(item) ? (
    <span className={styles["group-label"]}>constants</span>
  ) : isHeaderGroup(item) ? (
    <span className={styles["group-label"]}>headers</span>
  ) : isPropertyGroup(item) ? (
    <span className={styles["group-label"]}>properties</span>
  ) : isAttributeItem(item) ? (
    <Flex vertical={false} justify="space-between" align="center" gap={8}>
      <Space>
        <span className={graphViewStyles["attribute-name"]}>
          {item.attribute.name}
        </span>
        {item.attribute.defaultValue ? (
          <span className={graphViewStyles["attribute-default-value"]}>
            {item.attribute.defaultValue}
          </span>
        ) : (
          <></>
        )}
      </Space>
      <Flex className={graphViewStyles["attribute-type"]}>
        <span className={graphViewStyles["type-bracket"]}>[</span>
        <span className={graphViewStyles["type-name"]}>
          {item.attribute.type
            ? DataTypes.buildTypeName(item.attribute.type, item.typeDefinitions)
            : []}
        </span>
        <span className={graphViewStyles["type-bracket"]}>]</span>
      </Flex>
    </Flex>
  ) : isConstantItem(item) ? (
    <>
      <Space>
        {item.constant.valueSupplier.kind === "generated" ? (
          <TransformationInfoTooltip
            transformation={item.constant.valueSupplier.generator}
            transformationsInfo={GENERATORS}
          >
            <Tag className={constantValueStyles["constant-generator-tag"]}>
              G
            </Tag>
          </TransformationInfoTooltip>
        ) : (
          <></>
        )}
        <span>{item.constant.name}</span>
        {item.constant.valueSupplier.kind === "given" ? (
          <span className={graphViewStyles["constant-value"]}>
            {item.constant.valueSupplier.value}
          </span>
        ) : (
          <></>
        )}
      </Space>
    </>
  ) : (
    <></>
  );
};

export type MappingGraphViewProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "onChange"
> & {
  elementId: string;
  mapping?: MappingDescription;
  readonlySource?: boolean;
  readonlyTarget?: boolean;
  onChange?: (mapping: MappingDescription) => void;
};

export const MappingGraphView: React.FC<MappingGraphViewProps> = ({
  elementId,
  mapping,
  readonlySource,
  readonlyTarget,
  onChange,
  ...props
}): React.ReactNode => {
  const { showModal } = useModalsContext();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedItemId, setDraggedItemId] = useState<string | undefined>(
    undefined,
  );
  const [dragPosition, setDragPosition] = useState<
    { x: number; y: number } | undefined
  >();
  const containerRef = useRef<HTMLDivElement>(null);
  const middlePanelRef = useRef<HTMLDivElement>(null);

  const [selectedSourceKeys, setSelectedSourceKeys] = useState<React.Key[]>([]);
  const [selectedTargetKeys, setSelectedTargetKeys] = useState<React.Key[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<Connection[]>(
    [],
  );

  const [controlsStateMap, setControlsStateMap] = useState<
    Map<SchemaKind, TableControlsState>
  >(
    new Map<SchemaKind, TableControlsState>([
      [
        SchemaKind.SOURCE,
        {
          searchString: "",
          filters: {},
          sorts: {},
          selectedColumns: ["type", "optionality", "defaultValue", "targets"],
        },
      ],
      [
        SchemaKind.TARGET,
        {
          searchString: "",
          filters: {},
          sorts: {},
          selectedColumns: ["type", "optionality", "sources", "transformation"],
        },
      ],
    ]),
  );

  const {
    mappingDescription,
    clearConstants,
    clearTree,
    removeConstant,
    removeAttribute,
    updateBodyType,
    exportDataType,
    addConstant,
    addAttribute,
    updateAttribute,
    updateConstant,
    updateActions,
    createOrUpdateMappingActionForTarget,
    createOrUpdateMappingActionsForSource,
    updateXmlNamespaces,
    removeConnections,
  } = useMappingDescription({ mapping, onChange });

  const [sourceColumns, setSourceColumns] = useState<
    TableColumnsType<MappingTableItem>
  >([]);
  const [targetColumns, setTargetColumns] = useState<
    TableColumnsType<MappingTableItem>
  >([]);
  const [sourceItems, setSourceItems] = useState<MappingTableItem[]>([]);
  const [targetItems, setTargetItems] = useState<MappingTableItem[]>([]);
  const archerContainerRef = useRef<ArcherContainerRef>(null);

  const [contextMenuOpened, setContextMenuOpened] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | undefined>();

  useEffect(() => {
    setSourceItems(
      buildTableItems(
        mappingDescription,
        SchemaKind.SOURCE,
        controlsStateMap.get(SchemaKind.SOURCE),
      ),
    );
    setTargetItems(
      buildTableItems(
        mappingDescription,
        SchemaKind.TARGET,
        controlsStateMap.get(SchemaKind.TARGET),
      ),
    );
  }, [mappingDescription, controlsStateMap]);

  const exportElement = useCallback(
    (item: MappingTableItem) => {
      const type = isAttributeItem(item)
        ? item.resolvedType
        : isBodyGroup(item)
          ? (item.type ?? DataTypes.nullType())
          : DataTypes.nullType();
      const definitions = isAttributeItem(item) ? item.typeDefinitions : [];
      exportDataType(type, definitions);
    },
    [exportDataType],
  );

  const tryUpdateAttribute = useCallback(
    (
      schemaKind: SchemaKind,
      kind: AttributeKind,
      path: Attribute[],
      changes: Partial<Attribute>,
    ) => {
      updateAttribute(schemaKind, kind, path, changes, (error: unknown) => {
        const content =
          error instanceof Error ? error.message : "Failed to update attribute";
        void messageApi.open({ type: "error", content });
      });
    },
    [messageApi, updateAttribute],
  );

  const tryUpdateConstant = useCallback(
    (id: string, changes: Omit<Partial<Constant>, "id">) => {
      updateConstant(id, changes, (error: unknown) => {
        const content =
          error instanceof Error ? error.message : "Failed to update constant";
        void messageApi.open({ type: "error", content });
      });
    },
    [messageApi, updateConstant],
  );

  const tryAddConstant = useCallback(
    (changes: Partial<Constant>) => {
      addConstant(changes, (error: unknown) => {
        const content =
          error instanceof Error ? error.message : "Failed to update constant";
        void messageApi.open({ type: "error", content });
      });
    },
    [messageApi, addConstant],
  );

  const clearTreeForItem = useCallback(
    (schemaKind: SchemaKind, item: MappingTableItem) => {
      if (isConstantGroup(item)) {
        clearConstants();
      } else {
        const path = isAttributeItem(item) ? item.path : [];
        const kind = isAttributeItem(item)
          ? item.kind
          : isHeaderGroup(item)
            ? "header"
            : isPropertyGroup(item)
              ? "property"
              : "body";
        clearTree(schemaKind, kind, path);
      }
    },
    [clearConstants, clearTree],
  );

  const tryAddElement = useCallback(
    (
      schemaKind: SchemaKind,
      kind: AttributeKind,
      path: Attribute[],
      data: Omit<Partial<Attribute>, "id">,
    ) => {
      addAttribute(schemaKind, kind, path, data, (error: unknown) => {
        const content =
          error instanceof Error ? error.message : "Failed to add attribute";
        void messageApi.open({ type: "error", content });
      });
    },
    [addAttribute, messageApi],
  );

  const refreshConnectionLines = useCallback(() => {
    archerContainerRef.current?.refreshScreen?.();
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedConnections([]);
    setSelectedSourceKeys([]);
    setSelectedTargetKeys([]);
  }, []);

  const selectItem = useCallback(
    (item: MappingTableItem, isTarget: boolean) => {
      if (isAttributeItem(item) || isConstantItem(item)) {
        if (isTarget) {
          const targets = item.actions.map((action) => action.target);
          const sources = item.actions.flatMap((action) => action.sources);
          setSelectedConnections(
            sources.flatMap((source) =>
              targets.map((target) => ({ source, target })),
            ),
          );
          setSelectedSourceKeys(
            sources.map((source) =>
              buildTableItemId(SchemaKind.SOURCE, source),
            ),
          );
          setSelectedTargetKeys([item.id]);
        } else {
          const source = buildElementReference(item);
          const targets = item.actions.map((action) => action.target);
          setSelectedConnections(targets.map((target) => ({ source, target })));
          setSelectedSourceKeys([item.id]);
          setSelectedTargetKeys(
            targets.map((target) =>
              buildTableItemId(SchemaKind.TARGET, target),
            ),
          );
        }
      } else {
        clearSelection();
      }
    },
    [clearSelection],
  );

  const deleteSelectedConnections = useCallback(() => {
    removeConnections(selectedConnections);
    clearSelection();
  }, [removeConnections, selectedConnections, clearSelection]);

  const toggleSelection = useCallback(
    (item: ConstantItem | AttributeItem, target: AttributeReference) => {
      const source = buildElementReference(item);
      setSelectedConnections((connections) => {
        const index = connections.findIndex(
          (connection) =>
            MappingActions.referencesAreEqual(connection.source, source) &&
            MappingActions.referencesAreEqual(connection.target, target),
        );
        const result = [...connections];
        if (index < 0) {
          result.push({ source, target });
        } else {
          result.splice(index, 1);
        }
        setSelectedSourceKeys(
          result.map((connection) =>
            buildTableItemId(SchemaKind.SOURCE, connection.source),
          ),
        );
        setSelectedTargetKeys(
          result.map((connection) =>
            buildTableItemId(SchemaKind.TARGET, connection.target),
          ),
        );
        return result;
      });
    },
    [],
  );

  const selectConnection = useCallback(
    (item: ConstantItem | AttributeItem, target: AttributeReference) => {
      setSelectedSourceKeys([item.id]);
      setSelectedTargetKeys([buildTableItemId(SchemaKind.TARGET, target)]);
      setSelectedConnections([{ source: buildElementReference(item), target }]);
    },
    [],
  );

  const buildSourceColumns = useCallback(() => {
    return [
      {
        key: "data",
        title: "Data",
        render: (_value: unknown, item: MappingTableItem) => {
          return (
            <SchemaTreeItemView
              item={item}
              mappingDescription={mappingDescription}
              schemaKind={SchemaKind.SOURCE}
              onBodyFormatChange={(type) => {
                updateBodyType(SchemaKind.SOURCE, type);
              }}
            />
          );
        },
        onCell: (item: MappingTableItem) => {
          return (isConstantItem(item) && !item.constant.name) ||
            (isAttributeItem(item) && !item.attribute.name)
            ? { className: styles["invalid-value"] }
            : {};
        },
      },
      {
        key: "actions",
        title: "Actions",
        width: 40,
        align: "right" as const,
        className: "actions-column",
        render: (_value: unknown, item: MappingTableItem) => {
          return (
            <MappingTableItemActionButton
              elementId={elementId}
              item={item}
              readonly={!!readonlySource}
              enableEdit={true}
              enableXmlNamespaces={
                getBodyFormat(mappingDescription, SchemaKind.SOURCE) ===
                SourceFormat.XML.toString()
              }
              onEdit={() => {
                if (isAttributeItem(item)) {
                  showModal({
                    component: (
                      <EditAttributeDialog
                        title={`Edit ${item.kind === "body" ? "attribute" : item.kind}`}
                        kind={item.kind}
                        attribute={item.attribute}
                        typeDefinitions={item.typeDefinitions}
                        onSubmit={(changes) => {
                          tryUpdateAttribute(
                            SchemaKind.SOURCE,
                            item.kind,
                            item.path,
                            changes,
                          );
                        }}
                      />
                    ),
                  });
                } else if (isConstantItem(item)) {
                  showModal({
                    component: (
                      <EditConstantDialog
                        title={"Edit constant"}
                        constant={item.constant}
                        onSubmit={(changes) => {
                          tryUpdateConstant(item.constant.id, changes);
                        }}
                      />
                    ),
                  });
                }
              }}
              onLoad={(type) => {
                if (isBodyGroup(item)) {
                  updateBodyType(SchemaKind.SOURCE, type);
                } else if (isAttributeItem(item)) {
                  tryUpdateAttribute(SchemaKind.SOURCE, item.kind, item.path, {
                    type,
                  });
                }
              }}
              onExport={() => exportElement(item)}
              onUpdateXmlNamespaces={(namespaces) =>
                updateXmlNamespaces(
                  SchemaKind.SOURCE,
                  isAttributeItem(item) ? item.path : [],
                  namespaces,
                )
              }
              onAdd={() => {
                if (isConstantGroup(item)) {
                  showModal({
                    component: (
                      <EditConstantDialog
                        title={"Add constant"}
                        constant={{
                          id: MappingUtil.generateUUID(),
                          name: "",
                          type: DataTypes.stringType(),
                          valueSupplier: { kind: "given", value: "" },
                        }}
                        onSubmit={(changes) => {
                          tryAddConstant(changes);
                        }}
                      />
                    ),
                  });
                } else {
                  const entityTypeName: string = isHeaderGroup(item)
                    ? "header"
                    : isPropertyGroup(item)
                      ? "property"
                      : "attribute";
                  const kind: AttributeKind = isHeaderGroup(item)
                    ? "header"
                    : isPropertyGroup(item)
                      ? "property"
                      : isAttributeItem(item)
                        ? item.kind
                        : "body";
                  const typeDefinitions = isAttributeItem(item)
                    ? item.typeDefinitions
                    : [];
                  const path = isAttributeItem(item) ? item.path : [];
                  showModal({
                    component: (
                      <EditAttributeDialog
                        title={`Add ${entityTypeName}`}
                        kind={kind}
                        attribute={Attributes.buildAttribute(
                          MappingUtil.generateUUID(),
                          "",
                          DataTypes.stringType(),
                        )}
                        typeDefinitions={typeDefinitions}
                        onSubmit={(data) => {
                          tryAddElement(SchemaKind.SOURCE, kind, path, data);
                        }}
                      />
                    ),
                  });
                }
              }}
              onClear={() => clearTreeForItem(SchemaKind.SOURCE, item)}
              onDelete={() => {
                if (isConstantItem(item)) {
                  removeConstant(item.constant.id);
                } else if (isAttributeItem(item)) {
                  removeAttribute(SchemaKind.SOURCE, item.kind, item.path);
                }
              }}
            />
          );
        },
      },
      {
        key: "anchor",
        title: "Anchor",
        width: 26,
        align: "right" as const,
        className: graphViewStyles["source-anchor-column"],
        render: (_value: unknown, item: MappingTableItem) => {
          if (isAttributeItem(item) || isConstantItem(item)) {
            return (
              <ArcherElement
                id={buildArcherElementId(SchemaKind.SOURCE, item)}
                relations={[
                  ...item.actions
                    .map((action) => action.target)
                    .map((target) => ({
                      targetId: buildArcherElementId(SchemaKind.TARGET, target),
                      targetAnchor: "left" as const,
                      sourceAnchor: "right" as const,
                      style:
                        selectedConnections.findIndex(
                          (connection) =>
                            MappingActions.referencesAreEqual(
                              connection.source,
                              buildElementReference(item),
                            ) &&
                            MappingActions.referencesAreEqual(
                              connection.target,
                              target,
                            ),
                        ) >= 0
                          ? {
                              strokeColor: "#ff772e",
                              strokeWidth: 4,
                            }
                          : undefined,
                      domAttributes: {
                        onContextMenu: (
                          event: React.MouseEvent<SVGElement, MouseEvent>,
                        ) => {
                          event.preventDefault();
                          const bb = middlePanelRef.current?.getBoundingClientRect();
                          const x = event.clientX - (bb?.left ?? 0);
                          const y = event.clientY - (bb?.top ?? 0);
                          setContextMenuPosition({ x, y });
                          setContextMenuOpened(true);
                        },
                        onKeyDown: (event: React.KeyboardEvent<SVGElement>) => {
                          if (event.key === "Delete") {
                            deleteSelectedConnections();
                            clearSelection();
                          }
                        },
                        onClick: (
                          event: React.MouseEvent<SVGElement, MouseEvent>,
                        ) => {
                          setContextMenuOpened(false);
                          if (event.ctrlKey) {
                            toggleSelection(item, target);
                          } else {
                            selectConnection(item, target);
                          }
                        },
                      },
                      cursor: "pointer",
                    })),
                  ...(isDragging && item.id === draggedItemId
                    ? [
                        {
                          targetId: DRAG_POINT_ID,
                          targetAnchor: "left" as const,
                          sourceAnchor: "right" as const,
                        },
                      ]
                    : []),
                ]}
              >
                <ConnectionAnchor
                  connected={item.actions.length > 0}
                  tooltipTitle={
                    item.actions.length > 0 ? (
                      <ElementReferencesList
                        isTarget={true}
                        mappingDescription={mappingDescription}
                        references={item.actions.map((action) => action.target)}
                      />
                    ) : (
                      ""
                    )
                  }
                  tooltipPlacement={"right"}
                  draggable
                  onDrag={(event: DragEvent<HTMLElement>) => {
                    const bb = containerRef.current?.getBoundingClientRect();
                    const x = event.clientX - (bb?.left ?? 0);
                    const y = event.clientY - (bb?.top ?? 0);
                    if (x !== dragPosition?.x || y !== dragPosition?.y) {
                      setDragPosition({ x, y });
                      refreshConnectionLines();
                    }
                  }}
                  onDragEnd={() => {
                    setIsDragging(false);
                    setDraggedItemId(undefined);
                    setDragPosition(undefined);
                  }}
                  onDragStart={(event) => {
                    const bb = containerRef.current?.getBoundingClientRect();
                    const x = event.clientX - (bb?.left ?? 0);
                    const y = event.clientY - (bb?.top ?? 0);
                    setDragPosition({ x, y });
                    setDraggedItemId(item.id);
                    setIsDragging(true);
                    const reference = buildElementReference(item);
                    event.dataTransfer.setData(
                      MAPPER_DND_REFERENCE_MEDIA_TYPE,
                      JSON.stringify(reference),
                    );
                  }}
                  onClick={() => {
                    // TODO
                  }}
                />
              </ArcherElement>
            );
          }
        },
      },
    ];
  }, [
    clearSelection,
    clearTreeForItem,
    deleteSelectedConnections,
    dragPosition?.x,
    dragPosition?.y,
    draggedItemId,
    elementId,
    exportElement,
    isDragging,
    mappingDescription,
    readonlySource,
    refreshConnectionLines,
    removeAttribute,
    removeConstant,
    selectConnection,
    selectedConnections,
    showModal,
    toggleSelection,
    tryAddConstant,
    tryAddElement,
    tryUpdateAttribute,
    tryUpdateConstant,
    updateBodyType,
    updateXmlNamespaces,
  ]);

  const buildTargetColumns = useCallback(() => {
    return [
      {
        key: "anchor",
        title: "Anchor",
        width: 26,
        align: "right" as const,
        className: graphViewStyles["target-anchor-column"],
        render: (_value: unknown, item: MappingTableItem) => {
          if (isAttributeItem(item)) {
            const errors = item.actions.flatMap((action) =>
              verifyMappingAction(action, mappingDescription),
            );
            return (
              <ArcherElement
                id={`${SchemaKind.TARGET}-${item.kind}-${item.path.map((i) => i.id).join("-")}`}
              >
                <ConnectionAnchor
                  style={item.actions.length > 0 ? { cursor: "pointer" } : {}}
                  showSettingIcon={item.actions.some(
                    (action) => !!action.transformation,
                  )}
                  tooltipTitle={
                    errors.length > 0 ? (
                      errors.map((error) => error.message).join(" ")
                    ) : item.actions ? (
                      item.actions.some((action) => !!action.transformation) ? (
                        item.actions
                          .map((action) => action.transformation)
                          .filter((transformation) => !!transformation)
                          .map((transformation, index) => {
                            const transformationInfo = TRANSFORMATIONS.find(
                              (info) => info.name === transformation?.name,
                            );
                            return transformationInfo ? (
                              <TransformationInfoCard
                                key={index}
                                transformationInfo={transformationInfo}
                                parameters={transformation.parameters ?? []}
                              />
                            ) : (
                              ""
                            );
                          })
                      ) : item.actions.length > 0 ? (
                        <ElementReferencesList
                          isTarget={false}
                          mappingDescription={mappingDescription}
                          references={item.actions.flatMap(
                            (action) => action.sources,
                          )}
                        />
                      ) : (
                        ""
                      )
                    ) : (
                      ""
                    )
                  }
                  tooltipPlacement={"left"}
                  invalid={errors.length > 0}
                  connected={item.actions.length > 0}
                  onDragOver={(e) => e.preventDefault()}
                  onDragStart={(event) => {
                    const reference: AttributeReference = {
                      type: "attribute",
                      kind: item.kind,
                      path: item.path.map((a) => a.id),
                    };
                    event.dataTransfer.setData(
                      MAPPER_DND_REFERENCE_MEDIA_TYPE,
                      JSON.stringify(reference),
                    );
                  }}
                  onDrop={(event) => {
                    const dataText = event.dataTransfer.getData(
                      MAPPER_DND_REFERENCE_MEDIA_TYPE,
                    );
                    if (!dataText) {
                      return;
                    }
                    try {
                      const source = parseJson<
                        AttributeReference | ConstantReference
                      >(
                        dataText,
                        (obj) =>
                          MappingUtil.isAttributeReference(obj) ||
                          MappingUtil.isObjConstantReference(obj),
                      );
                      const target: AttributeReference = {
                        type: "attribute",
                        kind: item.kind,
                        path: item.path.map((a) => a.id),
                      };
                      const sources = item.actions
                        .flatMap((action) => action.sources)
                        .filter(
                          (s) => !MappingActions.referencesAreEqual(s, source),
                        );
                      sources.push(source);
                      createOrUpdateMappingActionForTarget(
                        item.actions,
                        target,
                        sources,
                      );
                    } catch (error) {
                      const content =
                        error instanceof Error
                          ? error.message
                          : "Failed to get reference to element";
                      void messageApi.open({ type: "error", content });
                    }
                  }}
                  onClick={() => {
                    if (!isAttributeItem(item) || item.actions.length === 0) {
                      return;
                    }
                    const action = item.actions[0];
                    showModal({
                      component: (
                        <TransformationContext.Provider
                          value={{
                            mappingDescription: mappingDescription,
                            action,
                          }}
                        >
                          <TransformationEditDialog
                            transformation={action.transformation}
                            enableDescription={true}
                            description={MetadataUtil.getString(
                              action,
                              DESCRIPTION_KEY,
                            )}
                            onSubmit={(transformation, description) => {
                              updateActions((a) => {
                                return a.id === action.id
                                  ? MetadataUtil.setValue(
                                      {
                                        ...a,
                                        transformation,
                                      },
                                      DESCRIPTION_KEY,
                                      description,
                                    )
                                  : a;
                              });
                            }}
                          />
                        </TransformationContext.Provider>
                      ),
                    });
                  }}
                />
              </ArcherElement>
            );
          }
        },
      },
      {
        key: "data",
        title: "Data",
        render: (_value: unknown, item: MappingTableItem) => {
          return (
            <SchemaTreeItemView
              item={item}
              mappingDescription={mappingDescription}
              schemaKind={SchemaKind.TARGET}
              onBodyFormatChange={(type) => {
                updateBodyType(SchemaKind.TARGET, type);
              }}
            />
          );
        },
      },
      {
        key: "actions",
        title: "Actions",
        width: 40,
        align: "right" as const,
        className: "actions-column",
        render: (_value: unknown, item: MappingTableItem) => {
          return (
            <MappingTableItemActionButton
              elementId={elementId}
              item={item}
              readonly={!!readonlyTarget}
              enableEdit={true}
              enableXmlNamespaces={
                getBodyFormat(mappingDescription, SchemaKind.TARGET) ===
                SourceFormat.XML.toString()
              }
              onEdit={() => {
                if (isAttributeItem(item)) {
                  showModal({
                    component: (
                      <EditAttributeDialog
                        title={`Edit ${item.kind === "body" ? "attribute" : item.kind}`}
                        kind={item.kind}
                        attribute={item.attribute}
                        typeDefinitions={item.typeDefinitions}
                        onSubmit={(changes) => {
                          tryUpdateAttribute(
                            SchemaKind.TARGET,
                            item.kind,
                            item.path,
                            changes,
                          );
                        }}
                      />
                    ),
                  });
                }
              }}
              onLoad={(type) => {
                if (isBodyGroup(item)) {
                  updateBodyType(SchemaKind.TARGET, type);
                } else if (isAttributeItem(item)) {
                  tryUpdateAttribute(SchemaKind.TARGET, item.kind, item.path, {
                    type,
                  });
                }
              }}
              onExport={() => exportElement(item)}
              onUpdateXmlNamespaces={(namespaces) =>
                updateXmlNamespaces(
                  SchemaKind.TARGET,
                  isAttributeItem(item) ? item.path : [],
                  namespaces,
                )
              }
              onAdd={() => {
                const entityTypeName: string = isHeaderGroup(item)
                  ? "header"
                  : isPropertyGroup(item)
                    ? "property"
                    : "attribute";
                const kind: AttributeKind = isHeaderGroup(item)
                  ? "header"
                  : isPropertyGroup(item)
                    ? "property"
                    : isAttributeItem(item)
                      ? item.kind
                      : "body";
                const typeDefinitions = isAttributeItem(item)
                  ? item.typeDefinitions
                  : [];
                const path = isAttributeItem(item) ? item.path : [];
                showModal({
                  component: (
                    <EditAttributeDialog
                      title={`Add ${entityTypeName}`}
                      kind={kind}
                      attribute={Attributes.buildAttribute(
                        MappingUtil.generateUUID(),
                        "",
                        DataTypes.stringType(),
                      )}
                      typeDefinitions={typeDefinitions}
                      onSubmit={(data) => {
                        tryAddElement(SchemaKind.TARGET, kind, path, data);
                      }}
                    />
                  ),
                });
              }}
              onClear={() => clearTreeForItem(SchemaKind.TARGET, item)}
              onDelete={() => {
                if (isConstantItem(item)) {
                  removeConstant(item.constant.id);
                } else if (isAttributeItem(item)) {
                  removeAttribute(SchemaKind.TARGET, item.kind, item.path);
                }
              }}
            />
          );
        },
      },
    ];
  }, [
    clearTreeForItem,
    createOrUpdateMappingActionForTarget,
    elementId,
    exportElement,
    mappingDescription,
    messageApi,
    readonlyTarget,
    removeAttribute,
    removeConstant,
    showModal,
    tryAddElement,
    tryUpdateAttribute,
    updateActions,
    updateBodyType,
    updateXmlNamespaces,
  ]);

  useEffect(() => {
    setSourceColumns(buildSourceColumns());
  }, [buildSourceColumns]);

  useEffect(() => {
    setTargetColumns(buildTargetColumns());
  }, [buildTargetColumns]);

  return (
    <ArcherContainer
      ref={archerContainerRef}
      style={{ height: "100%" }}
      strokeWidth={3}
      strokeColor={"#FFB02E"}
      endShape={{ arrow: { arrowLength: 3, arrowThickness: 3 } }}
      svgContainerStyle={{ zIndex: 500 }}
      offset={8}
      {...props}
    >
      {contextHolder}
      <Row ref={containerRef} gutter={[16, 16]} style={{ height: "100%" }}>
        <Col span={9} className={graphViewStyles["mapping-table-column"]}>
          <Table<MappingTableItem>
            className="flex-table"
            size="small"
            showHeader={false}
            columns={sourceColumns}
            dataSource={sourceItems}
            rowKey="id"
            pagination={false}
            scroll={{ y: "" }}
            rowSelection={{
              selectedRowKeys: selectedSourceKeys,
              columnWidth: 0,
              renderCell: () => <></>,
              onChange: (keys) => {
                setSelectedSourceKeys(keys);
              },
            }}
            onRow={(item) => ({
              onClick: () => {
                selectItem(item, false);
              },
            })}
            expandable={{
              defaultExpandedRowKeys: [
                "constant-group",
                "header-group",
                "property-group",
                "body-group",
              ],
            }}
            rowClassName={(item: MappingTableItem) => {
              return isHeaderGroup(item) ||
                isConstantGroup(item) ||
                isPropertyGroup(item) ||
                isBodyGroup(item)
                ? styles["group-row"]
                : "";
            }}
            onScroll={() => {
              refreshConnectionLines();
            }}
          />
        </Col>
        <Col span={6} ref={middlePanelRef}>
          <Dropdown
            disabled={selectedConnections.length === 0}
            menu={{
              style: {
                left: contextMenuPosition?.x,
                top: contextMenuPosition?.y,
              },
              items: [
                {
                  label: "Delete",
                  key: "delete",
                  icon: <DeleteOutlined />,
                  onClick: () => {
                    deleteSelectedConnections();
                  },
                },
              ],
            }}
            arrow={false}
            open={contextMenuOpened}
            onOpenChange={setContextMenuOpened}
          ></Dropdown>
        </Col>
        <Col span={9} className={graphViewStyles["mapping-table-column"]}>
          <Table<MappingTableItem>
            className="flex-table"
            size="small"
            showHeader={false}
            columns={targetColumns}
            dataSource={targetItems}
            rowKey="id"
            pagination={false}
            scroll={{ y: "" }}
            rowSelection={{
              selectedRowKeys: selectedTargetKeys,
              columnWidth: 0,
              renderCell: () => <></>,
              onChange: (keys) => {
                setSelectedTargetKeys(keys);
              },
            }}
            onRow={(item) => ({
              onClick: () => {
                selectItem(item, true);
              },
            })}
            expandable={{
              defaultExpandedRowKeys: [
                "constant-group",
                "header-group",
                "property-group",
                "body-group",
              ],
              expandIconColumnIndex: 1,
            }}
            rowClassName={(item: MappingTableItem) => {
              return isHeaderGroup(item) ||
                isConstantGroup(item) ||
                isPropertyGroup(item) ||
                isBodyGroup(item)
                ? styles["group-row"]
                : "";
            }}
            onScroll={() => {
              refreshConnectionLines();
            }}
          />
        </Col>
      </Row>
      {isDragging && dragPosition ? (
        <ArcherElement id={DRAG_POINT_ID}>
          <div
            style={{
              position: "absolute",
              top: dragPosition.y,
              left: dragPosition.x,
            }}
          />
        </ArcherElement>
      ) : (
        <></>
      )}
    </ArcherContainer>
  );
};
