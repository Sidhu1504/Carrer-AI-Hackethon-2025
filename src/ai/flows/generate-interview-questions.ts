'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating interview questions based on a selected profession.
 *
 * generateInterviewQuestions - A function that takes a profession as input and returns five profession-specific interview questions.
 * GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionsInputSchema = z.object({
  profession: z.string().describe('The profession to generate interview questions for.'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const InterviewQuestionSchema = z.object({
    question: z.string().describe('The interview question.'),
    category: z.string().describe('The category of the question (e.g., Conceptual, Behavioral, System Design).'),
    difficulty: z.enum(['Basic', 'Intermediate', 'Advanced']).describe('The difficulty of the question.')
});

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(InterviewQuestionSchema).describe('An array of 15-25 interview questions of varying difficulty and category.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
  return generateInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an expert hiring manager for the tech industry. Generate a list of 15 realistic interview questions for the following profession: {{{profession}}}.

The questions should cover a range of categories including Conceptual, Scenario-based, Troubleshooting, System Design, and Behavioral (STAR format).

The difficulty should be distributed as follows:
- 30% Basic
- 40% Intermediate
- 30% Advanced

Return the questions in the specified JSON format.
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
