import { Button, Form, Input, Select } from "antd";
import React, { useCallback, useContext, useEffect, useState } from "react";
import TextArea from "antd/lib/input/TextArea";
import { Chain } from "../api/apiTypes.ts";
import { useForm } from "antd/lib/form/Form";
import { ChainContext } from "./ChainPage.tsx";
import {
  ChainExtensionProperties,
  loadChainExtensionPropertiesToForm,
  readChainExtensionPropertiesFromForm,
} from "./ChainExtensionProperties.tsx";
import styles from "./Chain.module.css";
import { api } from "../api/api.ts";
import { useNotificationService } from "../hooks/useNotificationService.tsx";
import { isVsCode } from "../api/rest/vscodeExtensionApi.ts";

export type FormData = {
  name: string;
  labels: string[];
  path: string;
  description: string;
  businessDescription: string;
  assumptions: string;
  outOfScope: string;
  domain?: string;
  deployAction?: string;
};

export const ChainProperties: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const notificationService = useNotificationService();
  const [form] = useForm();

  const chainContext = useContext(ChainContext);

  const getPathToFolder = useCallback(
    async (folderName: string | undefined) => {
      try {
        return await api.getPathToFolderByName(String(folderName));
      } catch (error) {
        notificationService.requestFailed(
          "Failed to get path to folder",
          error,
        );
        return [];
      }
    },
    [notificationService],
  );

  const moveChain = async (chainId: string, destinationFolderId?: string) => {
    try {
      const chain = await api.moveChain(chainId, destinationFolderId);
      if (chain) {
        notificationService.info(
          "Chain moved successfully",
          "Chain moved successfully",
        );
      }
    } catch (error) {
      notificationService.requestFailed("Failed to move chain", error);
    }
  };

  useEffect(() => {
    if (chainContext?.chain) {
      const fullPath = Object.values(
        chainContext.chain.navigationPath,
      ).reverse();

      const formData: FormData = {
        name: chainContext.chain.name ?? "",
        path: fullPath.slice(0, -1).join("/") ?? "",
        labels: chainContext.chain.labels?.map((label) => label.name) ?? [],
        description: chainContext.chain.description ?? "",
        businessDescription: chainContext.chain.businessDescription ?? "",
        assumptions: chainContext.chain.assumptions ?? "",
        outOfScope: chainContext.chain.outOfScope ?? "",
      };
      loadChainExtensionPropertiesToForm(chainContext, formData);
      form.setFieldsValue(formData);
    }
  }, [chainContext, form]);

  const handleFinish = async (values: FormData) => {
    if (!chainContext?.chain) return;

    let changes: Partial<Chain> = {
      name: values.name,
      labels: values.labels?.map((name) => ({ name, technical: false })),
      description: values.description,
      businessDescription: values.businessDescription,
      assumptions: values.assumptions,
      outOfScope: values.outOfScope,
    };

    const uiFoldersPath = values.path.startsWith("/")
      ? values.path.slice(1).split("/")
      : values.path.split("/");

    if (isVsCode) {
      await moveChain(String(chainContext.chain.id), uiFoldersPath.join("/"));
    }

    if (!isVsCode) {
      const lastSegment = String(uiFoldersPath.reverse()[0] ?? "");
      const folders = await getPathToFolder(lastSegment);
      const dbFoldersPath = folders.map((f) => f.name).join("/");

      if (dbFoldersPath !== uiFoldersPath.reverse().join("/")) {
        notificationService.requestFailed("Incorrect folder path", undefined);
        return;
      }

      const navigationPath = new Map(folders.map((f) => [f.id, f.name]));

      const destinationFolderId = folders.reverse()[0]?.id;

      if (chainContext.chain.parentId !== destinationFolderId) {
        await moveChain(String(chainContext.chain.id), destinationFolderId);
      }

      changes = {
        ...changes,
        parentId: destinationFolderId,
        navigationPath,
      };
    }

    readChainExtensionPropertiesFromForm(values, changes);

    setIsUpdating(true);
    try {
      await chainContext.update(changes);
      setHasChanges(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.pageContainer as string}>
      <div className={styles.formContent as string}>
        <Form<FormData>
          form={form}
          disabled={isUpdating}
          labelCol={{ flex: "150px" }}
          wrapperCol={{ flex: "auto" }}
          labelWrap
          onChange={() => setHasChanges(true)}
          onFinish={(values) => {
            void handleFinish(values);
          }}
        >
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Path" name="path">
            <Input />
          </Form.Item>
          <Form.Item label="Labels" name="labels">
            <Select
              mode="tags"
              tokenSeparators={[" "]}
              classNames={{ popup: { root: "not-displayed" } }}
              onChange={() => setHasChanges(true)}
              suffixIcon={<></>}
            />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <TextArea style={{ height: 120, resize: "none" }} />
          </Form.Item>
          <Form.Item label="Business Description" name="businessDescription">
            <TextArea style={{ height: 120, resize: "none" }} />
          </Form.Item>
          <Form.Item label="Assumptions" name="assumptions">
            <TextArea style={{ height: 120, resize: "none" }} />
          </Form.Item>
          <Form.Item label="Out of Scope" name="outOfScope">
            <TextArea style={{ height: 120, resize: "none" }} />
          </Form.Item>
          <ChainExtensionProperties onChange={() => setHasChanges(true)} />
          <Form.Item wrapperCol={{ offset: 0 }} style={{ textAlign: "right" }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isUpdating}
              disabled={!hasChanges}
            >
              Apply
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};
