import React, { useCallback, useEffect, useState } from "react";
import {
  Attribute,
  AttributeKind,
  DataType,
  MappingDescription,
  SchemaKind,
} from "../../mapper/model/model.ts";
import {
  Col,
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
  buildMappingTableItemPredicate,
  buildMappingTableItems,
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
  METADATA_DATA_FORMAT_KEY,
  SourceFormat,
} from "../../mapper/model/metadata.ts";
import { MetadataUtil } from "../../mapper/util/metadata.ts";
import { ConnectionAnchor } from "./ConnectionAnchor.tsx";
import { verifyMappingAction } from "../../mapper/verification/actions.ts";
import { useMappingDescription } from "./useMappingDescription.tsx";
import { MappingTableItemActionButton } from "./MappingTableItemActionButton.tsx";
import { TransformationInfoTooltip } from "./TransformationInfoTooltip.tsx";
import { GENERATORS } from "../../mapper/model/generators.ts";
import { DataTypes } from "../../mapper/util/types.ts";

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
      <span className={graphViewStyles["attribute-name"]}>{item.attribute.name}</span>
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
  } = useMappingDescription({ mapping, onChange });

  const [sourceColumns, setSourceColumns] = useState<
    TableColumnsType<MappingTableItem>
  >([]);
  const [targetColumns, setTargetColumns] = useState<
    TableColumnsType<MappingTableItem>
  >([]);
  const [sourceItems, setSourceItems] = useState<MappingTableItem[]>([]);
  const [targetItems, setTargetItems] = useState<MappingTableItem[]>([]);

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

  // useEffect(() => {
  //   const format = mappingDescription[selectedSchema].body
  //     ? (MetadataUtil.getString(
  //         mappingDescription[selectedSchema].body,
  //         METADATA_DATA_FORMAT_KEY,
  //       ) ?? "")
  //     : SourceFormat.JSON;
  //   setBodyFormat(format);
  // }, [mappingDescription, selectedSchema]);

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
      try {
        updateAttribute(schemaKind, kind, path, changes);
      } catch (error) {
        const content =
          error instanceof Error ? error.message : "Failed to update attribute";
        void messageApi.open({ type: "error", content });
      }
    },
    [messageApi, updateAttribute],
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
                // TODO
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
              // TODO
              // onAdd={() => addElement(item)}
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
              <ConnectionAnchor
                connected={item.actions.length > 0}
                onClick={() => {
                  // TODO
                }}
              />
            );
          }
        },
      },
    ];
  }, [
    elementId,
    mappingDescription,
    readonlySource,
    removeAttribute,
    removeConstant,
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
            return (
              <ConnectionAnchor
                invalid={
                  item.actions.flatMap((action) =>
                    verifyMappingAction(action, mappingDescription),
                  ).length > 0
                }
                connected={item.actions.length > 0}
                onClick={() => {
                  // TODO
                }}
              />
            );
          }
        },
      },
      Table.EXPAND_COLUMN,
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
              readonly={!!readonlySource}
              enableEdit={true}
              enableXmlNamespaces={
                getBodyFormat(mappingDescription, SchemaKind.TARGET) ===
                SourceFormat.XML.toString()
              }
              onEdit={() => {
                // TODO
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
              // TODO
              // onAdd={() => addElement(item)}
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
    elementId,
    mappingDescription,
    readonlySource,
    removeAttribute,
    removeConstant,
    tryUpdateAttribute,
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
    <>
      <Row gutter={[16, 16]} style={{ height: "100%" }}>
        <Col span={9} className={graphViewStyles["mapping-table-column"]}>
          <Table<MappingTableItem>
            // style={{ direction: "rtl" }}
            className="flex-table"
            size="small"
            showHeader={false}
            columns={sourceColumns}
            dataSource={sourceItems}
            rowKey="id"
            pagination={false}
            scroll={{ y: "" }}
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
          />
        </Col>
        <Col span={6}></Col>
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
          />
        </Col>
      </Row>
    </>
  );
};
