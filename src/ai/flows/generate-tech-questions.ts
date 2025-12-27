'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating technology-specific questions.
 *
 * - generateTechQuestions - A function to generate theory questions or practical tasks for given technologies.
 * - GenerateTechQuestionsInput - The input type for the generateTechQuestions function.
 * - GenerateTechQuestionsOutput - The return type for the generateTechQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTechQuestionsInputSchema = z.object({
  technologies: z.array(z.string()).describe('A list of technologies to generate questions for (e.g., ["React", "Docker"]).'),
  questionType: z.enum(['theory', 'practical']).describe('The type of questions to generate: "theory" for conceptual questions or "practical" for hands-on tasks.'),
});
type GenerateTechQuestionsInput = z.infer<typeof GenerateTechQuestionsInputSchema>;

const QuestionSchema = z.object({
  question: z.string().describe('The theoretical question or the title of the practical task.'),
  details: z.string().describe('For theory, a brief explanation of what the question is targeting. For practical, a detailed step-by-step guide to implement the task. Formatted as Markdown.'),
});

const GenerateTechQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('An array of 5-7 generated questions or tasks.'),
});
type GenerateTechQuestionsOutput = z.infer<typeof GenerateTechQuestionsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateTechQuestionsPrompt',
  input: {schema: GenerateTechQuestionsInputSchema},
  output: {schema: GenerateTechQuestionsOutputSchema},
  prompt: `You are a senior technical interviewer and expert engineer. Your task is to generate 5-7 insightful and commonly asked interview questions about the following technologies: {{technologies}}.

The user wants '{{questionType}}' questions.

If the user wants 'theory' questions:
- The questions should be conceptual and test a deep understanding of the technology, reflecting real-world interview scenarios.
- Cover a range of topics from beginner to advanced.
- For each question, provide a brief "details" section in Markdown explaining the key concepts the candidate is expected to know.

If the user wants 'practical' questions:
- The tasks should be realistic, small-scale projects or coding challenges that are frequently given in interviews.
- The "question" should be the task title (e.g., "Build a Simple To-Do List App").
- The "details" section MUST be a detailed, step-by-step implementation guide for completing the task, formatted in Markdown. Include code snippets where appropriate.

Generate the questions in the specified JSON format based on the requested question type.
`,
});

const generateTechQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTechQuestionsFlow',
    inputSchema: GenerateTechQuestionsInputSchema,
    outputSchema: GenerateTechQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateTechQuestions(input: GenerateTechQuestionsInput): Promise<GenerateTechQuestionsOutput> {
  return generateTechQuestionsFlow(input);
}
