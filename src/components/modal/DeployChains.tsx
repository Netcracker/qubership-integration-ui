import React, { useCallback, useState } from "react";
import {
  BulkDeploymentSnapshotAction,
  DomainType,
  EngineDomain,
} from "../../api/apiTypes.ts";
import { useModalContext } from "../../ModalContextProvider.tsx";
import { Modal, Button, Form, Select, Space, Tag } from "antd";
import { useDomains } from "../../hooks/useDomains.tsx";
import { LabelInValueType } from "rc-select/lib/Select";
import type { FlattenOptionData } from "rc-select/lib/interface";

export type CamelKDeploy = {
  name: string;
};

export type NativeDeploy = {
  domains: string[];
  snapshotAction: BulkDeploymentSnapshotAction;
};

export type DeployRequest = {
  nativeDeploy?: NativeDeploy;
  camelKDeploys: CamelKDeploy[];
};

type DeployOptions = {
  domains: string[];
  snapshotAction: BulkDeploymentSnapshotAction;
};

type DeployChainsProps = {
  onSubmit?: (options: DeployRequest) => void;
};

function getDomainType(domainId: string, domains: EngineDomain[]): DomainType {
  return (
    domains.find((domain) => domainId === domain.id)?.type ?? DomainType.MICRO
  );
}

function createDeployRequest(
  deployOptions: DeployOptions,
  domains: EngineDomain[],
): DeployRequest {
  const nativeDomains: string[] = [];
  const camelKDomains: string[] = [];
  for (const domain of deployOptions.domains) {
    const domainType = getDomainType(domain, domains);
    (domainType === DomainType.MICRO ? camelKDomains : nativeDomains).push(
      domain,
    );
  }
  return {
    nativeDeploy:
      nativeDomains.length > 0
        ? {
            domains: nativeDomains,
            snapshotAction: deployOptions.snapshotAction,
          }
        : undefined,
    camelKDeploys: camelKDomains.map((domain) => ({ name: domain })),
  };
}

export const DeployChains: React.FC<DeployChainsProps> = ({ onSubmit }) => {
  const { closeContainingModal } = useModalContext();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { isLoading: isDomainsLoading, domains } = useDomains();

  const renderOption = useCallback(
    (props: LabelInValueType | FlattenOptionData<unknown>) => {
      const domainType = getDomainType(props.value?.toString() ?? "", domains);
      return domainType === DomainType.MICRO ? (
        <Space size={"small"}>
          <Tag>micro</Tag>
          <span>{props.value}</span>
        </Space>
      ) : (
        props.label
      );
    },
    [domains],
  );

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
      <Form<DeployOptions>
        labelWrap
        labelCol={{ flex: "150px" }}
        wrapperCol={{ flex: "auto" }}
        id="deployOptionsForm"
        initialValues={{
          domains: ["default"],
          snapshotAction: BulkDeploymentSnapshotAction.CREATE_NEW,
        }}
        onFinish={(values) => {
          setConfirmLoading(true);
          const deployRequest = createDeployRequest(values, domains);
          try {
            onSubmit?.(deployRequest);
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
          <Select
            loading={isDomainsLoading}
            mode="tags"
            allowClear
            labelRender={renderOption}
            optionRender={renderOption}
            options={domains.map((domain) => ({
              value: domain.id,
              label: domain.name,
            }))}
          />
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
