import React, { useCallback, useEffect, useState } from "react";
import { CustomResourceOptions } from "../../api/apiTypes.ts";
import {
  Button,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Select,
  Table,
  TableProps,
  Tabs,
} from "antd";
import { useModalContext } from "../../ModalContextProvider.tsx";
import { useNotificationService } from "../../hooks/useNotificationService.tsx";
import { formatDate } from "../../misc/format-utils.ts";
import { Icon } from "../../IconProvider.tsx";
import { InlineEdit } from "../InlineEdit.tsx";
import { TextValueEdit } from "../table/TextValueEdit.tsx";

type EnvironmentEditorProps = {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
};

type NameValuePair = {
  name: string;
  value: string;
};

function makeRecord(pairs: NameValuePair[]): Record<string, string> {
  const result: Record<string, string> = {};
  pairs.forEach((pair) => (result[pair.name] = pair.value));
  return result;
}

function removeDuplicateKeys(data: NameValuePair[]): NameValuePair[] {
  const seenKeys = new Set<string>();
  return data.filter((item) => {
    if (seenKeys.has(item.name)) {
      return false;
    } else {
      seenKeys.add(item.name);
      return true;
    }
  });
}

const EnvironmentEditor: React.FC<EnvironmentEditorProps> = ({
  onChange,
  value,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [tableData, setTableData] = useState<
    TableProps<NameValuePair>["dataSource"]
  >([]);

  useEffect(() => {
    try {
      const items: NameValuePair[] = Object.entries(value ?? {}).map(
        ([name, value]) => ({ name, value }),
      );
      setTableData(removeDuplicateKeys(items));
    } catch (error) {
      void messageApi.error(`Invalid dictionary: ${String(error)}`);
      setTableData([]);
    }
  }, [messageApi, value]);

  const updateRecord = useCallback(
    (index: number, changes: Partial<NameValuePair>) => {
      setTableData((data) => {
        const result =
          data?.map((r, idx) => (idx === index ? { ...r, ...changes } : r)) ??
          [];
        onChange?.(makeRecord(result));
        return result;
      });
    },
    [onChange],
  );

  const addRecord = useCallback(() => {
    setTableData((data) => {
      if (data?.some((r) => r.name === "")) {
        return data;
      }
      const result = [...(data ?? []), { name: "", value: "" }];
      onChange?.(makeRecord(result));
      return result;
    });
  }, [onChange]);

  const deleteRecord = useCallback(
    (index: number) => {
      setTableData((data) => {
        const result =
          data?.slice(0, index)?.concat(data?.slice(index + 1)) ?? [];
        onChange?.(makeRecord(result));
        return result;
      });
    },
    [onChange],
  );

  const clearRecords = useCallback(() => {
    setTableData([]);
    onChange?.(makeRecord([]));
  }, [onChange]);

  return (
    <>
      {contextHolder}
      <Flex style={{ height: "100%" }} vertical gap={8}>
        <Flex wrap="wrap" vertical={false} gap={8}>
          <Button
            size="small"
            type="text"
            icon={<Icon name="plusCircle" />}
            onClick={() => addRecord()}
          >
            Add variable
          </Button>
          <Button
            size="small"
            type="text"
            icon={<Icon name="clear" />}
            onClick={() => clearRecords()}
          >
            Clear variables
          </Button>
        </Flex>
        <Table
          size="small"
          scroll={{ y: 200 }}
          columns={[
            {
              key: "name",
              title: "Name",
              dataIndex: "name",
              sorter: (a, b, sortOrder) => {
                if (sortOrder === "ascend") {
                  return a.name.localeCompare(b.name);
                } else if (sortOrder === "descend") {
                  return b.name.localeCompare(a.name);
                }
                return 0;
              },
              render: (
                value: string,
                _record: NameValuePair,
                index: number,
              ) => {
                return (
                  <InlineEdit<{ value: string }>
                    values={{ value }}
                    editor={<TextValueEdit name="value" />}
                    viewer={value}
                    initialActive={value === ""}
                    onSubmit={({ value }) => {
                      if (tableData?.some((r) => r.name === value)) {
                        void messageApi.error(`Already exists: ${value}`);
                      } else {
                        updateRecord(index, { name: value });
                      }
                    }}
                  />
                );
              },
            },
            {
              key: "value",
              title: "Value",
              dataIndex: "value",
              sorter: (a, b, sortOrder) => {
                if (sortOrder === "ascend") {
                  return a.value.localeCompare(b.value);
                } else if (sortOrder === "descend") {
                  return b.value.localeCompare(a.value);
                }
                return 0;
              },
              render: (
                value: string,
                _record: NameValuePair,
                index: number,
              ) => {
                return (
                  <InlineEdit<{ value: string }>
                    values={{ value }}
                    editor={<TextValueEdit name="value" rules={[]} />}
                    viewer={value}
                    onSubmit={({ value }) => {
                      updateRecord(index, { value });
                    }}
                  />
                );
              },
            },
            {
              key: "actions",
              className: "actions-column",
              width: 40,
              align: "right",
              render: (_, _record, index: number) => {
                return (
                  <Button
                    type="text"
                    icon={<Icon name="delete" />}
                    onClick={() => deleteRecord(index)}
                  />
                );
              },
            },
          ]}
          dataSource={tableData}
          pagination={false}
          rowKey={(record) => record.name}
        />
      </Flex>
    </>
  );
};

export type ExportCRDialogProps = {
  onSubmit: (params: CustomResourceOptions) => void | Promise<void>;
};

export const ExportCRDialog: React.FC<ExportCRDialogProps> = ({ onSubmit }) => {
  const { closeContainingModal } = useModalContext();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const notificationService = useNotificationService();

  return (
    <Modal
      title="Generate K8s Resources"
      open={true}
      onCancel={closeContainingModal}
      footer={[
        <Button key="cancel" onClick={closeContainingModal}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          form="crOptionsForm"
          htmlType={"submit"}
          loading={confirmLoading}
        >
          Generate
        </Button>,
      ]}
    >
      <Form<CustomResourceOptions>
        id="crOptionsForm"
        labelCol={{ flex: "150px" }}
        wrapperCol={{ flex: "auto" }}
        labelWrap
        initialValues={{
          name: `integration-${formatDate(new Date())}`,
          language: "xml",
          container: {
            imagePoolPolicy: "IfNotPresent",
          },
        }}
        onFinish={(values) => {
          setConfirmLoading(true);
          try {
            const result = onSubmit?.(values);
            if (result instanceof Promise) {
              result
                .then(() => {
                  closeContainingModal();
                  setConfirmLoading(false);
                })
                .catch(() => {
                  setConfirmLoading(false);
                });
            } else {
              closeContainingModal();
              setConfirmLoading(false);
            }
          } catch (error) {
            notificationService.errorWithDetails(
              "Failed to submit form",
              "An exception has been throws from the form submit callback",
              error,
            );
            setConfirmLoading(false);
          }
        }}
      >
        <Tabs
          items={[
            {
              key: "options",
              label: "Options",
              children: (
                <>
                  <Form.Item name="name" label="Resource name">
                    <Input
                      count={{
                        show: false,
                        max: 63,
                      }}
                    />
                  </Form.Item>
                  <Form.Item name="language" label="Camel DSL language">
                    <Select
                      options={[
                        {
                          label: "XML",
                          value: "xml",
                        },
                      ]}
                    />
                  </Form.Item>
                </>
              ),
            },
            {
              key: "container",
              label: "Container",
              children: (
                <>
                  <Form.Item
                    name={["container", "image"]}
                    label="Container image"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={["container", "imagePoolPolicy"]}
                    label="Image pool policy"
                  >
                    <Select
                      options={[
                        {
                          title: "Always",
                          value: "Always",
                        },
                        {
                          title: "Never",
                          value: "Never",
                        },
                        {
                          title: "IfNotPresent",
                          value: "IfNotPresent",
                        },
                      ]}
                    />
                  </Form.Item>
                </>
              ),
            },
            {
              key: "environment",
              label: "Environment",
              children: (
                <>
                  <Form.Item name={"environment"}>
                    <EnvironmentEditor />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
};
