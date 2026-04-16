/**
 * @jest-environment jsdom
 */
import React from "react";
import { describe, it, expect, jest } from "@jest/globals";
import { render } from "@testing-library/react";
import {
  ChainModificationConfirmation,
  NEW_CHAIN_ID,
  type ChainModificationProposal,
} from "../../../src/components/ai/ChainModificationConfirmation";

function makeProposal(
  overrides: Partial<ChainModificationProposal> = {},
): ChainModificationProposal {
  return {
    type: "chain-modification-proposal",
    chainId: "existing-chain-id",
    summary: "s",
    changes: [{ action: "updateChain", patch: { description: "d" } }],
    ...overrides,
  };
}

describe("ChainModificationConfirmation", () => {
  it("does NOT render 'New chain' badge when chainId refers to an existing chain", () => {
    const { queryByTestId, queryByText } = render(
      <ChainModificationConfirmation
        open={true}
        proposal={makeProposal()}
        onCancel={jest.fn()}
        onApply={jest.fn()}
      />,
    );
    expect(queryByTestId("new-chain-badge")).toBeNull();
    expect(queryByText("New chain")).toBeNull();
  });

  it("renders 'New chain' badge when chainId is '__new__'", () => {
    const proposal = makeProposal({
      chainId: NEW_CHAIN_ID,
      chainMeta: { name: "My brand-new chain" },
      changes: [
        { action: "createChain", chain: { name: "My brand-new chain" } },
      ],
    });
    const { getByTestId, getByText } = render(
      <ChainModificationConfirmation
        open={true}
        proposal={proposal}
        onCancel={jest.fn()}
        onApply={jest.fn()}
      />,
    );
    const badge = getByTestId("new-chain-badge");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe("New chain");
    // the new chain's name should be surfaced, rather than the literal '__new__' sentinel
    expect(getByText("My brand-new chain")).toBeTruthy();
  });

  it("renders a 'createChain' action row describing the new chain's name", () => {
    const proposal = makeProposal({
      chainId: NEW_CHAIN_ID,
      chainMeta: { name: "Greeter", folderId: "f-1" },
      changes: [
        {
          action: "createChain",
          chain: { name: "Greeter", folderId: "f-1" },
        },
      ],
    });
    const { getByText } = render(
      <ChainModificationConfirmation
        open={true}
        proposal={proposal}
        onCancel={jest.fn()}
        onApply={jest.fn()}
      />,
    );
    expect(getByText(/Create chain "Greeter"/)).toBeTruthy();
    expect(getByText(/folder: f-1/)).toBeTruthy();
  });

  it("does not render the badge when proposal is null", () => {
    const { queryByTestId } = render(
      <ChainModificationConfirmation
        open={true}
        proposal={null}
        onCancel={jest.fn()}
        onApply={jest.fn()}
      />,
    );
    expect(queryByTestId("new-chain-badge")).toBeNull();
  });
});
