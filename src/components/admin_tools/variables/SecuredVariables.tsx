import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Input,
  Form,
  message,
  Modal,
  Popconfirm,
  Table,
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  LockOutlined,
} from "@ant-design/icons";

import styles from "./SecuredVariables.module.css";
import VariablesTable from "./VariablesTable";
import { TableScroll } from "../../table/TableScroll.tsx";

import {
  variablesApi,
  Variable,
} from "../../../api/admin-tools/variables";

const { Title } = Typography;

const SecuredVariables: React.FC = () => {
  const [secrets, setSecrets] = useState<string[]>([]);
  const [defaultSecret, setDefaultSecret] = useState<string>("");
  const [variables, setVariables] = useState<Record<string, Variable[]>>({});
  const [editing, setEditing] = useState<{ secret: string; key: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [newVariableKeys, setNewVariableKeys] = useState<Record<string, boolean>>({});
  const [selectedKeys, setSelectedKeys] = useState<Record<string, string[]>>({});
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [columnsWidth, setColumnsWidth] = useState<{ [key: string]: number }>(
    {
      key: 300,
      value: 600,
    }
  );

  const handleResize = (dataIndex: string) => (_: any, { size }: any) => {
    setColumnsWidth((prev) => ({
      ...prev,
      [dataIndex]: size.width,
    }));
  };

  const loadSecrets = async () => {
    const secretsWithVariables = await variablesApi.getSecuredVariables();

    const sorted = secretsWithVariables.sort((a, b) => {
      if (a.isDefaultSecret) return -1;
      if (b.isDefaultSecret) return 1;
      return 0;
    });

    const bySecret: Record<string, Variable[]> = {};
    const secretNames: string[] = [];
    let defaultName = "";

    sorted.forEach(({ secretName, variables, isDefaultSecret }) => {
      bySecret[secretName] = variables;
      secretNames.push(secretName);
      if (isDefaultSecret) defaultName = secretName;
    });

    setSecrets(secretNames);
    setVariables(bySecret);
    setDefaultSecret(defaultName);
  };

  useEffect(() => {
    loadSecrets();
  }, []);

  const handleCreateSecret = async (values: any) => {
    const name = values.secretName.trim();
    if (!name) return;
    await variablesApi.createSecret(name);
    message.success(`Secret "${name}" created`);
    setCreateModalVisible(false);
    createForm.resetFields();
    loadSecrets();
  };

  const handleAddVariable = async (secret: string, key: string, value: string) => {
    if (!key || !value) return;
    const response = await variablesApi.createSecuredVariables(secret, [{ key, value }]);
    if (response.success && response.data) {
       const updated = await variablesApi.getSecuredVariablesForSecret(secret);
       setVariables((prev) => ({ ...prev, [secret]: updated }));
       setNewVariableKeys((prev) => ({ ...prev, [secret]: false }));
       message.success("Variable added");
    } else {
       message.error(response.error?.errorMessage || "Failed to add variable.");
    }
  };

  const handleUpdateVariable = async (secret: string, key: string, value: string) => {
    const response = await variablesApi.updateSecuredVariables(secret, [{ key, value }]);
    if (response.success && response.data) {
       const updated = await variablesApi.getSecuredVariablesForSecret(secret);
       setVariables((prev) => ({ ...prev, [secret]: updated }));
       setEditing(null);
       setEditingValue("");
       message.success("Value updated");
    } else {
       message.error(response.error?.errorMessage || "Failed to update variable.");
    }
  };

  const handleDeleteVariable = async (secret: string, key: string) => {
    await variablesApi.deleteSecuredVariables(secret, [key]);
    const updated = await variablesApi.getSecuredVariablesForSecret(secret);
    setVariables((prev) => ({ ...prev, [secret]: updated }));
    message.success("Variable deleted");
  };

  const handleDeleteSelected = async () => {
    const toDelete: Record<string, string[]> = {};

    Object.entries(selectedKeys).forEach(([secret, keys]) => {
      if (keys.length > 0) {
        toDelete[secret] = keys;
      }
    });

    if (Object.keys(toDelete).length === 0) return;

    try {
      for (const secret of Object.keys(toDelete)) {
        await variablesApi.deleteSecuredVariables(secret, toDelete[secret]);
      }

      const updated = await variablesApi.getSecuredVariables();
      const updatedVariables: Record<string, Variable[]> = {};
      updated.forEach(({ secretName, variables }) => {
        updatedVariables[secretName] = variables;
      });

      setVariables((prev) => ({ ...prev, ...updatedVariables }));
      setSelectedKeys({});
      message.success("Selected variables deleted");
    } catch (error) {
      console.error("Failed to delete selected variables:", error);
      message.error("Failed to delete selected variables");
    }
  };

  const hasSelected = Object.values(selectedKeys).some((keys) => keys.length > 0);

  const calculateSecuredScrollHeight = () => {
    const headerHeight = 40;
    return 300 - headerHeight;
  };

  const expandedRowRender = (secret: string) => (
    <div className={styles["expanded-content-wrapper"]}>
      <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <VariablesTable
          variables={variables[secret] || []}
          selectedKeys={selectedKeys[secret] || []}
          isAddingNew={newVariableKeys[secret]}
          editingKey={editing?.secret === secret ? editing.key : null}
          editingValue={editing?.secret === secret ? editingValue : ""}
          onStartEditing={(key) => {
            setEditing({ secret, key });
            setEditingValue("");
          }}
          onChangeEditingValue={setEditingValue}
          onCancelEditing={() => {
            setEditing(null);
            setEditingValue("");
          }}
          onConfirmEdit={(key, value) => handleUpdateVariable(secret, key, value)}
          onDelete={(key) => handleDeleteVariable(secret, key)}
          onAdd={(key, value) => handleAddVariable(secret, key, value)}
          onSelectedChange={(keys) =>
            setSelectedKeys((prev) => ({ ...prev, [secret]: keys }))
          }
          isValueHidden
          enableKeySort
          enableValueSort={false}
          enableKeyFilter
          enableValueFilter={false}
          columnsWidth={columnsWidth}
          onResize={handleResize}
          calculateScrollHeight={calculateSecuredScrollHeight}
          enableScroll={false}
        />
      </div>
    </div>
  );

  return (
    <div className={styles["secured-variables-container"]}>
      <div className={styles["secured-variables-header"]}>
        <Title level={4} className={styles["secured-variables-title"]}>
          <LockOutlined />
          Secured Variables
        </Title>
        <div className={styles["secret-actions"]}>
          <Popconfirm
            title="Delete all selected variables?"
            onConfirm={handleDeleteSelected}
            okText="Yes"
            cancelText="No"
            disabled={!hasSelected}
          >
            <Button icon={<DeleteOutlined />} danger disabled={!hasSelected}>
              Delete Selected
            </Button>
          </Popconfirm>
          <Button type="primary" onClick={() => setCreateModalVisible(true)}>
            Create Secret
          </Button>
        </div>
      </div>

      <Modal
        title="Create New Secret"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" form={createForm} onFinish={handleCreateSecret}>
          <Form.Item
            name="secretName"
            label="Secret Name"
            rules={[{ required: true, message: "Enter secret name" }]}>
            <Input placeholder="e.g., my-secret" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <TableScroll enableScroll={true} className={styles["secured-table-container"]}>
        <Table
          dataSource={secrets.map((s) => ({ key: s, secret: s }))}
          columns={[
            {
              title: "Secret",
              dataIndex: "secret",
              key: "secret",
              render: (secret) => (
                <div className={styles["secret-content"]}>
                  <div className="secret-label">
                    <span>{secret}</span>
                    {secret === defaultSecret && (
                      <Tag color="green" style={{ borderRadius: 12, padding: "0 8px", marginLeft: "8px" }}>
                        default
                      </Tag>
                    )}
                  </div>
                  <div className={styles["secret-actions"]}>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => variablesApi.downloadHelmChart(secret)}>
                      HELM Chart
                    </Button>
                    <Button
                      icon={<PlusOutlined />}
                      size="small"
                      onClick={() =>
                        setNewVariableKeys((prev) => ({ ...prev, [secret]: true }))}
                    />
                  </div>
                </div>
              ),
            },
          ]}
          expandable={{
            expandedRowRender: (record) => expandedRowRender(record.secret),
            rowExpandable: () => true,
          }}
          pagination={false}
          size="small"
          bordered={false}
        />
      </TableScroll>
    </div>
  );
};

export default SecuredVariables;