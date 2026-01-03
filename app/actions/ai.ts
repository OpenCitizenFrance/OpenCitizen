"use server";

import { createMistral } from '@ai-sdk/mistral';
import { generateObject } from 'ai';
import { z } from 'zod';

const mistral = createMistral({
    apiKey: process.env.MISTRAL_API_KEY || 'placeholder',
});

const AmendmentSummarySchema = z.object({
    context: z.string().describe("The legal context or current state of the law being modified."),
    change: z.string().describe("The specific modification proposed by the amendment."),
    impact: z.string().describe("The potential consequence or practical effect of this change."),
});

export async function summarizeAmendment(text: string) {
    'use server';

    try {
        const { object } = await generateObject({
            model: mistral('mistral-large-latest'),
            schema: AmendmentSummarySchema,
            system: `You are a strictly neutral legal analyst for the French National Assembly. 
               Your task is to summarize the following legislative amendment. 
               You must ignore any political posturing in the text and extract only the concrete legal changes proposed.`,
            prompt: `Summarize this amendment text:\n\n${text}`,
            temperature: 0.1,
        });

        return { success: true, data: object };
    } catch (error) {
        console.error("AI Summarization failed:", error);
        return { success: false, error: "Failed to generate summary" };
    }
}
