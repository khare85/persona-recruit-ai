
'use server';
/**
 * @fileOverview Generates a numerical embedding for a given text string using a specific model.
 * - generateTextEmbedding - Function to call the Genkit flow for embedding generation.
 * - GenerateTextEmbeddingInput - Input type for the generateTextEmbedding function.
 * - GenerateTextEmbeddingOutput - Return type for the generateTextEmbedding function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the specific embedding model to be used.
// 'text-embedding-004' is Google's latest generation text embedding model as of early 2024.
// Other models like 'textembedding-gecko@003' (older) or 'embedding-001' (general purpose) could also be used if supported.
// The user mentioned "text-embedding-005" or "textembedding-gecko", so we are choosing a modern equivalent.
const EMBEDDING_MODEL_ID = 'text-embedding-004';

const GenerateTextEmbeddingInputSchema = z.object({
  text: z.string().min(1).describe("The text content to be embedded."),
  // model: z.string().optional().describe("Optional: Specify the embedding model ID. If not provided, a default (currently ${EMBEDDING_MODEL_ID}) will be used."),
});
export type GenerateTextEmbeddingInput = z.infer<typeof GenerateTextEmbeddingInputSchema>;

const GenerateTextEmbeddingOutputSchema = z.object({
  embedding: z.array(z.number()).describe("The numerical embedding vector for the input text."),
  modelUsed: z.string().describe("The embedding model ID that was used to generate the embedding."),
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
  async ({ text /*, model: inputModel */ }): Promise<GenerateTextEmbeddingOutput> => {
    // const modelToUse = inputModel || EMBEDDING_MODEL_ID;
    const modelToUse = EMBEDDING_MODEL_ID; // Hardcoding for now as per user's strong preference for a specific type

    try {
      console.log(`[generateTextEmbeddingFlow] - Generating embedding for text (length: ${text.length}) using model: ${modelToUse}`);
      const {embedding} = await ai.embed({
        content: text,
        model: modelToUse,
      });

      if (!embedding || embedding.length === 0) {
        console.error(`[generateTextEmbeddingFlow] - ai.embed() did not return a valid embedding for text (length: ${text.length}) using model ${modelToUse}.`);
        throw new Error('Failed to generate text embedding: No embedding vector returned.');
      }
      console.log(`[generateTextEmbeddingFlow] - Successfully generated embedding using model ${modelToUse}. Vector length: ${embedding.length}`);
      return { embedding, modelUsed: modelToUse };
    } catch (error) {
      console.error(`[generateTextEmbeddingFlow] - Error generating embedding for text (length: ${text.length}) using model ${modelToUse}:`, error);
      throw new Error(`Failed to generate text embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

