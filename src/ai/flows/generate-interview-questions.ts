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
  profession: z.string().describe('The profession to generate interview questions for (e.g., "Software Engineer", "DevOps Engineer").'),
  resumeText: z.string().optional().describe('The text of the user\'s resume. If provided, questions should be tailored to the skills and experience found in the resume.'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const InterviewQuestionSchema = z.object({
    question: z.string().describe('The interview question.'),
    category: z.string().describe('The category of the question (e.g., "Conceptual", "Scenario-based", "Troubleshooting", "System Design", "Behavioral").'),
    difficulty: z.enum(['Basic', 'Intermediate', 'Advanced']).describe('The difficulty of the question.')
});

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(InterviewQuestionSchema).describe('An array of 15-25 realistic, industry-level interview questions of varying difficulty and category.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an expert hiring manager and technical interviewer for the tech industry. Your task is to generate a list of 15 realistic interview questions for the following profession: {{{profession}}}.

The questions must be representative of what a real candidate would face in a modern tech interview.

{{#if resumeText}}
The questions should be tailored to the candidate's experience and skills as detailed in their resume below. Infer their years of experience and seniority from the resume.
---
RESUME:
{{{resumeText}}}
---
{{/if}}

The set of questions must cover a range of categories, including:
- Conceptual (e.g., "Explain the difference between TCP and UDP.")
- Scenario-based (e.g., "A web application is experiencing high latency. How would you investigate?")
- Troubleshooting (e.g., "A Kubernetes pod is stuck in a CrashLoopBackOff state. What are your first steps?")
- System Design (e.g., "Design a URL shortening service like TinyURL.")
- Behavioral (using the STAR format) (e.g., "Tell me about a time you had a disagreement with a team member and how you resolved it.")

The difficulty of the questions should be distributed as follows:
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

export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
  return generateInterviewQuestionsFlow(input);
}
