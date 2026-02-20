'use server';
/**
 * @fileOverview This file implements a Genkit flow for detecting potential cost overruns from expense descriptions.
 *
 * - detectCostOverruns - A function that analyzes an expense description for unexpected cost overruns.
 * - DetectCostOverrunsInput - The input type for the detectCostOverruns function.
 * - DetectCostOverrunsOutput - The return type for the detectCostOverruns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectCostOverrunsInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the expense record to be analyzed.'),
});
export type DetectCostOverrunsInput = z.infer<
  typeof DetectCostOverrunsInputSchema
>;

const DetectCostOverrunsOutputSchema = z.object({
  overrunDetected: z
    .boolean()
    .describe('True if an unexpected cost overrun is detected, false otherwise.'),
  reason: z
    .string()
    .describe(
      'A brief explanation of why an overrun was detected or not. Provide specific keywords or phrases that indicate an overrun.'
    ),
});
export type DetectCostOverrunsOutput = z.infer<
  typeof DetectCostOverrunsOutputSchema
>;

export async function detectCostOverruns(
  input: DetectCostOverrunsInput
): Promise<DetectCostOverrunsOutput> {
  return detectCostOverrunsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectCostOverrunsPrompt',
  input: {schema: DetectCostOverrunsInputSchema},
  output: {schema: DetectCostOverrunsOutputSchema},
  prompt: `You are an AI assistant specialized in financial analysis. Your task is to review an expense description and determine if it indicates an unexpected cost overrun.

An unexpected cost overrun is suggested by phrases like: 'higher than expected', 'additional costs', 'unforeseen expenses', 'exceeded budget', 'unexpected repair', 'emergency fix', 'due to complications', or anything that implies the cost was not planned or was more than initially anticipated.

If no such language is present, assume there is no unexpected cost overrun.

Analyze the following expense description:

Description: {{{description}}}

Output your determination in the specified JSON format, providing a clear reason for your decision.`, 
  config: {
    temperature: 0.2, // Keep temperature low for more deterministic results
  },
});

const detectCostOverrunsFlow = ai.defineFlow(
  {
    name: 'detectCostOverrunsFlow',
    inputSchema: DetectCostOverrunsInputSchema,
    outputSchema: DetectCostOverrunsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
