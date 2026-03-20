/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  ActionLog,
  EntityType,
  LogOperation,
} from "../../../src/api/apiTypes.ts";
import { useActionLog } from "../../../src/hooks/useActionLog.tsx";
import { exportActionsLogAsExcel } from "../../../src/misc/log-export-utils.ts";
import { useColumnSettingsBasedOnColumnsType } from "../../../src/components/table/useColumnSettingsButton.tsx";
import { ActionsLog } from "../../../src/components/admin_tools/ActionsLog.tsx";
import { TableProps } from "antd";

// src/components/admin_tools/ActionsLog.integration.test.tsx
// ====== MOCKS ======

// Mock useActionLog
jest.mock("../../../src/hooks/useActionLog.tsx", () => ({
  useActionLog: jest.fn(),
}));

// Mock useResizeHeight (returns [ref, height])
jest.mock("../../../src/hooks/useResizeHeigth.tsx", () => ({
  useResizeHeight: () => [jest.fn(), 500],
}));

// Mock useColumnSettingsBasedOnColumnsType
jest.mock(
  "../../../src/components/table/useColumnSettingsButton.tsx",
  () => ({
    useColumnSettingsBasedOnColumnsType: jest.fn(),
  }),
);

// Mock exportActionsLogAsExcel
jest.mock("../../../src/misc/log-export-utils.ts", () => ({
  exportActionsLogAsExcel: jest.fn(),
}));

// Mock DateRangePicker
jest.mock("../../../src/components/modal/DateRangePicker.tsx", () => {
  return jest.fn(({ trigger, onRangeApply }) => (
    <div>
      <span
        data-testid="date-range-picker-trigger"
        onClick={() =>
          onRangeApply(new Date("2023-01-01"), new Date("2023-01-02"))
        }
      >
        {trigger}
      </span>
    </div>
  ));
});

// Mock OverridableIcon
jest.mock("../../../src/icons/IconProvider.tsx", () => ({
  OverridableIcon: ({ name, className, style }) => (
    <span data-testid={`icon-${name}`} className={className} style={style}>
      {name}
    </span>
  ),
}));

// Mock Require (renders children always)
jest.mock("../../../src/permissions/Require.tsx", () => ({
  Require: ({ children }) => <>{children}</>,
}));

// Mock TextColumnFilterDropdown and TimestampColumnFilterDropdown
jest.mock(
  "../../../src/components/table/TextColumnFilterDropdown.tsx",
  () => ({
    TextColumnFilterDropdown: () => <div>TextColumnFilterDropdown</div>,
    getTextColumnFilterFn: () => jest.fn(),
  }),
);
jest.mock(
  "../../../src/components/table/TimestampColumnFilterDropdown.tsx",
  () => ({
    TimestampColumnFilterDropdown: () => (
      <div>TimestampColumnFilterDropdown</div>
    ),
    getTimestampColumnFilterFn: () => jest.fn(),
  }),
);

// Mock makeEnumColumnFilterDropdown
jest.mock("../../../src/components/EnumColumnFilterDropdown.tsx", () => ({
  makeEnumColumnFilterDropdown: () => ({
    filterDropdown: () => <div>EnumColumnFilterDropdown</div>,
    onFilter: jest.fn(),
  }),
}));

// Mock ResizableTitle
jest.mock("../../../src/components/ResizableTitle.tsx", () => ({
  ResizableTitle: ({ children }) => <th>{children}</th>,
}));

// Mock CSS module
jest.mock(
  "../../../src/components/admin_tools/CommonStyle.module.css",
  () => ({
    container: "container",
    header: "header",
    title: "title",
    actions: "actions",
  }),
);

// ====== TEST DATA ======
const logsData = [
  {
    id: "1",
    actionTime: 1680000000000,
    username: "alice",
    operation: LogOperation.CREATE,
    entityType: EntityType.FOLDER,
    entityName: "Folder1",
    parentType: EntityType.CHAINS,
    parentName: "ChainsParent",
    entityId: "e1",
    parentId: "p1",
    requestId: "r1",
  },
  {
    id: "2",
    actionTime: 1680000001000,
    username: "bob",
    operation: LogOperation.DELETE,
    entityType: EntityType.CHAIN,
    entityName: "Chain2",
    parentType: EntityType.FOLDER,
    parentName: "FolderParent",
    entityId: "e2",
    parentId: "p2",
    requestId: "r2",
  },
  {
    id: "3",
    actionTime: 1680000002000,
    username: "carol",
    operation: LogOperation.UPDATE,
    entityType: EntityType.SPECIFICATION,
    entityName: "spec.yaml",
    parentType: EntityType.FOLDER,
    parentName: "FolderParent",
    entityId: "e3",
    parentId: "p3",
    requestId: "r3",
  },
];

// ====== useActionLog MOCK SETUP ======
const mockUseActionLog = useActionLog as jest.Mock;
const mockUseColumnSettings = useColumnSettingsBasedOnColumnsType as jest.Mock;
const mockExportActionsLogAsExcel = exportActionsLogAsExcel as jest.Mock;

export const mockColumns: TableProps<ActionLog>["columns"] = [
  {
    title: "Action Time",
    key: "actionTime",
    dataIndex: "actionTime",
    width: 150, // replace with actual columnsWidth.actionTime value
    sorter: (a: ActionLog, b: ActionLog) => b.actionTime - a.actionTime,
    // Simplify complex props for mocking
    render: (_, actionLog: ActionLog) => actionLog.actionTime.toString(),
  },
  {
    title: "Initiator",
    key: "username",
    dataIndex: "username",
    width: 120,
  },
  {
    title: "Operation",
    key: "operation",
    dataIndex: "operation",
    width: 140,
  },
  {
    title: "Entity Type",
    key: "entityType",
    dataIndex: "entityType",
    width: 130,
  },
  {
    title: "Entity Name",
    key: "entityName",
    dataIndex: "entityName",
    width: 150,
  },
  {
    title: "Parent Name",
    key: "parentName",
    dataIndex: "parentName",
    width: 150,
  },
  {
    title: "ID",
    dataIndex: "id",
    hidden: true,
  },
  {
    title: "Entity Id",
    key: "entityId",
    dataIndex: "entityId",
    width: 100,
    hidden: true,
  },
  {
    title: "Parent Id",
    key: "parentId",
    dataIndex: "parentId",
    width: 100,
    hidden: true,
  },
  {
    title: "Request Id",
    key: "requestId",
    dataIndex: "requestId",
    width: 120,
    hidden: true,
  },
];

describe("ActionsLog() ActionsLog method", () => {
  beforeEach(() => {
    mockUseColumnSettings.mockReturnValue({
      orderedColumns: mockColumns,
      columnSettingsButton: <button>Columns</button>,
    });
  });
  // Happy Paths
  describe("Happy paths", () => {
    beforeEach(() => {
      // Setup: useActionLog returns logsData, not loading, hasNextPage
      mockUseActionLog.mockReturnValue({
        logsData,
        fetchNextPage: jest.fn(),
        hasNextPage: true,
        isFetching: false,
        isLoading: false,
        refresh: jest.fn(),
      });
      mockExportActionsLogAsExcel.mockClear();
    });

    it("renders the audit title and icon", () => {
      // Test: The audit title and icon are rendered
      render(<ActionsLog />);
      expect(screen.getByText("Audit")).toBeInTheDocument();
      expect(screen.getByTestId("icon-audit")).toBeInTheDocument();
    });

    it("renders the refresh and export buttons", () => {
      // Test: The refresh and export buttons are rendered
      render(<ActionsLog />);
      expect(screen.getByTestId("icon-refresh")).toBeInTheDocument();
      expect(screen.getByTestId("icon-cloudDownload")).toBeInTheDocument();
    });

    it("renders the column settings button", () => {
      // Test: The column settings button is rendered
      render(<ActionsLog />);
      expect(screen.getByText("Columns")).toBeInTheDocument();
    });

    it("renders all log rows with correct data", async () => {
      // Test: All log rows are rendered with correct data
      render(<ActionsLog />);
      // Check for usernames
      expect(await screen.findByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
      expect(screen.getByText("carol")).toBeInTheDocument();
      // Check for entity names
      expect(screen.getByText("Folder1")).toBeInTheDocument();
      expect(screen.getByText("Chain2")).toBeInTheDocument();
      expect(screen.getByText("spec.yaml")).toBeInTheDocument();
      // Check for operation badges
      expect(screen.getAllByText("CREATE").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("DELETE").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("UPDATE").length).toBeGreaterThanOrEqual(1);
    });

    it("calls refresh when refresh button is clicked", () => {
      // Test: Clicking refresh calls refresh
      const refreshMock = jest.fn();
      mockUseActionLog.mockReturnValueOnce({
        ...mockUseActionLog(),
        refresh: refreshMock,
      });
      render(<ActionsLog />);
      fireEvent.click(screen.getByTestId("icon-refresh").closest("button"));
      expect(refreshMock).toHaveBeenCalled();
    });

    it("calls exportActionsLogAsExcel when export is triggered", async () => {
      // Test: Export button triggers exportActionsLogAsExcel
      render(<ActionsLog />);
      // Click the export trigger (DateRangePicker)
      fireEvent.click(screen.getByTestId("date-range-picker-trigger"));
      await waitFor(() => {
        expect(mockExportActionsLogAsExcel).toHaveBeenCalledWith(
          new Date("2023-01-01"),
          new Date("2023-01-02"),
        );
      });
    });
  });

  // Edge Cases
  describe("Edge cases", () => {
    it("does not render export button when isLoading or isFetching", () => {
      // Test: Export button is hidden when loading
      mockUseActionLog.mockReturnValueOnce({
        logsData: [],
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetching: false,
        isLoading: true,
        refresh: jest.fn(),
      });
      render(<ActionsLog />);
      expect(
        screen.queryByTestId("icon-cloudDownload"),
      ).not.toBeInTheDocument();
    });
  });
});
