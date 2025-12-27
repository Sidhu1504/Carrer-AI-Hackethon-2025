'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a resume and providing an ATS score and improvement suggestions.
 *
 * - analyzeResumeAts - A function that takes resume data and returns an ATS score and improvement suggestions.
 * - AnalyzeResumeAtsInput - The input type for the analyzeResumeAts function.
 * - AnalyzeResumeAtsOutput - The return type for the analyzeResumeAts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResumeAtsInputSchema = z.object({
  resumeData: z
    .string()
    .describe(
      'The resume data as a string, either plain text or PDF content extracted as text.'
    ),
});
export type AnalyzeResumeAtsInput = z.infer<typeof AnalyzeResumeAtsInputSchema>;

const AnalyzeResumeAtsOutputSchema = z.object({
  atsScore: z.number().describe('The ATS score of the resume (0-100).'),
  improvementSuggestions: z
    .string()
    .describe('Suggestions for improving the resume to better match ATS requirements.'),
});
export type AnalyzeResumeAtsOutput = z.infer<typeof AnalyzeResumeAtsOutputSchema>;

export async function analyzeResumeAts(input: AnalyzeResumeAtsInput): Promise<AnalyzeResumeAtsOutput> {
  return analyzeResumeAtsFlow(input);
}

const analyzeResumeAtsPrompt = ai.definePrompt({
  name: 'analyzeResumeAtsPrompt',
  input: {schema: AnalyzeResumeAtsInputSchema},
  output: {schema: AnalyzeResumeAtsOutputSchema},
  prompt: `You are an expert resume analyst specializing in Applicant Tracking Systems (ATS). Evaluate the provided resume and provide an ATS score (0-100) and improvement suggestions.

Resume Data: {{{resumeData}}}

ATS Score (0-100): 
Improvement Suggestions:`, // Ensure the prompt asks for both score and suggestions
});

const analyzeResumeAtsFlow = ai.defineFlow(
  {
    name: 'analyzeResumeAtsFlow',
    inputSchema: AnalyzeResumeAtsInputSchema,
    outputSchema: AnalyzeResumeAtsOutputSchema,
  },
  async input => {
    const {output} = await analyzeResumeAtsPrompt(input);
    return output!;
  }
);
