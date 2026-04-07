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

globalThis.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

import React from "react";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { FieldProps } from "@rjsf/utils";
import type { JSONSchema7 } from "json-schema";
import type { MCPSystem } from "../../../../../../src/api/apiTypes";
import type { FormContext } from "../../../../../../src/components/modal/chain_element/ChainElementModificationContext";

// ---------------------------------------------------------------------------
// Captured props store — updated on every re-render of the stub
// ---------------------------------------------------------------------------

type CapturedSelectProps = {
  id?: string;
  title: string;
  required?: boolean;
  selectValue: string | undefined;
  selectOptions:
    | Array<{ labelString: string; label: string; value: string }>
    | undefined;
  selectOnChange: (value: string) => void;
  selectDisabled: boolean;
  buttonTitle: string;
  buttonDisabled: boolean;
  buttonOnClick: string;
  selectOptionFilterProp?: string;
};

let capturedProps: CapturedSelectProps | null = null;

// ---------------------------------------------------------------------------
// Mocks
//
// IMPORTANT: useNotificationService must return a *stable* object reference.
// MCPServiceField uses it as a useCallback dependency; a new object on every
// render causes loadSystems to be recreated every render, which re-triggers
// the useEffect and causes an infinite update loop that blocks act/waitFor.
// ---------------------------------------------------------------------------

const mockGetMcpSystems: jest.MockedFunction<() => Promise<MCPSystem[]>> =
  jest.fn();
const mockUpdateContext = jest.fn();
const mockRequestFailed = jest.fn();
const mockNotificationService = { requestFailed: mockRequestFailed };

jest.mock("../../../../../../src/api/api", () => ({
  api: {
    getMcpSystems: (onlyEnabled: boolean): Promise<MCPSystem[]> =>
      mockGetMcpSystems(onlyEnabled),
  },
}));

jest.mock("../../../../../../src/hooks/useNotificationService", () => ({
  // Arrow function returns the same object on every call — no re-render loop.
  useNotificationService: () => mockNotificationService,
}));

jest.mock("../../../../../../src/icons/IconProvider", () => ({
  OverridableIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

jest.mock(
  "../../../../../../src/components/modal/chain_element/field/select/SelectAndNavigateField",
  () => ({
    SelectAndNavigateField: (props: CapturedSelectProps) => {
      capturedProps = props;
      return <div data-testid="select-and-navigate-field" />;
    },
  }),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMcpSystem = (id: string, name: string): MCPSystem =>
  ({
    id,
    name,
    description: "",
    identifier: `identifier-${id}`,
    instructions: "",
    labels: [],
  }) as MCPSystem;

type RegistryProp = FieldProps<string, JSONSchema7, FormContext>["registry"];

function makeProps(
  overrides: Partial<FieldProps<string, JSONSchema7, FormContext>> = {},
): FieldProps<string, JSONSchema7, FormContext> {
  return {
    id: "test-field",
    formData: "",
    schema: {},
    required: false,
    uiSchema: {},
    registry: {
      formContext: {
        updateContext: mockUpdateContext,
      },
    } as unknown as RegistryProp,
    errorSchema: {},
    onChange: jest.fn(),
    onBlur: jest.fn(),
    onFocus: jest.fn(),
    ...overrides,
  } as FieldProps<string, JSONSchema7, FormContext>;
}

// ---------------------------------------------------------------------------
// Component under test (imported after mocks)
// ---------------------------------------------------------------------------

import { MCPServiceField } from "../../../../../../src/components/modal/chain_element/field/select/MCPServiceField";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCPServiceField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps = null;
    mockGetMcpSystems.mockResolvedValue([]);
  });

  // -------------------------------------------------------------------------
  // Group 1 — Initial render
  // -------------------------------------------------------------------------

  describe("initial render", () => {
    it("should render without crashing when given minimal valid props", async () => {
      const { getByTestId } = render(<MCPServiceField {...makeProps()} />);
      expect(getByTestId("select-and-navigate-field")).toBeInTheDocument();
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
    });

    it("should pass selectDisabled as true to SelectAndNavigateField when data is loading", async () => {
      mockGetMcpSystems.mockReturnValue(new Promise<MCPSystem[]>(() => {}));
      render(<MCPServiceField {...makeProps()} />);
      await waitFor(() => expect(capturedProps?.selectDisabled).toBe(true));
    });

    it("should pass buttonDisabled as true to SelectAndNavigateField when no system has been selected", async () => {
      render(<MCPServiceField {...makeProps()} />);
      // buttonDisabled derives from !systemId; systemId starts as "" so it is
      // true on every render until the user makes a selection.
      expect(capturedProps?.buttonDisabled).toBe(true);
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
    });
  });

  // -------------------------------------------------------------------------
  // Group 2 — Successful data load
  // -------------------------------------------------------------------------

  describe("successful data load", () => {
    it("should call getMcpSystems with true when component mounts", async () => {
      render(<MCPServiceField {...makeProps()} />);
      await waitFor(() =>
        expect(mockGetMcpSystems).toHaveBeenCalledWith(true),
      );
    });

    it("should pass selectDisabled as false to SelectAndNavigateField when data has loaded", async () => {
      render(<MCPServiceField {...makeProps()} />);
      // Wait until the API has been called *and* loading has finished.
      await waitFor(() => {
        expect(mockGetMcpSystems).toHaveBeenCalledWith(true);
        expect(capturedProps?.selectDisabled).toBe(false);
      });
    });

    it("should pass correctly shaped options to SelectAndNavigateField when systems are returned by API", async () => {
      mockGetMcpSystems.mockResolvedValue([makeMcpSystem("sys-1", "System One")]);
      render(<MCPServiceField {...makeProps()} />);
      await waitFor(() =>
        expect(capturedProps?.selectOptions).toEqual([
          { labelString: "System One", label: "System One", value: "sys-1" },
        ]),
      );
    });

    it("should preserve system order in options when systems are returned by API", async () => {
      mockGetMcpSystems.mockResolvedValue([
        makeMcpSystem("sys-1", "Alpha"),
        makeMcpSystem("sys-2", "Beta"),
        makeMcpSystem("sys-3", "Gamma"),
      ]);
      render(<MCPServiceField {...makeProps()} />);
      await waitFor(() => {
        const values = capturedProps?.selectOptions?.map((o) => o.value);
        expect(values).toEqual(["sys-1", "sys-2", "sys-3"]);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Group 3 — Failed data load
  // -------------------------------------------------------------------------

  describe("failed data load", () => {
    beforeEach(() => {
      mockGetMcpSystems.mockRejectedValue(new Error("Network error"));
    });

    it('should call requestFailed with "Failed to load MCP services" when API throws', async () => {
      render(<MCPServiceField {...makeProps()} />);
      await waitFor(() =>
        expect(mockRequestFailed).toHaveBeenCalledWith(
          "Failed to load MCP services",
          expect.any(Error),
        ),
      );
    });

    it("should pass empty options to SelectAndNavigateField when API call fails", async () => {
      render(<MCPServiceField {...makeProps()} />);
      await waitFor(() => {
        expect(mockRequestFailed).toHaveBeenCalled();
        expect(capturedProps?.selectOptions).toEqual([]);
      });
    });

    it("should pass selectDisabled as false to SelectAndNavigateField when API call fails", async () => {
      render(<MCPServiceField {...makeProps()} />);
      // isLoading is reset to false in the finally block even after an error.
      await waitFor(() => {
        expect(mockRequestFailed).toHaveBeenCalled();
        expect(capturedProps?.selectDisabled).toBe(false);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Group 4 — Title resolution
  // -------------------------------------------------------------------------

  describe("title resolution", () => {
    it("should use uiSchema ui:title as title when it is provided", async () => {
      render(
        <MCPServiceField
          {...makeProps({
            uiSchema: { "ui:title": "UI Schema Title" },
            schema: { title: "Schema Title" },
          })}
        />,
      );
      // title is derived synchronously from props on every render.
      expect(capturedProps?.title).toBe("UI Schema Title");
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
    });

    it("should fall back to schema title when uiSchema ui:title is absent", async () => {
      render(
        <MCPServiceField
          {...makeProps({
            uiSchema: {},
            schema: { title: "Schema Title" },
          })}
        />,
      );
      expect(capturedProps?.title).toBe("Schema Title");
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
    });

    it("should pass empty string as title when neither uiSchema nor schema title is provided", async () => {
      render(
        <MCPServiceField
          {...makeProps({
            uiSchema: {},
            schema: {},
          })}
        />,
      );
      expect(capturedProps?.title).toBe("");
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
    });
  });

  // -------------------------------------------------------------------------
  // Group 5 — Selection / handleChange wiring
  // -------------------------------------------------------------------------

  describe("selection handling", () => {
    it("should call updateContext with mcpServiceId when a system is selected", async () => {
      render(<MCPServiceField {...makeProps()} />);
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
      act(() => {
        capturedProps?.selectOnChange("sys-1");
      });
      expect(mockUpdateContext).toHaveBeenCalledWith({ mcpServiceId: "sys-1" });
    });

    it("should pass buttonDisabled as false to SelectAndNavigateField when a system has been selected", async () => {
      render(<MCPServiceField {...makeProps()} />);
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
      act(() => {
        capturedProps?.selectOnChange("sys-1");
      });
      await waitFor(() => expect(capturedProps?.buttonDisabled).toBe(false));
    });

    it("should pass navigation path with selected system id to SelectAndNavigateField when a system is selected", async () => {
      render(<MCPServiceField {...makeProps()} />);
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
      act(() => {
        capturedProps?.selectOnChange("sys-1");
      });
      // navigationPath is set by a useEffect reacting to systemId, so we wait.
      await waitFor(() =>
        expect(capturedProps?.buttonOnClick).toBe(
          "/services/mcp/sys-1/parameters",
        ),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Group 6 — formData as selectValue
  // -------------------------------------------------------------------------

  describe("formData as selectValue", () => {
    it("should pass formData prop as selectValue to SelectAndNavigateField when formData is set", async () => {
      render(<MCPServiceField {...makeProps({ formData: "pre-existing-id" })} />);
      // selectValue is passed directly from the formData prop on every render.
      expect(capturedProps?.selectValue).toBe("pre-existing-id");
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
    });
  });

  // -------------------------------------------------------------------------
  // Group 7 — Null-safety
  // -------------------------------------------------------------------------

  describe("null-safety", () => {
    it("should not throw when registry formContext is undefined when a selection is made", async () => {
      render(
        <MCPServiceField
          {...makeProps({
            registry: {
              formContext: undefined,
            } as unknown as RegistryProp,
          })}
        />,
      );
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
      // Optional chaining on formContext/updateContext must not throw.
      // If selectOnChange throws, act propagates it and the test fails.
      await act(async () => {
        capturedProps?.selectOnChange("sys-1");
        await Promise.resolve();
      });
    });

    it("should not throw when formContext updateContext is undefined when a selection is made", async () => {
      render(
        <MCPServiceField
          {...makeProps({
            registry: {
              formContext: {},
            } as unknown as RegistryProp,
          })}
        />,
      );
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
      // Optional chaining on formContext/updateContext must not throw.
      // If selectOnChange throws, act propagates it and the test fails.
      await act(async () => {
        capturedProps?.selectOnChange("sys-1");
        await Promise.resolve();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Group 8 — required prop
  // -------------------------------------------------------------------------

  describe("required prop", () => {
    it("should pass required as true to SelectAndNavigateField when required prop is true", async () => {
      render(<MCPServiceField {...makeProps({ required: true })} />);
      expect(capturedProps?.required).toBe(true);
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
    });

    it("should pass required as false to SelectAndNavigateField when required prop is false", async () => {
      render(<MCPServiceField {...makeProps({ required: false })} />);
      expect(capturedProps?.required).toBe(false);
      await waitFor(() => expect(mockGetMcpSystems).toHaveBeenCalled());
    });
  });
});
