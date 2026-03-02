import React, { useState } from "react";
import {
  BulkDeploymentSnapshotAction,
  DomainType,
} from "../../api/apiTypes.ts";
import { useModalContext } from "../../ModalContextProvider.tsx";
import { Modal, Button, Form, Select } from "antd";
import { Domain, SelectDomains } from "../SelectDomains.tsx";

export type DeployRequest = {
  domains: Domain[];
  snapshotAction: BulkDeploymentSnapshotAction;
};

type DeployChainsProps = {
  onSubmit?: (options: DeployRequest) => void;
};

export const DeployChains: React.FC<DeployChainsProps> = ({ onSubmit }) => {
  const { closeContainingModal } = useModalContext();
  const [confirmLoading, setConfirmLoading] = useState(false);

  return (
    <Modal
      title={"Deploy chains"}
      open={true}
      onCancel={closeContainingModal}
      footer={[
        <Button key="cancel" onClick={closeContainingModal}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          form="deployOptionsForm"
          htmlType={"submit"}
          loading={confirmLoading}
        >
          Deploy
        </Button>,
      ]}
    >
      <Form<DeployRequest>
        labelWrap
        labelCol={{ flex: "150px" }}
        wrapperCol={{ flex: "auto" }}
        id="deployOptionsForm"
        initialValues={{
          domains: [{ name: "default", type: DomainType.NATIVE }],
          snapshotAction: BulkDeploymentSnapshotAction.CREATE_NEW,
        }}
        onFinish={(values) => {
          setConfirmLoading(true);
          try {
            onSubmit?.(values);
            closeContainingModal();
          } finally {
            setConfirmLoading(false);
          }
        }}
      >
        <Form.Item
          name="domains"
          label={"Engine domains"}
          rules={[{ required: true }]}
        >
          <SelectDomains />
        </Form.Item>
        <Form.Item name="snapshotAction" label={"Snapshot action"}>
          <Select
            options={[
              {
                value: BulkDeploymentSnapshotAction.CREATE_NEW,
                label: "Create new",
              },
              {
                value: BulkDeploymentSnapshotAction.LAST_CREATED,
                label: "Reuse latest, otherwise create new",
              },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
