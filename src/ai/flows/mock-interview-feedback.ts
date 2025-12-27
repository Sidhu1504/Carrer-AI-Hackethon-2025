'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing feedback on mock interview answers.
 *
 * It includes:
 * - mockInterviewFeedback: A function to get AI-driven feedback and scoring on a mock interview answer.
 * - MockInterviewFeedbackInput: The input type for the mockInterviewFeedback function.
 * - MockInterviewFeedbackOutput: The output type for the mockInterviewFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MockInterviewFeedbackInputSchema = z.object({
  profession: z.string().describe('The profession for which the interview is being conducted.'),
  question: z.string().describe('The interview question asked.'),
  answer: z.string().describe('The candidate\'s answer to the interview question.'),
});
export type MockInterviewFeedbackInput = z.infer<typeof MockInterviewFeedbackInputSchema>;

const MockInterviewFeedbackOutputSchema = z.object({
  feedback: z.string().describe('AI-driven feedback on the answer.'),
  score: z.number().describe('A numerical score representing the quality of the answer.'),
});
export type MockInterviewFeedbackOutput = z.infer<typeof MockInterviewFeedbackOutputSchema>;

export async function mockInterviewFeedback(input: MockInterviewFeedbackInput): Promise<MockInterviewFeedbackOutput> {
  return mockInterviewFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mockInterviewFeedbackPrompt',
  input: {schema: MockInterviewFeedbackInputSchema},
  output: {schema: MockInterviewFeedbackOutputSchema},
  prompt: `You are an AI-powered interview coach providing feedback on mock interview answers.

  Profession: {{profession}}
  Question: {{question}}
  Answer: {{answer}}

  Provide constructive feedback on the answer, including areas for improvement and a score (out of 10) reflecting the quality of the response.
  The score should be an integer from 1 to 10.
  Ensure that the output is a valid JSON conforming to the specified JSON schema.
  Here is the output schema:
  {{outputSchema}}`,
});

const mockInterviewFeedbackFlow = ai.defineFlow(
  {
    name: 'mockInterviewFeedbackFlow',
    inputSchema: MockInterviewFeedbackInputSchema,
    outputSchema: MockInterviewFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
