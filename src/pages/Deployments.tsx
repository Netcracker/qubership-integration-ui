import React from "react";
import { FloatButton, Table, Tooltip } from "antd";
import { useDeployments } from "../hooks/useDeployments.tsx";
import { useParams } from "react-router";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { TableProps } from "antd/lib/table";
import { CreateDeploymentRequest, Deployment } from "../api/apiTypes.ts";
import { DeploymentRuntimeStates } from "../components/deployment_runtime_states/DeploymentRuntimeStates.tsx";
import { useSnapshots } from "../hooks/useSnapshots.tsx";
import { formatTimestamp } from "../misc/format-utils.ts";
import { useModalsContext } from "../Modals.tsx";
import { DeploymentCreate } from "../components/modal/DeploymentCreate.tsx";
import { api } from "../api/api.ts";
import { LongActionButton } from "../components/LongActionButton.tsx";
import { useNotificationService } from "../hooks/useNotificationService.tsx";
import {getDeploymentFromEvent, mergeDeployment} from "../misc/deployment-utils.ts";
import {Event} from "../api/apiTypes";
import {useEventContext} from "../components/notifications/contexts/EventContext.tsx";
import {getNotificationConfiguration} from "../misc/notification-util.ts";

export const Deployments: React.FC = () => {
  const { chainId } = useParams<{ chainId: string }>();
  const { isLoading, deployments, setDeployments } = useDeployments(chainId);
  const { snapshots } = useSnapshots(chainId);
  const { showModal } = useModalsContext();
  const { subscribe } = useEventContext();

  useEffect(() => {
    return subscribe(ObjectType.DEPLOYMENT, (event: Event) => {
      notification.open(getNotificationConfiguration(event, ObjectType.DEPLOYMENT));
      const eventDeployment = getDeploymentFromEvent(event);
      setDeployments((deploymentsState) => {
        const currentDeployments = deploymentsState ? deploymentsState : [];
        const matchedDeployment = currentDeployments.find((d) => d.id === eventDeployment.id);
        if (matchedDeployment) {
          return currentDeployments.map((currentDeployment) => currentDeployment.id === eventDeployment.id ? mergeDeployment(currentDeployment, eventDeployment) : currentDeployment);
        }
      });
    });
  }, [subscribe]);

  const notificationService = useNotificationService();

  const columns: TableProps<Deployment>["columns"] = [
    {
      title: "Snapshot",
      dataIndex: "snapshotId",
      key: "snapshotId",
      render: (_, deployment) => (
        <>
          {snapshots?.find((snapshot) => snapshot.id === deployment.snapshotId)
            ?.name ?? deployment.snapshotId}
        </>
      ),
    },
    { title: "Domain", dataIndex: "domain", key: "domain" },
    {
      title: "Status",
      dataIndex: "runtime",
      key: "runtime",
      render: (_, deployment) => (
        <DeploymentRuntimeStates
          timestamp={deployment.createdWhen}
          service={deployment.serviceName}
          runtimeStates={deployment.runtime ?? { states: {} }}
        />
      ),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (_, deployment) => <>{deployment.createdBy.username}</>,
    },
    {
      title: "Created At",
      dataIndex: "createdWhen",
      key: "createdWhen",
      render: (_, deployment) => <>{formatTimestamp(deployment.createdWhen)}</>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      className: "actions-column",
      render: (_, deployment) => (
        <Tooltip title="Delete deployment" placement="topRight">
          <LongActionButton
            size="small"
            icon={<DeleteOutlined />}
            type="text"
            onAction={async () => deleteDeployment(deployment)}
          />
        </Tooltip>
      ),
    },
  ];

  const onDeploymentCreated = async (deployment: Deployment) => {
    setDeployments([...(deployments ?? []), deployment]);
  };

  const deleteDeployment = async (deployment: Deployment) => {
    try {
      await api.deleteDeployment(deployment.id);
      setDeployments(deployments?.filter((d) => d.id !== deployment.id) ?? []);
    } catch (error) {
      notificationService.requestFailed("Failed to delete deployment", error);
    }
  };

  const createDeployment = async (request: CreateDeploymentRequest) => {
    if (!chainId) return;
    try {
      const deployment = await api.createDeployment(chainId, request);
      await onDeploymentCreated(deployment);
    } catch (error) {
      notificationService.requestFailed("Failed to create deployment", error);
    }
  };

  return (
    <>
      <Table
        size="small"
        columns={columns}
        dataSource={deployments}
        pagination={false}
        loading={isLoading}
        rowKey="name"
        scroll={{ y: "calc(100vh - 200px)" }}
      />
      <FloatButton
        icon={<PlusOutlined />}
        onClick={() =>
          showModal({
            component: (
              <DeploymentCreate chainId={chainId} onSubmit={createDeployment} />
            ),
          })
        }
      />
    </>
  );
};
