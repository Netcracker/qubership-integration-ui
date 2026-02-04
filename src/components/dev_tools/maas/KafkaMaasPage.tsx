import React, { useState, useEffect, useCallback } from "react";
import { Form, Input, Flex } from "antd";
import { useForm } from "antd/lib/form/Form";
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
      // TODO: Implement create functionality
      // await createEntity(values.namespace, values.topicClassifierName);
      console.log("Create functionality to be implemented", values);
    } catch (error) {
      console.error("Create validation failed:", error);
    } finally {
      setCreateInProgress(false);
    }
  }, [form]);

  const isFormValid = useCallback(() => {
    try {
      const namespace = form.getFieldValue("namespace");
      const topicClassifierName = form.getFieldValue("topicClassifierName");
      return (
        namespace &&
        topicClassifierName &&
        NON_WHITESPACE_PATTERN.test(namespace) &&
        NON_WHITESPACE_PATTERN.test(topicClassifierName)
      );
    } catch {
      return false;
    }
  }, [form]);

  return (
    <Flex vertical className={sharedStyles["container"]}>
      <MaasPageHeader
        title="Kafka - MaaS"
        exportInProgress={exportInProgress}
        isFormValid={isFormValid()}
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
          isFormValid={isFormValid()}
          onCreate={handleCreate}
          onReset={handleReset}
        />
      </div>
    </Flex>
  );
};
