import React, { useEffect, useState, useRef, useCallback } from "react";
import { Form, Input, Button, Select, Tag, Descriptions, Spin } from "antd";
import { IntegrationSystem, IntegrationSystemType } from "../../api/apiTypes";
import { api } from "../../api/api";
import { useAsyncRequest } from './useAsyncRequest';

interface ServiceParametersTabProps {
  systemId: string;
  formatTimestamp: (val: string) => string;
  sidePadding: number;
  styles: Record<string, string>;
}

interface ServiceFormValues {
  name: string;
  description?: string;
  labels: string[];
}

export const ServiceParametersTab: React.FC<ServiceParametersTabProps> = ({
  systemId,
  formatTimestamp,
  sidePadding,
  styles,
}) => {
  const [form] = Form.useForm();
  const [system, setSystem] = useState<IntegrationSystem | null>(null);
  const [technicalLabels, setTechnicalLabels] = useState<string[]>([]);
  const [userLabels, setUserLabels] = useState<string[]>([]);
  const cacheRef = useRef<{ [key: string]: IntegrationSystem }>({});

  const setLabelsAndForm = useCallback((data: IntegrationSystem) => {
    setTechnicalLabels(data.labels?.filter(l => l.technical).map(l => l.name) || []);
    setUserLabels(data.labels?.filter(l => !l.technical).map(l => l.name) || []);
    form.setFieldsValue({
      name: data.name,
      description: data.description,
      labels: [
        ...(data.labels?.filter(l => l.technical).map(l => l.name) || []),
        ...(data.labels?.filter(l => !l.technical).map(l => l.name) || []),
      ],
    });
  }, [form]);

  const {
    loading: loadingSystem,
    error: loadError,
    execute: loadSystem,
  } = useAsyncRequest(async (id: string) => {
    if (cacheRef.current[id]) {
      return cacheRef.current[id];
    }
    const data = await api.getService(id);
    cacheRef.current[id] = data;
    return data;
  }, { initialValue: null });

  useEffect(() => {
    if (!systemId) return;
    void loadSystem(systemId).then((data) => {
      if (data) {
        setSystem(data);
        setLabelsAndForm(data);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId]);

  const {
    loading: savingSystem,
    error: saveError,
    execute: saveSystem,
  } = useAsyncRequest(async () => {
    if (!system || !systemId) throw new Error('No system');
    const values = (await form.validateFields()) as ServiceFormValues;
    const payload = {
      ...system,
      ...values,
      labels: [
        ...technicalLabels.map(name => ({ name, technical: true })),
        ...userLabels.map(name => ({ name, technical: false })),
      ],
    };
    const updated: IntegrationSystem = await api.updateService(systemId, payload);
    setSystem(updated);
    cacheRef.current[systemId] = updated;
    return updated;
  });

  const handleSave = async (): Promise<void> => {
    await saveSystem();
  };

  if (loadingSystem) return <Spin style={{ margin: 32 }} />;
  if (loadError) return <div style={{ color: 'var(--vscode-inputValidation-errorForeground, red)', margin: 32 }}>{loadError}</div>;
  if (!system) return null;

  return (
    <div style={{ paddingLeft: sidePadding, maxWidth: 900 }}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Enter service name" }]}
        >
          <Input maxLength={128} />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea maxLength={512} />
        </Form.Item>
        <Form.Item label="Labels" name="labels">
          <Select
            mode="tags"
            style={{ width: "100%" }}
            value={[...technicalLabels, ...userLabels]}
            onChange={(allSelected: string[]) => {
              const updatedUserLabels = allSelected.filter(
                (label) => !technicalLabels.includes(label),
              );
              setUserLabels(updatedUserLabels);
              form.setFieldsValue({
                labels: [...technicalLabels, ...updatedUserLabels],
              });
            }}
            tagRender={({ label, onClose }) => {
              const isTech = technicalLabels.includes(typeof label === "string" ? label : "");
              return (
                <Tag
                  color={isTech ? "blue" : "default"}
                  closable={!isTech}
                  onClose={onClose}
                  style={{ marginRight: 4 }}
                >
                  {label}
                </Tag>
              );
            }}
            placeholder="Add labels"
          />
        </Form.Item>
        {(system.type === IntegrationSystemType.INTERNAL || system.type === IntegrationSystemType.IMPLEMENTED) && (
          <Form.Item label="Environment address">
            <Input value="" readOnly />
          </Form.Item>
        )}
        <Descriptions column={1} size="small" style={{ margin: "24px 0" }}>
          <Descriptions.Item label="Created">
            {formatTimestamp(system.createdWhen as string)}
          </Descriptions.Item>
          <Descriptions.Item label="Modified">
            {formatTimestamp(system.modifiedWhen as string)}
          </Descriptions.Item>
        </Descriptions>
        <Button
          type="primary"
          className={styles["variables-actions"]}
          onClick={() => { void handleSave(); }}
          loading={savingSystem}
          disabled={savingSystem}
        >
          Save
        </Button>
        {(saveError) && <div style={{ color: 'var(--vscode-inputValidation-errorForeground, red)', marginTop: 8 }}>{saveError}</div>}
      </Form>
    </div>
  );
};
