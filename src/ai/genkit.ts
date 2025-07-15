import {genkit} from 'genkit';
import {googleAI, gemini15Flash} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

// Export the model for use in services
export { gemini15Flash };

export function configureGenkit() {
  // Genkit AI configured with Google AI plugin
  return ai;
}
