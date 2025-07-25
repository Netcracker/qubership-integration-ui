import React, { useState } from "react";
import { Button, FloatButton, Modal, Table, Tooltip } from "antd";
import { useSnapshots } from "../hooks/useSnapshots.tsx";
import { useParams } from "react-router";
import {
  DeleteOutlined,
  FileTextOutlined,
  MoreOutlined,
  PlusOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { TableProps } from "antd/lib/table";
import { EntityLabel, Snapshot } from "../api/apiTypes.ts";
import { formatTimestamp } from "../misc/format-utils.ts";
import { EntityLabels } from "../components/labels/EntityLabels.tsx";
import FloatButtonGroup from "antd/lib/float-button/FloatButtonGroup";
import { TableRowSelection } from "antd/lib/table/interface";
import { api } from "../api/api.ts";
import { SnapshotXmlView } from "../components/modal/SnapshotXml.tsx";
import { useModalsContext } from "../Modals.tsx";
import {
  getTextColumnFilterFn,
  getTextListColumnFilterFn,
  TextColumnFilterDropdown,
} from "../components/table/TextColumnFilterDropdown.tsx";
import {
  getTimestampColumnFilterFn,
  TimestampColumnFilterDropdown,
} from "../components/table/TimestampColumnFilterDropdown.tsx";
import { SnapshotsCompare } from "../components/modal/SnapshotsCompare.tsx";
import { SnapshotSequenceDiagram } from "../components/modal/SnapshotSequenceDiagram.tsx";
import { InlineEdit } from "../components/InlineEdit.tsx";
import { TextValueEdit } from "../components/table/TextValueEdit.tsx";
import { LabelsEdit } from "../components/table/LabelsEdit.tsx";
import { LongActionButton } from "../components/LongActionButton.tsx";
import { useNotificationService } from "../hooks/useNotificationService.tsx";

export const Snapshots: React.FC = () => {
  const { chainId } = useParams<{ chainId: string }>();
  const { isLoading, snapshots, setSnapshots } = useSnapshots(chainId);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { showModal } = useModalsContext();
  const notificationService = useNotificationService();

  const onCreateBtnClick = () => {
    if (!chainId) return;
    void createSnapshot(chainId);
  };

  const onDeleteBtnClick = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: "Delete Snapshots",
      content: `Are you sure you want to delete ${selectedRowKeys.length} snapshot(s) and related deployments?`,
      onOk: async () => deleteSelectedSnapshots(),
    });
  };

  const deleteSnapshotWithConfirmation = (snapshot: Snapshot) => {
    Modal.confirm({
      title: "Delete Snapshot",
      content: `Are you sure you want to delete snapshot and related deployments?`,
      onOk: async () => deleteSnapshot(snapshot),
    });
  };

  const deleteSnapshot = async (snapshot: Snapshot) => {
    try {
      await api.deleteSnapshot(snapshot.id);
      setSnapshots(snapshots?.filter((s) => s.id !== snapshot.id) ?? []);
    } catch (error) {
      notificationService.requestFailed("Failed to delete snapshot", error);
    }
  };

  const deleteSelectedSnapshots = async () => {
    try {
      const ids = selectedRowKeys.map((key) => key.toString());
      await api.deleteSnapshots(ids);
      setSnapshots(
        snapshots?.filter(
          (snapshot) => !ids.some((id) => snapshot.id === id),
        ) ?? [],
      );
    } catch (error) {
      notificationService.requestFailed("Failed to delete snapshots", error);
    }
  };

  const createSnapshot = async (chainId: string) => {
    try {
      const snapshot = await api.createSnapshot(chainId);
      setSnapshots([...(snapshots ?? []), snapshot]);
    } catch (error) {
      notificationService.requestFailed("Failed to create snapshot", error);
    }
  };

  const updateSnapshot = async (
    snapshotId: string,
    name: string,
    labels: EntityLabel[],
  ) => {
    try {
      const snapshot = await api.updateSnapshot(snapshotId, name, labels);
      setSnapshots(snapshots?.map((s) => (s.id === snapshotId ? snapshot : s)));
    } catch (error) {
      notificationService.requestFailed("Failed to update snapshot", error);
    }
  };

  const onCompareBtnClick = () => {
    if (selectedRowKeys.length !== 2) return;
    const [oneId, otherId] = selectedRowKeys.map((key) => key.toString());
    showModal({
      component: <SnapshotsCompare oneId={oneId} otherId={otherId} />,
    });
  };

  const revertToSnapshotWithConfirmation = (snapshot: Snapshot) => {
    Modal.confirm({
      title: "Revert to Snapshot",
      content: (
        <>
          Are you sure you want to revert to this snapshot?
          <br />
          All unsaved changes in the chain will be permanently lost!
        </>
      ),
      onOk: async () => revertToSnapshot(snapshot.id),
    });
  };

  const revertToSnapshot = async (id: string) => {
    if (!chainId) return;
    try {
      await api.revertToSnapshot(chainId, id);
    } catch (error) {
      notificationService.requestFailed("Failed to revert to snapshot", error);
    }
  };

  const showSnapshotDiagram = (snapshot: Snapshot) => {
    showModal({
      component: <SnapshotSequenceDiagram snapshotId={snapshot.id} />,
    });
  };

  const showSnapshotXml = (snapshot: Snapshot) => {
    showModal({
      component: <SnapshotXmlView snapshotId={snapshot.id} />,
    });
  };

  const columns: TableProps<Snapshot>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
      onFilter: getTextColumnFilterFn((snapshot) => snapshot.name),
      render: (_, snapshot) => (
        <InlineEdit<{ name: string }>
          values={{ name: snapshot.name }}
          editor={<TextValueEdit name={"name"} />}
          viewer={snapshot.name}
          onSubmit={async ({ name }) => {
            await updateSnapshot(snapshot.id, name, snapshot.labels);
          }}
        />
      ),
    },
    {
      title: "Labels",
      dataIndex: "labels",
      key: "labels",
      filterDropdown: (props) => (
        <TextColumnFilterDropdown {...props} enableExact />
      ),
      onFilter: getTextListColumnFilterFn((snapshot) =>
        snapshot.labels.map((l) => l.name),
      ),
      render: (_, snapshot) => (
        <InlineEdit<{ labels: string[] }>
          values={{
            labels: snapshot.labels
              ?.filter((l) => !l.technical)
              .map((l) => l.name),
          }}
          editor={<LabelsEdit name={"labels"} />}
          viewer={<EntityLabels labels={snapshot.labels} />}
          onSubmit={async ({ labels }) => {
            await updateSnapshot(
              snapshot.id,
              snapshot.name,
              labels.map((name) => ({ name, technical: false })),
            );
          }}
        />
      ),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (_, snapshot) => <>{snapshot.createdBy.username}</>,
      sorter: (a, b) =>
        a.createdBy.username.localeCompare(b.createdBy.username),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
      onFilter: getTextColumnFilterFn(
        (snapshot) => snapshot.createdBy.username,
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdWhen",
      key: "createdWhen",
      render: (_, snapshot) => <>{formatTimestamp(snapshot.createdWhen)}</>,
      sorter: (a, b) => a.createdWhen - b.createdWhen,
      filterDropdown: (props) => <TimestampColumnFilterDropdown {...props} />,
      onFilter: getTimestampColumnFilterFn((snapshot) => snapshot.createdWhen),
    },
    {
      title: "Modified By",
      dataIndex: "modifiedBy",
      key: "modifiedBy",
      render: (_, snapshot) => <>{snapshot.modifiedBy.username}</>,
      sorter: (a, b) =>
        a.modifiedBy.username.localeCompare(b.modifiedBy.username),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
      onFilter: getTextColumnFilterFn(
        (snapshot) => snapshot.modifiedBy.username,
      ),
    },
    {
      title: "Modified At",
      dataIndex: "modifiedWhen",
      key: "modifiedWhen",
      render: (_, snapshot) => <>{formatTimestamp(snapshot.modifiedWhen)}</>,
      sorter: (a, b) => a.modifiedWhen - b.modifiedWhen,
      filterDropdown: (props) => <TimestampColumnFilterDropdown {...props} />,
      onFilter: getTimestampColumnFilterFn((snapshot) => snapshot.modifiedWhen),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      className: "actions-column",
      render: (_, snapshot) => (
        <>
          <Tooltip title="Delete snapshot" placement="topRight">
            <LongActionButton
              size="small"
              icon={<DeleteOutlined />}
              type="text"
              onSubmit={() => deleteSnapshotWithConfirmation(snapshot)}
            />
          </Tooltip>
          <Tooltip title="Revert to snapshot" placement="topRight">
            <LongActionButton
              size="small"
              icon={<RollbackOutlined />}
              type="text"
              onSubmit={() => revertToSnapshotWithConfirmation(snapshot)}
            />
          </Tooltip>
          <Tooltip title="Show snapshot XML" placement="topRight">
            <Button
              size="small"
              type="text"
              icon={<FileTextOutlined />}
              onClick={() => showSnapshotXml(snapshot)}
            />
          </Tooltip>
          <Tooltip title="Show snapshot diagram" placement="topRight">
            <Button
              size="small"
              type="text"
              icon={<>⭾</>}
              onClick={() => showSnapshotDiagram(snapshot)}
            />
          </Tooltip>
        </>
      ),
    },
  ];

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<Snapshot> = {
    type: "checkbox",
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <>
      <Table
        size="small"
        columns={columns}
        rowSelection={rowSelection}
        dataSource={snapshots}
        pagination={false}
        loading={isLoading}
        rowKey="id"
        className="flex-table"
        style={{ height: "100%" }}
        scroll={{ y: "" }}
      />
      <FloatButtonGroup trigger="hover" icon={<MoreOutlined />}>
        <FloatButton
          tooltip={{ title: "Compare selected snapshots", placement: "left" }}
          icon={<>⇄</>}
          onClick={onCompareBtnClick}
        />
        <FloatButton
          tooltip={{ title: "Delete selected snapshots", placement: "left" }}
          icon={<DeleteOutlined />}
          onClick={onDeleteBtnClick}
        />
        <FloatButton
          tooltip={{ title: "Create snapshot", placement: "left" }}
          icon={<PlusOutlined />}
          onClick={onCreateBtnClick}
        />
      </FloatButtonGroup>
    </>
  );
};
