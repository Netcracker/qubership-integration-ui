import React, { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/api";
import { IntegrationSystemType } from "../../../api/apiTypes";
import { useNotificationService } from "../../../hooks/useNotificationService";
import {
  useServicesTreeTable,
  allServicesTreeTableColumns,
  getActionsColumn,
  getServiceActions,
  ServiceEntity,
  ServicesTableColumn,
} from "./../ServicesTreeTable";
import type { ContextSystem } from "../../../api/apiTypes";
import { downloadFile } from "../../../misc/download-utils";
import { prepareFile } from "./../utils.tsx";
import { getErrorMessage } from "../../../misc/error-utils";
import { OverridableIcon } from "../../../icons/IconProvider.tsx";
import { GenericServiceListPage } from "./../GenericServiceListPage.tsx";
import { useAsyncRequest } from "../useAsyncRequest.ts";
import { useContextServiceFilters } from "../../../hooks/useContextServiceFilter.ts";

const STORAGE_KEY = "servicesListTable";

const visibleColumns: string[] = [
  "name",
  "protocol",
  "status",
  "source",
  "labels",
  "usedBy",
];

export const ContextServiceList: React.FC = () => {
  const [services, setServices] = useState<ContextSystem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchString, setSearchString] = useState("");
  const notificationService = useNotificationService();
  const navigate = useNavigate();
  const { filters, filterButton } = useContextServiceFilters();

  const { loading, execute: loadServices } = useAsyncRequest(
    async () => {
      const hasSearch = searchString.trim().length > 0;
      const hasFilters = filters.length > 0;

      let servicesArray: ContextSystem[];
      if (hasSearch && hasFilters) {
        const [searched, filtered] = await Promise.all([
          api.searchContextServices(searchString.trim()),
          api.filterContextServices(filters),
        ]);
        const filteredIds = new Set(filtered.map((s) => s.id));
        servicesArray = searched.filter((s) => filteredIds.has(s.id));
      } else if (hasFilters) {
        servicesArray = await api.filterContextServices(filters);
      } else if (hasSearch) {
        servicesArray = await api.searchContextServices(searchString.trim());
      } else {
        const all = await api.getContextServices();
        servicesArray = Array.isArray(all) ? all : [];
      }

      setServices(servicesArray);
    },
    { initialValue: undefined },
  );

  useEffect(() => {
    void loadServices();
  }, [filters, searchString]);

  const handleEdit = (record: ServiceEntity) => {
    void navigate(`/services/context/${record.id}/parameters`);
  };

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await api.deleteContextService(id);
        message.success("Service deleted");
        setServices((services) => services.filter((s) => s.id !== id));
      } catch (e: unknown) {
        notificationService.requestFailed("Failed to delete service", e);
      }
    },
    [notificationService],
  );

  const actionsColumn: ServicesTableColumn = getActionsColumn(
    getServiceActions({
      onEdit: handleEdit,
      onDelete: (entity) => void handleDelete(entity.id),
      onExpandAll: () => {},
      onCollapseAll: () => {},
      isRootEntity: () => true,
      isExpandAvailable: () => false,
      onExportSelected: (selected) => {
        void handleExportSelected(selected);
      },
      onAddSpecificationGroup: () => {},
    }),
  );

  const servicesTable = useServicesTreeTable<ServiceEntity>({
    dataSource: services,
    rowKey: "id",
    columns: allServicesTreeTableColumns.map((col) => col.key),
    className: "flex-table",
    style: { flex: 1, minHeight: 0 },
    allColumns: [
      ...allServicesTreeTableColumns.map((col) => col.key),
      actionsColumn.key,
    ],
    defaultVisibleKeys: visibleColumns,
    storageKey: STORAGE_KEY,
    loading,
    actionsColumn,
    enableSelection: true,
    onExportSelected: (selected) => {
      void handleExportSelected(selected);
    },
    selectedRowKeys,
    onSelectedRowKeysChange: (keys) => {
      setSelectedRowKeys(keys);
    },
    onRowClick: (record, event) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest(".ant-dropdown") ||
        target.closest("input") ||
        target.closest("a") ||
        target.closest(".inline-edit-labels")
      ) {
        return;
      }
      void navigate(`/services/context/${record.id}/parameters`);
    },
  });

  const handleExportSelected = async (selected: ServiceEntity[]) => {
    if (!selected.length) {
      message.info("No services selected");
      return;
    }
    try {
      const systemIds = selected.map((s) => s.id);
      const file = await api.exportContextServices(systemIds);
      downloadFile(prepareFile(file));
    } catch (e: unknown) {
      notificationService.requestFailed("Failed to export services", e);
    }
  };

  const handleCreate = useCallback(
    async (name: string, description: string) => {
      try {
        const service = await api.createContextService({ name, description });
        message.success("Service created");
        void navigate(`/services/context/${service.id}/parameters`);
      } catch (e: unknown) {
        notificationService.requestFailed(
          getErrorMessage(e, "Service creation error"),
          e,
        );
        throw e;
      }
    },
    [navigate, notificationService],
  );

  return (
    <GenericServiceListPage
      title={`Context services`}
      icon={<OverridableIcon name={"database"} />}
      extraActions={[filterButton, servicesTable.FilterButton()]}
      serviceType={IntegrationSystemType.CONTEXT}
      onCreate={(name, description) => handleCreate(name, description)}
      onSearch={(value) => setSearchString(value)}
      onExport={() => {
        void (async () => {
          if (selectedRowKeys.length === 0) {
            message.info("No services selected");
            return;
          }
          const selected: ServiceEntity[] = services.filter(
            (s: ServiceEntity) => selectedRowKeys.includes(s.id),
          );
          await handleExportSelected(selected);
        })();
      }}
      onImport={() => void loadServices()}
    >
      {servicesTable.tableElement}
    </GenericServiceListPage>
  );
};
