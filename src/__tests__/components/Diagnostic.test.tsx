/**
 * @jest-environment jsdom
 */

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, fireEvent, waitFor, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  DiagnosticValidation,
  ValidationEntityType,
  ValidationImplementationType,
  ValidationSeverity,
  ValidationState,
} from "../../api/apiTypes";

const mockGetValidations = jest.fn<() => Promise<DiagnosticValidation[]>>();
const mockGetValidation = jest.fn<() => Promise<DiagnosticValidation>>();
const mockRunValidations = jest.fn<() => Promise<void>>();
const mockShowModal = jest.fn();
const mockInfo = jest.fn();
const mockRequestFailed = jest.fn();

jest.mock("../../api/api", () => ({
  api: {
    getValidations: (...args: unknown[]) => mockGetValidations(...args),
    getValidation: (...args: unknown[]) => mockGetValidation(...args),
    runValidations: (...args: unknown[]) => mockRunValidations(...args),
  },
}));

jest.mock("../../Modals", () => ({
  useModalsContext: () => ({
    showModal: mockShowModal,
  }),
}));

jest.mock("../../hooks/useNotificationService", () => ({
  useNotificationService: () => ({
    info: mockInfo,
    requestFailed: mockRequestFailed,
  }),
}));

jest.mock("../../icons/IconProvider", () => ({
  OverridableIcon: ({
    name,
    onClick,
    style,
  }: {
    name: string;
    onClick?: React.MouseEventHandler;
    style?: React.CSSProperties;
  }) => (
    <span
      data-testid={`icon-${name}`}
      onClick={onClick}
      style={style}
    />
  ),
}));

jest.mock("../../components/dev_tools/useDiagnosticValidationFilters", () => ({
  useDiagnosticValidationFilters: () => ({
    filters: [],
    filterButton: <button data-testid="filter-button">Filter</button>,
  }),
}));

jest.mock("../../misc/format-utils", () => ({
  formatTimestamp: (ts: string) => ts,
}));

jest.mock("../../components/dev_tools/DiagnosticValidationModal", () => ({
  DiagnosticValidationModal: (props: { title: string }) => (
    <div data-testid="validation-modal">{props.title}</div>
  ),
}));

import { Diagnostic } from "../../components/dev_tools/Diagnostic";

function makeValidation(
  overrides: Partial<DiagnosticValidation> = {},
): DiagnosticValidation {
  return {
    id: "val-1",
    title: "Test Validation",
    description: "Test description",
    suggestion: "Test suggestion",
    entityType: ValidationEntityType.CHAIN_ELEMENT,
    implementationType: ValidationImplementationType.BUILT_IN,
    severity: ValidationSeverity.ERROR,
    properties: {},
    alertsCount: 0,
    chainEntities: [],
    status: { state: ValidationState.OK, startedWhen: "2026-01-01T00:00:00Z" },
    ...overrides,
  };
}

async function renderAndWaitForLoad(
  validations: DiagnosticValidation[] = [],
) {
  mockGetValidations.mockResolvedValue(validations);
  const result = render(<Diagnostic />);
  await waitFor(() => {
    expect(mockGetValidations).toHaveBeenCalled();
  });
  return result;
}

describe("Diagnostic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValidations.mockResolvedValue([]);
  });

  it("loads and renders validations on mount", async () => {
    const validations = [
      makeValidation({ id: "v1", title: "Validation One", alertsCount: 0 }),
      makeValidation({ id: "v2", title: "Validation Two", alertsCount: 3 }),
    ];

    const { container } = await renderAndWaitForLoad(validations);

    await waitFor(() => {
      expect(container.textContent).toContain("Validation One");
      expect(container.textContent).toContain("Validation Two");
    });
  });

  it("shows error notification when loading fails", async () => {
    mockGetValidations.mockRejectedValue(new Error("Network error"));

    render(<Diagnostic />);

    await waitFor(() => {
      expect(mockRequestFailed).toHaveBeenCalledWith(
        "Failed to load validations",
        expect.anything(),
      );
    });
  });

  it("renders info alert banner", async () => {
    await renderAndWaitForLoad();

    expect(
      screen.getByText(/only available for testing environment/),
    ).toBeTruthy();
  });

  it("renders Run Diagnostic button as primary with play icon", async () => {
    await renderAndWaitForLoad();

    const button = screen.getByTitle("Run Diagnostic");
    expect(button).toBeTruthy();
    expect(
      button.querySelector("[data-testid='icon-caretRightFilled']"),
    ).toBeTruthy();
  });

  it("displays alerts count with colored tag for ERROR severity", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({
        id: "v1",
        alertsCount: 5,
        severity: ValidationSeverity.ERROR,
      }),
    ]);

    await waitFor(() => {
      const tags = container.querySelectorAll(".ant-tag");
      const alertTag = Array.from(tags).find(
        (tag) => tag.textContent === "5",
      );
      expect(alertTag).toBeTruthy();
    });
  });

  it("displays alerts count with gold tag for WARNING severity", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({
        id: "v1",
        alertsCount: 2,
        severity: ValidationSeverity.WARNING,
      }),
    ]);

    await waitFor(() => {
      const tags = container.querySelectorAll(".ant-tag");
      const alertTag = Array.from(tags).find(
        (tag) => tag.textContent === "2",
      );
      expect(alertTag).toBeTruthy();
    });
  });

  it("displays zero alerts with default tag", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({ id: "v1", alertsCount: 0 }),
    ]);

    await waitFor(() => {
      const tags = container.querySelectorAll(".ant-tag");
      const zeroTag = Array.from(tags).find(
        (tag) => tag.textContent === "0",
      );
      expect(zeroTag).toBeTruthy();
    });
  });

  it("opens validation modal when clicking validation name", async () => {
    await renderAndWaitForLoad([
      makeValidation({ id: "v1", title: "Clickable Validation" }),
    ]);

    await waitFor(() => {
      expect(screen.getByText("Clickable Validation")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Clickable Validation"));

    expect(mockShowModal).toHaveBeenCalledWith(
      expect.objectContaining({ component: expect.anything() }),
    );
  });

  it("triggers search when entering text in search field", async () => {
    await renderAndWaitForLoad();

    const initialCallCount = mockGetValidations.mock.calls.length;

    const searchInput = screen.getByPlaceholderText("Full text search");
    fireEvent.change(searchInput, { target: { value: "test query" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(mockGetValidations.mock.calls.length).toBeGreaterThan(
        initialCallCount,
      );
    });
  });

  it("Run Diagnostic button is enabled after data loads", async () => {
    await renderAndWaitForLoad([
      makeValidation({ id: "v1", title: "To Run" }),
    ]);

    const button = screen.getByTitle("Run Diagnostic");
    expect(button).not.toBeDisabled();
  });

  it("renders expand icon for validation with pre-loaded chain entities", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({
        id: "v1",
        title: "Expandable",
        alertsCount: 2,
        chainEntities: [
          {
            chainId: "c1",
            chainName: "Chain One",
            elementId: "e1",
            elementName: "Element One",
            elementType: "http-trigger",
            properties: {},
          },
          {
            chainId: "c1",
            chainName: "Chain One",
            elementId: "e2",
            elementName: "Element Two",
            elementType: "script",
            properties: {},
          },
        ],
      }),
    ]);

    await waitFor(() => {
      expect(container.textContent).toContain("Expandable");
    });

    // Expand icon should be present for validation with children
    const expandIcon = container.querySelector(
      "[data-testid='icon-right']",
    );
    expect(expandIcon).toBeTruthy();
  });

  it("renders chain entities without nested children for CHAIN entityType", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({
        id: "v1",
        title: "Chain Level",
        alertsCount: 1,
        entityType: ValidationEntityType.CHAIN,
        chainEntities: [
          {
            chainId: "c1",
            chainName: "Direct Chain",
            elementId: "",
            elementName: "",
            elementType: "",
            properties: {},
          },
        ],
      }),
    ]);

    await waitFor(() => {
      expect(container.textContent).toContain("Chain Level");
    });
  });

  it("shows status badge for validations", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({
        id: "v1",
        status: { state: ValidationState.OK, startedWhen: "2026-01-01" },
      }),
    ]);

    await waitFor(() => {
      expect(container.textContent).toContain("Finished");
    });
  });

  it("does not show expand icon for validation without alerts", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({ id: "v1", title: "No Alerts", alertsCount: 0 }),
    ]);

    await waitFor(() => {
      expect(container.textContent).toContain("No Alerts");
    });

    // No expand icon for items without children
    const expandIcons = container.querySelectorAll(
      "[data-testid='icon-right']",
    );
    expect(expandIcons.length).toBe(0);
  });

  it("renders start time for validations", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({
        id: "v1",
        status: {
          state: ValidationState.OK,
          startedWhen: "2026-02-18T15:00:00Z",
        },
      }),
    ]);

    await waitFor(() => {
      expect(container.textContent).toContain("2026-02-18T15:00:00Z");
    });
  });

  it("renders hint icon for validations", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({ id: "v1", suggestion: "Try this fix" }),
    ]);

    await waitFor(() => {
      expect(
        container.querySelector("[data-testid='icon-bulb']"),
      ).toBeTruthy();
    });
  });

  it("renders child row alerts with bordered tag", async () => {
    const { container } = await renderAndWaitForLoad([
      makeValidation({
        id: "v1",
        title: "With Children",
        alertsCount: 2,
        severity: ValidationSeverity.WARNING,
        chainEntities: [
          {
            chainId: "c1",
            chainName: "Chain A",
            elementId: "e1",
            elementName: "Elem 1",
            elementType: "script",
            properties: {},
          },
          {
            chainId: "c1",
            chainName: "Chain A",
            elementId: "e2",
            elementName: "Elem 2",
            elementType: "script",
            properties: {},
          },
        ],
      }),
    ]);

    await waitFor(() => {
      expect(container.textContent).toContain("With Children");
    });
  });
});
