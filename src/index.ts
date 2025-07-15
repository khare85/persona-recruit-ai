// AI Talent Stream Backend Entry Point
import { configureGenkit } from './ai/genkit';
import './config/firebase';

// Configure Genkit AI framework
configureGenkit();

// AI Talent Stream Backend initialized with flows

// Basic export for now - individual flow exports can be added as needed
export { configureGenkit } from './ai/genkit';