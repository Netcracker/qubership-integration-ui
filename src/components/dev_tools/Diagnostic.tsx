import { Button, Flex, Table, Tooltip } from "antd";
import Search from "antd/lib/input/Search";
import { DiagnosticValidation, ValidationState } from "../../api/apiTypes";
import { TableProps } from "antd/lib/table";
import { useCallback, useEffect, useState } from "react";
import { TableRowSelection } from "antd/lib/table/interface";
import { api } from "../../api/api";
import { useNotificationService } from "../../hooks/useNotificationService";
import { formatTimestamp } from "../../misc/format-utils";
import { IconName, OverridableIcon } from "../../icons/IconProvider";
import { useModalsContext } from "../../Modals";
import { DiagnosticValidationModal } from "./DiagnosticValidationModal";

export const VALIDATION_STATE_TO_LABEL: { [key: string]: string } = {
  [ValidationState.OK]: "Finished",
  [ValidationState.NOT_STARTED]: "Not Started",
  [ValidationState.IN_PROGRESS]: "In Progress",
  [ValidationState.FAILED]: "Failed",
};

type ValidationRowType = "validation" | "chain" | "chain_element";

type BaseTableItem = {
  itemId: string; //introduced since id is not always unique (ex. the same chain can be under different validations)
  id: string;
  title: string;
  type: ValidationRowType;
  parentId?: string;
  children?: BaseTableItem[];
  icon?: string;
};

type DiagnosticValidationTableItem = DiagnosticValidation & BaseTableItem;

const isDiagnosticValidation = (
  item: DiagnosticValidationTableItem,
): boolean => {
  return item.type === "validation";
};

const isChainEntity = (item: DiagnosticValidationTableItem): boolean => {
  return item.type === "chain";
};

export const Diagnostic: React.FC = () => {
  const updateStatusDelay = 2500;
  const notificationService = useNotificationService();
  const { showModal } = useModalsContext();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticInProgress, setDiagnosticInProgress] = useState<boolean>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [loadedValidations, setLoadedValidations] = useState<Set<string>>(
    new Set(),
  );
  const [tableData, setTableData] = useState<DiagnosticValidationTableItem[]>(
    [],
  );
  const [searchString, setSearchString] = useState<string>("");

  const columns: TableProps<DiagnosticValidationTableItem>["columns"] = [
    {
      title: "Table Id",
      dataIndex: "tableId",
      key: "itemId",
      hidden: true,
    },
    {
      title: "Name",
      dataIndex: "title",
      key: "title",
      render: (_, validation) => {
        if (isDiagnosticValidation(validation)) {
          const diagnosticValidation = validation as DiagnosticValidation;
          return (
            <a
              onClick={() =>
                showModal({
                  component: (
                    <DiagnosticValidationModal {...diagnosticValidation} />
                  ),
                })
              }
            >
              {diagnosticValidation.title}
            </a>
          );
        } else {
          return (
            <span>
              {validation.icon && (
                <OverridableIcon
                  style={{ marginRight: 8 }}
                  name={validation.icon as IconName}
                />
              )}
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={
                  isChainEntity(validation)
                    ? `/chains/${validation.id}`
                    : `/chains/${validation.parentId}/graph/${validation.id}`
                }
              >
                {validation.title}
              </a>
            </span>
          );
        }
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_, validation) =>
        isDiagnosticValidation(validation) &&
        VALIDATION_STATE_TO_LABEL[
          (validation as DiagnosticValidation).status.state
        ],
    },
    {
      title: "Alerts",
      dataIndex: "alertsCount",
      key: "alertsCount",
    },
    {
      title: "Hint",
      dataIndex: "hint",
      key: "hint",
      render: (_, validation) =>
        isDiagnosticValidation(validation) && (
          <Tooltip placement="left" title={validation.suggestion}>
            <OverridableIcon name="bulb" />
          </Tooltip>
        ),
    },
    {
      title: "Start Time",
      dataIndex: "startedWhen",
      key: "startTime",
      render: (_, validation) =>
        isDiagnosticValidation(validation) &&
        validation?.status?.startedWhen &&
        formatTimestamp(validation.status.startedWhen),
    },
  ];

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DiagnosticValidationTableItem> = {
    type: "checkbox",
    selectedRowKeys,
    checkStrictly: false,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: !isDiagnosticValidation(record),
    }),
  };

  useEffect(() => {
    if (diagnosticInProgress) {
      notificationService.info("Diagnostic started", "Diagnostic started");
    } else if (diagnosticInProgress === false) {
      notificationService.info("Diagnostic finished", "Diagnostic finished");
    }
  }, [notificationService, diagnosticInProgress]);

  const loadValidations = useCallback(async () => {
    setIsLoading(true);
    try {
      const validations: DiagnosticValidation[] = await api.getValidations(
        { column: "", condition: "" },
        searchString,
      );
      setSelectedRowKeys([]);
      setExpandedRowKeys([]);
      setLoadedValidations(new Set());

      const validationItems: DiagnosticValidationTableItem[] = validations.map(
        (validation) => ({
          ...validation,
          itemId: validation.id,
          children: validation.alertsCount > 0 ? [] : undefined,
          type: "validation",
        }),
      );
      setTableData(validationItems);

      // check in progress
      let stillInProgress = false;
      for (const validation of validations) {
        if (validation.status.state === ValidationState.IN_PROGRESS) {
          stillInProgress = true;
          break;
        }
      }
      if (diagnosticInProgress) {
        if (stillInProgress) {
          setTimeout(() => void loadValidations(), updateStatusDelay);
        } else {
          setDiagnosticInProgress(false);
        }
      }
    } catch (error) {
      notificationService.requestFailed("Failed to load validations", error);
    } finally {
      setIsLoading(false);
    }
  }, [notificationService, diagnosticInProgress, searchString]);

  useEffect(() => {
    void loadValidations();
  }, [loadValidations]);

  const openValidation = async (validationId: string) => {
    return api
      .getValidation(validationId)
      .then((response: DiagnosticValidation) => {
        if (!response) {
          return;
        }

        setTableData((prevState: DiagnosticValidationTableItem[]) => {
          const newState = [...prevState];
          return newState.map((tableItem) => {
            const validatioItem = tableItem as DiagnosticValidation;

            const childrenMap: Map<string, BaseTableItem> = new Map();
            response.chainEntities.forEach((element) => {
              let chain = childrenMap.get(element.chainId);
              if (!chain) {
                chain = {
                  itemId: crypto.randomUUID(),
                  id: element.chainId,
                  title: element.chainName,
                  type: "chain",
                  children: [],
                  icon: "unorderedList",
                };
                childrenMap.set(chain.id, chain);
              }
              chain.children?.push({
                itemId: crypto.randomUUID(),
                id: element.elementId,
                title: element.elementName,
                type: "chain_element",
                parentId: chain.id,
                icon: element.elementType,
              });
            });

            return validatioItem.id === validationId
              ? {
                  ...response,
                  children: [...childrenMap.values()],
                  type: "validation",
                  itemId: response.id,
                }
              : tableItem;
          });
        });

        setLoadedValidations((prevState) => {
          const newState = new Set(prevState);
          newState.add(validationId);
          return newState;
        });
      });
  };

  const handleRunValidations = async () => {
    setDiagnosticInProgress(true);
    try {
      const keys = selectedRowKeys.map((key) => String(key));
      await api.runValidations(keys);
      setTimeout(() => void loadValidations(), 500);
    } catch (error) {
      notificationService.requestFailed("Validations run failed", error);
      setDiagnosticInProgress(undefined);
    }
  };

  return (
    <Flex vertical gap={16} style={{ height: "100%" }}>
      <Flex vertical={false} gap={8}>
        <Search
          placeholder="Full text search"
          allowClear
          onSearch={(value) => setSearchString(value)}
        />
        <Button
          title="Run Diagnostic"
          disabled={diagnosticInProgress || isLoading}
          onClick={() => void handleRunValidations()}
        >
          Run Diagnostic
        </Button>
      </Flex>

      <Table<DiagnosticValidationTableItem>
        size="small"
        className="flex-table"
        columns={columns}
        rowSelection={rowSelection}
        dataSource={tableData}
        pagination={false}
        loading={isLoading}
        rowKey="itemId"
        sticky
        scroll={{ y: "" }}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: (rowKeys) => {
            setExpandedRowKeys([...rowKeys]);
          },
          onExpand: (expanded, item) => {
            if (isDiagnosticValidation(item) && expanded) {
              const validationItem = item as DiagnosticValidation;
              if (!loadedValidations.has(validationItem.id)) {
                void openValidation(validationItem.id);
              }
            }
          },
        }}
      />
    </Flex>
  );
};
