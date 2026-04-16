/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { applyChainModificationProposal } from "../../../src/components/ai/applyChainModificationProposal.ts";
import {
  NEW_CHAIN_ID,
  type ChainModificationProposal,
} from "../../../src/components/ai/ChainModificationConfirmation.tsx";
import type { Api } from "../../../src/api/api.ts";
import type { Chain, Element } from "../../../src/api/apiTypes.ts";
import type { ChainContext } from "../../../src/components/ai/useChainContext.ts";

type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.Mock<(...args: A) => R>
    : T[K];
};

function buildApi(overrides: Partial<Mocked<Api>> = {}): Mocked<Api> {
  const stub = <A extends unknown[], R>(): jest.Mock<(...a: A) => R> =>
    jest.fn<(...a: A) => R>();
  return {
    createChain: stub<[unknown], Promise<Chain>>(),
    updateChain: stub<[string, Partial<Chain>], Promise<Chain>>(),
    updateElement: stub<[unknown, string, string], Promise<Element>>(),
    deleteElements: stub<[string[], string], Promise<void>>(),
    createConnection: stub<[unknown, string], Promise<unknown>>(),
    deleteConnections: stub<[string[], string], Promise<void>>(),
    getElementsByType: stub<[string, string], Promise<Element[]>>(),
    ...overrides,
  } as unknown as Mocked<Api>;
}

function buildContext(): ChainContext {
  return {
    chain: { id: "fallback-chain-id" } as Chain,
    compactSchema: {} as ChainContext["compactSchema"],
    refresh: jest.fn<() => Promise<void>>(async () => {}),
  };
}

function buildCreatedChain(id: string, name: string): Chain {
  return {
    id,
    name,
    description: "",
    navigationPath: [],
    elements: [],
    dependencies: [],
    deployments: [],
    labels: [],
    defaultSwimlaneId: "",
    reuseSwimlaneId: "",
    unsavedChanges: false,
    businessDescription: "",
    assumptions: "",
    outOfScope: "",
    containsDeprecatedContainers: false,
    containsDeprecatedElements: false,
    containsUnsupportedElements: false,
  } as Chain;
}

describe("applyChainModificationProposal — chainId='__new__'", () => {
  let api: Mocked<Api>;
  let ctx: ChainContext;

  beforeEach(() => {
    api = buildApi();
    ctx = buildContext();
  });

  it("creates a new chain first using proposal.chainMeta and uses returned id for subsequent actions", async () => {
    const created = buildCreatedChain("newly-created-id", "My new chain");
    api.createChain.mockResolvedValue(created);
    api.updateElement.mockResolvedValue({} as Element);
    api.createConnection.mockResolvedValue({});

    const proposal: ChainModificationProposal = {
      type: "chain-modification-proposal",
      chainId: NEW_CHAIN_ID,
      chainMeta: {
        name: "My new chain",
        description: "Handles webhook X",
        folderId: "folder-42",
      },
      summary: "Create a new chain with a logger",
      changes: [
        {
          action: "updateElement",
          elementId: "el-a",
          patch: {
            name: "logger",
            description: "",
            type: "logger",
            properties: { level: "INFO" },
          },
        },
        {
          action: "createConnection",
          connection: { from: "el-a", to: "el-b" },
        },
      ],
    };

    await applyChainModificationProposal(proposal, api as unknown as Api, ctx);

    expect(api.createChain).toHaveBeenCalledTimes(1);
    expect(api.createChain).toHaveBeenCalledWith({
      name: "My new chain",
      description: "Handles webhook X",
      parentId: "folder-42",
    });

    // updateElement and createConnection should both be called with the NEW id
    expect(api.updateElement).toHaveBeenCalledTimes(1);
    expect(api.updateElement).toHaveBeenCalledWith(
      expect.any(Object),
      "newly-created-id",
      "el-a",
    );
    expect(api.createConnection).toHaveBeenCalledTimes(1);
    expect(api.createConnection).toHaveBeenCalledWith(
      { from: "el-a", to: "el-b" },
      "newly-created-id",
    );

    // createChain must be invoked BEFORE any of the other actions
    const createChainOrder = api.createChain.mock.invocationCallOrder[0];
    const updateElOrder = api.updateElement.mock.invocationCallOrder[0];
    const createConnOrder = api.createConnection.mock.invocationCallOrder[0];
    expect(createChainOrder).toBeLessThan(updateElOrder);
    expect(createChainOrder).toBeLessThan(createConnOrder);
    // and the sentinel '__new__' must never leak into any downstream call
    expect(api.updateElement).not.toHaveBeenCalledWith(
      expect.any(Object),
      NEW_CHAIN_ID,
      expect.any(String),
    );
  });

  it("falls back to the embedded createChain action when chainMeta is absent", async () => {
    const created = buildCreatedChain("fallback-chain-id-2", "Fallback");
    api.createChain.mockResolvedValue(created);
    api.deleteElements.mockResolvedValue(undefined);

    const proposal: ChainModificationProposal = {
      type: "chain-modification-proposal",
      chainId: NEW_CHAIN_ID,
      summary: "via embedded createChain",
      changes: [
        {
          action: "createChain",
          chain: { name: "Fallback", description: "From action" },
        },
        { action: "deleteElements", elementIds: ["x"] },
      ],
    };

    await applyChainModificationProposal(proposal, api as unknown as Api, ctx);

    expect(api.createChain).toHaveBeenCalledTimes(1);
    expect(api.createChain).toHaveBeenCalledWith({
      name: "Fallback",
      description: "From action",
    });
    // createChain action itself must NOT have triggered a second chain creation
    expect(api.deleteElements).toHaveBeenCalledWith(["x"], "fallback-chain-id-2");
  });

  it("skips the createChain action during iteration (no second createChain call)", async () => {
    const created = buildCreatedChain("id-123", "c");
    api.createChain.mockResolvedValue(created);
    api.updateChain.mockResolvedValue(created);

    const proposal: ChainModificationProposal = {
      type: "chain-modification-proposal",
      chainId: NEW_CHAIN_ID,
      chainMeta: { name: "c" },
      summary: "s",
      changes: [
        { action: "createChain", chain: { name: "c" } },
        { action: "updateChain", patch: { description: "d" } },
      ],
    };

    await applyChainModificationProposal(proposal, api as unknown as Api, ctx);

    expect(api.createChain).toHaveBeenCalledTimes(1);
    expect(api.updateChain).toHaveBeenCalledWith("id-123", { description: "d" });
  });

  it("throws when chainId='__new__' but neither chainMeta nor createChain action is present", async () => {
    const proposal: ChainModificationProposal = {
      type: "chain-modification-proposal",
      chainId: NEW_CHAIN_ID,
      summary: "incomplete",
      changes: [{ action: "updateChain", patch: { description: "x" } }],
    };

    await expect(
      applyChainModificationProposal(proposal, api as unknown as Api, ctx),
    ).rejects.toThrow(/chainMeta/);
    expect(api.createChain).not.toHaveBeenCalled();
  });

  it("normalizes labels to include the required 'technical' flag", async () => {
    api.createChain.mockResolvedValue(buildCreatedChain("id", "c"));

    const proposal: ChainModificationProposal = {
      type: "chain-modification-proposal",
      chainId: NEW_CHAIN_ID,
      chainMeta: {
        name: "c",
        labels: [{ name: "env:test" }, { name: "tech", technical: true }],
      },
      summary: "labels",
      changes: [],
    };

    await applyChainModificationProposal(proposal, api as unknown as Api, ctx);

    expect(api.createChain).toHaveBeenCalledWith({
      name: "c",
      labels: [
        { name: "env:test", technical: false },
        { name: "tech", technical: true },
      ],
    });
  });
});

describe("applyChainModificationProposal — chainId is an existing id", () => {
  it("does NOT call createChain when proposal.chainId refers to an existing chain", async () => {
    const api = buildApi();
    const ctx = buildContext();
    api.updateChain.mockResolvedValue({} as Chain);

    const proposal: ChainModificationProposal = {
      type: "chain-modification-proposal",
      chainId: "existing-chain-777",
      summary: "s",
      changes: [{ action: "updateChain", patch: { description: "d" } }],
    };

    await applyChainModificationProposal(proposal, api as unknown as Api, ctx);

    expect(api.createChain).not.toHaveBeenCalled();
    expect(api.updateChain).toHaveBeenCalledWith("existing-chain-777", {
      description: "d",
    });
  });
});
