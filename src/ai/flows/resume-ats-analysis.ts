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
    .describe('Actionable suggestions for improving the resume to better match ATS requirements, focusing on keywords, formatting, and clarity.'),
});
export type AnalyzeResumeAtsOutput = z.infer<typeof AnalyzeResumeAtsOutputSchema>;

export async function analyzeResumeAts(input: AnalyzeResumeAtsInput): Promise<AnalyzeResumeAtsOutput> {
  return analyzeResumeAtsFlow(input);
}

const analyzeResumeAtsPrompt = ai.definePrompt({
  name: 'analyzeResumeAtsPrompt',
  input: {schema: AnalyzeResumeAtsInputSchema},
  output: {schema: AnalyzeResumeAtsOutputSchema},
  prompt: `You are an expert resume analyst specializing in modern Applicant Tracking Systems (ATS). Your task is to evaluate the provided resume text, calculate an ATS compatibility score from 0 to 100, and provide specific, actionable improvement suggestions.

Analyze the following aspects:
1.  **Keyword Optimization**: Does the resume use relevant keywords for common job descriptions in the tech industry?
2.  **Formatting**: Is the layout clean, simple, and easily parsable? Avoid complex tables, columns, or graphics.
3.  **Clarity and Conciseness**: Is the language clear and are accomplishments quantified?

Resume Data:
{{{resumeData}}}

Based on your analysis, provide a precise ATS Score and a bulleted list of improvement suggestions.`,
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
