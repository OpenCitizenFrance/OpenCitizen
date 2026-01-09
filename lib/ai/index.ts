/**
 * OpenCitizen AI Module
 * 
 * Exports all AI-related functionality:
 * - US-AI-001: Mistral client wrapper
 * - US-AI-002: Law vulgarization agent
 * - US-AI-003: Diff analysis agent
 * - US-AI-004: Targeting score algorithm
 * - US-AI-005: Lobbying email generator
 */

// Core client
export { getMistralClient, MistralClient } from './mistral-client';
export type { MistralMessage, MistralModel } from './mistral-client';

// Agents
export {
    vulgariserLoi,
    clearVulgarisationCache,
    getCacheStats
} from './agents/vulgarisateur';
export type { VulgarisationResult } from './agents/vulgarisateur';

export {
    analyzerDiff,
    calculateDiff,
    generateDiffHtml,
    classifyModification
} from './agents/diff-analyzer';
export type { DiffAnalysisResult } from './agents/diff-analyzer';

// Algorithms
export {
    calculateTargetingScores,
    getTopTargets
} from './targeting-score';

export {
    generateLobbyingEmail,
    generateMailtoUrl,
    generateEmailVariants
} from './lobbying-generator';
export type { LobbyingEmail } from './lobbying-generator';
