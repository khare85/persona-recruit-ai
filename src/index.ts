// AI Talent Stream Backend Entry Point
import { configureGenkit } from './ai/genkit';
import './config/firebase';

// Configure Genkit AI framework
configureGenkit();

console.log('AI Talent Stream Backend initialized');
console.log('Available AI flows:');
console.log('- Talent Search Flow');
console.log('- Resume Processing Flow');
console.log('- Job Matching Flow');
console.log('- Interview Analysis Flow');
console.log('- Document AI Processing Flow');

// Basic export for now - individual flow exports can be added as needed
export { configureGenkit } from './ai/genkit';