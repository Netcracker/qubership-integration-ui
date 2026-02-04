import React, { useState, useEffect, useCallback } from "react";
import { Form, Input, Flex, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useForm } from "antd/lib/form/Form";
import { MaasFormActions } from "./MaasFormActions.tsx";
import { MaasPageHeader } from "./MaasPageHeader.tsx";
import { NamespaceField } from "./NamespaceField.tsx";
import {
  RabbitMQMaasFormData,
  NON_WHITESPACE_PATTERN,
  DEFAULT_VHOST,
  RABBITMQ_FIELD_NAMES,
} from "./types.ts";
import sharedStyles from "../DevTools.module.css";
import styles from "./Maas.module.css";

export const RabbitMQMaasPage: React.FC = () => {
  const [form] = useForm<RabbitMQMaasFormData>();
  const [exportInProgress, setExportInProgress] = useState(false);
  const [createInProgress, setCreateInProgress] = useState(false);

  useEffect(() => {
    const namespace = (window as any)?.routes?.namespace || "";
    form.setFieldsValue({
      [RABBITMQ_FIELD_NAMES.NAMESPACE]: namespace,
      [RABBITMQ_FIELD_NAMES.VHOST]: DEFAULT_VHOST,
      [RABBITMQ_FIELD_NAMES.EXCHANGE]: "",
      [RABBITMQ_FIELD_NAMES.QUEUE]: "",
      [RABBITMQ_FIELD_NAMES.ROUTING_KEY]: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = useCallback(() => {
    const namespace = (window as any)?.routes?.namespace || "";
    form.setFieldsValue({
      [RABBITMQ_FIELD_NAMES.NAMESPACE]: namespace,
      [RABBITMQ_FIELD_NAMES.VHOST]: DEFAULT_VHOST,
      [RABBITMQ_FIELD_NAMES.EXCHANGE]: "",
      [RABBITMQ_FIELD_NAMES.QUEUE]: "",
      [RABBITMQ_FIELD_NAMES.ROUTING_KEY]: "",
    });
  }, [form]);

  const handleExport = useCallback(async () => {
    try {
      const values = await form.validateFields([
        RABBITMQ_FIELD_NAMES.VHOST,
        RABBITMQ_FIELD_NAMES.EXCHANGE,
        RABBITMQ_FIELD_NAMES.QUEUE,
        RABBITMQ_FIELD_NAMES.ROUTING_KEY,
      ]);
      // TODO: Implement export functionality
      setExportInProgress(true);
      // await exportDeclarativeFile(values.vhost, values.exchange, values.queue, values.routingKey);
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
      // await createEntity(values.namespace, values.vhost, values.exchange, values.queue, values.routingKey);
      console.log("Create functionality to be implemented", values);
    } catch (error) {
      console.error("Create validation failed:", error);
    } finally {
      setCreateInProgress(false);
    }
  }, [form]);

  // Validator: At least one of exchange or queue must be provided
  const validateExchangeOrQueue = useCallback(
    (_: unknown) => {
      const exchange = form.getFieldValue(RABBITMQ_FIELD_NAMES.EXCHANGE);
      const queue = form.getFieldValue(RABBITMQ_FIELD_NAMES.QUEUE);
      // If both are empty (or whitespace), show error
      const exchangeTrimmed = exchange?.trim() || "";
      const queueTrimmed = queue?.trim() || "";
      if (!exchangeTrimmed && !queueTrimmed) {
        return Promise.reject(
          new Error(
            'Fields "Exchange Name" and "Queue Name" can\'t be empty at the same time.'
          )
        );
      }
      return Promise.resolve();
    },
    [form]
  );

  // Validator: If routingKey is provided, both exchange and queue must be provided
  const validateRoutingKey = useCallback(
    (_: unknown, value: string) => {
      const routingKeyTrimmed = value?.trim() || "";
      if (routingKeyTrimmed) {
        const exchange = form.getFieldValue(RABBITMQ_FIELD_NAMES.EXCHANGE);
        const queue = form.getFieldValue(RABBITMQ_FIELD_NAMES.QUEUE);
        const exchangeTrimmed = exchange?.trim() || "";
        const queueTrimmed = queue?.trim() || "";
        if (!exchangeTrimmed || !queueTrimmed) {
          return Promise.reject(
            new Error(
              'Fields "Exchange Name" and "Queue Name" must be specified.'
            )
          );
        }
      }
      return Promise.resolve();
    },
    [form]
  );

  const isFormValid = useCallback(() => {
    try {
      const namespace = form.getFieldValue(RABBITMQ_FIELD_NAMES.NAMESPACE);
      const vhost = form.getFieldValue(RABBITMQ_FIELD_NAMES.VHOST);
      const exchange = form.getFieldValue(RABBITMQ_FIELD_NAMES.EXCHANGE);
      const queue = form.getFieldValue(RABBITMQ_FIELD_NAMES.QUEUE);
      const routingKey = form.getFieldValue(RABBITMQ_FIELD_NAMES.ROUTING_KEY);

      if (
        !namespace ||
        !vhost ||
        !NON_WHITESPACE_PATTERN.test(namespace) ||
        !NON_WHITESPACE_PATTERN.test(vhost)
      ) {
        return false;
      }

      const exchangeTrimmed = exchange?.trim() || "";
      const queueTrimmed = queue?.trim() || "";
      if (!exchangeTrimmed && !queueTrimmed) {
        return false;
      }

      const routingKeyTrimmed = routingKey?.trim() || "";
      if (routingKeyTrimmed && (!exchangeTrimmed || !queueTrimmed)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, [form]);

  return (
    <Flex vertical className={sharedStyles["container"]}>
      <MaasPageHeader
        title="RabbitMQ - MaaS"
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
            label="Vhost Classifier Name"
            name={RABBITMQ_FIELD_NAMES.VHOST}
            required
            rules={[
              { required: true, message: "Vhost Classifier Name is required" },
              {
                pattern: NON_WHITESPACE_PATTERN,
                message: "Vhost Classifier Name cannot be empty",
              },
            ]}
          >
            <Input placeholder="Enter vhost classifier name" />
          </Form.Item>

          <Form.Item
            label="Exchange Name"
            name={RABBITMQ_FIELD_NAMES.EXCHANGE}
            dependencies={[RABBITMQ_FIELD_NAMES.QUEUE]}
            rules={[{ validator: validateExchangeOrQueue }]}
          >
            <Input placeholder="Enter exchange name" />
          </Form.Item>

          <Form.Item
            label="Queue Name"
            name={RABBITMQ_FIELD_NAMES.QUEUE}
            dependencies={[RABBITMQ_FIELD_NAMES.EXCHANGE]}
            rules={[{ validator: validateExchangeOrQueue }]}
          >
            <Input placeholder="Enter queue name" />
          </Form.Item>

          <Form.Item
            label={
              <span className={styles["labelWithIcon"]}>
                Routing Key
                <Tooltip
                  title='When both "Exchange Name" and "Queue Name" are specified, there will be binding created with routing key value from this field.'
                  placement="top"
                >
                  <InfoCircleOutlined className={styles["infoIcon"]} />
                </Tooltip>
              </span>
            }
            name={RABBITMQ_FIELD_NAMES.ROUTING_KEY}
            dependencies={[RABBITMQ_FIELD_NAMES.EXCHANGE, RABBITMQ_FIELD_NAMES.QUEUE]}
            rules={[{ validator: validateRoutingKey }]}
          >
            <Input placeholder="Enter routing key" />
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
