/**
 * US-AI-001: Mistral API Wrapper
 * 
 * Centralized client for Mistral AI with:
 * - Singleton pattern
 * - Exponential backoff retry for rate limits (429)
 * - Structured JSON output enforcement
 * - Token consumption logging
 */

import { z } from 'zod';

// Types
interface MistralMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface MistralResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    timestamp: Date;
    model: string;
}

type MistralModel = 'mistral-small-latest' | 'mistral-large-latest' | 'mistral-embed';

// Singleton instance
let instance: MistralClient | null = null;

class MistralClient {
    private apiKey: string;
    private baseUrl = 'https://api.mistral.ai/v1';
    private tokenLog: TokenUsage[] = [];
    private maxRetries = 3;
    private baseDelay = 1000; // 1 second

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('MISTRAL_API_KEY is required');
        }
        this.apiKey = apiKey;
    }

    static getInstance(): MistralClient {
        if (!instance) {
            const apiKey = process.env.MISTRAL_API_KEY || '';
            instance = new MistralClient(apiKey);
        }
        return instance;
    }

    /**
     * Generic chat completion with retry logic
     */
    async chat(
        messages: MistralMessage[],
        options: {
            model?: MistralModel;
            temperature?: number;
            maxTokens?: number;
        } = {}
    ): Promise<string> {
        const { model = 'mistral-small-latest', temperature = 0.7, maxTokens = 2048 } = options;

        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature,
                        max_tokens: maxTokens,
                    }),
                });

                if (response.status === 429) {
                    // Rate limited - exponential backoff
                    const delay = this.baseDelay * Math.pow(2, attempt);
                    console.warn(`[MistralClient] Rate limited (429). Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                    continue;
                }

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Mistral API error ${response.status}: ${errorBody}`);
                }

                const data: MistralResponse = await response.json();

                // Log token usage
                this.logTokenUsage(data.usage, model);

                return data.choices[0]?.message?.content || '';
            } catch (error) {
                lastError = error as Error;
                if (attempt < this.maxRetries - 1) {
                    const delay = this.baseDelay * Math.pow(2, attempt);
                    console.warn(`[MistralClient] Error: ${lastError.message}. Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError || new Error('Max retries exceeded');
    }

    /**
     * Generate structured JSON output with schema validation
     * US-AI-001: Méthode `generate_json(prompt, schema)` forcée
     */
    async generateJson<T>(
        prompt: string,
        schema: z.ZodSchema<T>,
        options: {
            model?: MistralModel;
            systemPrompt?: string;
        } = {}
    ): Promise<T> {
        const { model = 'mistral-small-latest', systemPrompt } = options;

        const messages: MistralMessage[] = [
            {
                role: 'system',
                content: systemPrompt ||
                    'Tu es un assistant qui répond UNIQUEMENT en JSON valide. ' +
                    'Ne fournis aucune explication, uniquement le JSON.'
            },
            {
                role: 'user',
                content: prompt + '\n\nRéponds en JSON valide uniquement.'
            }
        ];

        const response = await this.chat(messages, { model, temperature: 0.3 });

        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.slice(7);
        }
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
            jsonStr = jsonStr.slice(0, -3);
        }
        jsonStr = jsonStr.trim();

        try {
            const parsed = JSON.parse(jsonStr);
            return schema.parse(parsed);
        } catch (error) {
            console.error('[MistralClient] JSON parsing failed:', error);
            console.error('[MistralClient] Raw response:', response);
            throw new Error(`Failed to parse JSON response: ${error}`);
        }
    }

    /**
     * Generate embeddings for text
     */
    async embed(texts: string[]): Promise<number[][]> {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: 'mistral-embed',
                input: texts,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Mistral Embed API error ${response.status}: ${errorBody}`);
        }

        const data = await response.json();

        // Log usage
        if (data.usage) {
            this.logTokenUsage(data.usage, 'mistral-embed');
        }

        return data.data.map((d: { embedding: number[] }) => d.embedding);
    }

    /**
     * Log token consumption for cost tracking
     */
    private logTokenUsage(usage: MistralResponse['usage'], model: string): void {
        const entry: TokenUsage = {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            timestamp: new Date(),
            model,
        };
        this.tokenLog.push(entry);

        console.log(
            `[MistralClient] Tokens used: ${usage.total_tokens} ` +
            `(prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}) ` +
            `[${model}]`
        );
    }

    /**
     * Get cumulative token usage for reporting
     */
    getTokenUsage(): {
        total: number;
        byModel: Record<string, number>;
        log: TokenUsage[];
    } {
        const byModel: Record<string, number> = {};
        let total = 0;

        for (const entry of this.tokenLog) {
            total += entry.total_tokens;
            byModel[entry.model] = (byModel[entry.model] || 0) + entry.total_tokens;
        }

        return { total, byModel, log: this.tokenLog };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton getter
export function getMistralClient(): MistralClient {
    return MistralClient.getInstance();
}

export { MistralClient };
export type { MistralMessage, MistralModel };
