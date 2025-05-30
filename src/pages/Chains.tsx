import {
  Breadcrumb,
  Button,
  Dropdown,
  Flex,
  FloatButton,
  MenuProps,
  message,
  Modal,
  Table,
} from "antd";
import { useNavigate, useSearchParams } from "react-router";
import {
  CarryOutOutlined,
  DeleteOutlined,
  ExportOutlined,
  FileAddOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderOutlined,
  HomeOutlined,
  ImportOutlined,
  MoreOutlined,
  SendOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useModalsContext } from "../Modals.tsx";
import {
  ChainCreationRequest,
  FolderItem,
  FolderItemType,
  FolderUpdateRequest,
} from "../api/apiTypes.ts";
import React, { useEffect, useState } from "react";
import { api } from "../api/api.ts";
import { TableProps } from "antd/lib/table";
import { TextColumnFilterDropdown } from "../components/table/TextColumnFilterDropdown.tsx";
import { formatTimestamp } from "../misc/format-utils.ts";
import { TimestampColumnFilterDropdown } from "../components/table/TimestampColumnFilterDropdown.tsx";
import { EntityLabels } from "../components/labels/EntityLabels.tsx";
import { TableRowSelection } from "antd/lib/table/interface";
import Search from "antd/lib/input/Search";
import FloatButtonGroup from "antd/lib/float-button/FloatButtonGroup";
import { BreadcrumbProps } from "antd/es/breadcrumb/Breadcrumb";
import { DeploymentsCumulativeState } from "../components/deployment_runtime_states/DeploymentsCumulativeState.tsx";
import { FolderEdit, FolderEditMode } from "../components/modal/FolderEdit.tsx";
import { ChainCreate } from "../components/modal/ChainCreate.tsx";
import { copyToClipboard } from "../misc/clipboard-util.ts";
import { traverseElementsDepthFirst } from "../misc/tree-utils.ts";
import {
  ExportChainOptions,
  ExportChains,
} from "../components/modal/ExportChains.tsx";
import { downloadFile, mergeZipArchives } from "../misc/download-utils.ts";
import { ImportChains } from "../components/modal/ImportChains.tsx";
import { useNotificationService } from "../hooks/useNotificationService.tsx";

type ChainTableItem = FolderItem & {
  children?: ChainTableItem[];
};

function buildTableItems(folderItems: FolderItem[]): ChainTableItem[] {
  const itemMap = new Map<string, ChainTableItem>(
    folderItems.map((item) => [
      item.id,
      item.itemType === FolderItemType.FOLDER
        ? {
            ...item,
            children: [],
          }
        : { ...item },
    ]),
  );
  const items: ChainTableItem[] = [];
  Array.from(itemMap.values()).forEach((item) => {
    if (item.parentId && itemMap.has(item.parentId)) {
      const parentItem = itemMap.get(item.parentId);
      // @ts-ignore
      parentItem.children = parentItem?.children
        ? [...parentItem.children, item]
        : [item];
    } else {
      items.push(item);
    }
  });

  Array.from(itemMap.values()).forEach((item) =>
    item.children?.sort(compareChainTableItemsByTypeAndName),
  );
  items.sort(compareChainTableItemsByTypeAndName);

  return items;
}

function compareChainTableItemsByTypeAndName(
  a: ChainTableItem,
  b: ChainTableItem,
): number {
  if (a.itemType !== b.itemType) {
    const values = Object.values(FolderItemType);
    return values.indexOf(a.itemType) - values.indexOf(b.itemType);
  } else {
    return a.name.localeCompare(b.name);
  }
}

export function buildPathItems(
  path: Map<string, string>,
): BreadcrumbProps["items"] {
  const entries = Object.entries(path).reverse();
  const items = entries.map(([key, value], index) => ({
    title: value,
    href: index < entries.length - 1 ? `/chains?folder=${key}` : undefined,
  }));
  return [
    {
      href: "/chains",
      title: <HomeOutlined />,
    },
    ...items,
  ];
}

type OperationType = "move" | "copy";

type Operation = {
  item: ChainTableItem;
  operation: OperationType;
};

const Chains = () => {
  const navigate = useNavigate();
  const { showModal } = useModalsContext();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folderItems, setFolderItems] = useState<FolderItem[]>([]);
  const [tableItems, setTableItems] = useState<ChainTableItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loadedFolders, setLoadedFolders] = useState<Set<string>>(new Set());
  const [searchParams] = useSearchParams();
  const [pathItems, setPathItems] = useState<BreadcrumbProps["items"]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    "status",
    "labels",
    "createdBy",
    "createdWhen",
    "modifiedBy",
    "modifiedWhen",
  ]);
  const [operation, setOperation] = useState<Operation | undefined>(undefined);
  const notificationService = useNotificationService();

  useEffect(() => {
    updateFolderItems();
  }, [searchParams]);

  useEffect(() => {
    setTableItems(buildTableItems(folderItems));
  }, [folderItems]);

  const updateFolderItems = async () => {
    const folderId = getFolderId();
    const itemsPromise = folderId
      ? getFolder(folderId).then((response) => {
        setPathItems(buildPathItems(response?.navigationPath ?? new Map()));
        return response?.items || [];
      })
      : getRootFolderItems().then((items) => {
        setPathItems([]);
        return items;
      });
    return itemsPromise.then((items) => {
      setIsLoading(true);
      setFolderItems(items);
      setIsLoading(false);
    });
  }

  const getFolderId = (): string | undefined => {
    return searchParams.get("folder") ?? undefined;
  };

  const getRootFolderItems = async (): Promise<FolderItem[]> => {
    setIsLoading(true);
    try {
      return await api.getRootFolder();
    } catch (error) {
      notificationService.requestFailed("Failed to get root folder content", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getFolder = async (folderId: string) => {
    setIsLoading(true);
    try {
      return api.getFolder(folderId);
    } catch (error) {
      notificationService.requestFailed("Failed to get folder content", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openFolder = async (folderId: string) => {
    return getFolder(folderId).then((response) => {
      if (!response) {
        return;
      }
      setFolderItems([
        ...response.items,
        ...folderItems.filter(
          (item) => !response.items.some((i) => i.id === item.id),
        ),
      ]);
      const s = new Set(loadedFolders);
      s.add(folderId);
      setLoadedFolders(s);
    });
  };

  const createFolder = async (
    request: FolderUpdateRequest,
    openFolder: boolean,
    newTab: boolean,
  ) => {
    setIsLoading(true);
    try {
      const response = await api.createFolder(request);
      setFolderItems([
        ...folderItems,
        // @ts-ignore
        { ...(response as FolderItem), itemType: FolderItemType.FOLDER },
      ]);
      if (openFolder) {
        const path = `/chains?folder=${response.id}`;
        if (newTab) {
          window.open(path, "_blank", "noreferrer");
        } else {
          navigate(path);
        }
      }
    } catch (error) {
      notificationService.requestFailed("Failed to create folder", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFolder = async (
    folderId: string,
    changes: FolderUpdateRequest,
  ) => {
    setIsLoading(true);
    try {
      const response = await api.updateFolder(folderId, changes);
      setFolderItems(
        folderItems.map((item) =>
          item.id === folderId ? { ...item, ...response } : item,
        ),
      );
    } catch (error) {
      notificationService.requestFailed("Failed to update folder", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFolder = async (folderId: string) => {
    setIsLoading(true);
    try {
      await api.deleteFolder(folderId);
      const ids = new Set<string>([folderId]);
      traverseElementsDepthFirst(tableItems, (element, path) => {
        if (path.some((i) => i.id === folderId)) {
          ids.add(element.id);
        }
      });
      setFolderItems(folderItems.filter((i) => !ids.has(i.id)));
    } catch (error) {
      notificationService.requestFailed("Failed to delete folder", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createChain = async (
    request: ChainCreationRequest,
    openChain: boolean,
    newTab: boolean,
  ) => {
    setIsLoading(true);
    try {
      const chain = await api.createChain(request);
      setFolderItems([
        ...folderItems,
        // @ts-ignore
        { itemType: FolderItemType.CHAIN, ...chain } as FolderItem,
      ]);
      if (openChain) {
        const path = `/chains/${chain.id}`;
        if (newTab) {
          window.open(path, "_blank", "noreferrer");
        } else {
          navigate(path);
        }
      }
    } catch (error) {
      notificationService.requestFailed("Failed to create chain", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChain = async (chainId: string) => {
    setIsLoading(true);
    try {
      await api.deleteChain(chainId);
      setFolderItems(folderItems.filter((item) => item.id !== chainId));
    } catch (error) {
      notificationService.requestFailed("Failed to delete chain", error);
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateChain = async (chainId: string) => {
    setIsLoading(true);
    try {
      const chain = await api.duplicateChain(chainId);
      setFolderItems([
        ...folderItems,
        // @ts-ignore
        { itemType: FolderItemType.CHAIN, ...chain } as FolderItem,
      ]);
    } catch (error) {
      notificationService.requestFailed("Failed to delete chain", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyChain = async (chainId: string, destinationFolderId?: string) => {
    setIsLoading(true);
    try {
      const chain = await api.copyChain(chainId, destinationFolderId);
      setFolderItems([
        ...folderItems,
        // @ts-ignore
        { itemType: FolderItemType.CHAIN, ...chain } as FolderItem,
      ]);
    } catch (error) {
      notificationService.requestFailed("Failed to copy chain", error);
    } finally {
      setIsLoading(false);
    }
  };

  const moveChain = async (chainId: string, destinationFolderId?: string) => {
    setIsLoading(true);
    try {
      const chain = await api.moveChain(chainId, destinationFolderId);
      setFolderItems(
        folderItems.map((i) =>
          i.id === chainId
            ? // @ts-ignore
              ({ itemType: FolderItemType.CHAIN, ...chain } as FolderItem)
            : i,
        ),
      );
    } catch (error) {
      notificationService.requestFailed("Failed to move chain", error);
    } finally {
      setIsLoading(false);
    }
  };

  const moveFolder = async (folderId: string, destinationFolderId?: string) => {
    setIsLoading(true);
    try {
      const response = await api.moveFolder(folderId, destinationFolderId);
      setFolderItems(
        folderItems.map((item) =>
          item.id === folderId ? { ...item, ...response } : item,
        ),
      );
    } catch (error) {
      notificationService.requestFailed("Failed to move folder", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pasteItem = async (destinationFolderId?: string) => {
    if (!operation) {
      return;
    }
    switch (operation.operation) {
      case "copy":
        return operation.item.itemType === FolderItemType.CHAIN
          ? copyChain(operation.item.id, destinationFolderId).then(() =>
              setOperation(undefined),
            )
          : null;
      case "move":
        return operation.item.itemType === FolderItemType.CHAIN
          ? moveChain(operation.item.id, destinationFolderId).then(() =>
              setOperation(undefined),
            )
          : moveFolder(operation.item.id, destinationFolderId).then(() =>
              setOperation(undefined),
            );
    }
  };

  const exportChains = async (
    folderIds: string[],
    chainIds: string[],
    options: ExportChainOptions,
  ) => {
    try {
      const ids = new Set(chainIds);
      const chainsInFolders = await Promise.all(
        folderIds.map((folderId) => api.getNestedChains(folderId)),
      );
      chainsInFolders
        .flatMap((chains) => chains)
        .forEach((chain) => ids.add(chain.id));
      if (ids.size === 0) {
        return;
      }
      const chainsFile =
        ids.size === 0
          ? await api.exportAllChains()
          : await api.exportChains(
              Array.from(ids.values()),
              options.exportSubchains,
            );
      const data = [chainsFile];

      if (options.exportServices) {
        const usedServices = await api.getServicesUsedByChains(Array.from(ids.values()));
        if (usedServices.length > 0) {
          const serviceIds = usedServices.map(i => i.systemId);
          const modelIds = usedServices.flatMap(i => i.usedSystemModelIds ?? []);
          const servicesData = await api.exportServices(serviceIds, modelIds);
          data.push(servicesData);
        }
      }

      if (options.exportVariables) {
        // TODO
      }

      const archiveData = await mergeZipArchives(data);
      const file = new File([archiveData], chainsFile.name, {
        type: "application/zip",
      });
      downloadFile(file);
    } catch (error) {
      notificationService.requestFailed("Failed to export chains", error);
    }
  };

  const showEditFolderModal = (
    mode: FolderEditMode,
    name?: string,
    description?: string,
    parentOrItemId?: string,
  ) => {
    showModal({
      component: (
        <FolderEdit
          mode={mode}
          name={name}
          description={description}
          onSubmit={(name, description, openFolder, newTab) => {
            return mode === "create"
              ? createFolder(
                  { name, description, parentId: parentOrItemId },
                  openFolder,
                  newTab,
                )
              : updateFolder(parentOrItemId ?? "", { name, description });
          }}
        />
      ),
    });
  };

  const onCreateFolderBtnClick = async (parentId?: string) => {
    showEditFolderModal("create", undefined, undefined, parentId);
  };

  const onCreateChainBtnClick = async (parentId?: string) => {
    showModal({
      component: (
        <ChainCreate
          onSubmit={(request, openChain, newTab) => {
            return createChain({ ...request, parentId }, openChain, newTab);
          }}
        />
      ),
    });
  };

  const onExportBtnClick = async () => {
    return exportChainsWithOptions(selectedRowKeys.map((k) => k.toString()));
  };

  const onImportBtnClick = async () => {
    showModal({
      component: <ImportChains onSuccess={updateFolderItems}/>
    })
  }

  const exportChainsWithOptions = async (ids: string[]) => {
    const multiple =
      ids.length !== 1 ||
      folderItems.find((i) => i.id === ids[0])?.itemType ===
        FolderItemType.FOLDER;
    showModal({
      component: (
        <ExportChains
          multiple={multiple}
          onSubmit={(options) => {
            const items = folderItems.filter((i) => ids.includes(i.id));
            const folderIds = items
              .filter((i) => i.itemType === FolderItemType.FOLDER)
              .map((i) => i.id);
            const chainIds = items
              .filter((i) => i.itemType === FolderItemType.CHAIN)
              .map((i) => i.id);
            return exportChains(folderIds, chainIds, options);
          }}
        />
      ),
    });
  };

  const onContextMenuItemClick = async (item: FolderItem, key: React.Key) => {
    switch (key) {
      case "createNewFolder":
        return showEditFolderModal("create", undefined, undefined, item.id);
      case "createNewChain":
        return onCreateChainBtnClick(item.id);
      case "editFolder":
        return showEditFolderModal(
          "update",
          item.name,
          item.description,
          item.id,
        );
      case "editChain":
        return navigate(`/chains/${item.id}`);
      case "copyFolderLink":
        return copyToClipboard(
          `${window.location.origin}/chains?folder=${item.id}`,
        ).then(() => {
          messageApi.info("Link to a folder was copied to the clipboard");
        });
      case "copyChainLink":
        return copyToClipboard(
          `${window.location.origin}/chains/${item.id}`,
        ).then(() => {
          messageApi.info("Link to a chain was copied to the clipboard");
        });
      case "deleteFolder":
        return Modal.confirm({
          title: "Delete Folder",
          content: `Are you sure you want to delete "${item.name}" folder?`,
          onOk: async () => deleteFolder(item.id),
        });
      case "deleteChain":
        return Modal.confirm({
          title: "Delete Chain",
          content: `Are you sure you want to delete "${item.name}" chain?`,
          onOk: async () => deleteChain(item.id),
        });
      case "duplicateChain":
        return duplicateChain(item.id);
      case "cut":
        return setOperation({ item, operation: "move" });
      case "copy":
        return setOperation({ item, operation: "copy" });
      case "paste":
        return pasteItem(item.id);
      case "export":
        return exportChainsWithOptions([item.id]);
      default:
        return Modal.error({ title: "Not implemented yet" });
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const folderMenuItems: MenuProps["items"] = [
    { label: "Create New Folder", key: "createNewFolder" },
    { label: "Create New Chain", key: "createNewChain" },
    { type: "divider" },
    { label: "Expand All", key: "expandAll" },
    { label: "Collapse All", key: "collapseAll" },
    { type: "divider" },
    { label: "Copy Link", key: "copyFolderLink" },
    { label: "Edit", key: "editFolder" },
    { label: "Export", key: "export" },
    { type: "divider" },
    { label: "Cut", key: "cut" },
    { label: "Paste", key: "paste", disabled: operation === undefined },
    { label: "Delete", key: "deleteFolder" },
  ];

  const chainMenuItems: MenuProps["items"] = [
    { label: "Copy Link", key: "copyChainLink" },
    { label: "Edit", key: "editChain" },
    { label: "Export", key: "export" },
    { label: "Generate DDS", key: "generateDDS" },
    { type: "divider" },
    { label: "Cut", key: "cut" },
    { label: "Copy", key: "copy" },
    { label: "Duplicate", key: "duplicateChain" },
    { label: "Delete", key: "deleteChain" },
  ];

  const columnVisibilityMenuItems: MenuProps["items"] = [
    { label: "ID", key: "id" },
    { label: "Description", key: "description" },
    { label: "Business Description", key: "businessDescription" },
    { label: "Assumptions", key: "assumptions" },
    { label: "Out of Scope", key: "outOfScope" },
    { label: "Status", key: "status" },
    { label: "Labels", key: "labels" },
    { label: "Created At", key: "createdWhen" },
    { label: "Created By", key: "createdBy" },
    { label: "Modified At", key: "modifiedWhen" },
    { label: "Modified By", key: "modifiedBy" },
  ];

  const columns: TableProps<ChainTableItem>["columns"] = [
    {
      title: "Name",
      key: "name",
      dataIndex: "name",
      sorter: compareChainTableItemsByTypeAndName,
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
      render: (_, item) => (
        <Flex vertical={false} gap={4}>
          {item.itemType === FolderItemType.FOLDER ? (
            <FolderOutlined />
          ) : (
            <FileOutlined />
          )}
          <a
            onClick={(event) => {
              event.stopPropagation();
              navigate(
                item.itemType === FolderItemType.FOLDER
                  ? `/chains?folder=${item.id}`
                  : `/chains/${item.id}`,
              );
            }}
          >
            {item.name}
          </a>
        </Flex>
      ),
    },
    {
      title: "ID",
      key: "id",
      dataIndex: "id",
      hidden: !selectedKeys.includes("id"),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
    },
    {
      title: "Description",
      key: "description",
      dataIndex: "description",
      hidden: !selectedKeys.includes("description"),
      sorter: (a, b) => a.description.localeCompare(b.description),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
    },
    {
      title: "Business Description",
      key: "businessDescription",
      dataIndex: "businessDescription",
      hidden: !selectedKeys.includes("businessDescription"),
      sorter: (a, b) =>
        a.businessDescription.localeCompare(b.businessDescription),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
    },
    {
      title: "Assumptions",
      key: "assumptions",
      dataIndex: "assumptions",
      hidden: !selectedKeys.includes("assumptions"),
      sorter: (a, b) => a.assumptions.localeCompare(b.assumptions),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
    },
    {
      title: "Out of Scope",
      key: "outOfScope",
      dataIndex: "outOfScope",
      hidden: !selectedKeys.includes("outOfScope"),
      sorter: (a, b) => a.outOfScope.localeCompare(b.outOfScope),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
    },
    {
      title: "Status",
      key: "status",
      hidden: !selectedKeys.includes("status"),
      render: (_, item) => (
        <>
          {item.itemType === FolderItemType.FOLDER ? null : (
            <DeploymentsCumulativeState chainId={item.id} />
          )}
        </>
      ),
    },
    {
      title: "Labels",
      key: "labels",
      dataIndex: "labels",
      hidden: !selectedKeys.includes("labels"),
      filterDropdown: (props) => (
        <TextColumnFilterDropdown {...props} enableExact />
      ),
      render: (_, item) => <EntityLabels labels={item.labels} />,
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      hidden: !selectedKeys.includes("createdBy"),
      render: (_, item) => <>{item.createdBy.username}</>,
      sorter: (a, b) =>
        a.createdBy.username.localeCompare(b.createdBy.username),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
      // onFilter: getTextColumnFilterFn(
      //   (item) => item.createdBy.username,
      // ),
    },
    {
      title: "Created At",
      dataIndex: "createdWhen",
      key: "createdWhen",
      hidden: !selectedKeys.includes("createdWhen"),
      render: (_, item) => <>{formatTimestamp(item.createdWhen)}</>,
      sorter: (a, b) => a.createdWhen - b.createdWhen,
      filterDropdown: (props) => <TimestampColumnFilterDropdown {...props} />,
      // onFilter: getTimestampColumnFilterFn((item) => item.createdWhen),
    },
    {
      title: "Modified By",
      dataIndex: "modifiedBy",
      key: "modifiedBy",
      hidden: !selectedKeys.includes("modifiedBy"),
      render: (_, item) => <>{item.modifiedBy.username}</>,
      sorter: (a, b) =>
        a.modifiedBy.username.localeCompare(b.modifiedBy.username),
      filterDropdown: (props) => <TextColumnFilterDropdown {...props} />,
      // onFilter: getTextColumnFilterFn(
      //   (item) => item.modifiedBy.username,
      // ),
    },
    {
      title: "Modified At",
      dataIndex: "modifiedWhen",
      key: "modifiedWhen",
      hidden: !selectedKeys.includes("modifiedWhen"),
      render: (_, item) => <>{formatTimestamp(item.modifiedWhen)}</>,
      sorter: (a, b) => a.modifiedWhen - b.modifiedWhen,
      filterDropdown: (props) => <TimestampColumnFilterDropdown {...props} />,
      // onFilter: getTimestampColumnFilterFn((item) => item.modifiedWhen),
    },
    {
      title: "Actions",
      key: "actions",
      width: 70,
      className: "actions-column",
      render: (_, item) => (
        <>
          <Dropdown
            menu={{
              items:
                item.itemType === FolderItemType.FOLDER
                  ? folderMenuItems
                  : chainMenuItems,
              onClick: ({ key }) => onContextMenuItemClick(item, key),
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button size="small" type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </>
      ),
    },
  ];

  const rowSelection: TableRowSelection<ChainTableItem> = {
    type: "checkbox",
    selectedRowKeys,
    checkStrictly: false,
    onChange: onSelectChange,
  };

  return (
    <>
      {contextHolder}
      <Flex vertical gap={16} style={{ height: "100%" }}>
        {pathItems && pathItems.length > 0 ? (
          <Breadcrumb items={pathItems} />
        ) : null}
        <Flex vertical={false} gap={8}>
          <Search
            placeholder="Full text search"
            allowClear
            // onSearch={(value) => setFilters({ ...filters, searchString: value })}
          />
          <Dropdown
            menu={{
              items: columnVisibilityMenuItems,
              selectable: true,
              multiple: true,
              selectedKeys,
              onSelect: ({ selectedKeys }) => setSelectedKeys(selectedKeys),
              onDeselect: ({ selectedKeys }) => setSelectedKeys(selectedKeys),
            }}
          >
            <Button icon={<SettingOutlined />} />
          </Dropdown>
        </Flex>
        <Table<ChainTableItem>
          className="flex-table"
          size="small"
          dataSource={tableItems}
          columns={columns}
          rowSelection={rowSelection}
          pagination={false}
          scroll={{ y: "" }}
          rowKey="id"
          rowClassName="clickable-row"
          loading={isLoading}
          expandable={{
            onExpand: async (expanded, item) => {
              if (expanded && !loadedFolders.has(item.id)) {
                return openFolder(item.id);
              }
            },
          }}
        />
        <FloatButtonGroup trigger="hover" icon={<MoreOutlined />}>
          <FloatButton
            tooltip="Deploy selected chains"
            icon={<SendOutlined />}
            // onClick={onDeployBtnClick}
          />
          <FloatButton
            tooltip="Paste"
            icon={<CarryOutOutlined />}
            onClick={() => pasteItem(getFolderId())}
          />
          <FloatButton
            tooltip="Compare selected chains"
            icon={<>⇄</>}
            // onClick={onCompareBtnClick}
          />
          <FloatButton
            tooltip="Import chains"
            icon={<ImportOutlined />}
            onClick={onImportBtnClick}
          />
          <FloatButton
            tooltip="Export selected chains"
            icon={<ExportOutlined />}
            onClick={onExportBtnClick}
          />
          <FloatButton
            tooltip="Delete selected chains and folders"
            icon={<DeleteOutlined />}
            // onClick={onDeleteBtnClick}
          />
          <FloatButton
            tooltip="Create folder"
            icon={<FolderAddOutlined />}
            onClick={() => onCreateFolderBtnClick(getFolderId())}
          />
          <FloatButton
            tooltip="Create chain"
            icon={<FileAddOutlined />}
            onClick={() => onCreateChainBtnClick(getFolderId())}
          />
        </FloatButtonGroup>
      </Flex>
    </>
  );
};

export default Chains;
