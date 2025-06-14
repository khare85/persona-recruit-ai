import { config } from 'dotenv';
config();

import '@/ai/flows/job-recommendation-engine.ts';
import '@/ai/flows/resume-skill-extractor.ts';
import '@/ai/flows/video-interview-analysis.ts';
import '@/ai/flows/job-description-generator.ts';
import '@/ai/flows/candidate-job-matcher.ts';