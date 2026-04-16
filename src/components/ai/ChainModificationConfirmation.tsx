import React from "react";
import { Modal, List, Typography, Tag } from "antd";
import type { Chain } from "../../api/apiTypes.ts";

export const NEW_CHAIN_ID = "__new__";

export interface ChainMetadata {
  name: string;
  description?: string;
  folderId?: string;
  businessDescription?: string;
  assumptions?: string;
  outOfScope?: string;
  labels?: { name: string; technical?: boolean }[];
}

export type ChainModificationAction =
  | {
      action: "updateChain";
      patch: Partial<
        Pick<
          Chain,
          | "name"
          | "description"
          | "businessDescription"
          | "assumptions"
          | "outOfScope"
        >
      > & {
        labels?: { name: string; technical?: boolean }[];
      };
    }
  | {
      action: "createChain";
      chain: ChainMetadata;
    }
  | {
      action: "createElement";
      request: {
        type: string;
        parentElementId?: string;
        properties?: Record<string, unknown>;
      };
    }
  | {
      action: "updateElement";
      elementId: string;
      patch: {
        name: string;
        description: string;
        type: string;
        parentElementId?: string;
        properties: Record<string, unknown>;
      };
    }
  | {
      action: "deleteElements";
      elementIds: string[];
    }
  | {
      action: "createConnection";
      connection: {
        from: string;
        to: string;
      };
    }
  | {
      action: "deleteConnections";
      connectionIds: string[];
    };

export interface ChainModificationProposal {
  type: "chain-modification-proposal";
  chainId: string;
  changes: ChainModificationAction[];
  summary?: string;
  chainMeta?: ChainMetadata;
}

interface Props {
  open: boolean;
  proposal: ChainModificationProposal | null;
  onCancel: () => void;
  onApply: (proposal: ChainModificationProposal) => void | Promise<void>;
}

function renderActionTitle(change: ChainModificationAction): string {
  switch (change.action) {
    case "updateChain":
      return "Update chain metadata";
    case "createChain":
      return `Create chain "${change.chain.name}"`;
    case "createElement":
      return `Create element of type "${change.request.type}"`;
    case "updateElement":
      return `Update element ${change.elementId}`;
    case "deleteElements":
      return `Delete ${change.elementIds.length} element(s)`;
    case "createConnection":
      return `Create connection ${change.connection.from} → ${change.connection.to}`;
    case "deleteConnections":
      return `Delete ${change.connectionIds.length} connection(s)`;
    default: {
      const _exhaustive: never = change;
      return (_exhaustive as { action: string }).action;
    }
  }
}

export const ChainModificationConfirmation: React.FC<Props> = ({
  open,
  proposal,
  onCancel,
  onApply,
}) => {
  const changes = proposal?.changes ?? [];
  const isNewChain = proposal?.chainId === NEW_CHAIN_ID;

  return (
    <Modal
      open={open}
      title={
        <>
          Apply changes to chain
          {isNewChain && (
            <Tag
              color="green"
              data-testid="new-chain-badge"
              style={{ marginLeft: 8 }}
            >
              New chain
            </Tag>
          )}
        </>
      }
      onCancel={onCancel}
      onOk={() => {
        if (proposal) {
          onApply(proposal);
        }
      }}
      okText="Apply changes"
      okButtonProps={{ disabled: !proposal || changes.length === 0 }}
      destroyOnClose
    >
      {!proposal || changes.length === 0 ? (
        <Typography.Text type="secondary">
          No structured chain modifications were detected in the last assistant
          response.
        </Typography.Text>
      ) : (
        <>
          {proposal.summary && (
            <Typography.Paragraph>
              <Typography.Text strong>Summary: </Typography.Text>
              {proposal.summary}
            </Typography.Paragraph>
          )}
          <Typography.Paragraph>
            {isNewChain ? (
              <>
                The assistant suggests creating a new chain
                {proposal.chainMeta?.name && (
                  <>
                    {" "}
                    <Typography.Text code>
                      {proposal.chainMeta.name}
                    </Typography.Text>
                  </>
                )}{" "}
                and applying the following changes:
              </>
            ) : (
              <>
                The assistant suggests applying the following changes to chain{" "}
                <Typography.Text code>{proposal.chainId}</Typography.Text>:
              </>
            )}
          </Typography.Paragraph>
          <List
            size="small"
            dataSource={changes}
            renderItem={(change, index) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <>
                      <Tag color="blue">{index + 1}</Tag>
                      {renderActionTitle(change)}
                    </>
                  }
                  description={
                    <Typography.Text type="secondary">
                      {change.action === "updateChain" &&
                        "Chain metadata (name/description/labels/assumptions/outOfScope)"}
                      {change.action === "createChain" &&
                        `Name: ${change.chain.name}${
                          change.chain.folderId
                            ? `, folder: ${change.chain.folderId}`
                            : ""
                        }`}
                      {change.action === "createElement" &&
                        `Parent: ${change.request.parentElementId ?? "root"}`}
                      {change.action === "updateElement" &&
                        `Type: ${change.patch.type}, parent: ${
                          change.patch.parentElementId ?? "unchanged"
                        }`}
                      {change.action === "deleteElements" &&
                        `Elements: ${change.elementIds.join(", ")}`}
                      {change.action === "createConnection" &&
                        `From: ${change.connection.from}, to: ${change.connection.to}`}
                      {change.action === "deleteConnections" &&
                        `Connections: ${change.connectionIds.join(", ")}`}
                    </Typography.Text>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
    </Modal>
  );
};
