/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UnsavedChangesModal } from "../../../src/components/modal/UnsavedChangesModal";

Object.defineProperty(globalThis, "matchMedia", {
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

const mockCloseContainingModal = jest.fn();

jest.mock("../../../src/ModalContextProvider", () => ({
  useModalContext: () => ({
    closeContainingModal: mockCloseContainingModal,
  }),
}));

describe("UnsavedChangesModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders updated unsaved changes copy", () => {
    render(<UnsavedChangesModal onYes={jest.fn()} onNo={jest.fn()} />);

    expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You have unsaved changes. Save them, discard them, or keep editing?",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keep editing" }),
    ).toBeInTheDocument();
  });

  it("closes modal and calls onYes when Save is clicked", () => {
    const onYes = jest.fn();

    render(<UnsavedChangesModal onYes={onYes} onNo={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mockCloseContainingModal).toHaveBeenCalled();
    expect(onYes).toHaveBeenCalled();
  });

  it("closes modal and calls onNo when Discard is clicked", () => {
    const onNo = jest.fn();

    render(<UnsavedChangesModal onYes={jest.fn()} onNo={onNo} />);

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(mockCloseContainingModal).toHaveBeenCalled();
    expect(onNo).toHaveBeenCalled();
  });

  it("dismisses only the question dialog when Keep editing is clicked", () => {
    const onNo = jest.fn();
    const onCancelQuestion = jest.fn();

    render(
      <UnsavedChangesModal
        onYes={jest.fn()}
        onNo={onNo}
        onCancelQuestion={onCancelQuestion}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    expect(mockCloseContainingModal).toHaveBeenCalled();
    expect(onCancelQuestion).toHaveBeenCalled();
    expect(onNo).not.toHaveBeenCalled();
  });

  it("close icon dismisses only the question dialog", () => {
    const onNo = jest.fn();
    const onCancelQuestion = jest.fn();

    render(
      <UnsavedChangesModal
        onYes={jest.fn()}
        onNo={onNo}
        onCancelQuestion={onCancelQuestion}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(mockCloseContainingModal).toHaveBeenCalled();
    expect(onCancelQuestion).toHaveBeenCalled();
    expect(onNo).not.toHaveBeenCalled();
  });
});
