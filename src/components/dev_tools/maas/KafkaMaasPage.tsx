import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Form, Input, Flex, message } from "antd";
import { useForm } from "antd/lib/form/Form";
import { api } from "../../../api/api.ts";
import { useNotificationService } from "../../../hooks/useNotificationService.tsx";
import { MaasFormActions } from "./MaasFormActions.tsx";
import { MaasPageHeader } from "./MaasPageHeader.tsx";
import { NamespaceField } from "./NamespaceField.tsx";
import { KafkaMaasFormData, NON_WHITESPACE_PATTERN } from "./types.ts";
import sharedStyles from "../DevTools.module.css";
import styles from "./Maas.module.css";

export const KafkaMaasPage: React.FC = () => {
  const [form] = useForm<KafkaMaasFormData>();
  const [exportInProgress, setExportInProgress] = useState(false);
  const [createInProgress, setCreateInProgress] = useState(false);
  const notificationService = useNotificationService();

  const formValues = Form.useWatch((values) => values, form) as
    | Partial<KafkaMaasFormData>
    | undefined;

  const isFormValid = useMemo(() => {
    const namespace = formValues?.namespace;
    const topicClassifierName = formValues?.topicClassifierName;
    return (
      !!namespace &&
      !!topicClassifierName &&
      NON_WHITESPACE_PATTERN.test(namespace) &&
      NON_WHITESPACE_PATTERN.test(topicClassifierName)
    );
  }, [formValues]);

  useEffect(() => {
    const namespace = (window as any)?.routes?.namespace || "";
    form.setFieldsValue({
      namespace: namespace,
      topicClassifierName: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = useCallback(() => {
    const namespace = (window as any)?.routes?.namespace || "";
    form.setFieldsValue({
      namespace: namespace,
      topicClassifierName: "",
    });
  }, [form]);

  const handleExport = useCallback(async () => {
    try {
      const values = await form.validateFields(["topicClassifierName"]);
      // TODO: Implement export functionality
      setExportInProgress(true);
      // await exportDeclarativeFile(values.topicClassifierName);
      console.log("Export functionality to be implemented", values);
    } catch (error) {
      console.error("Export validation failed:", error);
    } finally {
      setExportInProgress(false);
    }
  }, [form]);

  const handleCreate = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setCreateInProgress(true);
      await api.createMaasKafkaEntity(
        values.namespace,
        values.topicClassifierName,
      );
      message.success(
        `MaaS Kafka entity created successfully: Namespace=[${values.namespace}] Topic Classifier=[${values.topicClassifierName}]`,
      );
    } catch (error) {
      notificationService.requestFailed(
        "Unable to create MaaS entity with given values.",
        error,
      );
    } finally {
      setCreateInProgress(false);
    }
  }, [form, notificationService]);

  return (
    <Flex vertical className={sharedStyles["container"]}>
      <MaasPageHeader
        title="Kafka - MaaS"
        exportInProgress={exportInProgress}
        isFormValid={isFormValid}
        onExport={handleExport}
      />

      <div className={styles["parametersSection"]}>
        <div className={styles["parametersHeading"]}>
          Parameters
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <NamespaceField />

          <Form.Item
            label="Topic Classifier Name"
            name="topicClassifierName"
            required
            rules={[
              { required: true, message: "Topic Classifier Name is required" },
              { pattern: NON_WHITESPACE_PATTERN, message: "Topic Classifier Name cannot be empty" },
            ]}
          >
            <Input placeholder="Enter topic classifier name" />
          </Form.Item>
        </Form>
      </div>

      <div className={styles["footer"]}>
        <MaasFormActions
          createInProgress={createInProgress}
          isFormValid={isFormValid}
          onCreate={handleCreate}
          onReset={handleReset}
        />
      </div>
    </Flex>
  );
};
