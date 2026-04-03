import React, { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/api";
import { IntegrationSystemType } from "../../../api/apiTypes";
import { useNotificationService } from "../../../hooks/useNotificationService";
import { useServiceFilters } from "../../../hooks/useServiceFilter";
import {
  useServicesTreeTable,
  allServicesTreeTableColumns,
  getActionsColumn,
  getServiceActions,
  ServiceEntity,
  ServicesTableColumn,
  isIntegrationSystem,
} from "./../ServicesTreeTable";
import type { ContextSystem } from "../../../api/apiTypes";
import { downloadFile } from "../../../misc/download-utils";
import { invalidateServiceCache, prepareFile } from "./../utils.tsx";
import { ImportSpecificationsModal } from "./../modals/ImportSpecificationsModal";
import { useModalsContext } from "../../../Modals";
import { getErrorMessage } from "../../../misc/error-utils";
import { OverridableIcon } from "../../../icons/IconProvider.tsx";
import { GenericServiceListPage } from "./../GenericServiceListPage.tsx";
import { EntityFilterModel } from "../../table/filter/filter.ts";

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
  const [loading, setLoading] = useState<boolean>(false);
  const [services, setServices] = useState<ContextSystem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchString, setSearchString] = useState("");
  const notificationService = useNotificationService();
  const navigate = useNavigate();
  const { showModal } = useModalsContext();
  const { filters, filterButton } = useServiceFilters();

  const loadServices = useCallback(
    async (_searchString: string, _filters: EntityFilterModel[]) => {
      try {
        setLoading(true);
        const contextServices = await api.getContextServices();
        if (!Array.isArray(contextServices)) {
          setServices([]);
        } else {
          setServices(contextServices);
        }
      } catch (e) {
        notificationService.requestFailed("Failed to get context services", e);
        setServices([]);
      } finally {
        setLoading(false);
      }
    },
    [notificationService],
  );

  useEffect(() => {
    void loadServices(searchString, filters);
  }, [filters, loadServices, searchString]);

  const handleEdit = (record: ServiceEntity) => {
    void navigate(`/services/context/${record.id}/parameters`);
  };

  const handleAddSpecificationGroup = useCallback(
    (record: ServiceEntity) => {
      if (!isIntegrationSystem(record)) return;
      showModal({
        component: (
          <ImportSpecificationsModal
            systemId={record.id}
            groupMode={true}
            isImplementedService={
              record.type === IntegrationSystemType.IMPLEMENTED
            }
            onSuccess={() => {
              void loadServices(searchString, filters);
              invalidateServiceCache(record.id);
            }}
          />
        ),
      });
    },
    [showModal, loadServices, searchString, filters],
  );

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
      onAddSpecificationGroup: handleAddSpecificationGroup,
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
    expandable: undefined,
    actionsColumn,
    enableSelection: true,
    isRootEntity: () => true,
    onExportSelected: (selected) => {
      void handleExportSelected(selected);
    },
    selectedRowKeys,
    onSelectedRowKeysChange: (keys) => {
      setSelectedRowKeys(keys);
    },
    onRowClick: (record) => {
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
      onImport={() => void loadServices(searchString, filters)}
    >
      {servicesTable.tableElement}
    </GenericServiceListPage>
  );
};
