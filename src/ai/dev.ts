import { config } from 'dotenv';
config();

import '@/ai/flows/skill-gap-identification.ts';
import '@/ai/flows/resume-ats-analysis.ts';
import '@/ai/flows/generate-interview-questions.ts';
import '@/ai/flows/mock-interview-feedback.ts';
