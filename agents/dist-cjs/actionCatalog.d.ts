/**
 * Controlled Action Catalog
 * =========================
 *
 * Agents may ONLY recommend actions from this catalog, and only at an allowed
 * priority. This mirrors the grounding guarantee already used by the backend
 * explanation layer (cline_backend/src/ai/actionCatalog.ts): the AI is
 * decision-support, so its action space is a closed, auditable set. Anything
 * outside this catalog is rejected by the ValidationAgent.
 */
import type { ActionPriority } from "./types";
export interface CatalogAction {
    id: string;
    label: string;
    allowedPriorities: ActionPriority[];
    /** Asset types this action is naturally suited to (advisory, for planning). */
    suitedAssetTypes: string[];
    /** Unit types that typically execute this action (advisory). */
    suitedUnitTypes: string[];
    description: string;
}
export declare const ACTION_CATALOG: readonly CatalogAction[];
export declare function isValidActionId(actionId: string): boolean;
export declare function getCatalogAction(actionId: string): CatalogAction | undefined;
export declare function isPriorityAllowed(actionId: string, priority: ActionPriority): boolean;
/** Actions naturally suited to a given asset type (used by deterministic planning). */
export declare function actionsForAssetType(assetType: string): CatalogAction[];
/** The catalog rendered for an LLM prompt (id + allowed priorities). */
export declare function catalogPromptBlock(): string;
