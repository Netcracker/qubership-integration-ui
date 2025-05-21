import React, { useEffect, useState } from "react";

import {
  Table,
  Typography,
  Button,
  Input,
  Form,
  message,
  Modal,
  Popconfirm, Tag
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined, DownloadOutlined, LockOutlined
} from "@ant-design/icons";

import styles from "./SecuredVariables.module.css"
import VariablesTable from "./VariablesTable";
import {
  createSecret,
  createSecuredVariables,
  deleteSecuredVariables,
  downloadHelmChart,
  getSecuredVariables,
  getSecuredVariablesForSecret, SecretWithVariables,
  updateSecuredVariables, Variable
} from "../../../api/admin-tools/variables.ts";

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

  const loadSecrets = async () => {
    const secretsWithVariables: SecretWithVariables[] = await getSecuredVariables();

    const sorted = secretsWithVariables.sort((a, b) => {
      if (a.isDefaultSecret) return -1;
      if (b.isDefaultSecret) return 1;
      return 0;
    });

    const variablesBySecret: Record<string, Variable[]> = {};
    const secrets: string[] = [];
    let defaultSecretName = "";
    sorted.forEach(({ secretName, variables, isDefaultSecret }) => {
      variablesBySecret[secretName] = variables;
      secrets.push(secretName)
      if (isDefaultSecret) {
        defaultSecretName = secretName;
      }
    });

    setVariables(variablesBySecret);
    setSecrets(secrets);
    setDefaultSecret(defaultSecretName);
  };

  useEffect(() => {
    loadSecrets();
  }, []);

  const handleCreateSecret = async (values: any) => {
    const name = values.secretName.trim();
    if (!name) return;
    await createSecret(name);
    message.success(`Secret "${name}" created`);
    setCreateModalVisible(false);
    createForm.resetFields();
    loadSecrets();
  };

  const handleAddVariable = async (secret: string, key: string, value: string) => {
    if (!key || !value) return;
    await createSecuredVariables(secret,[{ key, value }]);
    const updated = await getSecuredVariablesForSecret(secret);
    setVariables((prev) => ({ ...prev, [secret]: updated }));
    setNewVariableKeys((prev) => ({ ...prev, [secret]: false }));
  };

  const handleUpdateVariable = async (secret: string, key: string, value: string) => {
    await updateSecuredVariables(secret, [{ key, value }]);
    const updated = await getSecuredVariablesForSecret(secret);
    setVariables((prev) => ({ ...prev, [secret]: updated }));
    setEditing(null);
    setEditingValue("");
    message.success("Value updated");
  };

  const handleDeleteVariable = async (secret: string, key: string) => {
    await deleteSecuredVariables(secret, [key]);
    const updated = await getSecuredVariablesForSecret(secret);
    setVariables((prev) => ({ ...prev, [secret]: updated }));
    message.success("Variable deleted");
  };

  const handleDeleteSelected = async () => {
    const variablesToDelete: Record<string, string[]> = {};

    Object.entries(selectedKeys).forEach(([secret, keys]) => {
      if (keys.length > 0) {
        variablesToDelete[secret] = keys;
      }
    });

    if (Object.keys(variablesToDelete).length === 0) return;

    try {
      for (const secret of Object.keys(variablesToDelete)) {
        await deleteSecuredVariables(secret, variablesToDelete[secret]);
      }
      message.success("Selected variables deleted");

      const updated = await getSecuredVariables();
      const updatedVariables: Record<string, Variable[]> = {};
      updated.forEach(({ secretName, variables }) => {
        updatedVariables[secretName] = variables;
      });

      setVariables((prev) => ({ ...prev, ...updatedVariables }));
      setSelectedKeys({});
    } catch {
      message.error("Failed to delete selected variables");
    }
  };

  const hasSelected = Object.values(selectedKeys).some((keys) => keys.length > 0);

  const expandedRowRender = (secret: string) => (
    <div className={styles['expanded-content-wrapper']}>
      <VariablesTable
        variables={variables[secret] || []}
        isAddingNew={newVariableKeys[secret]}
        selectedKeys={selectedKeys[secret] || []}
        onSelectedChange={(keys) =>
          setSelectedKeys((prev) => ({ ...prev, [secret]: keys }))
        }
        editingKey={editing?.secret === secret ? editing.key : null}
        editingValue={editing?.secret === secret ? editingValue : ""}
        onStartEditing={(key, value) => {
          setEditing({ secret, key });
          setEditingValue(value);
        }}
        onChangeEditingValue={setEditingValue}
        onCancelEditing={() => {
          setEditing(null);
          setEditingValue("");
        }}
        onConfirmEdit={(key, value) => handleUpdateVariable(secret, key, value)}
        onDelete={(key) => handleDeleteVariable(secret, key)}
        onAdd={(key, value) => handleAddVariable(secret, key, value)}
        enableKeySort
        enableKeyFilter
        isValueHidden
        enableValueSort={false}
        enableValueFilter={false}
      />
    </div>
  );

  return (
    <div>
      <div className={styles['secured-variables-header']}>
        <Title level={4} className={styles['secured-variables-title']}>
          <LockOutlined />
          Secured Variables
        </Title>
        <div className={styles['secret-actions']}>
          <Popconfirm
            title="Delete all selected variables?"
            onConfirm={handleDeleteSelected}
            okText="Yes"
            cancelText="No"
            disabled={!hasSelected}
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              disabled={!hasSelected}
            >
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
            rules={[{ required: true, message: "Enter secret name" }]}
          >
            <Input placeholder="e.g., my-secret" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Table
        dataSource={secrets.map((s) => ({ key: s, secret: s }))}
        columns={[
          {
            title: "Secret",
            dataIndex: "secret",
            key: "secret",
            render: (secret) => (
              <div className={styles['secret-content']}>
                <div className="secret-label">
                  <span>{secret}</span>
                  {secret === defaultSecret && (
                    <Tag color="green" style={{ borderRadius: 12, padding: "0 8px" }}>
                      default
                    </Tag>
                  )}
                </div>
                <div className={styles['secret-actions']}>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadHelmChart(secret)}
                  >
                    HELM Chart
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() =>
                      setNewVariableKeys((prev) => ({ ...prev, [secret]: true }))
                    }
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
    </div>
  );
};

export default SecuredVariables;