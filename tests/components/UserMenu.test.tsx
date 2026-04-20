/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const mockCopyToClipboard = jest
  .fn<(text: string) => Promise<void>>()
  .mockResolvedValue(undefined);
jest.mock("../../src/misc/clipboard-util.ts", () => ({
  copyToClipboard: (text: string) => mockCopyToClipboard(text),
}));

const mockInfo = jest.fn();
const mockWarning = jest.fn();
jest.mock("../../src/hooks/useNotificationService.tsx", () => ({
  useNotificationService: () => ({
    requestFailed: jest.fn(),
    errorWithDetails: jest.fn(),
    info: mockInfo,
    warning: mockWarning,
  }),
}));

import { UserMenu } from "../../src/components/UserMenu";
import { configure } from "../../src/appConfig";

function resetUserConfig(): void {
  configure({
    userInfo: {
      userName: undefined,
      email: undefined,
      tenantName: undefined,
      tenantId: undefined,
    },
    onLogout: undefined,
  });
}

describe("UserMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetUserConfig();
  });

  it("renders fallback user icon when no userName is set", () => {
    const { container } = render(<UserMenu />);
    const trigger = container.querySelector(
      'button[aria-label="User menu"]',
    ) as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    expect(trigger.querySelector(".anticon-user")).toBeTruthy();
  });

  it("uses the userName as the trigger tooltip title", () => {
    configure({ userInfo: { userName: "Tenant Admin" } });

    const { container } = render(<UserMenu />);
    const trigger = container.querySelector(
      'button[aria-label="User menu"]',
    ) as HTMLButtonElement;
    expect(trigger.getAttribute("title")).toBe("Tenant Admin");
  });

  it("opens dropdown and shows user info, email and tenant fields", async () => {
    configure({
      userInfo: {
        userName: "Tenant Admin",
        email: "admin@example.com",
        tenantName: "cpq",
        tenantId: "tid-123",
      },
    });

    const { container } = render(<UserMenu />);
    fireEvent.click(container.querySelector('button[aria-label="User menu"]')!);

    expect(await screen.findByText("Tenant Admin")).toBeTruthy();
    expect(screen.getByText("admin@example.com")).toBeTruthy();
    expect(screen.getByText("Tenant name")).toBeTruthy();
    expect(screen.getByText("cpq")).toBeTruthy();
    expect(screen.getByText("Tenant ID")).toBeTruthy();
    expect(screen.getByText("tid-123")).toBeTruthy();
  });

  it("uses 'Unknown user' label when userName is absent", async () => {
    const { container } = render(<UserMenu />);
    fireEvent.click(container.querySelector('button[aria-label="User menu"]')!);

    expect(await screen.findByText("Unknown user")).toBeTruthy();
  });

  it("hides the tenant section when no tenant info is set", async () => {
    configure({ userInfo: { userName: "Alice" } });

    const { container } = render(<UserMenu />);
    fireEvent.click(container.querySelector('button[aria-label="User menu"]')!);

    await screen.findByText("Alice");
    expect(screen.queryByText("Tenant name")).toBeNull();
    expect(screen.queryByText("Tenant ID")).toBeNull();
  });

  it("copies Tenant ID to clipboard and notifies", async () => {
    configure({
      userInfo: {
        userName: "Alice",
        tenantName: "acme",
        tenantId: "tid-42",
      },
    });

    const { container } = render(<UserMenu />);
    fireEvent.click(container.querySelector('button[aria-label="User menu"]')!);

    const copyButton = await screen.findByLabelText("Copy Tenant ID");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalledWith("tid-42");
      expect(mockInfo).toHaveBeenCalledWith(
        "Tenant ID was copied to the clipboard",
      );
    });
  });

  it("warns when clipboard copy fails", async () => {
    mockCopyToClipboard.mockRejectedValueOnce(new Error("no permission"));
    configure({
      userInfo: { userName: "Alice", tenantId: "tid-42" },
    });

    const { container } = render(<UserMenu />);
    fireEvent.click(container.querySelector('button[aria-label="User menu"]')!);

    const copyButton = await screen.findByLabelText("Copy Tenant ID");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWarning).toHaveBeenCalledWith("Failed to copy Tenant ID");
    });
  });

  it("hides the Log out button when onLogout is not configured", async () => {
    configure({ userInfo: { userName: "Alice" } });

    const { container } = render(<UserMenu />);
    fireEvent.click(container.querySelector('button[aria-label="User menu"]')!);

    await screen.findByText("Reset UI preferences");
    expect(screen.queryByText("Log out")).toBeNull();
  });

  it("shows the Log out button and calls onLogout when clicked", async () => {
    const onLogout = jest.fn();
    configure({ userInfo: { userName: "Alice" }, onLogout });

    const { container } = render(<UserMenu />);
    fireEvent.click(container.querySelector('button[aria-label="User menu"]')!);

    const logout = await screen.findByText("Log out");
    fireEvent.click(logout);

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("renders Reset UI preferences as a no-op (does not throw)", async () => {
    configure({ userInfo: { userName: "Alice" } });

    const { container } = render(<UserMenu />);
    fireEvent.click(container.querySelector('button[aria-label="User menu"]')!);

    const reset = await screen.findByText("Reset UI preferences");
    expect(() => fireEvent.click(reset)).not.toThrow();
  });

  it("does not re-render when unrelated config fields change", () => {
    configure({ userInfo: { userName: "Alice" } });

    const renderSpy = jest.fn();
    const Probe: React.FC = () => {
      renderSpy();
      return <UserMenu />;
    };
    render(<Probe />);
    const initialCalls = renderSpy.mock.calls.length;

    act(() => {
      configure({ documentationBaseUrl: "https://example.com/unrelated" });
    });

    expect(renderSpy.mock.calls.length).toBe(initialCalls);
  });

  it("reacts to configure() updates after mount", async () => {
    const { container } = render(<UserMenu />);
    const trigger = container.querySelector(
      'button[aria-label="User menu"]',
    ) as HTMLButtonElement;
    expect(trigger.getAttribute("title")).toBe("Unknown user");

    act(() => {
      configure({ userInfo: { userName: "Bob" } });
    });

    await waitFor(() => {
      expect(trigger.getAttribute("title")).toBe("Bob");
    });
  });
});
