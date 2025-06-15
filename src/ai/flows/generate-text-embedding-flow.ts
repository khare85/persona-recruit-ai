
'use server';
/**
 * @fileOverview Generates a numerical embedding for a given text string.
 * - generateTextEmbedding - Function to call the Genkit flow for embedding generation.
 * - GenerateTextEmbeddingInput - Input type for the generateTextEmbedding function.
 * - GenerateTextEmbeddingOutput - Return type for the generateTextEmbedding function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTextEmbeddingInputSchema = z.object({
  text: z.string().min(1).describe("The text content to be embedded."),
  // Optionally, model could be specified here if we need to override the default
  // model: z.string().optional().describe("The embedding model to use."),
});
export type GenerateTextEmbeddingInput = z.infer<typeof GenerateTextEmbeddingInputSchema>;

const GenerateTextEmbeddingOutputSchema = z.object({
  embedding: z.array(z.number()).describe("The numerical embedding vector for the input text."),
});
export type GenerateTextEmbeddingOutput = z.infer<typeof GenerateTextEmbeddingOutputSchema>;

export async function generateTextEmbedding(input: GenerateTextEmbeddingInput): Promise<GenerateTextEmbeddingOutput> {
  return generateTextEmbeddingFlow(input);
}

const generateTextEmbeddingFlow = ai.defineFlow(
  {
    name: 'generateTextEmbeddingFlow',
    inputSchema: GenerateTextEmbeddingInputSchema,
    outputSchema: GenerateTextEmbeddingOutputSchema,
  },
  async ({ text /*, model */ }): Promise<GenerateTextEmbeddingOutput> => {
    try {
      // ai.embed() will use the default embedding model configured for the googleAI plugin
      // or a specific model if provided and supported.
      const {embedding} = await ai.embed({
        content: text,
        // ...(model ? { model } : {}), // Example if model override was enabled
      });

      if (!embedding || embedding.length === 0) {
        console.error('[generateTextEmbeddingFlow] - ai.embed() did not return a valid embedding for text (length: ${text.length}).');
        throw new Error('Failed to generate text embedding: No embedding vector returned.');
      }

      return { embedding };
    } catch (error) {
      console.error(`[generateTextEmbeddingFlow] - Error generating embedding for text (length: ${text.length}):`, error);
      throw new Error(`Failed to generate text embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
