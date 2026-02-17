/**
 * Runtime override for AI service URL (set via configure({ aiServiceUrl })).
 * Kept in a separate module so the built library always reads it at runtime
 * and bundlers do not inline or replace it with build-time constants.
 */
let override: string | null = null;

export function setAiServiceUrlOverride(url: string | undefined): void {
  override = url ?? null;
}

export function getAiServiceUrlOverride(): string | null {
  return override;
}
