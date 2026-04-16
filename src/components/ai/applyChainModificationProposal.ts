import type { Api } from "../../api/api.ts";
import type {
  Chain,
  ChainCreationRequest,
  EntityLabel,
} from "../../api/apiTypes.ts";
import {
  NEW_CHAIN_ID,
  type ChainMetadata,
  type ChainModificationAction,
  type ChainModificationProposal,
} from "./ChainModificationConfirmation.tsx";
import type { ChainContext } from "./useChainContext.ts";

function toChainCreationRequest(meta: ChainMetadata): ChainCreationRequest {
  const request: ChainCreationRequest = { name: meta.name };
  if (meta.description !== undefined) request.description = meta.description;
  if (meta.folderId !== undefined) request.parentId = meta.folderId;
  if (meta.businessDescription !== undefined)
    request.businessDescription = meta.businessDescription;
  if (meta.assumptions !== undefined) request.assumptions = meta.assumptions;
  if (meta.outOfScope !== undefined) request.outOfScope = meta.outOfScope;
  if (meta.labels !== undefined)
    request.labels = meta.labels.map(
      (l): EntityLabel => ({ name: l.name, technical: l.technical ?? false }),
    );
  return request;
}

function resolveNewChainMeta(
  proposal: ChainModificationProposal,
): ChainMetadata {
  if (proposal.chainMeta) return proposal.chainMeta;
  const seed = proposal.changes.find(
    (c): c is Extract<ChainModificationAction, { action: "createChain" }> =>
      c.action === "createChain",
  );
  if (seed) return seed.chain;
  throw new Error(
    "chainId='__new__' requires either proposal.chainMeta or a 'createChain' action",
  );
}

/**
 * Applies a chain modification proposal via the API. Does not refresh UI; caller should refresh chain context after success.
 *
 * When `proposal.chainId === "__new__"`, a new chain is created first via
 * `api.createChain` using `proposal.chainMeta` (or the embedded `createChain`
 * action as a fallback); the returned chain id is then used for every
 * subsequent action. The `createChain` action itself is skipped during
 * iteration since the chain has already been created.
 */
export async function applyChainModificationProposal(
  proposal: ChainModificationProposal,
  api: Api,
  chainContext: ChainContext,
): Promise<void> {
  let chainId: string;
  if (proposal.chainId === NEW_CHAIN_ID) {
    const meta = resolveNewChainMeta(proposal);
    const created = await api.createChain(toChainCreationRequest(meta));
    chainId = created.id;
  } else {
    chainId = proposal.chainId || chainContext.chain.id;
  }

  for (const change of proposal.changes) {
    switch (change.action) {
      case "createChain":
        // Already handled by the bootstrap above; skip.
        break;
      case "updateChain":
        await api.updateChain(chainId, change.patch as Partial<Chain>);
        break;
      case "createElement": {
        const { type, properties } = change.request;
        if (properties && Object.keys(properties).length > 0) {
          const elements = await api.getElementsByType(chainId, type);
          if (elements.length > 0) {
            let target = elements[0];
            if (elements.length > 1 && type === "http-trigger") {
              const candidate = elements.find((el) => {
                const props = (el as { properties?: Record<string, unknown> })
                  .properties;
                return !props || props.contextPath === undefined;
              });
              if (candidate) target = candidate;
            }
            const elProps = target as { properties?: Record<string, unknown> };
            const currentProps = elProps.properties ?? {};
            await api.updateElement(
              {
                name: target.name,
                description:
                  (target as { description?: string }).description || "",
                type: target.type,
                parentElementId: (target as { parentElementId?: string })
                  .parentElementId,
                properties: { ...currentProps, ...properties },
              },
              chainId,
              target.id,
            );
          }
        }
        break;
      }
      case "updateElement":
        await api.updateElement(change.patch, chainId, change.elementId);
        break;
      case "deleteElements":
        await api.deleteElements(change.elementIds, chainId);
        break;
      case "createConnection":
        await api.createConnection(change.connection, chainId);
        break;
      case "deleteConnections":
        await api.deleteConnections(change.connectionIds, chainId);
        break;
      default: {
        const _exhaustive: never = change;
        console.warn(
          "[AI] Unknown chain modification action",
          _exhaustive as unknown,
        );
      }
    }
  }
}
