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
  feedback: z.string().describe('Detailed, constructive feedback on the answer, highlighting strengths and areas for improvement. The feedback should be in Markdown format.'),
  score: z.number().int().min(1).max(10).describe('A numerical score from 1 to 10 representing the quality of the answer, considering technical accuracy, depth, and clarity.'),
});
export type MockInterviewFeedbackOutput = z.infer<typeof MockInterviewFeedbackOutputSchema>;

export async function mockInterviewFeedback(input: MockInterviewFeedbackInput): Promise<MockInterviewFeedbackOutput> {
  return mockInterviewFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mockInterviewFeedbackPrompt',
  input: {schema: MockInterviewFeedbackInputSchema},
  output: {schema: MockInterviewFeedbackOutputSchema},
  prompt: `You are an AI-powered interview coach, acting as an expert hiring manager for the specified profession. Your task is to provide detailed, constructive feedback on a candidate's answer.

  **Profession:** {{profession}}
  **Question:** "{{question}}"
  **Candidate's Answer:** "{{answer}}"

  **Evaluation Criteria:**
  1.  **Technical Accuracy:** Is the answer factually correct?
  2.  **Depth of Knowledge:** Does the answer demonstrate a deep understanding of the topic?
  3.  **Clarity and Structure:** Is the answer well-structured and easy to understand?
  4.  **Real-world Relevance:** Does the candidate connect the concept to practical applications or experiences?

  **Your Task:**
  1.  Provide high-quality, constructive feedback in Markdown format. Start with what the candidate did well, then move to specific areas for improvement.
  2.  Assign an integer score from 1 (poor) to 10 (excellent) based on the evaluation criteria.

  Return the feedback and score in the specified JSON format.
  `,
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
