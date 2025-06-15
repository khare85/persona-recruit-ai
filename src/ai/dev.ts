
import { config } from 'dotenv';
config();

// Make sure to import all Genkit flows here
import '@/ai/flows/job-recommendation-engine.ts'; 
import '@/ai/flows/resume-skill-extractor.ts';
import '@/ai/flows/video-interview-analysis.ts';
import '@/ai/flows/job-description-generator.ts';
import '@/ai/flows/candidate-job-matcher.ts';
import '@/ai/flows/ai-talent-search-flow.ts'; // Added


