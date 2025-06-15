
import { config } from 'dotenv';
config();

// Make sure to import all Genkit flows here
import '@/ai/flows/job-recommendation-engine.ts'; 
import '@/ai/flows/resume-skill-extractor.ts';
import '@/ai/flows/video-interview-analysis.ts';
import '@/ai/flows/job-description-generator.ts';
import '@/ai/flows/candidate-job-matcher.ts';
import '@/ai/flows/ai-talent-search-flow.ts';
import '@/ai/flows/live-interview-flow.ts';
import '@/ai/flows/process-resume-document-ai-flow.ts';
import '@/ai/flows/generate-text-embedding-flow.ts';
import '@/ai/flows/ai-talent-semantic-search-flow.ts'; // Added semantic talent search
import '@/ai/flows/job-recommendation-semantic-flow.ts'; // Added semantic job recommendation
import '@/ai/flows/generate-resume-summary-flow.ts'; // Added resume summary generation


