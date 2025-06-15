import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

export function configureGenkit() {
  console.log('Genkit AI configured with Google AI plugin');
  return ai;
}
