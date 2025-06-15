
'use server';
/**
 * @fileOverview Processes a resume file using Google Cloud Document AI to extract text.
 * - processResumeWithDocAI - Function to call Document AI for resume parsing.
 * - ProcessResumeDocAIInput - Input type for the processResumeWithDocAI function.
 * - ProcessResumeDocAIOutput - Return type for the processResumeWithDocAI function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'; // Using v1 from root import

// User needs to configure these, e.g., via environment variables in .env file
// Ensure these are also set in your hosting environment (e.g., App Hosting secrets)
const GCLOUD_PROJECT_ID = process.env.GCLOUD_PROJECT_ID;
const DOCAI_LOCATION = process.env.DOCAI_LOCATION; // e.g., 'us' or 'eu'
const DOCAI_PROCESSOR_ID = process.env.DOCAI_PROCESSOR_ID; // The ID of your Document AI processor

const ProcessResumeDocAIInputSchema = z.object({
  resumeFileBase64: z.string().describe("The base64 encoded string of the resume file (content only, no data: prefix)."),
  mimeType: z.string().describe("The MIME type of the resume file (e.g., application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document)."),
});
export type ProcessResumeDocAIInput = z.infer<typeof ProcessResumeDocAIInputSchema>;

const ProcessResumeDocAIOutputSchema = z.object({
  extractedText: z.string().describe("The plain text extracted from the resume by Document AI."),
});
export type ProcessResumeDocAIOutput = z.infer<typeof ProcessResumeDocAIOutputSchema>;

export async function processResumeWithDocAI(input: ProcessResumeDocAIInput): Promise<ProcessResumeDocAIOutput> {
  return processResumeDocAIFlow(input);
}

const processResumeDocAIFlow = ai.defineFlow(
  {
    name: 'processResumeDocAIFlow',
    inputSchema: ProcessResumeDocAIInputSchema,
    outputSchema: ProcessResumeDocAIOutputSchema,
  },
  async ({ resumeFileBase64, mimeType }): Promise<ProcessResumeDocAIOutput> => {
    if (!GCLOUD_PROJECT_ID || !DOCAI_LOCATION || !DOCAI_PROCESSOR_ID) {
      const missingVars = [
        !GCLOUD_PROJECT_ID ? "GCLOUD_PROJECT_ID" : null,
        !DOCAI_LOCATION ? "DOCAI_LOCATION" : null,
        !DOCAI_PROCESSOR_ID ? "DOCAI_PROCESSOR_ID" : null
      ].filter(Boolean).join(', ');

      console.error(`Document AI environment variables are not configured: ${missingVars}. Please set them in your .env file and hosting environment.`);
      throw new Error(`Document AI service is not configured on the server. Missing: ${missingVars}`);
    }

    const client = new DocumentProcessorServiceClient();
    const name = `projects/${GCLOUD_PROJECT_ID}/locations/${DOCAI_LOCATION}/processors/${DOCAI_PROCESSOR_ID}`;

    const request = {
      name,
      rawDocument: {
        content: resumeFileBase64,
        mimeType,
      },
      // processOptions: {
      //   // For a resume processor, you might want to specify if it has versions or other specific options
      //   // e.g., individualPageSelector or specific layout revisions if applicable.
      //   // For the standard Resume Parser, often no specific processOptions are needed beyond the rawDocument.
      //   // fromLayout: {
      //   //   // If using a layout based processor
      //   // }
      // }
      // skipHumanReview: true, // Set to true to bypass Human-in-the-Loop (HITL)
    };

    try {
      console.log(`Sending request to Document AI for processor: ${name} with mimeType: ${mimeType}`);
      const [result] = await client.processDocument(request);
      const { document } = result;

      if (!document || !document.text) {
        console.warn('Document AI processed the document, but no text was extracted. Full result:', JSON.stringify(result, null, 2));
        throw new Error('Document AI processed the document, but no text was extracted.');
      }
      console.log(`Document AI successfully extracted text. Length: ${document.text.length}`);
      return { extractedText: document.text };
    } catch (error) {
      console.error('Error processing document with Document AI:', error);
      // Log more detailed error if available
      if (error instanceof Error && 'details' in error) {
        console.error('Document AI Error Details:', (error as any).details);
      }
      throw new Error(`Failed to process resume with Document AI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
